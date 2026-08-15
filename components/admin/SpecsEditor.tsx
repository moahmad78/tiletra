"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface SpecsEditorProps {
  specs: {
    waterAbsorption: string;
    slipResistance: string;
    thickness: string;
    surfaceFinish: string;
    breakingStrength: string;
    frostResistance: string;
    [key: string]: string;
  };
  onChange: (specs: any) => void;
}

export default function SpecsEditor({ specs, onChange }: SpecsEditorProps) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  const handleChange = (key: string, value: string) => {
    onChange({
      ...specs,
      [key]: value,
    });
  };

  const handleRemoveKey = (key: string) => {
    const next = { ...specs };
    delete next[key];
    onChange(next);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customKey.trim() && customValue.trim()) {
      onChange({
        ...specs,
        [customKey.trim()]: customValue.trim(),
      });
      setCustomKey("");
      setCustomValue("");
    }
  };

  const standardKeys = [
    { key: "waterAbsorption", label: "Water Absorption" },
    { key: "slipResistance", label: "Slip Resistance" },
    { key: "thickness", label: "Tile Thickness" },
    { key: "surfaceFinish", label: "Surface Finish" },
    { key: "breakingStrength", label: "Breaking Strength" },
    { key: "frostResistance", label: "Frost Resistance" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-[#052a51]">Technical Specifications</h4>
        <p className="text-xs text-gray-400">
          Key performance specs displayed on the product detail page
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {standardKeys.map(({ key, label }) => (
          <div key={key} className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <label className="text-[10px] font-extrabold uppercase text-gray-400 block mb-1">
              {label}
            </label>
            <input
              type="text"
              value={specs[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              placeholder="e.g. < 0.5%"
            />
          </div>
        ))}
      </div>

      {/* Additional Custom Specs */}
      {Object.keys(specs).filter((k) => !standardKeys.some((sk) => sk.key === k)).length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-bold text-[#052a51]">Custom Properties</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.keys(specs)
              .filter((k) => !standardKeys.some((sk) => sk.key === k))
              .map((k) => (
                <div
                  key={k}
                  className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{k}:</span>
                    <span className="text-xs font-bold text-[#052a51] ml-2">{specs[k]}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveKey(k)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Add Custom Attribute */}
      <form onSubmit={handleAddCustom} className="flex gap-2 max-w-lg pt-1">
        <input
          type="text"
          value={customKey}
          onChange={(e) => setCustomKey(e.target.value)}
          placeholder="Property (e.g. PEI Rating)"
          className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#F26522]"
        />
        <input
          type="text"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Value (e.g. Class 4)"
          className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:outline-none focus:border-[#F26522]"
        />
        <button
          type="submit"
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors shrink-0"
        >
          Add Spec
        </button>
      </form>
    </div>
  );
}
