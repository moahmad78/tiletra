"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { startWorkspaceSession } from "@/lib/vendor-workspace-auth";
import { getAdminVendors } from "@/lib/actions/admin-vendor";
import { WORKSPACE_REASONS } from "@/lib/config/vendor-workspace-permissions";
import {
  Search,
  Store,
  X,
  Loader2,
  CheckCircle2,
  FileText,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export interface VendorOption {
  id: string;
  businessName: string;
  contactPhone?: string;
  contactEmail?: string;
  category?: string;
  status: string;
}

interface VendorWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors?: VendorOption[];
  preSelectedVendor?: VendorOption | null;
  directTo?: string; // e.g. "products/new"
}

export default function VendorWorkspaceModal({
  isOpen,
  onClose,
  vendors: initialVendors,
  preSelectedVendor,
  directTo,
}: VendorWorkspaceModalProps) {
  const router = useRouter();
  const [fetchedVendors, setFetchedVendors] = useState<VendorOption[]>([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(preSelectedVendor?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState<string>(WORKSPACE_REASONS[0].value);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const hasInitialVendors = Boolean(initialVendors && initialVendors.length > 0);
  const vendors = hasInitialVendors ? (initialVendors as VendorOption[]) : fetchedVendors;

  useEffect(() => {
    if (hasInitialVendors || !isOpen || preSelectedVendor) {
      return;
    }
    let mounted = true;
    queueMicrotask(() => {
      if (mounted) setLoadingVendors(true);
    });
    getAdminVendors()
      .then((list) => {
        if (mounted) setFetchedVendors((list || []) as VendorOption[]);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoadingVendors(false);
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, hasInitialVendors, preSelectedVendor]);

  if (!isOpen) return null;

  const sortedVendors = [...vendors].sort((a, b) => {
    if (a.status === "approved" && b.status !== "approved") return -1;
    if (a.status !== "approved" && b.status === "approved") return 1;
    return a.businessName.localeCompare(b.businessName);
  });

  const filteredVendors = sortedVendors.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.businessName.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      (v.contactPhone && v.contactPhone.includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q))
    );
  });

  const selectedVendor =
    preSelectedVendor || vendors.find((v) => v.id === selectedVendorId);

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetVendorId = selectedVendorId || preSelectedVendor?.id;
    if (!targetVendorId) {
      toast.error("Please select a vendor store to open their panel.");
      return;
    }

    try {
      setLoading(true);
      const res = await startWorkspaceSession({
        vendorId: targetVendorId,
        reason,
        note: note.trim() || undefined,
        fastAdminSwitch: true,
      });

      if (res.success) {
        toast.success(`Switched to Vendor Panel: ${res.vendor?.businessName}`);
        onClose();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("vendor-workspace-changed"));
        }

        const targetUrl =
          directTo === "products/new" ? "/vendor/products/new" : "/vendor";

        if (typeof window !== "undefined" && window.location.pathname.startsWith("/vendor")) {
          window.location.assign(targetUrl);
        } else {
          router.push(targetUrl);
          router.refresh();
        }
      } else {
        toast.error(res.error || "Failed to open vendor panel.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#052a51] to-[#0a437e] text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Store size={20} className="text-[#F26522]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Switch to Vendor Panel</h2>
              <p className="text-xs text-white/75 mt-0.5">
                Pick any vendor store for instant Admin access (fully audit-logged).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStartSession} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-gray-700">
          {/* 1. Target Vendor Selection */}
          <div>
            <label className="font-bold text-gray-900 mb-1.5 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Store size={14} className="text-emerald-600" />
                Select Vendor Store
              </span>
              {!preSelectedVendor && vendors.length > 0 && (
                <span className="text-[10px] font-semibold text-gray-400">
                  {filteredVendors.length} store{filteredVendors.length === 1 ? "" : "s"}
                </span>
              )}
            </label>

            {preSelectedVendor ? (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-gray-900">{preSelectedVendor.businessName}</p>
                  <p className="text-[11px] text-gray-500 font-mono">ID: {preSelectedVendor.id}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {preSelectedVendor.category || "General"}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shop name, ID, phone, or category..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#052a51] text-xs"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100 bg-gray-50/40">
                  {loadingVendors ? (
                    <div className="p-6 flex items-center justify-center gap-2 text-gray-400">
                      <Loader2 size={15} className="animate-spin" />
                      <span>Loading vendor stores...</span>
                    </div>
                  ) : filteredVendors.length === 0 ? (
                    <p className="p-4 text-center text-gray-400">No matching vendors found</p>
                  ) : (
                    filteredVendors.map((v) => {
                      const isSelected = selectedVendorId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVendorId(v.id)}
                          className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-emerald-50/70 transition-colors cursor-pointer ${
                            isSelected ? "bg-emerald-50 font-bold border-l-4 border-emerald-600" : ""
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1.5">
                              {isSelected && <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />}
                              <span className="truncate">{v.businessName}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">
                              {v.category || "General"} • {v.id}
                            </p>
                          </div>
                          <span
                            className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold shrink-0 ${
                              v.status === "approved"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {v.status}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Reason & Optional Note */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="font-bold text-gray-900 mb-1 flex items-center gap-1.5">
                <FileText size={14} className="text-[#052a51]" />
                Purpose
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-[#052a51] font-medium"
              >
                {WORKSPACE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note / reference (e.g. Updating catalog prices)"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-[#052a51] text-xs"
              />
            </div>
          </div>

          {/* Verified Admin Notice */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5 text-[11px] text-slate-600">
            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
            <span>
              <strong>Verified Admin Session:</strong> Direct access without password/OTP re-entry (auto-logged in audit trail, 60m session).
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedVendor}
              className="flex-[2] py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Opening Vendor Panel...
                </>
              ) : (
                <>
                  <span>Open Vendor Panel</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
