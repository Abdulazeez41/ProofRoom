"use client";

import React, { useState, useEffect, useRef } from "react";
import { VaultScene } from "./VaultScene";
import { VaultState } from "@/hooks/useVaultState";

export function VaultHeroHud() {
  const [previewState, setPreviewState] = useState<VaultState>("idle");
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const stateDetails: Record<
    VaultState,
    { label: string; tag: string; dot: string; desc: string }
  > = {
    idle: {
      label: "Ready",
      tag: "Not checked",
      dot: "var(--muted)",
      desc: "Your room is idle. Pick a step to see what happens to your documents.",
    },
    encrypting: {
      label: "Locking files in your browser",
      tag: "Pending",
      dot: "var(--warn)",
      desc: "Each file gets its own key and is scrambled before it leaves your device.",
    },
    verifying: {
      label: "Checking the secure AI environment",
      tag: "Pending",
      dot: "var(--warn)",
      desc: "We confirm the hardware and signing keys before any question is sent.",
    },
    anchored: {
      label: "Receipt saved to NEAR Testnet",
      tag: "Preview only",
      dot: "var(--ok)",
      desc: "A fingerprint of the activity is recorded. No document text goes on-chain.",
    },
    failed: {
      label: "Check failed. Nothing was sent",
      tag: "Failed",
      dot: "var(--bad)",
      desc: "If proof is missing or wrong, your question stays in your browser.",
    },
  };

  const clearTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  const setStep = (step: VaultState) => {
    clearTimeouts();
    setIsPlayingAll(false);
    setPreviewState(step);
  };

  const handlePlayAll = () => {
    clearTimeouts();
    setIsPlayingAll(true);
    setPreviewState("encrypting");

    timeoutsRef.current.push(
      setTimeout(() => setPreviewState("verifying"), 3200),
      setTimeout(() => setPreviewState("anchored"), 6400),
      setTimeout(() => {
        setPreviewState("idle");
        setIsPlayingAll(false);
      }, 10000)
    );
  };

  useEffect(() => {
    return () => clearTimeouts();
  }, []);

  const current = stateDetails[previewState];

  return (
    <div
      id="stage"
      className="relative w-full rounded-[28px] overflow-hidden min-h-[500px] sm:min-h-[520px] border border-line"
      style={{
        background: "radial-gradient(120% 90% at 50% 20%, var(--solid), var(--bg2))",
      }}
    >
      {/* 3D Scene */}
      <VaultScene state={previewState} size="hero" />

      {/* Note Badge top-left */}
      <span className="absolute top-3 left-3 text-xs py-1.5 px-3 rounded-full glass text-muted z-10 pointer-events-none select-none">
        Preview animation · drag to rotate
      </span>

      {/* HUD Glass Overlay at bottom */}
      <div
        className="absolute left-3 right-3 bottom-3 rounded-[20px] p-3.5 sm:p-4 glass z-10 select-none"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5 font-semibold text-sm text-ink mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors"
            style={{ background: current.dot }}
            aria-hidden="true"
          />
          <span>{current.label}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-line text-muted ml-auto">
            {current.tag}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-muted m-0 mb-3 leading-normal">
          {current.desc}
        </p>

        {/* Step Control Buttons */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Preview steps">
          <button
            type="button"
            data-s="encrypt"
            aria-pressed={previewState === "encrypting"}
            onClick={() => setStep("encrypting")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all min-h-[40px] ${
              previewState === "encrypting"
                ? "bg-accent text-accent-ink border-transparent shadow-sm"
                : "bg-solid text-ink border-line hover:border-accent"
            }`}
          >
            1 Lock files
          </button>

          <button
            type="button"
            data-s="verify"
            aria-pressed={previewState === "verifying"}
            onClick={() => setStep("verifying")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all min-h-[40px] ${
              previewState === "verifying"
                ? "bg-accent text-accent-ink border-transparent shadow-sm"
                : "bg-solid text-ink border-line hover:border-accent"
            }`}
          >
            2 Check AI
          </button>

          <button
            type="button"
            data-s="anchor"
            aria-pressed={previewState === "anchored"}
            onClick={() => setStep("anchored")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all min-h-[40px] ${
              previewState === "anchored"
                ? "bg-accent text-accent-ink border-transparent shadow-sm"
                : "bg-solid text-ink border-line hover:border-accent"
            }`}
          >
            3 Save receipt
          </button>

          <button
            type="button"
            data-s="fail"
            aria-pressed={previewState === "failed"}
            onClick={() => setStep("failed")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all min-h-[40px] ${
              previewState === "failed"
                ? "bg-bad text-solid border-transparent shadow-sm"
                : "bg-solid text-ink border-line hover:border-bad"
            }`}
          >
            Test a failure
          </button>

          <button
            type="button"
            id="play"
            aria-pressed={isPlayingAll}
            onClick={handlePlayAll}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[40px] ml-auto ${
              isPlayingAll
                ? "bg-accent text-accent-ink border-transparent"
                : "bg-accent text-accent-ink hover:opacity-90"
            }`}
          >
            {isPlayingAll ? "Playing..." : "Play all"}
          </button>
        </div>
      </div>
    </div>
  );
}
