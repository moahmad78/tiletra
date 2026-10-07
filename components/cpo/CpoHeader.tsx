"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { logoutCpo, getActiveCpoWorkspaceStatus } from "@/lib/cpo/auth";
import {
  User,
  LogOut,
  Store,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import CpoVendorChooserModal from "./CpoVendorChooserModal";

export default function CpoHeader({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [isChooserOpen, setIsChooserOpen] = useState(false);

  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeVendorName, setActiveVendorName] = useState<string | null>(null);

  const syncWorkspace = useCallback(async () => {
    try {
      const res = await getActiveCpoWorkspaceStatus();
      if (res.active && res.vendorId) {
        setActiveVendorId(res.vendorId);
        setActiveVendorName(res.vendorName || null);
      } else {
        setActiveVendorId(null);
        setActiveVendorName(null);
      }
    } catch {
      setActiveVendorId(null);
      setActiveVendorName(null);
    }
  }, []);

  useEffect(() => {
    syncWorkspace();
    const interval = setInterval(syncWorkspace, 6000);

    const handleWorkspaceChanged = (e: any) => {
      if (e.detail) {
        if (e.detail.active && e.detail.vendorId) {
          setActiveVendorId(e.detail.vendorId);
          setActiveVendorName(e.detail.vendorName || null);
        } else {
          setActiveVendorId(null);
          setActiveVendorName(null);
        }
      }
      syncWorkspace();
    };

    window.addEventListener("cpo-workspace-changed", handleWorkspaceChanged);

    return () => {
      clearInterval(interval);
      window.removeEventListener("cpo-workspace-changed", handleWorkspaceChanged);
    };
  }, [syncWorkspace]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutCpo();
      toast.success("Logged out successfully");
      router.push("/vendor/login");
    } catch {
      toast.error("Logout failed");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <header
        className="h-16 sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-200/90 px-4 md:px-6 flex items-center justify-between gap-4 z-30 shrink-0 shadow-2xs notranslate"
        translate="no"
      >
        {/* Left: Synchronized Vendor Switcher Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsChooserOpen(true)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeVendorId
                ? "bg-[#052a51]/5 border-[#052a51]/20 text-[#052a51] hover:bg-[#052a51]/10"
                : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
            }`}
            title="Click to choose or change active vendor"
          >
            <Store className="w-4 h-4 text-[#F26522]" />
            <span className="font-bold">
              {activeVendorName ? `Working as: ${activeVendorName}` : "Select Vendor to Manage"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        {/* Right: Quick Action & User Menu (Primary Single '+ Add Item' Action) */}
        <div className="flex items-center gap-3">
          <Link
            href={
              activeVendorId
                ? `/cpo/catalog/new?vendorId=${activeVendorId}`
                : "/cpo/catalog/new"
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:scale-[1.02]"
            title="Add new catalog item"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Item</span>
          </Link>

          <div className="flex items-center gap-2 pl-3 border-l border-gray-200 text-xs">
            <div className="w-8 h-8 rounded-full bg-[#052a51]/10 text-[#052a51] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="text-xs font-bold text-gray-900">Chief Product Officer</div>
              <div className="text-[11px] text-gray-500 font-mono">
                {userEmail || "cpo@intrihub.com"}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Synchronized Reusable Vendor Chooser Modal */}
      <CpoVendorChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        currentVendorId={activeVendorId}
        onSelectVendor={(vId, bName) => {
          setActiveVendorId(vId);
          setActiveVendorName(bName);
        }}
      />
    </>
  );
}
