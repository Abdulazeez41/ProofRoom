import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { saveEncryptedBlob, getEncryptedBlob } from "@/lib/storage";
import { computeSha256 } from "@/lib/crypto/hashing";

export async function POST(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;

    const document = await prisma.document.findFirst({
      where: { OR: [{ id: documentId }, { opaqueDocumentId: documentId }] },
      include: { room: { include: { owner: true } } },
    });

    if (!document) {
      return NextResponse.json({ error: "Document record not found" }, { status: 404 });
    }

    // Read ciphertext bytes from request body
    const arrayBuffer = await req.arrayBuffer();
    const ciphertext = new Uint8Array(arrayBuffer);

    if (ciphertext.byteLength === 0) {
      return NextResponse.json({ error: "Empty ciphertext payload" }, { status: 400 });
    }

    // Verify hash integrity
    const computedHash = computeSha256(ciphertext);
    if (computedHash !== document.ciphertextHash) {
      return NextResponse.json(
        { error: "Ciphertext hash mismatch. Payload rejected." },
        { status: 400 }
      );
    }

    // Persist ciphertext in storage enclave
    const result = await saveEncryptedBlob(document.encryptedStorageKey, ciphertext);

    // Update size in database
    await prisma.document.update({
      where: { id: document.id },
      data: { encryptedSize: result.byteSize },
    });

    return NextResponse.json({
      success: true,
      storageKey: result.storageKey,
      byteSize: result.byteSize,
      ciphertextHash: computedHash,
    });
  } catch (err) {
    console.error("Upload encrypted blob error:", err);
    return NextResponse.json({ error: "Failed to upload encrypted blob" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId")?.toLowerCase();

    const document = await prisma.document.findFirst({
      where: { OR: [{ id: documentId }, { opaqueDocumentId: documentId }] },
      include: {
        room: {
          include: {
            owner: true,
            participants: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check authorization: must be owner or active participant
    if (accountId) {
      const isOwner = document.room.owner.nearAccountId === accountId;
      const participant = document.room.participants.find(
        (p) => p.participantNearAccount === accountId
      );
      const isParticipantActive = participant && participant.permissionStatus === "ACTIVE";

      if (!isOwner && !isParticipantActive) {
        return NextResponse.json(
          { error: "Unauthorized: You do not have active access permissions to this document" },
          { status: 403 }
        );
      }
    }

    const ciphertext = await getEncryptedBlob(document.encryptedStorageKey);
    if (!ciphertext) {
      return NextResponse.json({ error: "Encrypted blob not found in storage" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(ciphertext), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.opaqueDocumentId}.enc"`,
        "X-Ciphertext-Hash": document.ciphertextHash,
        "X-Encryption-Algorithm": document.encryptionAlgorithm,
      },
    });
  } catch (err) {
    console.error("Download encrypted blob error:", err);
    return NextResponse.json({ error: "Failed to download encrypted blob" }, { status: 500 });
  }
}
