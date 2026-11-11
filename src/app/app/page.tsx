"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderLock,
  FileText,
  Users,
  ShieldCheck,
  PlusCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  Database,
  ExternalLink,
  ChevronRight,
  Activity,
  FileLock2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { useWallet } from "@/context/WalletContext";
import { getExplorerTxUrl } from "@/lib/near/config";

interface RoomSummary {
  id: string;
  opaqueRoomId: string;
  name: string;
  companyName: string;
  purpose: string;
  status: string;
  createdAt: string;
  owner: { nearAccountId: string };
  participants?: { participantNearAccount: string; permissionStatus: string }[];
  _count: { documents: number; participants: number; auditReceipts: number };
}

export default function DashboardPage() {
  const { accountId, isConnected, connectWallet } = useWallet();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const url = accountId ? `/api/rooms?accountId=${accountId}` : "/api/rooms";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.error("Fetch rooms error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [accountId]);

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        if (!accountId) {
          await connectWallet("founder.testnet");
        }
        await fetchRooms();
      } else {
        alert(data.error || "Failed to seed demo environment");
      }
    } catch (err) {
      alert(`Demo seeding error: ${(err as Error).message}`);
    } finally {
      setSeedingDemo(false);
    }
  };

  // Compute stats totals
  const totalRooms = rooms.length;
  const totalDocs = rooms.reduce((acc, r) => acc + (r._count?.documents || 0), 0);
  const totalParticipants = rooms.reduce((acc, r) => acc + (r._count?.participants || 0), 0);
  const totalReceipts = rooms.reduce((acc, r) => acc + (r._count?.auditReceipts || 0), 0);

  // Compute pending invitations for current user
  const pendingInvites = rooms.filter(
    (r) =>
      Boolean(accountId) &&
      r.owner.nearAccountId !== accountId &&
      r.participants?.some(
        (p) => p.participantNearAccount === accountId && p.permissionStatus === "INVITED"
      )
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Your confidential workspace
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage your rooms, collaborators, and verified document activities.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="glass"
            loading={seedingDemo}
            onClick={handleSeedDemo}
            icon={<Sparkles className="w-3.5 h-3.5 text-accent" />}
          >
            Seed Northstar demo
          </Button>

          <Link href="/app/rooms/new">
            <Button size="sm" variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
              Create new room
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard radius="2xl" className="p-5 border-line space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Active rooms</span>
            <FolderLock className="w-4 h-4 text-accent" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">{totalRooms}</div>
          <span className="text-[11px] text-muted block">Opaque commitments</span>
        </GlassCard>

        <GlassCard radius="2xl" className="p-5 border-line space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Documents secured</span>
            <FileText className="w-4 h-4 text-ok" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">{totalDocs}</div>
          <span className="text-[11px] text-ok font-medium block">AES-256-GCM in browser</span>
        </GlassCard>

        <GlassCard radius="2xl" className="p-5 border-line space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Authorized participants</span>
            <Users className="w-4 h-4 text-info" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">{totalParticipants}</div>
          <span className="text-[11px] text-muted block">X25519 key envelopes</span>
        </GlassCard>

        <GlassCard radius="2xl" className="p-5 border-line space-y-2">
          <div className="flex items-center justify-between text-muted text-xs font-medium">
            <span>Verified AI receipts</span>
            <ShieldCheck className="w-4 h-4 text-ok" aria-hidden="true" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-ink font-mono">{totalReceipts}</div>
          <span className="text-[11px] text-ok font-medium block">Intel TDX verified</span>
        </GlassCard>
      </div>

      {/* Pending Invitations Banner for Collaborator */}
      {pendingInvites.length > 0 && (
        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/30 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
              <span>Pending room invitations ({pendingInvites.length})</span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-accent/20 text-accent font-semibold px-2 py-0.5 rounded">
              Action required
            </span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            You have been granted access to the following confidential rooms. Open a room to review and activate your access.
          </p>
          <div className="space-y-2 pt-1">
            {pendingInvites.map((r) => (
              <div
                key={r.id}
                className="p-3.5 rounded-xl glass border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-semibold text-ink text-sm">{r.name}</div>
                  <div className="text-muted text-[11px]">
                    Invited by <span className="font-mono text-ink">{r.owner.nearAccountId}</span> · {r.companyName}
                  </div>
                </div>
                <Link href={`/app/rooms/${r.id}`}>
                  <Button size="sm" variant="primary">
                    Review & accept invite
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Recent Rooms & Security Center Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Rooms */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-accent" aria-hidden="true" />
              <span>Confidential rooms</span>
            </h2>
            <Link href="/app/rooms" className="text-xs text-accent hover:underline font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-2xl glass text-xs text-muted space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-accent" aria-hidden="true" />
              <p>Loading confidential rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <GlassCard radius="2xl" className="p-8 text-center border-line space-y-4">
              <FolderLock className="w-10 h-10 text-muted/50 mx-auto" aria-hidden="true" />
              <div className="space-y-1">
                <h3 className="font-semibold text-ink text-sm">No rooms found</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Click &ldquo;Seed Northstar demo&rdquo; to test with pre-seeded synthetic fundraising
                  documents, or create a brand new confidential room.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button size="sm" variant="primary" loading={seedingDemo} onClick={handleSeedDemo}>
                  Seed Northstar demo
                </Button>
                <Link href="/app/rooms/new">
                  <Button size="sm" variant="outline">
                    Create new room
                  </Button>
                </Link>
              </div>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/app/rooms/${room.id}`}
                  className="block p-5 rounded-2xl glass border border-line hover:border-accent/40 transition-all duration-150 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-ink group-hover:text-accent transition-colors text-base">
                          {room.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-line/20 text-muted">
                          {room.purpose}
                        </span>
                        {room.participants?.find((p) => p.participantNearAccount === accountId)?.permissionStatus === "INVITED" && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accent/20 text-accent font-semibold">
                            Pending invite
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted">
                        Company: <strong className="text-ink">{room.companyName}</strong> · Owner:{" "}
                        <span className="font-mono text-accent">{room.owner.nearAccountId}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="font-medium text-ink block">
                          {room._count.documents} docs · {room._count.participants} members
                        </span>
                        <span className="text-[10px] text-muted">
                          {room._count.auditReceipts} receipts
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-line/20 group-hover:bg-accent group-hover:text-accent-ink flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Security Center Snapshot & Quick Actions */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-ok" aria-hidden="true" />
              <span>Security status</span>
            </h2>
            <Link href="/app/security" className="text-xs text-accent hover:underline font-medium">
              Details
            </Link>
          </div>

          <GlassCard radius="2xl" className="p-5 border-line space-y-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between text-xs pb-3 border-b border-line">
                <div>
                  <span className="font-medium text-ink block">Intel TDX enclave</span>
                  <span className="text-[11px] text-muted">DeepSeek-V3.1 on NEAR AI Cloud</span>
                </div>
                <SecurityBadge status="VERIFIED" label="Active" />
              </div>

              <div className="flex items-start justify-between text-xs pb-3 border-b border-line">
                <div>
                  <span className="font-medium text-ink block">Client encryption</span>
                  <span className="text-[11px] text-muted">AES-256-GCM + X25519 KEM</span>
                </div>
                <SecurityBadge status="VERIFIED" label="Ready" />
              </div>

              <div className="flex items-start justify-between text-xs">
                <div>
                  <span className="font-medium text-ink block">NEAR Testnet contract</span>
                  <span className="text-[11px] text-muted">proofroom.testnet</span>
                </div>
                <SecurityBadge status="VERIFIED" label="Connected" />
              </div>
            </div>

            <Link href="/app/security" className="block pt-1">
              <Button size="sm" variant="outline" className="w-full text-xs">
                Inspect attestation details
              </Button>
            </Link>
          </GlassCard>

          {/* Quick Guidance Box */}
          <GlassCard radius="2xl" className="p-5 border-line bg-solid/80 space-y-2">
            <h3 className="text-xs font-semibold text-ink flex items-center gap-1.5">
              <FileLock2 className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>Confidentiality reminder</span>
            </h3>
            <p className="text-[11px] text-muted leading-relaxed">
              Documents are encrypted in memory on your device before transfer. Only participants
              with explicit X25519 key grants can decrypt document content.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
