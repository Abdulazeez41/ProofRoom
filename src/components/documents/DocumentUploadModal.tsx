"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Lock,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode,
} from "lucide-react";
import { Button } from "../ui/Button";
import { GlassCard } from "../ui/GlassCard";
import { SecurityBadge } from "../ui/Badge";
import { VaultScene } from "../vault/VaultScene";
import { useWallet } from "@/context/WalletContext";
import {
  generateDataEncryptionKey,
  encryptDocumentBytes,
} from "@/lib/crypto/aes-gcm";
import { createKeyEnvelope } from "@/lib/crypto/key-wrapping";

export function DocumentUploadModal({
  roomId,
  isOpen,
  onClose,
  onSuccess,
  participantAccounts = [],
}: {
  roomId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  participantAccounts?: { nearAccountId: string; encryptionPublicKey?: string }[];
}) {
  const { accountId, userKeyPair } = useWallet();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState("Financials");
  const [currentStage, setCurrentStage] = useState<
    "IDLE" | "ENCRYPTING" | "UPLOADING_CIPHERTEXT" | "REGISTERING_COMMITMENT" | "COMPLETE"
  >("IDLE");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = [
    "Financials",
    "Contracts",
    "Business Plan",
    "Operations",
    "Corporate",
    "Other",
  ];

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !accountId || !userKeyPair) return;

    setUploading(true);
    setErrorMsg(null);
    setCurrentStage("ENCRYPTING");

    try {
      // Stage 1: Encrypting in browser memory
      const fileBuffer = await selectedFile.arrayBuffer();
      const plaintextBytes = new Uint8Array(fileBuffer);
      const dek = generateDataEncryptionKey();
      const encrypted = await encryptDocumentBytes(plaintextBytes, dek);

      // Key envelopes for authorized recipients
      const keyEnvelopes = [];
      const ownerEnvelope = await createKeyEnvelope(dek, userKeyPair.publicKeyHex);
      keyEnvelopes.push({
        recipientAccountId: accountId,
        envelope: ownerEnvelope,
      });

      for (const p of participantAccounts) {
        if (p.nearAccountId !== accountId && p.encryptionPublicKey) {
          const pEnvelope = await createKeyEnvelope(dek, p.encryptionPublicKey);
          keyEnvelopes.push({
            recipientAccountId: p.nearAccountId,
            envelope: pEnvelope,
          });
        }
      }

      // Stage 2: Registering commitment
      setCurrentStage("REGISTERING_COMMITMENT");
      const regRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          name: selectedFile.name,
          category,
          encryptedSize: encrypted.byteLength,
          mimeType: selectedFile.type || "application/octet-stream",
          ciphertextHash: encrypted.ciphertextHash,
          ownerAccountId: accountId,
          keyEnvelopes,
        }),
      });

      const regData = await regRes.json();
      if (!regData.success || !regData.document) {
        throw new Error(regData.error || "Failed to register document commitment");
      }

      // Stage 3: Uploading Ciphertext Blob only
      setCurrentStage("UPLOADING_CIPHERTEXT");
      const blobRes = await fetch(`/api/documents/${regData.document.id}/blob`, {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
        },
        body: new Blob([encrypted.ciphertext as unknown as BlobPart]),
      });

      const blobData = await blobRes.json();
      if (!blobData.success) {
        throw new Error(blobData.error || "Failed to upload ciphertext blob");
      }

      setCurrentStage("COMPLETE");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      console.error("Document upload error:", err);
      setErrorMsg((err as Error).message || "Document encryption or upload failed.");
      setCurrentStage("IDLE");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
    >
      <GlassCard
        radius="3xl"
        className="w-full max-w-lg p-6 sm:p-8 space-y-6 bg-solid border-line shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={uploading}
          className="absolute top-5 right-5 p-2 rounded-xl text-muted hover:text-ink hover:bg-line/20 transition-colors touch-target flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="upload-modal-title" className="text-lg font-bold text-ink">
              Upload and encrypt document
            </h2>
            <p className="text-xs text-muted">
              Client-side AES-256-GCM encryption before network transmission.
            </p>
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
            selectedFile
              ? "border-accent bg-accent/5"
              : "border-line hover:border-accent/50 bg-line/5"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center">
              <Upload className="w-5 h-5" aria-hidden="true" />
            </div>

            {selectedFile ? (
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-ink truncate max-w-xs">{selectedFile.name}</p>
                <p className="text-xs text-muted font-mono">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs sm:text-sm font-medium text-ink">
                  Your files are encrypted in your browser before upload.
                </p>
                <p className="text-[11px] text-muted">
                  Click to browse or drag and drop a PDF or text document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label htmlFor="doc-category" className="text-xs font-semibold text-ink">
            Document category
          </label>
          <select
            id="doc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={uploading}
            className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-xs sm:text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-info min-h-[44px]"
          >
            {categories.map((c) => (
              <option key={c} value={c} className="bg-solid text-ink">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Three Separate Stages */}
        {uploading && (
          <div className="space-y-3 p-4 rounded-2xl glass border border-line bg-line/5">
            <div className="flex items-center justify-between text-xs font-medium text-ink">
              <span>Security pipeline</span>
              <VaultScene state="encrypting" size="inline" className="h-10 w-10" />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted">1. Encrypting in browser</span>
                {currentStage === "ENCRYPTING" ? (
                  <SecurityBadge status="PENDING" label="Encrypting..." />
                ) : (
                  <SecurityBadge status="VERIFIED" label="Encrypted" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">2. Registering commitment</span>
                {currentStage === "REGISTERING_COMMITMENT" ? (
                  <SecurityBadge status="PENDING" label="Anchoring..." />
                ) : currentStage === "UPLOADING_CIPHERTEXT" || currentStage === "COMPLETE" ? (
                  <SecurityBadge status="VERIFIED" label="Anchored" />
                ) : (
                  <SecurityBadge status="NOT_CHECKED" label="Queued" />
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted">3. Uploading ciphertext blob</span>
                {currentStage === "UPLOADING_CIPHERTEXT" ? (
                  <SecurityBadge status="PENDING" label="Uploading..." />
                ) : currentStage === "COMPLETE" ? (
                  <SecurityBadge status="VERIFIED" label="Uploaded" />
                ) : (
                  <SecurityBadge status="NOT_CHECKED" label="Queued" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-bad/10 border border-bad/25 text-xs text-bad flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            size="md"
            variant="primary"
            className="w-full"
            disabled={!selectedFile || uploading}
            loading={uploading}
            onClick={handleUpload}
          >
            {uploading ? "Encrypting & uploading..." : "Encrypt in browser & upload"}
          </Button>
          <Button size="md" variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}
