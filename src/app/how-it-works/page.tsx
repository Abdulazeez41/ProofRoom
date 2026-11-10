"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Lock,
  Cpu,
  KeyRound,
  FileCheck2,
  Database,
  ArrowRight,
  Shield,
  Layers,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { SecurityBadge } from "@/components/ui/Badge";

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "step-1",
      layer: "Layer 1 - Browser Client",
      title: "1. Local AES-256-GCM document encryption",
      summary:
        "The document is read into browser memory and encrypted before touching the network. Our servers only ever receive ciphertext and commitment hashes.",
      code: `// Generated locally in user's browser memory
const dek = crypto.getRandomValues(new Uint8Array(32));
const iv = crypto.getRandomValues(new Uint8Array(12));

const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv, tagLength: 128 },
  await crypto.subtle.importKey("raw", dek, "AES-GCM", false, ["encrypt"]),
  plaintextBytes
);`,
    },
    {
      id: "step-2",
      layer: "Layer 2 - Key Envelopes & Access Grants",
      title: "2. X25519 key wrapping & wallet binding",
      summary:
        "The Data Encryption Key (DEK) is encapsulated separately for each authorized participant using X25519 ECDH + HKDF-SHA256 authenticated wrapping.",
      code: `// Recipient key envelope creation
const ephemeralPrivate = x25519.utils.randomSecretKey();
const ephemeralPublic = x25519.getPublicKey(ephemeralPrivate);
const sharedSecret = x25519.getSharedSecret(ephemeralPrivate, recipientPublicKey);

// Derive 256-bit wrapping key via HKDF
const wrappingKey = hkdf(sha256, sharedSecret, salt, "proofroom:envelope:v1", 32);
const encryptedDEK = await encryptAesGcm(wrappingKey, dek);`,
    },
    {
      id: "step-3",
      layer: "Layer 3 - Confidential AI (Intel TDX)",
      title: "3. Intel TDX hardware attestation verification",
      summary:
        "Before sending context, ProofRoom verifies the model's Intel TDX Quote, measurements, and ReportData signing key binding.",
      code: `// Verifies Intel TDX Quote v4/v5 & ReportData commitment
const quoteValid = verifyIntelTdxQuote(evidence.tdxQuoteBase64);
const keyBound = evidence.reportDataHex.includes(
  sha256(\`\${evidence.enclavePublicKeyHex}:\${freshNonce}\`)
);

// Fail closed: If checks fail, halt immediately
if (!quoteValid || !keyBound) {
  throw new Error("Attestation failed. Context refused.");
}`,
    },
    {
      id: "step-4",
      layer: "Layer 4 - NEAR AI Cloud Relay",
      title: "4. End-to-end encrypted AI inference",
      summary:
        "Inference prompts are encrypted with AES-256-GCM for the enclave's public key. The application backend acts solely as a zero-knowledge relay.",
      code: `// Encrypted chat request creation
const encryptedPayload = await encryptChatRequest(
  messages,
  "deepseek-ai/DeepSeek-V3.1",
  enclavePublicKeyHex
);

// Relayed over HTTPS directly to TDX enclave
const relayResponse = await fetch("/api/ai/relay", {
  method: "POST",
  body: JSON.stringify(encryptedPayload)
});`,
    },
    {
      id: "step-5",
      layer: "Layer 5 - Blockchain Commitments",
      title: "5. NEAR Testnet on-chain audit trail",
      summary:
        "Cryptographic activity receipts and document hashes are anchored on NEAR Testnet, providing a permanent, tamper-evident audit record.",
      code: `// Records verification outcome on NEAR smart contract
pub fn record_query_receipt(
  &mut self,
  room_id: String,
  receipt_hash: String,
  verification_status: String,
  timestamp: u64
) {
  // Anchors commitment permanently to blockchain block
}`,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full py-10 md:py-16 px-4 sm:px-8 lg:px-12 xl:px-16 space-y-12">
      {/* Page Title */}
      <div className="text-center max-w-3xl space-y-3">
        <SecurityBadge
          status="VERIFIED"
          label="End-to-end technical pipeline"
        />
        <h1 className="hero-headline text-ink text-balance">
          How ProofRoom verifies every step
        </h1>
        <p className="text-base sm:text-lg text-muted prose-restricted mx-auto text-balance">
          Explore the five security layers that ensure your confidential
          fundraising documents are never exposed in plaintext to server
          operators or cloud hosts.
        </p>
      </div>

      {/* Interactive Step Explorer */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation list */}
        <div className="lg:col-span-5 space-y-2.5">
          {steps.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStep(idx)}
              className={`w-full p-4 rounded-2xl border text-left transition-all min-h-[44px] ${
                activeStep === idx
                  ? "bg-accent/10 border-accent shadow-sm"
                  : "glass border-line hover:border-accent/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-mono text-accent font-semibold uppercase">
                  {step.layer}
                </span>
                {activeStep === idx && (
                  <CheckCircle2
                    className="w-4 h-4 text-accent"
                    aria-hidden="true"
                  />
                )}
              </div>
              <h3 className="font-semibold text-ink text-sm sm:text-base">
                {step.title}
              </h3>
            </button>
          ))}
        </div>

        {/* Step details display */}
        <GlassCard
          radius="3xl"
          className="lg:col-span-7 p-6 sm:p-8 border-line space-y-5 bg-solid/80"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono font-semibold text-accent uppercase">
              {steps[activeStep].layer}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-ink">
              {steps[activeStep].title}
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              {steps[activeStep].summary}
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-semibold text-ink">
              Code implementation
            </span>
            <pre className="p-4 rounded-2xl bg-ink text-solid font-mono text-xs overflow-x-auto leading-relaxed border border-line">
              <code>{steps[activeStep].code}</code>
            </pre>
          </div>
        </GlassCard>
      </div>

      {/* Call to action */}
      <GlassCard
        radius="2xl"
        className="w-full p-8 text-center border-line space-y-4 max-w-2xl bg-bg2/40"
      >
        <h3 className="text-lg font-bold text-ink">
          Ready to explore ProofRoom?
        </h3>
        <p className="text-xs sm:text-sm text-muted">
          Connect your testnet wallet to inspect our live workspace, upload
          files, and verify attestation.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link href="/app/rooms/new">
            <Button
              size="md"
              variant="primary"
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Create private room
            </Button>
          </Link>
          <Link href="/security">
            <Button size="md" variant="outline">
              Inspect security center
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
