"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DynamicProductUploadForm from "@/components/admin/DynamicProductUploadForm";
import { getCpoVendors } from "@/lib/actions/cpo";
import { getActiveCpoWorkspaceStatus, selectCpoVendor } from "@/lib/cpo/auth";
import { ArrowLeft, Store, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

function CpoNewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdParam = searchParams.get("vendorId");

  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(vendorIdParam || null);
  const [loading, setLoading] = useState(true);

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
        } else if (vList.length > 0) {
          setSelectedVendorId(vList[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [vendorIdParam]);

  const handleVendorChange = async (newId: string) => {
    setSelectedVendorId(newId);
    const found = vendors.find((v) => v.id === newId);
    if (found) {
      await selectCpoVendor({
        vendorId: newId,
        reason: `CPO Adding Product for ${found.businessName}`,
      });
      toast.info(`Switched active vendor to ${found.businessName}`);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400">
        <Loader2 className="animate-spin inline-block mb-3 text-[#F26522]" size={36} />
        <p className="text-sm font-medium">Loading vendor details...</p>
      </div>
    );
  }

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header & Vendor Selector */}
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
                All Options Enabled
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload items with multiple variants (Size/Finish/Color), photos, specs, and price calculator.
            </p>
          </div>
        </div>

        {/* Vendor Selector Dropdown */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
          <Store className="w-4 h-4 text-[#F26522] shrink-0 ml-1" />
          <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Assign to Vendor:</span>
          <select
            value={selectedVendorId || ""}
            onChange={(e) => handleVendorChange(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.businessName} ({v.category || "General"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Vendor Notice */}
      {selectedVendor && (
        <div className="bg-[#052a51]/5 border border-[#052a51]/15 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs text-[#052a51]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F26522] shrink-0" />
            <span>
              Uploading on behalf of: <strong>{selectedVendor.businessName}</strong> ({selectedVendor.category || "General"})
            </span>
          </div>
          <span className="text-[11px] text-gray-500 font-mono">
            ID: {selectedVendor.id}
          </span>
        </div>
      )}

      {/* Comprehensive Dynamic Product Upload Form */}
      <DynamicProductUploadForm
        vendorId={selectedVendorId}
        onSuccessRedirectUrl="/cpo/catalog"
        isAdminOrCpo={true}
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
