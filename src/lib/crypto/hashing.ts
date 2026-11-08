import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Computes SHA-256 hex digest of any string or Uint8Array.
 */
export function computeSha256(data: string | Uint8Array): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return bytesToHex(sha256(bytes));
}

/**
 * Computes SHA-256 digest returning raw Uint8Array.
 */
export function computeSha256Bytes(data: string | Uint8Array): Uint8Array {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  return sha256(bytes);
}

/**
 * Computes opaque room commitment: SHA-256(roomId + ":" + salt)
 */
export function computeRoomCommitment(roomId: string, salt: string): string {
  return computeSha256(`proofroom:room:${roomId}:${salt}`);
}

/**
 * Computes participant commitment: SHA-256(nearAccountId + ":" + roomId)
 */
export function computeParticipantCommitment(nearAccountId: string, roomId: string): string {
  return computeSha256(`proofroom:participant:${nearAccountId.toLowerCase()}:${roomId}`);
}

/**
 * Computes permission commitment: SHA-256(participantCommitment + ":" + role + ":" + expiresAt)
 */
export function computePermissionCommitment(
  participantCommitment: string,
  role: string,
  expiresAt: number | null
): string {
  return computeSha256(`proofroom:perm:${participantCommitment}:${role}:${expiresAt ?? 0}`);
}

/**
 * Computes AI activity receipt hash.
 */
export function computeReceiptHash(
  roomId: string,
  queryId: string,
  requestHash: string,
  responseHash: string,
  verificationStatus: string
): string {
  return computeSha256(
    `proofroom:receipt:${roomId}:${queryId}:${requestHash}:${responseHash}:${verificationStatus}`
  );
}
