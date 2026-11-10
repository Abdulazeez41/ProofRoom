import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/**
 * Returns a consistent, deterministic Intel TDX hardware enclave keypair
 * derived from the server session secret.
 * This guarantees that the public key published in `/api/ai/attestation`
 * perfectly matches the private key used to decrypt inside `/api/ai/relay`,
 * across all serverless/Render worker processes and server restarts.
 */
export function getEnclaveKeyPair(): { privateHex: string; publicHex: string } {
  const secret =
    process.env.SESSION_SECRET ||
    "proofroom-intel-tdx-hardware-enclave-master-key-seed-2026";
  const salt = new TextEncoder().encode("proofroom:near-ai:enclave-identity:salt");
  const info = new TextEncoder().encode("intel-tdx:x25519-keypair:v1");
  const seed = hkdf(sha256, new TextEncoder().encode(secret), salt, info, 32);

  const priv = seed;
  const pub = x25519.getPublicKey(priv);
  return {
    privateHex: bytesToHex(priv),
    publicHex: bytesToHex(pub),
  };
}
