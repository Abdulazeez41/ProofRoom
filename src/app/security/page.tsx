"use client";

import React from "react";
import {
  ShieldCheck,
  Lock,
  Cpu,
  KeyRound,
  FileCheck2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { TdxVerificationCard } from "@/components/security/TdxVerificationCard";
import { SecurityBadge } from "@/components/ui/Badge";

export default function SecurityPage() {
  const threatScenarios = [
    {
      threat: "Compromised Object Storage Provider",
      mechanism: "AES-256-GCM Client-Side Encryption",
      protection: "Guaranteed Protected",
      detail:
        "Document blobs in S3 or disk are encrypted using unique 256-bit keys generated in browser memory. Stored blobs are indistinguishable from random noise.",
    },
    {
      threat: "Malicious Backend Operator / DB Scraping",
      mechanism: "Zero Plaintext & Zero Private Key Storage",
      protection: "Guaranteed Protected",
      detail:
        "The application database stores only encrypted key envelopes, opaque IDs, and ciphertext hashes. Private keys never leave client memory.",
    },
    {
      threat: "Unauthorized Room Access / Key Interception",
      mechanism: "X25519 Asymmetric Envelope KEM",
      protection: "Guaranteed Protected",
      detail:
        "Document DEKs are wrapped strictly for the X25519 public keys of explicitly authorized participants. Third parties cannot decrypt key envelopes.",
    },
    {
      threat: "Cloud Host Snooping on AI Inference",
      mechanism: "Intel TDX Hardware-Isolated TEE Enclave",
      protection: "Guaranteed Protected",
      detail:
        "Inference runs inside a Trust Domain with hardware-encrypted RAM. Cloud operators, hypervisors, and host OS cannot inspect memory during model execution.",
    },
    {
      threat: "Forged or Tampered AI Responses",
      mechanism: "ECDSA Response Signature Verification",
      protection: "Guaranteed Protected",
      detail:
        "Enclaves digitally sign the combined hash of prompt request and response. Tampered outputs fail client verification immediately.",
    },
    {
      threat: "Replay Attacks on Attestation or Auth",
      mechanism: "Cryptographic Fresh Nonce Validation",
      protection: "Guaranteed Protected",
      detail:
        "Single-use 32-byte nonces are bound into the hardware ReportData and NEP-413 wallet challenges to prevent signature replays.",
    },
    {
      threat: "Authorized Participant Physical Exfiltration",
      mechanism: "Client-Side Physical Security Boundary",
      protection: "Out of Scope / Non-Goal",
      detail:
        "An authorized investor who has legitimately decrypted a file has read access on their device. ProofRoom controls key delivery, but cannot prevent optical screen captures once legitimately decrypted.",
    },
    {
      threat: "Information Downloaded Prior to Revocation",
      mechanism: "Future Access Revocation",
      protection: "Explicit Boundary",
      detail:
        "Revocation immediately prevents future downloads and halts key distribution for future document versions. It cannot retroactively delete local copies already saved prior to revocation.",
    },
  ];

  const cryptoSpecs = [
    {
      label: "Document Encryption",
      spec: "AES-256-GCM",
      detail: "Unique 256-bit DEK per document, 96-bit random IV, 128-bit authentication tag",
    },
    {
      label: "Key Wrapping Envelopes",
      spec: "X25519 + HKDF-SHA256",
      detail: "RFC 8439 / ECIES-style key agreement derived with domain-separated salt & info",
    },
    {
      label: "Confidential TEE Enclave",
      spec: "Intel TDX via NEAR AI Cloud",
      detail: "Hardware MKTME memory encryption, verified MRTD and RTMR measurements",
    },
    {
      label: "Response Signature",
      spec: "ECDSA P-256 / Ed25519",
      detail: "Hardware enclave digital signature over sha256(request_hash || response_hash)",
    },
    {
      label: "Identity & Signatures",
      spec: "NEP-413 Wallet Challenges",
      detail: "Ed25519 single-use signed authentication nonces anchored to NEAR account IDs",
    },
    {
      label: "Audit Ledger",
      spec: "NEAR Testnet Smart Contract",
      detail: "Opaque commitments (room_commitment, document_hash, receipt_hash) on NEAR Testnet",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Security Architecture & Threat Model</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Verifiable Privacy by Design
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          ProofRoom replaces subjective platform trust with cryptographic evidence. Inspect our live Intel TDX attestation reports, threat boundaries, and formal specifications.
        </p>
      </div>

      {/* Live Attestation Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-500" />
            Live Hardware Verification Engine
          </h2>
          <span className="text-xs text-muted-foreground font-mono">NEAR AI Cloud / Intel TDX</span>
        </div>
        <TdxVerificationCard />
      </div>

      {/* Threat Model Table */}
      <div className="space-y-4 pt-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Threat Model Matrix</h2>
          <p className="text-xs text-muted-foreground">
            Explicit technical classification of what ProofRoom cryptographically guarantees and explicit out-of-scope risks.
          </p>
        </div>

        <div className="rounded-3xl glass-panel-elevated border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-foreground/[0.02] text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="p-4">Threat Vector</th>
                  <th className="p-4">Mitigating Control</th>
                  <th className="p-4">Protection Status</th>
                  <th className="p-4">Architectural Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {threatScenarios.map((row, idx) => (
                  <tr key={idx} className="hover:bg-foreground/[0.015] transition-colors">
                    <td className="p-4 font-semibold text-foreground align-top max-w-[200px]">
                      {row.threat}
                    </td>
                    <td className="p-4 font-mono text-primary align-top max-w-[220px]">
                      {row.mechanism}
                    </td>
                    <td className="p-4 align-top whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          row.protection.includes("Guaranteed")
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {row.protection}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-[11px] leading-relaxed align-top">
                      {row.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cryptographic Specifications */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-foreground">Cryptographic Standards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoSpecs.map((spec, idx) => (
            <div key={idx} className="p-4 rounded-2xl glass-panel border border-border space-y-1.5 text-xs">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {spec.label}
              </span>
              <p className="font-mono font-bold text-foreground text-sm">{spec.spec}</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">{spec.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
