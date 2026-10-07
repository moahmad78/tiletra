"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getActiveCpoWorkspaceStatus, exitCpoVendor } from "@/lib/cpo/auth";
import {
  Briefcase,
  Clock,
  LogOut,
  Store,
  ExternalLink,
  RefreshCw,
  Users,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
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

  const checkStatus = useCallback(async () => {
    try {
      const res = await getActiveCpoWorkspaceStatus();
      setStatus(res);
    } catch {
      setStatus({ active: false });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 6000);

    const handleWorkspaceChanged = (e: any) => {
      if (e.detail) {
        setStatus((prev) => ({
          ...prev,
          active: e.detail.active,
          vendorId: e.detail.vendorId || prev.vendorId,
          vendorName: e.detail.vendorName || prev.vendorName,
        }));
      }
      checkStatus();
    };

    window.addEventListener("cpo-workspace-changed", handleWorkspaceChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cpo-workspace-changed", handleWorkspaceChanged);
    };
  }, [checkStatus]);

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
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cpo-workspace-changed", { detail: { active: false } })
        );
      }
      router.refresh();
    } catch {
      toast.error("Failed to exit workspace");
    } finally {
      setExiting(false);
    }
  };

  // Reusable ticker items for continuous seamless loop
  const activeTickerItems = (
    <div className="flex items-center gap-6 pr-6">
      <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold">
        <Store className="w-3.5 h-3.5 text-[#F26522]" />
        <span>
          Active Vendor:{" "}
          <strong className="text-white underline decoration-[#F26522] font-black tracking-wide">
            {status.vendorName}
          </strong>
        </span>
      </span>
      <span className="text-white/60 font-mono text-[11px] bg-black/30 px-1.5 py-0.5 rounded">
        Vendor ID: {status.vendorId}
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="text-white/90">
        All product catalog uploads, variant edits &amp; price updates are currently bound to{" "}
        <strong className="text-amber-200">{status.vendorName}</strong>
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="inline-flex items-center gap-1.5 text-amber-200 font-mono font-bold bg-white/10 px-2 py-0.5 rounded">
        <Clock className="w-3 h-3 text-[#F26522] animate-pulse" />
        <span>Time Left: {timeFormatted}</span>
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="inline-flex items-center gap-1 text-white/75">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>CPO Management Session Active • All changes logged to Audit Trail</span>
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="text-white/70">
        Click &quot;Change Vendor&quot; to switch seller or &quot;Exit&quot; to return to Global View
      </span>
      <span className="text-[#F26522] font-bold">•</span>
    </div>
  );

  const inactiveTickerItems = (
    <div className="flex items-center gap-6 pr-6">
      <span className="inline-flex items-center gap-1.5 text-amber-300 font-bold">
        <AlertTriangle className="w-3.5 h-3.5 text-[#F26522]" />
        <span>NO VENDOR CURRENTLY SELECTED</span>
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="text-white/90">
        You are currently in Global CPO View • Please select a marketplace vendor to upload items, modify pricing, or update catalog listings
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="text-white/75">
        Click &quot;Select Vendor&quot; on the right to start an active management session
      </span>
      <span className="text-[#F26522] font-bold">•</span>
      <span className="text-white/60">
        All listings and vendor actions are strictly isolated and monitored
      </span>
      <span className="text-[#F26522] font-bold">•</span>
    </div>
  );

  return (
    <>
      <div
        className="shrink-0 z-40 bg-[#052a51] text-white border-b-2 border-[#F26522] shadow-sm px-3 md:px-4 py-1.5 notranslate overflow-hidden"
        translate="no"
      >
        <div className="max-w-[1920px] mx-auto flex items-center justify-between gap-3 text-xs">
          {status.active && status.vendorName ? (
            /* Active Vendor Workspace Mode with Marquee Notice */
            <>
              {/* Left Fixed Badge: CURRENTLY WORKING ON BEHALF OF */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#F26522] text-white shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">CURRENTLY WORKING ON BEHALF OF:</span>
                  <span className="sm:hidden">MANAGING:</span>
                </span>
              </div>

              {/* Center: Running Marquee Notice Ticker */}
              <div
                className="flex-1 min-w-0 overflow-hidden relative group py-0.5 cursor-default"
                title="Active workspace details (Hover to pause ticker)"
              >
                <div className="cpo-marquee-track items-center text-xs font-medium text-white/95">
                  {activeTickerItems}
                  <div aria-hidden="true" className="flex items-center">
                    {activeTickerItems}
                  </div>
                </div>
              </div>

              {/* Right Fixed Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors cursor-pointer border border-white/15"
                  title="Switch to another vendor"
                >
                  <RefreshCw className="w-3 h-3 text-[#F26522]" />
                  <span className="hidden md:inline">Change Vendor</span>
                  <span className="md:hidden">Switch</span>
                </button>

                <Link
                  href="/cpo/catalog?vendorId=all"
                  className="hidden lg:inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  <Users className="w-3 h-3 text-gray-300" />
                  <span>All Vendors</span>
                </Link>

                {status.vendorSlug && (
                  <Link
                    href={`/shop/vendor/${status.vendorSlug}`}
                    target="_blank"
                    className="hidden xl:inline-flex items-center gap-1 text-xs text-white/80 hover:text-white px-2 py-1 transition-colors"
                    title="View Vendor's Public Storefront"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Storefront</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </Link>
                )}

                <button
                  onClick={handleExit}
                  disabled={exiting}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  title="Exit vendor workspace"
                >
                  <LogOut className="w-3 h-3" />
                  <span>{exiting ? "..." : "Exit"}</span>
                </button>
              </div>
            </>
          ) : (
            /* Inactive Mode with Marquee Notice */
            <>
              {/* Left Badge: GLOBAL CPO NOTICE */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-slate-700 text-white shadow-xs">
                  <Store className="w-3.5 h-3.5 text-[#F26522]" />
                  <span className="hidden sm:inline">GLOBAL CPO NOTICE:</span>
                  <span className="sm:hidden">GLOBAL MODE:</span>
                </span>
              </div>

              {/* Center: Running Marquee Notice Ticker */}
              <div
                className="flex-1 min-w-0 overflow-hidden relative group py-0.5 cursor-default"
                title="Global CPO View (Hover to pause ticker)"
              >
                <div className="cpo-marquee-track items-center text-xs font-medium text-white/95">
                  {inactiveTickerItems}
                  <div aria-hidden="true" className="flex items-center">
                    {inactiveTickerItems}
                  </div>
                </div>
              </div>

              {/* Right Fixed Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/cpo/catalog?vendorId=all"
                  className="hidden sm:inline-flex items-center gap-1 text-xs text-white/80 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-colors"
                >
                  <Users className="w-3 h-3" />
                  <span>All Vendors</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsChooserOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
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
