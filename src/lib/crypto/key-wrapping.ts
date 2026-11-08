import { x25519 } from "@noble/curves/ed25519.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { bytesToBase64, base64ToBytes } from "./aes-gcm";

export interface KeyEnvelope {
  ephemeralPublicKeyHex: string;
  ivHex: string;
  wrappedKeyBase64: string;
  recipientPublicKeyHex: string;
}

export interface KeyPair {
  publicKeyHex: string;
  privateKeyHex: string;
}

/**
 * Generates an X25519 encryption keypair for a user.
 * The private key stays strictly in client-side memory or local encrypted storage.
 */
export function generateUserEncryptionKeyPair(): KeyPair {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKeyHex: bytesToHex(privateKey),
    publicKeyHex: bytesToHex(publicKey),
  };
}

/**
 * Derives an X25519 public key from a private key.
 */
export function getPublicKeyFromPrivate(privateKeyHex: string): string {
  const privateKey = hexToBytes(privateKeyHex);
  const publicKey = x25519.getPublicKey(privateKey);
  return bytesToHex(publicKey);
}

/**
 * Wraps a 256-bit Document Encryption Key (DEK) for a specific recipient's X25519 public key.
 */
export async function createKeyEnvelope(
  dek: Uint8Array,
  recipientPublicKeyHex: string
): Promise<KeyEnvelope> {
  const recipientPublicKey = hexToBytes(recipientPublicKeyHex);
  const ephemeralPrivateKey = x25519.utils.randomSecretKey();
  const ephemeralPublicKey = x25519.getPublicKey(ephemeralPrivateKey);

  // Compute ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(ephemeralPrivateKey, recipientPublicKey);

  // Derive 256-bit wrapping key via HKDF-SHA256
  const salt = new Uint8Array(32); // zeros or context salt
  const info = new TextEncoder().encode("proofroom:envelope:aes256gcm:v1");
  const wrappingKeyBytes = hkdf(sha256, sharedSecret, salt, info, 32);

  // Encrypt DEK with wrapping key via AES-256-GCM
  const iv = new Uint8Array(12);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(iv);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    iv.set(nodeCrypto.randomBytes(12));
  }

  let cryptoSubtle: SubtleCrypto;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    cryptoSubtle = window.crypto.subtle;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webcrypto } = require("crypto");
    cryptoSubtle = webcrypto.subtle;
  }

  const cryptoKey = await cryptoSubtle.importKey(
    "raw",
    wrappingKeyBytes as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encryptedDEK = await cryptoSubtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    cryptoKey,
    dek as BufferSource
  );

  return {
    ephemeralPublicKeyHex: bytesToHex(ephemeralPublicKey),
    ivHex: bytesToHex(iv),
    wrappedKeyBase64: bytesToBase64(new Uint8Array(encryptedDEK)),
    recipientPublicKeyHex,
  };
}

/**
 * Unwraps an encrypted key envelope using the recipient's X25519 private key.
 * Returns the raw 256-bit DEK.
 */
export async function unwrapKeyEnvelope(
  envelope: KeyEnvelope,
  recipientPrivateKeyHex: string
): Promise<Uint8Array> {
  const recipientPrivateKey = hexToBytes(recipientPrivateKeyHex);
  const ephemeralPublicKey = hexToBytes(envelope.ephemeralPublicKeyHex);

  // Compute ECDH shared secret
  const sharedSecret = x25519.getSharedSecret(recipientPrivateKey, ephemeralPublicKey);

  // Derive wrapping key using the exact same HKDF parameters
  const salt = new Uint8Array(32);
  const info = new TextEncoder().encode("proofroom:envelope:aes256gcm:v1");
  const wrappingKeyBytes = hkdf(sha256, sharedSecret, salt, info, 32);

  const iv = hexToBytes(envelope.ivHex);
  const ciphertextWithTag = base64ToBytes(envelope.wrappedKeyBase64);

  let cryptoSubtle: SubtleCrypto;
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    cryptoSubtle = window.crypto.subtle;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webcrypto } = require("crypto");
    cryptoSubtle = webcrypto.subtle;
  }

  const cryptoKey = await cryptoSubtle.importKey(
    "raw",
    wrappingKeyBytes as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const decryptedDEK = await cryptoSubtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource, tagLength: 128 },
    cryptoKey,
    ciphertextWithTag as BufferSource
  );

  return new Uint8Array(decryptedDEK);
}
