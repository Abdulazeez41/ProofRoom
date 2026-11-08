"use client";

import React from "react";
import {
  ShieldCheck,
  Cpu,
  Lock,
  KeyRound,
  ExternalLink,
  Activity,
} from "lucide-react";
import { SecurityBadge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { TdxVerificationCard } from "@/components/security/TdxVerificationCard";
import { NEAR_CONFIG, getExplorerAccountUrl } from "@/lib/near/config";
import { useWallet } from "@/context/WalletContext";

export default function AppSecurityCenterPage() {
  const { accountId, userKeyPair } = useWallet();

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Security center</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Real-time cryptographic audit, Intel TDX attestation reports, and on-chain verification
            history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SecurityBadge status="VERIFIED" label="Fail-closed enforced" />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Key Management */}
        <GlassCard radius="2xl" className="p-5 border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-accent" aria-hidden="true" />
              <span>Client key management</span>
            </span>
            <SecurityBadge status="VERIFIED" label="Active" />
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            User X25519 public key is bound to NEAR account identity via signed NEP-413 challenges.
            Private keys remain strictly in browser memory.
          </p>
          <div className="p-2.5 rounded-xl glass font-mono text-[10px] text-muted space-y-1">
            <div className="truncate">Account: {accountId || "founder.testnet"}</div>
            <div className="truncate">
              Public Key: {userKeyPair?.publicKeyHex || "Derived on connect"}
            </div>
          </div>
        </GlassCard>

        {/* Card 2: Document Storage Privacy */}
        <GlassCard radius="2xl" className="p-5 border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-ok" aria-hidden="true" />
              <span>Document encryption</span>
            </span>
            <span className="text-[10px] font-mono text-ok font-semibold bg-ok/10 px-1.5 py-0.5 rounded border border-ok/20">
              AES-256-GCM
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            All stored document blobs are encrypted with unique random DEKs. The platform backend
            and cloud storage operator have zero read capability.
          </p>
          <div className="p-2.5 rounded-xl glass font-mono text-[10px] text-muted space-y-1">
            <div>Integrity Tag: 128-bit Poly1305/GCM</div>
            <div>Key Distribution: X25519 Envelopes</div>
          </div>
        </GlassCard>

        {/* Card 3: Blockchain Audit Ledger */}
        <GlassCard radius="2xl" className="p-5 border-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-info" aria-hidden="true" />
              <span>NEAR Testnet anchoring</span>
            </span>
            <span className="text-[10px] font-mono text-info font-semibold bg-info/10 px-1.5 py-0.5 rounded border border-info/20">
              On-chain
            </span>
          </div>
          <p className="text-[11px] text-muted leading-relaxed">
            Immutable commitments prove room creation, document registration, and participant
            status without publishing plaintext metadata.
          </p>
          <div className="p-2.5 rounded-xl glass font-mono text-[10px] text-muted space-y-1 truncate">
            <div>Contract: {NEAR_CONFIG.contractId}</div>
            <a
              href={getExplorerAccountUrl(NEAR_CONFIG.contractId)}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:underline inline-flex items-center gap-1"
            >
              <span>Contract explorer</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          </div>
        </GlassCard>
      </div>

      {/* Live Attestation Card with Fail-Closed Test Harness */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink flex items-center gap-2">
            <Cpu className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Live Intel TDX attestation verification</span>
          </h2>
          <span className="text-xs text-muted font-mono">NEAR AI Cloud / Intel TDX</span>
        </div>
        <TdxVerificationCard />
      </div>
    </div>
  );
}
