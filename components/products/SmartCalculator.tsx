"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  Paintbrush,
  Zap,
  Layers,
  Check,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import type { Product, ProductVariant } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";
import { formatPrice, formatUnitName } from "@/lib/formatters";

interface SmartCalculatorProps {
  product: Product;
  selectedVariant: ProductVariant;
  category?: Category | null;
  onApplyQuantity: (qty: number, matchedVariant?: ProductVariant) => void;
}

export default function SmartCalculator({
  product,
  selectedVariant,
  category,
  onApplyQuantity,
}: SmartCalculatorProps) {
  const unitOfSale = (product.unitOfSale || "box").toLowerCase().trim();

  // 1. Coverage Rate Resolution (Product field -> Variant fallback -> Direct sqft)
  const effectiveCoverageRate = useMemo(() => {
    if (product.coverageRate && product.coverageRate > 0) {
      return product.coverageRate;
    }

    if (unitOfSale === "sqft") {
      return 1; // 1:1 direct sq.ft
    }

    // Fallback for existing/legacy box-based products (e.g. Tiles)
    if (unitOfSale === "box" && selectedVariant.sqftPerBox && selectedVariant.sqftPerBox > 0) {
      return selectedVariant.sqftPerBox;
    }

    return null;
  }, [product.coverageRate, selectedVariant.sqftPerBox, unitOfSale]);

  // 2. Determine input requirement: Length vs Area vs None
  const inputType = useMemo<"area" | "length" | "none">(() => {
    // If explicitly set at category level
    if (category?.calculatorInputType === "length") return "length";
    if (category?.calculatorInputType === "none") return "none";
    if (category?.calculatorInputType === "area") return "area";

    // Inferred from unit of sale
    if (
      unitOfSale === "meter" ||
      unitOfSale === "coil" ||
      unitOfSale === "running_meter" ||
      unitOfSale === "foot" ||
      unitOfSale === "feet" ||
      unitOfSale === "yard" ||
      unitOfSale === "m"
    ) {
      return "length";
    }

    return "area";
  }, [category?.calculatorInputType, unitOfSale]);

  // Wastage / Cutting Buffer (Default 10%)
  const wastageFactor = product.wastageFactor && product.wastageFactor > 0 ? product.wastageFactor : 1.1;
  const wastagePercent = Math.round((wastageFactor - 1) * 100);

  // State inputs
  const [areaInput, setAreaInput] = useState<string>("");
  const [coatsInput, setCoatsInput] = useState<number>(2);
  const [lengthInput, setLengthInput] = useState<string>("");
  const [applied, setApplied] = useState(false);

  // If calculator is disabled or no valid coverage rate, return null
  if (inputType === "none" || !effectiveCoverageRate || effectiveCoverageRate <= 0) {
    return null;
  }

  // ── Calculation Logic ──
  const isLengthBased = inputType === "length";
  const isVolumeBased = unitOfSale === "litre" || unitOfSale === "can" || unitOfSale === "bucket";
  const isDirectSqft = unitOfSale === "sqft";
  const isBoxBased = unitOfSale === "box";

  const areaNum = parseFloat(areaInput) || 0;
  const lengthNum = parseFloat(lengthInput) || 0;

  // Multi-coat total gross area for paint/finishes
  const grossAreaSqft = isVolumeBased
    ? areaNum * coatsInput * wastageFactor
    : areaNum * wastageFactor;

  // Safe ceiling to prevent IEEE 754 float precision rounding errors (e.g. 100 * 1.1 = 110.00000000000001)
  const safeCeil = (val: number) => Math.ceil(Math.round(val * 10000) / 10000);

  // Units Needed Calculation
  let unitsNeeded = 0;
  let piecesNeeded: number | null = null;
  let totalCoverageCalculated = 0;

  if (isLengthBased) {
    const grossLength = lengthNum * wastageFactor;
    unitsNeeded = lengthNum > 0 ? Math.max(1, safeCeil(grossLength / effectiveCoverageRate)) : 0;
    totalCoverageCalculated = unitsNeeded * effectiveCoverageRate;
  } else if (isDirectSqft) {
    unitsNeeded = areaNum > 0 ? Math.max(1, safeCeil(grossAreaSqft)) : 0;
    totalCoverageCalculated = unitsNeeded;
  } else {
    // Area-based (box, kg, roll, sheet, litre, etc.)
    unitsNeeded = areaNum > 0 ? Math.max(1, safeCeil(grossAreaSqft / effectiveCoverageRate)) : 0;
    totalCoverageCalculated = unitsNeeded * effectiveCoverageRate;

    // Tiles-specific: Pieces per Box Calculation
    const piecesPerBoxVal = product.piecesPerBox || (selectedVariant as any).piecesPerBox;
    if (isBoxBased && piecesPerBoxVal && piecesPerBoxVal > 0 && areaNum > 0) {
      // Precise piece-level calculation
      const sqftPerPiece = effectiveCoverageRate / piecesPerBoxVal;
      piecesNeeded = safeCeil(grossAreaSqft / sqftPerPiece);
    }
  }

  const unitPrice = selectedVariant.pricePerBox || selectedVariant.pricePerSqft || 0;
  const totalCost = unitsNeeded * unitPrice;

  // Real-world paint variant matching (if multi-size cans available)
  const availableLitreVariants = useMemo(() => {
    if (!isVolumeBased) return [];
    return (product.variants || [])
      .map((v) => {
        const match = (v.attributeValue || v.size).match(/(\d+(\.\d+)?)\s*(l|litre|liter|can|kg)/i);
        const litres = match ? parseFloat(match[1]) : null;
        return { variant: v, litres };
      })
      .filter((item): item is { variant: ProductVariant; litres: number } => item.litres !== null && item.litres > 0)
      .sort((a, b) => a.litres - b.litres);
  }, [isVolumeBased, product.variants]);

  // Suggested Pack Combination for Paint
  const suggestedPackCombination = useMemo(() => {
    if (!isVolumeBased || unitsNeeded <= 0 || availableLitreVariants.length === 0) return null;

    let remaining = unitsNeeded;
    const combination: { variant: ProductVariant; count: number; litres: number }[] = [];
    const sorted = [...availableLitreVariants].sort((a, b) => b.litres - a.litres);

    for (const item of sorted) {
      if (remaining >= item.litres) {
        const count = Math.floor(remaining / item.litres);
        combination.push({ variant: item.variant, count, litres: item.litres });
        remaining -= count * item.litres;
      }
    }

    if (remaining > 0) {
      const smallest = availableLitreVariants.find((v) => v.litres >= remaining) || sorted[sorted.length - 1];
      const existing = combination.find((c) => c.variant.id === smallest.variant.id);
      if (existing) {
        existing.count += 1;
      } else {
        combination.push({ variant: smallest.variant, count: 1, litres: smallest.litres });
      }
    }

    const totalLitresProvided = combination.reduce((acc, c) => acc + c.count * c.litres, 0);
    const combinationCost = combination.reduce((acc, c) => acc + c.count * (c.variant.pricePerBox || 0), 0);

    return {
      combination,
      totalLitresProvided,
      totalCost: combinationCost,
    };
  }, [isVolumeBased, unitsNeeded, availableLitreVariants]);

  // Apply to cart/quantity handler
  const handleApply = () => {
    if (unitsNeeded <= 0) return;

    if (suggestedPackCombination && suggestedPackCombination.combination.length > 0) {
      const primary = suggestedPackCombination.combination[0];
      onApplyQuantity(primary.count, primary.variant);
    } else {
      onApplyQuantity(unitsNeeded);
    }

    setApplied(true);
    setTimeout(() => setApplied(false), 2200);
  };

  const formattedUnit = formatUnitName(unitOfSale);
  const pluralUnit =
    unitsNeeded === 1
      ? formattedUnit
      : unitOfSale === "box"
      ? "Boxes"
      : unitOfSale === "sqft"
      ? "sq.ft"
      : unitOfSale === "kg"
      ? "kg"
      : unitOfSale === "litre"
      ? "Litres"
      : `${formattedUnit}s`;

  return (
    <div className="bg-gradient-to-br from-[#052a51]/5 via-[#F8F9FA] to-orange-50/40 rounded-2xl p-4 sm:p-5 border border-[#052a51]/10 space-y-4 shadow-2xs">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#052a51] text-white flex items-center justify-center shadow-xs">
            {isVolumeBased ? (
              <Paintbrush size={14} className="text-[#F26522]" />
            ) : isLengthBased ? (
              <Zap size={14} className="text-[#F26522]" />
            ) : (
              <Calculator size={14} className="text-[#F26522]" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#052a51]">
              {isVolumeBased
                ? "Paint & Surface Estimator"
                : isLengthBased
                ? "Length & Wiring Estimator"
                : isDirectSqft
                ? "Area Requirement Calculator"
                : "Coverage & Quantity Calculator"}
            </h3>
            <p className="text-[10px] text-gray-500">
              {wastagePercent > 0
                ? `Includes +${wastagePercent}% standard cutting & application buffer`
                : "Real-time automated estimation"}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#052a51]/10 text-[#052a51] uppercase tracking-wider">
          Smart Estimator
        </span>
      </div>

      {/* ── Input Controls ── */}
      {isLengthBased ? (
        /* Length Input */
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={lengthInput}
              onChange={(e) => setLengthInput(e.target.value)}
              placeholder="Enter required length in meters"
              className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              min={1}
            />
            <span className="flex items-center px-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
              Meters
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-gray-400 font-medium">Quick presets:</span>
            {[
              { label: "1 BHK (~180m)", val: "180" },
              { label: "2 BHK (~360m)", val: "360" },
              { label: "3 BHK (~540m)", val: "540" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setLengthInput(preset.val)}
                className="px-2 py-1 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold cursor-pointer text-[10px]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Area Input (with optional coats for paints) */
        <div className="space-y-3">
          <div className={isVolumeBased ? "grid grid-cols-1 sm:grid-cols-3 gap-2" : "flex gap-2"}>
            <div className={isVolumeBased ? "sm:col-span-2 flex gap-2" : "relative flex-1 flex gap-2"}>
              <input
                type="number"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="Enter floor / wall area in sq.ft"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={1}
              />
              <span className="flex items-center px-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 shrink-0">
                sq.ft
              </span>
            </div>

            {isVolumeBased && (
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2">
                <span className="text-[11px] font-bold text-gray-600">Coats:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoatsInput(c)}
                      className={`w-6 h-6 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        coatsInput === c
                          ? "bg-[#F26522] text-white"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-gray-400 font-medium">Quick sizes:</span>
            {[
              { label: "100 sq.ft (Bath)", val: "100" },
              { label: "180 sq.ft (Bed)", val: "180" },
              { label: "350 sq.ft (Living / 1 Room)", val: "350" },
              { label: "1,200 sq.ft (2 BHK)", val: "1200" },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setAreaInput(preset.val)}
                className="px-2 py-1 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold cursor-pointer text-[10px]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Calculation Results & Action Button ── */}
      {unitsNeeded > 0 && (
        <div className="p-3.5 bg-white rounded-xl border border-gray-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">
              Requirement for {isLengthBased ? `${lengthNum} meters` : `${areaNum} sq.ft`}
              {isVolumeBased ? ` (${coatsInput} coats)` : ""} (+{wastagePercent}% buffer):
            </span>
            <span className="font-black text-[#F26522] text-sm">
              {unitsNeeded} {pluralUnit}
              {piecesNeeded !== null ? (
                <span className="text-xs font-bold text-gray-500 ml-1">
                  ({piecesNeeded} pieces)
                </span>
              ) : null}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-100">
            <span>
              {isDirectSqft
                ? `Total: ${unitsNeeded} sq.ft`
                : isLengthBased
                ? `Total length covered: ~${totalCoverageCalculated} meters`
                : `Total area covered: ~${totalCoverageCalculated.toFixed(0)} sq.ft`}
            </span>
            {totalCost > 0 && (
              <span className="font-bold text-[#052a51]">Total: {formatPrice(totalCost)}</span>
            )}
          </div>

          {/* Recommended Pack Combination for Paint / Multi-Pack Items */}
          {suggestedPackCombination && (
            <div className="bg-orange-50/70 p-2.5 rounded-lg border border-orange-200/60 space-y-1">
              <span className="text-[10px] font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-[#F26522]" />
                <span>Recommended Pack Combination:</span>
              </span>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {suggestedPackCombination.combination.map((c, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-white rounded-md border border-orange-200 text-xs font-bold text-[#052a51]"
                  >
                    {c.count} × {c.variant.attributeValue || c.variant.size}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApply}
            className={`w-full mt-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              applied
                ? "bg-[#2F7A4F] text-white"
                : "bg-[#052a51] hover:bg-[#041f3d] text-white shadow-xs active:scale-98"
            }`}
          >
            {applied ? (
              <>
                <Check size={14} />
                <span>Applied to Quantity!</span>
              </>
            ) : (
              <>
                <span>Set Quantity to {unitsNeeded} {pluralUnit}</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
