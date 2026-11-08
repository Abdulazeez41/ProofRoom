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
    "min-h-[44px] inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-info focus-visible:ring-offset-[3px] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";

  const sizes = {
    sm: "text-xs px-3.5 py-2 gap-1.5",
    md: "text-sm px-4 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
  };

  const variants = {
    primary:
      "bg-accent text-accent-ink hover:opacity-90 shadow-sm",
    secondary:
      "bg-bg2 text-ink hover:bg-line/25 border border-line",
    outline:
      "border border-line bg-transparent hover:bg-line/20 text-ink",
    ghost:
      "bg-transparent hover:bg-line/20 text-ink",
    danger:
      "bg-bad text-solid hover:opacity-90",
    glass:
      "glass text-ink hover:bg-solid/90 shadow-sm",
  };

  return (
    <button
      className={clsx(baseStyles, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
      ) : (
        icon && <span className="inline-flex shrink-0" aria-hidden="true">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
}
