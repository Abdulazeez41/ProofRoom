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
    <nav className="sticky top-0 z-50 w-full h-16 border-b border-line glass bg-solid/90 backdrop-blur-md transition-colors flex items-center">
      <div className="w-full flex items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">
        {/* Brand Logo */}
        <Link href="/" className="logo flex items-center gap-2 sm:gap-2.5 font-bold tracking-tight text-ink text-sm sm:text-base shrink-0">
          <i
            aria-hidden="true"
            className="w-7 h-7 rounded-[9px] bg-accent text-accent-ink grid place-items-center not-italic text-sm font-bold shadow-sm shrink-0"
          >
            ◈
          </i>
          <span>ProofRoom</span>
        </Link>

        {/* Desktop Links */}
        <div className="links hidden md:flex items-center gap-5 lg:gap-7 text-sm text-muted">
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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isConnected && <TestnetPill className="hidden sm:inline-flex" />}

          <ThemeToggle />

          {isConnected ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                className="btn text-xs font-semibold font-mono py-1.5 px-2.5 sm:py-2 sm:px-3 gap-1.5 min-h-[38px] sm:min-h-[44px]"
                aria-expanded={walletDropdownOpen}
              >
                <span className="w-2 h-2 rounded-full bg-ok shrink-0" aria-hidden="true" />
                <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-[180px]">{accountId}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />
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
            <Link
              href="/connect"
              className="btn primary text-xs sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4 min-h-[38px] sm:min-h-[44px]"
            >
              <span className="hidden sm:inline">Connect wallet</span>
              <span className="sm:hidden">Connect</span>
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-ink hover:bg-line/15 min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 w-full border-b border-line glass bg-solid/98 shadow-xl p-4 sm:p-6 space-y-3 z-50">
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
