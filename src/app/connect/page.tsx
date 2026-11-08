"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  Lock,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge, TestnetPill } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWallet } from "@/context/WalletContext";
import { NEAR_CONFIG, getExplorerAccountUrl } from "@/lib/near/config";

export default function ConnectPage() {
  const router = useRouter();
  const { accountId, isConnected, connectWallet, disconnectWallet, switchAccount, isConnecting } =
    useWallet();
  const [selectedPreset, setSelectedPreset] = useState<"founder.testnet" | "investor.testnet">(
    "founder.testnet"
  );
  const [customAccountId, setCustomAccountId] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConnect = async (targetAccount?: string) => {
    setErrorMessage(null);
    const acc = targetAccount || (customAccountId.trim() ? customAccountId.trim() : selectedPreset);

    // Hard Rule: Mainnet rejected with clear message
    if (acc.endsWith(".near") && !acc.endsWith(".testnet")) {
      setErrorMessage(
        "ProofRoom is deployed on NEAR Testnet only. Mainnet accounts (.near) are rejected. Please use an account ending in .testnet."
      );
      return;
    }

    if (!acc.endsWith(".testnet") && !acc.includes("testnet")) {
      setErrorMessage("Please enter a valid NEAR Testnet account name (ending in .testnet).");
      return;
    }

    const success = await connectWallet(acc);
    if (success) {
      router.push("/app");
    } else {
      setErrorMessage("Could not sign authentication challenge. Please try again.");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <GlassCard
        radius="3xl"
        className="w-full max-w-xl p-6 sm:p-8 space-y-6 bg-solid/80 border-line"
      >
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Connect your NEAR wallet</h1>
          <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
            Your wallet proves your identity so you can decrypt authorized documents and anchor
            receipts on-chain. ProofRoom never has access to your private wallet keys.
          </p>
        </div>

        {/* Network Indicator Card */}
        <div className="p-3.5 rounded-2xl glass border border-line flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium text-ink">
            <span className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
            <span>Network environment</span>
          </div>
          <TestnetPill />
        </div>

        {/* Mainnet rejection or error notice if triggered */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-bad/10 border border-bad/30 flex items-start gap-2.5 text-xs text-bad"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {isConnected && accountId ? (
          /* Already connected view */
          <div className="p-5 rounded-2xl bg-ok/10 border border-ok/25 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted">Connected account</span>
              <SecurityBadge status="VERIFIED" label="Active session" />
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-mono font-semibold text-ink truncate">{accountId}</span>
              <a
                href={getExplorerAccountUrl(accountId)}
                target="_blank"
                rel="noreferrer"
                className="text-muted hover:text-ink inline-flex items-center gap-1 text-[11px] underline"
              >
                <span>View on Explorer</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                size="md"
                variant="primary"
                className="w-full"
                onClick={() => router.push("/app")}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Go to workspace
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
              <label className="text-xs font-semibold text-ink">Select a testnet account</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset("founder.testnet");
                    setErrorMessage(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all text-xs space-y-1 min-h-[44px] ${
                    selectedPreset === "founder.testnet"
                      ? "bg-accent/10 border-accent text-ink"
                      : "glass border-line text-muted hover:text-ink"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>founder.testnet</span>
                    {selectedPreset === "founder.testnet" && (
                      <CheckCircle2 className="w-4 h-4 text-accent" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted">Room owner & founder</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset("investor.testnet");
                    setErrorMessage(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all text-xs space-y-1 min-h-[44px] ${
                    selectedPreset === "investor.testnet"
                      ? "bg-accent/10 border-accent text-ink"
                      : "glass border-line text-muted hover:text-ink"
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold">
                    <span>investor.testnet</span>
                    {selectedPreset === "investor.testnet" && (
                      <CheckCircle2 className="w-4 h-4 text-accent" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-[11px] text-muted">Authorized lead investor</p>
                </button>
              </div>
            </div>

            {/* Custom Account Input */}
            <div className="space-y-1.5">
              <label htmlFor="custom-account" className="text-xs font-semibold text-muted">
                Or enter custom testnet account
              </label>
              <input
                id="custom-account"
                type="text"
                placeholder="your-name.testnet"
                value={customAccountId}
                onChange={(e) => {
                  setCustomAccountId(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-xs sm:text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-info font-mono min-h-[44px]"
              />
            </div>

            {/* NEP-413 Challenge Explanation */}
            <div className="p-3.5 rounded-2xl glass border border-line/60 space-y-1 text-xs text-muted">
              <span className="font-semibold text-ink flex items-center gap-1.5 text-[11px]">
                <Lock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                NEP-413 wallet challenge
              </span>
              <p className="text-[11px] leading-relaxed">
                When you connect, you sign a single-use nonce. ProofRoom binds an ephemeral X25519
                encryption key to your session to decrypt data keys wrapped for your account.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              size="lg"
              variant="primary"
              className="w-full"
              loading={isConnecting}
              onClick={() => handleConnect()}
              icon={<ShieldCheck className="w-4 h-4" />}
            >
              Sign challenge & connect
            </Button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
