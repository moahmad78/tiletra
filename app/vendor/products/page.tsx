"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import {
  getVendorProducts,
  toggleVendorProductStatus,
  deleteVendorProduct,
} from "@/lib/actions/vendor";
import type { Product } from "@/lib/data/products";
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
} from "lucide-react";
import { toast } from "sonner";

export default function VendorProductsPage() {
  const { vendor } = useVendorAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "active" | "paused" | "pending" | "rejected">("all");

  const loadData = async () => {
    if (!vendor?.id) return;
    try {
      setLoading(true);
      const prods = await getVendorProducts(vendor.id);
      setProducts(prods);
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

        <Link
          href="/vendor/products/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus size={16} /> Add New Product
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-200/80 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Products ({tabCounts.all})
          </button>

          <button
            onClick={() => setFilterTab("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Active on Store ({tabCounts.active})
          </button>

          <button
            onClick={() => setFilterTab("paused")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "paused"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Paused ({tabCounts.paused})
          </button>

          <button
            onClick={() => setFilterTab("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "pending"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Pending Review ({tabCounts.pending})
          </button>

          <button
            onClick={() => setFilterTab("rejected")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              filterTab === "rejected"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Rejected ({tabCounts.rejected})
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

        {/* Products Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-emerald-600" size={28} />
            <p className="text-xs font-medium">Loading your products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            <Package size={40} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No products found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No products matching "${searchQuery}"`
                : "No products in this category yet. Click '+ Add New Product' to list one."}
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

                      {/* Approval Status */}
                      <td className="py-3.5 px-3">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock size={11} /> Pending Review
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={11} /> Rejected
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Approved
                          </span>
                        )}
                      </td>

                      {/* Store Status Toggle */}
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => handleToggleStatus(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                            isPaused
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          }`}
                          title={isPaused ? "Click to Activate" : "Click to Pause"}
                        >
                          {isPaused ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                          <span>{isPaused ? "Paused" : "Active"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
    </div>
  );
}
