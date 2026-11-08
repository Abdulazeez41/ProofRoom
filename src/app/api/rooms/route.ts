import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { computeRoomCommitment, computeSha256 } from "@/lib/crypto/hashing";
import { v4 as uuidv4 } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId")?.toLowerCase();

    if (!accountId) {
      // Return public/active rooms summary
      const rooms = await prisma.room.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { documents: true, participants: true, auditReceipts: true },
          },
          owner: {
            select: { nearAccountId: true },
          },
        },
      });

      return NextResponse.json({ success: true, rooms });
    }

    // Find rooms owned by or shared with this user
    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { owner: { nearAccountId: accountId } },
          { participants: { some: { participantNearAccount: accountId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { documents: true, participants: true, auditReceipts: true },
        },
        owner: {
          select: { nearAccountId: true },
        },
        participants: {
          select: {
            participantNearAccount: true,
            permissionStatus: true,
            expiresAt: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, rooms });
  } catch (err) {
    console.error("List rooms error:", err);
    return NextResponse.json({ error: "Failed to list rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, companyName, description, purpose, ownerAccountId, expiresAt } = body;

    if (!name || !companyName || !ownerAccountId) {
      return NextResponse.json({ error: "name, companyName, and ownerAccountId are required" }, { status: 400 });
    }

    const lowerOwner = ownerAccountId.toLowerCase();

    // Ensure owner user exists
    const user = await prisma.user.upsert({
      where: { nearAccountId: lowerOwner },
      update: {},
      create: { nearAccountId: lowerOwner },
    });

    const opaqueRoomId = `room-${uuidv4().substring(0, 13)}`;
    const salt = uuidv4();
    const roomCommitment = computeRoomCommitment(opaqueRoomId, salt);
    const metadataCommitment = computeSha256(
      JSON.stringify({ name, companyName, purpose: purpose || "Fundraising", salt })
    );

    const room = await prisma.room.create({
      data: {
        opaqueRoomId,
        ownerUserId: user.id,
        name,
        companyName,
        description: description || null,
        purpose: purpose || "Fundraising",
        roomCommitment,
        metadataCommitment,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        owner: {
          select: { nearAccountId: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      room,
    });
  } catch (err) {
    console.error("Create room error:", err);
    return NextResponse.json({ error: "Failed to create confidential room" }, { status: 500 });
  }
}
