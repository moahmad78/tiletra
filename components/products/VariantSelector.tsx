"use client";

import React, { useMemo } from "react";
import { Check } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/data/products";
import { formatPrice, formatUnitLabel } from "@/lib/formatters";
import { resolveColour } from "@/lib/colours";

export interface VariantSelectorProps {
  product: Product;
  selectedVariant: ProductVariant;
  onSelectVariant: (variant: ProductVariant) => void;
  onSelectImage?: (imageUrl: string) => void;
}

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
    const rawColors: string[] = variants
      .map((v: ProductVariant) => v.color?.trim())
      .filter((c: string | undefined): c is string => Boolean(c && c !== "Standard" && c !== "default" && c !== "None"));

    const rawSizes: string[] = variants
      .map((v: ProductVariant) => (v.attributeValue || v.size)?.trim())
      .filter((s: string | undefined): s is string => Boolean(s && s !== "Standard" && s !== "default" && s !== "None"));

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
    const currentSize = selectedVariant.attributeValue || selectedVariant.size;
    const match = variants.find(
      (v: ProductVariant) =>
        v.color?.toLowerCase().trim() === colorName.toLowerCase().trim() &&
        (v.attributeValue || v.size)?.toLowerCase().trim() === currentSize?.toLowerCase().trim()
    );

    if (match) {
      onSelectVariant(match);
      if (match.image && onSelectImage) onSelectImage(match.image);
      return;
    }

    const fallback = variants.find(
      (v: ProductVariant) => v.color?.toLowerCase().trim() === colorName.toLowerCase().trim()
    );
    if (fallback) {
      onSelectVariant(fallback);
      if (fallback.image && onSelectImage) onSelectImage(fallback.image);
    }
  };

  // Handler when selecting a size / volume in a multi-dimensional product
  const handleSizeClick = (sizeValue: string) => {
    const currentColor = selectedVariant.color;
    const match = variants.find(
      (v: ProductVariant) =>
        (v.attributeValue || v.size)?.toLowerCase().trim() === sizeValue.toLowerCase().trim() &&
        v.color?.toLowerCase().trim() === currentColor?.toLowerCase().trim()
    );

    if (match) {
      onSelectVariant(match);
      if (match.image && onSelectImage) onSelectImage(match.image);
      return;
    }

    const fallback = variants.find(
      (v: ProductVariant) => (v.attributeValue || v.size)?.toLowerCase().trim() === sizeValue.toLowerCase().trim()
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

  // Determine attribute type label
  const primaryAttributeLabel = useMemo(() => {
    const firstCustomLabel = variants.find((v: ProductVariant) => v.attributeLabel)?.attributeLabel;
    if (firstCustomLabel) return firstCustomLabel;

    const unit = product.unitOfSale?.toLowerCase() || "";
    const cat = product.categorySlug?.toLowerCase() || "";

    if (unit === "litre" || unit === "liter" || unit === "can" || cat.includes("paint")) {
      return "Volume / Pack Size";
    }
    if (unit === "sheet" || unit === "piece" || cat.includes("plywood") || cat.includes("door") || cat.includes("glass")) {
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
      {/* ── CASE A: MULTI-DIMENSIONAL COMBINATION (Color AND Size) ── */}
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
              {distinctColors.map((col: string) => {
                const isSelected = selectedVariant.color?.toLowerCase().trim() === col.toLowerCase().trim();
                const colorKey = col.toLowerCase().trim();
                const repVariant = variants.find((v: ProductVariant) => v.color?.toLowerCase().trim() === colorKey);
                const resolved = resolveColour(col);
                const hex = repVariant?.colorHex || resolved.hexCode;
                const isLight = resolved.textColor === "dark";
                const isOutOfStock = repVariant ? repVariant.stockBoxes <= 0 : false;
                const swatchTexture = repVariant?.swatchImage || (resolved as any).swatchImage;

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
                      {swatchTexture ? (
                        <img src={swatchTexture} alt={col} className="w-full h-full object-cover" />
                      ) : repVariant?.image ? (
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
            </div>

            <div className="flex flex-wrap gap-2">
              {distinctSizes.map((sz: string) => {
                const currentSize = selectedVariant.attributeValue || selectedVariant.size;
                const isSelected = currentSize?.toLowerCase().trim() === sz.toLowerCase().trim();

                const matchingForPrice =
                  variants.find(
                    (v: ProductVariant) =>
                      (v.attributeValue || v.size)?.toLowerCase().trim() === sz.toLowerCase().trim() &&
                      v.color?.toLowerCase().trim() === selectedVariant.color?.toLowerCase().trim()
                  ) ||
                  variants.find(
                    (v: ProductVariant) => (v.attributeValue || v.size)?.toLowerCase().trim() === sz.toLowerCase().trim()
                  );

                const isOutOfStock = matchingForPrice ? matchingForPrice.stockBoxes <= 0 : false;

                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSizeClick(sz)}
                    className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "border-[#052a51] bg-[#052a51] text-white shadow-xs"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    } ${isOutOfStock ? "opacity-60" : ""}`}
                  >
                    <span className="text-xs font-bold">{sz}</span>

                    {matchingForPrice && matchingForPrice.pricePerBox !== selectedVariant.pricePerBox && (
                      <span
                        className={`text-[10px] font-semibold ${
                          isSelected ? "text-orange-300" : "text-gray-400"
                        }`}
                      >
                        {formatPrice(matchingForPrice.pricePerBox)}
                      </span>
                    )}
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
            {variants.map((v: ProductVariant) => {
              const isSelected = selectedVariant.id === v.id;
              const resolved = resolveColour(v.color);
              const hex = v.colorHex || resolved.hexCode;
              const isLight = resolved.textColor === "dark";
              const isOutOfStock = v.stockBoxes <= 0;
              const swatchTexture = v.swatchImage || (resolved as any).swatchImage;

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
                    {swatchTexture ? (
                      <img src={swatchTexture} alt={v.color} className="w-full h-full object-cover" />
                    ) : v.image ? (
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
            {variants.map((v: ProductVariant) => {
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
                      ? "border-[#052a51] bg-[#052a51] text-white shadow-xs"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  } ${isOutOfStock ? "opacity-60" : ""}`}
                >
                  <span className="text-xs font-bold">{displayVal}</span>

                  {v.pricePerBox !== selectedVariant.pricePerBox && (
                    <span
                      className={`text-[10px] font-semibold ${
                        isSelected ? "text-orange-300" : "text-gray-400"
                      }`}
                    >
                      {formatPrice(v.pricePerBox)}
                    </span>
                  )}

                  {isOutOfStock && (
                    <span className="text-[9px] font-black uppercase text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                      Out of stock
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
