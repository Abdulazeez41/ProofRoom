"use client";

import React from "react";
import Link from "next/link";
import {
  Lock,
  Cpu,
  FileCheck2,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { VaultHeroHud } from "@/components/vault/VaultHeroHud";

export default function LandingPage() {
  const steps = [
    {
      number: "1",
      title: "Lock your files",
      desc: "Each document is encrypted in your browser using a random AES-256-GCM key before touching the network. Our servers only ever store ciphertext.",
      icon: Lock,
    },
    {
      number: "2",
      title: "Invite someone",
      desc: "Add an investor by their NEAR account ID. The document key is wrapped specifically for their public key and anchored with a Testnet commitment.",
      icon: Users,
    },
    {
      number: "3",
      title: "Ask AI privately",
      desc: "Relevant excerpts are found locally. The investor's question is sent to an Intel TDX enclave where memory is encrypted by CPU hardware.",
      icon: Sparkles,
    },
    {
      number: "4",
      title: "Check the proof",
      desc: "Every response verifies the enclave's quote, fresh nonce, and cryptographic signature before display. An audit receipt anchors to NEAR Testnet.",
      icon: FileCheck2,
    },
  ];

  const trustBadges = [
    { label: "Intel TDX Enclave", status: "VERIFIED" },
    { label: "AES-256-GCM in Browser", status: "VERIFIED" },
    { label: "X25519 Key Envelopes", status: "VERIFIED" },
    { label: "NEAR Testnet Receipts", status: "VERIFIED" },
    { label: "Fail-Closed Protection", status: "VERIFIED" },
  ];

  return (
    <div className="flex flex-col items-center w-full">
      {/* Hero Section */}
      <section className="w-full pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium glass border border-line mb-6">
              <span className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
              <span className="text-ink font-mono">Runs on NEAR Testnet · Intel TDX</span>
            </div>

            {/* H1 Headline */}
            <h1 className="hero-headline text-ink mb-5 text-balance">
              Share your private documents. Prove who can read them.
            </h1>

            {/* Lead Copy */}
            <p className="text-base sm:text-lg text-muted prose-restricted mb-8 text-balance">
              ProofRoom is a secure data room for fundraising and due diligence. Files are locked in
              your browser, AI answers questions inside a checked secure environment, and every step
              leaves a receipt.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link href="/app/rooms/new" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="primary"
                  className="w-full sm:w-auto"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Create a private room
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  See how privacy works
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Stage with HUD */}
          <div className="lg:col-span-6 w-full flex justify-center">
            <VaultHeroHud />
          </div>
        </div>
      </section>

      {/* Trust You Can Inspect Badge Row */}
      <section className="w-full py-8 border-y border-line/60 bg-bg2/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold text-center mb-4">
            Trust you can inspect
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {trustBadges.map((badge, idx) => (
              <SecurityBadge
                key={idx}
                status={badge.status}
                label={badge.label}
                className="bg-solid/80 text-xs py-1.5 px-3"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Step Sequence: From upload to answer in four steps */}
      <section className="w-full py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold">
            How ProofRoom works
          </span>
          <h2 className="section-headline text-ink mt-2 mb-3">
            From upload to answer in four steps
          </h2>
          <p className="text-muted text-sm sm:text-base prose-restricted mx-auto">
            A continuous cryptographic chain from client memory to hardware enclave and on-chain
            receipt.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <GlassCard
                key={step.number}
                radius="2xl"
                className="p-6 flex flex-col justify-between border-line relative hover:border-accent/40 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold font-mono text-accent">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-ink mb-2">{step.title}</h3>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed">{step.desc}</p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </section>

      {/* Honest Disclosure: What ProofRoom protects, and what it can't */}
      <section id="limitations" className="w-full py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Honest boundaries
          </span>
          <h2 className="section-headline text-ink mt-2 mb-3">
            What ProofRoom protects, and what it can't
          </h2>
          <p className="text-muted text-sm sm:text-base prose-restricted mx-auto">
            We don't claim impossible guarantees. Privacy is an engineering discipline with clear,
            verifiable boundaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {/* Protected Column */}
          <GlassCard radius="2xl" className="p-6 sm:p-8 border-ok/30 bg-solid/80">
            <div className="flex items-center gap-2 mb-4 text-ok font-semibold text-base">
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>What is protected</span>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-ink">
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold">✓</span>
                <span>
                  <strong>Client-side encryption:</strong> Documents are encrypted in your browser
                  with AES-256-GCM. Plaintext is never transmitted to our servers or object storage.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold">✓</span>
                <span>
                  <strong>Enclave-isolated AI:</strong> Queries are executed inside an Intel TDX
                  Trust Domain where CPU hardware encrypts runtime memory.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold">✓</span>
                <span>
                  <strong>Fail-closed verification:</strong> If a quote, enclave public key, or
                  nonce check fails, confidential context is immediately withheld.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-ok font-bold">✓</span>
                <span>
                  <strong>Tamper-evident commitments:</strong> Room creation, document hashes, and
                  permission grants are permanently anchored on NEAR Testnet.
                </span>
              </li>
            </ul>
          </GlassCard>

          {/* Not Protected Column */}
          <GlassCard radius="2xl" className="p-6 sm:p-8 border-warn/30 bg-solid/80">
            <div className="flex items-center gap-2 mb-4 text-warn font-semibold text-base">
              <XCircle className="w-5 h-5" aria-hidden="true" />
              <span>What is not protected</span>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-ink">
              <li className="flex items-start gap-2.5">
                <span className="text-warn font-bold">✕</span>
                <span>
                  <strong>Files already downloaded:</strong> Revoking access stops future key
                  retrieval, but cannot erase copies that an authorized user already downloaded to
                  their local computer.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-warn font-bold">✕</span>
                <span>
                  <strong>Recipient screen captures:</strong> Once an authorized person views a
                  document on their monitor, software cannot prevent them from taking a photograph.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-warn font-bold">✕</span>
                <span>
                  <strong>Lost wallet seed phrases:</strong> Account identity and decryption rights
                  depend on wallet key custody.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-warn font-bold">✕</span>
                <span>
                  <strong>Source document inaccuracies:</strong> The AI extracts and interprets what
                  is in your documents; it cannot correct underlying errors in source files.
                </span>
              </li>
            </ul>
          </GlassCard>
        </div>
      </section>

      {/* Final Solid Forest Green CTA Block */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="w-full rounded-3xl bg-accent text-accent-ink p-8 sm:p-12 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="max-w-xl text-left">
            <span className="text-xs uppercase tracking-wider text-accent-ink/75 font-semibold">
              Ready to collaborate
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mt-2 mb-3 text-accent-ink">
              Start your confidential data room today.
            </h2>
            <p className="text-accent-ink/80 text-sm sm:text-base">
              Upload documents with client-side encryption, invite your lead investors, and verify
              the AI environment before asking a single question.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
            <Link href="/app/rooms/new" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl bg-solid text-accent font-semibold hover:bg-solid/90 transition-all text-sm inline-flex items-center justify-center gap-2"
              >
                <span>Create a private room</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </Link>
            <Link href="/connect" className="w-full sm:w-auto">
              <button
                type="button"
                className="w-full sm:w-auto min-h-[44px] px-6 py-3 rounded-xl border border-accent-ink/30 text-accent-ink font-semibold hover:bg-accent-ink/10 transition-all text-sm inline-flex items-center justify-center"
              >
                Connect wallet
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
