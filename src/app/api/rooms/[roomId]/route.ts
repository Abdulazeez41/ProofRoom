import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params;
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId")?.toLowerCase();

    const room = await prisma.room.findFirst({
      where: {
        OR: [{ id: roomId }, { opaqueRoomId: roomId }],
      },
      include: {
        owner: {
          select: { id: true, nearAccountId: true, encryptionPublicKey: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, nearAccountId: true, encryptionPublicKey: true },
            },
          },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            opaqueDocumentId: true,
            name: true,
            category: true,
            encryptedSize: true,
            mimeType: true,
            ciphertextHash: true,
            version: true,
            encryptionAlgorithm: true,
            createdAt: true,
            keyEnvelopes: {
              select: {
                id: true,
                recipientUserId: true,
                recipient: {
                  select: {
                    id: true,
                    nearAccountId: true,
                  },
                },
              },
            },
          },
        },
        auditReceipts: {
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Determine caller role
    const isOwner = Boolean(accountId && room.owner.nearAccountId === accountId);
    const participant = accountId
      ? room.participants.find((p) => p.participantNearAccount === accountId)
      : null;

    const isAuthorized = isOwner || (participant && participant.permissionStatus === "ACTIVE");

    return NextResponse.json({
      success: true,
      room,
      viewer: {
        accountId: accountId || null,
        isOwner,
        isAuthorized: Boolean(isAuthorized),
        permissionStatus: isOwner ? "OWNER" : participant?.permissionStatus || "NONE",
      },
    });
  } catch (err) {
    console.error("Get room error:", err);
    return NextResponse.json({ error: "Failed to fetch room details" }, { status: 500 });
  }
}
