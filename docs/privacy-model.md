# ProofRoom — Privacy Model

## Overview

ProofRoom provides a privacy-by-design virtual data room architecture for confidential fundraising, due diligence, M&A, and corporate reviews. The fundamental premise is that **confidentiality must be cryptographically verifiable**, rather than relying on trust in platform operators.

## The Five Privacy Tenets

1. **Client-Side Document Encryption**
   - Documents are encrypted directly in the user's browser before upload.
   - Symmetric cipher: AES-256-GCM with a unique, cryptographically random 256-bit Data Encryption Key (DEK) and 96-bit initialization vector (IV) per document.
   - The ordinary application backend and object storage only ever receive and store ciphertext blobs and authenticated integrity hashes. Plaintext never touches backend memory or persistent storage.

2. **Wallet-Bound Asymmetric Key Envelopes**
   - NEAR account identities are paired with an X25519 public key through NEP-413 signed challenges.
   - For every authorized participant, an encrypted key envelope is constructed via X25519 Elliptic Curve Diffie-Hellman (ECDH) key agreement, HKDF-SHA256 key derivation, and AES-256-GCM encryption of the document DEK.
   - Only the holder of the recipient's private key can decrypt the envelope to obtain the document DEK.

3. **Confidential AI via Hardware Enclaves (Intel TDX)**
   - AI document analysis uses NEAR AI Cloud's attested hardware execution environments running on Intel TDX (Trust Domain Extensions).
   - Document context and queries are encrypted on the client side using the attested model enclave's public key before relay.
   - The relay server forwards ciphertext with server-side API credentials; the relay server cannot inspect, decrypt, or log queries or responses.

4. **Hardware Attestation and Signature Verification (Fail-Closed)**
   - Before confidential inference, client/verifier components validate Intel TDX quotes, hardware measurements (MRTD/RTMR), gateway/model signing keys, and fresh nonce bindings.
   - Responses returned from the enclave carry cryptographic signatures over request and response hashes.
   - If any verification check fails or evidence is stale/missing, the system **fails closed**: no sensitive data is transmitted, and unverified responses are rejected.

5. **Tamper-Evident On-Chain Anchoring (Zero Sensitive Metadata)**
   - NEAR Testnet smart contracts record opaque room identifiers, document ciphertext commitments, permission commitments, and privacy-preserving AI activity receipts.
   - No document names, plaintext text, conversation logs, or participant identities are published in plain on-chain events.

## Data Lifecycle

```
[Founder Browser]
       │
       ├─ Generate DEK (AES-256-GCM)
       ├─ Encrypt Document -> Ciphertext
       ├─ Wrap DEK with Owner & Investor X25519 keys
       │
       ├──> Upload Ciphertext Blob ----> [Private Object Storage]
       ├──> Store Metadata & Envelopes -> [Application DB]
       └──> Anchor Hash Commitment ------> [NEAR Testnet Contract]

[Investor Browser]
       │
       ├──> Fetch Ciphertext Blob <----- [Private Object Storage]
       ├──> Fetch Key Envelope <--------- [Application DB]
       ├─ Decrypt DEK with Investor X25519 Private Key
       ├─ Decrypt Document locally in browser
       ├─ Parse & Extract relevant excerpts
       │
       ├─ Verify Intel TDX Enclave Attestation
       ├─ Encrypt Query + Context for Enclave Public Key
       ├──> Relay Ciphertext ----------> [NEAR AI Cloud (Intel TDX)]
       │                                            │
       │<── Receive Encrypted Response <────────────┘
       ├─ Verify Enclave Response Signature & Hashes
       ├─ Decrypt Answer in browser memory
       └──> Anchor Receipt Commitment -> [NEAR Testnet Contract]
```

## Revocation Model

- Revocation of participant access immediately marks the participant's permission status as revoked on-chain and in the authorization registry.
- Revoked participants cannot download future encrypted blobs or receive key envelopes for updated document versions.
- Cryptographic distinction: ProofRoom explicitly recognizes that revocation prevents future authorized access, but cannot physically delete data that was already downloaded and decrypted by an authorized participant's machine prior to revocation.
