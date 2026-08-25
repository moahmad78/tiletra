"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getProductById } from "@/lib/actions/products";
import { updateVendorProduct, getVendorProfile } from "@/lib/actions/vendor";
import { getCategories } from "@/lib/actions/categories";
import type { Category } from "@/lib/data/categories";
import type { Product } from "@/lib/data/products";
import { UNIT_OF_SALE_OPTIONS } from "@/lib/units";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import VariantEditor from "@/components/admin/VariantEditor";
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
  Loader2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function VendorEditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { vendor } = useVendorAuth();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [wastagePercent, setWastagePercent] = useState<string>("10");
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);

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

        if (vendor?.id) {
          getVendorProfile(vendor.id).then((v) => setVendorProfile(v));
        }

        if (prod) {
          setName(prod.name);
          setCategorySlug(prod.categorySlug || "floor-tiles");
          setCategoryName(prod.categoryName || "Floor Tiles");
          setMaterial(prod.material || "Vitrified");
          setUnitOfSale(prod.unitOfSale || "box");
          setDescription(prod.description || "");
          setImages(prod.images && prod.images.length > 0 ? prod.images : ["/placeholders/product.svg"]);
          setCoverageRate(prod.coverageRate ? String(prod.coverageRate) : "");
          setWastagePercent(prod.wastageFactor ? String(Math.round((prod.wastageFactor - 1) * 100)) : "10");
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
          router.push("/vendor/products");
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

    setSaving(true);
    const res = await updateVendorProduct(vendor.id, productId, {
      name: name.trim(),
      categorySlug,
      categoryName,
      material,
      unitOfSale,
      description: description.trim(),
      images: images.filter((img) => img.trim().length > 0),
      attributes: cleanAttributes,
      coverageRate: !isNaN(parseFloat(coverageRate)) && parseFloat(coverageRate) > 0 ? parseFloat(coverageRate) : null,
      wastageFactor: (parseFloat(wastagePercent) || 10) / 100 + 1.0,
      variants,
    });
    setSaving(false);

    if (res.success) {
      toast.success("Product updated & resubmitted for Super Admin approval!");
      router.push("/vendor/products");
    } else {
      toast.error(res.error || "Failed to update product");
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400">
        <Loader2 className="animate-spin inline-block mb-3 text-emerald-600" size={32} />
        <p className="text-sm font-medium">Loading product details...</p>
      </div>
    );
  }

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
              Edit Product Listing
            </h1>
            <p className="text-xs text-gray-500">
              Update product details and photos. Updates are submitted for Super Admin review.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-Publish or Approval Notice */}
      {vendorProfile?.autoPublishEnabled ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-950">
          <Zap size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">✓ Auto-Publish Active (Trusted Seller):</strong>
            <p className="mt-0.5 text-emerald-800">
              Saving changes will update this listing instantly on the storefront without waiting in the approval queue.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-blue-900">
          <Clock size={18} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Quality & Catalog Review:</strong>
            <p className="mt-0.5 text-blue-800">
              Saving changes will resubmit this listing to the Super Admin queue for quick quality verification before going live.
            </p>
          </div>
        </div>
      )}

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
                Material / Composition *
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Polycarbonate, Vitrified, Brass"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
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
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all cursor-pointer"
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

        {/* Product Images (Upload + URL Link) */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                2. Product Photos & Media
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload image files or paste direct URLs (CDN/S3/Imgur). First image will be the primary storefront cover.
              </p>
            </div>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
              {images.filter((img) => img !== "/placeholders/product.svg").length} photo(s)
            </span>
          </div>
          <ImageUploadManager images={images} onChange={setImages} />
        </div>

        {/* Flexible Custom Attributes */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                3. Technical Specifications & Attributes
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Add item properties (e.g., Gauge, Current Rating, Voltage, Water Absorption, ISI Mark)
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddAttribute}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl cursor-pointer"
            >
              <Plus size={14} /> Add Property
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {attributes.map((attr, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-200/60">
                <input
                  type="text"
                  placeholder="Attribute (e.g. Brand)"
                  value={attr.key}
                  onChange={(e) => handleAttributeChange(idx, "key", e.target.value)}
                  className="w-1/2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-800"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Havells / 16A)"
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

        {/* Variants & Pricing */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <VariantEditor
            variants={variants as any}
            onChange={setVariants as any}
            unitOfSale={unitOfSale}
          />

          {/* Smart Calculator Estimator Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5 flex justify-between">
                <span>Coverage / Length Rate</span>
                <span className="text-[10px] text-gray-400 font-normal">Powers Calculator</span>
              </label>
              <input
                type="number"
                step="any"
                min={0}
                value={coverageRate}
                onChange={(e) => setCoverageRate(e.target.value)}
                placeholder="e.g. 16 for tiles, 120 for paint, 90 for wire"
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-emerald-600"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Sq.ft/box (Tiles), Sq.ft/Litre (Paint), Meters/coil (Wires)
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-800 uppercase tracking-wider block mb-1.5 flex justify-between">
                <span>Wastage Buffer Margin (%)</span>
                <span className="text-[10px] text-gray-400 font-normal">Default: 10%</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={wastagePercent}
                  onChange={(e) => setWastagePercent(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-emerald-600"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  %
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Cutting/application buffer added automatically before rounding
              </p>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link
            href="/vendor/products"
            className="px-6 py-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Updating Listing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Save & Resubmit for Approval</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
