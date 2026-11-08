import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createAuthChallenge } from "@/lib/crypto/wallet-binding";
import { NEAR_CONFIG } from "@/lib/near/config";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accountId } = body;

    if (!accountId || typeof accountId !== "string") {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const challenge = createAuthChallenge(accountId, NEAR_CONFIG.contractId);

    // Persist single-use challenge in DB with 5-minute expiry
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.walletChallenge.create({
      data: {
        nearAccountId: accountId.toLowerCase(),
        nonce: challenge.nonce,
        recipient: challenge.recipient,
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      challenge: {
        nonce: challenge.nonce,
        recipient: challenge.recipient,
        message: challenge.message,
        timestamp: challenge.timestamp,
      },
    });
  } catch (err) {
    console.error("Auth challenge error:", err);
    return NextResponse.json({ error: "Failed to create authentication challenge" }, { status: 500 });
  }
}
