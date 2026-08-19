"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminPendingProducts,
  approveProduct,
  rejectProduct,
} from "@/lib/actions/admin-vendor";
import type { Product } from "@/lib/data/products";
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Store,
  ExternalLink,
  Layers,
  Sparkles,
  AlertCircle,
  Tag,
  Loader2,
  Eye,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

export default function AdminProductApprovalsPage() {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect / Reject modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadPending = async () => {
    try {
      setLoading(true);
      const data = await getAdminPendingProducts();
      setPendingProducts(data);
    } catch (e) {
      console.error("Error loading pending products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (productId: string) => {
    setActionLoading(true);
    const res = await approveProduct(productId);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      setSelectedProduct(null);
      setPendingProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      toast.error(res.error || "Failed to approve product");
    }
  };

  const handleReject = async (productId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    setActionLoading(true);
    const res = await rejectProduct(productId, rejectionReason);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      setSelectedProduct(null);
      setRejectionReason("");
      setPendingProducts((prev) => prev.filter((p) => p.id !== productId));
    } else {
      toast.error(res.error || "Failed to reject product");
    }
  };

  const filtered = pendingProducts.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q) ||
      (p.vendorName && p.vendorName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Product Listing Approvals Queue
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review and approve vendor-submitted products before they appear live on the storefront
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">
              {pendingProducts.length} Listings Awaiting Review
            </h3>
            <p className="text-xs text-gray-500">
              Once approved, products will immediately sync with the live storefront
            </p>
          </div>
        </div>

        <button
          onClick={loadPending}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
        >
          Refresh Queue
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-200/80 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, or submitting vendor shop..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all"
          />
        </div>

        {/* List of Pending Products */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#F26522]" size={28} />
            <p className="text-xs font-medium">Checking pending queue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-2" />
            <h3 className="text-sm font-bold text-gray-700">All caught up!</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              There are no vendor products currently waiting for approval.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((p) => {
              const primaryVariant = p.variants[0];
              const price = primaryVariant?.pricePerBox || 1000;

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Submitting Vendor */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Store size={13} /> {p.vendorName || "Vendor Shop"}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {p.unitOfSale ? `Unit: ${p.unitOfSale}` : "Unit: box"}
                      </span>
                    </div>

                    {/* Product Basic Details */}
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0] || "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Category: <strong>{p.categoryName}</strong> • Material: {p.material}
                        </p>
                        <p className="text-xs font-black text-gray-900 mt-1">
                          Base Price: ₹{price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {/* Description preview */}
                    {p.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 bg-white p-2.5 rounded-xl border border-gray-200/60">
                        {p.description}
                      </p>
                    )}

                    {/* Variants and Attributes Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-gray-700 border border-gray-200">
                        {p.variants.length} Variant(s)
                      </span>
                      {p.attributes?.slice(0, 3).map((a, i) => (
                        <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-white text-gray-600 border border-gray-200">
                          {a.key}: {a.value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200/80">
                    <button
                      onClick={() => {
                        setSelectedProduct(p);
                        setRejectionReason("");
                      }}
                      className="px-3 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      Reject with Reason
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleApprove(p.id)}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Approve & Push Live
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Reject Product Listing
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Provide constructive feedback so the vendor (<strong>{selectedProduct.vendorName}</strong>) knows what to fix.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Image resolution too low, missing technical specifications, or price mismatch..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:border-rose-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReject(selectedProduct.id)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {actionLoading ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
