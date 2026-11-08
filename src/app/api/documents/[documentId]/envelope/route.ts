import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId")?.toLowerCase();

    if (!accountId) {
      return NextResponse.json({ error: "accountId query parameter is required" }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { OR: [{ id: documentId }, { opaqueDocumentId: documentId }] },
      include: {
        room: {
          include: {
            owner: true,
            participants: true,
          },
        },
        keyEnvelopes: {
          include: {
            recipient: true,
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify participant authorization & revocation status
    const isOwner = document.room.owner.nearAccountId === accountId;
    const participant = document.room.participants.find(
      (p) => p.participantNearAccount === accountId
    );

    if (!isOwner) {
      if (!participant || participant.permissionStatus !== "ACTIVE") {
        return NextResponse.json(
          {
            error: "Access Denied: Participant permission has been revoked or expired.",
            revoked: Boolean(participant?.revokedAt),
          },
          { status: 403 }
        );
      }
    }

    // Find key envelope for this recipient user
    const envelope = document.keyEnvelopes.find(
      (env) => env.recipient.nearAccountId === accountId
    );

    if (!envelope) {
      return NextResponse.json(
        { error: "Key envelope not found for requested participant." },
        { status: 404 }
      );
    }

    let parsedEnvelope: Record<string, unknown>;
    try {
      parsedEnvelope = JSON.parse(envelope.encryptedKeyEnvelope);
    } catch {
      parsedEnvelope = { raw: envelope.encryptedKeyEnvelope };
    }

    return NextResponse.json({
      success: true,
      envelope: parsedEnvelope,
      documentId: document.opaqueDocumentId,
      ciphertextHash: document.ciphertextHash,
    });
  } catch (err) {
    console.error("Fetch key envelope error:", err);
    return NextResponse.json({ error: "Failed to fetch key envelope" }, { status: 500 });
  }
}
