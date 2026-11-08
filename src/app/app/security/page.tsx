"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Cpu,
  Lock,
  KeyRound,
  FileCheck2,
  ExternalLink,
  RefreshCw,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { TdxVerificationCard } from "@/components/security/TdxVerificationCard";
import { NEAR_CONFIG, getExplorerAccountUrl } from "@/lib/near/config";
import { useWallet } from "@/context/WalletContext";

export default function AppSecurityCenterPage() {
  const { accountId, userKeyPair } = useWallet();

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Center</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Real-time cryptographic audit, Intel TDX attestation reports, and on-chain verification history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SecurityBadge status="VERIFIED" label="Fail-Closed Enforced" />
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Key Management */}
        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-primary" />
              Client Key Management
            </span>
            <SecurityBadge status="ACTIVE" showIcon={false} />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            User X25519 public key is bound to NEAR account identity via signed NEP-413 challenges. Private keys remain strictly in browser memory.
          </p>
          <div className="p-2.5 rounded-xl bg-foreground/5 font-mono text-[10px] text-muted-foreground space-y-1">
            <div className="truncate">Account: {accountId || "founder.testnet"}</div>
            <div className="truncate">Public Key: {userKeyPair?.publicKeyHex || "Derived on connect"}</div>
          </div>
        </div>

        {/* Card 2: Document Storage Privacy */}
        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-500" />
              Document Vault Encryption
            </span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
              AES-256-GCM
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All stored document blobs are encrypted with unique random DEKs. The platform backend and S3 storage operator have zero read capability.
          </p>
          <div className="p-2.5 rounded-xl bg-foreground/5 font-mono text-[10px] text-muted-foreground space-y-1">
            <div>Integrity Tag: 128-bit Poly1305/GCM</div>
            <div>Key Distribution: X25519 Envelopes</div>
          </div>
        </div>

        {/* Card 3: Blockchain Audit Ledger */}
        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-secondary" />
              NEAR Testnet Anchoring
            </span>
            <span className="text-[10px] font-mono text-secondary font-bold bg-secondary/10 px-2 py-0.5 rounded">
              On-Chain
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Immutable commitments prove room creation, document registration, and participant status without publishing plaintext metadata.
          </p>
          <div className="p-2.5 rounded-xl bg-foreground/5 font-mono text-[10px] text-muted-foreground space-y-1 truncate">
            <div>Contract: {NEAR_CONFIG.contractId}</div>
            <a
              href={getExplorerAccountUrl(NEAR_CONFIG.contractId)}
              target="_blank"
              rel="noreferrer"
              className="text-secondary hover:underline inline-flex items-center gap-1"
            >
              Contract Explorer <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Live Attestation Card with Fail-Closed Test Harness */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" />
            Live Intel TDX Attestation Verification
          </h2>
          <span className="text-xs text-muted-foreground font-mono">NEAR AI Cloud / Intel TDX</span>
        </div>
        <TdxVerificationCard />
      </div>
    </div>
  );
}
