import React from "react";
import { CheckCircle2, AlertTriangle, Clock, Ban, HelpCircle, Shield } from "lucide-react";
import clsx from "clsx";

export type SecurityStatus =
  | "VERIFIED"
  | "FAILED"
  | "PENDING"
  | "UNAVAILABLE"
  | "NOT_CHECKED"
  | "ACTIVE"
  | "REVOKED"
  | string;

interface BadgeProps {
  status: SecurityStatus;
  label?: string;
  className?: string;
  showIcon?: boolean;
}

export function SecurityBadge({ status, label, className, showIcon = true }: BadgeProps) {
  const norm = (status || "").toUpperCase();

  let styles = "bg-muted/10 text-muted border-line";
  let icon = <HelpCircle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />;
  let displayLabel = label || "Not checked";

  switch (norm) {
    case "VERIFIED":
    case "ACTIVE":
      styles = "bg-ok/10 text-ok border-ok/25";
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-ok shrink-0" aria-hidden="true" />;
      displayLabel = label || (norm === "ACTIVE" ? "Active" : "Verified");
      break;
    case "FAILED":
    case "REVOKED":
      styles = "bg-bad/10 text-bad border-bad/25";
      icon = <AlertTriangle className="w-3.5 h-3.5 text-bad shrink-0" aria-hidden="true" />;
      displayLabel = label || (norm === "REVOKED" ? "Revoked" : "Failed");
      break;
    case "PENDING":
    case "CHECKING":
      styles = "bg-warn/10 text-warn border-warn/25";
      icon = <Clock className="w-3.5 h-3.5 text-warn shrink-0 animate-spin" aria-hidden="true" />;
      displayLabel = label || "Pending";
      break;
    case "UNAVAILABLE":
      styles = "bg-muted/15 text-muted border-line";
      icon = <Ban className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />;
      displayLabel = label || "Unavailable";
      break;
    case "NOT_CHECKED":
    default:
      styles = "bg-muted/10 text-muted border-line";
      icon = <HelpCircle className="w-3.5 h-3.5 text-muted shrink-0" aria-hidden="true" />;
      displayLabel = label || "Not checked";
      break;
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
        styles,
        className
      )}
    >
      {showIcon && icon}
      <span>{displayLabel}</span>
    </span>
  );
}

export function TestnetPill({ className = "" }: { className?: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-info/10 text-info border border-info/20",
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-info animate-pulse" aria-hidden="true" />
      <span>NEAR Testnet</span>
    </span>
  );
}
