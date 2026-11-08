"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Lock, Wallet, Menu, X, ChevronDown, Check, ArrowRight, Activity } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "../ui/Button";
import clsx from "clsx";

export function Navbar() {
  const pathname = usePathname();
  const { accountId, isConnected, connectWallet, disconnectWallet, switchAccount } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const navLinks = [
    { label: "Product", href: "/" },
    { label: "Security", href: "/security" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Workspace", href: "/app" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-glass bg-surface border-b border-border transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 fill-current/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg tracking-tight leading-none text-foreground flex items-center gap-1.5">
              ProofRoom
              <span className="text-[10px] font-medium tracking-wide uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                TDX
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground tracking-tight font-normal">
              Private intelligence. Verifiable trust.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-foreground/5 text-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Network Indicator, Wallet, Theme Toggle */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Testnet Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>NEAR Testnet</span>
          </div>

          <ThemeToggle />

          {/* Wallet Button / Account Menu */}
          {isConnected && accountId ? (
            <div className="relative">
              <button
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border glass-panel hover:bg-surface-elevated text-xs font-medium transition-all"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-mono">{accountId}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>

              {walletDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl p-2 glass-panel-elevated shadow-glass-elevated border border-border z-50 text-xs">
                  <div className="px-3 py-2 border-b border-border/50 mb-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">Active Account</p>
                    <p className="font-mono font-medium truncate text-foreground">{accountId}</p>
                  </div>

                  <p className="px-3 py-1.5 text-[10px] text-muted-foreground uppercase font-semibold">Switch Persona</p>
                  <button
                    onClick={() => {
                      switchAccount("founder.testnet");
                      setWalletDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-foreground/5 text-left transition-colors"
                  >
                    <span>founder.testnet (Owner)</span>
                    {accountId === "founder.testnet" && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                  <button
                    onClick={() => {
                      switchAccount("investor.testnet");
                      setWalletDropdownOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-foreground/5 text-left transition-colors"
                  >
                    <span>investor.testnet (Auditor)</span>
                    {accountId === "investor.testnet" && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>

                  <div className="border-t border-border/50 mt-1 pt-1">
                    <button
                      onClick={() => {
                        disconnectWallet();
                        setWalletDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors font-medium"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              size="sm"
              variant="primary"
              icon={<Wallet className="w-3.5 h-3.5" />}
              onClick={() => connectWallet("founder.testnet")}
            >
              Connect Wallet
            </Button>
          )}

          <Link href="/app">
            <Button size="sm" variant="glass" icon={<ArrowRight className="w-3.5 h-3.5" />}>
              Open Room
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-foreground hover:bg-foreground/5 border border-border"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden px-4 pt-2 pb-6 border-t border-border bg-surface-elevated backdrop-blur-xl">
          <div className="flex flex-col gap-2 pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-medium hover:bg-foreground/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-muted-foreground">Network</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">NEAR Testnet</span>
              </div>

              {isConnected ? (
                <div className="flex flex-col gap-2">
                  <div className="p-2 rounded-xl bg-foreground/5 text-xs font-mono">
                    Connected: {accountId}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchAccount("founder.testnet")}
                    >
                      As Founder
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => switchAccount("investor.testnet")}
                    >
                      As Investor
                    </Button>
                  </div>
                  <Button size="sm" variant="danger" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  size="md"
                  variant="primary"
                  icon={<Wallet className="w-4 h-4" />}
                  onClick={() => {
                    connectWallet("founder.testnet");
                    setMobileMenuOpen(false);
                  }}
                >
                  Connect NEAR Wallet
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
