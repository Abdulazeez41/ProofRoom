import { useMemo } from "react";

export type VaultState = "idle" | "encrypting" | "verifying" | "anchored" | "failed";

export interface VaultStateInputs {
  isEncrypting?: boolean;
  uploadProgress?: number;
  verificationStatus?: "VERIFIED" | "FAILED" | "PENDING" | "UNAVAILABLE" | "NOT_CHECKED" | string | null;
  receiptStatus?: "ANCHORED" | "CONFIRMED" | "RECORDED" | "PENDING" | string | null;
  hasError?: boolean;
}

/**
 * Derives vault state according to strict precedence:
 * failed > encrypting > verifying > anchored > idle.
 *
 * Missing evidence or unavailable results do NOT trigger green or verified states.
 */
export function deriveVaultState(inputs?: VaultStateInputs): VaultState {
  if (!inputs) return "idle";

  const { isEncrypting, verificationStatus, receiptStatus, hasError } = inputs;

  // 1. Highest priority: failure (hardware check failed, key mismatch, upload error)
  if (
    hasError ||
    verificationStatus === "FAILED" ||
    verificationStatus === "REVOKED"
  ) {
    return "failed";
  }

  // 2. Client-side encryption in progress
  if (isEncrypting) {
    return "encrypting";
  }

  // 3. Actively verifying hardware attestation or fresh nonce
  if (
    verificationStatus === "PENDING" ||
    verificationStatus === "CHECKING"
  ) {
    return "verifying";
  }

  // 4. Anchored: on-chain receipt recorded and verification verified
  if (
    receiptStatus === "ANCHORED" ||
    receiptStatus === "CONFIRMED" ||
    receiptStatus === "RECORDED"
  ) {
    return "anchored";
  }

  // 5. Default idle
  return "idle";
}

export function useVaultState(inputs?: VaultStateInputs): VaultState {
  return useMemo(() => deriveVaultState(inputs), [
    inputs?.isEncrypting,
    inputs?.uploadProgress,
    inputs?.verificationStatus,
    inputs?.receiptStatus,
    inputs?.hasError,
  ]);
}
