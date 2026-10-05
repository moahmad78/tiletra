"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logoutCpo, selectCpoVendor, getActiveCpoWorkspaceStatus, exitCpoVendor } from "@/lib/cpo/auth";
import { getCpoVendors } from "@/lib/actions/cpo";
import {
  User,
  LogOut,
  Store,
  Search,
  Check,
  ChevronDown,
  Loader2,
  Briefcase,
  X,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CpoHeader({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  // Global Vendor Switcher Dropdown State
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [switching, setSwitching] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const [activeVendorName, setActiveVendorName] = useState<string | null>(null);

  useEffect(() => {
    getActiveCpoWorkspaceStatus().then((res) => {
      if (res.active && res.vendorId) {
        setActiveVendorId(res.vendorId);
        setActiveVendorName(res.vendorName || null);
      } else {
        setActiveVendorId(null);
        setActiveVendorName(null);
      }
    });
  }, []);

  const loadVendors = async () => {
    if (vendors.length > 0) return;
    setLoadingVendors(true);
    try {
      const list = await getCpoVendors();
      setVendors(list);
    } catch {
      // ignore
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleOpenSwitcher = () => {
    setShowSwitcher((prev) => !prev);
    if (!showSwitcher) {
      loadVendors();
    }
  };

  const handleSelectVendor = async (vendorId: string) => {
    setSwitching(true);
    try {
      const res = await selectCpoVendor({ vendorId, reason: "Quick vendor switcher from CPO top bar" });
      if (res.success) {
        toast.success(`Active workspace switched to ${res.vendor?.businessName}`);
        setActiveVendorId(vendorId);
        setActiveVendorName(res.vendor?.businessName || null);
        setShowSwitcher(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to switch vendor");
      }
    } catch {
      toast.error("Failed to switch vendor");
    } finally {
      setSwitching(false);
    }
  };

  const handleExitCurrent = async () => {
    try {
      await exitCpoVendor();
      setActiveVendorId(null);
      setActiveVendorName(null);
      setShowSwitcher(false);
      toast.success("Exited active workspace");
      router.refresh();
    } catch {
      toast.error("Failed to exit workspace");
    }
  };

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

  const filteredVendors = vendors.filter((v) => {
    if (!searchQuery) return true;
    const term = searchQuery.toLowerCase();
    return (
      v.businessName?.toLowerCase().includes(term) ||
      v.category?.toLowerCase().includes(term) ||
      v.contactPhone?.includes(term)
    );
  });

  return (
    <header className="h-16 bg-white border-b border-gray-200/90 px-4 md:px-6 flex items-center justify-between gap-4 z-30 shrink-0 shadow-2xs notranslate" translate="no">
      {/* Left: Quick Vendor Switcher */}
      <div className="relative">
        <button
          onClick={handleOpenSwitcher}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
            activeVendorId
              ? "bg-[#052a51]/5 border-[#052a51]/20 text-[#052a51] hover:bg-[#052a51]/10"
              : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Store className="w-4 h-4 text-[#F26522]" />
          <span className="font-bold">
            {activeVendorName ? `Working as: ${activeVendorName}` : "Select Vendor to Manage"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
        </button>

        {/* Vendor Switcher Dropdown */}
        {showSwitcher && (
          <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
              <span className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Select Active Vendor
              </span>
              <button
                onClick={() => setShowSwitcher(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, category..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white"
                autoFocus
              />
            </div>

            {/* Vendor List */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {loadingVendors ? (
                <div className="py-6 flex items-center justify-center text-xs text-gray-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#F26522]" />
                  <span>Loading vendors...</span>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="py-4 text-center text-xs text-gray-500">
                  No vendors found
                </div>
              ) : (
                filteredVendors.map((v) => {
                  const isSelected = v.id === activeVendorId;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVendor(v.id)}
                      disabled={switching}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-[#052a51]/5 border border-[#052a51]/20 font-bold text-[#052a51]"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold truncate text-gray-900 flex items-center gap-1.5">
                          <span>{v.businessName}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-[#F26522] text-white px-1.5 py-0.2 rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate">
                          {v.category || "General"} • {v.contactPhone || v.contactEmail}
                        </div>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-[#F26522] shrink-0" />
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">Select</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Exit Current Workspace Option */}
            {activeVendorId && (
              <div className="pt-2 mt-2 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={handleExitCurrent}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Exit Active Workspace
                </button>
                <Link
                  href="/cpo/vendors"
                  onClick={() => setShowSwitcher(false)}
                  className="text-xs text-[#052a51] hover:underline font-semibold"
                >
                  View All Vendors →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Quick Action & User Menu */}
      <div className="flex items-center gap-3">
        <Link
          href="/cpo/catalog/new"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
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
            <div className="text-[11px] text-gray-500 font-mono">{userEmail || "cpo@intrihub.com"}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
          title="Sign Out"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
