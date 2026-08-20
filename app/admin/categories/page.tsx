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
} from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import { toast } from "sonner";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");

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
    setImage("/placeholders/product.svg");
    setModalOpen(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description);
    setImage(cat.image);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    const computedSlug =
      slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    if (editingCategory) {
      const res = await updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        image: image.trim(),
      });
      setSubmitting(false);

      if (res.success) {
        toast.success(`Category "${name}" updated!`);
        setModalOpen(false);
        loadCategories();
      } else {
        toast.error(res.error || "Failed to update category");
      }
    } else {
      const res = await createCategory({
        name: name.trim(),
        slug: computedSlug,
        description: description.trim() || "Curated architectural tile collections.",
        image: image.trim() || "/placeholders/product.svg",
      });
      setSubmitting(false);

      if (res.success) {
        toast.success(`Category "${name}" created!`);
        setModalOpen(false);
        loadCategories();
      } else {
        toast.error(res.error || "Failed to create category");
      }
    }
  };

  const handleDelete = async (cat: Category) => {
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      const res = await deleteCategory(cat.id);
      if (res.success) {
        toast.success(`Category "${cat.name}" removed`);
        loadCategories();
      } else {
        toast.error(res.error || "Failed to delete category");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading categories from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Category Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Organize catalog items into departments and categories in PostgreSQL
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm w-fit cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all"
          >
            <div>
              {/* Image Header */}
              <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                <Image
                  src={cat.image || "/placeholders/product.svg"}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#052a51]/80 via-transparent to-transparent" />
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
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>

                <div className="flex items-center gap-2 pt-2 text-xs">
                  <span className="font-bold text-[#052a51] px-2 py-0.5 bg-gray-100 rounded-md">
                    {cat.productCount} Active Product(s)
                  </span>
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
                <span>View in Store</span>
                <ExternalLink size={12} />
              </Link>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 text-gray-400 hover:text-[#052a51] hover:bg-gray-100 rounded-lg cursor-pointer"
                  title="Edit category"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cat)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  title="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Category Add / Edit Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <h3 className="font-black text-[#052a51] text-lg">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
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
                  placeholder="e.g. Balcony Tiles"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
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
                  placeholder="e.g. balcony-tiles"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-600 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="/placeholders/product.svg"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-600 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description shown in category headers..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
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
