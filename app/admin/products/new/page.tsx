"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import VariantEditor from "@/components/admin/VariantEditor";
import SpecsEditor from "@/components/admin/SpecsEditor";
import AttributeEditor from "@/components/admin/AttributeEditor";
import { createProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import type { Material, ProductVariant, UnitOfSale, ProductAttribute } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";
import { toast } from "sonner";

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [unitOfSale, setUnitOfSale] = useState<UnitOfSale>("box");
  const [material, setMaterial] = useState<Material>("Vitrified");
  const [description, setDescription] = useState("");
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [manualRating, setManualRating] = useState<string>("4.8");
  const [manualReviewCount, setManualReviewCount] = useState<string>("18");
  const [tagsInput, setTagsInput] = useState("modern, premium, interior");
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);

  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  ]);

  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      id: `v-${Date.now().toString().slice(-4)}-1`,
      size: "Standard",
      finish: "Glossy",
      color: "Standard",
      pricePerBox: 1200,
      pricePerSqft: 60,
      sqftPerBox: 20,
      stockBoxes: 100,
    },
  ]);

  const [specs, setSpecs] = useState({
    waterAbsorption: "< 0.5%",
    slipResistance: "R9",
    thickness: "Standard",
    surfaceFinish: "Glossy / Matte",
    breakingStrength: "> 1300N",
    frostResistance: "Yes",
  });

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategorySlug(cats[0].slug);
      }
    });
  }, []);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
      );
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter product name");
      return;
    }
    if (images.length === 0) {
      toast.error("Please upload or add at least one product photo");
      return;
    }
    if (variants.length === 0) {
      toast.error("Please add at least one variant / pricing option");
      return;
    }

    setLoading(true);
    const selectedCat = categories.find((c) => c.slug === categorySlug);

    const res = await createProduct({
      name: name.trim(),
      categorySlug,
      material,
      description: description.trim() || "Premium high-grade interior supply for modern residential and commercial projects.",
      images,
      unitOfSale,
      attributes,
      variants: variants.map((v) => ({
        size: v.size,
        finish: v.finish,
        color: v.color,
        pricePerBox: Number(v.pricePerBox),
        pricePerSqft: Number(v.pricePerSqft || v.pricePerBox),
        sqftPerBox: Number(v.sqftPerBox || 1),
        stockBoxes: Number(v.stockBoxes || 50),
      })),
      isBestseller,
      isNew,
      manualRating: manualRating ? parseFloat(manualRating) : null,
      manualReviewCount: manualReviewCount ? parseInt(manualReviewCount, 10) : null,
      specs,
    });

    setLoading(false);

    if (res.success) {
      toast.success(`"${name}" saved to Neon PostgreSQL database!`);
      router.push("/admin/products");
    } else {
      toast.error(res.error || "Failed to create product");
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
            <h2 className="text-xl font-black text-[#052a51]">Create New Tile Product</h2>
            <p className="text-xs text-gray-400">Persists directly to Neon PostgreSQL database</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-[#052a51] rounded-xl hover:bg-gray-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
            <span>{loading ? "Saving to DB..." : "Publish Tile Design"}</span>
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
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Calacatta Gold Statuario"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              URL Slug (auto-generated)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. calacatta-gold-statuario"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Category *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
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
              Unit of Sale *
            </label>
            <select
              value={unitOfSale}
              onChange={(e) => setUnitOfSale(e.target.value as UnitOfSale)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer capitalize"
            >
              <option value="box">Box (Tiles & Flooring)</option>
              <option value="sqft">Sq.ft (Cut Stone & Granite)</option>
              <option value="piece">Piece (Switches, Pipes, Basins, Doors)</option>
              <option value="meter">Meter (Aluminum Sections & Conduit)</option>
              <option value="coil">Coil (Wires & Cables)</option>
              <option value="kg">Kilogram (Cement & Adhesives)</option>
              <option value="pack">Pack (Screws, Hinges, Fasteners)</option>
              <option value="roll">Roll (Wallpaper & Waterproofing)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Material *
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value as Material)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="Vitrified">Vitrified</option>
              <option value="Ceramic">Ceramic</option>
              <option value="Porcelain">Porcelain</option>
              <option value="Natural Stone">Natural Stone</option>
              <option value="Wood">Wood / Plywood</option>
              <option value="Metal">Metal / SS</option>
              <option value="Brass">Brass</option>
              <option value="PVC">PVC / UPVC</option>
              <option value="CPVC">CPVC</option>
              <option value="Vinyl">Vinyl</option>
              <option value="Composite">Composite / Other</option>
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
            placeholder="Describe the product specifications, installation guidelines, quality certifications, and applications..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#F26522]"
          />
        </div>
      </div>

      {/* ── Section 2: Dynamic Attributes & Specs ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">2. Custom Specifications & Attributes</h3>
        <AttributeEditor attributes={attributes} onChange={setAttributes} />
      </div>

      {/* ── Section 3: Photo Gallery ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">3. Product Photography</h3>
        <ImageUploadManager images={images} onChange={setImages} />
      </div>

      {/* ── Section 4: Variants, Sizes & Pricing ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">4. Options, Pricing & Inventory</h3>
        <VariantEditor variants={variants} onChange={setVariants} />
      </div>

      {/* ── Section 5: Badges & Tags ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-base font-black text-[#052a51]">5. Display Badges & Promotion</h3>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isBestseller}
              onChange={(e) => setIsBestseller(e.target.checked)}
              className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
            />
            <span className="text-sm font-bold text-[#052a51]">Feature as "Bestseller"</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isNew}
              onChange={(e) => setIsNew(e.target.checked)}
              className="w-4 h-4 accent-[#052a51] rounded cursor-pointer"
            />
            <span className="text-sm font-bold text-[#052a51]">Mark as "New Arrival"</span>
          </label>
        </div>

        {/* Display Rating & Review Count Inputs (Admin Controlled) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Display Rating (out of 5.0, optional)
            </label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="5.0"
              value={manualRating}
              onChange={(e) => setManualRating(e.target.value)}
              placeholder="e.g. 4.8 (Leave blank to hide badge)"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
            <p className="text-[10px] text-gray-400 mt-1">Controls the star rating badge shown on storefront & cards.</p>
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Display Review Count (optional)
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={manualReviewCount}
              onChange={(e) => setManualReviewCount(e.target.value)}
              placeholder="e.g. 18 (Leave blank to hide count)"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
            <p className="text-[10px] text-gray-400 mt-1">Controls the count displayed next to star rating badge.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
            Search Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="marble-look, living-room, luxury, anti-slip"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
          />
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end gap-3 pt-4">
        <Link
          href="/admin/products"
          className="px-5 py-3 text-xs font-bold text-gray-500 hover:text-[#052a51] rounded-xl hover:bg-gray-100 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          <span>{loading ? "Saving to DB..." : "Save & Publish Tile"}</span>
        </button>
      </div>
    </form>
  );
}
