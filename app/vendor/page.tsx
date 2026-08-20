"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import {
  getVendorDashboardStats,
  getVendorProducts,
  toggleVendorProductStatus,
} from "@/lib/actions/vendor";
import { useLiveSync, broadcastLiveEvent } from "@/lib/live-sync";
import type { Product } from "@/lib/data/products";
import {
  Package,
  Boxes,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice } from "@/lib/formatters";
import VendorKycBanner from "@/components/vendor/VendorKycBanner";

export default function VendorDashboardPage() {
  const { vendor } = useVendorAuth();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    pausedProducts: 0,
    pendingApprovals: 0,
    rejectedProducts: 0,
    lowStockCount: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!vendor?.id) return;
    try {
      const [s, prods] = await Promise.all([
        getVendorDashboardStats(vendor.id),
        getVendorProducts(vendor.id),
      ]);
      setStats(s);
      setRecentProducts(prods.slice(0, 5));
    } catch (e) {
      console.error("Error loading vendor dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Universal Live Sync Hook (Cross-tab broadcast + Tab Focus + 4s Auto-Poll) ──
  useLiveSync({
    eventTypes: ["order:new", "order:status-updated", "product:updated", "data:refresh"],
    onSync: loadData,
    pollIntervalMs: 4000,
    enableFocusRefresh: true,
  });

  const handleToggleStatus = async (product: Product) => {
    if (!vendor?.id) return;
    const newStatus = (product.status || "active") === "active" ? "paused" : "active";

    // Optimistic UI update
    setRecentProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
    );

    const res = await toggleVendorProductStatus(vendor.id, product.id, newStatus);
    if (res.success) {
      broadcastLiveEvent("product:status-toggled", { productId: product.id, status: newStatus });
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to update product status");
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Mandatory KYC Warning Banner */}
      <VendorKycBanner vendor={vendor} />

      {/* Welcome Banner */}
      <div className="bg-linear-to-r from-[#052a51] via-[#07386d] to-[#0a488a] rounded-3xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
            <ShieldCheck size={14} /> Verified Shop Account
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Welcome back, {vendor?.ownerName || vendor?.businessName}!
          </h1>
          <p className="text-sm text-white/70 max-w-xl">
            {vendor?.businessName} • {vendor?.category || "Building Materials"} • Platform Commission:{" "}
            <strong>{vendor?.commissionRate}%</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all"
          >
            <Plus size={18} /> Add New Listing
          </Link>
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-xs transition-colors"
          >
            Manage Catalog
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Products */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Live on Store
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {stats.activeProducts}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={12} /> Active listings
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Package size={22} />
          </div>
        </div>

        {/* Paused Products */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Paused Products
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {stats.pausedProducts}
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5 flex items-center gap-1">
              <PauseCircle size={12} /> Hidden from store
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <PauseCircle size={22} />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              In Review Queue
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {stats.pendingApprovals}
            </h3>
            <p className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
              <Clock size={12} /> Super Admin review
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Clock size={22} />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Low Stock Items
            </p>
            <h3 className="text-2xl font-black text-gray-900 mt-1">
              {stats.lowStockCount}
            </h3>
            <p className="text-[11px] text-rose-600 font-semibold mt-0.5 flex items-center gap-1">
              <AlertTriangle size={12} /> &lt; 15 units remaining
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Boxes size={22} />
          </div>
        </div>
      </div>

      {/* Recent Catalog & Fast Toggle Widget */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-gray-900">Your Product Listings</h2>
            <p className="text-xs text-gray-500">
              Quickly toggle listings active or paused without deleting them
            </p>
          </div>
          <Link
            href="/vendor/products"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            View All ({stats.totalProducts}) <ArrowRight size={14} />
          </Link>
        </div>

        {recentProducts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            <Package size={40} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No products uploaded yet</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Start building your store catalog by uploading your first product with customized attributes and variants.
            </p>
            <Link
              href="/vendor/products/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              <Plus size={16} /> Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentProducts.map((p) => {
              const isPaused = p.status === "paused";
              const isApproved = p.approvalStatus === "approved";
              const isPending = p.approvalStatus === "pending";
              const isRejected = p.approvalStatus === "rejected";

              return (
                <div
                  key={p.id}
                  className="py-3.5 flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0] || "/placeholders/product.svg"}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 truncate">
                        {p.categoryName} • From ₹{p.variants[0]?.pricePerBox || 1000}/{p.unitOfSale || "box"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Approval Status Badge */}
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        ⏳ Pending Approval
                      </span>
                    )}
                    {isRejected && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                        title={p.rejectionReason || "Listing rejected"}
                      >
                        ❌ Rejected
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ Approved
                      </span>
                    )}

                    {/* Status Toggle Switch */}
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isPaused
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      }`}
                      title={isPaused ? "Click to Activate" : "Click to Pause"}
                    >
                      {isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                      <span>{isPaused ? "Paused" : "Active"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
