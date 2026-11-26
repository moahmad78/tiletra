"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Store, Briefcase, ChevronDown } from "lucide-react";
import { getActiveWorkspaceStatus } from "@/lib/vendor-workspace-auth";
import { getAdminVendors } from "@/lib/actions/admin-vendor";
import VendorWorkspaceModal, { type VendorOption } from "@/components/admin/VendorWorkspaceModal";

export type AdminPortalKey = "admin" | "vendor" | "cpo";

interface AdminPortalSwitchTabsProps {
  activePortal: AdminPortalKey;
  /** Light white-header capsule ("header") or dark executive-bar capsule ("banner"). */
  variant?: "header" | "banner";
  /** Optional pre-loaded vendor list to avoid refetching if parent already queried it. */
  vendors?: VendorOption[];
  className?: string;
}

/**
 * Admin-only 3-way portal switch tabs (`Admin` | `Vendor` | `CPO`).
 * Rendered exclusively on the Admin Panel and inside verified Admin access bars
 * when the Super Admin is viewing `/vendor` or `/cpo` (never shown to regular vendors or CPOs).
 */
export default function AdminPortalSwitchTabs({
  activePortal,
  variant = "header",
  vendors: initialVendors,
  className = "",
}: AdminPortalSwitchTabsProps) {
  const router = useRouter();
  const [activeVendorName, setActiveVendorName] = useState<string | null>(null);
  const [hasActiveWorkspace, setHasActiveWorkspace] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fetchedVendors, setFetchedVendors] = useState<VendorOption[]>([]);

  const vendorsList =
    initialVendors && initialVendors.length > 0 ? initialVendors : fetchedVendors;

  const refreshWorkspace = useCallback(() => {
    void getActiveWorkspaceStatus()
      .then((status) => {
        setHasActiveWorkspace(Boolean(status.active && status.vendorId));
        setActiveVendorName(status.active ? status.vendorName || null : null);
      })
      .catch(() => {
        setHasActiveWorkspace(false);
        setActiveVendorName(null);
      });
  }, []);

  useEffect(() => {
    let mounted = true;
    getActiveWorkspaceStatus()
      .then((status) => {
        if (!mounted) return;
        setHasActiveWorkspace(Boolean(status.active && status.vendorId));
        setActiveVendorName(status.active ? status.vendorName || null : null);
      })
      .catch(() => {
        if (!mounted) return;
        setHasActiveWorkspace(false);
        setActiveVendorName(null);
      });

    const handleChange = () => refreshWorkspace();
    window.addEventListener("vendor-workspace-changed", handleChange);
    return () => {
      mounted = false;
      window.removeEventListener("vendor-workspace-changed", handleChange);
    };
  }, [activePortal, refreshWorkspace]);

  const openShopSelector = useCallback(async () => {
    try {
      if (vendorsList.length === 0) {
        const list = await getAdminVendors();
        setFetchedVendors((list || []) as VendorOption[]);
      }
    } catch (e) {
      console.error("Failed to fetch vendors for switcher:", e);
    } finally {
      setModalOpen(true);
    }
  }, [vendorsList.length]);

  const handleVendorTabClick = () => {
    if (activePortal === "vendor") {
      void openShopSelector();
      return;
    }
    if (hasActiveWorkspace) {
      router.push("/vendor");
      return;
    }
    void openShopSelector();
  };

  const isHeader = variant === "header";
  const shellClasses = isHeader
    ? "inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200/90 shadow-2xs"
    : "inline-flex items-center gap-1 p-0.5 rounded-xl bg-black/30 border border-white/15";

  const baseTab =
    "inline-flex items-center gap-1.5 rounded-lg font-extrabold transition-all cursor-pointer select-none whitespace-nowrap";
  const sizeTab = isHeader ? "px-2.5 sm:px-3 py-1.5 text-xs" : "px-2.5 py-1 text-[11px]";

  const inactiveTab = isHeader
    ? "text-slate-600 hover:text-[#052a51] hover:bg-white/80"
    : "text-white/80 hover:text-white hover:bg-white/10";

  return (
    <>
      <div
        role="tablist"
        aria-label="Switch Admin, Vendor, or CPO panel"
        className={`${shellClasses} ${className}`}
      >
        {/* 1. Admin Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activePortal === "admin"}
          onClick={() => {
            if (activePortal !== "admin") router.push("/admin");
          }}
          className={`${baseTab} ${sizeTab} ${
            activePortal === "admin"
              ? "bg-[#052a51] text-white shadow-xs"
              : inactiveTab
          }`}
          title="Super Admin Console (/admin)"
        >
          <ShieldCheck size={isHeader ? 14 : 13} className="shrink-0" />
          <span>Admin</span>
        </button>

        {/* 2. Vendor Tab (1-click enter if active, else quick shop selector) */}
        <div className="inline-flex items-center">
          <button
            type="button"
            role="tab"
            aria-selected={activePortal === "vendor"}
            onClick={handleVendorTabClick}
            className={`${baseTab} ${sizeTab} ${
              activePortal === "vendor"
                ? "bg-emerald-600 text-white shadow-xs"
                : hasActiveWorkspace
                  ? isHeader
                    ? "bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100"
                    : "text-amber-200 hover:bg-white/10"
                  : inactiveTab
            } ${hasActiveWorkspace && isHeader ? "rounded-r-none pr-2" : ""}`}
            title={
              hasActiveWorkspace && activeVendorName
                ? `Open Vendor Panel (${activeVendorName})`
                : "Select a vendor store to open /vendor"
            }
          >
            <Store size={isHeader ? 14 : 13} className="shrink-0" />
            <span>Vendor</span>
            {hasActiveWorkspace && activeVendorName && isHeader && (
              <span className="hidden xl:inline max-w-[92px] truncate text-[10px] font-bold opacity-85">
                · {activeVendorName}
              </span>
            )}
          </button>

          {hasActiveWorkspace && (
            <button
              type="button"
              onClick={() => void openShopSelector()}
              className={`${
                isHeader
                  ? "px-1.5 py-1.5 rounded-r-lg text-amber-800 bg-amber-50 hover:bg-amber-100 border-y border-r border-amber-200/80"
                  : "px-1 py-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 ml-0.5"
              } transition-colors cursor-pointer`}
              title="Switch Vendor Shop"
              aria-label="Switch Vendor Shop"
            >
              <ChevronDown size={13} />
            </button>
          )}
        </div>

        {/* 3. CPO Tab */}
        <button
          type="button"
          role="tab"
          aria-selected={activePortal === "cpo"}
          onClick={() => {
            if (activePortal !== "cpo") router.push("/cpo");
          }}
          className={`${baseTab} ${sizeTab} ${
            activePortal === "cpo"
              ? "bg-[#F26522] text-white shadow-xs"
              : inactiveTab
          }`}
          title="Direct access to CPO Panel (/cpo)"
        >
          <Briefcase size={isHeader ? 14 : 13} className="shrink-0" />
          <span>CPO</span>
        </button>
      </div>

      {modalOpen && (
        <VendorWorkspaceModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            refreshWorkspace();
          }}
          vendors={vendorsList}
        />
      )}
    </>
  );
}
