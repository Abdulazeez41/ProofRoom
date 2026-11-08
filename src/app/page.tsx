"use client";

import React from "react";
import Link from "next/link";
import { VaultHeroHud } from "@/components/vault/VaultHeroHud";

export default function LandingPage() {
  return (
    <main id="top" className="wrap">
      {/* Hero Section matching prototype 1:1 */}
      <div className="hero">
        <div>
          <span className="pill glass">
            <span className="dot" style={{ background: "var(--ok)" }} />
            <span>Runs on NEAR Testnet · Intel TDX</span>
          </span>

          <h1>
            Share your private documents. Prove who can read them.
          </h1>

          <p className="lead">
            ProofRoom is a secure data room for fundraising and due diligence. Files are locked in
            your browser, AI answers questions inside a checked secure environment, and every step
            leaves a receipt.
          </p>

          <div className="cta">
            <Link className="btn primary" href="/app/rooms/new">
              Create a private room
            </Link>
            <Link className="btn" href="#trust">
              See how privacy works
            </Link>
          </div>
        </div>

        {/* 3D Stage with HUD */}
        <VaultHeroHud />
      </div>

      {/* Four Steps Section */}
      <section id="how" className="py-14 sm:py-16">
        <h2 className="text-ink font-bold tracking-tight mb-3">
          From upload to answer in four steps
        </h2>
        <p className="sub text-muted text-sm sm:text-base mb-7 max-w-[56ch]">
          Everything you see in the 3D room above maps to a real step in the app.
        </p>

        <ol className="steps">
          <li className="glass">
            <b className="text-ink font-semibold">Lock your files</b>
            <span className="text-muted">
              Documents are encrypted in your browser. Only scrambled data is stored.
            </span>
          </li>
          <li className="glass">
            <b className="text-ink font-semibold">Invite someone</b>
            <span className="text-muted">
              Add an investor by NEAR account. Set what they can see and for how long.
            </span>
          </li>
          <li className="glass">
            <b className="text-ink font-semibold">Ask AI privately</b>
            <span className="text-muted">
              Questions go to NEAR AI Cloud in encrypted form, with sources attached to each answer.
            </span>
          </li>
          <li className="glass">
            <b className="text-ink font-semibold">Check the proof</b>
            <span className="text-muted">
              See the hardware check and the receipt. If a check fails, nothing is sent.
            </span>
          </li>
        </ol>
      </section>

      {/* Trust Badges Section */}
      <section id="trust" className="py-14 sm:py-16">
        <h2 className="text-ink font-bold tracking-tight mb-3">Trust you can inspect</h2>
        <p className="sub text-muted text-sm sm:text-base mb-7 max-w-[56ch]">
          Each promise is backed by something you can open and read.
        </p>
        <div className="badges">
          <span className="b">Browser-side AES-256 encryption</span>
          <span className="b">Wallet-controlled access</span>
          <span className="b">Intel TDX attestation</span>
          <span className="b">Signed AI responses</span>
          <span className="b">Receipts on NEAR Testnet</span>
        </div>
      </section>

      {/* Limitations Section */}
      <section id="limits" className="py-14 sm:py-16">
        <h2 className="text-ink font-bold tracking-tight mb-3">
          What ProofRoom protects, and what it can’t
        </h2>
        <p className="sub text-muted text-sm sm:text-base mb-7 max-w-[56ch]">
          We say this plainly because trust starts with honest limits.
        </p>
        <div className="split">
          <div className="card-split glass yes">
            <h3 className="text-ink font-semibold mb-2.5">Protected</h3>
            <ul>
              <li data-m="✓">Files stored in the cloud stay encrypted</li>
              <li data-m="✓">Only people you approve receive keys</li>
              <li data-m="✓">AI runs in an attested secure environment</li>
              <li data-m="✓">Receipts can’t be quietly edited later</li>
            </ul>
          </div>
          <div className="card-split glass no">
            <h3 className="text-ink font-semibold mb-2.5">Not protected</h3>
            <ul>
              <li data-m="!">An approved person copying what they saw</li>
              <li data-m="!">A device with malware or screen recording</li>
              <li data-m="!">Files already downloaded before access ends</li>
              <li data-m="!">AI mistakes. Always check the cited sources</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Final Solid Forest Green CTA Block */}
      <section className="py-14 sm:py-16">
        <div className="final">
          <h2 className="text-accent-ink font-bold tracking-tight mb-3">
            Create your first confidential data room.
          </h2>
          <p className="text-accent-ink/90 text-sm sm:text-base mb-6 max-w-[48ch]">
            Connect a NEAR Testnet wallet, drop in a file, and watch it lock.
          </p>
          <Link className="btn" href="/connect">
            Connect wallet
          </Link>
        </div>
      </section>

      {/* Footer without forbidden words */}
      <footer className="text-center py-10 text-muted text-sm border-t border-line/40 mt-8">
        ProofRoom · Private intelligence. Verifiable trust. · Testnet only
      </footer>
    </main>
  );
}
