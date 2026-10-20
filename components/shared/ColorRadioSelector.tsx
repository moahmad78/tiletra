"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  Check,
  Sparkles,
  Plus,
  X,
  CheckSquare,
  Square,
  Camera,
  Upload,
  Image as ImageIcon,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { resolveColorHex } from "@/lib/catalog";

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
  onChange: (
    colorName: string,
    colorHex?: string,
    colorList?: string[],
    colorImageMap?: Record<string, string>,
    colorDataMap?: {
      images: Record<string, string>;
      rates: Record<string, string>;
      descriptions: Record<string, string>;
    }
  ) => void;
  label?: string;
  helperText?: string;
  allowCustom?: boolean;
  nameGroup?: string;
  defaultMulti?: boolean;
  initialColorImages?: Record<string, string>;
  onColorImagesChange?: (colorImageMap: Record<string, string>) => void;
  initialColorRates?: Record<string, string>;
  onColorRatesChange?: (colorRatesMap: Record<string, string>) => void;
  initialColorDescriptions?: Record<string, string>;
  onColorDescriptionsChange?: (colorDescriptionsMap: Record<string, string>) => void;
}

export default function ColorRadioSelector({
  value,
  onChange,
  label = "Select Colour",
  helperText = "Choose from 14+ standard colours or enter custom shade",
  allowCustom = true,
  nameGroup = "color-radio-group",
  defaultMulti = false,
  initialColorImages,
  onColorImagesChange,
  initialColorRates,
  onColorRatesChange,
  initialColorDescriptions,
  onColorDescriptionsChange,
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

  // Colour-wise image, rate & description binding (All optional)
  const [colorImages, setColorImages] = useState<Record<string, string>>(initialColorImages || {});
  const [colorRates, setColorRates] = useState<Record<string, string>>(initialColorRates || {});
  const [colorDescriptions, setColorDescriptions] = useState<Record<string, string>>(initialColorDescriptions || {});

  const [pendingColorForImage, setPendingColorForImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [manualUrlInput, setManualUrlInput] = useState<string>("");
  const [modalRateInput, setModalRateInput] = useState<string>("");
  const [modalDescInput, setModalDescInput] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep internal list in sync if parent value changes externally
  useEffect(() => {
    const list = parseColors(value);
    setSelectedList(list);
    if (list.length > 1 && !isMultiMode) {
      setIsMultiMode(true);
    }
  }, [value]);

  useEffect(() => {
    if (initialColorImages) {
      setColorImages(initialColorImages);
    }
  }, [initialColorImages]);

  useEffect(() => {
    if (initialColorRates) {
      setColorRates(initialColorRates);
    }
  }, [initialColorRates]);

  useEffect(() => {
    if (initialColorDescriptions) {
      setColorDescriptions(initialColorDescriptions);
    }
  }, [initialColorDescriptions]);

  const emitChange = (
    newList: string[],
    updatedImages = colorImages,
    updatedRates = colorRates,
    updatedDescs = colorDescriptions
  ) => {
    setSelectedList(newList);
    const joined = newList.join(", ");
    const firstStandard = STANDARD_14_COLORS.find(
      (c) => newList[0] && c.name.toLowerCase() === newList[0].toLowerCase()
    );
    const primaryHex = firstStandard?.hex || customHex;
    onChange(joined, primaryHex, newList, updatedImages, {
      images: updatedImages,
      rates: updatedRates,
      descriptions: updatedDescs,
    });
    if (onColorImagesChange) {
      onColorImagesChange(updatedImages);
    }
    if (onColorRatesChange) {
      onColorRatesChange(updatedRates);
    }
    if (onColorDescriptionsChange) {
      onColorDescriptionsChange(updatedDescs);
    }
  };

  // Open customization modal for a colour
  const openColorModal = (colName: string) => {
    setPendingColorForImage(colName);
    setModalRateInput(colorRates[colName] !== undefined ? String(colorRates[colName]) : "");
    setModalDescInput(colorDescriptions[colName] || "");
    setManualUrlInput("");
  };

  const handleCloseModal = () => {
    setPendingColorForImage(null);
    setManualUrlInput("");
  };

  // Save all optional modal details (Image, Rate, Description)
  const handleSaveModalDetails = () => {
    if (!pendingColorForImage) return;
    const colName = pendingColorForImage;

    const updatedImages = { ...colorImages };
    const updatedRates = { ...colorRates };
    const updatedDescs = { ...colorDescriptions };

    if (manualUrlInput.trim()) {
      updatedImages[colName] = manualUrlInput.trim();
    }

    if (modalRateInput.trim()) {
      updatedRates[colName] = modalRateInput.trim();
    } else {
      delete updatedRates[colName];
    }

    if (modalDescInput.trim()) {
      updatedDescs[colName] = modalDescInput.trim();
    } else {
      delete updatedDescs[colName];
    }

    setColorImages(updatedImages);
    setColorRates(updatedRates);
    setColorDescriptions(updatedDescs);

    setPendingColorForImage(null);
    setManualUrlInput("");

    emitChange(selectedList, updatedImages, updatedRates, updatedDescs);
    toast.success(`Details saved for "${colName}"!`);
  };

  // Upload photo handler for a specific colour
  const handleUploadColorImage = async (colorName: string, file: File) => {
    if (!file) return;
    try {
      setIsUploadingImage(true);
      let finalUrl = "";
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && contentType.includes("application/json")) {
          const data = await res.json();
          if (data.success && data.url) {
            finalUrl = data.url;
          }
        }
      } catch (err) {
        console.warn("Upload fetch error, using local fallback:", err);
      }

      if (!finalUrl) {
        finalUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const updatedMap = {
        ...colorImages,
        [colorName]: finalUrl,
      };
      setColorImages(updatedMap);
      setPendingColorForImage(null);
      setManualUrlInput("");
      emitChange(selectedList, updatedMap);
      toast.success(`Photo attached for "${colorName}"!`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to upload image");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Attach manual URL for a colour
  const handleAttachUrl = (colorName: string) => {
    const trimmed = manualUrlInput.trim();
    if (!trimmed) return;
    const updatedMap = {
      ...colorImages,
      [colorName]: trimmed,
    };
    setColorImages(updatedMap);
    setPendingColorForImage(null);
    setManualUrlInput("");
    emitChange(selectedList, updatedMap);
    toast.success(`Photo attached for "${colorName}"!`);
  };

  // Remove photo from a colour
  const handleRemoveColorImage = (colorName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedMap = { ...colorImages };
    delete updatedMap[colorName];
    setColorImages(updatedMap);
    emitChange(selectedList, updatedMap, colorRates, colorDescriptions);
    toast.info(`Photo removed for "${colorName}"`);
  };

  // Handle single click selection
  const handleSelectSingle = (col: StandardColorOption) => {
    emitChange([col.name], colorImages, colorRates, colorDescriptions);
    openColorModal(col.name);
  };

  // Handle multi toggle selection
  const handleToggleMulti = (colName: string) => {
    const exists = selectedList.some((c) => c.toLowerCase() === colName.toLowerCase());
    let updated: string[];
    if (exists) {
      updated = selectedList.filter((c) => c.toLowerCase() !== colName.toLowerCase());
      emitChange(updated, colorImages, colorRates, colorDescriptions);
    } else {
      updated = [...selectedList, colName];
      emitChange(updated, colorImages, colorRates, colorDescriptions);
      openColorModal(colName);
    }
  };

  // Switch between Single and Multi mode
  const handleModeToggle = (multi: boolean) => {
    setIsMultiMode(multi);
    if (!multi && selectedList.length > 1) {
      emitChange([selectedList[0]], colorImages, colorRates, colorDescriptions);
    }
  };

  // Select all standard colors
  const handleSelectAll = () => {
    const allNames = STANDARD_14_COLORS.map((c) => c.name);
    emitChange(allNames, colorImages, colorRates, colorDescriptions);
  };

  // Clear all
  const handleClearAll = () => {
    emitChange([], colorImages, colorRates, colorDescriptions);
  };

  // Add custom color
  const handleAddCustomColor = () => {
    const trimmed = customColorName.trim();
    if (!trimmed) return;
    if (isMultiMode) {
      if (!selectedList.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
        const upd = [...selectedList, trimmed];
        emitChange(upd, colorImages, colorRates, colorDescriptions);
        openColorModal(trimmed);
      }
      setCustomColorName("");
    } else {
      emitChange([trimmed], colorImages, colorRates, colorDescriptions);
      openColorModal(trimmed);
    }
  };

  // Remove a color chip and its associated data
  const handleRemoveColor = (colName: string) => {
    const updated = selectedList.filter((c) => c.toLowerCase() !== colName.toLowerCase());
    const updatedImages = { ...colorImages };
    const updatedRates = { ...colorRates };
    const updatedDescs = { ...colorDescriptions };
    delete updatedImages[colName];
    delete updatedRates[colName];
    delete updatedDescs[colName];
    setColorImages(updatedImages);
    setColorRates(updatedRates);
    setColorDescriptions(updatedDescs);
    emitChange(updated, updatedImages, updatedRates, updatedDescs);
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

        {/* Mode Switcher Toggle: Single vs Multi-Select */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl p-0.5 bg-gray-100 border border-gray-200">
            <button
              type="button"
              onClick={() => handleModeToggle(false)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                !isMultiMode
                  ? "bg-white text-[#052a51] shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Single
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle(true)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isMultiMode
                  ? "bg-[#052a51] text-white shadow-2xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span>Multi-Select</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-gray-900 font-extrabold uppercase">
                New
              </span>
            </button>
          </div>

          {/* Quick Select All / Clear All (Multi-Mode only) */}
          {isMultiMode && (
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[#F26522] hover:underline font-bold px-1.5 py-0.5 rounded cursor-pointer"
                title="Select all standard colours"
              >
                All
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-red-600 hover:underline font-medium px-1.5 py-0.5 rounded cursor-pointer"
                title="Clear all selections"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {helperText && <p className="text-[11px] text-gray-500">{helperText}</p>}

      {/* Selected Colours Badges with Image, Rate & Description Info */}
      {selectedList.length > 0 && (
        <div className="p-3 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-600">
            <span>Selected Colours &amp; Configurations:</span>
            <span className="text-[10px] text-gray-400 font-medium">
              Click &quot;Edit / Details&quot; to configure image, rate or description
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedList.map((colName) => {
              const matchedStandard = STANDARD_14_COLORS.find(
                (c) => c.name.toLowerCase() === colName.toLowerCase()
              );
              const hex = matchedStandard?.hex || resolveColorHex(colName) || customHex;
              const hasImage = Boolean(colorImages[colName]);
              const rateVal = colorRates[colName];
              const descVal = colorDescriptions[colName];

              return (
                <div
                  key={colName}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-orange-200/90 text-xs font-bold text-gray-800 shadow-2xs transition-all hover:border-orange-300"
                >
                  {/* Solid Swatch Dot */}
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ backgroundColor: hex }}
                  />

                  <span>{colName}</span>

                  {/* Optional Custom Rate Tag */}
                  {rateVal && (
                    <span
                      className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono font-bold"
                      title={`Custom rate for ${colName}: ₹${rateVal}`}
                    >
                      ₹{rateVal}
                    </span>
                  )}

                  {/* Optional Description Tag */}
                  {descVal && (
                    <span
                      className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-medium max-w-[110px] truncate"
                      title={`Description: ${descVal}`}
                    >
                      📝 {descVal}
                    </span>
                  )}

                  {/* Photo Thumbnail */}
                  {hasImage ? (
                    <div className="flex items-center gap-1 pl-1 border-l border-gray-200 ml-0.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={colorImages[colName]}
                        alt={colName}
                        className="w-5 h-5 rounded-md object-cover border border-emerald-400 shrink-0"
                      />
                    </div>
                  ) : null}

                  {/* Edit / Details Modal Trigger Button */}
                  <button
                    type="button"
                    onClick={() => openColorModal(colName)}
                    className="ml-1 px-1.5 py-0.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-[#F26522] text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    title={`Edit image, rate or description for ${colName}`}
                  >
                    <Camera size={10} />
                    <span>{hasImage || rateVal || descVal ? "Edit" : "+ Details"}</span>
                  </button>

                  {/* Remove this color button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(colName)}
                    className="text-gray-400 hover:text-rose-600 p-0.5 rounded cursor-pointer ml-0.5"
                    title="Remove this colour"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Standard 14 Colours Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {STANDARD_14_COLORS.map((col) => {
          const isSelected = selectedList.some(
            (c) => c.toLowerCase() === col.name.toLowerCase()
          );
          const hasImage = Boolean(colorImages[col.name]);
          const hasRate = Boolean(colorRates[col.name]);

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

              {/* Pure Solid Color Swatch Dot */}
              <div
                className={`w-4 h-4 rounded-full shrink-0 shadow-2xs ${
                  col.border ? "border border-gray-300" : "border border-black/10"
                }`}
                style={{ background: col.gradient || col.hex }}
              />

              {/* Color Name & Photo/Rate Indicator */}
              <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                <span
                  className={`text-[11px] truncate leading-tight ${
                    isSelected ? "font-bold text-gray-900" : "font-medium text-gray-700"
                  }`}
                  title={col.name}
                >
                  {col.name}
                </span>
                <div className="flex items-center gap-0.5 shrink-0">
                  {hasRate && (
                    <span className="text-[9px] text-emerald-700 font-mono font-bold" title="Custom Rate Set">
                      ₹
                    </span>
                  )}
                  {hasImage && (
                    <span className="text-[9px] text-emerald-600 font-bold" title="Photo attached">
                      📸
                    </span>
                  )}
                </div>
              </div>
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

      {/* ── 📸 COLOUR-WISE IMAGE, RATE & DESCRIPTION MODAL (ALL OPTIONAL) ── */}
      {pendingColorForImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full border border-black/15 shadow-sm shrink-0 flex items-center justify-center"
                  style={{
                    backgroundColor:
                      STANDARD_14_COLORS.find(
                        (c) => c.name.toLowerCase() === pendingColorForImage.toLowerCase()
                      )?.hex || resolveColorHex(pendingColorForImage) || customHex,
                  }}
                />
                <div>
                  <h3 className="text-sm font-black text-[#052a51]">
                    Customize &quot;{pendingColorForImage}&quot;
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Optional Photo, Specific Rate &amp; Description
                  </p>
                </div>
              </div>

              {/* Cut / Close Button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close / Cut Modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Instruction Notice */}
            <div className="bg-orange-50/70 p-3 rounded-2xl border border-orange-200/80 text-xs text-gray-700 leading-relaxed">
              <p>
                Multi-colour select karne par aap <strong>&quot;{pendingColorForImage}&quot;</strong> ke liye specific image upload kar sakte hain, aur agar iska rate ya description alag hai to wo bhi enter kar sakte hain. <span className="font-bold text-[#F26522]">Ye sabhi fields optional hain</span> — aap bina bhare bhi <strong>&quot;Skip&quot;</strong> kar sakte hain.
              </p>
            </div>

            {/* 1. PHOTO SECTION */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera size={13} className="text-[#F26522]" />
                  <span>1. Colour Photo (Optional)</span>
                </span>
                <span className="text-[10px] text-gray-400 font-normal">Upload or paste URL</span>
              </label>

              {/* Existing photo if any */}
              {colorImages[pendingColorForImage] && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={colorImages[pendingColorForImage]}
                      alt={pendingColorForImage}
                      className="w-12 h-12 rounded-xl object-cover border border-emerald-400"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">Photo Attached</span>
                      <span className="text-[10px] text-emerald-700 font-semibold block">✓ Ready for this colour</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveColorImage(pendingColorForImage)}
                    className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </div>
              )}

              {/* File Upload Box */}
              <label
                className={`w-full border-2 border-dashed rounded-2xl p-3.5 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                  isUploadingImage
                    ? "bg-gray-50 border-gray-300"
                    : "border-orange-200 hover:border-[#F26522] bg-orange-50/20 hover:bg-orange-50/50"
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 size={22} className="animate-spin text-[#F26522]" />
                    <span className="text-xs font-bold text-gray-600">Uploading photo...</span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-xl bg-white text-[#F26522] flex items-center justify-center shadow-2xs border border-orange-100">
                      <Camera size={16} />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-gray-900 block">
                        Click to Upload {pendingColorForImage} Photo
                      </span>
                      <span className="text-[10px] text-gray-500 block">
                        PNG, JPG, WEBP up to 5MB (Optional)
                      </span>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  disabled={isUploadingImage}
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadColorImage(pendingColorForImage, f);
                  }}
                />
              </label>

              {/* Direct Image URL Input */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={manualUrlInput}
                  onChange={(e) => setManualUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#F26522]"
                />
                <button
                  type="button"
                  onClick={() => handleAttachUrl(pendingColorForImage)}
                  disabled={!manualUrlInput.trim()}
                  className="px-3 py-1.5 bg-[#052a51] hover:bg-[#073666] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Save URL
                </button>
              </div>
            </div>

            {/* 2. RATE (PRICE) SECTION */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>2. Colour Rate / Selling Price (₹) (Optional)</span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Optional
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 599 (Khali chhodne par standard product rate use hoga)"
                  value={modalRateInput}
                  onChange={(e) => setModalRateInput(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#F26522]"
                />
              </div>
              <p className="text-[10px] text-gray-500">
                Agar is colour ka rate baaki colours se alag hai to yahan rate enter karein.
              </p>
            </div>

            {/* 3. DESCRIPTION SECTION */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>3. Colour Description / Shade Details (Optional)</span>
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Optional
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Glossy marble finish with golden veining, high durability coat..."
                value={modalDescInput}
                onChange={(e) => setModalDescInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#F26522] resize-none"
              />
              <p className="text-[10px] text-gray-500">
                Is shade ki texture, finish ya specific description likhein.
              </p>
            </div>

            {/* Modal Bottom Actions: Skip / Cut vs Save */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                ✕ Skip / Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveModalDetails}
                className="px-5 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-black transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check size={14} strokeWidth={3} />
                <span>Save Details</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
