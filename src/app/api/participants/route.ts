import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { computeParticipantCommitment, computePermissionCommitment } from "@/lib/crypto/hashing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, participantAccountId, role, expiresAt, ownerAccountId } = body;

    if (!roomId || !participantAccountId) {
      return NextResponse.json({ error: "roomId and participantAccountId are required" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { OR: [{ id: roomId }, { opaqueRoomId: roomId }] },
      include: { owner: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Verify owner authorization
    if (ownerAccountId && room.owner.nearAccountId !== ownerAccountId.toLowerCase()) {
      return NextResponse.json({ error: "Only the room owner can invite participants" }, { status: 403 });
    }

    const lowerParticipant = participantAccountId.toLowerCase();

    // Ensure participant user exists
    const participantUser = await prisma.user.upsert({
      where: { nearAccountId: lowerParticipant },
      update: {},
      create: { nearAccountId: lowerParticipant },
    });

    // Compute commitments
    const participantCommitment = computeParticipantCommitment(lowerParticipant, room.opaqueRoomId);
    const expiryTimestamp = expiresAt ? new Date(expiresAt).getTime() : null;
    const permissionCommitment = computePermissionCommitment(
      participantCommitment,
      role || "Investor",
      expiryTimestamp
    );

    const participant = await prisma.roomParticipant.upsert({
      where: {
        roomId_participantNearAccount: {
          roomId: room.id,
          participantNearAccount: lowerParticipant,
        },
      },
      update: {
        participantUserId: participantUser.id,
        permissionStatus: "ACTIVE",
        permissionCommitment,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        revokedAt: null,
      },
      create: {
        roomId: room.id,
        participantUserId: participantUser.id,
        participantNearAccount: lowerParticipant,
        permissionStatus: "ACTIVE",
        permissionCommitment,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({
      success: true,
      participant,
      commitments: {
        participantCommitment,
        permissionCommitment,
      },
    });
  } catch (err) {
    console.error("Invite participant error:", err);
    return NextResponse.json({ error: "Failed to invite participant" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomId, participantAccountId, action, ownerAccountId } = body;

    if (!roomId || !participantAccountId || !action) {
      return NextResponse.json({ error: "roomId, participantAccountId, and action are required" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { OR: [{ id: roomId }, { opaqueRoomId: roomId }] },
      include: { owner: true },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    if (ownerAccountId && room.owner.nearAccountId !== ownerAccountId.toLowerCase()) {
      return NextResponse.json({ error: "Only room owner can alter participant permissions" }, { status: 403 });
    }

    const lowerParticipant = participantAccountId.toLowerCase();

    if (action === "REVOKE") {
      const updated = await prisma.roomParticipant.update({
        where: {
          roomId_participantNearAccount: {
            roomId: room.id,
            participantNearAccount: lowerParticipant,
          },
        },
        data: {
          permissionStatus: "REVOKED",
          revokedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Participant access revoked. Future key distributions and downloads blocked.",
        participant: updated,
      });
    }

    if (action === "ACTIVATE") {
      const updated = await prisma.roomParticipant.update({
        where: {
          roomId_participantNearAccount: {
            roomId: room.id,
            participantNearAccount: lowerParticipant,
          },
        },
        data: {
          permissionStatus: "ACTIVE",
          revokedAt: null,
        },
      });

      return NextResponse.json({
        success: true,
        participant: updated,
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    console.error("Update participant error:", err);
    return NextResponse.json({ error: "Failed to update participant" }, { status: 500 });
  }
}
