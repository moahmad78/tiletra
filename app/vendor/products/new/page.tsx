"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import { createVendorProduct } from "@/lib/actions/vendor";
import { getCategories } from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function VendorNewProductPage() {
  const router = useRouter();
  const { vendor } = useVendorAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("floor-tiles");
  const [categoryName, setCategoryName] = useState("Floor Tiles");
  const [material, setMaterial] = useState("Vitrified");
  const [unitOfSale, setUnitOfSale] = useState("box");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([
    "/placeholders/product.svg",
  ]);

  // Dynamic Attributes
  const [attributes, setAttributes] = useState<{ key: string; value: string }[]>([
    { key: "gauge", value: "" },
    { key: "brand", value: "" },
  ]);

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
    getCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0) {
        setCategorySlug(cats[0].slug);
        setCategoryName(cats[0].name);
      }
    });
  }, []);

  const handleCategoryChange = (slug: string) => {
    setCategorySlug(slug);
    const found = categories.find((c) => c.slug === slug);
    if (found) setCategoryName(found.name);
  };

  const handleAddVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        size: "Standard",
        finish: "Standard",
        color: "Standard",
        pricePerBox: 1000,
        pricePerSqft: 50,
        sqftPerBox: 20,
        stockBoxes: 50,
      },
    ]);
  };

  const handleRemoveVariant = (idx: number) => {
    if (variants.length <= 1) {
      toast.error("You must have at least one product variant");
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleVariantChange = (idx: number, field: string, value: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
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
    if (!vendor?.id) {
      toast.error("Please login as a vendor first");
      return;
    }

    if (!name.trim()) {
      toast.error("Product name is required");
      return;
    }

    const cleanAttributes = attributes.filter((a) => a.key.trim() && a.value.trim());

    setLoading(true);
    const res = await createVendorProduct(vendor.id, {
      name: name.trim(),
      categorySlug,
      categoryName,
      material,
      unitOfSale,
      description: description.trim(),
      images: images.filter((img) => img.trim().length > 0),
      attributes: cleanAttributes,
      variants,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Product submitted for Super Admin approval!");
      router.push("/vendor/products");
    } else {
      toast.error(res.error || "Failed to create product");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/vendor/products"
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Create New Listing
            </h1>
            <p className="text-xs text-gray-500">
              Submit product details to be listed under your shop
            </p>
          </div>
        </div>
      </div>

      {/* Approval Reminder Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
        <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Quality & Catalog Review:</strong>
          <p className="mt-0.5 text-blue-800">
            Once submitted, your listing will be queued for Super Admin approval before appearing on the public storefront. You can pause or activate it anytime from your dashboard once approved.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
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
              placeholder="e.g. Anchor Roma 10A Modular Switch 1M"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
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
                Material / Grade *
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Polycarbonate / Vitrified / Brass"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Unit of Sale *
              </label>
              <select
                value={unitOfSale}
                onChange={(e) => setUnitOfSale(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
              >
                <option value="box">Box (Tiles/Hardware)</option>
                <option value="piece">Piece / Unit</option>
                <option value="sqft">Sq. Ft.</option>
                <option value="meter">Meter (Pipes/Wires)</option>
                <option value="coil">Coil (90m wire)</option>
                <option value="kg">Kilogram (Adhesives/Grout)</option>
                <option value="pack">Pack (Fasteners/Screws)</option>
                <option value="roll">Roll (Waterproofing membrane)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Description & Specifications
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe key features, technical standards (IS/BIS), warranty, and installation guidance..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
            2. Product Image URLs
          </h2>
          <div className="space-y-3">
            {images.map((img, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="url"
                  value={img}
                  onChange={(e) => {
                    const copy = [...images];
                    copy[idx] = e.target.value;
                    setImages(copy);
                  }}
                  placeholder="/placeholders/product.svg"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setImages([...images, ""])}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-2"
            >
              <Plus size={14} /> Add Another Image URL
            </button>
          </div>
        </div>

        {/* Flexible Custom Attributes */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                3. Technical Specifications & Attributes
              </h2>
              <p className="text-xs text-gray-500">
                Add flexible attributes like gauge, warranty, pack size, voltage, etc.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAttribute}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus size={14} /> Add Attribute
            </button>
          </div>

          <div className="space-y-3">
            {attributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <input
                  type="text"
                  value={attr.key}
                  onChange={(e) => handleAttributeChange(idx, "key", e.target.value)}
                  placeholder="Attribute name (e.g. gauge)"
                  className="w-1/3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
                <input
                  type="text"
                  value={attr.value}
                  onChange={(e) => handleAttributeChange(idx, "value", e.target.value)}
                  placeholder="Value (e.g. 2.5 sq mm)"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAttribute(idx)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Variants */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                4. Pricing, Sizes & Stock Variants
              </h2>
              <p className="text-xs text-gray-500">
                Define sizes, finish/colors, price per unit, and available inventory
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddVariant}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <Plus size={14} /> Add Variant
            </button>
          </div>

          <div className="space-y-4">
            {variants.map((v, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-700 uppercase">
                    Variant #{idx + 1}
                  </span>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Size / Model
                    </label>
                    <input
                      type="text"
                      value={v.size}
                      onChange={(e) => handleVariantChange(idx, "size", e.target.value)}
                      placeholder="e.g. 600x600mm"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Finish / Color
                    </label>
                    <input
                      type="text"
                      value={v.finish}
                      onChange={(e) => handleVariantChange(idx, "finish", e.target.value)}
                      placeholder="e.g. Glossy / White"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Price per {unitOfSale} (₹) *
                    </label>
                    <input
                      type="number"
                      value={v.pricePerBox}
                      onChange={(e) => handleVariantChange(idx, "pricePerBox", Number(e.target.value))}
                      placeholder="1200"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium font-bold text-gray-900"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Stock Units
                    </label>
                    <input
                      type="number"
                      value={v.stockBoxes}
                      onChange={(e) => handleVariantChange(idx, "stockBoxes", Number(e.target.value))}
                      placeholder="50"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            href="/vendor/products"
            className="px-5 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            {loading ? "Submitting Listing..." : "Submit Listing for Approval"}
          </button>
        </div>
      </form>
    </div>
  );
}
