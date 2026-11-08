import React from "react";
import clsx from "clsx";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  radius?: "xl" | "2xl" | "3xl";
  elevation?: "sm" | "md" | "lg";
}

export function GlassCard({
  children,
  className,
  radius = "2xl",
  elevation = "md",
  ...props
}: GlassCardProps) {
  const radiusClasses = {
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
  };

  const elevationClasses = {
    sm: "shadow-sm",
    md: "shadow-md shadow-ink/5",
    lg: "shadow-lg shadow-ink/10",
  };

  return (
    <div
      className={clsx(
        "glass transition-all duration-200",
        radiusClasses[radius],
        elevationClasses[elevation],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
