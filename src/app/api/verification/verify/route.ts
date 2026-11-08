import { NextRequest, NextResponse } from "next/server";
import { verifyTdxAttestation, AttestationEvidence } from "@/lib/near-ai/attestation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { evidence, expectedNonce, injectFailure } = body;

    if (!evidence || !expectedNonce) {
      return NextResponse.json(
        { error: "Attestation evidence and expectedNonce are required" },
        { status: 400 }
      );
    }

    const report = verifyTdxAttestation(
      evidence as AttestationEvidence,
      expectedNonce,
      { injectFailure }
    );

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err) {
    console.error("Verification endpoint error:", err);
    return NextResponse.json({ error: "Verification analysis failed" }, { status: 500 });
  }
}
