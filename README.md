# ProofRoom

> **Private intelligence. Verifiable trust.**

ProofRoom is a verifiably private AI-powered virtual data room that enables organizations to share confidential documents with authorized parties, collaborate securely, and analyze sensitive information using AI backed by hardware-enforced Trusted Execution Environments (Intel TDX) and tamper-evident blockchain audit commitments on NEAR Testnet.

---

## 1. Product Vision and Core Proposition

Traditional virtual data rooms require users to unconditionally trust the platform operator with financial statements, commercial contracts, customer registries, and M&A materials. 

ProofRoom introduces a **privacy-by-design** architecture:

- **Client-Side Document Encryption**: Documents are encrypted in the user's browser with random AES-256-GCM data encryption keys before touching the network.
- **Wallet-Bound Asymmetric Access**: Keys are encapsulated for authorized participants via X25519 Elliptic Curve Diffie-Hellman and HKDF-SHA256, authenticated using NEAR NEP-413 wallet signatures.
- **Zero Plaintext Persistence**: The application database and object storage only ever store encrypted ciphertext blobs, key envelopes, and cryptographic hashes.
- **Hardware-Attested AI Inference**: AI analysis executes inside Intel TDX (Trust Domain Extensions) confidential virtual machines on NEAR AI Cloud.
- **Fail-Closed Verification Engine**: Before transmitting context, ProofRoom verifies Intel TDX quote structure, MRTD/RTMR measurements, ReportData signing key binding, and fresh nonces. Responses are verified against enclave digital signatures.
- **Tamper-Evident Testnet Records**: Opaque room identifiers, document hashes, permission grants, revocations, and activity receipts are committed to a NEAR Testnet smart contract.

---

## 2. System Architecture

ProofRoom is structured across five decoupled layers ensuring strict separation of concerns and cryptographic defense-in-depth:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        LAYER 1: BROWSER CLIENT                         │
│  - WebCrypto AES-256-GCM Document Encryption/Decryption                │
│  - X25519 Key Exchange & Key Envelopes                                 │
│  - Client-side Document Extraction & Local Passage Search              │
│  - NEAR AI Encrypted Chat Protocol & Hardware Attestation Verifier     │
│  - NEAR Wallet Selector (NEP-413 Wallet Signature Auth)                │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │ Encrypted Blobs               │ Auth, Envelopes &
                   │ & Attested Requests           │ Metadata Commitments
                   ▼                               ▼
┌───────────────────────────────────┐    ┌───────────────────────────────┐
│     LAYER 3: STORAGE ENCLAVE      │    │  LAYER 2: APPLICATION BACKEND │
│  - S3 / Private Encrypted Storage │    │  - Next.js Route Handlers     │
│  - Only stores AES-256 ciphertext │    │  - NEP-413 Signature Verifier │
│  - Presigned short-lived URLs     │    │  - Zero plaintext persistence │
│  - Zero access to DEK keys        │    │  - NEAR AI Ciphertext Relay   │
└───────────────────────────────────┘    └───────────────┬───────────────┘
                                                         │
                   ┌─────────────────────────────────────┴───────────────┐
                   ▼                                                     ▼
┌───────────────────────────────────┐    ┌───────────────────────────────┐
│   LAYER 4: CONFIDENTIAL AI CLOUD  │    │ LAYER 5: NEAR TESTNET ON-CHAIN│
│  - Intel TDX Hardware TEE Enclave │    │  - Rust Smart Contract        │
│  - Verified Quotes (MRTD / RTMR)  │    │  - Opaque Room Commitments    │
│  - E2EE Chat Completion Protocol  │    │  - Access Grants & Revocation │
│  - Enclave Response Signature     │    │  - Privacy Activity Receipts  │
│  - Fail-Closed Verifier           │    │  - Testnet Explorer Anchoring │
└───────────────────────────────────┘    └───────────────────────────────┘
```

---

## 3. Cryptographic Standards and Invariants

| Component | Standard / Algorithm | Implementation Detail |
|---|---|---|
| **Document Encryption** | AES-256-GCM | 256-bit unique DEK per document, 96-bit random IV, 128-bit authentication tag |
| **Key Encapsulation (KEM)** | X25519 + HKDF-SHA256 | RFC 8439 / ECIES-style key agreement with domain-separated salt & info strings |
| **Wallet Identity Binding** | NEP-413 Challenge Signing | Ed25519 wallet message signatures binding NEAR accounts to client X25519 public keys |
| **Confidential Computing** | Intel TDX | Hardware-isolated Trust Domains via NEAR AI Cloud with encrypted physical memory (MKTME) |
| **Attestation Verification** | Intel TDX Quote v4/v5 | Validation of MRTD, RTMR0-3, and ReportData binding `sha256(enclave_signing_key \|\| nonce)` |
| **Response Authenticity** | ECDSA P-256 / Ed25519 | Enclave signature verified over `sha256(request_hash \|\| response_hash)` |
| **On-Chain Commitments** | SHA-256 Hashes | Opaque commitments for rooms, permissions, documents, and query receipts on NEAR Testnet |

---

## 4. Intel TDX Attestation & Fail-Closed Policy

ProofRoom enforces a strict **fail-closed security rule**:
- If an Intel TDX hardware quote fails verification, **no prompt context is transmitted**.
- If a signing-key binding check fails, **the request is aborted**.
- If an enclave response signature does not match the hardware quote, **the response is discarded**.

### Interactive Verification Test Harness
The ProofRoom Security Center includes an interactive test harness that allows deliberately injecting invalid quotes, replayed nonces, or mismatched keys to observe the fail-closed rejection in real time.

---

## 5. NEAR Testnet Smart Contract

The on-chain smart contract is written in Rust using `near-sdk-rs`:
- **Contract Account**: `proofroom.testnet`
- **Network**: NEAR Testnet (`https://rpc.testnet.near.org`)
- **Explorer**: `https://explorer.testnet.near.org`

### Contract Methods

- `create_room(room_id, room_commitment, metadata_commitment)`: Creates room commitment.
- `grant_access(room_id, participant_commitment, permission_commitment, expires_at)`: Records participant permission.
- `revoke_access(room_id, participant_commitment)`: Flags permission as revoked, halting future key distribution.
- `register_document(room_id, document_id, document_hash, version)`: Anchors document ciphertext hash.
- `record_query_receipt(room_id, receipt_hash, verification_status, timestamp)`: Commits privacy-preserving AI activity receipt.
- `get_room`, `get_room_documents`, `get_room_permissions`, `get_room_receipts`: View methods with pagination support.

---

## 6. Synthetic Due Diligence Scenario: Northstar Technologies

The workspace includes a built-in seed dataset featuring fictional enterprise **Northstar Technologies, Inc.**:

- **Fundraising Room**: "Northstar Series A Due Diligence" ($8M equity financing on $32M pre-money valuation).
- **Synthetic Documents**:
  1. *Northstar Audited Financial Statements (2024-2025)*: $11.8M 2025 revenue (+177.6% YoY), $14.2M ARR, 78.4% gross margin, top 3 customer concentration (47.4%).
  2. *Enterprise Master Services Agreement (Acrobat Aerospace)*: Contains Section 14.3 change-of-control termination clause and fee refund provision.
  3. *Series A Preferred Stock Term Sheet*: 1.0x non-participating liquidation preference, board composition, and pro-rata rights.
- **Personas**:
  - `founder.testnet`: Data room owner and administrator.
  - `investor.testnet`: Authorized lead investor due diligence analyst.

---

## 7. Local Development and Quickstart

### Prerequisites
- Node.js 20+ (Node.js 24 supported)
- pnpm 10+
- Rust 1.84+ (cargo)

### Installation
```bash
# Clone the repository
git clone https://github.com/ProofRoom/proofroom.git
cd proofroom

# Install dependencies
pnpm install

# Initialize local database
pnpm db:generate
pnpm db:push

# Run smart contract unit tests
pnpm contracts:test

# Start development server
pnpm dev
```

Open `http://localhost:3000` to view the application.

---

## 8. Testing

### Run Rust Smart Contract Unit Tests
```bash
pnpm contracts:test
```

### Run Cryptographic & Attestation Verification Suite
```bash
npx tsx scripts/verify-setup.ts
```

---

## 9. Security Boundaries and Threat Model

### Protected Scenarios
- **Storage Intermediary Compromise**: Encrypted with AES-256-GCM prior to upload; ciphertext is indistinguishable from random bytes.
- **Database Administrator Compromise**: Database contains no plaintext documents or private keys.
- **Unauthorized Participant Interception**: Key envelopes are encrypted for recipient X25519 public keys.
- **Host Infrastructure Snooping on AI**: Memory is encrypted by the CPU hardware engine inside Intel TDX enclaves.
- **Tampered AI Responses**: Enclave signatures validate response integrity.

### Explicit Out-of-Scope Risks
- **Authorized Participant Physical Recording**: An authorized investor with legitimate decryption access can capture screens or export decrypted text on their machine.
- **Information Downloaded Prior to Revocation**: Revoking access prevents future downloads and key distribution; it cannot retroactively erase previously downloaded files.
- **Device Root Compromise**: A malware-infected client terminal may compromise in-memory keys.

---

## 10. License

Apache 2.0. Built with NEAR Testnet and Intel TDX on NEAR AI Cloud.
