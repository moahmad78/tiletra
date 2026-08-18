"use client";

import { useState } from "react";
import { Plus, Trash2, Tag } from "lucide-react";
import type { ProductAttribute } from "@/lib/data/products";

interface AttributeEditorProps {
  attributes: ProductAttribute[];
  onChange: (attributes: ProductAttribute[]) => void;
}

export default function AttributeEditor({ attributes, onChange }: AttributeEditorProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newKey.trim() && newValue.trim()) {
      onChange([...attributes, { key: newKey.trim(), value: newValue.trim() }]);
      setNewKey("");
      setNewValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: "key" | "value", val: string) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-[#052a51] flex items-center gap-1.5">
          <Tag size={15} className="text-[#F26522]" />
          <span>Product Attributes & Specs (Multi-Category)</span>
        </h4>
        <p className="text-xs text-gray-400">
          Add custom attributes like Gauge, Length, Thickness, Amperage, Diameter, Finish, etc.
        </p>
      </div>

      {attributes.length > 0 && (
        <div className="space-y-2">
          {attributes.map((attr, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-200"
            >
              <input
                type="text"
                value={attr.key}
                onChange={(e) => handleUpdate(idx, "key", e.target.value)}
                placeholder="Attribute Name (e.g. Gauge)"
                className="w-1/3 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              <input
                type="text"
                value={attr.value}
                onChange={(e) => handleUpdate(idx, "value", e.target.value)}
                placeholder="Value (e.g. 2.5 sq mm)"
                className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:border-[#F26522]"
              />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                aria-label="Remove attribute"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Attribute Row */}
      <form onSubmit={handleAdd} className="flex gap-2 pt-1">
        <input
          type="text"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="Attribute (e.g. Length / Voltage)"
          className="w-1/3 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#F26522]"
        />
        <input
          type="text"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value (e.g. 90m / 1100V)"
          className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#F26522]"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1 shrink-0"
        >
          <Plus size={14} />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
}
