import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      name,
      category,
      encryptedSize,
      mimeType,
      ciphertextHash,
      encryptionAlgorithm,
      ownerAccountId,
      keyEnvelopes, // array of { recipientAccountId, envelopeJson }
    } = body;

    if (!roomId || !name || !ciphertextHash) {
      return NextResponse.json({ error: "Missing required document registration fields" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { OR: [{ id: roomId }, { opaqueRoomId: roomId }] },
      include: { owner: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify room ownership
    if (ownerAccountId && room.owner.nearAccountId !== ownerAccountId.toLowerCase()) {
      return NextResponse.json({ error: "Only the room owner can register documents" }, { status: 403 });
    }

    const opaqueDocumentId = `doc-${uuidv4().substring(0, 13)}`;
    const encryptedStorageKey = `${room.opaqueRoomId}_${opaqueDocumentId}`;

    const document = await prisma.document.create({
      data: {
        roomId: room.id,
        opaqueDocumentId,
        name,
        category: category || "Financials",
        encryptedStorageKey,
        encryptedSize: encryptedSize || 0,
        mimeType: mimeType || "application/pdf",
        ciphertextHash,
        version: 1,
        encryptionAlgorithm: encryptionAlgorithm || "AES-256-GCM",
      },
    });

    // Save key envelopes for each recipient
    if (Array.isArray(keyEnvelopes)) {
      for (const envItem of keyEnvelopes) {
        if (!envItem.recipientAccountId || !envItem.envelope) continue;
        const recipientUser = await prisma.user.upsert({
          where: { nearAccountId: envItem.recipientAccountId.toLowerCase() },
          update: {},
          create: { nearAccountId: envItem.recipientAccountId.toLowerCase() },
        });

        await prisma.documentKeyEnvelope.create({
          data: {
            documentId: document.id,
            recipientUserId: recipientUser.id,
            encryptedKeyEnvelope: typeof envItem.envelope === "string" ? envItem.envelope : JSON.stringify(envItem.envelope),
            recipientKeyVersion: 1,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      document,
      uploadUrl: `/api/documents/${document.id}/blob`,
    });
  } catch (err) {
    console.error("Document registration error:", err);
    return NextResponse.json({ error: "Failed to register document" }, { status: 500 });
  }
}
