"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useEffectiveVendor } from "@/hooks/useEffectiveVendor";
import AdminActivitySection from "@/components/vendor/AdminActivitySection";
import {
  getVendorProducts,
  toggleVendorProductStatus,
  deleteVendorProduct,
  updateVendorProduct,
} from "@/lib/actions/vendor";
import { getCategories } from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import type { Product } from "@/lib/data/products";
import { resolveColorHex } from "@/lib/catalog";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  ExternalLink,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
  Layers,
  X,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function VendorProductsPage() {
  const { vendor } = useEffectiveVendor();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "paused" | "pending" | "rejected">("all");

  const loadData = async () => {
    if (!vendor?.id) return;
    try {
      setLoading(true);
      const [prods, cats] = await Promise.all([
        getVendorProducts(vendor.id),
        getCategories(),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error("Error loading vendor products:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendor?.id]);

  const handleToggleStatus = async (product: Product) => {
    if (!vendor?.id) return;
    const newStatus = (product.status || "active") === "active" ? "paused" : "active";
    const res = await toggleVendorProductStatus(vendor.id, product.id, newStatus);
    if (res.success) {
      toast.success(res.message);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: newStatus } : p))
      );
    } else {
      toast.error(res.error || "Failed to update product status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!vendor?.id) return;
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const res = await deleteVendorProduct(vendor.id, id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        toast.success(`Deleted ${name}`);
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    }
  };

  // Filter products by search and status tabs
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "active") {
      return (p.status || "active") === "active" && (p.approvalStatus || "approved") === "approved";
    }
    if (filterTab === "paused") {
      return p.status === "paused";
    }
    if (filterTab === "pending") {
      return p.approvalStatus === "pending";
    }
    if (filterTab === "rejected") {
      return p.approvalStatus === "rejected";
    }
    return true;
  });

  const tabCounts = {
    all: products.length,
    active: products.filter((p) => (p.status || "active") === "active" && (p.approvalStatus || "approved") === "approved").length,
    paused: products.filter((p) => p.status === "paused").length,
    pending: products.filter((p) => p.approvalStatus === "pending").length,
    rejected: products.filter((p) => p.approvalStatus === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Product Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage your shop's inventory, pricing, approval status, and storefront visibility
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/products/bulk"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 text-xs font-bold border border-gray-200 transition-all shrink-0 cursor-pointer"
          >
            <Upload size={15} /> Bulk CSV Import
          </Link>
          <Link
            href="/vendor/products/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus size={16} /> Add New Product
          </Link>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-200/80 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === "all"
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Products ({tabCounts.all})
          </button>
          <button
            onClick={() => setFilterTab("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === "active"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Live on Store ({tabCounts.active})
          </button>
          <button
            onClick={() => setFilterTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === "pending"
                ? "bg-blue-600 text-white"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Pending Review ({tabCounts.pending})
          </button>
          <button
            onClick={() => setFilterTab("paused")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === "paused"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Paused ({tabCounts.paused})
          </button>
          <button
            onClick={() => setFilterTab("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              filterTab === "rejected"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            Action Required ({tabCounts.rejected})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, category, or material..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />
        </div>

        {/* Product Table */}
        {loading ? (
          <div className="py-20 text-center text-gray-400">
            <Loader2 className="animate-spin inline-block mb-2 text-emerald-600" size={24} />
            <p className="text-xs font-medium">Loading your shop catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Package className="mx-auto mb-3 text-gray-300" size={36} />
            <p className="text-sm font-bold text-gray-700">No products found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery
                ? `No products matching "${searchQuery}"`
                : "Get started by adding your first product listing"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-y border-gray-200/80">
                <tr>
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">Category / Material</th>
                  <th className="py-3 px-3">Base Price</th>
                  <th className="py-3 px-3">Approval State</th>
                  <th className="py-3 px-3">Store Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const isPaused = p.status === "paused";
                  const isApproved = p.approvalStatus === "approved";
                  const isPending = p.approvalStatus === "pending";
                  const isRejected = p.approvalStatus === "rejected";
                  const lowestBoxPrice = p.variants[0]?.pricePerBox || 1000;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100 relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.images[0] || "/placeholders/product.svg"}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <p className="font-bold text-gray-900 truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono truncate">{p.slug}</p>
                            {p.createdByCpoId || p.actorRole === "CPO" ? (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <ShieldCheck size={11} className="text-purple-600" />
                                Added by IntriHub
                              </span>
                            ) : p.createdByAdminId ? (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                <ShieldCheck size={11} className="text-blue-600" />
                                Added by IntriHub
                              </span>
                            ) : p.updatedByCpoId ? (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                <ShieldCheck size={11} className="text-purple-600" />
                                Edited by IntriHub
                              </span>
                            ) : p.updatedByAdminId ? (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <ShieldCheck size={11} className="text-indigo-600" />
                                Edited by IntriHub
                              </span>
                            ) : null}
                            {isRejected && p.rejectionReason && (
                              <div className="mt-1 p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-start gap-1">
                                <AlertCircle size={12} className="shrink-0 mt-0.5" />
                                <span>
                                  <strong>Fix Needed:</strong> {p.rejectionReason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <p className="font-semibold text-gray-800">{p.categoryName}</p>
                        <p className="text-[10px] text-gray-400">{p.material}</p>
                      </td>

                      {/* Pricing */}
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-gray-900">₹{lowestBoxPrice.toLocaleString("en-IN")}</p>
                        <p className="text-[10px] text-gray-400">per {p.unitOfSale || "box"}</p>
                      </td>

                      {/* 4-State Status Badge (Section 4.2) */}
                      <td className="py-3.5 px-3">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                            <Clock size={12} className="text-amber-700" /> Under Review
                          </span>
                        )}
                        {isApproved && !isPaused && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                            <CheckCircle2 size={12} className="text-emerald-700" /> Live
                          </span>
                        )}
                        {isApproved && isPaused && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs">
                            <PauseCircle size={12} className="text-gray-500" /> Paused
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-900 border border-red-300 shadow-2xs">
                            <XCircle size={12} className="text-red-700" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Store Status Toggle */}
                      <td className="py-3.5 px-3">
                        {isApproved ? (
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                              isPaused
                                ? "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
                            }`}
                            title={isPaused ? "Click to Activate on storefront" : "Click to Pause listing"}
                          >
                            {isPaused ? <PlayCircle size={13} className="text-amber-700" /> : <PauseCircle size={13} className="text-emerald-700" />}
                            <span>{isPaused ? "Resume" : "Pause"}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">
                            {isPending ? "Awaiting admin" : "Fix & resubmit"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/vendor/products/${p.id}/edit`}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Listing (Full Editor & Multi-Variety)"
                          >
                            <Edit size={15} />
                          </Link>
                          {isApproved && !isPaused && (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View on Public Store"
                            >
                              <ExternalLink size={15} />
                            </Link>
                          )}
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Transparency & Activity Section */}
      {vendor?.id && <AdminActivitySection vendorId={vendor.id} />}
    </div>
  );
}
