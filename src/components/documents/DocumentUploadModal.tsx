"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Lock,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { Button } from "../ui/Button";
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
  const [statusStep, setStatusStep] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
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
    setProgressPercent(10);

    try {
      // Step 1: Read plaintext locally in browser memory
      setStatusStep("Reading document locally into browser memory...");
      const fileBuffer = await selectedFile.arrayBuffer();
      const plaintextBytes = new Uint8Array(fileBuffer);
      setProgressPercent(30);

      // Step 2: Generate unique AES-256-GCM DEK & Encrypt in Browser
      setStatusStep("Encrypting file locally with AES-256-GCM...");
      const dek = generateDataEncryptionKey();
      const encrypted = await encryptDocumentBytes(plaintextBytes, dek);
      setProgressPercent(60);

      // Step 3: Wrap DEK for Owner and each authorized participant
      setStatusStep("Constructing X25519 key envelopes for authorized participants...");
      const keyEnvelopes = [];

      // Owner key envelope
      const ownerEnvelope = await createKeyEnvelope(dek, userKeyPair.publicKeyHex);
      keyEnvelopes.push({
        recipientAccountId: accountId,
        envelope: ownerEnvelope,
      });

      // Participant envelopes
      for (const p of participantAccounts) {
        if (p.nearAccountId !== accountId && p.encryptionPublicKey) {
          const pEnvelope = await createKeyEnvelope(dek, p.encryptionPublicKey);
          keyEnvelopes.push({
            recipientAccountId: p.nearAccountId,
            envelope: pEnvelope,
          });
        }
      }
      setProgressPercent(80);

      // Step 4: Register Document Record (stores only ciphertext hash & envelopes)
      setStatusStep("Registering document commitment...");
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

      // Step 5: Upload Ciphertext Blob (Only encrypted bytes transmitted)
      setStatusStep("Uploading encrypted ciphertext blob...");
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

      setProgressPercent(100);
      setStatusStep("Upload complete! Document secured.");

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 800);
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMsg((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl glass-panel-elevated border border-border shadow-glass-elevated p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Secure Document Upload</h3>
              <p className="text-xs text-muted-foreground">Client-side AES-256-GCM authenticated encryption</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drag and Drop Box */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-border/80 hover:border-primary/50 rounded-2xl glass-panel text-center cursor-pointer transition-all space-y-3"
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setSelectedFile(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            {selectedFile ? <FileText className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              {selectedFile ? selectedFile.name : "Click or drag documents to encrypt"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB — ready to encrypt`
                : "PDF, TXT, DOCX, or JSON up to 50MB"}
            </p>
          </div>
        </div>

        {/* Category Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground">Document Category</label>
          <div className="grid grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`text-xs py-2 px-3 rounded-xl border transition-all text-center ${
                  category === cat
                    ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm shadow-primary/20"
                    : "glass-panel border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy Invariant Banner */}
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong>Zero Plaintext Exposure:</strong> Files are encrypted locally using random AES-256 keys before upload. Only encrypted ciphertext blobs are ever transmitted to storage.
          </p>
        </div>

        {/* Status / Error Messages */}
        {statusStep && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-primary font-medium">
              <span>{statusStep}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/50">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!selectedFile || uploading}
            loading={uploading}
            onClick={handleUpload}
            icon={<Lock className="w-3.5 h-3.5" />}
          >
            Encrypt & Upload
          </Button>
        </div>
      </div>
    </div>
  );
}
