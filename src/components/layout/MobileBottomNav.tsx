"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderLock, PlusCircle, ShieldCheck, Settings } from "lucide-react";
import clsx from "clsx";

export function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { label: "Overview", href: "/app", icon: LayoutDashboard },
    { label: "Rooms", href: "/app/rooms", icon: FolderLock },
    { label: "New", href: "/app/rooms/new", icon: PlusCircle },
    { label: "Security", href: "/app/security", icon: ShieldCheck },
    { label: "Settings", href: "/app/settings", icon: Settings },
  ];

  return (
    <nav
      aria-label="Mobile navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass bg-solid/95 border-t border-line px-2 py-1 flex items-center justify-around safe-bottom"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/app" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center justify-center p-2 rounded-xl text-[11px] font-medium transition-colors touch-target min-w-[56px]",
              isActive
                ? "text-accent font-semibold"
                : "text-muted hover:text-ink"
            )}
          >
            <Icon className="w-5 h-5 mb-0.5" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
