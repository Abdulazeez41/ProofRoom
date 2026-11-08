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

export default function HowItWorksPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "step-1",
      layer: "Layer 1 — Browser Client",
      title: "1. Local AES-256-GCM Document Encryption",
      summary:
        "The document is read into browser memory and encrypted before touching the network. The backend never receives the original file or unwrapped keys.",
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
      layer: "Layer 2 — Key Envelopes & Access Grants",
      title: "2. X25519 Key Wrapping & Wallet Binding",
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
      layer: "Layer 4 — Confidential AI (Intel TDX)",
      title: "3. Intel TDX Hardware Attestation Verification",
      summary:
        "Before sending context, ProofRoom fetches and cryptographically verifies the model's Intel TDX Quote, measurements, and ReportData signing key binding.",
      code: `// Verifies Intel TDX Quote v4/v5 & ReportData commitment
const quoteValid = verifyIntelTdxQuote(evidence.tdxQuoteBase64);
const keyBound = evidence.reportDataHex.includes(
  sha256(\`\${evidence.enclavePublicKeyHex}:\${freshNonce}\`)
);

// Fail closed: If checks fail, halt immediately
if (!quoteValid || !keyBound) {
  throw new Error("Attestation Failed. Context refused.");
}`,
    },
    {
      id: "step-4",
      layer: "Layer 4 — E2EE Chat Protocol",
      title: "4. End-to-End Encrypted Prompt Relay",
      summary:
        "Retrieved document passages and queries are encrypted for the attested model public key. The server relays ciphertext while keeping API credentials server-side.",
      code: `// Browser encrypts prompt for model TEE enclave
const requestCiphertext = await encryptChatPayload(
  { messages, model: "deepseek-ai/DeepSeek-V3.1" },
  enclavePublicKey
);

// Backend relays ciphertext without reading contents
POST /api/ai/relay -> NEAR AI Cloud (Intel TDX)`,
    },
    {
      id: "step-5",
      layer: "Layer 5 — NEAR Testnet On-Chain Anchoring",
      title: "5. Privacy-Preserving Activity Receipts",
      summary:
        "The enclave signs the result. ProofRoom verifies the signature and anchors an immutable activity receipt to the NEAR Testnet smart contract.",
      code: `// Response verified and anchored on NEAR Testnet
const sigValid = verifyEnclaveResponseSignature(reqHash, resHash, sig);
await proofroomContract.record_query_receipt({
  room_id: opaqueRoomId,
  receipt_hash: sha256(\`receipt:\${reqHash}:\${resHash}\`),
  verification_status: "VERIFIED"
});`,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Page Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
          <Layers className="w-3.5 h-3.5" />
          <span>Interactive Architectural Walkthrough</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          How ProofRoom Works
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Trace a confidential document through client encryption, asymmetric key envelopes, Intel TDX hardware attestation, and NEAR Testnet on-chain anchoring.
        </p>
      </div>

      {/* Interactive Step Navigator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Step Selector */}
        <div className="lg:col-span-5 space-y-3">
          {steps.map((st, idx) => (
            <button
              key={st.id}
              onClick={() => setActiveStep(idx)}
              className={`w-full text-left p-4 rounded-2xl border transition-all space-y-1.5 ${
                activeStep === idx
                  ? "glass-panel-elevated border-primary/50 shadow-md shadow-primary/10 bg-primary/5 text-foreground"
                  : "glass-panel border-border/70 text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-primary font-bold">{st.layer}</span>
                {activeStep === idx && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
              <h3 className="font-semibold text-sm text-foreground">{st.title}</h3>
              <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                {st.summary}
              </p>
            </button>
          ))}
        </div>

        {/* Right Detail & Code Card */}
        <div className="lg:col-span-7 glass-panel-elevated rounded-3xl p-6 border border-border shadow-glass-elevated space-y-5">
          <div className="space-y-2 pb-4 border-b border-border/50">
            <span className="text-xs font-mono font-bold text-primary uppercase">
              {steps[activeStep].layer}
            </span>
            <h2 className="text-xl font-bold text-foreground">{steps[activeStep].title}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {steps[activeStep].summary}
            </p>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Cryptographic Protocol Code</span>
              <span className="text-[10px] text-muted-foreground font-mono">TypeScript / WebCrypto</span>
            </span>

            <div className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 shadow-inner">
              <pre>
                <code>{steps[activeStep].code}</code>
              </pre>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button
              size="sm"
              variant="outline"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>

            <Button
              size="sm"
              variant="primary"
              disabled={activeStep === steps.length - 1}
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              icon={<ChevronRight className="w-4 h-4" />}
            >
              Next Step
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-8 rounded-3xl glass-panel border border-border text-center space-y-4 max-w-3xl mx-auto">
        <h3 className="text-xl font-bold text-foreground">Ready to test with your own documents?</h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
          Create a private virtual room or explore the Northstar Technologies Series A seed dataset.
        </p>
        <Link href="/app">
          <Button size="md" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
            Open Workspace
          </Button>
        </Link>
      </div>
    </div>
  );
}
