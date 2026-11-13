"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderLock,
  ShieldCheck,
  Settings,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useWallet } from "@/context/WalletContext";
import { TestnetPill } from "@/components/ui/Badge";
import { getExplorerAccountUrl } from "@/lib/near/config";
import clsx from "clsx";

export function AppSidebar() {
  const pathname = usePathname();
  const { accountId, isConnected } = useWallet();

  const links = [
    { label: "Overview", href: "/app", icon: LayoutDashboard },
    { label: "Rooms", href: "/app/rooms", icon: FolderLock },
    { label: "Security center", href: "/app/security", icon: ShieldCheck },
    { label: "Settings", href: "/app/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-line glass h-[calc(100vh-4rem)] sticky top-16 hidden lg:flex flex-col justify-between p-4 transition-colors">
      <div className="space-y-6">
        {/* Navigation list */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
              Workspace
            </span>
            <Link
              href="/app/rooms/new"
              className="p-1 rounded-lg text-muted hover:text-ink hover:bg-line/20 transition-colors"
              title="Create new room"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">Create room</span>
            </Link>
          </div>

          {links.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/app" && !item.href.includes("?") && pathname.startsWith(item.href));

            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors touch-target",
                  isActive
                    ? "bg-accent text-accent-ink font-semibold"
                    : "text-muted hover:text-ink hover:bg-line/15"
                )}
              >
                <Icon
                  className={clsx(
                    "w-4 h-4 shrink-0",
                    isActive ? "text-accent-ink" : "text-muted"
                  )}
                  aria-hidden="true"
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Security Quick Status Indicator */}
        <div className="p-3.5 rounded-2xl glass border border-line space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-ink">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-ok" aria-hidden="true" />
              <span>Intel TDX Enclave</span>
            </span>
            <span className="text-[10px] text-ok bg-ok/10 px-1.5 py-0.5 rounded border border-ok/20">
              Active
            </span>
          </div>
          <p className="text-[11px] text-muted leading-tight">
            Cryptographic receipts anchor to NEAR block state.
          </p>
        </div>
      </div>

      {/* Bottom Wallet & Testnet Badge Section */}
      <div className="pt-3 border-t border-line space-y-2">
        <div className="flex items-center justify-between">
          <TestnetPill />
          {accountId && (
            <a
              href={getExplorerAccountUrl(accountId)}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-muted hover:text-ink inline-flex items-center gap-0.5"
              title="View on NEAR Explorer"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </div>

        {isConnected && accountId ? (
          <div className="px-3 py-2 rounded-xl glass border border-line">
            <p className="text-[10px] uppercase text-muted font-mono">Connected</p>
            <p className="text-xs font-mono font-semibold text-ink truncate">{accountId}</p>
          </div>
        ) : (
          <Link href="/connect" className="block">
            <div className="px-3 py-2 rounded-xl border border-dashed border-line text-xs text-center text-muted hover:text-ink hover:border-accent">
              Connect wallet
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
