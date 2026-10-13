"use client";

import React, { useState, useEffect, useId } from "react";
import { Scale, ChevronDown, Sparkles } from "lucide-react";

export interface WeightPreset {
  label: string;
  value: string; // in kg
  displayUnit?: string;
}

export const COMMON_WEIGHT_PRESETS: WeightPreset[] = [
  { label: "50 kg (Cement / Mortar Bag)", value: "50" },
  { label: "40 kg (Bulk Supply Pack)", value: "40" },
  { label: "25 kg (Tile Adhesive / Putty)", value: "25" },
  { label: "20 kg (Paint / Liquid Bucket)", value: "20" },
  { label: "15 kg (Medium Pouch / Bucket)", value: "15" },
  { label: "10 kg (Pouch / Can)", value: "10" },
  { label: "5 kg (Can / Retail Box)", value: "5" },
  { label: "2 kg (Small Pack / Fasteners)", value: "2" },
  { label: "1 kg (Standard Retail Pack)", value: "1" },
  { label: "500 gm (0.5 kg)", value: "0.5" },
  { label: "250 gm (0.25 kg)", value: "0.25" },
  { label: "100 gm (0.1 kg)", value: "0.1" },
  { label: "1 Quintal (100 kg)", value: "100" },
  { label: "1 Ton (1000 kg - Steel / Sand)", value: "1000" },
];

export const WEIGHT_UNIT_OPTIONS = [
  { value: "kg", label: "kg (Kilogram)", toKg: 1 },
  { value: "gm", label: "gm (Gram)", toKg: 0.001 },
  { value: "ton", label: "Ton (Metric Ton)", toKg: 1000 },
  { value: "quintal", label: "Quintal (100 kg)", toKg: 100 },
  { value: "lbs", label: "lbs (Pounds)", toKg: 0.453592 },
];

interface WeightSelectorInputProps {
  value: string; // Stored standard weight in kg
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  compact?: boolean;
  disabled?: boolean;
  helperText?: string;
}

export default function WeightSelectorInput({
  value,
  onChange,
  label = "Weight",
  placeholder = "e.g. 2.4",
  compact = false,
  disabled = false,
  helperText,
}: WeightSelectorInputProps) {
  const selectId = useId();
  const inputId = useId();

  // Internal state for chosen unit (defaults to kg)
  const [selectedUnit, setSelectedUnit] = useState<string>("kg");
  const [typedValue, setTypedValue] = useState<string>(value || "");
  const [presetDropdown, setPresetDropdown] = useState<string>("");

  // Sync when external value changes
  useEffect(() => {
    if (value !== undefined) {
      if (selectedUnit === "kg") {
        setTypedValue(value);
      } else if (selectedUnit === "gm") {
        const num = parseFloat(value);
        setTypedValue(!isNaN(num) ? String(num * 1000) : value);
      } else if (selectedUnit === "ton") {
        const num = parseFloat(value);
        setTypedValue(!isNaN(num) ? String(num / 1000) : value);
      } else if (selectedUnit === "quintal") {
        const num = parseFloat(value);
        setTypedValue(!isNaN(num) ? String(num / 100) : value);
      } else {
        setTypedValue(value);
      }

      // Check if matches a preset
      const matched = COMMON_WEIGHT_PRESETS.find((p) => p.value === value);
      setPresetDropdown(matched ? matched.value : value ? "custom" : "");
    }
  }, [value, selectedUnit]);

  // Handle Preset Dropdown Selection
  const handlePresetSelect = (presetVal: string) => {
    setPresetDropdown(presetVal);
    if (!presetVal) {
      onChange("");
      setTypedValue("");
      return;
    }
    if (presetVal === "custom") {
      // Focus custom typing mode
      return;
    }
    setSelectedUnit("kg");
    setTypedValue(presetVal);
    onChange(presetVal);
  };

  // Handle Typed Input Change
  const handleTypedChange = (valStr: string) => {
    setTypedValue(valStr);
    const unitDef = WEIGHT_UNIT_OPTIONS.find((u) => u.value === selectedUnit) || WEIGHT_UNIT_OPTIONS[0];
    const num = parseFloat(valStr);
    if (!isNaN(num) && num >= 0) {
      const kgVal = (num * unitDef.toKg).toFixed(4).replace(/\.?0+$/, "");
      onChange(kgVal);
      // Check if matches preset
      const matched = COMMON_WEIGHT_PRESETS.find((p) => p.value === kgVal);
      setPresetDropdown(matched ? matched.value : "custom");
    } else if (valStr === "") {
      onChange("");
      setPresetDropdown("");
    } else {
      onChange(valStr);
    }
  };

  // Handle Unit Change
  const handleUnitChange = (newUnit: string) => {
    setSelectedUnit(newUnit);
    const currentNum = parseFloat(value);
    if (!isNaN(currentNum)) {
      const unitDef = WEIGHT_UNIT_OPTIONS.find((u) => u.value === newUnit) || WEIGHT_UNIT_OPTIONS[0];
      const convertedDisplay = (currentNum / unitDef.toKg).toFixed(4).replace(/\.?0+$/, "");
      setTypedValue(convertedDisplay);
    }
  };

  if (compact) {
    return (
      <div className="space-y-1 min-w-0">
        {label && (
          <div className="flex items-center justify-between gap-1">
            <label htmlFor={inputId} className="text-[10px] font-bold text-gray-500 block truncate">
              {label}
            </label>
            {value && (
              <span className="text-[9px] font-black text-[#F26522] bg-orange-50 px-1 rounded truncate">
                {value} kg
              </span>
            )}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-center gap-1">
          {/* Quick Preset Dropdown */}
          <select
            id={selectId}
            value={presetDropdown}
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={disabled}
            className="w-full sm:w-1/2 px-1.5 py-1.5 rounded-xl border border-gray-200 text-[11px] font-bold text-gray-700 bg-white focus:outline-none focus:border-[#F26522] cursor-pointer truncate"
            title="Choose from common weight presets"
          >
            <option value="">Choose ▾</option>
            <option value="custom">Type Custom...</option>
            {COMMON_WEIGHT_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Type Input */}
          <div className="relative w-full sm:w-1/2">
            <input
              id={inputId}
              type="number"
              step="any"
              min="0"
              placeholder={placeholder}
              value={typedValue}
              onChange={(e) => handleTypedChange(e.target.value)}
              disabled={disabled}
              className="w-full pl-2 pr-6 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-[#F26522]"
            />
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 pointer-events-none">
              kg
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <Scale size={13} className="text-[#F26522]" />
          <span>{label}</span>
          {value && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-orange-100 text-[#F26522]">
              {value} kg
            </span>
          )}
        </label>
        <span className="text-[10px] text-gray-400 font-medium">Dropdown se choose krein ya type krein</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* 1. Choose from Dropdown */}
        <div className="relative">
          <select
            id={selectId}
            value={presetDropdown}
            onChange={(e) => handlePresetSelect(e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-800 bg-white focus:outline-none focus:border-[#F26522] cursor-pointer appearance-none pr-8"
          >
            <option value="">▾ Choose Weight Preset...</option>
            <option value="custom">✏️ Type Custom Weight (Vendor Input)</option>
            <optgroup label="Standard Pack Sizes">
              {COMMON_WEIGHT_PRESETS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>

        {/* 2. Type Custom Value + Unit Selector */}
        <div className="flex items-center gap-1.5">
          <input
            id={inputId}
            type="number"
            step="any"
            min="0"
            placeholder={placeholder}
            value={typedValue}
            onChange={(e) => handleTypedChange(e.target.value)}
            disabled={disabled}
            className="flex-1 px-3 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-900 bg-white focus:outline-none focus:border-[#F26522]"
          />

          <select
            value={selectedUnit}
            onChange={(e) => handleUnitChange(e.target.value)}
            disabled={disabled}
            className="px-2.5 py-2.5 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-white focus:outline-none focus:border-[#F26522] cursor-pointer"
            title="Weight measurement unit"
          >
            {WEIGHT_UNIT_OPTIONS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {helperText ? (
        <p className="text-[11px] text-gray-500 mt-0.5">{helperText}</p>
      ) : (
        value && (
          <p className="text-[10px] text-gray-400">
            Standard Net Packed Weight: <strong className="text-gray-700">{value} kg</strong> (used for automated logistics &amp; parcel rates)
          </p>
        )
      )}
    </div>
  );
}
