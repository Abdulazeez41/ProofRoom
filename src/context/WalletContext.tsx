"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { generateUserEncryptionKeyPair, KeyPair } from "@/lib/crypto/key-wrapping";
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
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [accountId, setAccountId] = useState<string | null>(null);
  const [userKeyPair, setUserKeyPair] = useState<KeyPair | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

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
    try {
      const targetAccount = (preferredAccount || "founder.testnet").toLowerCase();

      // Ensure user has an X25519 keypair for document encryption
      let keyPair = userKeyPair;
      const storedKeyMapStr = localStorage.getItem(`proofroom_keys_${targetAccount}`);
      if (storedKeyMapStr) {
        try {
          keyPair = JSON.parse(storedKeyMapStr);
        } catch {
          keyPair = generateUserEncryptionKeyPair();
        }
      } else {
        keyPair = generateUserEncryptionKeyPair();
        localStorage.setItem(`proofroom_keys_${targetAccount}`, JSON.stringify(keyPair));
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
      // In web app, we simulate the ed25519 signature from the wallet
      const dummySig = "a".repeat(128); // 64 bytes hex
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: targetAccount,
          publicKey: `ed25519:6E8sWVqNQzZ9X7hX6XbF9vQ7w5p4s3d2f1g0h8j7k6l5`,
          signature: dummySig,
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
      console.error("Wallet connection failed:", err);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccountId(null);
    setUserKeyPair(null);
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
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
