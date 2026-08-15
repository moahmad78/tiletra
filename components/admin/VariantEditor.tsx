"use client";

import { useState } from "react";
import { Plus, Trash2, Copy, Sparkles } from "lucide-react";
import type { ProductVariant, Finish } from "@/lib/data/products";

interface VariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

const FINISH_OPTIONS: Finish[] = ["Matte", "Glossy", "Textured", "Satin", "Polished"];
const SIZE_OPTIONS = ["300x300mm", "300x600mm", "600x600mm", "800x800mm", "1200x600mm", "200x200mm", "100x100mm"];

export default function VariantEditor({
  variants,
  onChange,
}: VariantEditorProps) {
  const handleAddVariant = () => {
    const newId = `v-${Date.now().toString().slice(-5)}`;
    const newVariant: ProductVariant = {
      id: newId,
      size: "600x600mm",
      finish: "Matte",
      color: "White",
      pricePerBox: 2400,
      pricePerSqft: 60,
      sqftPerBox: 40,
      stockBoxes: 100,
    };
    onChange([...variants, newVariant]);
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
      }
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
    };
    onChange([...variants, duplicated]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) return;
    onChange(variants.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-[#052a51]">Size & Finish Variants</h4>
          <p className="text-xs text-gray-400">
            Define tile dimensions, pricing per box/sq.ft, and stock quantity
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddVariant}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] active:scale-95 transition-all shadow-xs"
        >
          <Plus size={14} />
          <span>Add Variant</span>
        </button>
      </div>

      {/* Responsive Table of Variants */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3">Size</th>
              <th className="py-3 px-3">Finish</th>
              <th className="py-3 px-3">Color</th>
              <th className="py-3 px-3">Sq.ft / Box</th>
              <th className="py-3 px-3">Price / Box (₹)</th>
              <th className="py-3 px-3">Rate / Sq.ft (₹)</th>
              <th className="py-3 px-3">Stock (Boxes)</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-medium">
            {variants.map((v, i) => (
              <tr key={v.id || i} className="hover:bg-gray-50/50 transition-colors">
                {/* Size */}
                <td className="p-2.5">
                  <select
                    value={v.size}
                    onChange={(e) => handleUpdateVariant(i, "size", e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  >
                    {SIZE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Finish */}
                <td className="p-2.5">
                  <select
                    value={v.finish}
                    onChange={(e) => handleUpdateVariant(i, "finish", e.target.value as Finish)}
                    className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  >
                    {FINISH_OPTIONS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Color */}
                <td className="p-2.5">
                  <input
                    type="text"
                    value={v.color}
                    onChange={(e) => handleUpdateVariant(i, "color", e.target.value)}
                    className="w-24 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="e.g. White"
                  />
                </td>

                {/* Sq.ft / Box */}
                <td className="p-2.5">
                  <input
                    type="number"
                    value={v.sqftPerBox}
                    onChange={(e) => handleUpdateVariant(i, "sqftPerBox", Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    min={1}
                  />
                </td>

                {/* Price / Box */}
                <td className="p-2.5">
                  <input
                    type="number"
                    value={v.pricePerBox}
                    onChange={(e) => handleUpdateVariant(i, "pricePerBox", Number(e.target.value))}
                    className="w-24 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    min={100}
                  />
                </td>

                {/* Price / Sq.ft */}
                <td className="p-2.5">
                  <span className="font-extrabold text-[#F26522] text-xs px-2 py-1 bg-[#F26522]/10 rounded-md">
                    ₹{v.pricePerSqft}
                  </span>
                </td>

                {/* Stock Boxes */}
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

                {/* Actions */}
                <td className="p-2.5 text-right space-x-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicateVariant(i)}
                    className="p-1.5 text-gray-400 hover:text-[#052a51] rounded-lg hover:bg-gray-100"
                    title="Duplicate variant"
                  >
                    <Copy size={13} />
                  </button>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(i)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
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
