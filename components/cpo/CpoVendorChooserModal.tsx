"use client";

import React, { useState, useEffect } from "react";
import { getCpoVendors } from "@/lib/actions/cpo";
import { selectCpoVendor, exitCpoVendor } from "@/lib/cpo/auth";
import { Search, Store, Check, X, Loader2, Package, Users } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CpoVendorChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVendorId?: string | null;
  onSelectVendor?: (vendorId: string, vendorName: string) => void;
  title?: string;
  description?: string;
  allowAllVendors?: boolean;
}

export default function CpoVendorChooserModal({
  isOpen,
  onClose,
  currentVendorId = null,
  onSelectVendor,
  title = "Select Vendor to Manage",
  description = "Choose a vendor below. All catalog creations, edits, and image uploads will be scoped to this vendor.",
  allowAllVendors = true,
}: CpoVendorChooserModalProps) {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getCpoVendors({ status: "approved" })
        .then((list) => setVendors(list))
        .catch((err) => {
          console.error("Failed to load vendors:", err);
          toast.error("Could not load vendor list");
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = vendors.filter((v) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      v.businessName.toLowerCase().includes(q) ||
      (v.category && v.category.toLowerCase().includes(q)) ||
      (v.contactPhone && v.contactPhone.includes(q)) ||
      (v.contactEmail && v.contactEmail.toLowerCase().includes(q)) ||
      v.id.toLowerCase().includes(q)
    );
  });

  const handleSelect = async (vId: string, bName: string) => {
    setSubmittingId(vId);
    try {
      const res = await selectCpoVendor({
        vendorId: vId,
        reason: `CPO active management session for ${bName}`,
      });
      if (res.success) {
        toast.success(`Active vendor set to "${bName}"`);
        if (onSelectVendor) {
          onSelectVendor(vId, bName);
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("cpo-workspace-changed", {
              detail: { active: true, vendorId: vId, vendorName: bName },
            })
          );
        }
        onClose();
        router.refresh();
      } else {
        toast.error(res.error || "Failed to switch vendor");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to set active vendor");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleViewAllVendors = async () => {
    setSubmittingId("all");
    try {
      await exitCpoVendor();
      toast.info("Viewing all vendors catalog (read-only mode)");
      if (onSelectVendor) {
        onSelectVendor("all", "All Vendors");
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("cpo-workspace-changed", {
            detail: { active: false },
          })
        );
      }
      onClose();
      router.push("/cpo/catalog?vendorId=all");
    } catch {
      toast.error("Failed to reset vendor selection");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-gray-200 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#F26522]/10 text-[#F26522] rounded-xl">
                <Store size={20} />
              </span>
              <h2 className="text-lg font-black text-[#052a51] tracking-tight">{title}</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by vendor name, trade category, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522]"
              autoFocus
            />
          </div>
        </div>

        {/* Vendors List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#F26522]" />
              <span className="text-xs font-medium">Loading approved vendors...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No vendors found matching &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((v) => {
              const isSelected = v.id === currentVendorId;
              const isSubmitting = submittingId === v.id;
              const itemCount = v._count?.products ?? 0;

              return (
                <button
                  key={v.id}
                  onClick={() => handleSelect(v.id, v.businessName)}
                  disabled={isSubmitting}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? "bg-[#052a51]/5 border-[#052a51]/30 shadow-xs ring-1 ring-[#052a51]/20"
                      : "bg-white border-gray-200 hover:border-[#F26522]/40 hover:bg-orange-50/30"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {v.businessName}
                      </span>
                      {isSelected && (
                        <span className="px-2 py-0.5 rounded-md bg-[#052a51] text-white text-[9px] font-black uppercase tracking-wider">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1 font-mono">
                      <span>ID: {v.id.slice(0, 14)}...</span>
                      <span>•</span>
                      <span className="text-gray-700 font-sans font-semibold">
                        {v.category || "General Materials"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 text-[11px] font-bold">
                        <Package size={12} className="text-[#F26522]" />
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin text-[#F26522]" />
                    ) : isSelected ? (
                      <div className="w-7 h-7 rounded-full bg-[#052a51] text-white flex items-center justify-center">
                        <Check size={14} />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center hover:border-[#F26522] hover:text-[#F26522]">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        {allowAllVendors && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 text-xs">
            <span className="text-gray-500 text-[11px]">
              Or browse all catalog products across every vendor:
            </span>
            <button
              type="button"
              onClick={handleViewAllVendors}
              disabled={submittingId === "all"}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Users size={14} />
              <span>All Vendors View</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
