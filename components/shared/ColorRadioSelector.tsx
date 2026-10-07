"use client";

import React, { useState, useEffect } from "react";
import { Palette, Check, Sparkles } from "lucide-react";

export interface StandardColorOption {
  name: string;
  hex: string;
  gradient?: string;
  border?: boolean;
}

export const STANDARD_14_COLORS: StandardColorOption[] = [
  { name: "White", hex: "#FFFFFF", border: true },
  { name: "Off White / Cream", hex: "#FAF9F6", border: true },
  { name: "Beige / Ivory", hex: "#F5F5DC", border: true },
  { name: "Light Grey", hex: "#D1D5DB" },
  { name: "Charcoal Grey", hex: "#4B5563" },
  { name: "Jet Black", hex: "#111827" },
  { name: "Brown / Walnut", hex: "#78350F" },
  { name: "Natural Teak / Wood", hex: "#C19A6B" },
  { name: "Terracotta / Red", hex: "#DC2626" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Navy Blue", hex: "#1E3A8A" },
  { name: "Emerald Green", hex: "#059669" },
  { name: "Yellow / Gold", hex: "#F59E0B" },
  { name: "Orange", hex: "#F97316" },
  {
    name: "Carrara Marble",
    hex: "#E5E7EB",
    gradient: "linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)",
    border: true,
  },
];

interface ColorRadioSelectorProps {
  value: string;
  onChange: (colorName: string, colorHex?: string) => void;
  label?: string;
  helperText?: string;
  allowCustom?: boolean;
  nameGroup?: string;
}

export default function ColorRadioSelector({
  value,
  onChange,
  label = "Select Colour",
  helperText = "Choose from 12+ standard colours or type custom shade name",
  allowCustom = true,
  nameGroup = "color-radio-group",
}: ColorRadioSelectorProps) {
  // Determine if current value is one of standard colors
  const matchedStandard = STANDARD_14_COLORS.find(
    (c) => c.name.toLowerCase() === (value || "").toLowerCase()
  );

  const isCustomActive = Boolean(value && !matchedStandard);

  const [customColorName, setCustomColorName] = useState(isCustomActive ? value : "");
  const [customHex, setCustomHex] = useState("#F26522");

  useEffect(() => {
    if (value && !STANDARD_14_COLORS.some((c) => c.name.toLowerCase() === value.toLowerCase())) {
      setCustomColorName(value);
    }
  }, [value]);

  const handleSelectStandard = (opt: StandardColorOption) => {
    onChange(opt.name, opt.hex);
  };

  const handleCustomNameChange = (newName: string) => {
    setCustomColorName(newName);
    onChange(newName, customHex);
  };

  const handleCustomHexChange = (newHex: string) => {
    setCustomHex(newHex);
    const finalName = customColorName.trim() || `Custom (${newHex.toUpperCase()})`;
    onChange(finalName, newHex);
  };

  const handleActivateCustom = () => {
    const finalName = customColorName.trim() || "Custom Shade";
    setCustomColorName(finalName);
    onChange(finalName, customHex);
  };

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
            <Palette size={14} className="text-[#F26522]" />
            <span>{label}</span>
          </label>
          {value && (
            <span className="text-[11px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span>Selected:</span>
              <strong className="text-[#F26522]">{value}</strong>
            </span>
          )}
        </div>
      )}

      {helperText && <p className="text-[11px] text-gray-500 font-medium">{helperText}</p>}

      {/* 14 Standard Colours as Radio Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {STANDARD_14_COLORS.map((col) => {
          const isSelected = matchedStandard?.name === col.name;
          const radioId = `${nameGroup}-${col.name.replace(/\s+/g, "-")}`;

          return (
            <label
              key={col.name}
              htmlFor={radioId}
              onClick={() => handleSelectStandard(col)}
              className={`relative flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none text-left ${
                isSelected
                  ? "border-[#F26522] bg-orange-50/70 shadow-xs ring-1 ring-[#F26522]/30"
                  : "border-gray-200 bg-white hover:border-orange-200 hover:bg-gray-50/80"
              }`}
            >
              {/* Actual Radio Input */}
              <input
                type="radio"
                id={radioId}
                name={nameGroup}
                checked={isSelected}
                onChange={() => handleSelectStandard(col)}
                className="sr-only"
              />

              {/* Radio Circle Indicator */}
              <div
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-[#F26522] bg-[#F26522]" : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>

              {/* Color Swatch Dot */}
              <div
                className={`w-4 h-4 rounded-full shrink-0 shadow-2xs ${
                  col.border ? "border border-gray-300" : "border border-black/10"
                }`}
                style={{ background: col.gradient || col.hex }}
              />

              {/* Color Name */}
              <span
                className={`text-[11px] truncate leading-tight ${
                  isSelected ? "font-bold text-gray-900" : "font-medium text-gray-700"
                }`}
                title={col.name}
              >
                {col.name}
              </span>
            </label>
          );
        })}
      </div>

      {/* Custom Colour Option & Input */}
      {allowCustom && (
        <div
          className={`p-3 rounded-2xl border transition-all ${
            isCustomActive
              ? "border-[#F26522] bg-orange-50/50 shadow-2xs ring-1 ring-[#F26522]/20"
              : "border-gray-200 bg-gray-50/70 hover:border-gray-300"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Custom Radio Tile Header */}
            <label
              htmlFor={`${nameGroup}-custom`}
              onClick={handleActivateCustom}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="radio"
                id={`${nameGroup}-custom`}
                name={nameGroup}
                checked={isCustomActive}
                onChange={handleActivateCustom}
                className="sr-only"
              />
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                  isCustomActive ? "border-[#F26522] bg-[#F26522]" : "border-gray-300 bg-white"
                }`}
              >
                {isCustomActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <Sparkles size={14} className="text-[#F26522]" />
              <span className="text-xs font-bold text-gray-900">
                Custom Colour / Special Shade
              </span>
            </label>

            {/* Custom Interactive Color Picker & Text Input */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {/* HTML5 Native Color Swatch Picker */}
              <div className="relative shrink-0 flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-2xs">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => handleCustomHexChange(e.target.value)}
                  className="w-5 h-5 rounded-md cursor-pointer border-0 p-0 bg-transparent"
                  title="Pick RGB / Hex Colour"
                />
                <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">
                  {customHex}
                </span>
              </div>

              {/* Custom Shade Name Input */}
              <input
                type="text"
                placeholder="e.g. Italian Calacatta Gold, Custom RAL 7016..."
                value={customColorName}
                onFocus={handleActivateCustom}
                onChange={(e) => handleCustomNameChange(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
