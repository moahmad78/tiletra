"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  Paintbrush,
  Zap,
  Layers,
  Check,
  Sparkles,
  Info,
  ArrowRight,
  Package,
} from "lucide-react";
import type { Product, ProductVariant } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";
import { formatPrice } from "@/lib/formatters";

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
  // Determine calculator type - strictly restricted to Tiles & Stone / Granite
  const calculatorType = useMemo(() => {
    const slug = (product.categorySlug || "").toLowerCase();
    const isTileStoneOrGranite =
      slug.includes("tile") ||
      slug.includes("stone") ||
      slug.includes("granite") ||
      slug.includes("marble");

    // If not tiles, stone, or granite, strictly disable calculator
    if (!isTileStoneOrGranite) {
      return "none";
    }

    if (category?.calculatorType && category.calculatorType !== "none") {
      return category.calculatorType;
    }

    return "area_to_boxes";
  }, [category, product.categorySlug]);

  // Determine coverage rate per unit / litre / coil
  const effectiveCoverageRate = useMemo(() => {
    if (product.coverageRate && product.coverageRate > 0) {
      return product.coverageRate;
    }

    // Fallbacks based on variants / domain standards
    if (calculatorType === "area_to_boxes") {
      if (selectedVariant.sqftPerBox && selectedVariant.sqftPerBox > 0) {
        return selectedVariant.sqftPerBox;
      }
      return 16; // Standard 16 sqft / box fallback
    }

    if (calculatorType === "area_to_volume") {
      return 120; // 120 sq.ft per litre per coat (standard emulsion)
    }

    if (calculatorType === "length_to_units") {
      // Check if variant size says e.g. "90m"
      const match = selectedVariant.size.match(/(\d+)\s*m/i);
      if (match) return parseInt(match[1], 10);
      return 90; // Standard 90 meter coil
    }

    return null;
  }, [product.coverageRate, selectedVariant, calculatorType]);

  const wastageFactor = product.wastageFactor || 1.1; // Default 10% buffer

  // State inputs
  const [areaInput, setAreaInput] = useState<string>("");
  const [coatsInput, setCoatsInput] = useState<number>(2);
  const [lengthInput, setLengthInput] = useState<string>("");
  const [applied, setApplied] = useState(false);

  // If no calculator type or coverage rate, graceful return
  if (calculatorType === "none" || !effectiveCoverageRate) {
    return null;
  }

  // ── 1. Calculation: Area → Boxes (Tiles, Stone, Wallpaper) ──
  const areaNum = parseFloat(areaInput) || 0;
  const boxesNeeded = areaNum > 0
    ? Math.max(1, Math.ceil((areaNum * wastageFactor) / effectiveCoverageRate))
    : 0;
  const totalAreaCovered = boxesNeeded * effectiveCoverageRate;
  const totalCostBoxes = boxesNeeded * selectedVariant.pricePerBox;

  // ── 2. Calculation: Area → Volume (Paint & Finishes) ──
  const paintAreaNum = parseFloat(areaInput) || 0;
  const totalGrossSqft = paintAreaNum * coatsInput * wastageFactor;
  const rawLitresNeeded = paintAreaNum > 0
    ? Math.ceil(totalGrossSqft / effectiveCoverageRate)
    : 0;

  // Real-world paint variant matching
  const availableLitreVariants = useMemo(() => {
    return (product.variants || [])
      .map((v) => {
        const match = (v.attributeValue || v.size).match(/(\d+(\.\d+)?)\s*(l|litre|liter|can)/i);
        const litres = match ? parseFloat(match[1]) : null;
        return { variant: v, litres };
      })
      .filter((item): item is { variant: ProductVariant; litres: number } => item.litres !== null && item.litres > 0)
      .sort((a, b) => a.litres - b.litres);
  }, [product.variants]);

  // Suggest combination of cans (e.g. 10L, 4L, 1L)
  const suggestedPackCombination = useMemo(() => {
    if (rawLitresNeeded <= 0 || availableLitreVariants.length === 0) return null;

    let remaining = rawLitresNeeded;
    const combination: { variant: ProductVariant; count: number; litres: number }[] = [];

    // Greedy largest to smallest
    const sorted = [...availableLitreVariants].sort((a, b) => b.litres - a.litres);

    for (const item of sorted) {
      if (remaining >= item.litres) {
        const count = Math.floor(remaining / item.litres);
        combination.push({ variant: item.variant, count, litres: item.litres });
        remaining -= count * item.litres;
      }
    }

    if (remaining > 0) {
      // Pick smallest available can that covers the remainder
      const smallest = availableLitreVariants.find((v) => v.litres >= remaining) || sorted[sorted.length - 1];
      const existing = combination.find((c) => c.variant.id === smallest.variant.id);
      if (existing) {
        existing.count += 1;
      } else {
        combination.push({ variant: smallest.variant, count: 1, litres: smallest.litres });
      }
    }

    const totalLitresProvided = combination.reduce((acc, c) => acc + c.count * c.litres, 0);
    const totalCost = combination.reduce((acc, c) => acc + c.count * c.variant.pricePerBox, 0);

    return {
      combination,
      totalLitresProvided,
      totalCost,
    };
  }, [rawLitresNeeded, availableLitreVariants]);

  // ── 3. Calculation: Length → Units (Wires, Cables, Pipes) ──
  const lengthNum = parseFloat(lengthInput) || 0;
  const coilsNeeded = lengthNum > 0
    ? Math.max(1, Math.ceil((lengthNum * wastageFactor) / effectiveCoverageRate))
    : 0;
  const totalLengthCovered = coilsNeeded * effectiveCoverageRate;
  const totalCostCoils = coilsNeeded * selectedVariant.pricePerBox;

  // Handle Apply button
  const handleApply = () => {
    if (calculatorType === "area_to_boxes" && boxesNeeded > 0) {
      onApplyQuantity(boxesNeeded);
      setApplied(true);
      setTimeout(() => setApplied(false), 2200);
    } else if (calculatorType === "area_to_volume") {
      if (suggestedPackCombination && suggestedPackCombination.combination.length > 0) {
        // Pick primary variant
        const primary = suggestedPackCombination.combination[0];
        onApplyQuantity(primary.count, primary.variant);
      } else if (rawLitresNeeded > 0) {
        onApplyQuantity(rawLitresNeeded);
      }
      setApplied(true);
      setTimeout(() => setApplied(false), 2200);
    } else if (calculatorType === "length_to_units" && coilsNeeded > 0) {
      onApplyQuantity(coilsNeeded);
      setApplied(true);
      setTimeout(() => setApplied(false), 2200);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#052a51]/5 via-[#F8F9FA] to-orange-50/40 rounded-2xl p-4 sm:p-5 border border-[#052a51]/10 space-y-4 shadow-2xs">
      {/* ── Calculator Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#052a51] text-white flex items-center justify-center shadow-xs">
            {calculatorType === "area_to_volume" ? (
              <Paintbrush size={14} className="text-[#F26522]" />
            ) : calculatorType === "length_to_units" ? (
              <Zap size={14} className="text-[#F26522]" />
            ) : (
              <Calculator size={14} className="text-[#F26522]" />
            )}
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#052a51]">
              {calculatorType === "area_to_volume"
                ? "Smart Paint & Volume Estimator"
                : calculatorType === "length_to_units"
                ? "Wire & Cable Length Estimator"
                : "Coverage & Requirement Calculator"}
            </h3>
            <p className="text-[10px] text-gray-500">
              {wastageFactor > 1
                ? `Includes +${Math.round((wastageFactor - 1) * 100)}% standard cutting/application wastage buffer`
                : "Real-time automated estimation"}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#052a51]/10 text-[#052a51] uppercase tracking-wider">
          Live Estimate
        </span>
      </div>

      {/* ── 1. AREA TO BOXES (Tiles, Stone, Wallpaper) ── */}
      {calculatorType === "area_to_boxes" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="Enter floor / wall area in sq.ft"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={1}
              />
            </div>
            <span className="flex items-center px-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
              sq.ft
            </span>
          </div>

          {/* Quick Area Presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-gray-400 font-medium">Quick sizes:</span>
            {[
              { label: "100 sq.ft (Bath)", val: "100" },
              { label: "180 sq.ft (Bed)", val: "180" },
              { label: "350 sq.ft (Living)", val: "350" },
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

          {/* Result breakdown */}
          {boxesNeeded > 0 && (
            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">
                  Requirement for {areaNum} sq.ft (+10% buffer):
                </span>
                <span className="font-black text-[#F26522] text-sm">
                  {boxesNeeded} {product.unitOfSale || "box"}{boxesNeeded > 1 ? "es" : ""}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-100">
                <span>Covers ~{totalAreaCovered.toFixed(0)} sq.ft</span>
                <span className="font-bold text-[#052a51]">Total: {formatPrice(totalCostBoxes)}</span>
              </div>

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
                    <span>Set Quantity to {boxesNeeded} Boxes</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 2. AREA TO VOLUME (Paint & Finishes) ── */}
      {calculatorType === "area_to_volume" && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 flex gap-2">
              <input
                type="number"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                placeholder="Enter wall surface area in sq.ft"
                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={1}
              />
              <span className="flex items-center px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
                sq.ft
              </span>
            </div>

            {/* Number of coats */}
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
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-gray-400 font-medium">Quick rooms:</span>
            {[
              { label: "1 Room (~350 sq.ft)", val: "350" },
              { label: "2 BHK (~1,200 sq.ft)", val: "1200" },
              { label: "3 BHK (~2,000 sq.ft)", val: "2000" },
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

          {/* Result Breakdown & Suggested Pack Combination */}
          {rawLitresNeeded > 0 && (
            <div className="p-3.5 bg-white rounded-xl border border-gray-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">
                  Paint needed ({coatsInput} coats @ {effectiveCoverageRate} sq.ft/L):
                </span>
                <span className="font-black text-[#F26522] text-sm">
                  {rawLitresNeeded} Litres
                </span>
              </div>

              {/* Suggested Can Breakdown if variants exist */}
              {suggestedPackCombination && (
                <div className="bg-orange-50/70 p-2.5 rounded-lg border border-orange-200/60 space-y-1">
                  <span className="text-[10px] font-black text-[#052a51] uppercase tracking-wider flex items-center gap-1">
                    <Sparkles size={11} className="text-[#F26522]" />
                    <span>Recommended Can Combination:</span>
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
                  <div className="flex justify-between items-center text-[11px] text-gray-600 pt-1">
                    <span>Total Provided: {suggestedPackCombination.totalLitresProvided} Litres</span>
                    <span className="font-bold text-[#052a51]">
                      Est. Total: {formatPrice(suggestedPackCombination.totalCost)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleApply}
                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
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
                    <span>Apply Recommended Pack to Cart</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. LENGTH TO UNITS (Wires, Cables, Pipes) ── */}
      {calculatorType === "length_to_units" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="number"
              value={lengthInput}
              onChange={(e) => setLengthInput(e.target.value)}
              placeholder="Enter required wiring length in meters"
              className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              min={1}
            />
            <span className="flex items-center px-3.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
              Meters
            </span>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span className="text-gray-400 font-medium">Standard circuits:</span>
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

          {/* Result breakdown */}
          {coilsNeeded > 0 && (
            <div className="p-3 bg-white rounded-xl border border-gray-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">
                  Wiring needed for {lengthNum}m (+10% safety sag buffer):
                </span>
                <span className="font-black text-[#F26522] text-sm">
                  {coilsNeeded} Coil{coilsNeeded > 1 ? "s" : ""} ({effectiveCoverageRate}m each)
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-gray-100">
                <span>Total length: {totalLengthCovered} meters</span>
                <span className="font-bold text-[#052a51]">Total: {formatPrice(totalCostCoils)}</span>
              </div>

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
                    <span>Set Quantity to {coilsNeeded} Coils</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
