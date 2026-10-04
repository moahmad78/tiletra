"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getCpoCatalog,
  getCpoVendors,
  bulkEditCpoProducts,
} from "@/lib/actions/cpo";
import { createProduct, updateProduct, deleteProduct, createProductsBulk } from "@/lib/actions/products";
import { getActiveCpoWorkspaceStatus, selectCpoVendor } from "@/lib/cpo/auth";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import {
  Package,
  Search,
  Filter,
  PlusCircle,
  Upload,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  Briefcase,
  Store,
  Layers,
  CheckSquare,
  Square,
  Loader2,
  X,
  ExternalLink,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

export default function CpoCatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState("all");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Active Workspace
  const [workspace, setWorkspace] = useState<{
    active: boolean;
    vendorId?: string;
    vendorName?: string;
  }>({ active: false });

  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkAction, setBulkAction] = useState<"setStatus" | "setCategory" | "adjustPrice" | "adjustStock">("setStatus");
  const [bulkValue, setBulkValue] = useState<string>("active");
  const [bulkSaving, setBulkSaving] = useState(false);

  // Single Add / Edit Item Modal
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [itemVendorId, setItemVendorId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategorySlug, setItemCategorySlug] = useState("floor-tiles");
  const [itemMaterial, setItemMaterial] = useState("Vitrified");
  const [itemUnitOfSale, setItemUnitOfSale] = useState("box");
  const [itemDescription, setItemDescription] = useState("");
  const [itemImages, setItemImages] = useState<string[]>([]);
  const [itemPrice, setItemPrice] = useState(1000);
  const [itemStock, setItemStock] = useState(100);
  const [itemSaving, setItemSaving] = useState(false);

  // Bulk CSV Upload Modal
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvVendorId, setCsvVendorId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, vList, ws] = await Promise.all([
        getCpoCatalog({
          search: searchQuery,
          vendorId: selectedVendorFilter,
          categorySlug: selectedCategoryFilter,
          status: selectedStatusFilter,
          page,
          limit: 30,
        }),
        getCpoVendors(),
        getActiveCpoWorkspaceStatus(),
      ]);

      setProducts(catRes.products);
      setTotal(catRes.total);
      setTotalPages(catRes.totalPages);
      setVendors(vList);
      setWorkspace(ws);
      if (ws.active && ws.vendorId) {
        setItemVendorId(ws.vendorId);
        setCsvVendorId(ws.vendorId);
      } else if (vList.length > 0 && !itemVendorId) {
        setItemVendorId(vList[0].id);
        setCsvVendorId(vList[0].id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, selectedVendorFilter, selectedCategoryFilter, selectedStatusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Open Add Product Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemName("");
    setItemCategorySlug("floor-tiles");
    setItemMaterial("Vitrified");
    setItemUnitOfSale("box");
    setItemDescription("");
    setItemImages(["/placeholders/product.svg"]);
    setItemPrice(1000);
    setItemStock(100);
    if (workspace.active && workspace.vendorId) {
      setItemVendorId(workspace.vendorId);
    }
    setShowItemModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEdit = (p: any) => {
    setEditingItem(p);
    setItemVendorId(p.vendorId || "");
    setItemName(p.name);
    setItemCategorySlug(p.categorySlug || "floor-tiles");
    setItemMaterial(p.material || "Vitrified");
    setItemUnitOfSale(p.unitOfSale || "box");
    setItemDescription(p.description || "");
    setItemImages(p.images?.length > 0 ? p.images : ["/placeholders/product.svg"]);
    setItemPrice(p.variants?.[0]?.pricePerBox || 1000);
    setItemStock(p.variants?.[0]?.stockBoxes || 50);
    setShowItemModal(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemVendorId) {
      toast.error("Please assign a vendor to this item.");
      return;
    }
    setItemSaving(true);
    try {
      if (editingItem) {
        // Update product
        const res = await updateProduct(editingItem.id, {
          name: itemName,
          categorySlug: itemCategorySlug,
          material: itemMaterial,
          unitOfSale: itemUnitOfSale,
          description: itemDescription,
          images: itemImages,
        });

        if (res.success) {
          toast.success("Product updated successfully!");
          setShowItemModal(false);
          loadData();
        } else {
          toast.error(res.error || "Failed to update product");
        }
      } else {
        // Create product
        const res = await createProduct({
          name: itemName,
          categorySlug: itemCategorySlug,
          material: itemMaterial,
          unitOfSale: itemUnitOfSale,
          description: itemDescription || itemName,
          images: itemImages,
          variants: [
            {
              size: "Standard",
              finish: "Glossy",
              color: "Standard",
              pricePerBox: Number(itemPrice),
              pricePerSqft: Math.round(Number(itemPrice) / 20),
              sqftPerBox: 20,
              stockBoxes: Number(itemStock),
            },
          ],
        });

        if (res.success) {
          toast.success("Product created under vendor catalog!");
          setShowItemModal(false);
          loadData();
        } else {
          toast.error(res.error || "Failed to create product");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save item");
    } finally {
      setItemSaving(false);
    }
  };

  // Toggle Item Status (Active / Paused)
  const handleToggleStatus = async (p: any) => {
    const nextStatus = p.status === "active" ? "paused" : "active";
    try {
      const res = await updateProduct(p.id, { status: nextStatus });
      if (res.success) {
        toast.success(`Product marked as ${nextStatus}`);
        loadData();
      } else {
        toast.error(res.error || "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Delete Item (Soft Delete)
  const handleDeleteItem = async (p: any) => {
    if (!confirm(`Are you sure you want to discontinue "${p.name}"?`)) return;
    try {
      const res = await deleteProduct(p.id);
      if (res.success) {
        toast.success("Product discontinued from store");
        loadData();
      } else {
        toast.error(res.error || "Failed to delete product");
      }
    } catch {
      toast.error("Failed to delete product");
    }
  };

  // Handle Bulk Edit Execution
  const handleExecuteBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    setBulkSaving(true);
    try {
      const res = await bulkEditCpoProducts({
        productIds: selectedIds,
        action: bulkAction,
        value: bulkValue,
      });

      if (res.success) {
        toast.success(res.message);
        setShowBulkEditModal(false);
        setSelectedIds([]);
        loadData();
      } else {
        toast.error(res.error || "Bulk update failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  };

  // Handle CSV Bulk Ingestion
  const handleUploadCsv = async () => {
    if (!csvVendorId) {
      toast.error("Please select a target vendor for the uploaded items");
      return;
    }
    if (!csvText.trim()) {
      toast.error("Please paste CSV data");
      return;
    }

    setCsvUploading(true);
    try {
      const lines = csvText.trim().split("\n");
      const itemsToCreate: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [name, catSlug, price, stock, material] = line.split(",").map((s) => s?.trim());
        if (name) {
          itemsToCreate.push({
            name,
            categorySlug: catSlug || "floor-tiles",
            material: material || "Vitrified",
            description: `Quality ${name} supplied through IntriHub partner catalog`,
            images: ["/placeholders/product.svg"],
            unitOfSale: "box",
            vendorId: csvVendorId,
            variants: [
              {
                size: "Standard",
                finish: "Glossy",
                color: "Standard",
                pricePerBox: parseFloat(price) || 1000,
                pricePerSqft: Math.round((parseFloat(price) || 1000) / 20),
                sqftPerBox: 20,
                stockBoxes: parseInt(stock) || 50,
              },
            ],
          });
        }
      }

      if (itemsToCreate.length === 0) {
        toast.error("No valid product rows parsed from CSV");
        setCsvUploading(false);
        return;
      }

      const res = await createProductsBulk(itemsToCreate);
      if (res.success) {
        toast.success(`Successfully uploaded ${(res as any).createdCount || itemsToCreate.length} products!`);
        setShowCsvModal(false);
        setCsvText("");
        loadData();
      } else {
        toast.error(res.error || "Bulk upload failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Bulk upload error");
    } finally {
      setCsvUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace Catalog</h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse all supplier items, launch bulk edits, and add products directly under vendor accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCsvModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-purple-400" />
            <span>Bulk CSV Upload</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search catalog by product name, SKU, brand, or material..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </form>

          {/* Bulk Action Controls */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-purple-950/80 border border-purple-700/60 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-purple-200 font-semibold">{selectedIds.length} Selected</span>
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium"
              >
                Bulk Edit
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-slate-400 hover:text-white text-xs"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800 text-xs">
          {/* Vendor Filter */}
          <div className="flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedVendorFilter}
              onChange={(e) => {
                setSelectedVendorFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Vendors</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.businessName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Live (Active)</option>
              <option value="paused">Paused</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </div>

          <div className="ml-auto text-xs text-slate-400 font-mono">
            Total Items: <strong className="text-white">{total}</strong>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs">Loading marketplace catalog...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No products found matching your search and filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-10 text-center">
                    <button onClick={handleToggleSelectAll}>
                      {selectedIds.length === products.length && products.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price / Unit</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((p) => {
                  const isChecked = selectedIds.includes(p.id);
                  const primaryVariant = p.variants?.[0] || {};
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isChecked ? "bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <button onClick={() => handleToggleSelect(p.id)}>
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || "/placeholders/product.svg"}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700 shrink-0"
                          />
                          <div className="truncate max-w-xs">
                            <div className="font-semibold text-white truncate flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.createdByCpoId && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">
                                  CPO
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate">
                              SKU: {primaryVariant.sku || p.id.slice(-6)} • {p.material}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium truncate max-w-[140px]">
                          {p.vendor?.businessName || "Direct Platform"}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {p.categoryName || p.categorySlug}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-purple-300 font-medium">
                        ₹{primaryVariant.pricePerBox || primaryVariant.pricePerSqft || 0}
                        <span className="text-[10px] text-slate-400 font-normal ml-1">
                          /{p.unitOfSale || "box"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {primaryVariant.stockBoxes !== undefined ? primaryVariant.stockBoxes : "—"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            p.status === "active"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : p.status === "paused"
                              ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(p)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title={p.status === "active" ? "Pause Listing" : "Activate Listing"}
                          >
                            {p.status === "active" ? (
                              <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
                            ) : (
                              <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                          </button>

                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteItem(p)}
                            className="p-1 rounded hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors"
                            title="Discontinue Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {p.slug && (
                            <Link
                              href={`/product/${p.slug}`}
                              target="_blank"
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                              title="View in Customer Store"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
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
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingItem ? "Edit Product" : "Add Product to Vendor Store"}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingItem ? `Updating ${editingItem.name}` : "Product will be listed under selected vendor"}
                </p>
              </div>
              <button onClick={() => setShowItemModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Target Vendor *</label>
                <select
                  required
                  disabled={Boolean(editingItem) || workspace.active}
                  value={itemVendorId}
                  onChange={(e) => setItemVendorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-60"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.businessName} (ID: {v.id.slice(-6)})
                    </option>
                  ))}
                </select>
                {workspace.active && (
                  <span className="text-[10px] text-purple-400 mt-1 block">
                    Locked to currently active workspace vendor: {workspace.vendorName}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Royal Calacatta Gold Polished Tile 600x1200mm"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Category Slug</label>
                  <input
                    type="text"
                    required
                    value={itemCategorySlug}
                    onChange={(e) => setItemCategorySlug(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Material</label>
                  <input
                    type="text"
                    value={itemMaterial}
                    onChange={(e) => setItemMaterial(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Price per Box / Unit (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Initial Stock (Boxes)</label>
                  <input
                    type="number"
                    min="0"
                    value={itemStock}
                    onChange={(e) => setItemStock(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Detailed specs, coverage rate, installation recommendations..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1.5">Product Images</label>
                <ImageUploadManager images={itemImages} onChange={setItemImages} />
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itemSaving}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {itemSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{itemSaving ? "Saving..." : "Save Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bulk Edit Items</h3>
                <p className="text-xs text-purple-300">{selectedIds.length} items will be updated</p>
              </div>
              <button onClick={() => setShowBulkEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Select Modification</label>
                <select
                  value={bulkAction}
                  onChange={(e: any) => setBulkAction(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="setStatus">Change Status (Active / Paused / Discontinued)</option>
                  <option value="setCategory">Change Category</option>
                  <option value="adjustPrice">Adjust Price (% Increase / Decrease)</option>
                  <option value="adjustStock">Set Stock Level (Units)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">New Value</label>
                {bulkAction === "setStatus" ? (
                  <select
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="active">Active (Visible in Store)</option>
                    <option value="paused">Paused (Hidden from Search)</option>
                    <option value="discontinued">Discontinued</option>
                  </select>
                ) : bulkAction === "adjustPrice" ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      placeholder="e.g. 10 for +10% or -5 for -5%"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder="Enter value..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkEditModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkEdit}
                disabled={bulkSaving}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {bulkSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{bulkSaving ? "Updating..." : "Apply Bulk Edit"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Upload Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bulk Ingest Products (CSV)</h3>
                <p className="text-xs text-slate-400">Paste comma-separated rows below</p>
              </div>
              <button onClick={() => setShowCsvModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Target Vendor *</label>
                <select
                  required
                  value={csvVendorId}
                  onChange={(e) => setCsvVendorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="">Select Vendor...</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.businessName} (ID: {v.id.slice(-6)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  CSV Data (Header: name, categorySlug, pricePerBox, stockBoxes, material)
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`name,categorySlug,pricePerBox,stockBoxes,material\nRoyal Calacatta Gold,floor-tiles,1200,50,Vitrified\nArmani Grey Matte,wall-tiles,950,80,Ceramic`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono text-[11px] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCsvModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadCsv}
                disabled={csvUploading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {csvUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{csvUploading ? "Uploading Items..." : "Upload & Create"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
