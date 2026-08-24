"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { Check, AlertCircle } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/data/products";
import { formatPrice, formatUnitLabel } from "@/lib/formatters";

interface VariantSelectorProps {
  product: Product;
  selectedVariant: ProductVariant;
  onSelectVariant: (variant: ProductVariant) => void;
  onSelectImage?: (imageUrl: string) => void;
}

// Map common color names to CSS color hex codes for swatch rendering
const COLOR_HEX_MAP: Record<string, string> = {
  white: "#FFFFFF",
  "ivory white": "#FFFFF0",
  "pearl white": "#F8F8FF",
  offwhite: "#FAF9F6",
  "off white": "#FAF9F6",
  black: "#1A1A1A",
  "matte black": "#222222",
  "glossy black": "#000000",
  grey: "#808080",
  gray: "#808080",
  "dark grey": "#404040",
  "light grey": "#D3D3D3",
  "charcoal grey": "#36454F",
  charcoal: "#36454F",
  beige: "#F5F5DC",
  cream: "#FFFDD0",
  brown: "#8B4513",
  "teak brown": "#654321",
  teak: "#654321",
  "walnut brown": "#4A3319",
  walnut: "#4A3319",
  terracotta: "#E2725B",
  blue: "#1E88E5",
  "royal blue": "#4169E1",
  "sky blue": "#87CEEB",
  navy: "#000080",
  "navy blue": "#000080",
  green: "#43A047",
  "emerald green": "#50C878",
  "mint green": "#98FF98",
  yellow: "#FDD835",
  gold: "#FFD700",
  golden: "#FFD700",
  red: "#E53935",
  maroon: "#800000",
  orange: "#FB8C00",
  silver: "#C0C0C0",
  bronze: "#CD7F32",
  copper: "#B87333",
  standard: "#E2E8F0",
};

export default function VariantSelector({
  product,
  selectedVariant,
  onSelectVariant,
  onSelectImage,
}: VariantSelectorProps) {
  const variants = product.variants || [];

  if (variants.length <= 1) {
    return null;
  }

  // 1. Group & analyze variants
  const { distinctColors, distinctSizes, isMultiDimensional, hasColors, hasSizes } = useMemo(() => {
    const rawColors = variants
      .map((v) => v.color?.trim())
      .filter((c): c is string => Boolean(c && c !== "Standard" && c !== "default" && c !== "None"));

    const rawSizes = variants
      .map((v) => (v.attributeValue || v.size)?.trim())
      .filter((s): s is string => Boolean(s && s !== "Standard" && s !== "default" && s !== "None"));

    const colors = Array.from(new Set(rawColors));
    const sizes = Array.from(new Set(rawSizes));

    const multi = colors.length > 1 && sizes.length > 1;

    return {
      distinctColors: colors,
      distinctSizes: sizes,
      isMultiDimensional: multi,
      hasColors: colors.length > 1,
      hasSizes: sizes.length > 1 || (!colors.length && variants.length > 1),
    };
  }, [variants]);

  // Handler when selecting a color in a multi-dimensional product
  const handleColorClick = (colorName: string) => {
    // 1. Try to find variant with matching color AND current selected size
    const currentSize = selectedVariant.attributeValue || selectedVariant.size;
    const match = variants.find(
      (v) =>
        v.color?.toLowerCase().trim() === colorName.toLowerCase().trim() &&
        (v.attributeValue || v.size)?.toLowerCase().trim() === currentSize?.toLowerCase().trim()
    );

    if (match) {
      onSelectVariant(match);
      if (match.image && onSelectImage) onSelectImage(match.image);
      return;
    }

    // 2. Fallback: first variant with that color
    const fallback = variants.find(
      (v) => v.color?.toLowerCase().trim() === colorName.toLowerCase().trim()
    );
    if (fallback) {
      onSelectVariant(fallback);
      if (fallback.image && onSelectImage) onSelectImage(fallback.image);
    }
  };

  // Handler when selecting a size / volume in a multi-dimensional product
  const handleSizeClick = (sizeValue: string) => {
    // 1. Try to find variant with matching size AND current selected color
    const currentColor = selectedVariant.color;
    const match = variants.find(
      (v) =>
        (v.attributeValue || v.size)?.toLowerCase().trim() === sizeValue.toLowerCase().trim() &&
        v.color?.toLowerCase().trim() === currentColor?.toLowerCase().trim()
    );

    if (match) {
      onSelectVariant(match);
      if (match.image && onSelectImage) onSelectImage(match.image);
      return;
    }

    // 2. Fallback: first variant with that size
    const fallback = variants.find(
      (v) => (v.attributeValue || v.size)?.toLowerCase().trim() === sizeValue.toLowerCase().trim()
    );
    if (fallback) {
      onSelectVariant(fallback);
      if (fallback.image && onSelectImage) onSelectImage(fallback.image);
    }
  };

  // Handler for direct 1D variant click
  const handleDirectVariantClick = (v: ProductVariant) => {
    onSelectVariant(v);
    if (v.image && onSelectImage) {
      onSelectImage(v.image);
    }
  };

  // Determine attribute type label (e.g. Volume / Litres, Dimension, Size, Thickness, Color)
  const primaryAttributeLabel = useMemo(() => {
    const firstCustomLabel = variants.find((v) => v.attributeLabel)?.attributeLabel;
    if (firstCustomLabel) return firstCustomLabel;

    const unit = product.unitOfSale?.toLowerCase() || "";
    const cat = product.categorySlug?.toLowerCase() || "";

    if (unit === "litre" || unit === "liter" || unit === "can" || cat.includes("paint")) {
      return "Volume / Pack Size";
    }
    if (unit === "piece" || cat.includes("plywood") || cat.includes("door") || cat.includes("glass")) {
      return "Dimension & Thickness";
    }
    if (unit === "coil" || unit === "meter" || cat.includes("electrical") || cat.includes("pipe")) {
      return "Size & Rating";
    }
    if (unit === "pack" || unit === "box" || cat.includes("hardware")) {
      return "Pack Option";
    }
    if (cat.includes("tile") || cat.includes("stone") || unit === "sqft") {
      return "Tile Dimensions";
    }
    return "Options / Variants";
  }, [variants, product.unitOfSale, product.categorySlug]);

  return (
    <div className="space-y-4 pt-1">
      {/* ── CASE A: MULTI-DIMENSIONAL COMBINATION (e.g. Color AND Volume) ── */}
      {isMultiDimensional ? (
        <>
          {/* 1. Color Swatches Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1.5">
                <span>Color:</span>
                <span className="text-[#F26522] normal-case font-bold">{selectedVariant.color}</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {distinctColors.map((col) => {
                const isSelected = selectedVariant.color?.toLowerCase().trim() === col.toLowerCase().trim();
                const colorKey = col.toLowerCase().trim();
                const hex = COLOR_HEX_MAP[colorKey] || "#CBD5E1";
                const isLight = ["white", "ivory white", "pearl white", "offwhite", "off white", "cream", "yellow"].includes(colorKey);
                
                // Representative variant for image/stock
                const repVariant = variants.find((v) => v.color?.toLowerCase().trim() === colorKey);
                const isOutOfStock = repVariant ? repVariant.stockBoxes <= 0 : false;

                return (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleColorClick(col)}
                    className={`group relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#F26522] bg-orange-50/60 shadow-xs ring-2 ring-orange-200"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    } ${isOutOfStock ? "opacity-60" : ""}`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/15 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden relative"
                      style={{ backgroundColor: hex }}
                    >
                      {repVariant?.image ? (
                        <img src={repVariant.image} alt={col} className="w-full h-full object-cover" />
                      ) : null}
                      {isSelected && (
                        <Check size={11} className={isLight ? "text-gray-900" : "text-white"} strokeWidth={3} />
                      )}
                    </span>

                    <span className="text-xs font-bold text-[#052a51]">{col}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Volume / Dimension Chips Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1.5">
                <span>{primaryAttributeLabel}:</span>
                <span className="text-[#F26522] normal-case font-bold">
                  {selectedVariant.attributeValue || selectedVariant.size}
                </span>
              </label>
              <span className="text-[11px] text-gray-400 font-medium">
                Price updates dynamically
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {distinctSizes.map((sz) => {
                const currentVal = selectedVariant.attributeValue || selectedVariant.size;
                const isSelected = currentVal?.toLowerCase().trim() === sz.toLowerCase().trim();

                // Find variant matching current color + this size to show its price
                const matchingVariant = variants.find(
                  (v) =>
                    (v.attributeValue || v.size)?.toLowerCase().trim() === sz.toLowerCase().trim() &&
                    v.color?.toLowerCase().trim() === selectedVariant.color?.toLowerCase().trim()
                ) || variants.find((v) => (v.attributeValue || v.size)?.toLowerCase().trim() === sz.toLowerCase().trim());

                const price = matchingVariant?.pricePerBox || selectedVariant.pricePerBox;
                const isOutOfStock = matchingVariant ? matchingVariant.stockBoxes <= 0 : false;

                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeClick(sz)}
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "border-[#F26522] bg-[#F26522]/10 text-[#052a51] shadow-xs ring-2 ring-[#F26522]/20 font-black"
                        : "border-gray-200 hover:border-gray-300 bg-white text-[#052a51] font-bold"
                    } ${isOutOfStock ? "opacity-50 line-through" : ""}`}
                  >
                    {matchingVariant?.image && (
                      <img
                        src={matchingVariant.image}
                        alt={sz}
                        className="w-5 h-5 rounded-md object-cover border border-gray-200"
                      />
                    )}

                    <span className="text-xs">{sz}</span>

                    <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                      isSelected ? "bg-[#F26522] text-white font-black" : "bg-gray-100 text-gray-600 font-semibold"
                    }`}>
                      {formatPrice(price)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : hasColors && !hasSizes ? (
        /* ── CASE B: COLOR-ONLY VARIANTS ── */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1.5">
              <span>Color:</span>
              <span className="text-[#F26522] normal-case font-bold">{selectedVariant.color}</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {variants.map((v) => {
              const isSelected = selectedVariant.id === v.id;
              const colorKey = (v.color || "").toLowerCase().trim();
              const hex = COLOR_HEX_MAP[colorKey] || "#CBD5E1";
              const isLight = ["white", "ivory white", "pearl white", "offwhite", "off white", "cream", "yellow"].includes(colorKey);
              const isOutOfStock = v.stockBoxes <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleDirectVariantClick(v)}
                  className={`group relative flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#F26522] bg-orange-50/60 shadow-xs ring-2 ring-orange-200"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  } ${isOutOfStock ? "opacity-60" : ""}`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-black/15 shadow-2xs flex items-center justify-center shrink-0 overflow-hidden relative"
                    style={{ backgroundColor: hex }}
                  >
                    {v.image ? (
                      <img src={v.image} alt={v.color} className="w-full h-full object-cover" />
                    ) : null}
                    {isSelected && (
                      <Check size={11} className={isLight ? "text-gray-900" : "text-white"} strokeWidth={3} />
                    )}
                  </span>

                  <span className="text-xs font-bold text-[#052a51]">{v.color}</span>

                  {v.pricePerBox !== selectedVariant.pricePerBox && (
                    <span className="text-[10px] text-gray-500 font-semibold">
                      ({formatPrice(v.pricePerBox)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── CASE C: SIZE / VOLUME / DIMENSION CHIPS (Default) ── */
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1.5">
              <span>{primaryAttributeLabel}:</span>
              <span className="text-[#F26522] normal-case font-bold">
                {selectedVariant.attributeValue || selectedVariant.size}
              </span>
            </label>
            <span className="text-[11px] text-gray-400 font-medium">
              Price updates dynamically
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {variants.map((v) => {
              const displayVal = v.attributeValue || v.size;
              const isSelected = selectedVariant.id === v.id;
              const isOutOfStock = v.stockBoxes <= 0;

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleDirectVariantClick(v)}
                  className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? "border-[#F26522] bg-[#F26522]/10 text-[#052a51] shadow-xs ring-2 ring-[#F26522]/20 font-black"
                      : "border-gray-200 hover:border-gray-300 bg-white text-[#052a51] font-bold"
                  } ${isOutOfStock ? "opacity-50 line-through" : ""}`}
                >
                  {v.image && (
                    <img
                      src={v.image}
                      alt={displayVal}
                      className="w-5 h-5 rounded-md object-cover border border-gray-200"
                    />
                  )}

                  <span className="text-xs">{displayVal}</span>

                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    isSelected ? "bg-[#F26522] text-white font-black" : "bg-gray-100 text-gray-600 font-semibold"
                  }`}>
                    {formatPrice(v.pricePerBox)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
