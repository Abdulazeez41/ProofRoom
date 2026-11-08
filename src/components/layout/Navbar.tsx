"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Wallet, Menu, X, ChevronDown, Check, LogOut, ArrowUpRight } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/Button";
import { TestnetPill } from "../ui/Badge";
import clsx from "clsx";

export function Navbar() {
  const pathname = usePathname();
  const { accountId, isConnected, disconnectWallet, switchAccount } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const navLinks = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Security", href: "/security" },
    { label: "What we don't promise", href: "/#limitations" },
    { label: "Workspace", href: "/app" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-line transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group touch-target">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-accent-ink shadow-sm group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 fill-current/20" aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-base tracking-tight leading-none text-ink flex items-center gap-1.5">
              ProofRoom
              <span className="text-[10px] font-medium tracking-wide px-1.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                Intel TDX
              </span>
            </span>
            <span className="text-[11px] text-muted tracking-tight">
              Private intelligence. Verifiable trust.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && !link.href.includes("#") && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3.5 py-2 rounded-xl text-sm font-medium transition-colors touch-target inline-flex items-center",
                  isActive
                    ? "bg-line/20 text-ink font-semibold"
                    : "text-muted hover:text-ink hover:bg-line/15"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Testnet indicator, Wallet status, Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* HARD RULE #5: Testnet indicator visible whenever connected */}
          {isConnected && <TestnetPill />}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Wallet Button */}
          {isConnected ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass border border-line text-xs font-medium text-ink hover:bg-solid transition-colors min-h-[44px]"
                aria-expanded={walletDropdownOpen}
              >
                <div className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
                <span className="font-mono">{accountId}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
              </button>

              {walletDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass border border-line shadow-lg p-2 z-50 bg-solid">
                  <div className="px-3 py-2 border-b border-line mb-1">
                    <p className="text-[11px] text-muted">Connected NEAR Account</p>
                    <p className="text-xs font-mono font-medium text-ink truncate">{accountId}</p>
                  </div>
                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        switchAccount("founder.testnet");
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-line/15 flex items-center justify-between text-ink min-h-[36px]"
                    >
                      <span>founder.testnet</span>
                      {accountId === "founder.testnet" && (
                        <Check className="w-3.5 h-3.5 text-ok" aria-hidden="true" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        switchAccount("investor.testnet");
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs rounded-xl hover:bg-line/15 flex items-center justify-between text-ink min-h-[36px]"
                    >
                      <span>investor.testnet</span>
                      {accountId === "investor.testnet" && (
                        <Check className="w-3.5 h-3.5 text-ok" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div className="pt-1 border-t border-line">
                    <button
                      type="button"
                      onClick={() => {
                        disconnectWallet();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-bad rounded-xl hover:bg-bad/10 flex items-center gap-2 min-h-[36px]"
                    >
                      <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Disconnect wallet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/connect">
              <Button size="sm" variant="primary" icon={<Wallet className="w-4 h-4" />}>
                Connect wallet
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="p-2 rounded-xl border border-line text-ink hover:bg-line/15 touch-target flex items-center justify-center"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-line glass bg-solid/95 p-4 space-y-3">
          {isConnected && (
            <div className="pb-2 border-b border-line flex items-center justify-between">
              <span className="text-xs font-mono text-ink truncate">{accountId}</span>
              <TestnetPill />
            </div>
          )}
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-line/20 touch-target flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ArrowUpRight className="w-4 h-4 text-muted" aria-hidden="true" />
              </Link>
            ))}
          </nav>
          <div className="pt-2 border-t border-line">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-bad border-bad/30"
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
              >
                Disconnect wallet
              </Button>
            ) : (
              <Link href="/connect" onClick={() => setMobileMenuOpen(false)} className="w-full block">
                <Button size="sm" variant="primary" className="w-full">
                  Connect wallet
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
