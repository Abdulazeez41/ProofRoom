import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      roomId,
      receiptHash,
      eventType,
      verificationStatus,
      modelId,
      requestHash,
      responseHash,
      transactionHash,
    } = body;

    if (!roomId || !receiptHash || !eventType) {
      return NextResponse.json({ error: "Missing required audit receipt parameters" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { OR: [{ id: roomId }, { opaqueRoomId: roomId }] },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const opaqueReceiptId = `rec-${uuidv4().substring(0, 13)}`;
    const receipt = await prisma.auditReceipt.create({
      data: {
        roomId: room.id,
        opaqueReceiptId,
        receiptHash,
        eventType,
        verificationStatus: verificationStatus || "VERIFIED",
        modelId: modelId || null,
        requestHash: requestHash || null,
        responseHash: responseHash || null,
        transactionHash: transactionHash || null,
      },
    });

    return NextResponse.json({
      success: true,
      receipt,
    });
  } catch (err) {
    console.error("Save audit receipt error:", err);
    return NextResponse.json({ error: "Failed to persist audit receipt" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "roomId query parameter is required" }, { status: 400 });
    }

    const room = await prisma.room.findFirst({
      where: { OR: [{ id: roomId }, { opaqueRoomId: roomId }] },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const receipts = await prisma.auditReceipt.findMany({
      where: { roomId: room.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      success: true,
      receipts,
    });
  } catch (err) {
    console.error("List audit receipts error:", err);
    return NextResponse.json({ error: "Failed to list receipts" }, { status: 500 });
  }
}
