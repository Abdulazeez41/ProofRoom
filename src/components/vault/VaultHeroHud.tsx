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
    <div className="stage" id="stage">
      {/* 3D Canvas */}
      <VaultScene state={previewState} size="hero" />

      {/* Note Badge top-left */}
      <span className="note glass">Preview animation · drag to rotate</span>

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
            aria-pressed={isPlayingAll}
            onClick={handlePlayAll}
          >
            {isPlayingAll ? "Playing..." : "Play all"}
          </button>
        </div>
      </div>
    </div>
  );
}
