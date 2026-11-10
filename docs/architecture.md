# ProofRoom - Technical Architecture

## 1. Executive Architecture Summary

ProofRoom is structured across five decoupled layers ensuring zero plaintext document exposure to ordinary application servers while providing verifiable Intel TDX attestation and tamper-evident NEAR Testnet blockchain anchoring.

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

## 2. Layer Deep Dive

### Layer 1: Client Browser Runtime

- **Security Boundary**: The browser is the sole execution environment where plaintext document content and raw Data Encryption Keys (DEKs) exist.
- **Key Generation**: Browser creates a cryptographically secure 256-bit random key via `crypto.getRandomValues(new Uint8Array(32))`.
- **Symmetric Cipher**: AES-256-GCM provides authenticated encryption with 128-bit integrity tags.
- **Key Wrapping**: Uses X25519 Elliptic Curve Diffie-Hellman + HKDF-SHA256 to create recipient-specific encrypted envelopes.
- **Document Engine**: Parses PDF/Text locally in the client worker, chunks text, and scores excerpts to build question context without streaming full documents over the wire.
- **Fail-Closed AI**: Enforces verification of Intel TDX quotes and enclave signatures before sending prompt context.

### Layer 2: Application Backend (Next.js & PostgreSQL)

- **Role**: State coordination, metadata indexing, authentication verification, and encrypted AI ciphertext relaying.
- **No Plaintext Invariant**: The backend rejects any payload containing unencrypted document strings or raw private keys.
- **Relay Worker**: The backend stores the NEAR AI API key server-side, attaches it to the client's already-encrypted ciphertext request, and forwards it to NEAR AI Cloud without decrypting or logging request bodies.

### Layer 3: Encrypted Object Storage

- Stores only opaque encrypted binary blobs (`.enc`).
- Document names and MIME types in storage are hashed or obfuscated.
- Access requires short-lived presigned URLs authorized by ownership and room membership checks.

### Layer 4: Confidential AI Cloud (Intel TDX)

- Workloads execute within hardware-isolated virtual machines powered by Intel Trust Domain Extensions (TDX).
- Enclave attestation reports prove code identity, measurements, and hardware root of trust.
- Response payloads are digitally signed by an enclave key bound to the verified hardware report.

### Layer 5: NEAR Testnet Smart Contract

- Written in Rust using `near-sdk-rs`.
- Maintains opaque room records (`room_commitment`, `metadata_commitment`), participant permissions (`participant_commitment`, `permission_commitment`), and verification receipts (`receipt_hash`, `verification_status`).
- Guarantees an immutable, verifiable audit trail without leaking business data on a public blockchain.
