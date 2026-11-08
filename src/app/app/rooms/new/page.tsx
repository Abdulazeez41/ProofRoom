"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderPlus,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
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
      setErrorMsg("Room name and company name are required.");
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Back Link */}
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors font-medium touch-target"
      >
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Back to workspace</span>
      </Link>

      <GlassCard radius="3xl" className="p-6 sm:p-8 space-y-6 bg-solid/80 border-line">
        {/* Header */}
        <div className="space-y-1 pb-4 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <FolderPlus className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink">Create confidential room</h1>
              <p className="text-xs text-muted">
                Set up an encrypted virtual data room with wallet-controlled access.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="p-3.5 rounded-2xl bg-bad/10 border border-bad/25 text-xs text-bad flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs sm:text-sm">
          {/* Room Name & Company Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="room-name" className="font-semibold text-ink">
                Room name *
              </label>
              <input
                id="room-name"
                type="text"
                required
                placeholder="e.g. Series A Fundraising 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-ink focus:outline-none focus:ring-[3px] focus:ring-info placeholder:text-muted min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="company-name" className="font-semibold text-ink">
                Company name *
              </label>
              <input
                id="company-name"
                type="text"
                required
                placeholder="e.g. Northstar Technologies"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-ink focus:outline-none focus:ring-[3px] focus:ring-info placeholder:text-muted min-h-[44px]"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="room-desc" className="font-semibold text-ink">
              Description (optional)
            </label>
            <textarea
              id="room-desc"
              rows={3}
              placeholder="State the objective, round size, or specific due diligence scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-ink focus:outline-none focus:ring-[3px] focus:ring-info placeholder:text-muted resize-none min-h-[88px]"
            />
          </div>

          {/* Purpose & Expiration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="room-purpose" className="font-semibold text-ink">
                Room purpose
              </label>
              <select
                id="room-purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-ink focus:outline-none focus:ring-[3px] focus:ring-info min-h-[44px]"
              >
                {purposeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-solid text-ink">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="room-expiry" className="font-semibold text-ink">
                Auto-expiry date (optional)
              </label>
              <input
                id="room-expiry"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass border border-line text-ink focus:outline-none focus:ring-[3px] focus:ring-info min-h-[44px]"
              />
            </div>
          </div>

          {/* Owner Identity Binding Notice */}
          <div className="p-4 rounded-2xl glass border border-line space-y-1.5 text-xs text-muted bg-line/5">
            <span className="font-semibold text-ink flex items-center gap-1.5 text-xs">
              <Lock className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              <span>Wallet-bound ownership</span>
            </span>
            <p className="leading-relaxed">
              Room ownership is bound to{" "}
              <strong className="text-ink font-mono">{accountId || "founder.testnet"}</strong>.
              All administrative operations and invitations are authenticated with single-use
              NEP-413 signatures.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              size="lg"
              variant="primary"
              className="w-full"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Create room & generate commitments
            </Button>
          </div>
        </form>
      </GlassCard>
    </div>
  );
}
