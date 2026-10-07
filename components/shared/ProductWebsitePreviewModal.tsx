"use client";

import React, { useState } from "react";
import {
  X,
  ExternalLink,
  Smartphone,
  Monitor,
  Star,
  Package,
  Truck,
  Shield,
  RotateCcw,
  CheckCircle2,
  Share2,
  Heart,
  ChevronRight,
  Layers,
  IndianRupee,
  BadgeCheck,
} from "lucide-react";

export interface ProductPreviewData {
  name: string;
  brand?: string;
  modelNumber?: string;
  description?: string;
  categoryName?: string;
  subcategoryName?: string;
  unitOfSale?: string;
  sellingPrice?: number | string;
  mrp?: number | string;
  images?: string[];
  colour?: string;
  finish?: string;
  material?: string;
  lengthCm?: string;
  widthCm?: string;
  heightCm?: string;
  weightKg?: string;
  highlights?: string[];
  shippingMode?: string;
  dispatchTimeDays?: string | number;
  returnPolicyDays?: string | number;
  warrantyDuration?: string;
  allowCod?: boolean;
  slug?: string;
}

interface ProductWebsitePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProductPreviewData;
}

export default function ProductWebsitePreviewModal({
  isOpen,
  onClose,
  data,
}: ProductWebsitePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!isOpen) return null;

  const validImages = (data.images || []).filter(
    (img) => img && !img.includes("placeholder")
  );
  const displayImages =
    validImages.length > 0 ? validImages : ["/placeholders/product.svg"];

  const selling = Number(data.sellingPrice) || 0;
  const mrpVal = Number(data.mrp) || 0;
  const discount =
    mrpVal > selling && selling > 0
      ? Math.round(((mrpVal - selling) / mrpVal) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 w-full max-w-5xl rounded-3xl shadow-2xl border border-white/20 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header / Mode Switcher */}
        <div className="bg-[#052a51] text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-[#F26522] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              👁️
            </span>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
                <span>Storefront Live Preview</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Live View Simulation
                </span>
              </h3>
              <p className="text-[11px] text-white/70">
                Check how customers will see and experience this product on IntriHub.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Switcher (Desktop / Mobile) */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDeviceMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === "desktop"
                    ? "bg-white text-[#052a51] shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Monitor size={13} />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setDeviceMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  deviceMode === "mobile"
                    ? "bg-white text-[#052a51] shadow-xs"
                    : "text-white/80 hover:text-white"
                }`}
              >
                <Smartphone size={13} />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            {/* External link to actual live page if slug exists */}
            {data.slug && (
              <a
                href={`/product/${data.slug}`}
                target="_blank"
                rel="noreferrer"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
                title="Open live URL on customer website"
              >
                <span>Live Page</span>
                <ExternalLink size={12} />
              </a>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Preview Viewport Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {deviceMode === "desktop" ? (
            /* ────────────────────────────────────────────────────────
               DESKTOP PREVIEW
               ──────────────────────────────────────────────────────── */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in">
              {/* Breadcrumb Simulation */}
              <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                <span>Home</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span>Shop</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="text-gray-700 font-bold">
                  {data.categoryName || "Catalog"}
                </span>
                {data.subcategoryName && (
                  <>
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="text-[#F26522] font-bold">
                      {data.subcategoryName}
                    </span>
                  </>
                )}
              </div>

              {/* Main Product Hero Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* Left: Gallery */}
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden shadow-xs flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImages[activeImageIndex] || displayImages[0]}
                      alt={data.name || "Product"}
                      className="w-full h-full object-cover transition-all"
                      onError={(e) => {
                        (e.target as any).src = "/placeholders/product.svg";
                      }}
                    />
                    {discount > 0 && (
                      <span className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-xs">
                        {discount}% OFF
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {displayImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {displayImages.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageIndex(idx)}
                          className={`relative w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                            activeImageIndex === idx
                              ? "border-[#F26522] shadow-xs"
                              : "border-gray-200 opacity-70 hover:opacity-100"
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as any).src = "/placeholders/product.svg";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Details & Buying Box */}
                <div className="space-y-4">
                  <div>
                    {data.brand && (
                      <span className="text-xs font-black uppercase tracking-wider text-[#F26522] bg-orange-50 px-2.5 py-1 rounded-lg inline-block mb-1.5">
                        {data.brand}
                      </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-snug">
                      {data.name || "Product Title Preview"}
                    </h1>
                    {data.modelNumber && (
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        Model / SKU: {data.modelNumber}
                      </p>
                    )}
                  </div>

                  {/* Rating & Stock */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                      <Star size={13} className="fill-amber-400 text-amber-500" />
                      <span>4.8 (Verified)</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      <span>In Stock • Ready to Dispatch</span>
                    </span>
                  </div>

                  {/* Price Box */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-gray-200 space-y-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-2xl sm:text-3xl font-black text-[#052a51] font-mono">
                        ₹{selling.toLocaleString("en-IN")}
                      </span>
                      {mrpVal > selling && (
                        <span className="text-sm text-gray-400 line-through font-mono">
                          MRP ₹{mrpVal.toLocaleString("en-IN")}
                        </span>
                      )}
                      {discount > 0 && (
                        <span className="text-xs font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                          Save ₹{(mrpVal - selling).toLocaleString("en-IN")} ({discount}% OFF)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Sold per <strong>{data.unitOfSale || "box"}</strong> • Inclusive of all GST taxes
                    </p>
                  </div>

                  {/* Colour & Attributes */}
                  {data.colour && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-xs font-bold text-gray-700 block">
                        Colour: <span className="text-gray-900 font-black">{data.colour}</span>
                      </label>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50/60 shadow-2xs">
                        <span className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-[#F26522]" />
                        <span className="text-xs font-bold text-gray-800">{data.colour}</span>
                      </div>
                    </div>
                  )}

                  {/* Surface Finish & Dimensions */}
                  {(data.finish || data.material) && (
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {data.finish && (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">
                          Finish: <strong>{data.finish}</strong>
                        </span>
                      )}
                      {data.material && (
                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">
                          Material: <strong>{data.material}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA Buttons Simulation */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl bg-[#052a51] hover:bg-[#07386d] text-white text-xs font-black transition-colors shadow-xs"
                    >
                      Add to Cart
                    </button>
                    <button
                      type="button"
                      className="w-full py-3 rounded-xl bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-black transition-colors shadow-xs"
                    >
                      Buy Now
                    </button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[11px] text-gray-600">
                    <div className="flex items-center gap-2">
                      <Truck size={14} className="text-[#F26522]" />
                      <span>Dispatch: ~{data.dispatchTimeDays || 2} Days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <RotateCcw size={14} className="text-[#F26522]" />
                      <span>{data.returnPolicyDays || 7} Days Return</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-[#F26522]" />
                      <span>{data.warrantyDuration || "1 Year"} Warranty</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BadgeCheck size={14} className="text-[#F26522]" />
                      <span>{data.allowCod ? "Cash on Delivery Available" : "Online Payment"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Highlights & Description */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">
                  Product Overview &amp; Specifications
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                  {data.description || "Detailed product description will appear here on the storefront."}
                </p>

                {/* Highlights List */}
                {data.highlights && data.highlights.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-800">Key Highlights:</span>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-600">
                      {data.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-[#F26522] mt-0.5 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Specs Table */}
                {(data.lengthCm || data.widthCm || data.material || data.colour) && (
                  <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-gray-100">
                        {data.material && (
                          <tr className="bg-gray-50/50">
                            <td className="p-2.5 font-bold text-gray-500 w-1/3">Material</td>
                            <td className="p-2.5 text-gray-900 font-medium">{data.material}</td>
                          </tr>
                        )}
                        {data.colour && (
                          <tr>
                            <td className="p-2.5 font-bold text-gray-500">Colour / Shade</td>
                            <td className="p-2.5 text-gray-900 font-medium">{data.colour}</td>
                          </tr>
                        )}
                        {(data.lengthCm || data.widthCm) && (
                          <tr className="bg-gray-50/50">
                            <td className="p-2.5 font-bold text-gray-500">Dimensions (L x W)</td>
                            <td className="p-2.5 text-gray-900 font-medium font-mono">
                              {data.lengthCm || 0} x {data.widthCm || 0} cm
                            </td>
                          </tr>
                        )}
                        {data.weightKg && (
                          <tr>
                            <td className="p-2.5 font-bold text-gray-500">Weight</td>
                            <td className="p-2.5 text-gray-900 font-medium font-mono">{data.weightKg} kg</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────
               MOBILE SMARTPHONE SIMULATION
               ──────────────────────────────────────────────────────── */
            <div className="w-[375px] max-w-full mx-auto bg-white rounded-3xl border-8 border-gray-900 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              {/* Mobile Phone Status Bar */}
              <div className="bg-gray-900 text-white px-5 py-2 flex items-center justify-between text-[11px] font-bold">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-white/80" />
                </div>
              </div>

              {/* Mobile Store Header */}
              <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between">
                <span className="text-xs font-black text-[#052a51]">IntriHub</span>
                <div className="flex items-center gap-2 text-gray-500">
                  <Share2 size={15} />
                  <Heart size={15} />
                </div>
              </div>

              {/* Mobile Scroll Content */}
              <div className="p-4 space-y-4 max-h-[580px] overflow-y-auto">
                {/* Image */}
                <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-200 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImages[activeImageIndex] || displayImages[0]}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = "/placeholders/product.svg";
                    }}
                  />
                  {discount > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                      {discount}% OFF
                    </span>
                  )}
                </div>

                {/* Title & Brand */}
                <div>
                  {data.brand && (
                    <span className="text-[10px] font-black text-[#F26522] uppercase tracking-wider block">
                      {data.brand}
                    </span>
                  )}
                  <h2 className="text-base font-black text-gray-900 leading-snug">
                    {data.name || "Product Title"}
                  </h2>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[#052a51] font-mono">
                    ₹{selling.toLocaleString("en-IN")}
                  </span>
                  {mrpVal > selling && (
                    <span className="text-xs text-gray-400 line-through font-mono">
                      ₹{mrpVal.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {/* Colour */}
                {data.colour && (
                  <div className="text-xs">
                    <span className="text-gray-500">Colour: </span>
                    <strong className="text-gray-900">{data.colour}</strong>
                  </div>
                )}

                {/* Mobile CTAs */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    className="py-2.5 rounded-xl bg-[#052a51] text-white text-xs font-bold"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="py-2.5 rounded-xl bg-[#F26522] text-white text-xs font-bold"
                  >
                    Buy Now
                  </button>
                </div>

                {/* Delivery */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-[11px] text-gray-600 space-y-1">
                  <p>🚚 Dispatch within {data.dispatchTimeDays || 2} days</p>
                  <p>🔄 {data.returnPolicyDays || 7} days return policy</p>
                  <p>🛡️ {data.warrantyDuration || "1 Year"} warranty</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-500 font-medium hidden sm:block">
            Preview is updated in real time as you fill out title, pricing, images, and colour.
          </p>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
