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
import { unwrapKeyEnvelope, createKeyEnvelope } from "@/lib/crypto/key-wrapping";
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
    keyEnvelopes?: {
      id: string;
      recipientUserId: string;
      recipient: {
        id: string;
        nearAccountId: string;
      };
    }[];
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
    const pollInterval = setInterval(() => {
      fetchRoom();
    }, 8000);
    return () => clearInterval(pollInterval);
  }, [params.roomId, accountId]);

  const isOwner = Boolean(accountId && room?.owner.nearAccountId === accountId);
  const currentParticipant = room?.participants.find(
    (p) => p.participantNearAccount === accountId
  );
  const isAuthorized = isOwner || currentParticipant?.permissionStatus === "ACTIVE";
  const isPendingInvite = Boolean(currentParticipant && currentParticipant.permissionStatus === "INVITED");
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  // Key synchronization state
  const [isSyncingKeys, setIsSyncingKeys] = useState(false);
  const [keySyncNotice, setKeySyncNotice] = useState<string | null>(null);
  const syncInProgressRef = React.useRef(false);

  // Automatic client-side key envelope synchronization
  const syncMissingEnvelopes = async () => {
    if (!room || !accountId || !userKeyPair || syncInProgressRef.current) return;

    // Active participants with known public keys
    const activeParticipantsWithKey = room.participants.filter(
      (p) => p.permissionStatus === "ACTIVE" && p.user?.encryptionPublicKey
    );

    if (activeParticipantsWithKey.length === 0 || room.documents.length === 0) return;

    // Check which documents need key envelopes for any active participant
    const docsToSync: Array<{
      doc: RoomData["documents"][0];
      missing: typeof activeParticipantsWithKey;
    }> = [];

    for (const doc of room.documents) {
      const missing = activeParticipantsWithKey.filter(
        (p) =>
          p.participantNearAccount !== accountId &&
          !doc.keyEnvelopes?.some((ke) => ke.recipient.nearAccountId === p.participantNearAccount)
      );
      if (missing.length > 0) {
        docsToSync.push({ doc, missing });
      }
    }

    if (docsToSync.length === 0) return;

    syncInProgressRef.current = true;
    setIsSyncingKeys(true);
    setKeySyncNotice(`Sealing zero-knowledge key envelopes for newly added participants...`);

    try {
      let provisionedCount = 0;

      for (const { doc, missing } of docsToSync) {
        // Fetch current user's envelope to unwrap DEK
        const myEnvRes = await fetch(`/api/documents/${doc.opaqueDocumentId || doc.id}/envelope?accountId=${accountId}`);
        const myEnvData = await myEnvRes.json();

        if (!myEnvData.success || !myEnvData.envelope) {
          continue; // Current user doesn't hold an envelope for this doc
        }

        // Unwrap DEK in browser memory
        const dek = await unwrapKeyEnvelope(myEnvData.envelope, userKeyPair.privateKeyHex);

        // Seal envelope for each missing participant using their public key
        const newEnvelopes = [];
        for (const p of missing) {
          if (!p.user?.encryptionPublicKey) continue;
          const sealedEnvelope = await createKeyEnvelope(dek, p.user.encryptionPublicKey);
          newEnvelopes.push({
            recipientAccountId: p.participantNearAccount,
            envelope: sealedEnvelope,
          });
        }

        if (newEnvelopes.length > 0) {
          const postRes = await fetch(`/api/documents/${doc.opaqueDocumentId || doc.id}/envelope`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderAccountId: accountId,
              envelopes: newEnvelopes,
            }),
          });
          const postData = await postRes.json();
          if (postData.success) {
            provisionedCount += newEnvelopes.length;
          }
        }
      }

      if (provisionedCount > 0) {
        setKeySyncNotice(`Key envelopes sealed and synchronized for ${provisionedCount} participant grant(s).`);
        setTimeout(() => setKeySyncNotice(null), 6000);
        await fetchRoom();
      } else {
        setKeySyncNotice(null);
      }
    } catch (err) {
      console.warn("Key synchronization notice:", err);
      setKeySyncNotice(null);
    } finally {
      setIsSyncingKeys(false);
      syncInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (room && accountId && userKeyPair) {
      syncMissingEnvelopes();
    }
  }, [room, accountId, userKeyPair]);

  const handleAcceptInvite = async () => {
    if (!accountId || !room) return;
    setAcceptingInvite(true);
    try {
      const res = await fetch("/api/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          participantAccountId: accountId,
          action: "ACCEPT",
          accountId,
          encryptionPublicKey: userKeyPair?.publicKeyHex,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to accept invitation");
      }
      await fetchRoom();
    } catch (err) {
      alert(`Accept invitation error: ${(err as Error).message}`);
    } finally {
      setAcceptingInvite(false);
    }
  };

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
        if (envData.error?.includes("Key envelope not found")) {
          throw new Error(
            `Key envelope pending: This document was uploaded before your account joined. Because ProofRoom is strictly zero-knowledge, the room owner (${room?.owner.nearAccountId}) must open this room in their browser to seal an encryption key envelope for your public key.`
          );
        }
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

      {/* Pending Invitation Banner if invited but not accepted */}
      {isPendingInvite && (
        <div className="p-4 sm:p-5 rounded-2xl bg-accent/10 border border-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-semibold text-ink text-sm">
              <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
              <span>You have a pending invitation to this room</span>
            </div>
            <p className="text-muted leading-relaxed">
              <strong className="text-ink font-mono">{room.owner.nearAccountId}</strong> invited you to access this confidential room. Accept the invitation to activate your session, inspect documents, and query the confidential AI enclave.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            loading={acceptingInvite}
            onClick={handleAcceptInvite}
            className="shrink-0"
          >
            Accept invitation
          </Button>
        </div>
      )}

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

              <div className="flex items-center gap-2">
                {isOwner && room.documents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => syncMissingEnvelopes()}
                    disabled={isSyncingKeys}
                    className="text-xs text-muted hover:text-accent font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Seal key envelopes for any newly active participants"
                  >
                    <RefreshCw className={clsx("w-3 h-3", isSyncingKeys && "animate-spin")} />
                    <span>Sync keys</span>
                  </button>
                )}
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
            </div>

            {keySyncNotice && (
              <div className="p-3 rounded-xl bg-info/10 border border-info/30 flex items-center gap-2 text-xs text-info animate-in fade-in">
                <RefreshCw className={clsx("w-3.5 h-3.5 shrink-0", isSyncingKeys && "animate-spin")} />
                <span>{keySyncNotice}</span>
              </div>
            )}

            {!isOwner && isAuthorized && room.documents.some((d) => !d.keyEnvelopes?.some((ke) => ke.recipient.nearAccountId === accountId)) && (
              <div className="p-3.5 rounded-xl bg-warn/10 border border-warn/30 flex items-start gap-2.5 text-xs text-ink animate-in fade-in">
                <Lock className="w-4 h-4 text-warn shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-warn">Zero-Knowledge Key Sealing Pending</p>
                  <p className="text-muted">
                    Documents were uploaded prior to your access approval. Because ProofRoom never stores decryption keys on the server, the room owner ({room.owner.nearAccountId}) must visit this room in their browser to automatically seal your encryption key envelopes.
                  </p>
                </div>
              </div>
            )}

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
                {room.documents.map((doc) => {
                  const userHasEnvelope =
                    isOwner ||
                    doc.keyEnvelopes?.some((ke) => ke.recipient.nearAccountId === accountId);

                  return (
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
                          {!userHasEnvelope && !isOwner && (
                            <>
                              <span>·</span>
                              <span className="text-warn font-medium">Key envelope pending</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!userHasEnvelope && !isOwner ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-warn/10 text-warn border border-warn/20 text-[11px] font-medium"
                              title="The room owner needs to open this room to seal an encryption key envelope for your account"
                            >
                              <Lock className="w-3 h-3" />
                              Key pending
                            </span>
                            <Button
                              size="sm"
                              variant="glass"
                              onClick={() => handleDownloadAndDecrypt(doc.opaqueDocumentId || doc.id, doc.name)}
                              className="text-xs py-1 px-2.5 min-h-[32px] text-muted hover:text-ink"
                            >
                              Check
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="glass"
                            disabled={!isAuthorized || decryptingDocId === (doc.opaqueDocumentId || doc.id)}
                            loading={decryptingDocId === (doc.opaqueDocumentId || doc.id)}
                            onClick={() => handleDownloadAndDecrypt(doc.opaqueDocumentId || doc.id, doc.name)}
                            icon={<Eye className="w-3.5 h-3.5" />}
                            className="text-xs py-1.5 px-3 min-h-[36px]"
                          >
                            Decrypt & View
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                      status={
                        p.permissionStatus === "ACTIVE"
                          ? "VERIFIED"
                          : p.permissionStatus === "INVITED"
                          ? "PENDING"
                          : "REVOKED"
                      }
                      label={
                        p.permissionStatus === "ACTIVE"
                          ? "Active"
                          : p.permissionStatus === "INVITED"
                          ? "Pending invite"
                          : "Revoked"
                      }
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
