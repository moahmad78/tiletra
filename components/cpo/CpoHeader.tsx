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
} from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    getActiveCpoWorkspaceStatus().then((res) => {
      if (res.active && res.vendorId) {
        setActiveVendorId(res.vendorId);
      } else {
        setActiveVendorId(null);
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
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.businessName?.toLowerCase().includes(q) ||
      v.contactEmail?.toLowerCase().includes(q) ||
      v.contactPhone?.includes(q) ||
      v.id?.includes(q)
    );
  });

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Search / Global Switcher */}
      <div className="relative">
        <button
          onClick={handleOpenSwitcher}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs text-slate-200 transition-colors shadow-sm"
        >
          <Store className="w-4 h-4 text-purple-400" />
          <span className="font-medium">
            {activeVendorId
              ? `Working as: ${vendors.find((v) => v.id === activeVendorId)?.businessName || "Active Vendor"}`
              : "Select Vendor to Manage"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Global Switcher Dropdown Modal */}
        {showSwitcher && (
          <div className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3 z-50 text-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                Switch Vendor Workspace
              </span>
              <button
                onClick={() => setShowSwitcher(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor name, ID, phone..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1">
              {loadingVendors ? (
                <div className="flex items-center justify-center py-6 text-xs text-slate-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span>Loading vendors...</span>
                </div>
              ) : filteredVendors.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No vendors found.
                </div>
              ) : (
                filteredVendors.map((v) => {
                  const isSelected = activeVendorId === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleSelectVendor(v.id)}
                      disabled={switching}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-left text-xs transition-colors ${
                        isSelected
                          ? "bg-purple-600/30 text-purple-200 border border-purple-500/50"
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-white truncate">{v.businessName}</div>
                        <div className="text-[10px] text-slate-400 truncate font-mono">
                          ID: {v.id.slice(-6)} • {v.category || "General"}
                        </div>
                      </div>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <span className="text-[10px] text-purple-400 shrink-0 hover:underline">Select</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {activeVendorId && (
              <div className="pt-2 mt-2 border-t border-slate-800">
                <button
                  onClick={handleExitCurrent}
                  className="w-full py-1 text-center text-xs text-red-400 hover:text-red-300 font-medium"
                >
                  Exit Current Workspace
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Identity & Logout */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs font-semibold text-white">Chief Product Officer</div>
            <div className="text-[11px] text-purple-300 font-mono">
              {userEmail || "cpo@intrihub.com"}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-800 border border-slate-700 text-slate-300 text-xs rounded-lg transition-colors disabled:opacity-50"
          title="Sign out of CPO Panel"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{loggingOut ? "Signing out..." : "Sign Out"}</span>
        </button>
      </div>
    </header>
  );
}
