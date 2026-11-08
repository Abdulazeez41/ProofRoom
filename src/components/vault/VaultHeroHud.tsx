"use client";

import React, { useState, useEffect } from "react";
import { VaultScene } from "./VaultScene";
import { VaultState } from "@/hooks/useVaultState";
import { SecurityBadge } from "@/components/ui/Badge";
import { Play, ShieldAlert, FileLock2, Cpu, CheckCircle2 } from "lucide-react";

export function VaultHeroHud() {
  const [previewState, setPreviewState] = useState<VaultState>("idle");
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  useEffect(() => {
    if (!isPlayingAll) return;

    const sequence: VaultState[] = ["idle", "encrypting", "verifying", "anchored", "failed", "idle"];
    let step = 0;

    const interval = setInterval(() => {
      step = (step + 1) % sequence.length;
      setPreviewState(sequence[step]);
      if (step === sequence.length - 1) {
        setIsPlayingAll(false);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlayingAll]);

  const stateDetails: Record<
    VaultState,
    { label: string; explanation: string; badgeStatus: string }
  > = {
    idle: {
      label: "Vault idle",
      explanation: "Documents at rest, encrypted before leaving the browser.",
      badgeStatus: "NOT_CHECKED",
    },
    encrypting: {
      label: "Client-side encryption",
      explanation: "AES-256-GCM data key wrapped for authorized participant public keys.",
      badgeStatus: "PENDING",
    },
    verifying: {
      label: "Enclave verification",
      explanation: "Intel TDX hardware quote verified with fresh nonce and ReportData key binding.",
      badgeStatus: "PENDING",
    },
    anchored: {
      label: "Anchored on NEAR",
      explanation: "Tamper-evident hash commitment recorded on NEAR Testnet block.",
      badgeStatus: "VERIFIED",
    },
    failed: {
      label: "Verification failed (fail-closed)",
      explanation: "Hardware quote or key mismatch detected. Confidential data was never sent.",
      badgeStatus: "FAILED",
    },
  };

  const current = stateDetails[previewState];

  return (
    <div className="flex flex-col items-center w-full">
      {/* 3D Scene Stage */}
      <div className="w-full relative rounded-3xl overflow-hidden glass border border-line">
        <VaultScene state={previewState} size="hero" />

        {/* HUD Glass Overlay Panel at bottom of 3D stage */}
        <div className="p-4 sm:p-5 border-t border-line/60 glass bg-surface/85 backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs uppercase tracking-wider text-muted font-semibold">
                  Vault state
                </span>
                <SecurityBadge status={current.badgeStatus} label={current.label} />
              </div>
              <p className="text-xs sm:text-sm text-ink max-w-xl">
                {current.explanation}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-line/20 text-muted font-mono">
                Preview animation
              </span>
            </div>
          </div>

          {/* Interactive Preview Control Row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-line/40">
            <span className="text-xs text-muted mr-1 hidden sm:inline">Simulate:</span>
            <button
              type="button"
              onClick={() => {
                setIsPlayingAll(false);
                setPreviewState("encrypting");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                previewState === "encrypting"
                  ? "bg-accent text-accent-ink border-accent"
                  : "bg-surface hover:bg-line/20 text-ink border-line"
              }`}
            >
              <FileLock2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Lock files</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlayingAll(false);
                setPreviewState("verifying");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                previewState === "verifying"
                  ? "bg-info text-solid border-info"
                  : "bg-surface hover:bg-line/20 text-ink border-line"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Check AI</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlayingAll(false);
                setPreviewState("anchored");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                previewState === "anchored"
                  ? "bg-warn text-solid border-warn"
                  : "bg-surface hover:bg-line/20 text-ink border-line"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Save receipt</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPlayingAll(false);
                setPreviewState("failed");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ${
                previewState === "failed"
                  ? "bg-bad text-solid border-bad"
                  : "bg-surface hover:bg-line/20 text-bad border-line"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Test a failure</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPlayingAll(!isPlayingAll)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors inline-flex items-center gap-1.5 ml-auto ${
                isPlayingAll
                  ? "bg-ink text-solid border-ink"
                  : "bg-surface hover:bg-line/20 text-ink border-line"
              }`}
            >
              <Play className={`w-3.5 h-3.5 ${isPlayingAll ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{isPlayingAll ? "Playing..." : "Play all"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
