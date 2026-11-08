"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Check, LogOut, ExternalLink, Menu, X } from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { ThemeToggle } from "./ThemeToggle";
import { TestnetPill } from "../ui/Badge";
import { getExplorerAccountUrl } from "@/lib/near/config";
import clsx from "clsx";

export function Navbar() {
  const pathname = usePathname();
  const { accountId, isConnected, disconnectWallet, switchAccount } = useWallet();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: "How it works", href: "/how-it-works" },
    { label: "Security", href: "/security" },
    { label: "What we don’t promise", href: "/#limits" },
    { label: "Workspace", href: "/app" },
  ];

  return (
    <nav className="sticky top-0 z-50 max-w-[1240px] mx-auto w-full pt-3 px-3 sm:px-5">
      <div className="bar glass flex items-center justify-between gap-4 p-2 sm:px-4 rounded-[18px] transition-colors">
        {/* Brand Logo */}
        <Link href="/" className="logo flex items-center gap-2.5 font-bold tracking-tight text-ink text-base">
          <i
            aria-hidden="true"
            className="w-7 h-7 rounded-[9px] bg-accent text-accent-ink grid place-items-center not-italic text-sm font-bold shadow-sm"
          >
            ◈
          </i>
          <span>ProofRoom</span>
        </Link>

        {/* Desktop Links */}
        <div className="links hidden md:flex items-center gap-5 text-sm text-muted">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && !link.href.includes("#") && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "hover:text-ink transition-colors",
                  isActive ? "text-ink font-semibold" : ""
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Controls: Network Pill, Theme, Wallet */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isConnected && <TestnetPill className="hidden sm:inline-flex" />}

          <ThemeToggle />

          {isConnected ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className="btn text-xs font-semibold font-mono py-2 px-3 gap-1.5"
                aria-expanded={walletDropdownOpen}
              >
                <span className="w-2 h-2 rounded-full bg-ok" aria-hidden="true" />
                <span className="truncate max-w-[120px]">{accountId}</span>
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
            <Link href="/connect" className="btn primary">
              Connect wallet
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-ink hover:bg-line/15 touch-target flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl glass border border-line bg-solid/95 space-y-3">
          {isConnected && (
            <div className="pb-2 border-b border-line flex items-center justify-between">
              <span className="text-xs font-mono text-ink truncate">{accountId}</span>
              <TestnetPill />
            </div>
          )}
          <div className="flex flex-col space-y-1 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-xl hover:bg-line/15 text-ink"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
