"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveWorkspaceStatus, endWorkspaceSession } from "@/lib/vendor-workspace-auth";
import { AlertTriangle, LogOut, Clock, ShieldAlert, Store, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function VendorWorkspaceBanner() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<{
    active: boolean;
    vendorId?: string;
    vendorName?: string;
    vendorSlug?: string;
    secondsRemaining?: number;
    idleSecondsRemaining?: number;
    adminEmail?: string;
    sessionId?: string;
  } | null>(null);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [exiting, setExiting] = useState(false);

  // Poll / check workspace status on mount and on visibility change
  const refreshStatus = async () => {
    try {
      const status = await getActiveWorkspaceStatus();
      setWorkspace(status);
      if (status.active && status.secondsRemaining !== undefined) {
        setTimeLeft(status.secondsRemaining);
      }
    } catch (err) {
      console.error("Error checking workspace status:", err);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 30000); // sync with server every 30s
    return () => clearInterval(interval);
  }, []);

  // Countdown timer locally
  useEffect(() => {
    if (!workspace?.active || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          toast.error("Vendor workspace session expired due to timeout. Redirecting...");
          router.push("/admin/vendors");
          router.refresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [workspace?.active, timeLeft, router]);

  const handleExit = async () => {
    try {
      setExiting(true);
      await endWorkspaceSession({ sessionId: workspace?.sessionId });
      toast.success("Exited vendor workspace mode.");
      setWorkspace(null);
      router.push("/admin/vendors");
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to exit workspace");
    } finally {
      setExiting(false);
    }
  };

  if (!workspace || !workspace.active) {
    return null;
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLowTime = timeLeft < 300; // under 5 minutes

  return (
    <>
      {/* Visual Accent Top Bar Border across viewport */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 z-[9999]" />

      {/* Non-dismissible Warning Banner */}
      <div className="sticky top-0 z-[9998] w-full bg-gradient-to-r from-[#991b1b] via-[#c2410c] to-[#9a3412] text-white px-4 py-2.5 shadow-lg border-b-2 border-amber-400/30">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Indicator & Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 font-black shrink-0 animate-pulse">
              <ShieldAlert size={14} />
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded text-[10px] text-amber-300 border border-amber-400/30">
                Admin Impersonation Mode
              </span>
              <span className="text-white/80">Working on behalf of:</span>
              <strong className="text-white font-extrabold underline decoration-amber-400 underline-offset-2 truncate">
                {workspace.vendorName}
              </strong>
              <span className="text-white/70 font-mono text-[11px]">
                ({workspace.vendorId})
              </span>
            </div>
          </div>

          {/* Right: Timer & Exit Action */}
          <div className="flex items-center gap-3 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono font-bold text-xs ${
                isLowTime
                  ? "bg-rose-950 text-rose-300 border border-rose-500 animate-bounce"
                  : "bg-black/30 text-amber-200 border border-amber-500/30"
              }`}
              title="Session expires after 60 min or 20 min idle"
            >
              <Clock size={13} className={isLowTime ? "text-rose-400" : "text-amber-300"} />
              <span>Time left: {formatTimer(timeLeft)}</span>
            </div>

            <Link
              href="/vendor/products/new"
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors border border-white/20"
            >
              + Quick Add Item
            </Link>

            <Link
              href="/admin/workspace-activity"
              className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/40 text-amber-200 font-bold text-[11px] transition-colors"
            >
              Activity Log
            </Link>

            <button
              onClick={handleExit}
              disabled={exiting}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <LogOut size={13} />
              {exiting ? "Exiting..." : "Exit Workspace"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
