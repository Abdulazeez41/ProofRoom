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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { AiAssistantPanel } from "@/components/ai/AiAssistantPanel";
import { DocumentUploadModal } from "@/components/documents/DocumentUploadModal";
import { useWallet } from "@/context/WalletContext";
import { decryptDocumentBytes, base64ToBytes } from "@/lib/crypto/aes-gcm";
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
  const [activeTab, setActiveTab] = useState<"DOCUMENTS" | "AI" | "PARTICIPANTS" | "ACTIVITY">("DOCUMENTS");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteAccountId, setInviteAccountId] = useState("");
  const [inviteRole, setInviteRole] = useState("Investor");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [revokingAccountId, setRevokingAccountId] = useState<string | null>(null);
  const [decryptedDocName, setDecryptedDocName] = useState<string | null>(null);
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [decryptingDocId, setDecryptingDocId] = useState<string | null>(null);

  const fetchRoom = async () => {
    try {
      const url = accountId
        ? `/api/rooms/${params.roomId}?accountId=${accountId}`
        : `/api/rooms/${params.roomId}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.room) {
        setRoom(data.room);
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

  // Client-Side Decryption of a permitted document
  const handleDownloadAndDecrypt = async (docId: string, docName: string) => {
    if (!accountId || !userKeyPair) {
      alert("Please connect your NEAR wallet first to decrypt documents.");
      return;
    }

    setDecryptingDocId(docId);
    try {
      // Step 1: Fetch key envelope for the caller
      const envRes = await fetch(`/api/documents/${docId}/envelope?accountId=${accountId}`);
      const envData = await envRes.json();

      if (!envData.success || !envData.envelope) {
        throw new Error(envData.error || "Failed to retrieve your document key envelope.");
      }

      // Step 2: Unwrap DEK using caller's X25519 private key
      const dek = await unwrapKeyEnvelope(envData.envelope, userKeyPair.privateKeyHex);

      // Step 3: Fetch ciphertext blob
      const blobRes = await fetch(`/api/documents/${docId}/blob?accountId=${accountId}`);
      if (!blobRes.ok) {
        throw new Error("Failed to download encrypted document blob.");
      }
      const arrayBuffer = await blobRes.arrayBuffer();
      const ciphertext = new Uint8Array(arrayBuffer);

      // In our AES-GCM envelope, the IV is in envData.envelope.ivHex
      const iv = base64ToBytes(envData.envelope.ivHex || envData.envelope.wrappedKeyBase64.substring(0, 16));

      // Step 4: Decrypt locally in browser memory
      const decrypted = await decryptDocumentBytes(ciphertext, iv, dek);
      const text = new TextDecoder().decode(decrypted);

      setDecryptedDocName(docName);
      setDecryptedContent(text);
    } catch (err) {
      console.error("Decryption error:", err);
      alert(`Client Decryption Notice: ${(err as Error).message}`);
    } finally {
      setDecryptingDocId(null);
    }
  };

  // Invite Participant
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
      alert(`Invite Error: ${(err as Error).message}`);
    } finally {
      setInviteLoading(false);
    }
  };

  // Revoke Participant Access
  const handleRevokeParticipant = async (participantAccount: string) => {
    if (!room) return;
    const confirmRevoke = window.confirm(
      `Revoke access for ${participantAccount}?\n\nThis will immediately halt future file downloads and block new key distributions. Note that data already downloaded to their machine cannot be retroactively erased.`
    );
    if (!confirmRevoke) return;

    setRevokingAccountId(participantAccount);
    try {
      const res = await fetch("/api/participants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          participantAccountId: participantAccount,
          action: "REVOKE",
          ownerAccountId: accountId || room.owner.nearAccountId,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to revoke participant access");
      }

      await fetchRoom();
    } catch (err) {
      alert(`Revocation Error: ${(err as Error).message}`);
    } finally {
      setRevokingAccountId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center rounded-3xl glass-panel text-xs text-muted-foreground space-y-3">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-primary" />
        <p>Loading confidential data room...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-12 text-center rounded-3xl glass-panel border border-border space-y-3">
        <FolderLock className="w-10 h-10 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Room Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested confidential room does not exist or has expired.</p>
        <Link href="/app/rooms">
          <Button size="sm" variant="primary">
            Return to Rooms List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back Link */}
      <Link
        href="/app/rooms"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All Rooms
      </Link>

      {/* Room Header Banner */}
      <div className="p-6 rounded-3xl glass-panel-elevated border border-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{room.name}</h1>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-foreground/5 text-muted-foreground border border-border">
                {room.purpose}
              </span>
              {isOwner && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  Owner
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Company: <strong className="text-foreground">{room.companyName}</strong> • Owner:{" "}
              <span className="font-mono text-primary font-medium">{room.owner.nearAccountId}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isOwner && (
              <>
                <Button
                  size="sm"
                  variant="glass"
                  onClick={() => setIsInviteModalOpen(true)}
                  icon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Invite Partner
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsUploadModalOpen(true)}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload Encrypted Doc
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Security / Privacy Metrics Ribbon */}
        <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Lock className="w-3.5 h-3.5 text-primary" />
              AES-256-GCM Browser Encrypted
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Intel TDX Confidential AI
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Activity className="w-3.5 h-3.5 text-secondary" />
              NEAR Testnet Anchored
            </span>
          </div>

          <div className="text-[11px] font-mono text-muted-foreground">
            Room ID: <span className="text-foreground">{room.opaqueRoomId}</span>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="flex items-center gap-1 border-b border-border pb-1 text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab("DOCUMENTS")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
            activeTab === "DOCUMENTS"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Documents ({room.documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("AI")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
            activeTab === "AI"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Private AI Due Diligence</span>
        </button>

        <button
          onClick={() => setActiveTab("PARTICIPANTS")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
            activeTab === "PARTICIPANTS"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Participants ({room.participants.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("ACTIVITY")}
          className={clsx(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all",
            activeTab === "ACTIVITY"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          )}
        >
          <Activity className="w-4 h-4" />
          <span>On-Chain Activity ({room.auditReceipts.length})</span>
        </button>
      </div>

      {/* TAB 1: DOCUMENTS */}
      {activeTab === "DOCUMENTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Encrypted Document Vault</h2>
            {isOwner && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsUploadModalOpen(true)}
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                Upload File
              </Button>
            )}
          </div>

          {room.documents.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-border space-y-3">
              <FileText className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
              {isOwner && (
                <Button size="sm" variant="primary" onClick={() => setIsUploadModalOpen(true)}>
                  Upload First Document
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-3xl glass-panel-elevated border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-foreground/[0.02] text-muted-foreground uppercase tracking-wider font-semibold">
                      <th className="p-4">Document Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Encryption Status</th>
                      <th className="p-4">Ciphertext SHA-256</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {room.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-foreground/[0.015] transition-colors">
                        <td className="p-4 font-semibold text-foreground flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate max-w-[200px] sm:max-w-xs">{doc.name}</span>
                        </td>
                        <td className="p-4 text-muted-foreground">{doc.category}</td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Lock className="w-3 h-3" />
                            AES-256-GCM
                          </span>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-muted-foreground">
                          {doc.ciphertextHash.substring(0, 16)}...
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="glass"
                            loading={decryptingDocId === doc.id}
                            onClick={() => handleDownloadAndDecrypt(doc.id, doc.name)}
                            icon={<Download className="w-3.5 h-3.5" />}
                          >
                            Decrypt Locally
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Local Decrypted Content Viewer Modal */}
          {decryptedDocName && decryptedContent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
              <div className="w-full max-w-2xl rounded-3xl glass-panel-elevated border border-border shadow-glass-elevated p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="font-semibold text-sm text-foreground">Locally Decrypted: {decryptedDocName}</h3>
                      <p className="text-[11px] text-muted-foreground">Decrypted exclusively in your browser memory</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDecryptedDocName(null);
                      setDecryptedContent(null);
                    }}
                    className="p-1.5 rounded-xl hover:bg-foreground/5 text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-foreground/5 max-h-96 overflow-y-auto font-mono text-xs text-foreground whitespace-pre-wrap leading-relaxed border border-border/50">
                  {decryptedContent}
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      setDecryptedDocName(null);
                      setDecryptedContent(null);
                    }}
                  >
                    Close Viewer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: AI ASSISTANT */}
      {activeTab === "AI" && (
        <div className="glass-panel-elevated rounded-3xl p-6 border border-border min-h-[500px]">
          <AiAssistantPanel roomId={room.opaqueRoomId} isAuthorized={isAuthorized} />
        </div>
      )}

      {/* TAB 3: PARTICIPANTS */}
      {activeTab === "PARTICIPANTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Authorized Room Participants</h2>
            {isOwner && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsInviteModalOpen(true)}
                icon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Invite Partner
              </Button>
            )}
          </div>

          <div className="rounded-3xl glass-panel-elevated border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-foreground/[0.02] text-muted-foreground uppercase tracking-wider font-semibold">
                    <th className="p-4">Participant Account</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Invited Date</th>
                    {isOwner && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {/* Owner Row */}
                  <tr className="hover:bg-foreground/[0.015] transition-colors">
                    <td className="p-4 font-mono font-semibold text-foreground">
                      {room.owner.nearAccountId} (Owner)
                    </td>
                    <td className="p-4 text-muted-foreground">Data Room Administrator</td>
                    <td className="p-4">
                      <SecurityBadge status="ACTIVE" label="Owner Active" />
                    </td>
                    <td className="p-4 text-muted-foreground">{new Date(room.createdAt).toLocaleDateString()}</td>
                    {isOwner && <td className="p-4 text-right text-muted-foreground italic">Owner</td>}
                  </tr>

                  {/* Participant Rows */}
                  {room.participants.map((p) => (
                    <tr key={p.id} className="hover:bg-foreground/[0.015] transition-colors">
                      <td className="p-4 font-mono text-foreground font-semibold">
                        {p.participantNearAccount}
                      </td>
                      <td className="p-4 text-muted-foreground">Authorized Lead Investor</td>
                      <td className="p-4">
                        <SecurityBadge status={p.permissionStatus} />
                      </td>
                      <td className="p-4 text-muted-foreground">{new Date(p.invitedAt).toLocaleDateString()}</td>
                      {isOwner && (
                        <td className="p-4 text-right">
                          {p.permissionStatus === "ACTIVE" ? (
                            <Button
                              size="sm"
                              variant="danger"
                              loading={revokingAccountId === p.participantNearAccount}
                              onClick={() => handleRevokeParticipant(p.participantNearAccount)}
                            >
                              Revoke Access
                            </Button>
                          ) : (
                            <span className="text-[11px] text-rose-500 font-medium">Access Revoked</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVITY / AUDIT TRAIL */}
      {activeTab === "ACTIVITY" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Privacy-Preserving On-Chain Audit Receipts</h2>
            <span className="text-xs font-mono text-secondary">NEAR Testnet Verifiable</span>
          </div>

          {room.auditReceipts.length === 0 ? (
            <div className="p-12 text-center rounded-3xl glass-panel border border-border space-y-2">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-xs text-muted-foreground">No on-chain receipts registered yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {room.auditReceipts.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl glass-panel border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{rec.eventType.replace(/_/g, " ")}</span>
                      <SecurityBadge status={rec.verificationStatus} />
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Receipt Hash: <span className="text-primary">{rec.receiptHash.substring(0, 24)}...</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(rec.createdAt).toLocaleTimeString()}
                    </span>
                    {rec.transactionHash && (
                      <a
                        href={getExplorerTxUrl(rec.transactionHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono"
                      >
                        Tx Explorer <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Document Modal */}
      <DocumentUploadModal
        roomId={room.id}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={fetchRoom}
        participantAccounts={room.participants.map((p) => ({
          nearAccountId: p.participantNearAccount,
          encryptionPublicKey: p.user?.encryptionPublicKey,
        }))}
      />

      {/* Invite Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl glass-panel-elevated border border-border shadow-glass-elevated p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Invite Authorized Participant</h3>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Participant NEAR Account ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. investor.testnet"
                  value={inviteAccountId}
                  onChange={(e) => setInviteAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 bg-surface"
                >
                  <option value="Investor">Lead Investor / Due Diligence Analyst</option>
                  <option value="Legal">Legal Counsel Reviewer</option>
                  <option value="Auditor">Financial Auditor</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-foreground/5 text-muted-foreground leading-relaxed text-[11px]">
                Upon invitation, the participant can connect their NEAR wallet to obtain the X25519 key envelopes for authorized documents.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button size="sm" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" loading={inviteLoading}>
                  Send Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
