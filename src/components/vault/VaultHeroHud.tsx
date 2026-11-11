"use client";

import React, { useState, useEffect } from "react";
import { VaultScene } from "./VaultScene";
import { VaultState } from "@/hooks/useVaultState";

const LOOP_STEPS: VaultState[] = ["encrypting", "verifying", "anchored", "failed"];
const STEP_DURATION_MS = 4600; // 4.6 seconds per step - smooth, slow, readable

export function VaultHeroHud() {
  const [previewState, setPreviewState] = useState<VaultState>("encrypting");
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const stateDetails: Record<
    VaultState,
    { label: string; tag: string; dot: string; desc: string }
  > = {
    idle: {
      label: "Ready",
      tag: "Not checked",
      dot: "var(--muted)",
      desc: "Your room is idle. Pick a step or let the automated walkthrough play.",
    },
    encrypting: {
      label: "1. Lock files in your browser",
      tag: "AES-256-GCM",
      dot: "var(--warn)",
      desc: "Each file gets its own 256-bit key and is encrypted into ciphertext before it leaves your device.",
    },
    verifying: {
      label: "2. Check the secure AI environment",
      tag: "Intel TDX Enclave",
      dot: "var(--info)",
      desc: "Hardware attestation quote, MRTD hash, and signing keys are verified before any question is sent.",
    },
    anchored: {
      label: "3. Receipt saved to NEAR Testnet",
      tag: "NEAR Blockchain",
      dot: "var(--ok)",
      desc: "A tamper-proof cryptographic receipt is anchored to block state. No document text ever goes on-chain.",
    },
    failed: {
      label: "4. Test a failure: fail-closed safety",
      tag: "Fail-closed",
      dot: "var(--bad)",
      desc: "If proof is missing, tampered, or wrong, execution aborts immediately and nothing leaves your browser.",
    },
  };

  // Automated loop: slowly switches from 1 -> 2 -> 3 -> fail -> 1
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setPreviewState((current) => {
        const currentIndex = LOOP_STEPS.indexOf(current);
        const nextIndex = (currentIndex + 1) % LOOP_STEPS.length;
        return LOOP_STEPS[nextIndex];
      });
    }, STEP_DURATION_MS);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const setStep = (step: VaultState) => {
    setIsAutoPlaying(false);
    setPreviewState(step);
  };

  const toggleAutoPlay = () => {
    if (!isAutoPlaying && previewState === "idle") {
      setPreviewState("encrypting");
    }
    setIsAutoPlaying((prev) => !prev);
  };

  const current = stateDetails[previewState];

  return (
    <div className="stage" id="stage">
      {/* 3D Canvas */}
      <VaultScene state={previewState} size="hero" />

      {/* Note Badge top-left */}
      <span className="note glass">
        {isAutoPlaying ? "Automated walkthrough · drag to rotate" : "Walkthrough paused · drag to rotate"}
      </span>

      {/* HUD Glass Overlay at bottom */}
      <div className="hud glass" aria-live="polite">
        <div className="status">
          <span className="dot" id="dot" style={{ background: current.dot }} />
          <span id="sl">{current.label}</span>
          <span className="tag" id="tg">{current.tag}</span>
        </div>

        <p id="sd">{current.desc}</p>

        {/* Step Control Buttons */}
        <div className="ctrl" role="group" aria-label="Preview steps">
          <button
            type="button"
            className="btn"
            data-s="encrypt"
            aria-pressed={previewState === "encrypting"}
            onClick={() => setStep("encrypting")}
          >
            1 Lock files
          </button>

          <button
            type="button"
            className="btn"
            data-s="verify"
            aria-pressed={previewState === "verifying"}
            onClick={() => setStep("verifying")}
          >
            2 Check AI
          </button>

          <button
            type="button"
            className="btn"
            data-s="anchor"
            aria-pressed={previewState === "anchored"}
            onClick={() => setStep("anchored")}
          >
            3 Save receipt
          </button>

          <button
            type="button"
            className="btn"
            data-s="fail"
            aria-pressed={previewState === "failed"}
            onClick={() => setStep("failed")}
          >
            Test a failure
          </button>

          <button
            type="button"
            className="btn primary"
            id="play"
            aria-pressed={isAutoPlaying}
            onClick={toggleAutoPlay}
            title={isAutoPlaying ? "Click to pause automated walkthrough" : "Click to resume automated walkthrough loop"}
          >
            {isAutoPlaying ? "⏸ Pause loop" : "▶ Auto-play loop"}
          </button>
        </div>
      </div>
    </div>
  );
}
