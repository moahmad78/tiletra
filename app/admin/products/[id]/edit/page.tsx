"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, ExternalLink } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import VariantEditor from "@/components/admin/VariantEditor";
import SpecsEditor from "@/components/admin/SpecsEditor";
import type { Product, Material, ProductVariant } from "@/lib/data/products";
import { toast } from "sonner";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const products = useAdminStore((s) => s.products);
  const categories = useAdminStore((s) => s.categories);
  const updateProduct = useAdminStore((s) => s.updateProduct);
  const deleteProduct = useAdminStore((s) => s.deleteProduct);

  const product = products.find((p) => p.id === id);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [material, setMaterial] = useState<Material>("Vitrified");
  const [description, setDescription] = useState("");
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [specs, setSpecs] = useState<any>({});

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSlug(product.slug);
      setCategorySlug(product.categorySlug);
      setMaterial(product.material);
      setDescription(product.description);
      setIsBestseller(product.isBestseller);
      setIsNew(product.isNew);
      setTagsInput(product.tags.join(", "));
      setImages(product.images);
      setVariants(product.variants);
      setSpecs(product.specs);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center border border-gray-200">
        <p className="text-lg font-bold text-[#052a51]">Product Not Found</p>
        <Link href="/admin/products" className="mt-4 inline-block text-xs font-bold text-[#F26522]">
          ← Back to Products
        </Link>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter product name");
      return;
    }
    if (images.length === 0) {
      toast.error("Please add at least one product photo");
      return;
    }
    if (variants.length === 0) {
      toast.error("Please add at least one variant");
      return;
    }

    const selectedCat = categories.find((c) => c.slug === categorySlug);

    const updates: Partial<Product> = {
      name: name.trim(),
      slug: slug.trim() || product.slug,
      categorySlug,
      categoryName: selectedCat?.name || product.categoryName,
      description: description.trim(),
      material,
      images,
      variants,
      isBestseller,
      isNew,
      tags: tagsInput
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      specs,
    };

    updateProduct(product.id, updates);
    toast.success(`"${name}" updated successfully!`);
    router.push("/admin/products");
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct(product.id);
      toast.success("Product deleted");
      router.push("/admin/products");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="text-xl font-black text-[#052a51]">Edit: {product.name}</h2>
            <p className="text-xs text-gray-400">ID: {product.id} · Category: {product.categoryName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/product/${product.slug}`}
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#052a51] bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <ExternalLink size={13} />
            <span>Public Page</span>
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            title="Delete this tile"
          >
            <Trash2 size={16} />
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Save size={15} />
            <span>Update Tile</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: Basic Information ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">1. General Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Category *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Material *
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as Material)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            >
              <option value="Vitrified">Vitrified</option>
              <option value="Ceramic">Ceramic</option>
              <option value="Porcelain">Porcelain</option>
              <option value="Natural Stone">Natural Stone</option>
              <option value="Mosaic">Mosaic</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
            Product Description
          </label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#F26522]"
          />
        </div>
      </div>

      {/* ── Section 2: Photo Gallery ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">2. Product Photography</h3>
        <ImageUploadManager images={images} onChange={setImages} />
      </div>

      {/* ── Section 3: Variants, Sizes & Pricing ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">3. Sizes, Finishes & Inventory</h3>
        <VariantEditor variants={variants} onChange={setVariants} />
      </div>

      {/* ── Section 4: Technical Specifications ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">4. Specifications & Ratings</h3>
        <SpecsEditor specs={specs} onChange={setSpecs} />
      </div>

      {/* ── Section 5: Badges & Tags ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">5. Display Tags & Promotion</h3>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBestseller}
              onChange={(e) => setIsBestseller(e.target.checked)}
              className="w-4 h-4 accent-[#F26522] rounded"
            />
            <span className="text-sm font-bold text-[#052a51]">Feature as "Bestseller"</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 accent-[#052a51] rounded"
            />
            <span className="text-sm font-bold text-[#052a51]">Mark as "New Arrival"</span>
          </label>
        </div>

        <div>
          <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
            Search Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
          />
        </div>
      </div>

      {/* Bottom Update Button */}
      <div className="flex justify-end gap-3 pt-4">
        <Link
          href="/admin/products"
          className="px-5 py-3 text-xs font-bold text-gray-500 hover:text-[#052a51] rounded-xl hover:bg-gray-100 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
