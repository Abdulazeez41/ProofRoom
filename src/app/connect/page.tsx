"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  KeyRound,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { useWallet } from "@/context/WalletContext";
import { NEAR_CONFIG, getExplorerAccountUrl } from "@/lib/near/config";

export default function ConnectPage() {
  const router = useRouter();
  const { accountId, isConnected, connectWallet, disconnectWallet, switchAccount, isConnecting } = useWallet();
  const [selectedPreset, setSelectedPreset] = useState<"founder.testnet" | "investor.testnet">("founder.testnet");
  const [customAccountId, setCustomAccountId] = useState("");

  const handleConnect = async (targetAccount?: string) => {
    const acc = targetAccount || (customAccountId.trim() ? customAccountId.trim() : selectedPreset);
    const success = await connectWallet(acc);
    if (success) {
      router.push("/app");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl rounded-3xl glass-panel-elevated border border-border shadow-glass-elevated p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Connect NEAR Wallet</h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Your NEAR account identifies you as the owner or authorized participant of a confidential workspace.
          </p>
        </div>

        {/* Network Indicator Card */}
        <div className="p-3.5 rounded-2xl glass-panel border border-border flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground">Network Environment</span>
          </div>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {NEAR_CONFIG.networkId.toUpperCase()} (Testnet RPC)
          </span>
        </div>

        {isConnected && accountId ? (
          /* Already connected view */
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Connected Account</span>
              <SecurityBadge status="ACTIVE" label="Verified Session" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-mono font-semibold text-foreground truncate">{accountId}</span>
              <a
                href={getExplorerAccountUrl(accountId)}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px]"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button size="md" variant="primary" className="w-full" onClick={() => router.push("/app")}>
                Proceed to Workspace
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button size="md" variant="ghost" onClick={disconnectWallet}>
                Disconnect
              </Button>
            </div>
          </div>
        ) : (
          /* Connect Options */
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Select Testnet Persona</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPreset("founder.testnet")}
                  className={`p-3.5 rounded-2xl border text-left transition-all text-xs space-y-1 ${
                    selectedPreset === "founder.testnet"
                      ? "bg-primary/10 border-primary shadow-sm text-foreground"
                      : "glass-panel border-border/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>founder.testnet</span>
                    {selectedPreset === "founder.testnet" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Room Owner & Administrator</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPreset("investor.testnet")}
                  className={`p-3.5 rounded-2xl border text-left transition-all text-xs space-y-1 ${
                    selectedPreset === "investor.testnet"
                      ? "bg-primary/10 border-primary shadow-sm text-foreground"
                      : "glass-panel border-border/70 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>investor.testnet</span>
                    {selectedPreset === "investor.testnet" && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Authorized Lead Investor</p>
                </button>
              </div>
            </div>

            {/* Custom Account Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Or Enter Custom Testnet Account</label>
              <input
                type="text"
                placeholder="your-name.testnet"
                value={customAccountId}
                onChange={(e) => setCustomAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
              />
            </div>

            {/* NEP-413 Security Guarantee Notice */}
            <div className="p-3.5 rounded-2xl glass-panel border border-border/80 space-y-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-primary" />
                NEP-413 Challenge Verification
              </span>
              <p className="text-[11px] leading-relaxed">
                Wallet authentication generates a single-use signed challenge. ProofRoom binds an ephemeral X25519 encryption keypair strictly for document decryption.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              size="lg"
              variant="primary"
              className="w-full font-semibold shadow-md shadow-primary/20"
              loading={isConnecting}
              onClick={() => handleConnect()}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Sign Challenge & Connect
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
