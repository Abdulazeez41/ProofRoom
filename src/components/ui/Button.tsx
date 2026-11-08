import React from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "glass";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  icon,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

  const sizes = {
    sm: "text-xs px-3 py-1.5 rounded-lg gap-1.5",
    md: "text-sm px-4 py-2 rounded-xl gap-2",
    lg: "text-base px-6 py-3 rounded-2xl gap-2.5",
  };

  const variants = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm shadow-primary/20",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm shadow-secondary/20",
    outline:
      "border border-border bg-transparent hover:bg-foreground/5 text-foreground",
    ghost:
      "bg-transparent hover:bg-foreground/5 text-foreground",
    danger:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm shadow-destructive/20",
    glass:
      "glass-panel hover:bg-surface-elevated text-foreground border-border shadow-glass hover:shadow-glass-elevated",
  };

  return (
    <button
      className={clsx(baseStyles, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        icon && <span className="inline-flex shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}
