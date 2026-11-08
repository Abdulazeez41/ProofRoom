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
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-border/50">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings & Configuration</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Manage your client cryptographic identity, blockchain network settings, and workspace preferences.
        </p>
      </div>

      {/* Section 1: Cryptographic Identity */}
      <div className="p-6 rounded-3xl glass-panel-elevated border border-border space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-sm text-foreground">Client Encryption Identity (X25519)</h2>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Client-Side Only
          </span>
        </div>

        <p className="text-muted-foreground leading-relaxed">
          Your browser generates and maintains an X25519 asymmetric keypair used exclusively for encrypting and unwrapping document Data Encryption Keys (DEKs). Private keys are never stored on ProofRoom servers.
        </p>

        <div className="p-3.5 rounded-2xl bg-foreground/5 border border-border/50 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Your Public Encryption Key</span>
            <button
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedKey ? "Copied" : "Copy Key"}
            </button>
          </div>
          <p className="font-mono text-muted-foreground break-all text-[11px]">
            {userKeyPair?.publicKeyHex || "Connect wallet to view key"}
          </p>
        </div>
      </div>

      {/* Section 2: Blockchain Network Environment */}
      <div className="p-6 rounded-3xl glass-panel-elevated border border-border space-y-4 text-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <Globe className="w-4 h-4 text-secondary" />
          <h2 className="font-semibold text-sm text-foreground">Blockchain Network Configuration</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-2xl bg-foreground/5 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Network ID</span>
            <p className="font-mono font-semibold text-foreground">{NEAR_CONFIG.networkId}</p>
          </div>

          <div className="p-3 rounded-2xl bg-foreground/5 border border-border/50 space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">RPC Endpoint</span>
            <p className="font-mono font-semibold text-foreground truncate">{NEAR_CONFIG.nodeUrl}</p>
          </div>

          <div className="p-3 rounded-2xl bg-foreground/5 border border-border/50 space-y-1 sm:col-span-2">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Smart Contract ID</span>
            <p className="font-mono font-semibold text-foreground">{NEAR_CONFIG.contractId}</p>
          </div>
        </div>
      </div>

      {/* Section 3: Session Management */}
      <div className="p-6 rounded-3xl glass-panel border border-border flex items-center justify-between gap-4 text-xs">
        <div>
          <h3 className="font-semibold text-foreground text-sm">Active Wallet Session</h3>
          <p className="text-muted-foreground">Connected as: <span className="font-mono font-medium text-foreground">{accountId || "None"}</span></p>
        </div>

        {accountId && (
          <Button size="sm" variant="danger" onClick={disconnectWallet} icon={<LogOut className="w-3.5 h-3.5" />}>
            Disconnect
          </Button>
        )}
      </div>
    </div>
  );
}
