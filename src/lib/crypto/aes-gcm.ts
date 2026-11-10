import { computeSha256 } from "./hashing";

export interface EncryptedDocumentPayload {
  ciphertext: Uint8Array;
  iv: Uint8Array;
  ciphertextHash: string;
  byteLength: number;
}

/**
 * Generates a cryptographically secure 256-bit Data Encryption Key (DEK).
 */
export function generateDataEncryptionKey(): Uint8Array {
  const key = new Uint8Array(32);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(key);
  } else {
    // Node.js fallback using crypto
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("crypto");
    const random = nodeCrypto.randomBytes(32);
    key.set(random);
  }
  return key;
}

/**
 * Encrypts arbitrary document plaintext bytes using AES-256-GCM.
 * The backend never receives the plaintext or the unwrapped DEK.
 */
export async function encryptDocumentBytes(
  plaintext: Uint8Array,
  dek: Uint8Array
): Promise<EncryptedDocumentPayload> {
  const iv = new Uint8Array(12); // 96-bit standard GCM nonce
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
    dek as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const encryptedBuffer = await cryptoSubtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      tagLength: 128,
    },
    cryptoKey,
    plaintext as BufferSource
  );

  const ciphertext = new Uint8Array(encryptedBuffer);

  // Prepend 12-byte IV to ciphertext so the blob is self-contained: [12-byte IV || ciphertext + 16-byte tag]
  const packedCiphertext = new Uint8Array(iv.length + ciphertext.length);
  packedCiphertext.set(iv, 0);
  packedCiphertext.set(ciphertext, iv.length);

  const ciphertextHash = computeSha256(packedCiphertext);

  return {
    ciphertext: packedCiphertext,
    iv,
    ciphertextHash,
    byteLength: packedCiphertext.byteLength,
  };
}

/**
 * Decrypts AES-256-GCM ciphertext bytes using the provided DEK and IV.
 * Automatically handles self-contained packed blobs [12-byte IV || ciphertext + 16-byte tag]
 * with seamless fallback to explicit IVs.
 */
export async function decryptDocumentBytes(
  ciphertext: Uint8Array,
  iv: Uint8Array,
  dek: Uint8Array
): Promise<Uint8Array> {
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
    dek as BufferSource,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  // Strategy 1: If ciphertext is packed [12-byte IV || ciphertext + 16-byte tag]
  if (ciphertext.length > 28) {
    const packedIv = ciphertext.slice(0, 12);
    const packedBody = ciphertext.slice(12);
    try {
      const decrypted = await cryptoSubtle.decrypt(
        { name: "AES-GCM", iv: packedIv as BufferSource, tagLength: 128 },
        cryptoKey,
        packedBody as BufferSource
      );
      return new Uint8Array(decrypted);
    } catch {
      // Fall through to Strategy 2 with explicit iv
    }
  }

  // Strategy 2: Use provided iv directly with full ciphertext
  const decryptedBuffer = await cryptoSubtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv as BufferSource,
      tagLength: 128,
    },
    cryptoKey,
    ciphertext as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}

/**
 * Helpers for base64 serialization of encrypted buffers.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(base64, "base64"));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
