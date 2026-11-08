"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Key,
  RefreshCw,
  Clock,
  Terminal,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/Button";
import { SecurityBadge } from "../ui/Badge";
import { AttestationVerificationReport } from "@/lib/near-ai/attestation";

export function TdxVerificationCard({
  onVerificationChange,
}: {
  onVerificationChange?: (report: AttestationVerificationReport | null) => void;
}) {
  const [report, setReport] = useState<AttestationVerificationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRawEvidence, setShowRawEvidence] = useState(false);
  const [simulatedFailure, setSimulatedFailure] = useState<"NONE" | "TAMPERED_QUOTE" | "EXPIRED_NONCE" | "MISMATCHED_KEY">("NONE");

  const runVerification = async (failureMode: "NONE" | "TAMPERED_QUOTE" | "EXPIRED_NONCE" | "MISMATCHED_KEY" = simulatedFailure) => {
    setLoading(true);
    try {
      // 1. Fetch live or fresh attestation evidence
      const attRes = await fetch("/api/ai/attestation");
      const attData = await attRes.json();

      if (!attData.success || !attData.evidence) {
        throw new Error(attData.error || "Failed to retrieve hardware attestation evidence");
      }

      // 2. Submit to verifier with optional test mode injection
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
    <div className="glass-panel-elevated rounded-3xl p-6 border border-border space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isVerified ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"}`}>
              {isVerified ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-base">Intel TDX Hardware Attestation</h3>
              <p className="text-xs text-muted-foreground">Confidential AI Execution Enclave via NEAR AI Cloud</p>
            </div>
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

      {/* Fail Closed Alert if verification fails */}
      {!isVerified && report && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>FAIL-CLOSED PROTECTION TRIGGERED</span>
          </div>
          <p className="leading-relaxed">
            {report.failClosedReason || "Attestation verification checks failed. Confidential document context has NOT been transmitted to the AI service."}
          </p>
        </div>
      )}

      {/* Verification Checks Grid */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Cryptographic Evidence Checklist
        </h4>

        <div className="space-y-2">
          {report?.checks?.map((check, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between p-3 rounded-xl bg-foreground/5 border border-border/50 text-xs"
            >
              <div className="space-y-0.5 pr-4">
                <span className="font-medium text-foreground">{check.name}</span>
                <p className="text-[11px] text-muted-foreground">{check.detail}</p>
              </div>
              <SecurityBadge status={check.status} showIcon={false} />
            </div>
          ))}
        </div>
      </div>

      {/* Controlled Verification Test Harness */}
      <div className="p-4 rounded-2xl glass-panel border border-border/70 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            Verification Failure Test Harness
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">Fail-Closed Verification Test</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Test ProofRoom's fail-closed guarantee by injecting invalid quotes or expired nonces to prove the application refuses confidential processing when evidence is untrusted.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <Button
            size="sm"
            variant={simulatedFailure === "NONE" ? "primary" : "outline"}
            onClick={() => {
              setSimulatedFailure("NONE");
              runVerification("NONE");
            }}
          >
            Normal (Valid)
          </Button>
          <Button
            size="sm"
            variant={simulatedFailure === "TAMPERED_QUOTE" ? "danger" : "outline"}
            onClick={() => {
              setSimulatedFailure("TAMPERED_QUOTE");
              runVerification("TAMPERED_QUOTE");
            }}
          >
            Tamper Quote
          </Button>
          <Button
            size="sm"
            variant={simulatedFailure === "EXPIRED_NONCE" ? "danger" : "outline"}
            onClick={() => {
              setSimulatedFailure("EXPIRED_NONCE");
              runVerification("EXPIRED_NONCE");
            }}
          >
            Replay Nonce
          </Button>
          <Button
            size="sm"
            variant={simulatedFailure === "MISMATCHED_KEY" ? "danger" : "outline"}
            onClick={() => {
              setSimulatedFailure("MISMATCHED_KEY");
              runVerification("MISMATCHED_KEY");
            }}
          >
            Mismatch Key
          </Button>
        </div>
      </div>

      {/* Expandable Raw Evidence */}
      <div className="pt-2">
        <button
          onClick={() => setShowRawEvidence(!showRawEvidence)}
          className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          <span>Raw Attestation Bundle & Hardware Signatures</span>
          {showRawEvidence ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showRawEvidence && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto space-y-2 border border-slate-800">
            <div>
              <span className="text-emerald-400 font-bold">// Target Model TEE Enclave:</span>
              <p>{report?.modelId || "deepseek-ai/DeepSeek-V3.1"}</p>
            </div>
            <div>
              <span className="text-emerald-400 font-bold">// Bound Enclave Public Signing Key:</span>
              <p className="break-all">{report?.enclavePublicKeyHex || "N/A"}</p>
            </div>
            <div>
              <span className="text-emerald-400 font-bold">// Cryptographic Verification Report Hash:</span>
              <p className="break-all">{report?.reportHash || "N/A"}</p>
            </div>
            <div>
              <span className="text-emerald-400 font-bold">// Verification Timestamp:</span>
              <p>{report?.verifiedAt ? new Date(report.verifiedAt).toISOString() : "N/A"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
