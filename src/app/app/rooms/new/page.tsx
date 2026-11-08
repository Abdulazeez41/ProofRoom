"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderPlus,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useWallet } from "@/context/WalletContext";

export default function NewRoomPage() {
  const router = useRouter();
  const { accountId, isConnected } = useWallet();

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [purpose, setPurpose] = useState("Fundraising");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const purposeOptions = [
    { value: "Fundraising", label: "Fundraising & Due Diligence" },
    { value: "M&A", label: "Mergers & Acquisitions (M&A)" },
    { value: "Legal review", label: "Legal & Regulatory Review" },
    { value: "Procurement", label: "Enterprise Procurement" },
    { value: "Other", label: "Strategic Partnerships / Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !companyName.trim()) {
      setErrorMsg("Room Name and Company Name are required.");
      return;
    }

    const ownerAccount = accountId || "founder.testnet";
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          companyName: companyName.trim(),
          description: description.trim() || null,
          purpose,
          ownerAccountId: ownerAccount,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!data.success || !data.room) {
        throw new Error(data.error || "Failed to create confidential room");
      }

      router.push(`/app/rooms/${data.room.id}`);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Back Link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="rounded-3xl glass-panel-elevated border border-border shadow-glass-elevated p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="space-y-1.5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">Create Confidential Room</h1>
              <p className="text-xs text-muted-foreground">
                Set up an encrypted virtual data room with wallet-controlled access.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          {/* Room Name & Company Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Room Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Series A Fundraising 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Northstar Technologies"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Description (Optional)</label>
            <textarea
              rows={3}
              placeholder="State the objective, round size, or specific due diligence scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground resize-none"
            />
          </div>

          {/* Purpose & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Room Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 bg-surface text-xs sm:text-sm"
              >
                {purposeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Access Expiration (Optional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-panel border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Privacy Notice Banner */}
          <div className="p-4 rounded-2xl bg-foreground/5 border border-border/80 space-y-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              On-Chain Privacy Commitment Notice
            </span>
            <p className="leading-relaxed text-[11px]">
              When you create this room, ProofRoom generates an opaque room identifier and cryptographic hash commitment on NEAR Testnet. Descriptive names, uploaded documents, and participant communication remain encrypted off-chain.
            </p>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/50">
            <Link href="/app">
              <Button size="sm" variant="ghost" type="button">
                Cancel
              </Button>
            </Link>
            <Button
              size="md"
              variant="primary"
              type="submit"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Create Confidential Room
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
