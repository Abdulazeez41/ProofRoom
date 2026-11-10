# ProofRoom - Threat Model & Security Boundaries

## 1. System Assumptions

ProofRoom is designed to enforce verifiable data confidentiality and integrity under realistic threat conditions. Cryptographic mechanisms are employed to ensure that security does not rely on subjective trust in network intermediaries, database administrators, or storage service providers.

## 2. Protected Scenarios

The architecture protects against the following threat vectors:

| Threat Vector                                  | Mitigating Control                                                                    | Cryptographic / Technical Mechanism                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Compromised Storage Provider**               | Document blobs stored in S3/disk are encrypted                                        | AES-256-GCM client-side encryption. Stored blobs are indistinguishable from random bytes; storage provider has zero access to DEK.                                |
| **Malicious Backend Operator / DB Compromise** | Server database holds no plaintext documents, private keys, or raw prompt transcripts | Server stores only wrapped key envelopes, ciphertext hashes, and opaque metadata. Private keys remain exclusively in client memory.                               |
| **Unauthorized Data Room Access**              | Cryptographic envelope isolation                                                      | Key envelopes are encrypted for authorized participant public keys (X25519). An unauthorized user cannot unwrap document keys even if given database read access. |
| **Infrastructure Snoop on AI Inference**       | Cloud provider cannot read memory during model processing                             | Intel TDX hardware-isolated Trusted Execution Environment (TEE). Memory encryption engine isolates guest VM from host hypervisor.                                 |
| **Tampered / Forged AI Responses**             | Enclave response integrity verification                                               | Cryptographic response signature verified against model/gateway public key bound to the verified TEE quote.                                                       |
| **Replay Attacks on Attestation or Auth**      | Nonce freshness validation & ephemeral challenge signing                              | NEP-413 nonce binding for authentication; single-use cryptographic nonces for TEE attestation verification.                                                       |
| **Auditing / History Tampering**               | Tamper-evident on-chain recording                                                     | Privacy-preserving activity commitments and cryptographic hashes anchored to NEAR Testnet smart contract.                                                         |

## 3. Explicit Non-Goals & Out-of-Scope Risks

In alignment with realistic enterprise security standards, ProofRoom explicitly clarifies boundaries that no software-only architecture can eliminate:

1. **Authorized Participant Exfiltration**
   - An authorized investor who has legitimately decrypted a document has the capability to capture screenshots, transcribe, or export the document from their local terminal. ProofRoom prevents unauthorized access and limits key distribution, but cannot prevent physical displays or optical recording once legitimately decrypted.
2. **Endpoint Device Compromise**
   - If an actor's client machine is compromised by keyloggers, kernel rootkits, or memory scrapers, cryptographic keys held in browser memory may be extracted.
3. **Information Already Downloaded Prior to Revocation**
   - Revoking access halts future key envelope distribution and future file downloads. It cannot retroactively delete bytes that were already written to an authorized participant's local storage prior to revocation.
4. **Model Output Hallucination / Accuracy**
   - Intel TDX attestation guarantees that the software and weights inside the enclave were untampered and executed privately. It does not mathematically guarantee that an LLM will never make a factual reasoning error. ProofRoom mandates citation links with page-level excerpts so human reviewers can verify findings.

## 4. Fail-Closed Security Policy

ProofRoom enforces a strict **fail-closed** discipline across all verification stages:

- If Intel TDX quote verification fails: **Abort request; do not transmit context.**
- If signing-key binding check fails: **Abort request; do not transmit context.**
- If response signature validation fails: **Reject response; display verification failure warning.**
- If cryptographic challenge is invalid or expired: **Deny session access.**
