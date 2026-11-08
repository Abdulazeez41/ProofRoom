"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  RefreshCw,
  Clock,
  Terminal,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/Button";
import { SecurityBadge } from "../ui/Badge";
import { GlassCard } from "../ui/GlassCard";
import { VaultScene } from "../vault/VaultScene";
import { AttestationVerificationReport } from "@/lib/near-ai/attestation";

export function TdxVerificationCard({
  onVerificationChange,
}: {
  onVerificationChange?: (report: AttestationVerificationReport | null) => void;
}) {
  const [report, setReport] = useState<AttestationVerificationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRawEvidence, setShowRawEvidence] = useState(false);
  const [simulatedFailure, setSimulatedFailure] = useState<
    "NONE" | "TAMPERED_QUOTE" | "EXPIRED_NONCE" | "MISMATCHED_KEY"
  >("NONE");

  const runVerification = async (
    failureMode: "NONE" | "TAMPERED_QUOTE" | "EXPIRED_NONCE" | "MISMATCHED_KEY" = simulatedFailure
  ) => {
    setLoading(true);
    try {
      const attRes = await fetch("/api/ai/attestation");
      const attData = await attRes.json();

      if (!attData.success || !attData.evidence) {
        throw new Error(attData.error || "Failed to retrieve hardware attestation evidence");
      }

      const verifyRes = await fetch("/api/verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: attData.evidence,
          expectedNonce: attData.nonce,
          injectFailure: failureMode === "NONE" ? undefined : failureMode,
        }),
      });

      const verifyData = await verifyRes.json();
      if (verifyData.success && verifyData.report) {
        setReport(verifyData.report);
        if (onVerificationChange) onVerificationChange(verifyData.report);
      }
    } catch (err) {
      console.error("Verification execution error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runVerification("NONE");
  }, []);

  const isVerified = report?.overallStatus === "VERIFIED";

  return (
    <GlassCard radius="3xl" className="p-6 sm:p-8 border-line space-y-6 bg-solid/80">
      {/* Header with Scan Ring Visual */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl glass border border-line flex items-center justify-center shrink-0 overflow-hidden">
            <VaultScene
              state={loading ? "verifying" : isVerified ? "anchored" : "failed"}
              size="inline"
            />
          </div>
          <div>
            <h3 className="font-semibold text-ink text-base">Intel TDX hardware attestation</h3>
            <p className="text-xs text-muted">
              Confidential AI execution enclave via NEAR AI Cloud
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <SecurityBadge status={report?.overallStatus || "PENDING"} />
          <Button
            size="sm"
            variant="glass"
            loading={loading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={() => runVerification(simulatedFailure)}
          >
            Re-verify
          </Button>
        </div>
      </div>

      {/* Fail-Closed Alert if verification fails */}
      {!isVerified && report && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-bad/10 border border-bad/30 text-bad space-y-2 text-xs"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-bad shrink-0" aria-hidden="true" />
            <span>Fail-closed protection triggered</span>
          </div>
          <p className="leading-relaxed">
            {report.failClosedReason ||
              "Attestation verification checks failed. Confidential document context has NOT been transmitted to the AI service."}
          </p>
        </div>
      )}

      {/* Verification Checks Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">
          Cryptographic evidence checklist
        </h4>

        <div className="space-y-2">
          {report?.checks?.map((check, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-3.5 rounded-xl glass border border-line text-xs"
            >
              <div className="space-y-0.5 pr-4">
                <span className="font-medium text-ink">{check.name}</span>
                <p className="text-[11px] text-muted">{check.detail}</p>
              </div>
              <SecurityBadge status={check.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Controlled Verification Test Harness */}
      <div className="p-4 rounded-2xl glass border border-line space-y-3 text-xs bg-line/5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>Verification failure test harness</span>
          </span>
          <span className="text-[10px] text-muted font-mono">Fail-closed test</span>
        </div>
        <p className="text-[11px] text-muted leading-relaxed">
          Test ProofRoom's fail-closed guarantee by injecting invalid quotes or expired nonces to
          confirm the application refuses to send confidential data when evidence is untrusted.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setSimulatedFailure("NONE");
              runVerification("NONE");
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors min-h-[44px] ${
              simulatedFailure === "NONE"
                ? "bg-accent text-accent-ink border-accent"
                : "glass text-ink border-line hover:bg-line/20"
            }`}
          >
            Normal (Valid)
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedFailure("TAMPERED_QUOTE");
              runVerification("TAMPERED_QUOTE");
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors min-h-[44px] ${
              simulatedFailure === "TAMPERED_QUOTE"
                ? "bg-bad text-solid border-bad"
                : "glass text-bad border-line hover:bg-bad/10"
            }`}
          >
            Tamper quote
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedFailure("EXPIRED_NONCE");
              runVerification("EXPIRED_NONCE");
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors min-h-[44px] ${
              simulatedFailure === "EXPIRED_NONCE"
                ? "bg-bad text-solid border-bad"
                : "glass text-bad border-line hover:bg-bad/10"
            }`}
          >
            Replay nonce
          </button>
          <button
            type="button"
            onClick={() => {
              setSimulatedFailure("MISMATCHED_KEY");
              runVerification("MISMATCHED_KEY");
            }}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors min-h-[44px] ${
              simulatedFailure === "MISMATCHED_KEY"
                ? "bg-bad text-solid border-bad"
                : "glass text-bad border-line hover:bg-bad/10"
            }`}
          >
            Mismatched key
          </button>
        </div>
      </div>

      {/* Expandable Raw Evidence JSON */}
      <div className="pt-2 border-t border-line">
        <button
          type="button"
          onClick={() => setShowRawEvidence(!showRawEvidence)}
          className="flex items-center justify-between w-full text-xs font-medium text-muted hover:text-ink transition-colors py-1"
          aria-expanded={showRawEvidence}
        >
          <span>Raw hardware attestation payload</span>
          {showRawEvidence ? (
            <ChevronUp className="w-4 h-4" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {showRawEvidence && (
          <pre className="mt-3 p-4 rounded-2xl bg-ink text-solid font-mono text-[11px] overflow-x-auto leading-relaxed border border-line">
            {JSON.stringify(report, null, 2)}
          </pre>
        )}
      </div>
    </GlassCard>
  );
}
