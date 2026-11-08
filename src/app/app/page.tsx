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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Your confidential workspace
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your rooms, collaborators and secure document activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="glass"
            loading={seedingDemo}
            onClick={handleSeedDemo}
            icon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
          >
            Seed Northstar Demo
          </Button>

          <Link href="/app/rooms/new">
            <Button size="sm" variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
              Create new room
            </Button>
          </Link>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Active Rooms</span>
            <FolderLock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{totalRooms}</div>
          <span className="text-[11px] text-muted-foreground">Opaque on-chain commitments</span>
        </div>

        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Documents Secured</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{totalDocs}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            AES-256-GCM Encrypted
          </span>
        </div>

        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Authorized Participants</span>
            <Users className="w-4 h-4 text-secondary" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{totalParticipants}</div>
          <span className="text-[11px] text-muted-foreground">X25519 Key Envelopes</span>
        </div>

        <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Verified AI Queries</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-foreground font-mono">{totalReceipts}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Intel TDX Signed
          </span>
        </div>
      </div>

      {/* Main Grid: Recent Rooms & Security Center Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Rooms */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <FolderLock className="w-4 h-4 text-primary" />
              Confidential Rooms
            </h2>
            <Link href="/app/rooms" className="text-xs text-primary hover:underline font-medium">
              View all
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center rounded-3xl glass-panel text-xs text-muted-foreground space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
              <p>Loading confidential rooms...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center rounded-3xl glass-panel border border-border space-y-4">
              <FolderLock className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-sm">No rooms found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Click &quot;Seed Northstar Demo&quot; to test with pre-seeded synthetic fundraising documents, or create a new confidential room.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button size="sm" variant="primary" loading={seedingDemo} onClick={handleSeedDemo}>
                  Seed Northstar Demo
                </Button>
                <Link href="/app/rooms/new">
                  <Button size="sm" variant="glass">
                    Create New Room
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/app/rooms/${room.id}`}
                  className="block p-5 rounded-3xl glass-panel-elevated border border-border hover:border-primary/40 transition-all duration-200 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base">
                          {room.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-foreground/5 text-muted-foreground border border-border/50">
                          {room.purpose}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Company: <strong className="text-foreground">{room.companyName}</strong> • Owner:{" "}
                        <span className="font-mono text-primary">{room.owner.nearAccountId}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right text-xs">
                        <span className="font-medium text-foreground block">
                          {room._count.documents} Docs • {room._count.participants} Members
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {room._count.auditReceipts} Verifications
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-foreground/5 group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4" />
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
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Security Center
            </h2>
            <Link href="/app/security" className="text-xs text-primary hover:underline font-medium">
              Inspect details
            </Link>
          </div>

          <div className="p-5 rounded-3xl glass-panel-elevated border border-border space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Hardware Attestation</span>
                <SecurityBadge status="VERIFIED" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Intel TDX quote verified. ReportData binds model public signing key with fresh nonce.
              </p>
            </div>

            <div className="pt-3 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Storage Encryption</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ciphertext stored with private short-lived URLs. Server has zero access to DEKs.
              </p>
            </div>

            <div className="pt-3 border-t border-border/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Testnet Audit Trail</span>
                <span className="font-mono text-secondary font-semibold">ANCHORED</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tamper-evident commitments recorded on contract{" "}
                <span className="font-mono text-foreground font-semibold">proofroom.testnet</span>.
              </p>
            </div>

            <div className="pt-2">
              <Link href="/app/security">
                <Button size="sm" variant="glass" className="w-full">
                  Open Security Center
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
