# ProofRoom — Deployment and Configuration Guide

## 1. Prerequisites

- **Node.js**: v20+ (Node.js 24 supported)
- **pnpm**: v10+
- **Rust Toolchain**: 1.84+ (cargo with WASM target `wasm32-unknown-unknown`)
- **NEAR CLI**: `near-cli-rs` or `near-cli`
- **NEAR Account**: Dedicated testnet account (e.g. `proofroom-app.testnet`)

## 2. Environment Variables

Create `.env` using `.env.example`:

```bash
cp .env.example .env
```

Key environment settings:
- `NEXT_PUBLIC_NEAR_NETWORK`: `testnet`
- `NEXT_PUBLIC_NEAR_RPC_URL`: `https://rpc.testnet.near.org`
- `NEXT_PUBLIC_NEAR_CONTRACT_ID`: Deployed testnet contract account
- `DATABASE_URL`: `file:./dev.db` (or PostgreSQL connection string in production)
- `NEAR_AI_BASE_URL`: `https://cloud-api.near.ai/v1`
- `NEAR_AI_API_KEY`: API credential for NEAR AI Cloud
- `NEAR_AI_MODEL`: `deepseek-ai/DeepSeek-V3.1`

## 3. Smart Contract Deployment

```bash
# Add WASM target
rustup target add wasm32-unknown-unknown

# Build release WASM binary
cargo build --manifest-path contracts/proofroom/Cargo.toml --target wasm32-unknown-unknown --release

# Deploy to NEAR Testnet
near contract deploy proofroom-app.testnet use-file ./contracts/proofroom/target/wasm32-unknown-unknown/release/proofroom_contract.wasm without-init-call network-config testnet sign-with-legacy-keychain send

# Initialize the contract
near contract call-function as-transaction proofroom-app.testnet new json-args {} prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as proofroom-app.testnet network-config testnet sign-with-legacy-keychain send
```

## 4. Database Setup

```bash
pnpm db:generate
pnpm db:push
```

## 5. Running the Application

```bash
# Run local development server
pnpm dev

# Build production bundle
pnpm build
pnpm start
```
