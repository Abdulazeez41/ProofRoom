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
      where: { OR: [{ id: documentId }, { opaqueDocumentId: documentId }, { name: documentId }] },
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

export async function POST(
  req: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const { documentId } = params;
    const body = await req.json();
    const {
      senderAccountId,
      recipientAccountId,
      envelope,
      envelopes, // optional batch: array of { recipientAccountId, envelope }
    } = body;

    const lowerSender = senderAccountId?.toLowerCase();
    if (!lowerSender) {
      return NextResponse.json({ error: "senderAccountId is required" }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { OR: [{ id: documentId }, { opaqueDocumentId: documentId }, { name: documentId }] },
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

    // Sender must be room owner or active participant
    const isOwner = document.room.owner.nearAccountId === lowerSender;
    const senderParticipant = document.room.participants.find(
      (p) => p.participantNearAccount === lowerSender && p.permissionStatus === "ACTIVE"
    );

    if (!isOwner && !senderParticipant) {
      return NextResponse.json(
        { error: "Access Denied: Only authorized room members can provision key envelopes" },
        { status: 403 }
      );
    }

    // Collect list of items to process: either single or batch
    const itemsToProcess: Array<{ recipientAccountId: string; envelope: unknown }> = [];
    if (Array.isArray(envelopes)) {
      itemsToProcess.push(...envelopes);
    } else if (recipientAccountId && envelope) {
      itemsToProcess.push({ recipientAccountId, envelope });
    } else {
      return NextResponse.json(
        { error: "recipientAccountId and envelope (or envelopes array) are required" },
        { status: 400 }
      );
    }

    const savedEnvelopes = [];

    for (const item of itemsToProcess) {
      const lowerRecipient = item.recipientAccountId?.toLowerCase();
      if (!lowerRecipient || !item.envelope) continue;

      // Verify recipient is owner or active participant in the room
      const isRecipientOwner = document.room.owner.nearAccountId === lowerRecipient;
      const recipientParticipant = document.room.participants.find(
        (p) => p.participantNearAccount === lowerRecipient && p.permissionStatus === "ACTIVE"
      );

      if (!isRecipientOwner && !recipientParticipant) {
        continue; // Skip unauthorized recipients
      }

      const recipientUser = await prisma.user.upsert({
        where: { nearAccountId: lowerRecipient },
        update: {},
        create: { nearAccountId: lowerRecipient },
      });

      const envelopeStr =
        typeof item.envelope === "string" ? item.envelope : JSON.stringify(item.envelope);

      const existingEnvelope = await prisma.documentKeyEnvelope.findFirst({
        where: {
          documentId: document.id,
          recipientUserId: recipientUser.id,
        },
      });

      let saved;
      if (existingEnvelope) {
        saved = await prisma.documentKeyEnvelope.update({
          where: { id: existingEnvelope.id },
          data: {
            encryptedKeyEnvelope: envelopeStr,
            recipientKeyVersion: 1,
            revokedAt: null,
          },
        });
      } else {
        saved = await prisma.documentKeyEnvelope.create({
          data: {
            documentId: document.id,
            recipientUserId: recipientUser.id,
            encryptedKeyEnvelope: envelopeStr,
            recipientKeyVersion: 1,
          },
        });
      }

      savedEnvelopes.push({
        recipientAccountId: lowerRecipient,
        envelopeId: saved.id,
      });
    }

    return NextResponse.json({
      success: true,
      documentId: document.opaqueDocumentId,
      envelopesProvisioned: savedEnvelopes.length,
      savedEnvelopes,
    });
  } catch (err) {
    console.error("Provision key envelope error:", err);
    return NextResponse.json({ error: "Failed to provision key envelope" }, { status: 500 });
  }
}
