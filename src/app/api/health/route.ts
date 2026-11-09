import { NextResponse } from "next/server";
import { NEAR_CONFIG } from "@/lib/near/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "ProofRoom",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      network: NEAR_CONFIG.networkId,
      contractId: NEAR_CONFIG.contractId,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

export async function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
