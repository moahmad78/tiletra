"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Trash2,
  Copy,
  Palette,
  Check,
  Layers,
  Image as ImageIcon,
  Sparkles,
  Scale,
  FlaskConical,
  Package,
  Wand2,
  X,
} from "lucide-react";
import type { ProductVariant } from "@/lib/data/products";
import {
  CATALOG_FINISHES,
  CATALOG_DIMENSIONS,
  resolveColorHex,
} from "@/lib/catalog";
import ColorPalettePickerModal from "@/components/admin/ColorPalettePickerModal";

interface VariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  unitOfSale?: string;
  baseUnit?: string;
}

const ATTRIBUTE_LABELS = [
  "Weight",
  "Volume",
  "Pack Option",
  "Dimension",
  "Size",
  "Color",
  "Thickness",
  "Finish",
  "Rating",
  "Custom",
];

interface PresetOption {
  value: string;
  weightKg?: number;
  multiplier?: number;
}

interface PresetDefinition {
  label: string;
  unit: string;
  options: PresetOption[];
}

const PRESETS: Record<string, PresetDefinition> = {
  weight_kg: {
    label: "Weight",
    unit: "kg",
    options: [
      { value: "1 Kg", weightKg: 1, multiplier: 1 },
      { value: "2 Kg", weightKg: 2, multiplier: 1.9 },
      { value: "5 Kg", weightKg: 5, multiplier: 4.5 },
      { value: "10 Kg", weightKg: 10, multiplier: 8.5 },
      { value: "20 Kg", weightKg: 20, multiplier: 16.5 },
      { value: "50 Kg", weightKg: 50, multiplier: 38 },
    ],
  },
  volume_litre: {
    label: "Volume",
    unit: "litre",
    options: [
      { value: "500 ml", weightKg: 0.5, multiplier: 0.6 },
      { value: "1 Litre", weightKg: 1, multiplier: 1 },
      { value: "4 Litres", weightKg: 4, multiplier: 3.7 },
      { value: "10 Litres", weightKg: 10, multiplier: 9 },
      { value: "20 Litres", weightKg: 20, multiplier: 17 },
    ],
  },
  adhesives: {
    label: "Weight",
    unit: "kg",
    options: [
      { value: "1 Kg Pouch", weightKg: 1, multiplier: 1 },
      { value: "5 Kg Bucket", weightKg: 5, multiplier: 4.6 },
      { value: "20 Kg Bag", weightKg: 20, multiplier: 17 },
      { value: "50 Kg Bag", weightKg: 50, multiplier: 39 },
    ],
  },
  paint: {
    label: "Volume",
    unit: "litre",
    options: [
      { value: "1L", weightKg: 1.2, multiplier: 1 },
      { value: "4L", weightKg: 4.8, multiplier: 3.7 },
      { value: "10L", weightKg: 12, multiplier: 9 },
      { value: "20L", weightKg: 24, multiplier: 17 },
    ],
  },
  plywood: {
    label: "Dimension",
    unit: "sheet",
    options: [
      { value: "6mm x 4x8ft", weightKg: 12, multiplier: 0.6 },
      { value: "9mm x 4x8ft", weightKg: 18, multiplier: 0.8 },
      { value: "12mm x 4x8ft", weightKg: 24, multiplier: 1 },
      { value: "16mm x 4x8ft", weightKg: 30, multiplier: 1.25 },
      { value: "19mm x 4x8ft", weightKg: 36, multiplier: 1.45 },
      { value: "25mm x 4x8ft", weightKg: 48, multiplier: 1.8 },
    ],
  },
  tiles: {
    label: "Size",
    unit: "box",
    options: [
      { value: "300x300mm", weightKg: 14, multiplier: 0.7 },
      { value: "600x600mm", weightKg: 28, multiplier: 1 },
      { value: "600x1200mm", weightKg: 32, multiplier: 1.4 },
      { value: "800x800mm", weightKg: 35, multiplier: 1.5 },
      { value: "800x1600mm", weightKg: 48, multiplier: 2.1 },
    ],
  },
  electrical: {
    label: "Size",
    unit: "coil",
    options: [
      { value: "1.0 sq.mm (90m)", weightKg: 1.8, multiplier: 0.7 },
      { value: "1.5 sq.mm (90m)", weightKg: 2.4, multiplier: 1 },
      { value: "2.5 sq.mm (90m)", weightKg: 3.8, multiplier: 1.6 },
      { value: "4.0 sq.mm (90m)", weightKg: 5.6, multiplier: 2.4 },
      { value: "6.0 sq.mm (90m)", weightKg: 8.2, multiplier: 3.5 },
    ],
  },
  hardware: {
    label: "Pack Option",
    unit: "pack",
    options: [
      { value: "Pack of 10", weightKg: 0.2, multiplier: 1 },
      { value: "Pack of 25", weightKg: 0.5, multiplier: 2.3 },
      { value: "Pack of 50", weightKg: 1.0, multiplier: 4.4 },
      { value: "Pack of 100", weightKg: 2.0, multiplier: 8.2 },
      { value: "Pack of 500", weightKg: 10.0, multiplier: 38 },
    ],
  },
};

// Helper to auto-parse weight in kg from text (e.g. "5 Kg" -> 5, "500 ml" -> 0.5)
function parseWeightFromText(text: string): number | undefined {
  if (!text) return undefined;
  const lower = text.toLowerCase().trim();
  const kgMatch = lower.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) return parseFloat(kgMatch[1]);

  const lMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:l|litre|liter)/);
  if (lMatch) return parseFloat(lMatch[1]);

  const mlMatch = lower.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (mlMatch) return parseFloat(mlMatch[1]) / 1000;

  const gmMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:g|gm|gram)/);
  if (gmMatch) return parseFloat(gmMatch[1]) / 1000;

  return undefined;
}

export default function VariantEditor({
  variants,
  onChange,
  unitOfSale = "unit",
  baseUnit = "sqft",
}: VariantEditorProps) {
  const [activeColorModalIdx, setActiveColorModalIdx] = useState<number | null>(null);
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false);

  // Multi-option generator modal state
  const [genCategory, setGenCategory] = useState<"weight" | "volume" | "pack" | "dimension" | "custom">("weight");
  const [genSelectedOptions, setGenSelectedOptions] = useState<string[]>(["1 Kg", "5 Kg", "20 Kg"]);
  const [genCustomText, setGenCustomText] = useState("");
  const [genBasePrice, setGenBasePrice] = useState<number>(variants[0]?.pricePerBox || 1000);
  const [genBaseStock, setGenBaseStock] = useState<number>(50);

  const handleAddVariant = () => {
    const newId = `v-${Date.now().toString().slice(-5)}`;
    const lastVariant = variants[variants.length - 1];

    const newVariant: ProductVariant = {
      id: newId,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      size: lastVariant ? `${lastVariant.size} (New)` : "Standard",
      finish: lastVariant?.finish || "Glossy",
      color: lastVariant?.color || "White",
      colorHex: lastVariant?.colorHex || resolveColorHex(lastVariant?.color || "White"),
      swatchImage: null,
      image: null,
      unit: unitOfSale,
      attributeLabel: lastVariant?.attributeLabel || (unitOfSale === "kg" ? "Weight" : unitOfSale === "litre" ? "Volume" : "Size"),
      attributeValue: lastVariant ? `${lastVariant.attributeValue || lastVariant.size} (New)` : "Standard",
      pricePerBox: lastVariant?.pricePerBox || 1000,
      pricePerSqft: lastVariant?.pricePerSqft || 1000,
      sqftPerBox: lastVariant?.sqftPerBox || 1,
      piecesPerBox: lastVariant?.piecesPerBox || 1,
      stockBoxes: 50,
      inStock: true,
      weightKg: lastVariant?.weightKg || 2.5,
    };
    onChange([...variants, newVariant]);
  };

  const handleApplyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const basePrice = variants[0]?.pricePerBox || 1000;
    const baseColor = variants[0]?.color || "White";
    const baseFinish = variants[0]?.finish || "Glossy";
    const baseColorHex = variants[0]?.colorHex || resolveColorHex(baseColor);

    const newVariants: ProductVariant[] = preset.options.map((opt, idx) => {
      const calculatedPrice = Math.round(basePrice * (opt.multiplier || (1 + idx * 0.35)));
      return {
        id: `v-${presetKey}-${idx + 1}-${Date.now().toString().slice(-4)}`,
        sku: `SKU-${presetKey.toUpperCase().slice(0, 3)}-${idx + 1}-${Date.now().toString().slice(-4)}`,
        size: opt.value,
        attributeLabel: preset.label,
        attributeValue: opt.value,
        color: baseColor,
        colorHex: baseColorHex,
        finish: baseFinish,
        image: null,
        unit: preset.unit || unitOfSale,
        weightKg: opt.weightKg || parseWeightFromText(opt.value) || 2.5,
        pricePerBox: calculatedPrice,
        pricePerSqft: calculatedPrice,
        sqftPerBox: 1,
        piecesPerBox: 1,
        stockBoxes: 50,
        inStock: true,
      };
    });
    onChange(newVariants);
  };

  const handleExecuteGenerator = () => {
    let finalOptionValues: string[] = [];
    let attrLabel = "Option";
    let targetUnit = unitOfSale;

    if (genCategory === "custom") {
      finalOptionValues = genCustomText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      attrLabel = "Size";
    } else {
      finalOptionValues = genSelectedOptions;
      if (genCategory === "weight") {
        attrLabel = "Weight";
        targetUnit = "kg";
      } else if (genCategory === "volume") {
        attrLabel = "Volume";
        targetUnit = "litre";
      } else if (genCategory === "pack") {
        attrLabel = "Pack Option";
        targetUnit = "pack";
      } else if (genCategory === "dimension") {
        attrLabel = "Dimension";
      }
    }

    if (finalOptionValues.length === 0) {
      return;
    }

    const baseColor = variants[0]?.color || "White";
    const baseFinish = variants[0]?.finish || "Glossy";
    const baseColorHex = variants[0]?.colorHex || resolveColorHex(baseColor);

    const newVariants: ProductVariant[] = finalOptionValues.map((val, idx) => {
      const parsedWeight = parseWeightFromText(val);
      let calculatedPrice = genBasePrice;
      if (parsedWeight && parsedWeight > 1) {
        calculatedPrice = Math.round(genBasePrice * (parsedWeight * 0.85));
      } else if (idx > 0) {
        calculatedPrice = Math.round(genBasePrice * (1 + idx * 0.4));
      }

      return {
        id: `v-gen-${idx + 1}-${Date.now().toString().slice(-4)}`,
        sku: `SKU-OPT-${idx + 1}-${Date.now().toString().slice(-4)}`,
        size: val,
        attributeLabel: attrLabel,
        attributeValue: val,
        color: baseColor,
        colorHex: baseColorHex,
        finish: baseFinish,
        image: null,
        unit: targetUnit,
        weightKg: parsedWeight || 2.5,
        pricePerBox: calculatedPrice,
        pricePerSqft: calculatedPrice,
        sqftPerBox: 1,
        piecesPerBox: 1,
        stockBoxes: genBaseStock,
        inStock: true,
      };
    });

    onChange(newVariants);
    setGeneratorModalOpen(false);
  };

  const handleToggleGenOption = (val: string) => {
    if (genSelectedOptions.includes(val)) {
      setGenSelectedOptions(genSelectedOptions.filter((v) => v !== val));
    } else {
      setGenSelectedOptions([...genSelectedOptions, val]);
    }
  };

  const handleUpdateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any
  ) => {
    const updated = [...variants];
    const current = { ...updated[index], [field]: value };

    // Auto-calculate pricePerSqft if pricePerBox or sqftPerBox changed
    if (field === "pricePerBox" || field === "sqftPerBox") {
      const boxPrice = field === "pricePerBox" ? Number(value) : current.pricePerBox;
      const sqft = field === "sqftPerBox" ? Number(value) : current.sqftPerBox;
      if (sqft > 0) {
        current.pricePerSqft = Math.round(boxPrice / sqft);
      } else {
        current.pricePerSqft = boxPrice;
      }
    }

    // Keep size and attributeValue in sync
    if (field === "attributeValue") {
      current.size = value;
      // Auto-extract weight in kg if not explicitly set
      const autoWeight = parseWeightFromText(value);
      if (autoWeight !== undefined && !current.weightKg) {
        current.weightKg = autoWeight;
      }
    }
    if (field === "size" && !current.attributeValue) {
      current.attributeValue = value;
    }

    // Auto-sync colorHex when color changes directly
    if (field === "color" && typeof value === "string") {
      current.colorHex = resolveColorHex(value);
    }

    updated[index] = current;
    onChange(updated);
  };

  const handleColorSelected = (colorName: string, colorHex: string) => {
    if (activeColorModalIdx === null) return;
    const updated = [...variants];
    updated[activeColorModalIdx] = {
      ...updated[activeColorModalIdx],
      color: colorName,
      colorHex: colorHex,
    };
    onChange(updated);
  };

  const handleDuplicateVariant = (index: number) => {
    const source = variants[index];
    const newId = `v-${Date.now().toString().slice(-5)}`;
    const duplicated: ProductVariant = {
      ...source,
      id: newId,
      attributeValue: `${source.attributeValue || source.size} (Copy)`,
      size: `${source.size} (Copy)`,
    };
    onChange([...variants, duplicated]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
            <span>Multi-Option Variants & Package Sizes</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#F26522]">
              {variants.length} {variants.length === 1 ? "Option Active" : "Options Active"}
            </span>
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure same model item in different <strong>Kg (1kg/5kg/20kg/50kg)</strong>, <strong>Litres (1L/4L/10L/20L)</strong>, Pack Sizes, Colors, Dimensions, and Custom Options.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setGeneratorModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-[#F26522] to-[#d95a1e] text-white text-xs font-black rounded-xl hover:opacity-95 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Multi-Option Selector</span>
          </button>
          <button
            type="button"
            onClick={handleAddVariant}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Single Option</span>
          </button>
        </div>
      </div>

      {/* Quick 1-Click Multi-Option Presets */}
      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
            <Layers size={12} className="text-[#F26522]" />
            <span>1-Click Multi-Option Presets (Kg / Litres / Sizes):</span>
          </span>
          <span className="text-[10px] text-gray-400">Clicking replaces with standard options</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Weight Presets */}
          <button
            type="button"
            onClick={() => handleApplyPreset("weight_kg")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Scale size={12} className="text-[#F26522]" />
            <span>Weight (1kg, 2kg, 5kg, 10kg, 20kg, 50kg)</span>
          </button>

          {/* Volume Presets */}
          <button
            type="button"
            onClick={() => handleApplyPreset("volume_litre")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <FlaskConical size={12} className="text-[#F26522]" />
            <span>Volume (500ml, 1L, 4L, 10L, 20L)</span>
          </button>

          {/* Adhesives & Putty */}
          <button
            type="button"
            onClick={() => handleApplyPreset("adhesives")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs cursor-pointer"
          >
            Adhesive/Putty (1kg, 5kg, 20kg, 50kg)
          </button>

          {/* Paints */}
          <button
            type="button"
            onClick={() => handleApplyPreset("paint")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs cursor-pointer"
          >
            Paint (1L, 4L, 10L, 20L)
          </button>

          {/* Tiles */}
          <button
            type="button"
            onClick={() => handleApplyPreset("tiles")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs cursor-pointer"
          >
            Tiles (600x600, 600x1200)
          </button>

          {/* Plywood */}
          <button
            type="button"
            onClick={() => handleApplyPreset("plywood")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs cursor-pointer"
          >
            Plywood (6mm, 12mm, 19mm)
          </button>

          {/* Hardware */}
          <button
            type="button"
            onClick={() => handleApplyPreset("hardware")}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-all hover:shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Package size={12} className="text-[#F26522]" />
            <span>Packs (10, 50, 100, 500 pcs)</span>
          </button>
        </div>
      </div>

      {/* Responsive Table of Variants */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Option Type</th>
              <th className="py-3 px-3">Option Value (e.g. 5 Kg / 4 Litres)</th>
              <th className="py-3 px-3">Weight (Kg)</th>
              <th className="py-3 px-3">Selling Price (₹)</th>
              <th className="py-3 px-3">MRP (₹)</th>
              <th className="py-3 px-3">Stock ({unitOfSale}s)</th>
              <th className="py-3 px-3">Color Palette</th>
              <th className="py-3 px-3">Surface Finish</th>
              <th className="py-3 px-3">Variant Photo</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {variants.map((v, i) => {
              const hex = v.colorHex || resolveColorHex(v.color || "White");
              return (
                <tr key={v.id || i} className="hover:bg-gray-50/50 transition-colors">
                  {/* Attribute Label */}
                  <td className="p-2.5">
                    <select
                      value={v.attributeLabel || "Weight"}
                      onChange={(e) => handleUpdateVariant(i, "attributeLabel", e.target.value)}
                      className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    >
                      {ATTRIBUTE_LABELS.map((lbl) => (
                        <option key={lbl} value={lbl}>
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Option Value */}
                  <td className="p-2.5">
                    <input
                      type="text"
                      value={v.attributeValue || v.size}
                      onChange={(e) => handleUpdateVariant(i, "attributeValue", e.target.value)}
                      className="w-40 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      placeholder="e.g. 5 Kg / 4 Litre / 19mm"
                    />
                  </td>

                  {/* Weight (kg) */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      value={v.weightKg ?? ""}
                      onChange={(e) =>
                        handleUpdateVariant(
                          i,
                          "weightKg",
                          e.target.value !== "" ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      placeholder="kg"
                      step="0.1"
                      min={0}
                    />
                  </td>

                  {/* Price */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      value={v.pricePerBox}
                      onChange={(e) => handleUpdateVariant(i, "pricePerBox", Number(e.target.value))}
                      className="w-24 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      min={1}
                    />
                  </td>

                  {/* MRP (Optional) */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      value={v.mrp ?? ""}
                      onChange={(e) =>
                        handleUpdateVariant(
                          i,
                          "mrp",
                          e.target.value !== "" ? Number(e.target.value) : undefined
                        )
                      }
                      className="w-24 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 focus:outline-none focus:border-[#F26522]"
                      placeholder="Optional"
                      min={0}
                    />
                  </td>

                  {/* Stock */}
                  <td className="p-2.5">
                    <input
                      type="number"
                      value={v.stockBoxes}
                      onChange={(e) => handleUpdateVariant(i, "stockBoxes", Number(e.target.value))}
                      className={`w-20 px-2.5 py-1.5 border rounded-lg text-xs font-bold focus:outline-none focus:border-[#F26522] ${
                        v.stockBoxes < 10
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-gray-50 border-gray-200 text-[#052a51]"
                      }`}
                      min={0}
                    />
                  </td>

                  {/* Rich Color Palette Trigger */}
                  <td className="p-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveColorModalIdx(i)}
                      className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 hover:bg-orange-50/70 border border-gray-200 hover:border-[#F26522] rounded-lg transition-all text-left cursor-pointer group"
                      title="Click to open Color Palette Picker"
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-black/15 shadow-xs shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] truncate max-w-[70px]">
                        {v.color || "Select"}
                      </span>
                      <Palette size={11} className="text-gray-400 group-hover:text-[#F26522] shrink-0" />
                    </button>
                  </td>

                  {/* Finish */}
                  <td className="p-2.5">
                    <select
                      value={v.finish || "Glossy"}
                      onChange={(e) => handleUpdateVariant(i, "finish", e.target.value)}
                      className="w-24 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    >
                      {CATALOG_FINISHES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Variant Image URL */}
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={v.image || ""}
                        onChange={(e) => handleUpdateVariant(i, "image", e.target.value || null)}
                        className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 focus:outline-none focus:border-[#F26522]"
                        placeholder="/photo.jpg"
                      />
                      {v.image ? (
                        <div className="w-6 h-6 rounded border border-gray-200 overflow-hidden shrink-0 relative">
                          <Image
                            src={v.image}
                            alt="variant"
                            width={24}
                            height={24}
                            unoptimized={v.image.startsWith("data:") || v.image.startsWith("blob:")}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="p-2.5 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => handleDuplicateVariant(i)}
                      className="p-1.5 text-gray-400 hover:text-[#052a51] rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      title="Duplicate variant"
                    >
                      <Copy size={13} />
                    </button>
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(i)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                        title="Remove variant"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Multi-Option Quick Generator Modal ── */}
      {generatorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-black text-[#052a51] text-base flex items-center gap-1.5">
                  <Sparkles size={16} className="text-[#F26522]" />
                  <span>Quick Multi-Option Generator</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Select which packaging sizes or options this model is available in
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGeneratorModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Category Type Tabs */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setGenCategory("weight");
                  setGenSelectedOptions(["1 Kg", "5 Kg", "20 Kg"]);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  genCategory === "weight" ? "bg-white text-[#F26522] shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Weight (Kg)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenCategory("volume");
                  setGenSelectedOptions(["1 Litre", "4 Litres", "10 Litres"]);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  genCategory === "volume" ? "bg-white text-[#F26522] shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Volume (Litres)
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenCategory("pack");
                  setGenSelectedOptions(["Pack of 10", "Pack of 50", "Pack of 100"]);
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  genCategory === "pack" ? "bg-white text-[#F26522] shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pack Sizes
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenCategory("custom");
                }}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  genCategory === "custom" ? "bg-white text-[#F26522] shadow-xs" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Custom
              </button>
            </div>

            {/* Options Checkboxes */}
            {genCategory === "weight" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Select Weight Options:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["1 Kg", "2 Kg", "5 Kg", "10 Kg", "20 Kg", "50 Kg"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleToggleGenOption(opt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        genSelectedOptions.includes(opt)
                          ? "bg-orange-50/80 border-[#F26522] text-[#F26522] ring-1 ring-[#F26522]"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {genSelectedOptions.includes(opt) ? "✓ " : ""}{opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {genCategory === "volume" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Select Volume Options:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["500 ml", "1 Litre", "4 Litres", "10 Litres", "20 Litres"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleToggleGenOption(opt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        genSelectedOptions.includes(opt)
                          ? "bg-orange-50/80 border-[#F26522] text-[#F26522] ring-1 ring-[#F26522]"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {genSelectedOptions.includes(opt) ? "✓ " : ""}{opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {genCategory === "pack" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Select Pack Size Options:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {["Pack of 10", "Pack of 25", "Pack of 50", "Pack of 100", "Pack of 500", "Pack of 1000"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleToggleGenOption(opt)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        genSelectedOptions.includes(opt)
                          ? "bg-orange-50/80 border-[#F26522] text-[#F26522] ring-1 ring-[#F26522]"
                          : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {genSelectedOptions.includes(opt) ? "✓ " : ""}{opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {genCategory === "custom" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  Enter Comma-Separated Options:
                </label>
                <input
                  type="text"
                  value={genCustomText}
                  onChange={(e) => setGenCustomText(e.target.value)}
                  placeholder="e.g. 500g, 1 Kg, 5 Kg, 20 Kg"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
                />
              </div>
            )}

            {/* Base Price & Stock */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Base Price (₹):
                </label>
                <input
                  type="number"
                  value={genBasePrice}
                  onChange={(e) => setGenBasePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51]"
                  min={1}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Default Stock per Option:
                </label>
                <input
                  type="number"
                  value={genBaseStock}
                  onChange={(e) => setGenBaseStock(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51]"
                  min={1}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setGeneratorModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteGenerator}
                className="px-5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Wand2 size={13} />
                <span>Generate Multi-Options</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Color Palette Picker Modal */}
      {activeColorModalIdx !== null && (
        <ColorPalettePickerModal
          isOpen={true}
          onClose={() => setActiveColorModalIdx(null)}
          currentColorName={variants[activeColorModalIdx]?.color || "White"}
          currentColorHex={variants[activeColorModalIdx]?.colorHex || resolveColorHex(variants[activeColorModalIdx]?.color || "White")}
          onSelectColor={handleColorSelected}
          title={`Choose Color for Option #${activeColorModalIdx + 1}`}
        />
      )}
    </div>
  );
}
