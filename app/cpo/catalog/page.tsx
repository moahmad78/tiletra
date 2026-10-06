"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getCpoCatalog,
  getCpoVendors,
  cpoReuploadProductImage,
} from "@/lib/actions/cpo";
import { deleteProduct, updateProduct } from "@/lib/actions/products";
import { getActiveCpoWorkspaceStatus, selectCpoVendor } from "@/lib/cpo/auth";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import {
  Package,
  Search,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Briefcase,
  Store,
  Layers,
  Loader2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";

function CpoCatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorIdFromQuery = searchParams.get("vendorId");

  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState(vendorIdFromQuery || "all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  const [selectedImageFilter, setSelectedImageFilter] = useState<"all" | "missing" | "with_image">("all");

  // Re-upload Modal State
  const [reuploadProduct, setReuploadProduct] = useState<any | null>(null);
  const [reuploadImages, setReuploadImages] = useState<string[]>([]);
  const [isReuploading, setIsReuploading] = useState(false);
  const [isSavingReupload, setIsSavingReupload] = useState(false);

  // Active Workspace
  const [workspace, setWorkspace] = useState<{
    active: boolean;
    vendorId?: string;
    vendorName?: string;
  }>({ active: false });

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, vList, ws] = await Promise.all([
        getCpoCatalog({
          search: searchQuery,
          vendorId: selectedVendorFilter,
          status: selectedStatusFilter,
          imageFilter: selectedImageFilter,
          page,
          limit: 20,
        }),
        getCpoVendors({ status: "approved" }),
        getActiveCpoWorkspaceStatus(),
      ]);

      setProducts(catRes.products);
      setTotal(catRes.total);
      setTotalPages(catRes.totalPages);
      setVendors(vList);
      setWorkspace(ws);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorIdFromQuery) {
      setSelectedVendorFilter(vendorIdFromQuery);
    }
  }, [vendorIdFromQuery]);

  useEffect(() => {
    loadData();
  }, [selectedVendorFilter, selectedStatusFilter, selectedImageFilter, page]);

  const handleSaveReupload = async () => {
    if (!reuploadProduct) return;
    const validImages = reuploadImages.filter(
      (img) => img && img.trim() && !img.includes("placeholder")
    );
    if (validImages.length === 0) {
      toast.error("Please add at least one valid product image before saving.");
      return;
    }
    setIsSavingReupload(true);
    try {
      const res = await cpoReuploadProductImage({
        productId: reuploadProduct.id,
        images: validImages,
      });
      if (res.success) {
        toast.success(`Successfully updated images for "${reuploadProduct.name}"!`);
        setReuploadProduct(null);
        setReuploadImages([]);
        loadData();
      } else {
        toast.error(res.error || "Failed to update images");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred while saving images");
    } finally {
      setIsSavingReupload(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleVendorFilterChange = async (newVendorId: string) => {
    setSelectedVendorFilter(newVendorId);
    setPage(1);
    if (newVendorId !== "all") {
      const found = vendors.find((v) => v.id === newVendorId);
      if (found) {
        await selectCpoVendor({
          vendorId: newVendorId,
          reason: `Catalog management for ${found.businessName}`,
        });
      }
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        toast.success(`Product "${name}" deleted`);
        loadData();
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  const handleToggleStatus = async (product: any) => {
    const newStatus = product.status === "active" ? "paused" : "active";
    try {
      const res = await updateProduct(product.id, {
        status: newStatus,
      });
      if (res.success) {
        toast.success(`Product status set to ${newStatus}`);
        loadData();
      } else {
        toast.error("Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const selectedVendor = vendors.find((v) => v.id === selectedVendorFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Vendor Catalog &amp; Items</span>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-lg font-mono">
              {total} Total
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Browse, add, and edit vendor items with full variant options (Size, Finish, Color, Stock, Price).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/cpo/categories"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:border-[#F26522] hover:text-[#F26522] text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#F26522]" />
            <span>Manage Categories</span>
          </Link>
          <Link
            href={
              selectedVendorFilter !== "all"
                ? `/cpo/catalog/new?vendorId=${selectedVendorFilter}`
                : workspace.vendorId
                ? `/cpo/catalog/new?vendorId=${workspace.vendorId}`
                : "/cpo/catalog/new"
            }
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add Product (All Options)</span>
          </Link>
        </div>
      </div>

      {/* Primary Vendor Selector & Search Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Vendor Picker Dropdown */}
          <div className="w-full md:w-auto flex items-center gap-2">
            <Store className="w-4 h-4 text-[#F26522] shrink-0" />
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Filter by Vendor:</span>
            <select
              value={selectedVendorFilter}
              onChange={(e) => handleVendorFilterChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522] focus:bg-white transition-all w-full md:w-64"
            >
              <option value="all">All Vendors ({vendors.length})</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName} ({v._count?.products ?? 0} items)
                </option>
              ))}
            </select>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product title, material, category..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white font-medium transition-all"
            />
          </form>

          {/* Status & Image Filter Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {["all", "active", "paused", "pending"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                  selectedStatusFilter === st
                    ? "bg-[#052a51] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {st}
              </button>
            ))}

            <span className="h-4 w-[1px] bg-gray-300 mx-1 hidden sm:inline-block" />

            {[
              { id: "all", label: "All Images" },
              { id: "missing", label: "⚠️ Missing Image" },
              { id: "with_image", label: "With Image" },
            ].map((imgOpt) => (
              <button
                key={imgOpt.id}
                onClick={() => {
                  setSelectedImageFilter(imgOpt.id as any);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedImageFilter === imgOpt.id
                    ? imgOpt.id === "missing"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "bg-[#F26522] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {imgOpt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Vendor Active Banner */}
        {selectedVendor && (
          <div className="bg-[#052a51]/5 border border-[#052a51]/15 rounded-xl p-3 flex items-center justify-between text-xs text-[#052a51]">
            <div className="flex items-center gap-2">
              <span className="font-bold">Showing items for: {selectedVendor.businessName}</span>
              <span className="text-gray-500 font-mono text-[11px]">({selectedVendor.category || "General"})</span>
            </div>
            <Link
              href={`/cpo/catalog/new?vendorId=${selectedVendor.id}`}
              className="text-xs font-bold text-[#F26522] hover:underline"
            >
              + Add Item for this Vendor →
            </Link>
          </div>
        )}
      </div>

      {/* Catalog Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#F26522]" />
            <span className="text-xs font-medium">Loading catalog products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No products found matching your filter criteria.</p>
            <Link
              href={
                selectedVendorFilter !== "all"
                  ? `/cpo/catalog/new?vendorId=${selectedVendorFilter}`
                  : "/cpo/catalog/new"
              }
              className="inline-block mt-3 px-4 py-2 bg-[#F26522] text-white rounded-xl font-bold text-xs shadow-xs"
            >
              + Add First Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Product Listing</th>
                  <th className="py-3.5 px-4">Vendor</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Variants / Options</th>
                  <th className="py-3.5 px-4">Price (from)</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => {
                  const firstVariant = p.variants?.[0];
                  const variantCount = p.variants?.length || 0;
                  const totalStock = p.variants?.reduce(
                    (acc: number, v: any) => acc + (v.stockBoxes || 0),
                    0
                  );
                  const isImageMissing =
                    !p.images ||
                    p.images.length === 0 ||
                    p.images.every(
                      (img: string) =>
                        !img ||
                        img === "/placeholders/product.svg" ||
                        img.includes("placeholder")
                    );

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images?.[0] || "/placeholders/product.svg"}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                            onError={(e) => {
                              (e.target as any).src = "/placeholders/product.svg";
                            }}
                          />
                          <div className="min-w-0 max-w-xs">
                            <div className="font-bold text-gray-900 truncate text-sm" title={p.name}>
                              {p.name}
                            </div>
                            <div className="text-[11px] text-gray-400 font-mono truncate">
                              ID: {p.id.slice(-8)} • {p.material || "Standard"} • {p.unitOfSale || "box"}
                            </div>
                            {isImageMissing && (
                              <div className="mt-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                  <AlertCircle className="w-3 h-3 text-amber-600" /> Image Missing
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Vendor */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-gray-800">
                          {p.vendor?.businessName || "IntriHub Direct"}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                          {p.categoryName || p.categorySlug || "General"}
                        </span>
                      </td>

                      {/* Variants */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-800 bg-blue-50 text-blue-800 px-2.5 py-1 rounded-lg text-[11px]">
                          <Layers className="w-3 h-3 text-blue-600" />
                          <span>{variantCount} Variant{variantCount !== 1 ? "s" : ""}</span>
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 font-mono">
                        ₹{firstVariant?.pricePerBox ?? firstVariant?.pricePerSqft ?? p.pricePerSqft ?? 0}
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold font-mono ${
                            totalStock < 15 ? "text-rose-600" : "text-gray-800"
                          }`}
                        >
                          {totalStock ?? 50} units
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.status === "active" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Live
                          </span>
                        ) : p.status === "paused" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <PauseCircle className="w-3 h-3" /> Paused
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 capitalize">
                            {p.status}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Image Upload button */}
                          <button
                            onClick={() => {
                              setReuploadProduct(p);
                              setReuploadImages(
                                (p.images || []).filter(
                                  (img: string) => img && !img.includes("placeholder")
                                )
                              );
                            }}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isImageMissing
                                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            }`}
                            title={isImageMissing ? "Upload Missing Image" : "Quick Update Images"}
                          >
                            <Upload className="w-4 h-4" />
                          </button>

                          {/* Toggle status */}
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                            title={p.status === "active" ? "Pause Product" : "Activate Product"}
                          >
                            {p.status === "active" ? (
                              <PauseCircle className="w-4 h-4 text-amber-600" />
                            ) : (
                              <PlayCircle className="w-4 h-4 text-emerald-600" />
                            )}
                          </button>

                          {/* Full Edit Page Link */}
                          <Link
                            href={`/cpo/catalog/${p.id}/edit`}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#052a51] hover:text-white text-gray-700 transition-colors"
                            title="Edit Product Listing (All Options)"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
            <span>
              Page {page} of {totalPages} ({total} items)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white font-bold disabled:opacity-40 hover:bg-gray-50 transition-colors inline-flex items-center gap-1"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Re-upload Image Modal */}
      {reuploadProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  Update Images: {reuploadProduct.name}
                </h3>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Vendor:{" "}
                  <span className="font-bold text-gray-700">
                    {reuploadProduct.vendor?.businessName || "Direct"}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setReuploadProduct(null)}
                disabled={isSavingReupload || isReuploading}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <ImageUploadManager
                images={reuploadImages}
                onChange={setReuploadImages}
                onUploadingChange={setIsReuploading}
                vendorId={reuploadProduct.vendorId}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                disabled={isSavingReupload || isReuploading}
                onClick={() => setReuploadProduct(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingReupload || isReuploading || reuploadImages.length === 0}
                onClick={handleSaveReupload}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95517] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isSavingReupload ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Save & Apply Images</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CpoCatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-gray-400">
          <Loader2 className="animate-spin inline-block mb-3 text-[#F26522]" size={36} />
          <p className="text-sm font-medium">Loading catalog...</p>
        </div>
      }
    >
      <CpoCatalogContent />
    </Suspense>
  );
}
