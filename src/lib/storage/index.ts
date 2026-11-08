import fs from "fs";
import path from "path";

const LOCAL_STORAGE_DIR =
  process.env.STORAGE_LOCAL_DIR || path.join(process.cwd(), "data", "encrypted_blobs");

// Ensure local directory exists
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  try {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  } catch {
    // Ignore error in edge environments
  }
}

export interface StorageUploadResult {
  storageKey: string;
  byteSize: number;
}

/**
 * Stores an encrypted binary document blob.
 * CRITICAL: Only ciphertext should ever be passed to this service.
 */
export async function saveEncryptedBlob(
  storageKey: string,
  ciphertext: Uint8Array
): Promise<StorageUploadResult> {
  const sanitizedKey = storageKey.replace(/[^a-zA-Z0-9_-]/g, "_") + ".enc";
  const filePath = path.join(LOCAL_STORAGE_DIR, sanitizedKey);

  await fs.promises.writeFile(filePath, Buffer.from(ciphertext));

  return {
    storageKey: sanitizedKey,
    byteSize: ciphertext.byteLength,
  };
}

/**
 * Retrieves an encrypted binary document blob.
 * Returns raw ciphertext bytes.
 */
export async function getEncryptedBlob(storageKey: string): Promise<Uint8Array | null> {
  const sanitizedKey = storageKey.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filePath = path.join(LOCAL_STORAGE_DIR, sanitizedKey);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(filePath);
  return new Uint8Array(buffer);
}

/**
 * Removes an encrypted document blob.
 */
export async function deleteEncryptedBlob(storageKey: string): Promise<boolean> {
  const sanitizedKey = storageKey.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const filePath = path.join(LOCAL_STORAGE_DIR, sanitizedKey);

  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
    return true;
  }
  return false;
}
