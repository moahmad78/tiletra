"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getProductById, updateProduct } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import { UNIT_OF_SALE_OPTIONS } from "@/lib/units";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import VariantEditor from "@/components/admin/VariantEditor";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Store,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function CpoEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorName, setVendorName] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [categoryName, setCategoryName] = useState("Floor Tiles");
  const [material, setMaterial] = useState("Vitrified");
  const [unitOfSale, setUnitOfSale] = useState("box");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>(["/placeholders/product.svg"]);

  // Dynamic Attributes
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([]);
  const [coverageRate, setCoverageRate] = useState<string>("");
  const [piecesPerBox, setPiecesPerBox] = useState<string>("");
  const [wastagePercent, setWastagePercent] = useState<string>("10");

  // Variants
  const [variants, setVariants] = useState([
    {
      size: "600x600mm",
      finish: "Glossy",
      color: "Standard",
      pricePerBox: 1200,
      pricePerSqft: 60,
      sqftPerBox: 20,
      stockBoxes: 50,
    },
  ]);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [cats, prod] = await Promise.all([
          getCategories(),
          getProductById(productId),
        ]);
        setCategories(cats);

        if (prod) {
          setName(prod.name);
          setCategorySlug(prod.categorySlug || "floor-tiles");
          setCategoryName(prod.categoryName || "Floor Tiles");
          setMaterial(prod.material || "Vitrified");
          setUnitOfSale(prod.unitOfSale || "box");
          setDescription(prod.description || "");
          setImages(prod.images && prod.images.length > 0 ? prod.images : ["/placeholders/product.svg"]);
          setCoverageRate(prod.coverageRate ? String(prod.coverageRate) : "");
          setPiecesPerBox(prod.piecesPerBox ? String(prod.piecesPerBox) : "");
          setWastagePercent(prod.wastageFactor ? String(Math.round((prod.wastageFactor - 1) * 100)) : "10");
          if (prod.vendor?.businessName) {
            setVendorName(prod.vendor.businessName);
          }
          if (prod.variants && prod.variants.length > 0) {
            setVariants(
              prod.variants.map((v) => ({
                size: v.size,
                finish: v.finish,
                color: v.color,
                image: v.image || null,
                unit: v.unit || null,
                attributeLabel: v.attributeLabel || null,
                attributeValue: v.attributeValue || null,
                mrp: v.mrp ? Number(v.mrp) : null,
                weightKg: v.weightKg ? Number(v.weightKg) : 2.5,
                pricePerBox: v.pricePerBox,
                pricePerSqft: v.pricePerSqft,
                sqftPerBox: v.sqftPerBox,
                stockBoxes: v.stockBoxes ?? 50,
              }))
            );
          }
          if (prod.attributes && prod.attributes.length > 0) {
            setAttributes(prod.attributes.map((a) => ({ key: a.key, value: a.value })));
          }
        } else {
          toast.error("Product not found");
          router.push("/cpo/catalog");
        }
      } catch (err) {
        console.error("Error loading product:", err);
      } finally {
        setLoading(false);
      }
    }

    if (productId) {
      init();
    }
  }, [productId, router]);

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    const found = categories.find((c) => c.slug === slug);
    if (found) setCategoryName(found.name);
  };

  const handleAddAttribute = () => {
    setAttributes((prev) => [...prev, { key: "", value: "" }]);
  };

  const handleRemoveAttribute = (idx: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAttributeChange = (idx: number, field: "key" | "value", value: string) => {
    setAttributes((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Product title is required");
      return;
    }

    const cleanAttributes = attributes.filter((a) => a.key.trim() && a.value.trim());

    setSaving(true);
    try {
      const res = await updateProduct(productId, {
        name: name.trim(),
        categorySlug,
        categoryName,
        material,
        unitOfSale,
        description: description.trim(),
        images: images.filter((img) => img.trim().length > 0),
        attributes: cleanAttributes,
        coverageRate: !isNaN(parseFloat(coverageRate)) && parseFloat(coverageRate) > 0 ? parseFloat(coverageRate) : null,
        piecesPerBox: !isNaN(parseInt(piecesPerBox, 10)) && parseInt(piecesPerBox, 10) > 0 ? parseInt(piecesPerBox, 10) : null,
        wastageFactor: (parseFloat(wastagePercent) || 10) / 100 + 1.0,
        variants: variants as any,
        status: "active",
        approvalStatus: "approved",
      });

      if (res.success) {
        toast.success("Product successfully updated and live!");
        router.push("/cpo/catalog");
      } else {
        toast.error(res.error || "Failed to update product");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400">
        <Loader2 className="animate-spin inline-block mb-3 text-[#F26522]" size={36} />
        <p className="text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/cpo/catalog"
            className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Edit Catalog Product
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {vendorName ? `Editing on behalf of: ${vendorName}` : "Update variants, pricing, and technical details."}
            </p>
          </div>
        </div>
        {vendorName && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-[#052a51]/5 text-[#052a51] rounded-xl text-xs font-bold border border-[#052a51]/15">
            <Store className="w-3.5 h-3.5 text-[#F26522]" />
            <span>{vendorName}</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. Basic Information */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-xs space-y-4">
          <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
            1. Basic Information
          </h2>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter complete product title"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={categorySlug}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all"
              >
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Material / Composition *
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Vitrified, Copper, Emulsion"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Unit of Sale *
              </label>
              <select
                required
                value={unitOfSale}
                onChange={(e) => setUnitOfSale(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all cursor-pointer"
              >
                {UNIT_OF_SALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description &amp; Specifications
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe key features, technical standards, warranty, etc..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* 2. Product Images */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                2. Product Photos &amp; Media
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Upload image files or paste direct URLs.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {images.filter((img) => img !== "/placeholders/product.svg").length} photo(s)
            </span>
          </div>
          <ImageUploadManager images={images} onChange={setImages} />
        </div>

        {/* 3. Technical Attributes */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                3. Technical Specifications &amp; Attributes
              </h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">
                Add properties (e.g., Gauge, Current Rating, Voltage, ISI Mark)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAttribute}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Plus size={14} /> Add Property
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200/60">
                <input
                  type="text"
                  placeholder="Attribute Name (e.g. Voltage)"
                  value={attr.key}
                  onChange={(e) => handleAttributeChange(idx, "key", e.target.value)}
                  className="w-1/2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 230V)"
                  value={attr.value}
                  onChange={(e) => handleAttributeChange(idx, "value", e.target.value)}
                  className="w-1/2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(idx)}
                  className="p-2 text-gray-400 hover:text-rose-600 rounded-xl cursor-pointer"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Multiple Variants & Pricing */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-xs space-y-4">
          <VariantEditor
            variants={variants as any}
            onChange={setVariants as any}
            unitOfSale={unitOfSale}
          />

          {/* Calculator Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5">
                Coverage Rate (per unit)
              </label>
              <input
                type="number"
                step="any"
                min={0}
                value={coverageRate}
                onChange={(e) => setCoverageRate(e.target.value)}
                placeholder="e.g. 16 (sq.ft / box)"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5">
                Pieces per Box
              </label>
              <input
                type="number"
                step="1"
                min={1}
                value={piecesPerBox}
                onChange={(e) => setPiecesPerBox(e.target.value)}
                placeholder="e.g. 4"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5">
                Wastage Margin (%)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={wastagePercent}
                onChange={(e) => setWastagePercent(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:border-[#F26522]"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/cpo/catalog"
            className="px-6 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save Product</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
