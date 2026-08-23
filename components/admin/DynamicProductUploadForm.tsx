"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Loader2,
  Zap,
  Cable,
  Paintbrush,
  Layers,
  Grid,
  Plus,
  Trash2,
  Check,
  Tag,
  IndianRupee,
  Package,
  Layers3,
  Sliders,
  FileText,
  ShieldCheck,
} from "lucide-react";
import ImageUploadManager from "@/components/admin/ImageUploadManager";
import VariantEditor from "@/components/admin/VariantEditor";
import { createProduct } from "@/lib/actions/products";
import { getVendorProfile } from "@/lib/actions/vendor";
import type { ProductVariant } from "@/lib/data/products";
import { toast } from "sonner";

// ── Category Definitions & Dynamic Config ──────────────────────────────
export type CategoryKey =
  | "electrical"
  | "electrical-wires"
  | "paints"
  | "plywood"
  | "tiles-granite";

interface CategoryMeta {
  key: CategoryKey;
  label: string;
  sublabel: string;
  slug: string;
  icon: any;
  defaultUnit: string;
  defaultMaterial: string;
  fields: {
    height: { show: boolean; label: string; placeholder: string; unit: string; tooltip?: string };
    width: { show: boolean; label: string; placeholder: string; unit: string; tooltip?: string };
    depth: { show: boolean; label: string; placeholder: string; unit: string; tooltip?: string };
    lengthSize: { show: boolean; label: string; placeholder: string; unit: string; tooltip?: string };
  };
  recommendedTags: string[];
  sampleBrands: string[];
}

export const CATEGORY_CONFIGS: Record<CategoryKey, CategoryMeta> = {
  electrical: {
    key: "electrical",
    label: "Electrical (Switchboards & Panels)",
    sublabel: "Switchboards, sockets, MCBs & modular plates",
    slug: "electrical",
    icon: Zap,
    defaultUnit: "piece",
    defaultMaterial: "Polycarbonate",
    fields: {
      height: { show: true, label: "Height", placeholder: "e.g. 150", unit: "mm / ft", tooltip: "Outer frame height" },
      width: { show: true, label: "Width", placeholder: "e.g. 200", unit: "mm / ft", tooltip: "Outer frame width" },
      depth: { show: true, label: "Depth / Wall Cutout Depth", placeholder: "e.g. 45", unit: "mm", tooltip: "Enclosure mounting depth" },
      lengthSize: { show: false, label: "Length", placeholder: "", unit: "" },
    },
    recommendedTags: [
      "Polycarbonate",
      "4 Switches + 1 Socket",
      "Glossy White",
      "Flame Retardant",
      "Shock Proof",
      "Modular 6M Grid",
      "16A Heavy Duty",
      "Silver Inlay Contacts",
      "ISI Certified",
    ],
    sampleBrands: ["Havells", "Legrand", "Schneider Electric", "Anchor by Panasonic", "Goldmedal", "L&T", "Intrihub Select"],
  },
  "electrical-wires": {
    key: "electrical-wires",
    label: "Electrical (Wires & Cables)",
    sublabel: "House wires, industrial cables & conduit cords",
    slug: "electrical",
    icon: Cable,
    defaultUnit: "coil",
    defaultMaterial: "Electrolytic Copper (FR PVC)",
    fields: {
      height: { show: false, label: "Height", placeholder: "", unit: "" },
      width: { show: false, label: "Width", placeholder: "", unit: "" },
      depth: { show: false, label: "Depth", placeholder: "", unit: "" },
      lengthSize: { show: true, label: "Coil Length / Wire Gauge", placeholder: "e.g. 90 Meters (Coil) / 2.5 sq.mm", unit: "Meters / Coil", tooltip: "Total roll length and standard gauge" },
    },
    recommendedTags: [
      "2.5 sq.mm",
      "1.5 sq.mm",
      "4.0 sq.mm",
      "Flame Retardant (FR)",
      "FRLS (Low Smoke)",
      "Up to 1100V",
      "100% Electrolytic Copper",
      "Multi-Strand Flexible",
      "ISI Marked IS:694",
      "Anti-Rodent Coating",
    ],
    sampleBrands: ["Polycab", "Havells", "Finolex", "RR Kabel", "KEI Industries", "V-Guard", "Intrihub Select"],
  },
  paints: {
    key: "paints",
    label: "Paints & Wall Finishes",
    sublabel: "Emulsions, primers, weather-coats & textures",
    slug: "paint-finishes",
    icon: Paintbrush,
    defaultUnit: "litre",
    defaultMaterial: "Acrylic Emulsion",
    fields: {
      height: { show: true, label: "Container Height", placeholder: "e.g. 180", unit: "mm", tooltip: "Bucket / Tin height" },
      width: { show: true, label: "Container Diameter / Width", placeholder: "e.g. 160", unit: "mm", tooltip: "Bucket mouth diameter" },
      depth: { show: false, label: "Depth", placeholder: "", unit: "" },
      lengthSize: { show: true, label: "Pack Volume / Size", placeholder: "e.g. 4 Litres", unit: "Litres / Gallon", tooltip: "Volume capacity of canister/bucket" },
    },
    recommendedTags: [
      "Smooth Sheen",
      "Exterior Weatherproof",
      "Interior Luxury Emulsion",
      "Anti-Algal & Fungal",
      "Washable High Scrub",
      "Low VOC / Odourless",
      "100% Acrylic Formula",
      "Teflon Surface Protector",
      "5-Year Performance Warranty",
    ],
    sampleBrands: ["Asian Paints", "Berger Paints", "Dulux", "Nerolac", "Indigo Paints", "Dr. Fixit", "Intrihub Select"],
  },
  plywood: {
    key: "plywood",
    label: "Plywood & Laminates",
    sublabel: "BWR/BWP sheets, blockboards & flush cores",
    slug: "plywood-boards",
    icon: Layers,
    defaultUnit: "sheet",
    defaultMaterial: "Hardwood Core (BWR Grade)",
    fields: {
      height: { show: true, label: "Length / Height (ft)", placeholder: "e.g. 8", unit: "ft / mm", tooltip: "Standard sheet length (e.g. 8 ft)" },
      width: { show: true, label: "Width (ft)", placeholder: "e.g. 4", unit: "ft / mm", tooltip: "Standard sheet width (e.g. 4 ft)" },
      depth: { show: true, label: "Thickness (Depth)", placeholder: "e.g. 19", unit: "mm", tooltip: "Calibrated sheet thickness (e.g. 19 mm, 12 mm)" },
      lengthSize: { show: true, label: "Overall Sheet Dimension", placeholder: "e.g. 8 ft x 4 ft (Sheet)", unit: "Standard Format", tooltip: "Complete format description" },
    },
    recommendedTags: [
      "ISI Marked BWR Grade",
      "BWP Marine Grade IS:710",
      "100% Hardwood Core",
      "Calibrated Dual-Sanded",
      "Termite & Borer Proof",
      "Zero Core Gap",
      "Boiling Water Resistant",
      "E1 Emission Certified",
      "25-Year Warranty",
    ],
    sampleBrands: ["CenturyPly", "Greenply", "Kitply", "Action TESA", "Merino", "Austin Plywood", "Intrihub Select"],
  },
  "tiles-granite": {
    key: "tiles-granite",
    label: "Tiles & Natural Granite",
    sublabel: "Vitrified tiles, polished granite & slabs",
    slug: "tiles-stone",
    icon: Grid,
    defaultUnit: "box",
    defaultMaterial: "Double Charge Vitrified",
    fields: {
      height: { show: true, label: "Tile Length / Height", placeholder: "e.g. 600", unit: "mm / cm / inch", tooltip: "Nominal tile length" },
      width: { show: true, label: "Tile Width", placeholder: "e.g. 600", unit: "mm / cm / inch", tooltip: "Nominal tile width" },
      depth: { show: true, label: "Tile Thickness", placeholder: "e.g. 9", unit: "mm", tooltip: "Body thickness" },
      lengthSize: { show: true, label: "Box Tile Coverage", placeholder: "e.g. 1.44 Sq. Meter (15.5 Sq.ft)", unit: "Sq.M / Sq.Ft per Box", tooltip: "Area covered per retail packaging box" },
    },
    recommendedTags: [
      "High Gloss Polished",
      "Vitrified Clay Body",
      "Anti-Skid R9 Grade",
      "Rectified Precision Edges",
      "Nano Stain Resistant",
      "Zero Water Absorption <0.05%",
      "Heavy Commercial Traffic",
      "Italian Marble Texture",
    ],
    sampleBrands: ["Kajaria", "Somany", "Nitco", "Simpolo", "AGL Tiles", "Orientbell", "Intrihub Select"],
  },
};

interface DynamicProductUploadFormProps {
  onSuccessRedirectUrl?: string;
  vendorId?: string | null;
  initialCategory?: CategoryKey;
}

export default function DynamicProductUploadForm({
  onSuccessRedirectUrl = "/admin/products",
  vendorId = null,
  initialCategory = "electrical",
}: DynamicProductUploadFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // ── 1. Category Selection State ──
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryKey>(initialCategory);
  const currentCategoryConfig = CATEGORY_CONFIGS[selectedCategoryKey];

  // ── 2. General & Common Fields ──
  const [productName, setProductName] = useState("");
  const [captionTagline, setCaptionTagline] = useState("");
  const [brandName, setBrandName] = useState("");
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const [mrpPrice, setMrpPrice] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [stockQty, setStockQty] = useState<string>("100");
  const [unitOfSale, setUnitOfSale] = useState<string>(currentCategoryConfig.defaultUnit);
  const [material, setMaterial] = useState<string>(currentCategoryConfig.defaultMaterial);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isTrending, setIsTrending] = useState(true);

  // ── Multi-Variants (Pack / Volume / Size / Colors) ──
  const [hasMultipleVariants, setHasMultipleVariants] = useState(false);
  const [customVariants, setCustomVariants] = useState<ProductVariant[]>([]);

  // ── Vendor Auto-Publish & Privilege State ──
  const [vendorProfile, setVendorProfile] = useState<any | null>(null);

  useEffect(() => {
    if (vendorId) {
      getVendorProfile(vendorId).then((v) => setVendorProfile(v));
    }
  }, [vendorId]);

  // ── Smart Calculator Estimations ──
  const [coverageRate, setCoverageRate] = useState<string>("");
  const [wastagePercent, setWastagePercent] = useState<string>("10");

  // ── 3. Images ──
  const [images, setImages] = useState<string[]>([
    "/placeholders/product.svg",
    "/placeholders/product.svg",
  ]);

  // ── 4. Category-Specific Dynamic Dimensions ──
  const [dimensions, setDimensions] = useState({
    height: "",
    width: "",
    depth: "",
    lengthSize: "",
  });

  // ── 5. Category-Specific Multi-Select Tags ──
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // ── 6. Dynamic Description Headings / Structured Content ──
  const [descriptionBlocks, setDescriptionBlocks] = useState<{ heading: string; body: string }[]>([
    {
      heading: "Overview & Value Proposition",
      body: "Engineered for maximum reliability, durability, and seamless installation in residential and commercial spaces.",
    },
    {
      heading: "Technical Performance & Standards",
      body: "Complies with stringent Indian IS benchmarks, featuring high wear resistance and factory-tested finish.",
    },
  ]);

  // Auto-switch defaults when category dropdown changes
  const handleCategoryChange = (newKey: CategoryKey) => {
    setSelectedCategoryKey(newKey);
    const cfg = CATEGORY_CONFIGS[newKey];
    setUnitOfSale(cfg.defaultUnit);
    setMaterial(cfg.defaultMaterial);
    setSelectedTags([]);
    setDimensions({ height: "", width: "", depth: "", lengthSize: "" });
  };

  // Toggle tag chip
  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Add custom tag
  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput("");
    }
  };

  // Discount percentage calculation
  const mrpNum = parseFloat(mrpPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const discountPercent = mrpNum > 0 && sellNum > 0 && mrpNum > sellNum
    ? Math.round(((mrpNum - sellNum) / mrpNum) * 100)
    : 0;

  // Add new description heading block
  const handleAddDescriptionBlock = () => {
    setDescriptionBlocks([
      ...descriptionBlocks,
      { heading: "Special Usage & Applications", body: "" },
    ]);
  };

  // Remove description block
  const handleRemoveDescriptionBlock = (index: number) => {
    setDescriptionBlocks(descriptionBlocks.filter((_, idx) => idx !== index));
  };

  // Update description block
  const handleUpdateDescriptionBlock = (index: number, key: "heading" | "body", value: string) => {
    const updated = [...descriptionBlocks];
    updated[index][key] = value;
    setDescriptionBlocks(updated);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      toast.error("Please enter a valid Product Name");
      return;
    }
    if (!mrpPrice || isNaN(mrpNum) || mrpNum <= 0) {
      toast.error("Please enter a valid MRP Price greater than ₹0");
      return;
    }
    if (!sellingPrice || isNaN(sellNum) || sellNum <= 0) {
      toast.error("Please enter a valid Selling Price greater than ₹0");
      return;
    }
    if (sellNum > mrpNum) {
      toast.error("Selling Price cannot exceed the MRP Price");
      return;
    }
    if (images.length === 0) {
      toast.error("Please upload or add at least one product photo");
      return;
    }

    setLoading(true);

    // Build structured description from blocks
    const fullDescription = [
      captionTagline ? `**${captionTagline}**\n` : "",
      ...descriptionBlocks.map((b) => `### ${b.heading}\n${b.body}`),
    ].filter(Boolean).join("\n\n");

    // Build specs & attributes payload
    const finalSpecs: Record<string, string> = {
      Category: currentCategoryConfig.label,
      Brand: brandName || "Intrihub Certified",
      Material: material,
      UnitOfSale: unitOfSale,
      ...(dimensions.height ? { Height: `${dimensions.height} ${currentCategoryConfig.fields.height.unit}` } : {}),
      ...(dimensions.width ? { Width: `${dimensions.width} ${currentCategoryConfig.fields.width.unit}` } : {}),
      ...(dimensions.depth ? { Depth_Thickness: `${dimensions.depth} ${currentCategoryConfig.fields.depth.unit}` } : {}),
      ...(dimensions.lengthSize ? { Length_Size: `${dimensions.lengthSize}` } : {}),
      ...(selectedTags.length > 0 ? { Highlights: selectedTags.join(" | ") } : {}),
    };

    const finalAttributes = [
      ...(brandName ? [{ key: "Brand", value: brandName }] : []),
      ...(captionTagline ? [{ key: "Tagline", value: captionTagline }] : []),
      ...(dimensions.lengthSize ? [{ key: "Format", value: dimensions.lengthSize }] : []),
      ...(dimensions.depth ? [{ key: "Thickness", value: `${dimensions.depth} mm` }] : []),
      ...selectedTags.map((tag) => ({ key: "Feature", value: tag })),
    ];

    // Compute primary size representation for variant
    const variantSize = dimensions.lengthSize ||
      (dimensions.height && dimensions.width ? `${dimensions.height}x${dimensions.width}` : "Standard");

    const formattedVariants = hasMultipleVariants && customVariants.length > 0
      ? customVariants.map((v) => ({
          size: v.attributeValue || v.size || variantSize,
          finish: v.finish || selectedTags[0] || "Standard",
          color: v.color || "Standard",
          image: v.image || null,
          unit: unitOfSale || currentCategoryConfig.defaultUnit,
          attributeLabel: v.attributeLabel || "Option",
          attributeValue: v.attributeValue || v.size || variantSize,
          pricePerBox: Number(v.pricePerBox || sellNum),
          pricePerSqft: Number(v.pricePerSqft || sellNum),
          sqftPerBox: Number(v.sqftPerBox || 1),
          stockBoxes: Number(v.stockBoxes || parseInt(stockQty, 10) || 50),
        }))
      : [
          {
            size: variantSize,
            finish: selectedTags[0] || "Standard",
            color: "Standard",
            image: null,
            unit: unitOfSale || currentCategoryConfig.defaultUnit,
            attributeLabel: "Size",
            attributeValue: variantSize,
            pricePerBox: sellNum,
            pricePerSqft: sellNum,
            sqftPerBox: 1,
            stockBoxes: parseInt(stockQty, 10) || 50,
          },
        ];

    const coverageNum = parseFloat(coverageRate);
    const wastageNum = (parseFloat(wastagePercent) || 10) / 100 + 1.0;

    const res = await createProduct({
      name: productName.trim(),
      categorySlug: currentCategoryConfig.slug,
      categoryName: currentCategoryConfig.label,
      material: material || currentCategoryConfig.defaultMaterial,
      description: fullDescription || `${productName} — High quality certified material available with expedited delivery.`,
      images: images.length > 0 ? images : ["/placeholders/product.svg"],
      unitOfSale: unitOfSale || currentCategoryConfig.defaultUnit,
      vendorId: vendorId || null,
      coverageRate: !isNaN(coverageNum) && coverageNum > 0 ? coverageNum : null,
      wastageFactor: wastageNum,
      isBestseller,
      isNew: isNewArrival,
      isTrending,
      specs: finalSpecs,
      attributes: finalAttributes,
      variants: formattedVariants,
    });

    setLoading(false);

    if (res.success) {
      toast.success(`"${productName}" created successfully!`);
      router.push(onSuccessRedirectUrl);
    } else {
      toast.error(res.error || "Failed to create product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <Link
            href={onSuccessRedirectUrl}
            className="p-2.5 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">
                Dynamic Product Upload Form
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-wider">
                Live Dynamic
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Category-driven adaptive specifications for Intrihub e-commerce catalog
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{loading ? "Publishing..." : "Publish Product"}</span>
          </button>
        </div>
      </div>

      {/* ── Vendor Auto-Publish Status Banner ── */}
      {vendorId && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border flex items-start gap-3.5 transition-all ${
            vendorProfile?.autoPublishEnabled
              ? "bg-emerald-50/90 border-emerald-200 text-emerald-950"
              : "bg-blue-50/90 border-blue-200 text-blue-950"
          }`}
        >
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
              vendorProfile?.autoPublishEnabled
                ? "bg-emerald-600 text-white"
                : "bg-blue-600 text-white"
            }`}
          >
            {vendorProfile?.autoPublishEnabled ? (
              <Zap size={18} />
            ) : (
              <ShieldCheck size={18} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-xs sm:text-sm font-black">
                {vendorProfile?.autoPublishEnabled
                  ? "✓ Auto-Publish Enabled — Instant Live Catalog"
                  : "Standard Catalog Quality Review"}
              </strong>
              {vendorProfile?.autoPublishEnabled ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200/60 text-emerald-800 border border-emerald-300">
                  Trusted Seller
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                  Admin Approval Required
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 opacity-85">
              {vendorProfile?.autoPublishEnabled
                ? "Your vendor account has Super Admin verified instant-publishing privileges. Products you submit or modify go live immediately without waiting in the approval queue."
                : "Your new products will be submitted to the Super Admin review queue before going live on the storefront."}
            </p>
          </div>
        </div>
      )}

      {/* ── Section 1: Category Selector (Master Dynamic Driver) ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-[#F26522]" />
            <h2 className="text-base font-black text-[#052a51]">
              1. Select Product Category
            </h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">
            Form fields adapt automatically
          </span>
        </div>

        {/* Visual Category Radio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {(Object.keys(CATEGORY_CONFIGS) as CategoryKey[]).map((catKey) => {
            const cfg = CATEGORY_CONFIGS[catKey];
            const Icon = cfg.icon;
            const isSelected = selectedCategoryKey === catKey;

            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleCategoryChange(catKey)}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? "bg-gradient-to-b from-orange-50/70 to-white border-[#F26522] shadow-sm ring-2 ring-[#F26522]/20"
                    : "bg-gray-50/70 hover:bg-white border-gray-200/80 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? "bg-[#F26522] text-white shadow-xs"
                        : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#F26522] text-white flex items-center justify-center text-[10px] font-bold">
                      <Check size={12} strokeWidth={3} />
                    </div>
                  )}
                </div>

                <div>
                  <h3
                    className={`text-xs font-black line-clamp-1 ${
                      isSelected ? "text-[#F26522]" : "text-gray-900"
                    }`}
                  >
                    {cfg.label.split("(")[0].trim()}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1 leading-tight">
                    {cfg.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: General & Common Fields ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <Package size={18} className="text-[#F26522]" />
          <h2 className="text-base font-black text-[#052a51]">
            2. General & Identity Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Product Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Product Name *
            </label>
            <input
              type="text"
              required
              placeholder={`e.g. ${
                selectedCategoryKey === "electrical"
                  ? "Havells Oro 6-Module Polycarbonate Switchboard Plate"
                  : selectedCategoryKey === "electrical-wires"
                  ? "Polycab 2.5 sq.mm Flame Retardant Red House Wire (90m)"
                  : selectedCategoryKey === "paints"
                  ? "Asian Paints Apex Ultima Weatherproof Exterior Emulsion (4L)"
                  : selectedCategoryKey === "plywood"
                  ? "CenturyPly Club Prime 19mm Boiling Water Proof Hardwood Sheet"
                  : "Kajaria 600x600mm Statuario Polished Vitrified Floor Tiles"
              }`}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Caption Tagline */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Caption / Short Tagline (Catchphrase)
            </label>
            <input
              type="text"
              placeholder="e.g. Commercial Grade Fire-Resistant Switchboard · 10-Year Warranty"
              value={captionTagline}
              onChange={(e) => setCaptionTagline(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Brand Name (Dropdown with popular options + custom write-in) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Brand Name *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomBrand(!isCustomBrand)}
                className="text-[11px] font-bold text-[#F26522] hover:underline cursor-pointer"
              >
                {isCustomBrand ? "Select from list" : "+ Enter custom brand"}
              </button>
            </div>

            {isCustomBrand ? (
              <input
                type="text"
                required
                placeholder="Enter custom brand name..."
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            ) : (
              <select
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522] cursor-pointer"
              >
                <option value="">Select Brand...</option>
                {currentCategoryConfig.sampleBrands.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Material / Construction Core */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Material / Base Composition
            </label>
            <input
              type="text"
              placeholder="e.g. Polycarbonate / Electrolytic Copper / Vitrified Clay"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>
      </div>

      {/* ── Section 3: Dynamic Category-Specific Dimensions & Highlights ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Layers3 size={18} className="text-[#F26522]" />
            <h2 className="text-base font-black text-[#052a51]">
              3. Category-Specific Dynamic Specifications ({currentCategoryConfig.label.split("(")[0].trim()})
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-[#F26522] border border-orange-100 self-start sm:self-auto">
            Adapted for {currentCategoryConfig.label.split("(")[0].trim()}
          </span>
        </div>

        {/* Dynamic Dimensional Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Height */}
          {currentCategoryConfig.fields.height.show && (
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  {currentCategoryConfig.fields.height.label}
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {currentCategoryConfig.fields.height.unit}
                </span>
              </div>
              <input
                type="text"
                placeholder={currentCategoryConfig.fields.height.placeholder}
                value={dimensions.height}
                onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              {currentCategoryConfig.fields.height.tooltip && (
                <p className="text-[10px] text-gray-400 leading-tight">
                  {currentCategoryConfig.fields.height.tooltip}
                </p>
              )}
            </div>
          )}

          {/* Width */}
          {currentCategoryConfig.fields.width.show && (
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  {currentCategoryConfig.fields.width.label}
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {currentCategoryConfig.fields.width.unit}
                </span>
              </div>
              <input
                type="text"
                placeholder={currentCategoryConfig.fields.width.placeholder}
                value={dimensions.width}
                onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              {currentCategoryConfig.fields.width.tooltip && (
                <p className="text-[10px] text-gray-400 leading-tight">
                  {currentCategoryConfig.fields.width.tooltip}
                </p>
              )}
            </div>
          )}

          {/* Depth / Thickness */}
          {currentCategoryConfig.fields.depth.show && (
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  {currentCategoryConfig.fields.depth.label}
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {currentCategoryConfig.fields.depth.unit}
                </span>
              </div>
              <input
                type="text"
                placeholder={currentCategoryConfig.fields.depth.placeholder}
                value={dimensions.depth}
                onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              {currentCategoryConfig.fields.depth.tooltip && (
                <p className="text-[10px] text-gray-400 leading-tight">
                  {currentCategoryConfig.fields.depth.tooltip}
                </p>
              )}
            </div>
          )}

          {/* Length / Size / Volume / Coverage */}
          {currentCategoryConfig.fields.lengthSize.show && (
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-800">
                  {currentCategoryConfig.fields.lengthSize.label}
                </label>
                <span className="text-[10px] font-bold text-gray-400 uppercase">
                  {currentCategoryConfig.fields.lengthSize.unit}
                </span>
              </div>
              <input
                type="text"
                placeholder={currentCategoryConfig.fields.lengthSize.placeholder}
                value={dimensions.lengthSize}
                onChange={(e) => setDimensions({ ...dimensions, lengthSize: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              {currentCategoryConfig.fields.lengthSize.tooltip && (
                <p className="text-[10px] text-gray-400 leading-tight">
                  {currentCategoryConfig.fields.lengthSize.tooltip}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Highlights & Multi-Select Tags */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} className="text-[#F26522]" />
              <span>Highlights & Technical Features (Click to select)</span>
            </label>
            <span className="text-xs text-gray-400 font-medium">
              {selectedTags.length} selected
            </span>
          </div>

          {/* Tag Chips */}
          <div className="flex flex-wrap gap-2">
            {currentCategoryConfig.recommendedTags.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? "bg-[#052a51] text-white shadow-xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200/60"
                  }`}
                >
                  {active && <Check size={12} />}
                  <span>{tag}</span>
                </button>
              );
            })}
          </div>

          {/* Add Custom Tag Input */}
          <div className="flex items-center gap-2 pt-1 max-w-md">
            <input
              type="text"
              placeholder="Add other custom technical feature..."
              value={customTagInput}
              onChange={(e) => setCustomTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              className="flex-1 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </div>

      {/* ── Section 4: Pricing, Stock & Commercials ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <IndianRupee size={18} className="text-[#F26522]" />
            <h2 className="text-base font-black text-[#052a51]">
              4. Pricing, Units & Inventory Stock
            </h2>
          </div>
          {discountPercent > 0 && (
            <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black rounded-full">
              🎉 {discountPercent}% OFF Customer Discount
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {/* MRP Price */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              MRP Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 1500"
                value={mrpPrice}
                onChange={(e) => setMrpPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-black text-gray-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Maximum retail printed price</p>
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Selling / Offer Price (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F26522] font-black text-sm">
                ₹
              </span>
              <input
                type="number"
                required
                min={1}
                placeholder="e.g. 1199"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-black text-[#F26522] focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Actual price charged to customer</p>
          </div>

          {/* Stock Quantity */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Initial Stock Qty *
            </label>
            <input
              type="number"
              required
              min={0}
              placeholder="e.g. 100"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-sm font-black text-gray-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <p className="text-[10px] text-gray-400 mt-1">Available warehouse units</p>
          </div>

          {/* Unit of Sale */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Unit of Sale
            </label>
            <select
              value={unitOfSale}
              onChange={(e) => setUnitOfSale(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="piece">Piece (Pcs)</option>
              <option value="box">Box (Tiles / Screws)</option>
              <option value="coil">Coil / Roll (Wires)</option>
              <option value="litre">Litre / Bucket (Paints)</option>
              <option value="sheet">Sheet / Board (Plywood)</option>
              <option value="sqft">Square Feet (Sq.ft)</option>
              <option value="meter">Meter (Pipes/Cables)</option>
            </select>
            <p className="text-[10px] text-gray-400 mt-1">Billing & cart decrement unit</p>
          </div>
        </div>

        {/* Coverage Rate & Estimator Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>
                {currentCategoryConfig.slug === "tiles-granite"
                  ? "Coverage Rate (sq.ft / box)"
                  : currentCategoryConfig.slug === "paints"
                  ? "Coverage Rate (sq.ft / litre / coat)"
                  : currentCategoryConfig.slug === "electrical" || currentCategoryConfig.slug === "electrical-wires"
                  ? "Length (meters / coil)"
                  : "Coverage / Yield per Unit (Optional)"}
              </span>
              <span className="text-[10px] font-normal text-gray-400">Powers Smart Calculator</span>
            </label>
            <input
              type="number"
              step="any"
              min={0}
              placeholder={
                currentCategoryConfig.slug === "tiles-granite"
                  ? "e.g. 16 (sq.ft per box)"
                  : currentCategoryConfig.slug === "paints"
                  ? "e.g. 120 (sq.ft per litre)"
                  : currentCategoryConfig.slug === "electrical" || currentCategoryConfig.slug === "electrical-wires"
                  ? "e.g. 90 (meters per coil)"
                  : "e.g. 20"
              }
              value={coverageRate}
              onChange={(e) => setCoverageRate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              {currentCategoryConfig.slug === "tiles-granite"
                ? "How many sq.ft does one box cover? (e.g. 16 sq.ft for standard 600x600 tiles)"
                : currentCategoryConfig.slug === "paints"
                ? "How many sq.ft does one litre cover per coat? (e.g. 120 sq.ft for luxury emulsion)"
                : currentCategoryConfig.slug === "electrical" || currentCategoryConfig.slug === "electrical-wires"
                ? "How many meters are in one standard coil? (e.g. 90m for wire coils)"
                : "Leave empty if product does not need automated calculator"}
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Wastage & Buffer Margin (%)</span>
              <span className="text-[10px] font-normal text-gray-400">Default: 10%</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={50}
                placeholder="10"
                value={wastagePercent}
                onChange={(e) => setWastagePercent(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200 rounded-2xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                %
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Cutting/application buffer added automatically before rounding up
            </p>
          </div>
        </div>

        {/* Badges & Merchandising Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isBestseller}
              onChange={(e) => setIsBestseller(e.target.checked)}
              className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-700">Mark as Bestseller 🔥</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isNewArrival}
              onChange={(e) => setIsNewArrival(e.target.checked)}
              className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-700">Mark as New Arrival ✨</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={isTrending}
              onChange={(e) => setIsTrending(e.target.checked)}
              className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
            />
            <span className="text-xs font-bold text-gray-700">Feature on Trending Carousel 🚀</span>
          </label>
        </div>

        {/* ── Multi-Variants (Volume / Litre / Dimension / Colors) Switcher ── */}
        <div className="pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-[#052a51] uppercase tracking-wider">
                Multiple Sizes / Packs / Litres / Colors
              </h3>
              <p className="text-[11px] text-gray-400">
                Enable if this product has multiple options (e.g., 1L / 4L / 10L / 20L paint or 6mm / 12mm / 19mm plywood)
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextState = !hasMultipleVariants;
                setHasMultipleVariants(nextState);
                if (nextState && customVariants.length === 0) {
                  const defaultVariantSize = dimensions.lengthSize || (dimensions.height && dimensions.width ? `${dimensions.height}x${dimensions.width}` : "Standard");
                  setCustomVariants([
                    {
                      id: "v-1",
                      size: defaultVariantSize,
                      finish: selectedTags[0] || "Standard",
                      color: "Standard",
                      image: images[0] || null,
                      unit: unitOfSale,
                      attributeLabel: "Size",
                      attributeValue: defaultVariantSize,
                      pricePerBox: sellNum || 1000,
                      pricePerSqft: sellNum || 1000,
                      sqftPerBox: 1,
                      stockBoxes: parseInt(stockQty, 10) || 50,
                      inStock: true,
                    },
                  ]);
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hasMultipleVariants
                  ? "bg-[#F26522] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {hasMultipleVariants ? "✓ Multi-Variants Enabled" : "+ Enable Multi-Variants"}
            </button>
          </div>

          {hasMultipleVariants && (
            <div className="pt-2">
              <VariantEditor
                variants={customVariants}
                onChange={setCustomVariants}
                unitOfSale={unitOfSale}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Section 5: Image Media Assets ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-4">
        <ImageUploadManager images={images} onChange={setImages} />
      </div>

      {/* ── Section 6: Dynamic Structured Description Headings ── */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-2xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-[#F26522]" />
            <h2 className="text-base font-black text-[#052a51]">
              5. Structured Description & Headings
            </h2>
          </div>
          <button
            type="button"
            onClick={handleAddDescriptionBlock}
            className="text-xs font-bold text-[#F26522] hover:bg-orange-50 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1 cursor-pointer border border-orange-200"
          >
            <Plus size={14} /> Add Section Block
          </button>
        </div>

        <div className="space-y-4">
          {descriptionBlocks.map((block, index) => (
            <div
              key={index}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={block.heading}
                  onChange={(e) => handleUpdateDescriptionBlock(index, "heading", e.target.value)}
                  placeholder="Section Heading (e.g. Overview / Warranty / Usage)"
                  className="font-bold text-xs text-[#052a51] bg-white border border-gray-200 px-3 py-1.5 rounded-xl w-full max-w-sm focus:outline-none focus:border-[#F26522]"
                />
                {descriptionBlocks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDescriptionBlock(index)}
                    className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer"
                    title="Remove block"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <textarea
                rows={3}
                value={block.body}
                onChange={(e) => handleUpdateDescriptionBlock(index, "body", e.target.value)}
                placeholder="Write detailed specifications, installation notes, or product highlights..."
                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Submit Floating Bar ── */}
      <div className="sticky bottom-6 z-30 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-gray-200 shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center font-bold text-base border border-orange-100">
            ✨
          </div>
          <div>
            <p className="text-xs font-bold text-[#052a51]">
              Ready to Publish {productName ? `"${productName.slice(0, 32)}..."` : "New Product"}
            </p>
            <p className="text-[11px] text-gray-400">
              Configured for category: <strong>{currentCategoryConfig.label}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={onSuccessRedirectUrl}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{loading ? "Publishing..." : "Save Product to Catalog"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
