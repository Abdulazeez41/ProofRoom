"use client";

import React, { Component, ReactNode, Suspense } from "react";
import dynamic from "next/dynamic";
import { VaultState } from "@/hooks/useVaultState";
import { VaultFallback } from "./VaultFallback";

const VaultCanvas = dynamic(() => import("./VaultCanvas"), {
  ssr: false,
  loading: () => <VaultFallback state="idle" size="hero" />,
});

interface ErrorBoundaryProps {
  fallback: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGlErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("VaultScene WebGL fallback engaged:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export interface VaultSceneProps {
  state: VaultState;
  size?: "hero" | "mini" | "inline";
  className?: string;
}

export function VaultScene({
  state = "idle",
  size = "hero",
  className = "",
}: VaultSceneProps) {
  const fallback = <VaultFallback state={state} size={size} className={className} />;

  return (
    <WebGlErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <VaultCanvas state={state} size={size} className={className} />
      </Suspense>
    </WebGlErrorBoundary>
  );
}
