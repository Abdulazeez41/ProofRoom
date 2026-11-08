import { execSync } from "child_process";
import { NEAR_CONFIG } from "../src/lib/near/config";

async function main() {
  console.log("=== ProofRoom NEAR Testnet Contract Deployment Helper ===\n");
  console.log("Target Network:", NEAR_CONFIG.networkId);
  console.log("Target Contract Account:", NEAR_CONFIG.contractId);
  console.log("RPC Endpoint:", NEAR_CONFIG.nodeUrl);

  console.log("\nStep 1: Compiling Rust Smart Contract to WebAssembly...");
  try {
    execSync(
      'cargo build --manifest-path contracts/proofroom/Cargo.toml --target wasm32-unknown-unknown --release',
      { stdio: "inherit" }
    );
    console.log("✓ WASM compilation complete!");
  } catch {
    console.log("Note: wasm32 target can be installed via: rustup target add wasm32-unknown-unknown");
  }

  console.log("\nStep 2: Deployment Instructions via near-cli-rs:");
  console.log(`
# Deploy wasm binary:
near contract deploy ${NEAR_CONFIG.contractId} use-file ./contracts/proofroom/target/wasm32-unknown-unknown/release/proofroom_contract.wasm without-init-call network-config testnet sign-with-keychain send

# Initialize contract state:
near contract call-function as-transaction ${NEAR_CONFIG.contractId} new json-args {} prepaid-gas '100.0 Tgas' attached-deposit '0 NEAR' sign-as ${NEAR_CONFIG.contractId} network-config testnet sign-with-keychain send
  `);
}

main().catch(console.error);
