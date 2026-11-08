"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderLock,
  PlusCircle,
  ShieldCheck,
  Settings,
  User,
  ExternalLink,
  ArrowRightLeft,
  FileCheck2,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { getExplorerAccountUrl } from "@/lib/near/config";
import clsx from "clsx";

export function AppSidebar() {
  const pathname = usePathname();
  const { accountId, isConnected, switchAccount } = useWallet();

  const links = [
    { label: "Overview", href: "/app", icon: LayoutDashboard },
    { label: "My Rooms", href: "/app/rooms", icon: FolderLock },
    { label: "Create Room", href: "/app/rooms/new", icon: PlusCircle },
    { label: "Security Center", href: "/app/security", icon: ShieldCheck },
    { label: "Settings", href: "/app/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-border bg-surface backdrop-blur-xl h-[calc(100vh-4rem)] sticky top-16 hidden lg:flex flex-col justify-between p-4 transition-colors">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Workspace
          </p>
          {links.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                )}
              >
                <Icon className={clsx("w-4 h-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Security Quick Status Card */}
        <div className="p-3.5 rounded-2xl glass-panel border border-border space-y-2.5 text-xs">
          <div className="flex items-center justify-between font-semibold">
            <span className="flex items-center gap-1.5 text-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Confidential Guard
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-muted-foreground leading-relaxed text-[11px]">
            AES-256-GCM client encryption active. Hardware attestation verified on Intel TDX.
          </p>
          <div className="pt-1 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Fail-Closed Policy</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">ENFORCED</span>
          </div>
        </div>
      </div>

      {/* Bottom Profile / Wallet Status */}
      <div className="p-3 rounded-2xl glass-panel border border-border space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
            Connected Wallet
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Testnet
          </span>
        </div>

        {isConnected && accountId ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-1">
              <span className="font-mono font-medium truncate text-foreground">{accountId}</span>
              <a
                href={getExplorerAccountUrl(accountId)}
                target="_blank"
                rel="noreferrer"
                title="View on NEAR Explorer"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() =>
                  switchAccount(accountId === "founder.testnet" ? "investor.testnet" : "founder.testnet")
                }
                className="w-full flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-[11px] font-medium transition-colors"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>
                  Switch to {accountId === "founder.testnet" ? "investor.testnet" : "founder.testnet"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-[11px]">No wallet connected</p>
        )}
      </div>
    </aside>
  );
}
