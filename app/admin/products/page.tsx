"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Plus,
  Search,
  Trash2,
  Copy,
  Edit,
  ExternalLink,
  Upload,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { getProducts, deleteProduct, createProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import { getAdminVendors } from "@/lib/actions/admin-vendor";
import type { Product } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";
import { getLowestPrice, getLowestBoxPrice } from "@/lib/data/products";
import { toast } from "sonner";
import { Store, ShieldCheck, Clock, PauseCircle, PlayCircle } from "lucide-react";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedVendor, setSelectedVendor] = useState<string>("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>("all");
  const [selectedApprovalStatus, setSelectedApprovalStatus] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, cats, vends] = await Promise.all([
        getProducts({ includeAllStatuses: true }),
        getCategories(),
        getAdminVendors(),
      ]);
      setProducts(prods);
      setCategories(cats);
      setVendors(vends);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.material.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.vendorName && p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" || p.categorySlug === selectedCategory;

    const matchesVendor =
      selectedVendor === "all"
        ? true
        : selectedVendor === "platform"
        ? !p.vendorId
        : p.vendorId === selectedVendor;

    const matchesApproval =
      selectedApprovalStatus === "all"
        ? true
        : p.approvalStatus === selectedApprovalStatus;

    const totalStock = p.variants.reduce((sum, v) => sum + v.stockBoxes, 0);
    const matchesStock =
      selectedStockStatus === "all"
        ? true
        : selectedStockStatus === "low"
        ? totalStock < 25
        : selectedStockStatus === "out"
        ? totalStock <= 0
        : totalStock >= 25;

    return matchesSearch && matchesCategory && matchesVendor && matchesApproval && matchesStock;
  });

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      const res = await deleteProduct(id);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setSelectedIds((prev) => prev.filter((i) => i !== id));
        toast.success(`Deleted ${name}`);
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    }
  };

  const handleDuplicate = async (p: Product) => {
    const dupName = `${p.name} (Copy)`;
    const res = await createProduct({
      name: dupName,
      categorySlug: p.categorySlug,
      categoryName: p.categoryName,
      description: p.description,
      material: p.material,
      images: p.images,
      variants: p.variants.map((v) => ({
        size: v.size,
        finish: v.finish,
        color: v.color,
        pricePerBox: v.pricePerBox,
        pricePerSqft: v.pricePerSqft,
        sqftPerBox: v.sqftPerBox,
        stockBoxes: v.stockBoxes,
      })),
      isBestseller: false,
      isNew: true,
      specs: p.specs,
    });

    if (res.success && res.product) {
      setProducts((prev) => [res.product!, ...prev]);
      toast.success("Product duplicated!");
    } else {
      toast.error(res.error || "Failed to duplicate product");
    }
  };

  const handleBulkDelete = async () => {
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedIds.length} selected products?`
      )
    ) {
      for (const id of selectedIds) {
        await deleteProduct(id);
      }
      setProducts((prev) => prev.filter((p) => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      toast.success("Selected products deleted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading tile catalog from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header & Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Tile Catalog Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total {products.length} tile designs in your database
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/products/bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <Upload size={14} />
            <span>CSV Bulk Import</span>
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add New Tile</span>
          </Link>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tiles by name, category, or material..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Vendor Filter */}
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="all">All Vendors</option>
              <option value="platform">Platform Direct</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName}
                </option>
              ))}
            </select>

            {/* Approval Status Filter */}
            <select
              value={selectedApprovalStatus}
              onChange={(e) => setSelectedApprovalStatus(e.target.value)}
              className="w-full sm:w-36 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="all">All Approvals</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending Approval</option>
              <option value="rejected">Rejected</option>
            </select>

            {/* Stock Filter */}
            <select
              value={selectedStockStatus}
              onChange={(e) => setSelectedStockStatus(e.target.value)}
              className="w-full sm:w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="all">All Stock</option>
              <option value="in">In Stock (25+)</option>
              <option value="low">Low Stock (&lt;25)</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar if items selected */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 bg-[#052a51]/5 border border-[#052a51]/10 rounded-xl animate-in fade-in">
            <span className="text-xs font-bold text-[#052a51]">
              {selectedIds.length} product(s) selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Delete Selected</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Products Table ── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[840px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4 w-10">
                  <button
                    onClick={handleSelectAll}
                    className="p-1 rounded text-gray-400 hover:text-[#052a51] cursor-pointer"
                  >
                    {selectedIds.length === filteredProducts.length &&
                    filteredProducts.length > 0 ? (
                      <CheckSquare size={16} className="text-[#F26522]" />
                    ) : (
                      <Square size={16} />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Tile Design</th>
                <th className="py-3.5 px-4">Vendor Shop</th>
                <th className="py-3.5 px-4">Category / Material</th>
                <th className="py-3.5 px-4">Pricing</th>
                <th className="py-3.5 px-4">Total Inventory</th>
                <th className="py-3.5 px-4">Approval & Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                    No matching tiles found for your filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const totalStock = p.variants.reduce((s, v) => s + v.stockBoxes, 0);
                  const isPending = p.approvalStatus === "pending";
                  const isRejected = p.approvalStatus === "rejected";
                  const isPaused = p.status === "paused";

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isSelected ? "bg-[#F26522]/5" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleSelect(p.id)}
                          className="p-1 text-gray-400 hover:text-[#052a51] cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare size={16} className="text-[#F26522]" />
                          ) : (
                            <Square size={16} />
                          )}
                        </button>
                      </td>

                      {/* Design Image & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            <Image
                              src={p.images[0] || "/placeholders/product.svg"}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${p.id}/edit`}
                              className="font-bold text-[#052a51] hover:text-[#F26522] line-clamp-1"
                            >
                              {p.name}
                            </Link>
                            <p className="text-[10px] text-gray-400">
                              {p.variants.length} variant(s) · {p.variants.map((v) => v.size).join(", ")}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Vendor Column */}
                      <td className="py-3 px-4">
                        {p.vendorName ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Store size={11} /> {p.vendorName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            Platform Direct
                          </span>
                        )}
                      </td>

                      {/* Category & Material */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-[#052a51]">{p.categoryName}</span>
                        <p className="text-[10px] text-gray-400">{p.material}</p>
                      </td>

                      {/* Pricing */}
                      <td className="py-3 px-4">
                        <span className="font-black text-[#052a51]">
                          {formatPrice(getLowestPrice(p))}
                          <span className="text-[10px] text-gray-400 font-normal">/sqft</span>
                        </span>
                        <p className="text-[10px] text-gray-400">
                          {formatPrice(getLowestBoxPrice(p))}/box
                        </p>
                      </td>

                      {/* Stock */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-extrabold px-2 py-0.5 rounded-md text-xs ${
                              totalStock <= 0
                                ? "bg-red-50 text-red-600 border border-red-200"
                                : totalStock < 25
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            {totalStock} boxes
                          </span>
                        </div>
                      </td>

                      {/* Approval & Store Visibility */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 w-fit">
                              <Clock size={10} /> Pending Approval
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 w-fit">
                              Rejected
                            </span>
                          )}
                          {(!p.approvalStatus || p.approvalStatus === "approved") && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 w-fit">
                              Approved
                            </span>
                          )}

                          {isPaused ? (
                            <span className="text-[9px] text-amber-600 font-bold flex items-center gap-1">
                              <PauseCircle size={10} /> Paused
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                              <PlayCircle size={10} /> Live on Store
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-1.5 text-gray-400 hover:text-[#052a51] inline-block rounded-lg hover:bg-gray-100"
                          title="Preview public page"
                        >
                          <ExternalLink size={14} />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(p)}
                          className="p-1.5 text-gray-400 hover:text-[#052a51] rounded-lg hover:bg-gray-100 cursor-pointer"
                          title="Duplicate tile"
                        >
                          <Copy size={14} />
                        </button>
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-[#F26522] inline-block rounded-lg hover:bg-gray-100"
                          title="Edit product"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Delete tile"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
