"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminPendingProducts,
  approveProduct,
  rejectProduct,
} from "@/lib/actions/admin-vendor";
import { useLiveSync, broadcastLiveEvent } from "@/lib/live-sync";
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
  Percent,
  DollarSign,
  Package,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";

export default function AdminProductApprovalsPage() {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Modal state (Full detail view with commission breakdown)
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Reject Modal state
  const [rejectingProduct, setRejectingProduct] = useState<Product | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadPending = async () => {
    try {
      const data = await getAdminPendingProducts();
      setPendingProducts(data);
    } catch (e) {
      console.error("Error loading pending products:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Universal Live Sync Hook (Cross-tab broadcast + Tab Focus + 4s Auto-Poll) ──
  useLiveSync({
    eventTypes: ["product:created", "product:updated", "product:status-toggled", "data:refresh"],
    onSync: loadPending,
    pollIntervalMs: 4000,
    enableFocusRefresh: true,
  });

  const handleApprove = async (productId: string) => {
    setActionLoading(true);
    const res = await approveProduct(productId);
    setActionLoading(false);
    if (res.success) {
      broadcastLiveEvent("product:updated", { productId, approvalStatus: "approved" });
      toast.success(res.message);
      setInspectingProduct(null);
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
      broadcastLiveEvent("product:updated", { productId, approvalStatus: "rejected" });
      toast.success(res.message);
      setRejectingProduct(null);
      setInspectingProduct(null);
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
          <h1 className="text-xl md:text-2xl font-black text-[#052a51] tracking-tight">
            Product Listing Approvals Queue
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Review full specs, pricing, and platform commission split before pushing vendor listings live.
          </p>
        </div>

        <button
          onClick={loadPending}
          className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold transition-colors"
        >
          Refresh Queue
        </button>
      </div>

      {/* Overview Stats */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-gray-900">
              {pendingProducts.length} Listings Awaiting Review
            </h3>
            <p className="text-xs text-gray-500">
              Once approved, products will immediately sync with the live customer catalog.
            </p>
          </div>
        </div>
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
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#052a51] focus:outline-hidden transition-all"
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
              const unitPrice = primaryVariant?.pricePerBox || 1000;
              const commissionRate = p.vendorCommissionRate || 15.0;
              const platformShare = (unitPrice * commissionRate) / 100;
              const vendorShare = unitPrice - platformShare;
              const totalStock = p.variants.reduce((acc, v) => acc + (v.stockBoxes || 0), 0);

              return (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header: Submitting Vendor & Commission Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#052a51] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        <Store size={13} className="text-[#F26522]" /> {p.vendorName || "Vendor Shop"}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {commissionRate}% Fee
                      </span>
                    </div>

                    {/* Product Basic Details */}
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-gray-200 overflow-hidden shrink-0 border border-gray-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images[0] || "/placeholders/product.svg"}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-900 leading-tight">
                          {p.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.categoryName} • Unit: <span className="font-semibold text-gray-700">{p.unitOfSale || "box"}</span> • Stock: <span className="font-bold text-gray-900">{totalStock}</span>
                        </p>
                        <p className="text-xs font-black text-gray-900 mt-1">
                          Price: ₹{unitPrice.toLocaleString("en-IN")} / {p.unitOfSale || "box"}
                        </p>
                      </div>
                    </div>

                    {/* Commission Split Highlight Box */}
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-[11px] space-y-1">
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Commission ({commissionRate}%):</span>
                        <strong className="text-[#F26522]">+₹{platformShare.toFixed(0)} platform earn</strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span>Vendor Receives:</span>
                        <strong className="text-emerald-700">₹{vendorShare.toFixed(0)} per {p.unitOfSale || "box"}</strong>
                      </div>
                    </div>

                    {/* Description preview */}
                    {p.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 bg-white p-2.5 rounded-xl border border-gray-200/60">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 flex items-center justify-between gap-2 border-t border-gray-200/80">
                    <button
                      onClick={() => {
                        setInspectingProduct(p);
                        setActiveImageIdx(0);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-[#052a51] hover:bg-blue-50 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Eye size={13} /> Full Specs
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRejectingProduct(p);
                          setRejectionReason("");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-white border border-gray-300 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprove(p.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FULL PRODUCT INSPECTION MODAL (Section 5.1) ── */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Detailed Product Review & Pricing
                </span>
                <h2 className="text-xl font-black text-[#052a51] mt-0.5">{inspectingProduct.name}</h2>
                <p className="text-xs text-gray-500">
                  Submitting Vendor: <strong className="text-gray-800">{inspectingProduct.vendorName}</strong>
                </p>
              </div>
              <button
                onClick={() => setInspectingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <div className="w-full h-56 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inspectingProduct.images[activeImageIdx] || "/placeholders/product.svg"}
                  alt={inspectingProduct.name}
                  className="w-full h-full object-contain"
                />
              </div>
              {inspectingProduct.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {inspectingProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                        activeImageIdx === idx ? "border-[#052a51]" : "border-gray-200 opacity-60"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="Thumb" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Calculated Commission & Pricing Box */}
            {(() => {
              const primaryVariant = inspectingProduct.variants[0];
              const unitPrice = primaryVariant?.pricePerBox || 1000;
              const rate = inspectingProduct.vendorCommissionRate || 15.0;
              const platformAmount = (unitPrice * rate) / 100;
              const vendorAmount = unitPrice - platformAmount;

              return (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl border border-blue-200/80 space-y-2">
                  <h4 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-1.5">
                    <Percent size={14} className="text-[#F26522]" /> Pricing & Commission Split Calculation
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Customer Price</p>
                      <p className="text-base font-black text-gray-900 mt-0.5">₹{unitPrice.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-gray-400">per {inspectingProduct.unitOfSale || "box"}</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-blue-200">
                      <p className="text-[10px] text-[#052a51] font-bold uppercase">Platform ({rate}%)</p>
                      <p className="text-base font-black text-[#F26522] mt-0.5">+₹{platformAmount.toFixed(0)}</p>
                      <p className="text-[10px] text-blue-700">Platform earnings</p>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-emerald-200">
                      <p className="text-[10px] text-emerald-800 font-bold uppercase">Vendor Receives</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">₹{vendorAmount.toFixed(0)}</p>
                      <p className="text-[10px] text-emerald-600">Net payout/unit</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Complete Description (Full Text, Untruncated) */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Description</h4>
              <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-200 leading-relaxed">
                {inspectingProduct.description || "No description provided."}
              </p>
            </div>

            {/* Variants Table */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Variants & Inventory</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2 px-2">Size</th>
                      <th className="py-2 px-2">Finish</th>
                      <th className="py-2 px-2">Color</th>
                      <th className="py-2 px-2">Price</th>
                      <th className="py-2 px-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inspectingProduct.variants.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2 px-2 font-bold text-gray-800">{v.size}</td>
                        <td className="py-2 px-2 text-gray-600">{v.finish}</td>
                        <td className="py-2 px-2 text-gray-600">{v.color}</td>
                        <td className="py-2 px-2 font-bold text-gray-900">₹{v.pricePerBox}</td>
                        <td className="py-2 px-2 font-bold text-[#052a51]">{v.stockBoxes} units</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attributes / Specs */}
            {inspectingProduct.attributes && inspectingProduct.attributes.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Specifications & Attributes</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {inspectingProduct.attributes.map((a, i) => (
                    <div key={i} className="p-2 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                      <span className="text-[10px] text-gray-400 uppercase font-bold block">{a.key}</span>
                      <strong className="text-gray-800">{a.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Actions */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setRejectingProduct(inspectingProduct);
                  setRejectionReason("");
                }}
                className="px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-colors"
              >
                Reject with Feedback
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleApprove(inspectingProduct.id)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 size={16} /> Approve & Publish Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT PRODUCT MODAL (Section 5.2) ── */}
      {rejectingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div>
              <h3 className="text-base font-black text-red-600">
                Reject Product Listing
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Provide clear feedback so <strong>{rejectingProduct.vendorName}</strong> knows what to fix.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Rejection Reason (Required) *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="e.g. Image quality too low, price mismatch with MRP, or incorrect product specifications..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium focus:bg-white focus:border-red-500 focus:outline-hidden resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingProduct(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReject(rejectingProduct.id)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors"
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
