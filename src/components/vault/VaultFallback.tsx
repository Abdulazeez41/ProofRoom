"use client";

import React from "react";
import { VaultState } from "@/hooks/useVaultState";

interface VaultFallbackProps {
  state: VaultState;
  size?: "hero" | "mini" | "inline";
  className?: string;
}

export function VaultFallback({
  state = "idle",
  size = "hero",
  className = "",
}: VaultFallbackProps) {
  const sizeClasses = {
    hero: "w-full h-full min-h-[400px]",
    mini: "w-24 h-24",
    inline: "w-16 h-16",
  };

  const stateColors: Record<
    VaultState,
    { vault: string; ring: string; text: string }
  > = {
    idle: { vault: "#0F5C47", ring: "rgba(22, 33, 28, 0.2)", text: "Idle" },
    encrypting: {
      vault: "#0F7A52",
      ring: "#0F7A52",
      text: "Encrypting in browser",
    },
    verifying: {
      vault: "#3E63D9",
      ring: "#3E63D9",
      text: "Checking hardware enclave",
    },
    anchored: {
      vault: "#A86A10",
      ring: "#A86A10",
      text: "Anchored on NEAR Testnet",
    },
    failed: {
      vault: "#B63A3A",
      ring: "#B63A3A",
      text: "Verification failed - closed",
    },
  };

  const current = stateColors[state] || stateColors.idle;

  return (
    <div
      role="img"
      aria-label={`3D Vault status: ${current.text}`}
      className={`relative flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full max-w-[320px] max-h-[320px] select-none"
      >
        {/* Outer Orbit Ring */}
        <ellipse
          cx="100"
          cy="100"
          rx="82"
          ry="34"
          stroke={current.ring}
          strokeWidth="1.5"
          strokeDasharray={state === "verifying" ? "4 4" : "none"}
          className={state === "verifying" ? "animate-spin" : ""}
          style={{ transformOrigin: "100px 100px" }}
        />

        {/* Participant 1 */}
        <circle cx="24" cy="100" r="8" fill="#3E63D9" />
        <line
          x1="32"
          y1="100"
          x2="68"
          y2="100"
          stroke={current.ring}
          strokeWidth="1.5"
        />

        {/* Participant 2 */}
        <circle cx="176" cy="100" r="8" fill="#3E63D9" />
        <line
          x1="168"
          y1="100"
          x2="132"
          y2="100"
          stroke={current.ring}
          strokeWidth="1.5"
        />

        {/* Central Isometric Vault Cube */}
        <g transform="translate(100, 100)">
          {/* Top face */}
          <polygon
            points="0,-36 32,-18 0,0 -32,-18"
            fill={current.vault}
            fillOpacity="0.85"
            stroke="var(--ink, #16211C)"
            strokeWidth="1.5"
          />
          {/* Left face */}
          <polygon
            points="-32,-18 0,0 0,38 -32,20"
            fill={current.vault}
            fillOpacity="0.70"
            stroke="var(--ink, #16211C)"
            strokeWidth="1.5"
          />
          {/* Right face */}
          <polygon
            points="0,0 32,-18 32,20 0,38"
            fill={current.vault}
            fillOpacity="0.95"
            stroke="var(--ink, #16211C)"
            strokeWidth="1.5"
          />

          {/* Core Icosahedron representation */}
          <circle
            cx="0"
            cy="10"
            r="10"
            fill={
              state === "verifying"
                ? "#3E63D9"
                : state === "anchored"
                  ? "#A86A10"
                  : state === "failed"
                    ? "#B63A3A"
                    : "#5FCFA6"
            }
            className="animate-pulse"
          />
        </g>

        {/* Anchored receipt block if anchored */}
        {state === "anchored" && (
          <g transform="translate(100, 48)">
            <rect
              x="-12"
              y="-12"
              width="24"
              height="24"
              rx="4"
              fill="#A86A10"
              stroke="var(--ink, #16211C)"
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* Orbiting Documents (7 sheets) */}
        {[
          { x: 50, y: 78, rot: -15 },
          { x: 150, y: 78, rot: 15 },
          { x: 70, y: 125, rot: 10 },
          { x: 130, y: 125, rot: -10 },
          { x: 100, y: 138, rot: 0 },
        ].map((doc, idx) => (
          <rect
            key={idx}
            x={doc.x - 7}
            y={doc.y - 10}
            width="14"
            height="19"
            rx="2"
            fill={
              state === "encrypting"
                ? "#0F7A52"
                : state === "failed"
                  ? "#B63A3A"
                  : "#F7F1E3"
            }
            stroke="var(--ink, #16211C)"
            strokeWidth="1"
            transform={`rotate(${doc.rot} ${doc.x} ${doc.y})`}
          />
        ))}
      </svg>
      <span className="sr-only" aria-live="polite">
        Vault is currently {current.text}
      </span>
    </div>
  );
}
