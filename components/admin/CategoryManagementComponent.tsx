"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Search,
  Sparkles,
  Pin,
  Star,
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import { resolveCategoryBulkImage } from "@/lib/catalog";
import { toast } from "sonner";

// High-resolution curated hero banners for instant 1-click selection
const CURATED_HERO_PRESETS = [
  { name: "Cement & Concrete", url: "/images/categories/cat-cement-concrete.jpg" },
  { name: "Steel & Rebar", url: "/images/categories/cat-steel-rebar.jpg" },
  { name: "Bricks & Blocks", url: "/images/categories/cat-bricks-blocks.jpg" },
  { name: "Sand & Aggregates", url: "/images/categories/cat-sand-aggregates.jpg" },
  { name: "Roofing & Sheets", url: "/images/categories/cat-roofing-sheets.jpg" },
  { name: "Electrical & Wires", url: "/images/categories/cat-electrical.jpg" },
  { name: "Plumbing & Pipes", url: "/images/categories/cat-plumbing.jpg" },
  { name: "Sanitaryware & Bath", url: "/images/categories/cat-sanitaryware-bath.jpg" },
  { name: "Tiles & Stone", url: "/images/categories/cat-tiles-stone.jpg" },
  { name: "Lighting & Fixtures", url: "/images/categories/cat-lighting.jpg" },
  { name: "Hardware & Fittings", url: "/images/categories/cat-hardware.webp" },
  { name: "Plywood & Laminates", url: "/images/categories/cat-plywood.jpg" },
  { name: "Paints & Finishes", url: "/images/categories/cat-paint-finishes.jpg" },
  { name: "Tools & Safety", url: "/images/categories/cat-tools-consumables.jpg" },
];

interface CategoryManagementComponentProps {
  portalLabel?: string;
  badgeLabel?: string;
}

export default function CategoryManagementComponent({
  portalLabel = "Category & Hero Banner Management",
  badgeLabel = "Master Taxonomy",
}: CategoryManagementComponentProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pinnedCategoryIds, setPinnedCategoryIds] = useState<string[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pinned" | "default">("all");
  const [modalIsPinned, setModalIsPinned] = useState(false);
  const [modalIsDefault, setModalIsDefault] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("intrihub_cpo_pinned_categories");
      if (saved) {
        setPinnedCategoryIds(JSON.parse(saved));
      }
      const savedDefault = localStorage.getItem("intrihub_platform_default_category");
      if (savedDefault) {
        setDefaultCategoryId(savedDefault);
      }
    } catch {}
  }, []);

  const handleTogglePin = (cat: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const isPinned = pinnedCategoryIds.includes(cat.id);
    let updated: string[];
    if (isPinned) {
      updated = pinnedCategoryIds.filter((id) => id !== cat.id);
      toast.info(`"${cat.name}" unpinned from priority`);
    } else {
      updated = [...pinnedCategoryIds, cat.id];
      toast.success(`📌 "${cat.name}" pinned as Priority Category!`);
    }
    setPinnedCategoryIds(updated);
    localStorage.setItem("intrihub_cpo_pinned_categories", JSON.stringify(updated));
  };

  const handleSetDefaultCategory = (cat: Category, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (defaultCategoryId === cat.id) {
      setDefaultCategoryId("");
      localStorage.removeItem("intrihub_platform_default_category");
      toast.info(`"${cat.name}" removed as platform default category`);
    } else {
      setDefaultCategoryId(cat.id);
      localStorage.setItem("intrihub_platform_default_category", cat.id);
      const prefPayload = {
        categoryId: cat.id,
        categorySlug: cat.slug,
        categoryName: cat.name,
        pinnedAt: new Date().toISOString(),
      };
      localStorage.setItem("intrihub_vendor_pinned_pref", JSON.stringify(prefPayload));
      localStorage.setItem("intrihub_vendor_upload_pref", JSON.stringify(prefPayload));
      toast.success(`⭐ "${cat.name}" set as Platform Default Category!`);
    }
  };

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [calculatorType, setCalculatorType] = useState<string>("none");

  const loadCategories = async () => {
    try {
      setLoading(true);
      const cats = await getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Error loading categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName("");
    setSlug("");
    setDescription("");
    setImage("/categories/electrical.jpg");
    setParentId(null);
    setCalculatorType("none");
    setModalIsPinned(false);
    setModalIsDefault(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || "");
    setImage(cat.image || "/placeholders/product.svg");
    setParentId((cat as any).parentId || null);
    setCalculatorType(cat.calculatorType || "none");
    setModalIsPinned(pinnedCategoryIds.includes(cat.id));
    setModalIsDefault(defaultCategoryId === cat.id);
    setModalOpen(true);
  };

  const handleImageFileUpload = async (file: File) => {
    if (!file) return;
    try {
      setUploadingImage(true);
      let finalUrl = "";
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success && data.url) {
            finalUrl = data.url;
          }
        }
      } catch (uploadErr) {
        console.warn("[Upload] Server upload error, using local fallback:", uploadErr);
      }

      // Graceful fallback to client-side dataUrl so user is never blocked by Unexpected token <
      if (!finalUrl) {
        try {
          finalUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
          });
        } catch {}
      }

      if (finalUrl) {
        setImage(finalUrl);
        toast.success("Category Hero Image loaded successfully!");
      } else {
        toast.error("Failed to load category image");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSubmitting(true);
    const computedSlug =
      slug.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    const finalImage = image.trim() || "/categories/electrical.jpg";

    if (editingCategory) {
      const res = await updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        image: finalImage,
        parentId: parentId || null,
        calculatorType: calculatorType || "none",
      });
      setSubmitting(false);

      if (res.success) {
        toast.success(`Category "${name}" updated successfully!`);
        // Sync modal pin and default settings
        const catId = editingCategory.id;
        if (modalIsPinned && !pinnedCategoryIds.includes(catId)) {
          const upd = [...pinnedCategoryIds, catId];
          setPinnedCategoryIds(upd);
          localStorage.setItem("intrihub_cpo_pinned_categories", JSON.stringify(upd));
        } else if (!modalIsPinned && pinnedCategoryIds.includes(catId)) {
          const upd = pinnedCategoryIds.filter((id) => id !== catId);
          setPinnedCategoryIds(upd);
          localStorage.setItem("intrihub_cpo_pinned_categories", JSON.stringify(upd));
        }
        if (modalIsDefault) {
          setDefaultCategoryId(catId);
          localStorage.setItem("intrihub_platform_default_category", catId);
        } else if (defaultCategoryId === catId) {
          setDefaultCategoryId("");
          localStorage.removeItem("intrihub_platform_default_category");
        }
        setModalOpen(false);
        loadCategories();
      } else {
        toast.error(res.error || "Failed to update category");
      }
    } else {
      const res = await createCategory({
        name: name.trim(),
        slug: computedSlug,
        description: description.trim() || "Curated construction and interior supplies collection.",
        image: finalImage,
        parentId: parentId || null,
        calculatorType: calculatorType || "none",
      });
      setSubmitting(false);

      if (res.success && res.category) {
        toast.success(`Category "${name}" created successfully!`);
        const catId = res.category.id;
        if (modalIsPinned) {
          const upd = [...pinnedCategoryIds, catId];
          setPinnedCategoryIds(upd);
          localStorage.setItem("intrihub_cpo_pinned_categories", JSON.stringify(upd));
        }
        if (modalIsDefault) {
          setDefaultCategoryId(catId);
          localStorage.setItem("intrihub_platform_default_category", catId);
        }
        setModalOpen(false);
        loadCategories();
      } else if (res.success) {
        toast.success(`Category "${name}" created successfully!`);
        setModalOpen(false);
        loadCategories();
      } else {
        toast.error(res.error || "Failed to create category");
      }
    }
  };

  const handleDelete = async (cat: Category) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"? This action cannot be undone.`)) {
      const res = await deleteCategory(cat.id);
      if (res.success) {
        toast.success(`Category "${cat.name}" removed`);
        if (defaultCategoryId === cat.id) {
          setDefaultCategoryId("");
          localStorage.removeItem("intrihub_platform_default_category");
        }
        if (pinnedCategoryIds.includes(cat.id)) {
          const upd = pinnedCategoryIds.filter((id) => id !== cat.id);
          setPinnedCategoryIds(upd);
          localStorage.setItem("intrihub_cpo_pinned_categories", JSON.stringify(upd));
        }
        loadCategories();
      } else {
        toast.error(res.error || "Failed to delete category");
      }
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (activeFilter === "pinned" && !pinnedCategoryIds.includes(c.id)) return false;
    if (activeFilter === "default" && c.id !== defaultCategoryId) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const defaultCategoryObj = categories.find((c) => c.id === defaultCategoryId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading catalog categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-[#052a51]">{portalLabel}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              {categories.length} Categories
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#F26522] border border-orange-200 uppercase">
              {badgeLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Create categories, upload Hero Banners, configure smart calculators, and organize marketplace department hierarchies.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl active:scale-95 transition-all shadow-md w-fit cursor-pointer"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories by name, slug or description..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
        </div>

        {/* Quick Filter Tabs: All vs Pinned vs Default */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#052a51] text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Categories ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("default")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "default"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <Star size={13} className="fill-current" />
            <span>Default ({defaultCategoryId ? 1 : 0})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("pinned")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeFilter === "pinned"
                ? "bg-amber-500 text-white shadow-2xs"
                : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Pin size={13} className="fill-current" />
            <span>Pinned Priority ({pinnedCategoryIds.length})</span>
          </button>
        </div>
      </div>

      {/* Active Default Category Info Banner */}
      {defaultCategoryObj && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Star size={16} className="fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-950">
                  Platform Default Category: {defaultCategoryObj.name}
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-200/70 text-emerald-900 uppercase">
                  Default Active
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Automatically pre-selected for new vendor uploads and admin listing accelerators.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => handleSetDefaultCategory(defaultCategoryObj, e)}
            className="text-xs font-bold text-emerald-800 hover:text-red-600 underline cursor-pointer self-start sm:self-auto"
          >
            Reset Default
          </button>
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map((cat) => {
          const isPinned = pinnedCategoryIds.includes(cat.id);
          const isDefault = defaultCategoryId === cat.id;
          return (
          <div
            key={cat.id}
            className={`bg-white rounded-3xl border shadow-2xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all ${
              isDefault
                ? "border-emerald-300 ring-2 ring-emerald-500/30"
                : "border-gray-200/80"
            }`}
          >
            <div>
              {/* Hero Image Header */}
              <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
                <Image
                  src={resolveCategoryBulkImage(cat.image, cat.slug, cat.name)}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#052a51]/90 via-[#052a51]/30 to-transparent" />

                {/* Pin Priority & Default Buttons (Top-Left) */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10 flex-wrap max-w-[80%]">
                  <button
                    type="button"
                    onClick={(e) => handleTogglePin(cat, e)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      isPinned
                        ? "bg-amber-500 text-white ring-2 ring-white"
                        : "bg-white/90 hover:bg-white text-gray-700 hover:text-[#F26522] border border-gray-200"
                    }`}
                    title={isPinned ? "Click to unpin priority category" : "Pin as priority category"}
                  >
                    <Pin size={12} className={isPinned ? "fill-white" : ""} />
                    <span>{isPinned ? "Pinned" : "Pin"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSetDefaultCategory(cat, e)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer ${
                      isDefault
                        ? "bg-emerald-600 text-white ring-2 ring-white"
                        : "bg-white/90 hover:bg-white text-gray-700 hover:text-emerald-700 border border-gray-200"
                    }`}
                    title={isDefault ? "Click to remove as platform default" : "Set as Platform Default Category"}
                  >
                    <Star size={12} className={isDefault ? "fill-white" : ""} />
                    <span>{isDefault ? "⭐ Default" : "Set Default"}</span>
                  </button>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {cat.calculatorType && cat.calculatorType !== "none" && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#F26522] text-white shadow-xs">
                      Calculator
                    </span>
                  )}
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/20 text-white backdrop-blur-xs">
                    Hero Banner
                  </span>
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-lg font-black leading-tight drop-shadow-xs">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-white/80 mt-0.5 font-mono">
                    /shop/{cat.slug}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed min-h-[32px]">
                  {cat.description || "Browse top-rated products in this category."}
                </p>

                <div className="flex items-center gap-2 pt-2 text-xs flex-wrap">
                  <span className="font-bold text-[#052a51] px-2.5 py-1 bg-gray-100 rounded-lg">
                    {cat.productCount} Product(s) Listed
                  </span>
                  {cat.calculatorType && cat.calculatorType !== "none" && (
                    <span className="font-semibold text-emerald-800 text-[11px] px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100">
                      Formula: {cat.calculatorType.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-100 mt-2">
              <Link
                href={`/shop/${cat.slug}`}
                target="_blank"
                className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
              >
                <span>View Storefront</span>
                <ExternalLink size={12} />
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-2 text-gray-500 hover:text-[#052a51] hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                  title="Edit category & Hero Image"
                >
                  <Edit size={15} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition-colors"
                  title="Delete category"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {/* ── Category Add / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-[#052a51] text-lg">
                  {editingCategory ? "Edit Category & Hero Image" : "Add New Category & Hero Image"}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure name, slug, description, and upload a high-resolution hero banner
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Category Name & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!editingCategory) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, "-")
                            .replace(/^-+|-+$/g, "")
                        );
                      }
                    }}
                    placeholder="Enter category name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="Enter category URL slug"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-700 focus:bg-white focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              {/* Hero Banner Upload Section */}
              <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block">
                    Category Hero Banner Image *
                  </label>
                  <span className="text-[10px] text-gray-500">Recommended: 1200x600 px</span>
                </div>

                {/* Image Preview & Upload Button */}
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {image ? (
                    <div className="relative w-full sm:w-56 h-32 rounded-2xl overflow-hidden border border-gray-300 bg-white group shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image}
                        alt="Hero Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <label className="px-3 py-1.5 bg-white text-gray-900 rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-1">
                          <Upload size={12} /> Replace
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleImageFileUpload(f);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label className="w-full sm:w-56 h-32 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#F26522] bg-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-3 text-center shrink-0">
                      {uploadingImage ? (
                        <Loader2 className="animate-spin text-[#F26522]" size={24} />
                      ) : (
                        <>
                          <ImageIcon className="text-gray-400" size={24} />
                          <span className="text-xs font-bold text-gray-700">Upload Hero Image</span>
                          <span className="text-[10px] text-gray-400">JPG, PNG, WebP</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleImageFileUpload(f);
                        }}
                      />
                    </label>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <label className="block text-[11px] font-bold text-gray-600">
                      Or Direct Image URL / Path:
                    </label>
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="/categories/electrical.jpg"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-700 focus:outline-none focus:border-[#F26522]"
                    />

                    {/* Quick Presets */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 block mb-1">
                        Quick Preset Banners:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {CURATED_HERO_PRESETS.map((p) => (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => setImage(p.url)}
                            className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[10px] font-semibold text-gray-700 cursor-pointer"
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Category Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown in category storefront headers and search results..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:bg-white focus:outline-none focus:border-[#F26522]"
                />
              </div>

              {/* Parent Category (Optional) */}
              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Parent Category (Optional Subcategory Grouping)
                </label>
                <select
                  value={parentId || ""}
                  onChange={(e) => setParentId(e.target.value || null)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Smart Calculator Configuration */}
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200 space-y-1.5">
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block">
                  Smart Calculator Formula & Type
                </label>
                <select
                  value={calculatorType}
                  onChange={(e) => setCalculatorType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
                >
                  <option value="none">None (Standard Quantity / Hardware / Sanitaryware)</option>
                  <option value="area_to_boxes">Area → Boxes (Tiles, Stone, Wallpaper - sq.ft coverage)</option>
                  <option value="area_to_volume">Area → Volume (Paints, Waterproofing - sq.ft/L + coats)</option>
                  <option value="length_to_units">Length → Units (Wires, Cables, Pipes - meters/coil)</option>
                </select>
                <p className="text-[10px] text-gray-500">
                  Controls automated customer calculation assistance on Product Detail Pages.
                </p>
              </div>

              {/* Pin & Default Category Configuration Options in Modal */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <span className="text-xs font-bold text-[#052a51] uppercase tracking-wider block">
                  Priority &amp; Upload Defaults
                </span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalIsDefault}
                      onChange={(e) => setModalIsDefault(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        ⭐ Set as Platform Default Category
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        Auto-selects this category as the primary choice for new product uploads.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalIsPinned}
                      onChange={(e) => setModalIsPinned(e.target.checked)}
                      className="w-4 h-4 text-amber-500 rounded border-gray-300 focus:ring-amber-400"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">
                        📌 Pin as Priority Category
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        Highlights this category with priority badge in CPO &amp; Vendor catalog views.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] active:scale-95 text-white text-xs font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 transition-all"
                >
                  {submitting && <Loader2 className="animate-spin" size={13} />}
                  <span>{editingCategory ? "Save Changes" : "Create Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
