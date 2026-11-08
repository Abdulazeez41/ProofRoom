"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderLock,
  PlusCircle,
  Search,
  Filter,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { useWallet } from "@/context/WalletContext";

interface RoomItem {
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

export default function RoomsListPage() {
  const { accountId } = useWallet();
  const [rooms, setRooms] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "OWNED" | "SHARED">("ALL");

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

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "OWNED") {
      return accountId && r.owner.nearAccountId === accountId;
    }
    if (filterTab === "SHARED") {
      return (
        accountId &&
        r.owner.nearAccountId !== accountId &&
        r.participants?.some((p) => p.participantNearAccount === accountId)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Confidential Rooms</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your encrypted virtual workspaces and participant permissions.
          </p>
        </div>

        <Link href="/app/rooms/new">
          <Button size="sm" variant="primary" icon={<PlusCircle className="w-3.5 h-3.5" />}>
            Create new room
          </Button>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-2 rounded-2xl glass-panel border border-border">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 w-full sm:w-auto">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterTab === "ALL"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Rooms ({rooms.length})
          </button>
          <button
            onClick={() => setFilterTab("OWNED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterTab === "OWNED"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            My Rooms
          </button>
          <button
            onClick={() => setFilterTab("SHARED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              filterTab === "SHARED"
                ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Shared With Me
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl glass-panel border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Rooms List */}
      {loading ? (
        <div className="p-12 text-center rounded-3xl glass-panel text-xs text-muted-foreground space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
          <p>Loading rooms...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-border space-y-3">
          <FolderLock className="w-8 h-8 text-muted-foreground/40 mx-auto" />
          <p className="text-xs text-muted-foreground">No matching confidential rooms found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room) => {
            const isOwner = accountId && room.owner.nearAccountId === accountId;

            return (
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
                      {isOwner && (
                        <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          Owner
                        </span>
                      )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
