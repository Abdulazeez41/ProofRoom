import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { computeSha256 } from "./hashing";

export interface WalletAuthChallenge {
  nonce: string;
  recipient: string;
  message: string;
  timestamp: number;
}

export interface Nep413SignaturePayload {
  accountId: string;
  publicKey: string; // "ed25519:..." or hex/base58
  signature: string; // base64 or hex
  message: string;
  nonce: string;
  recipient: string;
}

/**
 * Creates a single-use NEP-413 compliant challenge for a NEAR account.
 */
export function createAuthChallenge(nearAccountId: string, recipient = "proofroom.testnet"): WalletAuthChallenge {
  const timestamp = Date.now();
  const rawBytes = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(rawBytes);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    rawBytes.set(nodeCrypto.randomBytes(32));
  }
  const nonce = bytesToHex(rawBytes);
  const message = `Sign in to ProofRoom with account ${nearAccountId} (Nonce: ${nonce.substring(0, 8)})`;

  return {
    nonce,
    recipient,
    message,
    timestamp,
  };
}

/**
 * Encodes NEP-413 payload for verification.
 * Standard format:
 * [4-byte tag = 2147484049] [len(message)] [message] [nonce: 32 bytes] [len(recipient)] [recipient] [callbackUrl...]
 */
export function buildNep413MessageHash(
  message: string,
  nonceHex: string,
  recipient: string
): Uint8Array {
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);
  const recipientBytes = encoder.encode(recipient);
  const nonceBytes = hexToBytes(nonceHex.padEnd(64, "0").substring(0, 64));

  // Tag 2147484049 = 0x8000019D in little endian
  const tag = new Uint8Array([0x9d, 0x01, 0x00, 0x80]);

  // Serialized NEP-413 structure
  const totalLength =
    tag.length +
    4 + messageBytes.length +
    32 +
    4 + recipientBytes.length +
    4; // empty callbackUrl length = 0

  const payload = new Uint8Array(totalLength);
  let offset = 0;

  payload.set(tag, offset);
  offset += tag.length;

  // message length (4 bytes LE)
  new DataView(payload.buffer).setUint32(offset, messageBytes.length, true);
  offset += 4;
  payload.set(messageBytes, offset);
  offset += messageBytes.length;

  // nonce (32 bytes)
  payload.set(nonceBytes, offset);
  offset += 32;

  // recipient length (4 bytes LE)
  new DataView(payload.buffer).setUint32(offset, recipientBytes.length, true);
  offset += 4;
  payload.set(recipientBytes, offset);
  offset += recipientBytes.length;

  // callbackUrl len = 0
  new DataView(payload.buffer).setUint32(offset, 0, true);

  return sha256(payload);
}

/**
 * Parses ed25519 public key from NEAR string (e.g., "ed25519:6E8sWVqNQ...")
 */
export function parseNearPublicKey(publicKeyStr: string): Uint8Array {
  const clean = publicKeyStr.replace(/^ed25519:/i, "");

  // If 64-character hex
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    return hexToBytes(clean);
  }

  // Pure Base58 decoding
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const bytes = [0];
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    const val = ALPHABET.indexOf(c);
    if (val < 0) continue;
    for (let j = 0; j < bytes.length; j++) bytes[j] *= 58;
    bytes[0] += val;
    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] += carry;
      carry = bytes[j] >> 8;
      bytes[j] &= 0xff;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  for (let i = 0; clean[i] === "1" && i < clean.length - 1; i++) {
    bytes.push(0);
  }
  return new Uint8Array(bytes.reverse()).slice(0, 32);
}

/**
 * Verifies a NEP-413 or standard signed message from a NEAR wallet.
 */
export function verifyWalletSignature(payload: Nep413SignaturePayload): boolean {
  try {
    const pubKeyBytes = parseNearPublicKey(payload.publicKey);
    if (pubKeyBytes.length !== 32) return false;

    let sigBytes: Uint8Array;
    if (/^[0-9a-fA-F]{128}$/.test(payload.signature)) {
      sigBytes = hexToBytes(payload.signature);
    } else {
      sigBytes = Uint8Array.from(atob(payload.signature), (c) => c.charCodeAt(0));
    }

    if (sigBytes.length !== 64) return false;

    // Check NEP-413 hash
    const nep413Hash = buildNep413MessageHash(payload.message, payload.nonce, payload.recipient);
    if (ed25519.verify(sigBytes, nep413Hash, pubKeyBytes)) {
      return true;
    }

    // Also check direct message hash
    const directHash = sha256(new TextEncoder().encode(payload.message));
    if (ed25519.verify(sigBytes, directHash, pubKeyBytes)) {
      return true;
    }

    return false;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}
