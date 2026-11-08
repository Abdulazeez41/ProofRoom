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
import { GlassCard } from "@/components/ui/GlassCard";

export default function SecurityPage() {
  const threatScenarios = [
    {
      threat: "Compromised object storage provider",
      mechanism: "AES-256-GCM client-side encryption",
      protection: "Protected",
      detail:
        "Document blobs are encrypted using unique 256-bit random keys generated in browser memory. Stored blobs are ciphertext only.",
    },
    {
      threat: "Malicious backend operator / DB inspection",
      mechanism: "Zero plaintext & zero private key storage",
      protection: "Protected",
      detail:
        "The application database stores only encrypted key envelopes and opaque commitment hashes. Private keys never leave client memory.",
    },
    {
      threat: "Unauthorized room access / key interception",
      mechanism: "X25519 asymmetric envelope KEM",
      protection: "Protected",
      detail:
        "Document DEKs are wrapped strictly for the X25519 public keys of explicitly authorized participants. Third parties cannot unwrap envelopes.",
    },
    {
      threat: "Cloud host snooping on AI inference",
      mechanism: "Intel TDX hardware-isolated TEE enclave",
      protection: "Protected",
      detail:
        "Inference runs inside a Trust Domain with hardware-encrypted RAM. Cloud operators and hypervisors cannot inspect memory during execution.",
    },
    {
      threat: "Forged or tampered AI responses",
      mechanism: "Enclave digital signature verification",
      protection: "Protected",
      detail:
        "Enclaves digitally sign the combined hash of prompt request and response. Tampered outputs fail client verification immediately.",
    },
    {
      threat: "Replay attacks on attestation or auth",
      mechanism: "Cryptographic fresh nonce validation",
      protection: "Protected",
      detail:
        "Single-use 32-byte nonces are bound into the hardware ReportData and NEP-413 wallet challenges to prevent replays.",
    },
    {
      threat: "Authorized participant screen capture",
      mechanism: "Physical monitor boundary",
      protection: "Not protected",
      detail:
        "An authorized person who legitimately decrypts a document on their screen can photograph their monitor. Software cannot prevent physical photographs.",
    },
    {
      threat: "Information downloaded prior to revocation",
      mechanism: "Future key delivery halted",
      protection: "Not protected",
      detail:
        "Revocation immediately prevents future downloads and halts key distribution for future versions. It cannot delete local copies already saved.",
    },
  ];

  const cryptoSpecs = [
    {
      label: "Document encryption",
      spec: "AES-256-GCM",
      detail: "Unique 256-bit DEK per document, 96-bit random IV, 128-bit authentication tag",
    },
    {
      label: "Key wrapping envelopes",
      spec: "X25519 + HKDF-SHA256",
      detail: "RFC 8439 / ECIES-style key agreement derived with domain-separated salt & info",
    },
    {
      label: "Confidential TEE enclave",
      spec: "Intel TDX via NEAR AI Cloud",
      detail: "Hardware MKTME memory encryption, verified MRTD and RTMR measurements",
    },
    {
      label: "Response signature",
      spec: "ECDSA P-256 / Ed25519",
      detail: "Hardware enclave digital signature over sha256(request_hash || response_hash)",
    },
    {
      label: "Identity & signatures",
      spec: "NEP-413 wallet challenges",
      detail: "Single-use signed authentication nonces anchored to NEAR account IDs",
    },
    {
      label: "Audit ledger",
      spec: "NEAR Testnet smart contract",
      detail: "Opaque commitments (room_commitment, document_hash, receipt_hash) on NEAR Testnet",
    },
  ];

  return (
    <div className="w-full px-4 sm:px-8 lg:px-12 xl:px-16 py-10 md:py-14 space-y-12">
      {/* Page Header */}
      <div className="max-w-3xl space-y-3">
        <SecurityBadge status="VERIFIED" label="Security architecture & threat model" />
        <h1 className="hero-headline text-ink text-balance">
          Verifiable privacy by design
        </h1>
        <p className="text-base sm:text-lg text-muted prose-restricted leading-relaxed">
          ProofRoom replaces subjective platform trust with cryptographic evidence. Inspect our live
          Intel TDX attestation reports, threat boundaries, and formal specifications.
        </p>
      </div>

      {/* Live Attestation Card */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
            <Cpu className="w-5 h-5 text-accent" aria-hidden="true" />
            <span>Live hardware verification engine</span>
          </h2>
          <span className="text-xs text-muted font-mono">NEAR AI Cloud / Intel TDX</span>
        </div>
        <TdxVerificationCard />
      </div>

      {/* Threat Model Table / Cards */}
      <div className="space-y-4 pt-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-ink">Threat model matrix</h2>
          <p className="text-xs text-muted">
            Explicit technical classification of what ProofRoom cryptographically guarantees and
            explicit boundaries.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-3xl glass border border-line overflow-hidden bg-solid/80">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line bg-line/10">
                <th className="p-4 font-semibold text-ink">Threat scenario</th>
                <th className="p-4 font-semibold text-ink">Mitigation mechanism</th>
                <th className="p-4 font-semibold text-ink">Guarantee</th>
                <th className="p-4 font-semibold text-ink">Engineering detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {threatScenarios.map((item, idx) => (
                <tr key={idx} className="hover:bg-line/5 transition-colors">
                  <td className="p-4 font-medium text-ink align-top">{item.threat}</td>
                  <td className="p-4 text-muted font-mono align-top">{item.mechanism}</td>
                  <td className="p-4 align-top">
                    <SecurityBadge
                      status={item.protection === "Protected" ? "VERIFIED" : "UNAVAILABLE"}
                      label={item.protection}
                    />
                  </td>
                  <td className="p-4 text-muted leading-relaxed align-top">{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {threatScenarios.map((item, idx) => (
            <GlassCard key={idx} radius="2xl" className="p-4 border-line space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-ink text-sm">{item.threat}</span>
                <SecurityBadge
                  status={item.protection === "Protected" ? "VERIFIED" : "UNAVAILABLE"}
                  label={item.protection}
                />
              </div>
              <p className="font-mono text-accent text-[11px]">{item.mechanism}</p>
              <p className="text-muted text-xs leading-relaxed">{item.detail}</p>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Cryptographic Specifications Grid */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-semibold text-ink">Cryptographic specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cryptoSpecs.map((spec, idx) => (
            <GlassCard key={idx} radius="2xl" className="p-5 border-line space-y-2">
              <span className="text-[11px] font-semibold text-muted uppercase tracking-wider block">
                {spec.label}
              </span>
              <p className="text-base font-bold text-ink font-mono">{spec.spec}</p>
              <p className="text-xs text-muted leading-relaxed">{spec.detail}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
