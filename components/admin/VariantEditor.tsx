"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Sparkles, Palette, Check, Layers, Image as ImageIcon } from "lucide-react";
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
  "Volume",
  "Dimension",
  "Size",
  "Color",
  "Thickness",
  "Rating",
  "Pack Option",
  "Finish",
  "Custom",
];

const PRESETS: Record<string, { label: string; values: string[] }> = {
  paint: {
    label: "Volume",
    values: ["1L", "4L", "10L", "20L"],
  },
  plywood: {
    label: "Dimension",
    values: ["6mm x 4x8ft", "9mm x 4x8ft", "12mm x 4x8ft", "16mm x 4x8ft", "19mm x 4x8ft", "25mm x 4x8ft"],
  },
  tiles: {
    label: "Size",
    values: ["300x300mm", "600x600mm", "600x1200mm", "800x800mm", "800x1600mm", "1200x1800mm"],
  },
  electrical: {
    label: "Size",
    values: ["1.0 sq.mm (90m)", "1.5 sq.mm (90m)", "2.5 sq.mm (90m)", "4.0 sq.mm (90m)", "6.0 sq.mm (90m)", "10.0 sq.mm (90m)"],
  },
  hardware: {
    label: "Pack Option",
    values: ["Pack of 10", "Pack of 25", "Pack of 50", "Pack of 100", "Pack of 500", "Pack of 1000"],
  },
  granite: {
    label: "Slab Thickness",
    values: ["16mm Slab", "18mm Slab", "20mm Slab", "25mm Slab"],
  },
};

export default function VariantEditor({
  variants,
  onChange,
  unitOfSale = "unit",
  baseUnit = "sqft",
}: VariantEditorProps) {
  const [activeColorModalIdx, setActiveColorModalIdx] = useState<number | null>(null);

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
      attributeLabel: lastVariant?.attributeLabel || "Size",
      attributeValue: lastVariant ? `${lastVariant.attributeValue || lastVariant.size} (New)` : "Standard",
      pricePerBox: lastVariant?.pricePerBox || 1000,
      pricePerSqft: lastVariant?.pricePerSqft || 1000,
      sqftPerBox: lastVariant?.sqftPerBox || 1,
      piecesPerBox: lastVariant?.piecesPerBox || 4,
      stockBoxes: 50,
      inStock: true,
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

    const newVariants: ProductVariant[] = preset.values.map((val, idx) => ({
      id: `v-${presetKey}-${idx + 1}-${Date.now().toString().slice(-4)}`,
      sku: `SKU-${presetKey.toUpperCase().slice(0, 3)}-${idx + 1}-${Date.now().toString().slice(-4)}`,
      size: val,
      attributeLabel: preset.label,
      attributeValue: val,
      color: baseColor,
      colorHex: baseColorHex,
      finish: baseFinish,
      image: null,
      unit: unitOfSale,
      pricePerBox: Math.round(basePrice * (1 + idx * 0.35)),
      pricePerSqft: Math.round(basePrice * (1 + idx * 0.35)),
      sqftPerBox: 1,
      piecesPerBox: 1,
      stockBoxes: 50,
      inStock: true,
    }));
    onChange(newVariants);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
            <span>Product Variants & Options</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#F26522]">
              {variants.length} {variants.length === 1 ? "Option" : "Options"}
            </span>
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure Flipkart-style Color swatches, Litre/Volume options (1L/4L/10L), Dimensions (6mm/19mm), prices, stock, and variant images
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddVariant}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Another Variant</span>
        </button>
      </div>

      {/* Quick 1-Click Presets */}
      <div className="flex items-center gap-1.5 flex-wrap p-2.5 bg-gray-50 rounded-xl border border-gray-200/80">
        <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
          <Sparkles size={11} className="text-[#F26522]" /> Presets:
        </span>
        <button
          type="button"
          onClick={() => handleApplyPreset("paint")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors cursor-pointer"
        >
          Paint (1L, 4L, 10L, 20L)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("plywood")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors cursor-pointer"
        >
          Plywood (6mm, 12mm, 19mm)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("tiles")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors cursor-pointer"
        >
          Tiles (600x600, 600x1200)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("electrical")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors cursor-pointer"
        >
          Wire (1.0, 1.5, 2.5 sq.mm)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("hardware")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors cursor-pointer"
        >
          Hardware (Pack of 10, 50, 100)
        </button>
      </div>

      {/* Responsive Table of Variants */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Option / Size (e.g. 4L / 19mm)</th>
              <th className="py-3 px-3">Color Palette</th>
              <th className="py-3 px-3">Finish</th>
              <th className="py-3 px-3">Price (₹)</th>
              <th className="py-3 px-3">MRP (₹)</th>
              <th className="py-3 px-3">Weight (kg)</th>
              <th className="py-3 px-3">Stock ({unitOfSale}s)</th>
              <th className="py-3 px-3">Variant Image</th>
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
                      value={v.attributeLabel || "Volume"}
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
                      className="w-36 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      placeholder="e.g. 4L, 19mm, 600x600mm"
                    />
                  </td>

                  {/* Rich Color Palette Trigger */}
                  <td className="p-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveColorModalIdx(i)}
                      className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 hover:bg-orange-50/70 border border-gray-200 hover:border-[#F26522] rounded-lg transition-all text-left cursor-pointer group"
                      title="Click to open Color Palette Picker"
                    >
                      <div
                        className="w-5 h-5 rounded-full border border-black/15 shadow-xs shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <div className="flex flex-col min-w-[70px] max-w-[100px]">
                        <span className="text-xs font-bold text-[#052a51] group-hover:text-[#F26522] truncate">
                          {v.color || "Select"}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono font-medium truncate">
                          {hex}
                        </span>
                      </div>
                      <Palette size={12} className="text-gray-400 group-hover:text-[#F26522] shrink-0" />
                    </button>
                  </td>

                  {/* Finish */}
                  <td className="p-2.5">
                    <select
                      value={v.finish || "Glossy"}
                      onChange={(e) => handleUpdateVariant(i, "finish", e.target.value)}
                      className="w-28 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    >
                      {CATALOG_FINISHES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
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
                      className="w-20 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      placeholder="e.g. 2.5"
                      step="0.1"
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

                  {/* Variant Image URL */}
                  <td className="p-2.5">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={v.image || ""}
                        onChange={(e) => handleUpdateVariant(i, "image", e.target.value || null)}
                        className="w-32 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 focus:outline-none focus:border-[#F26522]"
                        placeholder="https://... or /img.jpg"
                      />
                      {v.image ? (
                        <div className="w-7 h-7 rounded-md border border-gray-200 overflow-hidden shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.image} alt="variant" className="w-full h-full object-cover" />
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
