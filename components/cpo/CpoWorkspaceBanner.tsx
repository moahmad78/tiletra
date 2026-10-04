"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveCpoWorkspaceStatus, exitCpoVendor } from "@/lib/cpo/auth";
import { Briefcase, Clock, LogOut, Store, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CpoWorkspaceBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<{
    active: boolean;
    vendorId?: string;
    vendorName?: string;
    vendorSlug?: string;
    secondsRemaining?: number;
    reason?: string;
  }>({ active: false });
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const check = async () => {
      try {
        const res = await getActiveCpoWorkspaceStatus();
        setStatus(res);
      } catch {
        setStatus({ active: false });
      }
    };

    check();
    interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer locally
  useEffect(() => {
    if (!status.active || !status.secondsRemaining) return;
    const timer = setInterval(() => {
      setStatus((prev) => {
        if (!prev.secondsRemaining || prev.secondsRemaining <= 1) {
          return { ...prev, active: false, secondsRemaining: 0 };
        }
        return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status.active]);

  if (!status.active || !status.vendorName) {
    return null;
  }

  const mins = Math.floor((status.secondsRemaining || 0) / 60);
  const secs = (status.secondsRemaining || 0) % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;

  const handleExit = async () => {
    setExiting(true);
    try {
      await exitCpoVendor();
      toast.success(`Exited workspace for ${status.vendorName}`);
      setStatus({ active: false });
      router.refresh();
    } catch {
      toast.error("Failed to exit workspace");
    } finally {
      setExiting(false);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white border-b-2 border-purple-500 shadow-lg px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500 text-white shadow-sm">
            <Briefcase className="w-3.5 h-3.5" />
            CPO Workspace
          </span>
          <span className="text-purple-200">
            Working on behalf of:{" "}
            <strong className="text-white font-semibold underline decoration-purple-400">
              {status.vendorName}
            </strong>{" "}
            <span className="text-purple-300 font-mono text-xs">({status.vendorId?.slice(-6)})</span>
          </span>
          {status.reason && (
            <span className="hidden md:inline-block text-purple-300 text-xs italic">
              • {status.reason}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-purple-950/80 px-2.5 py-1 rounded-md border border-purple-700/60 font-mono text-purple-200 text-xs">
            <Clock className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>Time Left: {timeFormatted}</span>
          </div>

          {status.vendorSlug && (
            <Link
              href={`/shop/vendor/${status.vendorSlug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs text-purple-200 hover:text-white transition-colors"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Storefront</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}

          <button
            onClick={handleExit}
            disabled={exiting}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{exiting ? "Exiting..." : "Exit Workspace"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
