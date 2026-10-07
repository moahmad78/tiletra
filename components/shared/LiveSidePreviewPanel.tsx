"use client";

import React, { useState } from "react";
import {
  Eye,
  Maximize2,
  X,
  Layers,
  Sparkles,
  ShoppingBag,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  IndianRupee,
  Star,
  Tag,
  Box,
  ChevronRight,
  Info,
  Sliders,
  ImageIcon,
  MapPin,
  Calendar,
} from "lucide-react";

export interface LiveSidePreviewProps {
  currentStep: number;
  categoryName?: string;
  categoryImage?: string;
  subcategoryName?: string;
  subcategoryImage?: string;
  title: string;
  brand?: string;
  customBrandInput?: string;
  modelNumber?: string;
  description?: string;
  sellingPrice?: number | string;
  mrp?: number | string;
  unitOfSale?: string;
  stockQuantity?: string;
  images?: string[];
  colour?: string;
  finish?: string;
  material?: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  packedWeightKg?: string;
  highlights?: string[];
  shippingMode?: string;
  dispatchTimeDays?: string | number;
  returnPolicyDays?: string | number;
  warrantyDuration?: string;
  allowCod?: boolean;
  slug?: string;
  onExpandModal: () => void;
  onClosePreview?: () => void;
}

export default function LiveSidePreviewPanel({
  currentStep,
  categoryName,
  categoryImage,
  subcategoryName,
  subcategoryImage,
  title,
  brand = "Intrihub",
  customBrandInput,
  modelNumber,
  description,
  sellingPrice,
  mrp,
  unitOfSale = "box",
  stockQuantity = "100",
  images = [],
  colour,
  finish,
  material,
  lengthCm,
  widthCm,
  heightCm,
  packedWeightKg,
  highlights = [],
  shippingMode = "standard",
  dispatchTimeDays = "2",
  returnPolicyDays = "7",
  warrantyDuration = "1 Year",
  allowCod = true,
  slug,
  onExpandModal,
  onClosePreview,
}: LiveSidePreviewProps) {
  const [activeTab, setActiveTab] = useState<"card" | "detail" | "map">("card");
  const [selectedImageIdx, setSelectedImageIdx] = useState<number>(0);

  const displayBrand = brand === "other" && customBrandInput?.trim() ? customBrandInput.trim() : brand;
  const validImages = (images || []).filter((img) => img && !img.includes("placeholder"));
  const activeImage = validImages[selectedImageIdx] || validImages[0] || "/placeholders/product.svg";

  const numSelling = Number(sellingPrice) || 0;
  const numMrp = Number(mrp) || 0;
  const discountPercent =
    numMrp > numSelling && numSelling > 0
      ? Math.round(((numMrp - numSelling) / numMrp) * 100)
      : 0;
  const savings = numMrp > numSelling && numSelling > 0 ? numMrp - numSelling : 0;

  const stepLabels: Record<number, string> = {
    1: "Step 1: Category & Sub-category",
    2: "Step 2: Title, Brand & Rate",
    3: "Step 3: Photos & Gallery",
    4: "Step 4: Variants & Dimensions",
    5: "Step 5: Shipping & Delivery",
    6: "Step 6: Returns & Warranty",
    7: "Step 7: SEO & Store Publish",
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden flex flex-col max-h-[calc(100vh-110px)]">
      {/* ── Top Header with Live Indicator ── */}
      <div className="bg-[#052a51] text-white p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black tracking-wide text-white uppercase flex items-center gap-1.5">
              Live Preview
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Live Sync
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExpandModal}
              title="Expand Fullscreen Website Preview"
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <Maximize2 size={14} />
            </button>
            {onClosePreview && (
              <button
                type="button"
                onClick={onClosePreview}
                title="Hide Live Preview Sidebar"
                className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Current Step Tracker Pill */}
        <div className="bg-white/10 rounded-xl px-3 py-1.5 flex items-center justify-between text-[11px] mb-3">
          <span className="text-white/70">Syncing with form:</span>
          <span className="font-bold text-[#FF9900] truncate max-w-[200px]">
            {stepLabels[currentStep] || `Step ${currentStep}`}
          </span>
        </div>

        {/* View Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/10 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "card"
                ? "bg-[#F26522] text-white shadow-xs"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShoppingBag size={12} />
            <span className="text-[11px]">Card View</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("detail")}
            className={`py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "detail"
                ? "bg-[#F26522] text-white shadow-xs"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <Eye size={12} />
            <span className="text-[11px]">Product Page</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("map")}
            className={`py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "map"
                ? "bg-[#F26522] text-white shadow-xs"
                : "text-white/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <Info size={12} />
            <span className="text-[11px]">Where Added?</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable Preview Body ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60">
        {/* ========================================================= */}
        {/* TAB 1: CARD VIEW (STOREFRONT GRID ITEM)                   */}
        {/* ========================================================= */}
        {activeTab === "card" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold px-1">
              <span>Customer Category &amp; Search Card:</span>
              <span className="text-[#F26522] font-mono text-[10px]">Real Store View</span>
            </div>

            {/* Simulated IntriHub Product Card */}
            <div className="bg-white rounded-3xl border border-gray-200 p-3 shadow-md hover:shadow-lg transition-all space-y-3 group">
              {/* Product Image Area */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 flex items-center justify-center">
                <img
                  src={activeImage}
                  alt={title || "Product preview"}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/placeholders/product.svg";
                  }}
                />

                {/* Category & Subcategory Tag on Image */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 max-w-[70%]">
                  {categoryName && (
                    <span className="bg-[#052a51]/90 backdrop-blur-xs text-white text-[9px] font-black px-2 py-0.5 rounded-md truncate shadow-xs">
                      {categoryName}
                    </span>
                  )}
                  {subcategoryName && (
                    <span className="bg-[#F26522]/90 backdrop-blur-xs text-white text-[9px] font-bold px-2 py-0.5 rounded-md truncate shadow-xs">
                      ↳ {subcategoryName}
                    </span>
                  )}
                </div>

                {/* Discount Badge */}
                {discountPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md animate-in zoom-in-75">
                    {discountPercent}% OFF
                  </div>
                )}

                {/* Color Swatch Dot on Card */}
                {colour && (
                  <div
                    className="absolute bottom-2 left-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-full text-[9px] font-bold text-gray-700 shadow-xs border border-gray-200"
                    title={`Colour: ${colour}`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-gray-300 shrink-0"
                      style={{ backgroundColor: colour }}
                    />
                    <span className="truncate max-w-[70px]">{colour}</span>
                  </div>
                )}

                {/* Multi-image thumbnail strip (if > 1 image) */}
                {validImages.length > 1 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded-lg text-[9px] font-bold text-white">
                    <ImageIcon size={10} />
                    <span>+{validImages.length}</span>
                  </div>
                )}
              </div>

              {/* Brand & Stock */}
              <div className="flex items-center justify-between text-[11px] gap-2 pt-0.5">
                <span className="text-[#F26522] font-black tracking-wider uppercase text-[10px] truncate">
                  {displayBrand || "Intrihub"}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                  {Number(stockQuantity) > 0 ? `In Stock (${stockQuantity})` : "Out of Stock"}
                </span>
              </div>

              {/* Title */}
              <div>
                <h4 className="text-xs font-black text-gray-900 line-clamp-2 leading-snug">
                  {title || (
                    <span className="text-gray-400 italic font-normal">
                      Product title will appear here as you type in Step 2...
                    </span>
                  )}
                </h4>
                {modelNumber && (
                  <p className="text-[10px] text-gray-600 font-mono mt-0.5">
                    Model: {modelNumber}
                  </p>
                )}
              </div>

              {/* Specs & Dimensions Pills */}
              <div className="flex flex-wrap gap-1 text-[10px]">
                {material && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                    {material}
                  </span>
                )}
                {finish && (
                  <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium">
                    {finish}
                  </span>
                )}
                {lengthCm && widthCm && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono font-bold">
                    {lengthCm}×{widthCm}{heightCm ? `×${heightCm}` : ""} cm
                  </span>
                )}
              </div>

              {/* Pricing & Unit */}
              <div className="pt-2 border-t border-gray-100 flex items-baseline justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-black text-[#052a51]">
                      ₹{numSelling > 0 ? numSelling.toLocaleString("en-IN") : "0"}
                    </span>
                    {numMrp > numSelling && numMrp > 0 && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{numMrp.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium block">
                    per {unitOfSale || "box"}
                  </span>
                </div>

                {savings > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                    Save ₹{savings.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              {/* Delivery info strip */}
              <div className="bg-gray-50 rounded-xl p-2 flex items-center justify-between text-[10px] text-gray-600">
                <span className="flex items-center gap-1 font-medium">
                  <Truck size={11} className="text-[#F26522]" />
                  <span>Ships in {dispatchTimeDays || 2}d</span>
                </span>
                <span className="font-bold text-gray-700">
                  {allowCod ? "COD Available" : "Prepaid Only"}
                </span>
              </div>
            </div>

            {/* Quick Helper Tip */}
            <div className="p-3 rounded-2xl bg-orange-50/70 border border-orange-200/80 text-[11px] text-orange-950 flex items-start gap-2">
              <Sparkles size={14} className="text-[#F26522] shrink-0 mt-0.5" />
              <p className="leading-tight">
                <strong>Live Sync:</strong> As you fill in rates, images, and category in the wizard, this card reflects the exact store look in real-time.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: DETAIL VIEW (PRODUCT STOREFRONT PAGE)              */}
        {/* ========================================================= */}
        {activeTab === "detail" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold px-1">
              <span>Customer Product Detail View:</span>
              <span className="text-blue-700 font-mono text-[10px]">/product/{slug || "item"}</span>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-sm space-y-4">
              {/* Breadcrumb Simulation */}
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium overflow-x-auto whitespace-nowrap">
                <span>Home</span>
                <ChevronRight size={10} />
                <span className="text-[#052a51] font-bold">{categoryName || "Category"}</span>
                {subcategoryName && (
                  <>
                    <ChevronRight size={10} />
                    <span className="text-[#F26522] font-bold">{subcategoryName}</span>
                  </>
                )}
              </div>

              {/* Main Photo & Thumbnail Gallery */}
              <div className="space-y-2">
                <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    src={activeImage}
                    alt="Product detail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "/placeholders/product.svg";
                    }}
                  />
                  {categoryName && (
                    <span className="absolute top-2 left-2 bg-[#052a51]/90 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                      {categoryName}
                    </span>
                  )}
                </div>

                {/* Thumbnails to test gallery switching */}
                {validImages.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {validImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIdx(idx)}
                        className={`w-11 h-11 rounded-xl overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                          selectedImageIdx === idx
                            ? "border-[#F26522] ring-2 ring-orange-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Title, Brand & Star Rating */}
              <div>
                <span className="text-[10px] font-black text-[#F26522] uppercase tracking-wider">
                  {displayBrand || "Intrihub"}
                </span>
                <h3 className="text-sm font-black text-gray-900 mt-0.5 leading-snug">
                  {title || "Untitled Product Listing"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-500 text-[10px]">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={11} fill="currentColor" strokeWidth={0} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-bold">5.0 (New Listing)</span>
                </div>
              </div>

              {/* Pricing Box */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-black text-[#052a51]">
                    ₹{numSelling > 0 ? numSelling.toLocaleString("en-IN") : "0"}
                  </span>
                  {numMrp > numSelling && numMrp > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{numMrp.toLocaleString("en-IN")}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-medium">
                  Inclusive of all taxes • Unit: Per {unitOfSale || "box"}
                </p>
              </div>

              {/* Sub-category & Technical Specs Table */}
              <div className="space-y-1.5 pt-1">
                <h5 className="text-[11px] font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1">
                  <Sliders size={12} className="text-[#F26522]" />
                  <span>Sub-category &amp; Technical Specs</span>
                </h5>
                <div className="bg-gray-50/80 rounded-2xl border border-gray-200 divide-y divide-gray-200/70 text-[11px]">
                  <div className="flex justify-between p-2">
                    <span className="text-gray-500 font-medium">Category</span>
                    <span className="font-bold text-gray-900">{categoryName || "Not selected"}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="text-gray-500 font-medium">Sub-category</span>
                    <span className="font-bold text-[#F26522]">{subcategoryName || "None"}</span>
                  </div>
                  {colour && (
                    <div className="flex justify-between p-2 items-center">
                      <span className="text-gray-500 font-medium">Colour / Shade</span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-2xs"
                          style={{ backgroundColor: colour }}
                        />
                        <span className="font-bold text-gray-900">{colour}</span>
                      </div>
                    </div>
                  )}
                  {material && (
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500 font-medium">Material</span>
                      <span className="font-bold text-gray-900">{material}</span>
                    </div>
                  )}
                  {finish && (
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500 font-medium">Surface Finish</span>
                      <span className="font-bold text-gray-900">{finish}</span>
                    </div>
                  )}
                  {(lengthCm || widthCm || heightCm) && (
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500 font-medium">Dimensions (L×W×H)</span>
                      <span className="font-bold text-gray-900 font-mono">
                        {lengthCm || 0} × {widthCm || 0} × {heightCm || 0} cm
                      </span>
                    </div>
                  )}
                  {packedWeightKg && (
                    <div className="flex justify-between p-2">
                      <span className="text-gray-500 font-medium">Packed Weight</span>
                      <span className="font-bold text-gray-900 font-mono">{packedWeightKg} kg</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Highlights Bullets */}
              {highlights.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <h5 className="text-[11px] font-black text-[#052a51] uppercase tracking-wider">
                    Product Highlights
                  </h5>
                  <ul className="space-y-1">
                    {highlights.slice(0, 4).map((hl, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700">
                        <Check size={12} className="text-emerald-600 shrink-0 mt-0.5" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gray-100 text-[10px]">
                <div className="p-2 rounded-xl bg-gray-50 flex items-center gap-1.5 text-gray-700">
                  <Truck size={12} className="text-[#F26522]" />
                  <span>Ships in {dispatchTimeDays} days</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 flex items-center gap-1.5 text-gray-700">
                  <RotateCcw size={12} className="text-blue-600" />
                  <span>{returnPolicyDays}-Day Replacement</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 flex items-center gap-1.5 text-gray-700">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  <span>{warrantyDuration} Warranty</span>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 flex items-center gap-1.5 text-gray-700">
                  <Box size={12} className="text-amber-600" />
                  <span>{allowCod ? "COD Available" : "Prepaid Only"}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: WHERE ADDED? (LIVE FIELD TO STOREFRONT MAPPER)     */}
        {/* ========================================================= */}
        {activeTab === "map" && (
          <div className="space-y-3">
            <div className="text-[11px] text-gray-500 font-bold px-1">
              Field Mapping Guide: Where your entries appear on the website
            </div>

            <div className="space-y-2">
              {[
                {
                  step: "Step 1",
                  title: "Category & Sub-category",
                  value: `${categoryName || "Not set"} ➔ ${subcategoryName || "None"}`,
                  desc: "Defines website navigation filters, category cards, and breadcrumbs for Google search.",
                  active: currentStep === 1,
                },
                {
                  step: "Step 2",
                  title: "Product Title & Rate",
                  value: `"${title || 'Your Title'}" | ₹${sellingPrice || 0} (MRP: ₹${mrp || 0})`,
                  desc: "Displays as main H1 product title, price tag, discount % savings badge, and cart checkout price.",
                  active: currentStep === 2,
                },
                {
                  step: "Step 3",
                  title: "Images & Media",
                  value: `${validImages.length} image(s) uploaded`,
                  desc: "Shown in storefront grid card, zoomable photo gallery, and Google Shopping image preview.",
                  active: currentStep === 3,
                },
                {
                  step: "Step 4",
                  title: "Sub-category, Colour & Specs",
                  value: `Colour: ${colour || "None"} | Dimensions: ${lengthCm || 0}×${widthCm || 0} cm`,
                  desc: "Customers use these to filter by colour swatches, material types, and check installation sizing.",
                  active: currentStep === 4,
                },
                {
                  step: "Step 5",
                  title: "Shipping & Delivery",
                  value: `${dispatchTimeDays || 2} Days Dispatch | COD: ${allowCod ? 'Yes' : 'No'}`,
                  desc: "Shows delivery promise badge ('60-min delivery' or 'Direct-to-site delivery') on the product page.",
                  active: currentStep === 5,
                },
                {
                  step: "Step 6",
                  title: "Returns & Warranty",
                  value: `${returnPolicyDays || 7} Days Return | ${warrantyDuration || '1 Year'} Warranty`,
                  desc: "Displays trust seal icons below the 'Buy Now' button to boost customer purchase confidence.",
                  active: currentStep === 6,
                },
                {
                  step: "Step 7",
                  title: "SEO Metadata & Slug",
                  value: `/product/${slug || 'product-slug'}`,
                  desc: "Creates clean canonical URL and rich Google snippet with price, rating, and stock availability.",
                  active: currentStep === 7,
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border transition-all ${
                    item.active
                      ? "bg-orange-50/80 border-[#F26522] ring-2 ring-[#F26522]/30 shadow-xs"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-black text-[#052a51]">
                      {item.title}
                    </span>
                    <span
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                        item.active
                          ? "bg-[#F26522] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.step} {item.active ? "(Active)" : ""}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono font-bold text-gray-800 truncate mb-1">
                    {item.value}
                  </p>
                  <p className="text-[10px] text-gray-500 leading-tight">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Fullscreen Button ── */}
      <div className="p-3 bg-white border-t border-gray-200 shrink-0">
        <button
          type="button"
          onClick={onExpandModal}
          className="w-full py-2.5 px-4 rounded-2xl bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
        >
          <Maximize2 size={13} className="text-[#FF9900]" />
          <span>Open Full Interactive Storefront</span>
        </button>
      </div>
    </div>
  );
}
