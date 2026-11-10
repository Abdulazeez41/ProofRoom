# ProofRoom - Intel TDX Attestation & Verifier Integration

## 1. What is Intel TDX Confidential Computing?

Intel Trust Domain Extensions (TDX) deploy hardware-isolated virtual machines, known as Trust Domains (TDs). A Trust Domain's memory contents and CPU state are encrypted by a dedicated hardware encryption engine (MKTME) using hardware-generated keys that are inaccessible to:

- The host operating system
- The hypervisor (KVM/QEMU)
- Cloud infrastructure administrators
- Other virtual machines co-located on the same physical host

## 2. NEAR AI Cloud Confidential Architecture

NEAR AI Cloud hosts AI inference workloads inside Intel TDX enclaves. When a model request is processed:

1. The model server generates a hardware-signed **Intel TDX Quote**.
2. The quote contains a measurement of the enclave runtime:
   - **MRTD** (Measurement of the initial RAM and firmware code loaded into the Trust Domain)
   - **RTMR0 - RTMR3** (Runtime Extended Measurements reflecting OS, containers, and model binaries)
   - **ReportData** (A 64-byte field containing a cryptographic commitment binding the model's ephemeral public signing key to the hardware quote)
3. An authorized Intel Quoting Enclave generates an ECDSA attestation signature verifiable against Intel's root certificate authorities (Intel SGX/TDX Provisioning Certification Service).

## 3. Cryptographic Verification Pipeline

ProofRoom implements the verification flow documented in [`nearai/nearai-cloud-verifier`](https://github.com/nearai/nearai-cloud-verifier):

```
1. Nonce Generation
   Browser / Verifier generates fresh cryptographic random nonce (32 bytes).

2. Retrieve Attestation Report
   Fetch attestation bundle containing:
   - Intel TDX Quote (binary base64)
   - Enclave Signing Key (P-256 ECDSA or Ed25519)
   - Model Identity measurement
   - Gateway TLS Binding

3. Quote Structural & Signature Validation
   - Parse TDX Quote Header (version, attestation key type, QE vendor).
   - Validate Intel PCS certificate chain back to Intel Root CA.
   - Verify that ReportData == SHA-512(SigningPubKey || Nonce).
   - Verify MRTD and RTMR measurements against known trusted release builds.

4. E2EE Request Preparation
   - Wrap prompt and retrieved excerpts with ECIES / AES-256-GCM using the attested model public key.
   - Request is submitted through server relay (ciphertext only).

5. Response Verification
   - Enclave generates response ciphertext + digital signature.
   - Compute `hash(request_ciphertext)` and `hash(response_ciphertext)`.
   - Validate ECDSA signature using the enclave public key bound in step 3.
   - Fail closed: If signature does not match, discard output.
```

## 4. Test Mode & Controlled Failure Injection

To allow rigorous technical verification:

- The ProofRoom Security Center provides an interactive **Verification Test Harness**.
- Allows injecting tampered quotes, simulated signature mismatches, or expired nonces.
- Proves in real time that ProofRoom immediately halts transmission and displays a clear fail-closed alert.
