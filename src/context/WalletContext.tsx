"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { KeyPair } from "@/lib/crypto/key-wrapping";
import { NEAR_CONFIG } from "@/lib/near/config";

interface WalletContextType {
  accountId: string | null;
  isConnected: boolean;
  networkId: string;
  userKeyPair: KeyPair | null;
  connectWallet: (preferredAccount?: string) => Promise<boolean>;
  disconnectWallet: () => void;
  switchAccount: (newAccountId: string) => void;
  isConnecting: boolean;
  lastAuthError: string | null;
}

const WalletContext = createContext<WalletContextType>({
  accountId: null,
  isConnected: false,
  networkId: NEAR_CONFIG.networkId,
  userKeyPair: null,
  connectWallet: async () => false,
  disconnectWallet: () => {},
  switchAccount: () => {},
  isConnecting: false,
  lastAuthError: null,
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userKeyPair, setUserKeyPair] = useState<KeyPair | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastAuthError, setLastAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Load persisted state from localStorage
    const savedAccount = localStorage.getItem("proofroom_account_id");
    const savedKeys = localStorage.getItem("proofroom_keypair");

    if (savedAccount) {
      setAccountId(savedAccount);
    }

    if (savedKeys) {
      try {
        setUserKeyPair(JSON.parse(savedKeys));
      } catch {
        // regenerate
      }
    }
  }, []);

  const connectWallet = async (preferredAccount?: string): Promise<boolean> => {
    setIsConnecting(true);
    setLastAuthError(null);
    try {
      const targetAccount = (preferredAccount || "founder.testnet").toLowerCase();

      // Ensure user has an X25519 keypair for document encryption
      let keyPair = userKeyPair;
      if (targetAccount === "founder.testnet" || targetAccount === "investor.testnet") {
        const { getDeterministicKeyPair } = await import("@/lib/crypto/key-wrapping");
        keyPair = getDeterministicKeyPair(`proofroom:demo:${targetAccount}:v1`);
        localStorage.setItem(`proofroom_keys_${targetAccount}`, JSON.stringify(keyPair));
      } else {
        const storedKeyMapStr = localStorage.getItem(`proofroom_keys_${targetAccount}`);
        if (storedKeyMapStr) {
          try {
            keyPair = JSON.parse(storedKeyMapStr);
          } catch {
            const { generateUserEncryptionKeyPair } = await import("@/lib/crypto/key-wrapping");
            keyPair = generateUserEncryptionKeyPair();
          }
        } else {
          const { generateUserEncryptionKeyPair } = await import("@/lib/crypto/key-wrapping");
          keyPair = generateUserEncryptionKeyPair();
          localStorage.setItem(`proofroom_keys_${targetAccount}`, JSON.stringify(keyPair));
        }
      }

      // Step 1: Request single-use challenge from backend
      const challengeRes = await fetch("/api/auth/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: targetAccount }),
      });
      const challengeData = await challengeRes.json();

      if (!challengeData.success) {
        throw new Error(challengeData.error || "Failed to obtain challenge");
      }

      // Step 2: Sign and verify challenge
      // Generate or retrieve persistent Ed25519 signing keypair for targetAccount
      let ed25519PrivKeyHex = localStorage.getItem(`proofroom_ed25519_priv_${targetAccount}`);
      let ed25519PubKeyHex = localStorage.getItem(`proofroom_ed25519_pub_${targetAccount}`);

      const { ed25519 } = await import("@noble/curves/ed25519.js");
      const { bytesToHex, hexToBytes } = await import("@noble/hashes/utils.js");
      const { buildNep413MessageHash } = await import("@/lib/crypto/wallet-binding");

      if (!ed25519PrivKeyHex || !ed25519PubKeyHex) {
        const priv = ed25519.utils.randomSecretKey();
        const pub = ed25519.getPublicKey(priv);
        ed25519PrivKeyHex = bytesToHex(priv);
        ed25519PubKeyHex = bytesToHex(pub);
        localStorage.setItem(`proofroom_ed25519_priv_${targetAccount}`, ed25519PrivKeyHex);
        localStorage.setItem(`proofroom_ed25519_pub_${targetAccount}`, ed25519PubKeyHex);
      }

      // Compute cryptographic NEP-413 message hash and sign it
      const messageHash = buildNep413MessageHash(
        challengeData.challenge.message,
        challengeData.challenge.nonce,
        challengeData.challenge.recipient
      );
      const signatureBytes = ed25519.sign(messageHash, hexToBytes(ed25519PrivKeyHex));
      const signatureHex = bytesToHex(signatureBytes);

      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: targetAccount,
          publicKey: `ed25519:${ed25519PubKeyHex}`,
          signature: signatureHex,
          message: challengeData.challenge.message,
          nonce: challengeData.challenge.nonce,
          recipient: challengeData.challenge.recipient,
          encryptionPublicKey: keyPair?.publicKeyHex,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.error || "Wallet signature verification rejected");
      }

      setAccountId(targetAccount);
      setUserKeyPair(keyPair);
      localStorage.setItem("proofroom_account_id", targetAccount);
      localStorage.setItem("proofroom_keypair", JSON.stringify(keyPair));

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      console.error("Wallet connection failed:", err);
      setLastAuthError(msg);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccountId(null);
    setUserKeyPair(null);
    setLastAuthError(null);
    localStorage.removeItem("proofroom_account_id");
    localStorage.removeItem("proofroom_keypair");
  };

  const switchAccount = (newAccountId: string) => {
    connectWallet(newAccountId);
  };

  return (
    <WalletContext.Provider
      value={{
        accountId,
        isConnected: Boolean(accountId),
        networkId: NEAR_CONFIG.networkId,
        userKeyPair,
        connectWallet,
        disconnectWallet,
        switchAccount,
        isConnecting,
        lastAuthError,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
