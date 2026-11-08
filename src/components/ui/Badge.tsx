import React from "react";
import { ShieldCheck, ShieldAlert, Clock, AlertCircle, HelpCircle } from "lucide-react";
import clsx from "clsx";

export type SecurityStatus = "VERIFIED" | "FAILED" | "PENDING" | "UNAVAILABLE" | "NOT_CHECKED" | "ACTIVE" | "REVOKED";

interface BadgeProps {
  status: SecurityStatus | string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function SecurityBadge({ status, label, className, showIcon = true }: BadgeProps) {
  const norm = (status || "").toUpperCase();

  let styles = "bg-muted/10 text-muted-foreground border-muted/20";
  let icon = <HelpCircle className="w-3.5 h-3.5" />;
  let displayLabel = label || status;

  switch (norm) {
    case "VERIFIED":
    case "ACTIVE":
      styles = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";
      icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
      displayLabel = label || (norm === "ACTIVE" ? "Active" : "Verified");
      break;
    case "FAILED":
    case "REVOKED":
      styles = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25";
      icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
      displayLabel = label || (norm === "REVOKED" ? "Revoked" : "Failed");
      break;
    case "PENDING":
      styles = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25";
      icon = <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />;
      displayLabel = label || "Pending";
      break;
    case "UNAVAILABLE":
      styles = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25";
      icon = <AlertCircle className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
      displayLabel = label || "Unavailable";
      break;
    case "NOT_CHECKED":
      styles = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
      icon = <HelpCircle className="w-3.5 h-3.5" />;
      displayLabel = label || "Not Checked";
      break;
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm transition-colors",
        styles,
        className
      )}
    >
      {showIcon && icon}
      <span>{displayLabel}</span>
    </span>
  );
}
