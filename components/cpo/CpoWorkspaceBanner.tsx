"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveCpoWorkspaceStatus, exitCpoVendor } from "@/lib/cpo/auth";
import { Briefcase, Clock, LogOut, Store, ExternalLink, RefreshCw, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import CpoVendorChooserModal from "./CpoVendorChooserModal";

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
  const [isChooserOpen, setIsChooserOpen] = useState(false);

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

  const mins = Math.floor((status.secondsRemaining || 0) / 60);
  const secs = (status.secondsRemaining || 0) % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, "0")}`;

  const handleExit = async () => {
    setExiting(true);
    try {
      await exitCpoVendor();
      toast.success(`Exited workspace for ${status.vendorName || "vendor"}`);
      setStatus({ active: false });
      router.refresh();
    } catch {
      toast.error("Failed to exit workspace");
    } finally {
      setExiting(false);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-40 bg-[#052a51] text-white border-b-2 border-[#F26522] shadow-sm px-4 py-2 notranslate" translate="no">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          {status.active && status.vendorName ? (
            /* Active Vendor Workspace Mode */
            <>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#F26522] text-white shadow-2xs">
                  <Briefcase className="w-3 h-3" />
                  CPO WORKSPACE
                </span>
                <span className="text-white/80">
                  Managing:{" "}
                  <strong className="text-white font-bold underline decoration-[#F26522]">
                    {status.vendorName}
                  </strong>{" "}
                  <span className="text-white/60 font-mono text-[11px]">({status.vendorId?.slice(-6)})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors cursor-pointer border border-white/15"
                >
                  <RefreshCw className="w-3 h-3 text-[#F26522]" />
                  <span>Change Vendor</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <Link
                  href="/cpo/catalog?vendorId=all"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  <Users className="w-3 h-3 text-gray-300" />
                  <span>All Vendors View</span>
                </Link>

                <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-md border border-white/10 font-mono text-white text-xs">
                  <Clock className="w-3.5 h-3.5 text-[#F26522] animate-pulse" />
                  <span>Time Left: {timeFormatted}</span>
                </div>

                {status.vendorSlug && (
                  <Link
                    href={`/shop/vendor/${status.vendorSlug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Storefront</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}

                <button
                  onClick={handleExit}
                  disabled={exiting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{exiting ? "Exiting..." : "Exit"}</span>
                </button>
              </div>
            </>
          ) : (
            /* Inactive Mode: Clear Prompt to Select Vendor */
            <>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-700 text-white shadow-2xs">
                  <Store className="w-3 h-3 text-[#F26522]" />
                  VENDOR SELECTION REQUIRED
                </span>
                <span className="text-white/80 font-medium">
                  No vendor selected. Select a vendor to manage listings or create new products.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/cpo/catalog?vendorId=all"
                  className="inline-flex items-center gap-1 text-xs text-white/80 hover:text-white px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  <span>All Vendors View</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Select Vendor</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reusable Chooser Modal */}
      <CpoVendorChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        currentVendorId={status.vendorId}
      />
    </>
  );
}
