"use client";

import React, { useState, useEffect } from "react";
import { Palette, Check, Sparkles, Plus, X, CheckSquare, Square } from "lucide-react";

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
  onChange: (colorName: string, colorHex?: string, colorList?: string[]) => void;
  label?: string;
  helperText?: string;
  allowCustom?: boolean;
  nameGroup?: string;
  defaultMulti?: boolean;
}

export default function ColorRadioSelector({
  value,
  onChange,
  label = "Select Colour",
  helperText = "Choose from 14+ standard colours or enter custom shade",
  allowCustom = true,
  nameGroup = "color-radio-group",
  defaultMulti = false,
}: ColorRadioSelectorProps) {
  // Parse incoming value into an array of selected color names
  const parseColors = (val: string): string[] => {
    if (!val || typeof val !== "string") return [];
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const initialList = parseColors(value);
  const isInitiallyMulti = defaultMulti || initialList.length > 1;

  const [isMultiMode, setIsMultiMode] = useState<boolean>(isInitiallyMulti);
  const [selectedList, setSelectedList] = useState<string[]>(initialList);
  const [customColorName, setCustomColorName] = useState("");
  const [customHex, setCustomHex] = useState("#F26522");

  // Keep internal list in sync if parent value changes externally
  useEffect(() => {
    const list = parseColors(value);
    setSelectedList(list);
    if (list.length > 1 && !isMultiMode) {
      setIsMultiMode(true);
    }
  }, [value]);

  const emitChange = (newList: string[]) => {
    setSelectedList(newList);
    const joined = newList.join(", ");
    // Find hex of first selected standard color, or fallback to customHex
    const firstStandard = STANDARD_14_COLORS.find(
      (c) => newList[0] && c.name.toLowerCase() === newList[0].toLowerCase()
    );
    const primaryHex = firstStandard?.hex || customHex;
    onChange(joined, primaryHex, newList);
  };

  // Handle single click selection
  const handleSelectSingle = (col: StandardColorOption) => {
    emitChange([col.name]);
  };

  // Handle multi toggle selection
  const handleToggleMulti = (colName: string) => {
    const exists = selectedList.some((c) => c.toLowerCase() === colName.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = selectedList.filter((c) => c.toLowerCase() !== colName.toLowerCase());
    } else {
      updated = [...selectedList, colName];
    }
    emitChange(updated);
  };

  // Switch between Single and Multi mode
  const handleModeToggle = (multi: boolean) => {
    setIsMultiMode(multi);
    if (!multi && selectedList.length > 1) {
      // Collapse to first selected color
      emitChange([selectedList[0]]);
    }
  };

  // Select all standard colors
  const handleSelectAll = () => {
    const allNames = STANDARD_14_COLORS.map((c) => c.name);
    emitChange(allNames);
  };

  // Clear all
  const handleClearAll = () => {
    emitChange([]);
  };

  // Add custom color
  const handleAddCustomColor = () => {
    const trimmed = customColorName.trim();
    if (!trimmed) return;
    if (isMultiMode) {
      if (!selectedList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        emitChange([...selectedList, trimmed]);
      }
      setCustomColorName("");
    } else {
      emitChange([trimmed]);
    }
  };

  // Remove a color chip
  const handleRemoveColor = (colName: string) => {
    const updated = selectedList.filter((c) => c.toLowerCase() !== colName.toLowerCase());
    emitChange(updated);
  };

  return (
    <div className="space-y-3">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-black text-gray-800 flex items-center gap-1.5">
          <Palette size={15} className="text-[#F26522]" />
          <span>{label}</span>
          {selectedList.length > 0 && (
            <span className="ml-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#F26522]">
              {selectedList.length} {selectedList.length === 1 ? "Colour" : "Colours"}
            </span>
          )}
        </label>

        {/* Mode Switcher Pill */}
        <div className="flex items-center gap-1 p-0.5 bg-gray-100 rounded-xl border border-gray-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeToggle(false)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              !isMultiMode
                ? "bg-white text-gray-900 shadow-2xs font-extrabold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Single Colour
          </button>
          <button
            type="button"
            onClick={() => handleModeToggle(true)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              isMultiMode
                ? "bg-[#052a51] text-white shadow-2xs font-extrabold"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <CheckSquare size={12} />
            <span>Multi-Colour (Select Multiple)</span>
          </button>
        </div>
      </div>

      {/* Helper text & Quick Multi Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
        <p className="text-[11px] text-gray-500 font-medium">
          {isMultiMode
            ? "Click multiple colour swatches to select all available colour variants at once."
            : helperText}
        </p>
        {isMultiMode && (
          <div className="flex items-center gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[#052a51] hover:underline font-bold cursor-pointer"
            >
              Select All Standard
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-red-600 hover:underline font-bold cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Selected Colors Chips Banner (When multiple or at least 1 color selected) */}
      {selectedList.length > 0 && (
        <div className="p-2.5 rounded-2xl bg-orange-50/60 border border-orange-200 flex flex-wrap items-center gap-1.5 animate-in fade-in">
          <span className="text-[11px] font-bold text-gray-700 mr-1 flex items-center gap-1">
            <Check size={12} className="text-[#F26522]" /> Selected:
          </span>
          {selectedList.map((colName) => {
            const std = STANDARD_14_COLORS.find(
              (c) => c.name.toLowerCase() === colName.toLowerCase()
            );
            return (
              <span
                key={colName}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-orange-200 text-xs font-bold text-gray-900 shadow-2xs animate-in zoom-in-95"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                  style={{ background: std?.gradient || std?.hex || customHex }}
                />
                <span>{colName}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveColor(colName)}
                  className="text-gray-400 hover:text-red-600 p-0.5 rounded cursor-pointer"
                  title="Remove this colour"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Standard 14 Colours Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {STANDARD_14_COLORS.map((col) => {
          const isSelected = selectedList.some(
            (c) => c.toLowerCase() === col.name.toLowerCase()
          );
          const inputId = `${nameGroup}-${col.name.replace(/\s+/g, "-")}`;

          return (
            <button
              key={col.name}
              type="button"
              onClick={() => {
                if (isMultiMode) {
                  handleToggleMulti(col.name);
                } else {
                  handleSelectSingle(col);
                }
              }}
              className={`relative flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none text-left ${
                isSelected
                  ? "border-[#F26522] bg-orange-50/70 shadow-xs ring-1 ring-[#F26522]"
                  : "border-gray-200 bg-white hover:border-orange-200 hover:bg-gray-50/80"
              }`}
            >
              {/* Checkbox / Radio Indicator */}
              <div
                className={`w-4 h-4 rounded-${isMultiMode ? "md" : "full"} border flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "border-[#F26522] bg-[#F26522] text-white" : "border-gray-300 bg-white"
                }`}
              >
                {isSelected && (
                  isMultiMode ? <Check size={11} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
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
            </button>
          );
        })}
      </div>

      {/* Custom Colour Option & Input */}
      {allowCustom && (
        <div className="p-3 rounded-2xl border border-gray-200 bg-gray-50/70 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#F26522]" />
              <span className="text-xs font-bold text-gray-900">
                Custom Shade / Special Colour
              </span>
            </div>

            {/* Custom Interactive Color Picker & Text Input */}
            <div className="flex items-center gap-2 flex-1 max-w-md">
              {/* Native Color Picker */}
              <div className="relative shrink-0 flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 shadow-2xs">
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
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
                placeholder="e.g. Italian Calacatta Gold, Teak Finish..."
                value={customColorName}
                onChange={(e) => setCustomColorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddCustomColor();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522]"
              />

              <button
                type="button"
                onClick={handleAddCustomColor}
                disabled={!customColorName.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
