"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Cpu,
  FileCheck2,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  EyeOff,
  Database,
  KeyRound,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { DEMO_SUGGESTED_QUESTIONS } from "@/lib/demo/northstar-data";

export default function LandingPage() {
  const steps = [
    {
      step: "01",
      title: "Encrypt in Browser",
      desc: "Each document is encrypted locally with an ephemeral AES-256-GCM key before touching the network. The backend never receives plaintext.",
      icon: Lock,
    },
    {
      step: "02",
      title: "Invite Authorized Partners",
      desc: "Participants are identified via NEAR wallets. Key envelopes are encrypted for recipient X25519 public keys, anchoring permissions on-chain.",
      icon: Users,
    },
    {
      step: "03",
      title: "Query AI Privately",
      desc: "Relevant excerpts are retrieved locally. Queries are end-to-end encrypted for model inference running strictly inside an Intel TDX enclave.",
      icon: Sparkles,
    },
    {
      step: "04",
      title: "Verify the Computation",
      desc: "Hardware quotes, signing keys, and response signatures are verified before displaying answers. Privacy commitments anchor to NEAR Testnet.",
      icon: FileCheck2,
    },
  ];

  const securityPillars = [
    {
      title: "Client-Side Document Encryption",
      desc: "Files are transformed into authenticated ciphertext using AES-256-GCM in the user's browser memory. Storage providers and server operators store only opaque binary blobs.",
      icon: EyeOff,
    },
    {
      title: "Wallet-Controlled Permissions",
      desc: "NEAR account identities bind to cryptographic key envelopes via NEP-413 signed challenges. Revocation instantly halts future key distribution without retroactive risk.",
      icon: KeyRound,
    },
    {
      title: "Hardware-Attested Intel TDX",
      desc: "Inference executes in hardware-isolated Trust Domains. Memory is encrypted by the CPU hardware engine, preventing hypervisors and host clouds from reading data.",
      icon: Cpu,
    },
    {
      title: "Tamper-Evident Testnet Commitments",
      desc: "Cryptographic activity receipts and document version hashes are recorded on NEAR Testnet. Verifiable audit history is anchored without publishing sensitive metadata.",
      icon: Database,
    },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Network & Hardware Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium glass-panel border border-border shadow-sm mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-muted-foreground">Built with</span>
          <span className="font-semibold text-foreground">NEAR Testnet</span>
          <span className="text-muted-foreground">&</span>
          <span className="font-semibold text-foreground">Intel TDX</span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-4xl leading-[1.1] mb-6">
          Your most sensitive documents deserve{" "}
          <span className="bg-gradient-to-r from-primary via-emerald-600 to-teal-500 bg-clip-text text-transparent">
            more than a password.
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10">
          Share confidential business information, collaborate with authorized partners and analyze documents using AI backed by verifiable confidential computing.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link href="/app/rooms/new" className="w-full sm:w-auto">
            <Button size="lg" variant="primary" className="w-full sm:w-auto font-semibold shadow-md shadow-primary/25">
              Create a private room
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>

          <Link href="/how-it-works" className="w-full sm:w-auto">
            <Button size="lg" variant="glass" className="w-full sm:w-auto">
              Explore how privacy works
            </Button>
          </Link>
        </div>

        {/* Hero Product Architecture Illustration */}
        <div className="w-full max-w-5xl rounded-3xl glass-panel-elevated p-6 sm:p-8 border border-border shadow-glass-elevated relative overflow-hidden text-left">
          <div className="flex items-center justify-between pb-6 border-b border-border/60 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-muted-foreground ml-2">
                proofroom://workspace/northstar-series-a
              </span>
            </div>
            <SecurityBadge status="VERIFIED" label="Intel TDX Active" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Client Encryption */}
            <div className="p-4 rounded-2xl glass-panel border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary" />
                  Client Browser Enclave
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">AES-256-GCM</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Documents encrypted before upload. DEKs wrapped with recipient X25519 keys.
              </p>
              <div className="p-2 rounded-xl bg-foreground/5 text-[10px] font-mono text-muted-foreground space-y-1">
                <div>founder.testnet (Owner)</div>
                <div>investor.testnet (Authorized)</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Plaintext: Never stored on server</div>
              </div>
            </div>

            {/* Column 2: Intel TDX AI */}
            <div className="p-4 rounded-2xl glass-panel border border-primary/30 space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  NEAR AI Cloud (Intel TDX)
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  TEE Isolated
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Inference runs inside hardware memory-encrypted virtual machine.
              </p>
              <div className="p-2 rounded-xl bg-foreground/5 text-[10px] font-mono text-muted-foreground space-y-1">
                <div>Model: DeepSeek-V3.1 (Confidential)</div>
                <div>MRTD: 0x8fa4b7e9...</div>
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">Hardware Quote: VERIFIED</div>
              </div>
            </div>

            {/* Column 3: NEAR Testnet Anchoring */}
            <div className="p-4 rounded-2xl glass-panel border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-secondary" />
                  NEAR Testnet Commitments
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">On-Chain</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Zero descriptive metadata published. Only opaque hashes and permission receipts.
              </p>
              <div className="p-2 rounded-xl bg-foreground/5 text-[10px] font-mono text-muted-foreground space-y-1">
                <div>Contract: proofroom.testnet</div>
                <div>Receipt: rec-7b4c92...</div>
                <div className="text-secondary font-semibold">State: Tamper-Evident</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Workflow Section */}
      <section className="w-full py-20 border-t border-border bg-foreground/[0.015]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">How ProofRoom Protects Your Data</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              A transparent four-step protocol verifying privacy at every boundary.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl glass-panel border border-border/80 space-y-4 relative group hover:border-primary/40 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold font-mono text-muted-foreground/30 group-hover:text-primary/50 transition-colors">
                      {st.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{st.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Architecture Section */}
      <section className="w-full py-20 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Architecture</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground">Enterprise Security by Design</h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Engineered so that confidentiality does not rely on subjective trust in platform operators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {securityPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl glass-panel-elevated border border-border space-y-3.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-foreground/5 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{pillar.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="w-full py-20 border-t border-border bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Create your first confidential data room
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Experience verifiable virtual data rooms backed by AES-256 browser encryption, NEAR Testnet wallet access, and Intel TDX confidential AI inference.
          </p>
          <div className="pt-2">
            <Link href="/app">
              <Button size="lg" variant="primary" className="font-semibold shadow-lg shadow-primary/25">
                Launch ProofRoom Workspace
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
