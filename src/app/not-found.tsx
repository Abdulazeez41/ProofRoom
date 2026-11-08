import React from "react";
import Link from "next/link";
import { FolderX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[60vh]">
      <GlassCard
        radius="3xl"
        className="w-full max-w-md p-8 text-center border-line space-y-5 bg-solid/80"
      >
        <div className="w-14 h-14 rounded-2xl bg-warn/10 text-warn flex items-center justify-center mx-auto">
          <FolderX className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs uppercase font-mono tracking-wider text-muted">Error 404</span>
          <h1 className="text-xl font-bold text-ink">Page not found</h1>
          <p className="text-xs sm:text-sm text-muted max-w-xs mx-auto leading-relaxed">
            The page you requested does not exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <Link href="/" className="w-full sm:w-auto">
            <Button size="sm" variant="primary" className="w-full" icon={<Home className="w-3.5 h-3.5" />}>
              Go to homepage
            </Button>
          </Link>
          <Link href="/app" className="w-full sm:w-auto">
            <Button size="sm" variant="outline" className="w-full" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
              Workspace
            </Button>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
