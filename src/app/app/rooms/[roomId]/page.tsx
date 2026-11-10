"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderLock,
  FileText,
  Users,
  Sparkles,
  Activity,
  Upload,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Download,
  Trash2,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  X,
  FileLock2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge, TestnetPill } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { VaultScene } from "@/components/vault/VaultScene";
import { useVaultState, VaultState } from "@/hooks/useVaultState";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { useWallet } from "@/context/WalletContext";
import { decryptDocumentBytes } from "@/lib/crypto/aes-gcm";
import { hexToBytes } from "@noble/hashes/utils.js";
import { unwrapKeyEnvelope } from "@/lib/crypto/key-wrapping";
import { getExplorerTxUrl } from "@/lib/near/config";
import clsx from "clsx";

interface RoomData {
  id: string;
  opaqueRoomId: string;
  name: string;
  companyName: string;
  description?: string;
  purpose: string;
  status: string;
  createdAt: string;
  roomCommitment: string;
  metadataCommitment: string;
  owner: { id: string; nearAccountId: string; encryptionPublicKey?: string };
  participants: {
    id: string;
    participantNearAccount: string;
    permissionStatus: string;
    expiresAt?: string;
    invitedAt: string;
    revokedAt?: string;
    user?: { encryptionPublicKey?: string };
  }[];
  documents: {
    id: string;
    opaqueDocumentId: string;
    name: string;
    category: string;
    encryptedSize: number;
    mimeType: string;
    ciphertextHash: string;
    version: number;
    encryptionAlgorithm: string;
    createdAt: string;
  }[];
  auditReceipts: {
    id: string;
    opaqueReceiptId: string;
    receiptHash: string;
    eventType: string;
    verificationStatus: string;
    transactionHash?: string;
    createdAt: string;
  }[];
}

export default function RoomWorkspacePage({
  params,
}: {
  params: { roomId: string };
}) {
  const { accountId, userKeyPair } = useWallet();
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  // Mobile navigation tabs
  const [mobileTab, setMobileTab] = useState<"DOCUMENTS" | "AI" | "ACTIVITY">("DOCUMENTS");

  // Live state tracking for vault hook
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [aiVerificationState, setAiVerificationState] = useState<"VERIFIED" | "FAILED" | "PENDING" | null>(null);
  const [receiptAnchored, setReceiptAnchored] = useState(false);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteAccountId, setInviteAccountId] = useState("");
  const [inviteRole, setInviteRole] = useState("Investor");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Revocation modal
  const [revokingParticipant, setRevokingParticipant] = useState<string | null>(null);
  const [isRevokingLoading, setIsRevokingLoading] = useState(false);

  // Decryption preview
  const [decryptedDocName, setDecryptedDocName] = useState<string | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptingDocId, setDecryptingDocId] = useState<string | null>(null);

  // Derive Vault State from real application events
  const vaultState = useVaultState({
    isEncrypting,
    verificationStatus: aiVerificationState,
    receiptStatus: receiptAnchored ? "ANCHORED" : null,
    hasError: aiVerificationState === "FAILED",
  });

  const fetchRoom = async () => {
    try {
      const url = accountId
        ? `/api/rooms/${params.roomId}?accountId=${accountId}`
        : `/api/rooms/${params.roomId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
        if (data.room.auditReceipts && data.room.auditReceipts.length > 0) {
          setReceiptAnchored(true);
        }
      }
    } catch (err) {
      console.error("Fetch room error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoom();
  }, [params.roomId, accountId]);

  const isOwner = Boolean(accountId && room?.owner.nearAccountId === accountId);
  const currentParticipant = room?.participants.find(
    (p) => p.participantNearAccount === accountId
  );
  const isAuthorized = isOwner || currentParticipant?.permissionStatus === "ACTIVE";

  // Client-Side Decryption
  const handleDownloadAndDecrypt = async (docId: string, docName: string) => {
    if (!accountId || !userKeyPair) {
      alert("Please connect your NEAR wallet first to decrypt documents.");
      return;
    }

    setDecryptingDocId(docId);
    try {
      const envRes = await fetch(`/api/documents/${docId}/envelope?accountId=${accountId}`);
      const envData = await envRes.json();

      if (!envData.success || !envData.envelope) {
        throw new Error(envData.error || "Failed to retrieve your document key envelope.");
      }

      const dek = await unwrapKeyEnvelope(envData.envelope, userKeyPair.privateKeyHex);
      const blobRes = await fetch(`/api/documents/${docId}/blob?accountId=${accountId}`);
      if (!blobRes.ok) {
        const errJson = await blobRes.json().catch(() => null);
        throw new Error(errJson?.error || `Failed to download encrypted document blob (HTTP ${blobRes.status}).`);
      }

      const arrayBuffer = await blobRes.arrayBuffer();
      const ciphertext = new Uint8Array(arrayBuffer);
      const iv = hexToBytes(envData.envelope.ivHex || "0".repeat(24));
      const decrypted = await decryptDocumentBytes(ciphertext, iv, dek);
      const text = new TextDecoder().decode(decrypted);

      setDecryptedDocName(docName);
      setDecryptedContent(text);
    } catch (err) {
      console.error("Decryption error:", err);
      alert(`Client decryption notice: ${(err as Error).message}`);
    } finally {
      setDecryptingDocId(null);
    }
  };

  // Invite participant
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteAccountId.trim() || !room) return;

    setInviteLoading(true);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          participantAccountId: inviteAccountId.trim(),
          role: inviteRole,
          ownerAccountId: accountId || room.owner.nearAccountId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to invite participant");
      }

      setInviteAccountId("");
      setIsInviteModalOpen(false);
      await fetchRoom();
    } catch (err) {
      alert(`Invite error: ${(err as Error).message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  // Confirm revocation
  const handleConfirmRevoke = async () => {
    if (!revokingParticipant || !room) return;
    setIsRevokingLoading(true);
    try {
      const res = await fetch("/api/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          participantAccountId: revokingParticipant,
          ownerAccountId: accountId || room.owner.nearAccountId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to revoke participant");
      }

      setRevokingParticipant(null);
      await fetchRoom();
    } catch (err) {
      alert(`Revocation error: ${(err as Error).message}`);
    } finally {
      setIsRevokingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-accent" aria-hidden="true" />
          <p className="text-xs text-muted">Loading confidential room...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <GlassCard radius="2xl" className="p-8 text-center border-line space-y-4 max-w-lg mx-auto mt-12">
        <FolderLock className="w-10 h-10 text-muted mx-auto" aria-hidden="true" />
        <h2 className="text-lg font-bold text-ink">Room not found</h2>
        <p className="text-xs text-muted">
          This room does not exist, or you lack the cryptographic credentials to inspect it.
        </p>
        <Link href="/app">
          <Button size="sm" variant="primary">
            Return to workspace
          </Button>
        </Link>
      </GlassCard>
    );
  }

  const activeParticipantsCount = room.participants.filter(
    (p) => p.permissionStatus === "ACTIVE"
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href="/app" className="hover:text-ink transition-colors">
          Workspace
        </Link>
        <span>/</span>
        <Link href="/app/rooms" className="hover:text-ink transition-colors">
          Rooms
        </Link>
        <span>/</span>
        <span className="text-ink font-mono truncate max-w-xs">{room.name}</span>
      </div>

      {/* Room Header with Mini Vault Orb */}
      <GlassCard radius="3xl" className="p-5 sm:p-6 border-line bg-solid/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            {/* Live 3D Mini Vault Orb */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl glass border border-line flex items-center justify-center shrink-0 overflow-hidden relative">
              <VaultScene state={vaultState} size="mini" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-ink">{room.name}</h1>
                <SecurityBadge
                  status={room.status === "ACTIVE" ? "VERIFIED" : room.status}
                  label={room.status === "ACTIVE" ? "Active" : room.status}
                />
              </div>

              <p className="text-xs text-muted">
                Company: <strong className="text-ink">{room.companyName}</strong> · Purpose:{" "}
                <span className="text-ink">{room.purpose}</span>
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted">
                <span>
                  Owner: <span className="font-mono text-accent">{room.owner.nearAccountId}</span>
                </span>
                <span>·</span>
                <span>
                  {activeParticipantsCount + 1} participant{activeParticipantsCount + 1 === 1 ? "" : "s"}
                </span>
                <span>·</span>
                <span className="text-ok font-medium">AES-256-GCM encrypted</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isOwner && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsInviteModalOpen(true)}
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Invite investor
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsUploadModalOpen(true)}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload file
                </Button>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Mobile Tabs Switcher */}
      <div className="lg:hidden flex items-center p-1 rounded-2xl glass border border-line">
        <button
          type="button"
          onClick={() => setMobileTab("DOCUMENTS")}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors touch-target ${
            mobileTab === "DOCUMENTS" ? "bg-accent text-accent-ink font-semibold" : "text-muted"
          }`}
        >
          Documents ({room.documents.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("AI")}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors touch-target ${
            mobileTab === "AI" ? "bg-accent text-accent-ink font-semibold" : "text-muted"
          }`}
        >
          AI workspace
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("ACTIVITY")}
          className={`flex-1 py-2 text-xs font-medium rounded-xl transition-colors touch-target ${
            mobileTab === "ACTIVITY" ? "bg-accent text-accent-ink font-semibold" : "text-muted"
          }`}
        >
          Activity ({room.auditReceipts.length})
        </button>
      </div>

      {/* Desktop 2-3 Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (Desktop: 5 cols): Documents & Access Control */}
        <div
          className={clsx(
            "lg:col-span-5 space-y-6",
            mobileTab !== "DOCUMENTS" && "hidden lg:block"
          )}
        >
          {/* Documents Section */}
          <GlassCard radius="2xl" className="p-5 border-line space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Documents ({room.documents.length})</span>
              </h2>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  + Add file
                </button>
              )}
            </div>

            {room.documents.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-line text-xs text-muted space-y-2">
                <FileLock2 className="w-8 h-8 text-muted/40 mx-auto" aria-hidden="true" />
                <p>No documents uploaded yet.</p>
                {isOwner && (
                  <Button size="sm" variant="outline" onClick={() => setIsUploadModalOpen(true)}>
                    Upload first document
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {room.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-xl glass border border-line hover:border-accent/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-accent shrink-0" aria-hidden="true" />
                        <span className="font-semibold text-ink truncate">{doc.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted">
                        <span>{doc.category}</span>
                        <span>·</span>
                        <span>{(doc.encryptedSize / 1024).toFixed(1)} KB</span>
                        <span>·</span>
                        <span className="font-mono text-ok">AES-256-GCM</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="glass"
                        disabled={!isAuthorized || decryptingDocId === doc.id}
                        loading={decryptingDocId === doc.id}
                        onClick={() => handleDownloadAndDecrypt(doc.id, doc.name)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                        className="text-xs py-1.5 px-3 min-h-[36px]"
                      >
                        Decrypt & View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Access Control & Participants Section */}
          <GlassCard radius="2xl" className="p-5 border-line space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Users className="w-4 h-4 text-info" aria-hidden="true" />
                <span>Authorized participants</span>
              </h2>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="text-xs text-accent hover:underline font-medium"
                >
                  + Invite
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {/* Owner card */}
              <div className="p-3 rounded-xl glass border border-line flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-1.5 font-semibold text-ink font-mono">
                    <span>{room.owner.nearAccountId}</span>
                    <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.2 rounded font-sans">
                      Owner
                    </span>
                  </div>
                  <span className="text-[11px] text-muted">Full administrative permissions</span>
                </div>
                <SecurityBadge status="VERIFIED" label="Active" />
              </div>

              {/* Invited participants */}
              {room.participants.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl glass border border-line flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-1.5 font-semibold text-ink font-mono">
                      <span>{p.participantNearAccount}</span>
                      <span className="text-[10px] bg-info/10 text-info px-1.5 py-0.2 rounded font-sans">
                        Investor
                      </span>
                    </div>
                    <span className="text-[11px] text-muted">
                      Invited: {new Date(p.invitedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <SecurityBadge
                      status={p.permissionStatus === "ACTIVE" ? "VERIFIED" : "REVOKED"}
                      label={p.permissionStatus === "ACTIVE" ? "Active" : "Revoked"}
                    />
                    {isOwner && p.permissionStatus === "ACTIVE" && (
                      <button
                        type="button"
                        onClick={() => setRevokingParticipant(p.participantNearAccount)}
                        className="p-1 rounded-lg text-bad hover:bg-bad/10 transition-colors"
                        title="Revoke access"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="sr-only">Revoke access</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Center/Right Column (Desktop: 7 cols): AI Workspace & Activity */}
        <div
          className={clsx(
            "lg:col-span-7 space-y-6",
            mobileTab === "DOCUMENTS" && "hidden lg:block",
            mobileTab === "ACTIVITY" && "hidden lg:block"
          )}
        >
          {/* AI Workspace Panel */}
          <GlassCard radius="3xl" className="p-5 sm:p-6 border-line min-h-[580px] flex flex-col">
            <AiAssistantPanel
              roomId={room.id}
              isAuthorized={isAuthorized}
              onVerificationStateChange={(status) => setAiVerificationState(status)}
            />
          </GlassCard>
        </div>

        {/* Activity Tab for Mobile or Bottom Section on Desktop */}
        <div
          className={clsx(
            "lg:col-span-12 space-y-4",
            mobileTab !== "ACTIVITY" && "hidden lg:block"
          )}
        >
          <GlassCard radius="2xl" className="p-5 sm:p-6 border-line space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>On-chain audit receipts ({room.auditReceipts.length})</span>
              </h2>
              <span className="text-xs text-muted">Anchored on NEAR Testnet</span>
            </div>

            {room.auditReceipts.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                No activity receipts anchored yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {room.auditReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="p-3.5 rounded-xl glass border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink font-mono">
                          {receipt.eventType}
                        </span>
                        <SecurityBadge status="VERIFIED" label="Anchored" />
                      </div>
                      <p className="text-[11px] text-muted font-mono truncate max-w-md">
                        Receipt Hash: {receipt.receiptHash}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[11px] text-muted">
                        {new Date(receipt.createdAt).toLocaleString()}
                      </span>
                      {receipt.transactionHash && (
                        <a
                          href={getExplorerTxUrl(receipt.transactionHash)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        roomId={room.id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          setIsUploadModalOpen(false);
          fetchRoom();
        }}
        participantAccounts={room.participants.map((p) => ({
          nearAccountId: p.participantNearAccount,
          encryptionPublicKey: p.user?.encryptionPublicKey,
        }))}
      />

      {/* Invite Investor Modal */}
      {isInviteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        >
          <GlassCard
            radius="3xl"
            className="w-full max-w-md p-6 sm:p-8 space-y-5 bg-solid border-line shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-muted hover:text-ink touch-target flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="space-y-1">
              <h2 className="text-lg font-bold text-ink">Invite authorized investor</h2>
              <p className="text-xs text-muted">
                Grant access to document key envelopes anchored with a NEAR commitment.
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="invite-acc" className="text-xs font-semibold text-ink">
                  NEAR Testnet account
                </label>
                <input
                  id="invite-acc"
                  type="text"
                  placeholder="investor.testnet"
                  value={inviteAccountId}
                  onChange={(e) => setInviteAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-xs sm:text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-info font-mono min-h-[44px]"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button size="md" variant="primary" className="w-full" loading={inviteLoading} type="submit">
                  Send invitation
                </Button>
                <Button size="md" variant="outline" onClick={() => setIsInviteModalOpen(false)} type="button">
                  Cancel
                </Button>
              </div>
            </form>
          </GlassCard>
        </div>
      )}

      {/* Revocation Confirmation Modal with Honest Disclosure */}
      {revokingParticipant && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        >
          <GlassCard
            radius="3xl"
            className="w-full max-w-md p-6 sm:p-8 space-y-5 bg-solid border-bad/30 shadow-2xl relative"
          >
            <div className="flex items-center gap-3 text-bad">
              <AlertTriangle className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h2 className="text-lg font-bold">Revoke participant access</h2>
            </div>

            <div className="space-y-2 text-xs text-muted">
              <p>
                Are you sure you want to revoke access for{" "}
                <strong className="text-ink font-mono">{revokingParticipant}</strong>?
              </p>
              {/* HARD RULE #4: Honest disclosure on revocation */}
              <div className="p-3 rounded-xl bg-warn/10 border border-warn/25 text-ink space-y-1">
                <p className="font-semibold text-warn">Important boundary:</p>
                <p className="text-[11px] leading-relaxed">
                  Revocation prevents this participant from receiving future document keys or
                  querying the AI workspace. However, it cannot delete or erase files that the
                  participant has already downloaded to their local computer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                size="md"
                variant="danger"
                className="w-full"
                loading={isRevokingLoading}
                onClick={handleConfirmRevoke}
              >
                Confirm revocation
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={() => setRevokingParticipant(null)}
              >
                Cancel
              </Button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Decrypted Document Local Viewer Modal */}
      {decryptedContent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm"
        >
          <GlassCard
            radius="3xl"
            className="w-full max-w-2xl max-h-[80vh] flex flex-col p-6 sm:p-8 space-y-4 bg-solid border-line shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => {
                setDecryptedDocName(null);
                setDecryptedContent(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-xl text-muted hover:text-ink touch-target flex items-center justify-center"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" aria-hidden="true" />
              <div>
                <h2 className="text-base font-bold text-ink truncate max-w-md">
                  {decryptedDocName}
                </h2>
                <span className="text-[11px] text-ok font-medium">
                  Decrypted locally in browser memory with AES-256-GCM
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 rounded-2xl glass border border-line bg-line/5 font-mono text-xs text-ink whitespace-pre-wrap leading-relaxed select-text">
              {decryptedContent}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setDecryptedDocName(null);
                  setDecryptedContent(null);
                }}
              >
                Close viewer
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
