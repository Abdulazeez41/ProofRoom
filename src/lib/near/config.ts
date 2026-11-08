export const NEAR_CONFIG = {
  networkId: process.env.NEXT_PUBLIC_NEAR_NETWORK || "testnet",
  nodeUrl: process.env.NEXT_PUBLIC_NEAR_RPC_URL || "https://rpc.testnet.near.org",
  explorerUrl: process.env.NEXT_PUBLIC_NEAR_EXPLORER_URL || "https://explorer.testnet.near.org",
  walletUrl: process.env.NEXT_PUBLIC_NEAR_WALLET_URL || "https://testnet.mynearwallet.com",
  contractId: process.env.NEXT_PUBLIC_NEAR_CONTRACT_ID || "proofroom.testnet",
  headers: {},
};

export function getExplorerTxUrl(txHash: string): string {
  return `${NEAR_CONFIG.explorerUrl}/transactions/${txHash}`;
}

export function getExplorerAccountUrl(accountId: string): string {
  return `${NEAR_CONFIG.explorerUrl}/accounts/${accountId}`;
}
