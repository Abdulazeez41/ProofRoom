"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderLock,
  PlusCircle,
  Search,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SecurityBadge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
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
      r.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "OWNED") {
      return accountId && r.owner.nearAccountId === accountId;
    }
    if (filterTab === "SHARED") {
      return accountId && r.owner.nearAccountId !== accountId;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Confidential rooms</h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Browse and manage your active fundraising and due diligence rooms.
          </p>
        </div>

        <Link href="/app/rooms/new">
          <Button size="sm" variant="primary" icon={<PlusCircle className="w-4 h-4" />}>
            Create new room
          </Button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 rounded-2xl glass border border-line">
          <button
            type="button"
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors touch-target ${
              filterTab === "ALL" ? "bg-accent text-accent-ink font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            All rooms ({rooms.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("OWNED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors touch-target ${
              filterTab === "OWNED" ? "bg-accent text-accent-ink font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            My rooms
          </button>
          <button
            type="button"
            onClick={() => setFilterTab("SHARED")}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors touch-target ${
              filterTab === "SHARED" ? "bg-accent text-accent-ink font-semibold" : "text-muted hover:text-ink"
            }`}
          >
            Shared with me
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-muted absolute left-3 top-3.5" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl glass border border-line text-xs sm:text-sm text-ink focus:outline-none focus:ring-[3px] focus:ring-info min-h-[44px]"
          />
        </div>
      </div>

      {/* Rooms List */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl glass text-xs text-muted space-y-2">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-accent" aria-hidden="true" />
          <p>Loading rooms...</p>
        </div>
      ) : filteredRooms.length === 0 ? (
        <GlassCard radius="2xl" className="p-8 text-center border-line space-y-4">
          <FolderLock className="w-10 h-10 text-muted/50 mx-auto" aria-hidden="true" />
          <div className="space-y-1">
            <h3 className="font-semibold text-ink text-sm">No rooms found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No rooms match your filter or search criteria.
            </p>
          </div>
          <Link href="/app/rooms/new">
            <Button size="sm" variant="primary">
              Create new room
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filteredRooms.map((room) => (
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
                      {room._count.auditReceipts} verifications
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
  );
}
