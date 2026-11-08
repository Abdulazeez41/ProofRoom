"use client";

import React, { useState } from "react";
import {
  Settings,
  KeyRound,
  Database,
  Globe,
  Copy,
  Check,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge, TestnetPill } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWallet } from "@/context/WalletContext";
import { NEAR_CONFIG } from "@/lib/near/config";

export default function SettingsPage() {
  const { accountId, userKeyPair, disconnectWallet } = useWallet();
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyKey = () => {
    if (userKeyPair?.publicKeyHex) {
      navigator.clipboard.writeText(userKeyPair.publicKeyHex);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-150">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-line">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings & configuration</h1>
        <p className="text-xs sm:text-sm text-muted">
          Manage your client cryptographic identity, blockchain network settings, and workspace
          preferences.
        </p>
      </div>

      {/* Section 1: Cryptographic Identity */}
      <GlassCard radius="3xl" className="p-6 sm:p-8 border-line space-y-4 text-xs bg-solid/80">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-accent" aria-hidden="true" />
            <h2 className="font-semibold text-sm text-ink">Client encryption identity (X25519)</h2>
          </div>
          <SecurityBadge status="VERIFIED" label="Client-side only" />
        </div>

        <p className="text-muted leading-relaxed">
          Your browser generates and maintains an X25519 asymmetric keypair used exclusively for
          encrypting and unwrapping document Data Encryption Keys (DEKs). Private keys are never
          stored on ProofRoom servers.
        </p>

        <div className="p-3.5 rounded-2xl glass border border-line space-y-2 bg-line/5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">Your public encryption key</span>
            <button
              type="button"
              onClick={handleCopyKey}
              className="p-1 rounded-lg text-muted hover:text-ink transition-colors flex items-center gap-1 text-[11px]"
            >
              {copiedKey ? (
                <>
                  <Check className="w-3.5 h-3.5 text-ok" aria-hidden="true" />
                  <span className="text-ok">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <p className="font-mono text-[11px] text-muted break-all select-all">
            {userKeyPair?.publicKeyHex || "Derived automatically upon wallet connection"}
          </p>
        </div>
      </GlassCard>

      {/* Section 2: Blockchain Network Configuration */}
      <GlassCard radius="3xl" className="p-6 sm:p-8 border-line space-y-4 text-xs bg-solid/80">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-info" aria-hidden="true" />
            <h2 className="font-semibold text-sm text-ink">Blockchain network settings</h2>
          </div>
          <TestnetPill />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-line">
            <span className="text-muted">Network:</span>
            <span className="font-mono text-ink uppercase font-semibold">
              {NEAR_CONFIG.networkId}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-line">
            <span className="text-muted">RPC node endpoint:</span>
            <span className="font-mono text-ink text-[11px] truncate max-w-[280px]">
              {NEAR_CONFIG.nodeUrl}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-line">
            <span className="text-muted">Smart contract account:</span>
            <span className="font-mono text-accent font-semibold">{NEAR_CONFIG.contractId}</span>
          </div>
        </div>
      </GlassCard>

      {/* Section 3: Connected Session & Logout */}
      <GlassCard radius="3xl" className="p-6 sm:p-8 border-line space-y-4 text-xs bg-solid/80">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h2 className="font-semibold text-sm text-ink">Session management</h2>
          <span className="text-muted font-mono">{accountId || "Not connected"}</span>
        </div>

        <p className="text-muted leading-relaxed">
          Disconnecting clears your ephemeral cryptographic session keys from browser memory.
        </p>

        <div className="pt-2">
          <Button
            size="md"
            variant="danger"
            onClick={disconnectWallet}
            icon={<LogOut className="w-4 h-4" />}
          >
            Disconnect wallet & clear session
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
