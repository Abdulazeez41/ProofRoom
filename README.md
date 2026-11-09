<div align="center">

# ProofRoom

**Private intelligence. Verifiable trust.**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![NEAR Protocol](https://img.shields.io/badge/NEAR-Testnet-000000?style=flat-square&logo=near)](https://near.org/)
[![Intel TDX](https://img.shields.io/badge/TEE-Intel_TDX-0071C5?style=flat-square&logo=intel)](https://www.intel.com/content/www/us/en/developer/tools/trust-domain-extensions/overview.html)
[![Cryptography](https://img.shields.io/badge/Encryption-AES--256--GCM_%7C_X25519-0F7A52?style=flat-square)](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue?style=flat-square)](LICENSE)

*A verifiably private AI data room. Files are encrypted client-side in your browser, AI inference runs within Intel TDX hardware enclaves on NEAR AI Cloud, and every key lifecycle event and query receipt is anchored to NEAR Testnet.*

[Live Demo](https://proofroom.onrender.com) · [Architecture](#system-architecture) · [Quickstart](#local-development-quickstart) · [Deployment](#render-cloud-deployment) · [Security Boundaries](#security-boundaries--threat-model)

</div>

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Product Value](#core-product-value)
3. [System Architecture](#system-architecture)
4. [Cryptographic Engineering](#cryptographic-engineering)
5. [Intel TDX Confidential Computing & Fail-Closed Verification](#intel-tdx-confidential-computing--fail-closed-verification)
6. [NEAR Testnet Smart Contract](#near-testnet-smart-contract)
7. [Design System & Interactive 3D Vault](#design-system--interactive-3d-vault)
8. [Synthetic Due Diligence Scenario (Northstar Technologies)](#synthetic-due-diligence-scenario-northstar-technologies)
9. [Local Development Quickstart](#local-development-quickstart)
10. [Render Cloud Deployment](#render-cloud-deployment)
11. [API Specification](#api-specification)
12. [Security Boundaries & Threat Model](#security-boundaries--threat-model)
13. [License](#license)

---

## Executive Summary

Traditional Virtual Data Rooms (VDRs) require businesses to trust platform operators with sensitive financial audits, proprietary customer contracts, cap tables, and M&A documentation. Even when data is encrypted at rest, the platform host retains administrative access to decryption keys and plaintext files. Furthermore, modern AI document analysis commonly transmits raw corporate documents to multi-tenant LLM providers where host operating systems, hypervisors, and server operators can inspect memory.

**ProofRoom replaces institutional assumptions with verifiable cryptographic evidence:**
- **Client-Side Document Sealing:** Documents are encrypted locally in the user's browser with random AES-256-GCM data encryption keys (DEKs) before transmission.
- **Asymmetric Key Encapsulation (KEM):** DEKs are sealed for authorized recipients using X25519 Diffie-Hellman and HKDF-SHA256, authenticated with NEAR NEP-413 Ed25519 wallet challenges.
- **Hardware-Enforced Private AI:** Document passages and queries are analyzed inside Intel TDX (Trust Domain Extensions) confidential virtual machines on NEAR AI Cloud.
- **Fail-Closed Hardware Attestation:** ProofRoom verifies hardware measurement quotes (MRTD/RTMR) and ReportData signing key bindings before any prompt context leaves the user's machine.
- **Tamper-Evident Audit Trail:** Room identifiers, document hashes, access grants, revocations, and AI inference receipts are permanently committed to NEAR Testnet.

---

## Core Product Value

```
┌──────────────────┐       ┌──────────────────────┐       ┌────────────────────────┐
│  Browser Sealing │  ──>  │  Intel TDX Enclaves  │  ──>  │  NEAR Testnet Receipts │
│ AES-256-GCM KEM  │       │ Hardware-Verified AI │       │ Immutable Audit Proofs │
└──────────────────┘       └──────────────────────┘       └────────────────────────┘
```

1. **For Founders & Companies:** Retain complete sovereignty over sensitive files. Authorize lead investors by their NEAR accounts, set granular expiration periods, and instantly revoke future key distribution with on-chain transparency.
2. **For Investors & Reviewers:** Ask complex due diligence questions across multiple confidential files simultaneously. Every AI answer cites extracted source passages and includes a verified Intel TDX hardware attestation receipt.
3. **For Compliance & Legal:** Verify an unbroken chain of custody with tamper-evident cryptographic receipts recorded on NEAR Testnet without leaking document text on-chain.

---

## System Architecture

ProofRoom is built across five decoupled tiers ensuring defense-in-depth and zero plaintext exposure:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           TIER 1: BROWSER CLIENT                                │
│  - WebCrypto AES-256-GCM (random 256-bit DEK per document)                      │
│  - X25519 Key Envelopes (ECDH + HKDF-SHA256)                                    │
│  - Client-side Document Extraction & Local Passage Search                       │
│  - NEP-413 Ed25519 Wallet Challenge Signing                                     │
│  - Client-Side Intel TDX Hardware Attestation Verifier                          │
│  - Real-Time Three.js 3D Vault Stage                                            │
└───────────────────────┬─────────────────────────────────┬───────────────────────┘
                        │ Encrypted Blobs                 │ Auth Challenges,
                        │ & Attestation Checks            │ Envelopes & Hashes
                        ▼                                 ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│       TIER 3: STORAGE ENCLAVE         │ │      TIER 2: APPLICATION BACKEND      │
│  - Local Encrypted Disk / S3 Storage  │ │  - Next.js 14 App Router API Routes   │
│  - Stores ONLY AES-256 ciphertext     │ │  - NEP-413 Signature Verification     │
│  - Zero plaintext persistence         │ │  - Prisma ORM / SQLite Persistence    │
│  - Presigned short-lived access       │ │  - NEAR AI Encrypted Chat Relay       │
└───────────────────────────────────────┘ └───────────────────┬───────────────────┘
                                                              │
                        ┌─────────────────────────────────────┴───────────────────┐
                        ▼                                                         ▼
┌───────────────────────────────────────┐         ┌───────────────────────────────┐
│   TIER 4: CONFIDENTIAL AI CLOUD       │         │  TIER 5: NEAR TESTNET LEDGER  │
│  - Intel TDX Hardware TEE Enclave     │         │  - Rust Smart Contract        │
│  - Cryptographic Quote (MRTD / RTMR)  │         │  - proofroom-app.testnet      │
│  - Memory Encryption (Intel MKTME)    │         │  - Opaque Room Commitments    │
│  - Enclave Response Signature         │         │  - Access Grants & Revocations│
│  - Strict Fail-Closed Rejection       │         │  - On-Chain Audit Receipts    │
└───────────────────────────────────────┘         └───────────────────────────────┘
```

---

## Cryptographic Engineering

ProofRoom implements industry-standard, battle-tested cryptographic primitives with zero roll-your-own algorithms:

| Security Primitive | Standard / Spec | Purpose & Implementation |
| :--- | :--- | :--- |
| **Document Encryption** | **AES-256-GCM** | Unique 256-bit symmetric DEK per document. 96-bit unique IV and 128-bit authentication tag. Ciphertext is indistinguishable from random noise. |
| **Key Encapsulation (KEM)** | **X25519 + HKDF-SHA256** | ECIES-style key envelope. Ephemeral X25519 key exchange derives an encryption wrapping key via HKDF (RFC 5869). Only the recipient possessing the private key can unwrap the DEK. |
| **Wallet Identity Binding** | **NEP-413** | NEAR wallet authentication challenge. The user signs a single-use 32-byte nonce using Ed25519, binding their session to an ephemeral X25519 key. |
| **Confidential Computing** | **Intel TDX** | Hardware-isolated virtual machine with memory encrypted by CPU hardware keys (Intel Total Memory Encryption / MKTME). |
| **Attestation Verification** | **Intel TDX Quote v4/v5** | Verifies MRTD, RTMR0–3, and ReportData binding `sha256(enclave_signing_key || nonce)` to prevent man-in-the-middle attacks. |
| **Response Authenticity** | **Ed25519 / ECDSA** | Enclave digital signature evaluated over `sha256(request_hash || response_hash)`. |
| **On-Chain Commitments** | **SHA-256** | One-way privacy-preserving hashes committed to NEAR Testnet. No document text or private metadata is ever committed to the blockchain. |

---

## Intel TDX Confidential Computing & Fail-Closed Verification

```
[Browser Client]                                          [Intel TDX Enclave]
       │                                                           │
       │  1. Request Fresh Nonce & Attestation Quote              │
       │──────────────────────────────────────────────────────────>│
       │                                                           │
       │  2. Return Intel TDX Quote + Enclave Signing Key          │
       │<──────────────────────────────────────────────────────────│
       │
[Verify Quote Locally]
  - Validate MRTD & RTMR measurements
  - Check ReportData == SHA-256(Enclave Key || Nonce)
  - Verify Freshness (Nonce replayed? Stale?)
       │
       ├─── [Verification FAILED] ──> ABORT (0 bytes sent to AI)
       │
       └─── [Verification PASSED] ──> Proceed:
                                      Encrypt query & passages
                                      Send to attested enclave
```

### Strict Fail-Closed Guarantee
ProofRoom operates under a strict **fail-closed** security architecture:
1. If the Intel TDX quote fails validation, **no document context is transmitted**.
2. If the ReportData signing key binding check fails, **the request is immediately terminated**.
3. If an enclave response signature does not match the attested public key, **the output is discarded**.
4. The Security Center features an interactive test harness allowing users to inject tampered quotes and replayed nonces to inspect the fail-closed rejection in real time.

---

## NEAR Testnet Smart Contract

The core on-chain registry is deployed to NEAR Testnet at **`proofroom-app.testnet`**, implemented in Rust using `near-sdk`:

### Core State Invariants
- **Opaque Identifiers:** Rooms and documents use irreversible SHA-256 commitment hashes.
- **Access Control:** Only the registered room owner can grant or revoke participant access.
- **Revocation Enforcement:** Once access is revoked on-chain, backend key envelope distribution terminates immediately.
- **Activity Receipts:** Verification outcomes (`VERIFIED`, `FAILED`) and model transaction digests are permanently anchored on-chain.

### Contract Methods

```rust
// Create a new confidential data room commitment
pub fn create_room(room_id: String, room_commitment: String, metadata_commitment: String);

// Grant document access to a participant
pub fn grant_access(room_id: String, participant_commitment: String, permission_commitment: String, expires_at: Option<u64>);

// Revoke access for a participant
pub fn revoke_access(room_id: String, participant_commitment: String);

// Register encrypted document ciphertext hash
pub fn register_document(room_id: String, document_id: String, document_hash: String, version: u32);

// Record verified AI inference audit receipt
pub fn record_query_receipt(room_id: String, receipt_hash: String, verification_status: String, timestamp: u64);
```

---

## Design System & Interactive 3D Vault

ProofRoom features a visual design system pairing classical virtual data room reliability with modern cryptographic aesthetics:

- **Color Tokens:**
  - Light Palette: Warm cream background (`#F7F1E3`), solid ivory surfaces (`#FFFCF4`), deep ink typography (`#16211C`), and forest green accents (`#0F5C47`).
  - Dark Palette: Rich obsidian background (`#12170F`), translucent surfaces (`#1E261C`), golden amber accents (`#E3B04F`), and emerald status indicators (`#5FCFA6`).
- **Interactive 3D Vault:**
  - Built with **Three.js** inside a WebGL canvas with zero React per-frame re-render overhead.
  - Interactive pointer controls with momentum inertia physics and auto-rotation.
  - **Fluid Responsive Camera:** Dynamically pulls back on mobile screens (`< 600px`) from $z = 11$ to $z = 15$ to ensure participant nodes and orbiting documents never clip on small viewports.
  - **Driven by Real State:** Status indicators pair colors with explicit text labels (`Verified`, `Pending`, `Not checked`, `Failed`). Success animations only occur when cryptographic checks return success.

---

## Synthetic Due Diligence Scenario (Northstar Technologies)

The workspace includes a built-in seed dataset featuring fictional enterprise **Northstar Technologies, Inc.** to test realistic investor workflows:

- **Scenario:** Series A Due Diligence ($8.0M equity financing on $32.0M pre-money valuation).
- **Preset Documents:**
  1. *Northstar Audited Financial Statements (2024–2025):* $11.8M 2025 revenue (+177.6% YoY), $14.2M ARR, 78.4% gross margin, customer concentration metrics.
  2. *Enterprise Master Services Agreement (Acrobat Aerospace):* Section 14.3 change-of-control termination clause and indemnification covenants.
  3. *Series A Preferred Stock Term Sheet:* 1.0x non-participating liquidation preference, board composition, and anti-dilution provisions.
- **Preset Testnet Accounts:**
  - `founder.testnet`: Room owner and administrator.
  - `investor.testnet`: Authorized lead investor due diligence analyst.
  - Custom `.testnet` account support (e.g. `yourname.testnet`).

---

## Local Development Quickstart

### Prerequisites
- **Node.js**: `v20.x` or later (LTS recommended)
- **pnpm**: `v9.x` or `v10.x`
- **Rust**: `v1.84+` with `wasm32-unknown-unknown` target (for smart contracts)

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/Abdulazeez41/ProofRoom.git
cd ProofRoom
pnpm install
```

### Step 2: Database Setup
```bash
# Generate Prisma Client & apply SQLite schema
pnpm db:generate
pnpm db:push
```

### Step 3: Run Cryptographic Verification Suite
Verify all AES-256-GCM, X25519 envelopes, Intel TDX attestation quote verification, and fail-closed security invariants:
```bash
pnpm test:crypto
```

### Step 4: Run Smart Contract Unit Tests
```bash
pnpm contracts:test
```

### Step 5: Start Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view ProofRoom.

---

## Render Cloud Deployment

ProofRoom is configured for zero-configuration continuous deployment on [Render](https://render.com).

### Render Web Service Settings

| Parameter | Configuration Value |
| :--- | :--- |
| **Language** | `Node` |
| **Branch** | `main` |
| **Root Directory** | *(Leave blank)* |
| **Build Command** | `npm install -g pnpm && pnpm install && pnpm db:generate && pnpm db:push && pnpm build` |
| **Start Command** | `pnpm start` |
| **Plan** | `Free` (or higher) |

### Environment Variables

Configure the following variables in Render's dashboard:

```env
NODE_VERSION=20
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=ProofRoom
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.near.org
NEXT_PUBLIC_NEAR_EXPLORER_URL=https://explorer.testnet.near.org
NEXT_PUBLIC_NEAR_WALLET_URL=https://testnet.mynearwallet.com
NEXT_PUBLIC_NEAR_CONTRACT_ID=proofroom-app.testnet
DATABASE_URL=file:./dev.db
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=./data/encrypted_blobs
SESSION_SECRET=proofroom-confidential-session-secret-key-32b
NEAR_AI_BASE_URL=https://cloud-api.near.ai/v1
NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
NEAR_AI_API_KEY=
```

---

## API Specification

ProofRoom exposes modular, RESTful endpoints enforcing end-to-end cryptographic integrity:

### Authentication & Wallet Binding
- `POST /api/auth/challenge`: Generates a single-use NEP-413 cryptographic challenge nonce.
- `POST /api/auth/verify`: Verifies Ed25519 wallet signatures and binds client X25519 encryption keys.

### Rooms & Document Management
- `GET /api/rooms`: Lists accessible rooms for the authenticated account.
- `POST /api/rooms`: Creates a new room and generates cryptographic commitments.
- `GET /api/rooms/[roomId]`: Fetches room metadata, participants, documents, and audit receipts.
- `POST /api/documents`: Registers an encrypted document ciphertext hash and storage envelope.
- `GET /api/documents/[documentId]/blob`: Streams encrypted document ciphertext.
- `GET /api/documents/[documentId]/envelope`: Retrieves the recipient-specific X25519 key envelope.

### Confidential AI & Hardware Verification
- `POST /api/ai/attestation`: Retrieves live Intel TDX hardware attestation quotes and signing keys from NEAR AI Cloud.
- `POST /api/ai/relay`: Dispatches verified encrypted requests to the attested hardware enclave.
- `POST /api/verification/verify`: Independent verification endpoint for validating quotes and signatures.
- `GET /api/audit/receipts`: Queries verified audit receipts anchored to NEAR Testnet.

### Demo Utilities
- `POST /api/demo/seed`: Seeds the Northstar Technologies Series A due diligence scenario.

---

## Security Boundaries & Threat Model

ProofRoom provides verifiable protection within defined boundaries. Trust starts with honest limits:

### What ProofRoom Protects
- **Storage Host Compromise:** Ciphertext blobs stored in object storage or databases are AES-256-GCM encrypted prior to network transmission. Storage operators cannot read document contents.
- **Platform Operator Snooping:** Database administrators have no access to plaintext files or user private keys.
- **Unauthorized Interception:** Only authorized accounts receive X25519 key envelopes wrapped specifically for their public keys.
- **Host Infrastructure Inspection of AI:** AI inference executes inside Intel TDX hardware enclaves with memory encryption. Server operators cannot read enclave memory.
- **Tampered AI Responses:** Responses are signed by the attested enclave key and verified client-side.
- **Audit Tampering:** Query receipts and permission changes are anchored to NEAR Testnet, preventing retroactive log alteration.

### What ProofRoom Cannot Protect (Explicit Out-of-Scope Risks)
- **Authorized Participant Physical Capture:** An authorized reviewer with legitimate decryption capability can take screenshots, photograph screens, or copy decrypted text displayed on their device.
- **Pre-Revocation Local Copies:** Revoking access stops future key envelope distribution and downloads; it cannot remotely purge files previously saved to a reviewer's local hard drive.
- **Compromised User Terminals:** If a participant's operating system is infected with kernel-level malware or keyloggers, in-memory keys may be intercepted.
- **AI Hallucinations:** Large language models may misinterpret clauses. Reviewers must always inspect the verified source passages cited alongside each AI response.

---

## License

This project is licensed under the **Apache License 2.0**. See the [LICENSE](LICENSE) file for details. Built on **NEAR Testnet** and **Intel TDX** via **NEAR AI Cloud**.
