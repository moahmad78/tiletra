"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Sparkles, Image as ImageIcon, Check } from "lucide-react";
import type { ProductVariant, Finish } from "@/lib/data/products";

interface VariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  unitOfSale?: string;
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

const FINISH_OPTIONS: string[] = [
  "Standard",
  "Matte",
  "Glossy",
  "Textured",
  "Satin",
  "Polished",
  "Metallic",
  "Rustic",
];

const PRESETS: Record<string, { label: string; values: string[] }> = {
  paint: {
    label: "Volume",
    values: ["1L", "4L", "10L", "20L"],
  },
  plywood: {
    label: "Dimension",
    values: ["6mm x 4x8ft", "9mm x 4x8ft", "12mm x 4x8ft", "16mm x 4x8ft", "19mm x 4x8ft"],
  },
  tiles: {
    label: "Size",
    values: ["300x300mm", "600x600mm", "600x1200mm", "800x800mm", "800x1600mm"],
  },
  electrical: {
    label: "Size",
    values: ["1.0 sq.mm (90m)", "1.5 sq.mm (90m)", "2.5 sq.mm (90m)", "4.0 sq.mm (90m)", "6.0 sq.mm (90m)"],
  },
  hardware: {
    label: "Pack Option",
    values: ["Pack of 10", "Pack of 25", "Pack of 50", "Pack of 100"],
  },
};

export default function VariantEditor({
  variants,
  onChange,
  unitOfSale = "unit",
}: VariantEditorProps) {
  const handleAddVariant = () => {
    const newId = `v-${Date.now().toString().slice(-5)}`;
    const lastVariant = variants[variants.length - 1];

    const newVariant: ProductVariant = {
      id: newId,
      size: lastVariant ? `${lastVariant.size} (New)` : "Standard",
      finish: lastVariant?.finish || "Standard",
      color: lastVariant?.color || "Standard",
      image: null,
      unit: unitOfSale,
      attributeLabel: lastVariant?.attributeLabel || "Volume",
      attributeValue: lastVariant ? `${lastVariant.attributeValue || lastVariant.size} (New)` : "1L",
      pricePerBox: lastVariant?.pricePerBox || 1000,
      pricePerSqft: lastVariant?.pricePerSqft || 1000,
      sqftPerBox: lastVariant?.sqftPerBox || 1,
      stockBoxes: 50,
      inStock: true,
    };
    onChange([...variants, newVariant]);
  };

  const handleApplyPreset = (presetKey: keyof typeof PRESETS) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const basePrice = variants[0]?.pricePerBox || 1000;
    const baseColor = variants[0]?.color || "Standard";
    const baseFinish = variants[0]?.finish || "Standard";

    const newVariants: ProductVariant[] = preset.values.map((val, idx) => ({
      id: `v-${presetKey}-${idx + 1}-${Date.now().toString().slice(-4)}`,
      size: val,
      attributeLabel: preset.label,
      attributeValue: val,
      color: baseColor,
      finish: baseFinish,
      pricePerBox: Math.round(basePrice * (idx === 0 ? 1 : idx === 1 ? 3.5 : idx === 2 ? 8 : 15)),
      pricePerSqft: basePrice,
      sqftPerBox: 1,
      stockBoxes: 50,
      inStock: true,
      image: null,
      unit: unitOfSale,
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

    updated[index] = current;
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
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors"
        >
          Paint (1L, 4L, 10L, 20L)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("plywood")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors"
        >
          Plywood (6mm, 12mm, 19mm)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("tiles")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors"
        >
          Tiles (600x600, 600x1200)
        </button>
        <button
          type="button"
          onClick={() => handleApplyPreset("electrical")}
          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] transition-colors"
        >
          Wire (1.0, 1.5, 2.5 sq.mm)
        </button>
      </div>

      {/* Responsive Table of Variants */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Type</th>
              <th className="py-3 px-3">Option Value (e.g. 4L / 19mm)</th>
              <th className="py-3 px-3">Color / Shade</th>
              <th className="py-3 px-3">Finish</th>
              <th className="py-3 px-3">Price (₹)</th>
              <th className="py-3 px-3">Stock ({unitOfSale}s)</th>
              <th className="py-3 px-3">Variant Image URL</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {variants.map((v, i) => (
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

                {/* Color */}
                <td className="p-2.5">
                  <input
                    type="text"
                    value={v.color || ""}
                    onChange={(e) => handleUpdateVariant(i, "color", e.target.value)}
                    className="w-28 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="e.g. White, Teak"
                  />
                </td>

                {/* Finish */}
                <td className="p-2.5">
                  <select
                    value={v.finish || "Standard"}
                    onChange={(e) => handleUpdateVariant(i, "finish", e.target.value)}
                    className="w-24 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  >
                    {FINISH_OPTIONS.map((f) => (
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
                      className="w-36 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-medium text-gray-700 focus:outline-none focus:border-[#F26522]"
                      placeholder="https://... or /image.jpg"
                    />
                    {v.image && (
                      <div className="w-7 h-7 rounded-md border border-gray-200 overflow-hidden shrink-0">
                        <img src={v.image} alt="variant" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="p-2.5 text-right space-x-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateVariant(i)}
                    className="p-1.5 text-gray-400 hover:text-[#052a51] rounded-lg hover:bg-gray-100 cursor-pointer"
                    title="Duplicate variant"
                  >
                    <Copy size={13} />
                  </button>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 cursor-pointer"
                      title="Remove variant"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
