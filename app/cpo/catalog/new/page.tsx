"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";
import CpoVendorChooserModal from "@/components/cpo/CpoVendorChooserModal";
import { getCpoVendors } from "@/lib/actions/cpo";
import { getActiveCpoWorkspaceStatus, selectCpoVendor } from "@/lib/cpo/auth";
import {
  ArrowLeft,
  Store,
  Loader2,
  Sparkles,
  Search,
  Package,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

function CpoNewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get("vendorId");

  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(vendorIdParam || null);
  const [loading, setLoading] = useState(true);
  const [isChooserOpen, setIsChooserOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    Promise.all([
      getCpoVendors({ status: "approved" }),
      getActiveCpoWorkspaceStatus(),
    ])
      .then(([vList, ws]) => {
        setVendors(vList);
        if (vendorIdParam) {
          setSelectedVendorId(vendorIdParam);
        } else if (ws.active && ws.vendorId) {
          setSelectedVendorId(ws.vendorId);
        } else {
          // NO DEFAULT VENDOR! Explicit selection is mandatory before Add Item.
          setSelectedVendorId(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load CPO vendor context:", err);
        toast.error("Could not load vendor directory");
      })
      .finally(() => setLoading(false));
  }, [vendorIdParam]);

  const handleVendorSelect = async (newId: string) => {
    if (!newId) return;
    setSwitching(true);
    const found = vendors.find((v) => v.id === newId);
    try {
      const res = await selectCpoVendor({
        vendorId: newId,
        reason: `CPO Adding Product for ${found?.businessName || newId}`,
      });
      if (res.success) {
        setSelectedVendorId(newId);
        toast.success(`Active vendor set to "${found?.businessName || newId}"`);
      } else {
        toast.error(res.error || "Failed to set active vendor");
      }
    } catch {
      toast.error("Error setting vendor context");
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400">
        <Loader2 className="animate-spin inline-block mb-3 text-[#F26522]" size={36} />
        <p className="text-sm font-medium">Loading vendor directory...</p>
      </div>
    );
  }

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  // ─────────────────────────────────────────────────────────────
  // MANDATORY VENDOR CHOOSER GATEWAY (if no vendor is selected)
  // ─────────────────────────────────────────────────────────────
  if (!selectedVendorId || !selectedVendor) {
    const filteredVendors = vendors.filter((v) => {
      const q = searchFilter.toLowerCase().trim();
      if (!q) return true;
      return (
        v.businessName.toLowerCase().includes(q) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        v.id.toLowerCase().includes(q)
      );
    });

    return (
      <div className="max-w-3xl mx-auto py-6 space-y-6 animate-in fade-in">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-3">
          <Link
            href="/cpo/catalog"
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors shadow-2xs"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Add New Product</h1>
            <p className="text-xs text-gray-500">Step 1 of 2: Select Vendor Destination</p>
          </div>
        </div>

        {/* Mandatory Selection Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-start gap-3.5 pb-4 border-b border-gray-100">
            <div className="p-3 bg-orange-50 text-[#F26522] rounded-2xl border border-orange-200 shrink-0">
              <Store size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Choose Vendor Before Adding Product</h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase tracking-wider">
                  Required
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Every catalog item, variant matrix, and image upload must belong to a verified vendor.
                No default vendor is pre-selected to prevent accidental misassignments.
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search vendor by business name, trade category, ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white transition-all"
              autoFocus
            />
          </div>

          {/* Vendors Grid */}
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {filteredVendors.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                No approved vendors matching &quot;{searchFilter}&quot;
              </div>
            ) : (
              filteredVendors.map((v) => {
                const itemCount = v._count?.products ?? 0;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVendorSelect(v.id)}
                    disabled={switching}
                    className="w-full text-left p-4 rounded-2xl border border-gray-200 hover:border-[#F26522] hover:bg-orange-50/30 transition-all flex items-center justify-between gap-4 cursor-pointer group shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 group-hover:text-[#F26522] transition-colors truncate">
                          {v.businessName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold">
                          {v.category || "General Materials"}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono mt-1">
                        Vendor ID: {v.id.slice(0, 16)}...
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold font-mono">
                        <Package size={13} className="text-[#F26522]" />
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </span>
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#052a51] group-hover:bg-[#F26522] text-white text-xs font-bold transition-colors">
                        Select &rarr;
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // VENDOR SELECTED: RENDER WIZARD WITH ACTIVE VENDOR LOCK
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Vendor Switcher Bar */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cpo/catalog"
            className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <span>Add New Catalog Product</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 uppercase">
                Ready
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Uploading on behalf of <strong>{selectedVendor.businessName}</strong>. All images and variants will be bound to this vendor.
            </p>
          </div>
        </div>

        {/* Change Vendor Control */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
          <Store className="w-4 h-4 text-[#F26522] shrink-0 ml-1" />
          <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Vendor:</span>
          <select
            value={selectedVendorId}
            onChange={(e) => handleVendorSelect(e.target.value)}
            disabled={switching}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522] cursor-pointer"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.businessName} ({v._count?.products ?? 0} items)
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsChooserOpen(true)}
            className="p-1.5 rounded-xl text-gray-500 hover:text-[#F26522] hover:bg-white transition-colors cursor-pointer"
            title="Browse full vendor list"
          >
            <Search size={15} />
          </button>
        </div>
      </div>

      {/* Selected Vendor Notice Banner */}
      <div className="bg-[#052a51]/5 border border-[#052a51]/15 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#052a51]">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-[#F26522] shrink-0" />
          <span>
            Active Vendor Workspace: <strong className="text-[#052a51] font-bold">{selectedVendor.businessName}</strong>
            <span className="text-gray-500 font-mono ml-1.5">({selectedVendor.category || "General Materials"})</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 font-mono">
            ID: {selectedVendor.id.slice(0, 14)}...
          </span>
          <button
            type="button"
            onClick={() => setIsChooserOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26522] hover:underline cursor-pointer ml-2"
          >
            <RefreshCw size={11} />
            Change Vendor
          </button>
        </div>
      </div>

      {/* Unified Product Upload Wizard */}
      <DynamicProductUploadForm
        vendorId={selectedVendorId}
        onSuccessRedirectUrl="/cpo/catalog"
        isAdminOrCpo={true}
      />

      {/* Vendor Chooser Modal */}
      <CpoVendorChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        currentVendorId={selectedVendorId}
        onSelectVendor={(vId) => handleVendorSelect(vId)}
        allowAllVendors={false}
      />
    </div>
  );
}

export default function CpoNewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-gray-400">
          <Loader2 className="animate-spin inline-block mb-3 text-[#F26522]" size={36} />
          <p className="text-sm font-medium">Loading form...</p>
        </div>
      }
    >
      <CpoNewProductContent />
    </Suspense>
  );
}
