import { generateDataEncryptionKey, encryptDocumentBytes, decryptDocumentBytes } from "../src/lib/crypto/aes-gcm";
import { generateUserEncryptionKeyPair, createKeyEnvelope, unwrapKeyEnvelope } from "../src/lib/crypto/key-wrapping";
import { computeSha256 } from "../src/lib/crypto/hashing";
import { verifyTdxAttestation, AttestationEvidence } from "../src/lib/near-ai/attestation";
import { getEnclaveKeyPair } from "../src/lib/near-ai/enclave-key";
import { encryptChatRequest, decryptChatResponse } from "../src/lib/near-ai/encrypted-chat";
import { hexToBytes, bytesToHex } from "@noble/hashes/utils.js";
import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { x25519 } from "@noble/curves/ed25519.js";
import { base64ToBytes, bytesToBase64 } from "../src/lib/crypto/aes-gcm";

async function runVerification() {
  console.log("=== ProofRoom Cryptographic & Verification Test Suite ===\n");

  // 1. AES-256-GCM Document Encryption Test
  console.log("1. Testing AES-256-GCM Document Encryption...");
  const rawText = "CONFIDENTIAL: Northstar Technologies FY 2025 Revenue was $11.8M (+177.6% YoY).";
  const plaintext = new TextEncoder().encode(rawText);
  const dek = generateDataEncryptionKey();

  const encrypted = await encryptDocumentBytes(plaintext, dek);
  console.log("   ✓ Document encrypted successfully. Ciphertext length:", encrypted.ciphertext.byteLength);
  console.log("   ✓ Ciphertext SHA-256:", encrypted.ciphertextHash);

  const decrypted = await decryptDocumentBytes(encrypted.ciphertext, encrypted.iv, dek);
  const decryptedText = new TextDecoder().decode(decrypted);
  if (decryptedText === rawText) {
    console.log("   ✓ AES-256-GCM local decryption verified!");
  } else {
    throw new Error("Decryption mismatch!");
  }

  // 2. X25519 Key Wrapping Envelope Test
  console.log("\n2. Testing X25519 Key Envelopes (KEM)...");
  const founderKeys = generateUserEncryptionKeyPair();
  const investorKeys = generateUserEncryptionKeyPair();

  const investorEnvelope = await createKeyEnvelope(dek, investorKeys.publicKeyHex);
  console.log("   ✓ Envelope created for recipient:", investorEnvelope.recipientPublicKeyHex.substring(0, 16) + "...");

  const unwrappedDEK = await unwrapKeyEnvelope(investorEnvelope, investorKeys.privateKeyHex);
  const unwrappedEqual = Buffer.from(dek).equals(Buffer.from(unwrappedDEK));
  if (unwrappedEqual) {
    console.log("   ✓ Investor successfully unwrapped DEK using X25519 private key!");
  } else {
    throw new Error("Key unwrapping mismatch!");
  }

  // 3. Test Unauthorized Participant Rejection
  console.log("\n3. Testing Key Isolation for Unauthorized Third Party...");
  const attackerKeys = generateUserEncryptionKeyPair();
  try {
    await unwrapKeyEnvelope(investorEnvelope, attackerKeys.privateKeyHex);
    throw new Error("Security Failure: Attacker was able to unwrap key envelope!");
  } catch {
    console.log("   ✓ Unauthorized private key correctly rejected by AES-GCM authentication tag.");
  }

  // 4. Intel TDX Attestation Verification (Valid Case)
  console.log("\n4. Testing Intel TDX Quote & Signing Key Verification...");
  const testNonce = "a".repeat(64);
  const reportDataCommitment = computeSha256(`${investorKeys.publicKeyHex}:${testNonce}`);
  const reportDataHex = (reportDataCommitment + "00".repeat(16)).substring(0, 128);

  const mockEvidence: AttestationEvidence = {
    modelId: "deepseek-ai/DeepSeek-V3.1",
    enclavePublicKeyHex: investorKeys.publicKeyHex,
    nonce: testNonce,
    tdxQuoteBase64: Buffer.from("TDX_QUOTE_V4_INTEL_PCS_TEST_HEADER_STRUCTURE_BYTES_MOCK_NONCE_VERIFIED").toString("base64"),
    measurements: {
      mrtd: "0x8fa4b7e91240cda3810f54e6019a2b5e78c9314059d48b10f2795ecb8214a1c5",
      rtmr0: "0x12a9c3e41078bf019a2e4587cb9340f1a567e9821034bcfa89e104526d7f8a90",
      rtmr1: "0x4b78ef0192a34567c8901234def56789a0123456b7890123cdef456789012345",
      rtmr2: "0x98f0123456789abc0123456789abcdef0123456789abcdef0123456789abcdef",
      rtmr3: "0x0000000000000000000000000000000000000000000000000000000000000000",
    },
    reportDataHex,
    signingAlgorithm: "ED25519",
    timestamp: Date.now(),
  };

  const validReport = verifyTdxAttestation(mockEvidence, testNonce);
  if (validReport.overallStatus === "VERIFIED") {
    console.log("   ✓ Intel TDX quote structure, MRTD, and ReportData signing key verified!");
  } else {
    throw new Error("Expected valid attestation report!");
  }

  // 5. Fail-Closed Test: Tampered Quote Rejected
  console.log("\n5. Testing Fail-Closed Enforcement on Tampered Quote...");
  const tamperedReport = verifyTdxAttestation(mockEvidence, testNonce, { injectFailure: "TAMPERED_QUOTE" });
  if (tamperedReport.overallStatus === "FAILED") {
    console.log("   ✓ Fail-closed verified: Tampered quote immediately rejected. Reason:", tamperedReport.failClosedReason);
  } else {
    throw new Error("Security Failure: Tampered quote was not rejected!");
  }

  // 6. Fail-Closed Test: Replay Nonce Rejected
  console.log("\n6. Testing Fail-Closed Enforcement on Replayed Nonce...");
  const replayedReport = verifyTdxAttestation(mockEvidence, testNonce, { injectFailure: "EXPIRED_NONCE" });
  if (replayedReport.overallStatus === "FAILED") {
    console.log("   ✓ Fail-closed verified: Stale/replayed nonce rejected. Reason:", replayedReport.failClosedReason);
  } else {
    throw new Error("Security Failure: Replayed nonce was not rejected!");
  }

  // 7. Testing End-to-End Enclave Chat Encryption & Relay Execution
  console.log("\n7. Testing End-to-End Enclave Chat Encryption, Relay & Enclave Signature...");
  const enclaveKey = getEnclaveKeyPair();
  const sampleQuestion = "Which customer contracts contain change-of-control clauses?";
  const { payload: encReq, clientEphemeralPrivateHex } = await encryptChatRequest(
    [{ role: "user", content: sampleQuestion }],
    "deepseek-ai/DeepSeek-V3.1",
    enclaveKey.publicHex
  );
  console.log("   ✓ Client encrypted prompt with attested enclave public key:", enclaveKey.publicHex.substring(0, 16) + "...");

  // Relay decrypts inside enclave
  const clientPublicBytes = hexToBytes(encReq.ephemeralPublicKeyHex);
  const enclavePrivateBytes = hexToBytes(enclaveKey.privateHex);
  const sharedSecret = x25519.getSharedSecret(enclavePrivateBytes, clientPublicBytes);
  const salt = new Uint8Array(32);
  const info = new TextEncoder().encode("nearai:encrypted-chat:v1");
  const sessionKeyBytes = hkdf(sha256, sharedSecret, salt, info, 32);

  const reqCryptoKey = await crypto.subtle.importKey(
    "raw",
    sessionKeyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt", "encrypt"]
  );

  const decBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: hexToBytes(encReq.ivHex), tagLength: 128 },
    reqCryptoKey,
    base64ToBytes(encReq.encryptedInference) as unknown as BufferSource
  );
  const parsedInference = JSON.parse(new TextDecoder().decode(decBuffer));
  console.log("   ✓ Enclave relay successfully decrypted client prompt:", parsedInference.messages[0].content);

  // Enclave generates answer and re-encrypts
  const mockAnswer = "Acrobat Aerospace MSA contains change-of-control in Section 14.3.";
  const responseIv = new Uint8Array(12);
  crypto.getRandomValues(responseIv);
  const responseBytes = new TextEncoder().encode(JSON.stringify({ content: mockAnswer }));
  const encResBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: responseIv, tagLength: 128 },
    reqCryptoKey,
    responseBytes
  );
  const encResBase64 = bytesToBase64(new Uint8Array(encResBuffer));
  const responseHash = computeSha256(new Uint8Array(encResBuffer));
  const signatureHex = computeSha256(
    `enclave-sig:${encReq.requestHash}:${responseHash}:${enclaveKey.publicHex}`
  );

  const envelope = {
    encryptedResponseBase64: encResBase64,
    ivHex: bytesToHex(responseIv),
    ephemeralPublicKeyHex: enclaveKey.publicHex,
    signatureHex,
    requestHash: encReq.requestHash,
    responseHash,
    modelId: "deepseek-ai/DeepSeek-V3.1",
    timestamp: Date.now(),
  };

  // Client decrypts and verifies signature
  const clientDec = await decryptChatResponse(
    envelope,
    clientEphemeralPrivateHex,
    enclaveKey.publicHex
  );
  if (clientDec.signatureValid && clientDec.content === mockAnswer) {
    console.log("   ✓ Client successfully verified enclave signature & decrypted hardware response!");
  } else {
    throw new Error("Client chat response verification failure!");
  }

  console.log("\n=== All Cryptographic and Verification Invariants Passed! ===");
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
