"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Palette,
  Sparkles,
  Grid,
  Search,
  Check,
  CheckCircle2,
  Pipette,
  Layers,
} from "lucide-react";
import {
  CATALOG_COLOURS,
  CATALOG_GRADIENTS,
  SPECTRUM_COLORS,
  CatalogColour,
  CatalogGradient,
  resolveColorHex,
} from "@/lib/catalog";

interface ColorPalettePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (colorName: string, colorHex: string) => void;
  currentColorName?: string;
  currentColorHex?: string;
  title?: string;
}

export default function ColorPalettePickerModal({
  isOpen,
  onClose,
  onSelectColor,
  currentColorName = "",
  currentColorHex = "#F26522",
  title = "Select Color & Finish",
}: ColorPalettePickerModalProps) {
  const [activeTab, setActiveTab] = useState<"solid" | "gradient" | "spectrum">("solid");
  const [search, setSearch] = useState("");
  const [customHex, setCustomHex] = useState(currentColorHex || "#F26522");
  const [customName, setCustomName] = useState(currentColorName || "Custom Shade");

  useEffect(() => {
    if (isOpen) {
      setCustomHex(currentColorHex || resolveColorHex(currentColorName) || "#F26522");
      setCustomName(currentColorName || "Custom Shade");
      setSearch("");
    }
  }, [isOpen, currentColorName, currentColorHex]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredSolids = CATALOG_COLOURS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.hexCode.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGradients = CATALOG_GRADIENTS.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    g.colors[0].toLowerCase().includes(search.toLowerCase()) ||
    g.colors[1].toLowerCase().includes(search.toLowerCase())
  );

  const handleApplyCustom = () => {
    let cleanHex = customHex.trim();
    if (!cleanHex.startsWith("#")) {
      cleanHex = "#" + cleanHex;
    }
    const finalName = customName.trim() || `Custom (${cleanHex.toUpperCase()})`;
    onSelectColor(finalName, cleanHex);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100/80 text-[#F26522] flex items-center justify-center shadow-xs">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-[#052a51]">{title}</h3>
              <p className="text-xs text-gray-500 font-medium">Solid shades, dual gradients & spectrum graph</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/60 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3 Interactive Mode Tabs */}
        <div className="flex p-1.5 mx-4 mt-3 bg-gray-100/90 rounded-xl gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("solid")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "solid"
                ? "bg-white text-[#F26522] shadow-xs"
                : "text-gray-600 hover:text-[#052a51]"
            }`}
          >
            <Palette size={14} />
            <span>Solid Shades</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("gradient")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "gradient"
                ? "bg-white text-[#F26522] shadow-xs"
                : "text-gray-600 hover:text-[#052a51]"
            }`}
          >
            <Sparkles size={14} />
            <span>Dual Gradient</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("spectrum")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "spectrum"
                ? "bg-white text-[#F26522] shadow-xs"
                : "text-gray-600 hover:text-[#052a51]"
            }`}
          >
            <Grid size={14} />
            <span>Color Matrix</span>
          </button>
        </div>

        {/* Search Filter for Solid & Gradient */}
        {activeTab !== "spectrum" && (
          <div className="px-4 pt-3 shrink-0">
            <div className="relative flex items-center">
              <Search size={15} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  activeTab === "solid"
                    ? "Search solid colors (e.g. White, Gold, Teak)..."
                    : "Search gradients (e.g. Carrara, Gold Vein)..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-[#052a51] placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white transition-all font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Scroll Content Area */}
        <div className="p-4 overflow-y-auto flex-1 custom-scrollbar min-h-[300px]">
          {/* TAB 1: SOLID COLORS */}
          {activeTab === "solid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredSolids.length > 0 ? (
                filteredSolids.map((item: CatalogColour) => {
                  const isSelected =
                    currentColorName.toLowerCase().trim() === item.name.toLowerCase().trim() ||
                    currentColorHex.toLowerCase().trim() === item.hexCode.toLowerCase().trim();

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        onSelectColor(item.name, item.hexCode);
                        onClose();
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-50/80 border-[#F26522] ring-1 ring-[#F26522]/30"
                          : "bg-gray-50/60 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-black/10 shadow-xs flex items-center justify-center shrink-0 relative"
                        style={{ backgroundColor: item.hexCode }}
                      >
                        {isSelected && (
                          <Check
                            size={14}
                            className={item.textColor === "light" ? "text-white" : "text-[#052a51]"}
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-[#F26522]" : "text-[#052a51]"
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono font-medium">
                          {item.hexCode}
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-[#F26522] shrink-0" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="col-span-2 py-8 text-center text-xs text-gray-400 font-medium">
                  No matching colors found for &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUAL GRADIENTS */}
          {activeTab === "gradient" && (
            <div className="grid grid-cols-1 gap-2.5">
              {filteredGradients.length > 0 ? (
                filteredGradients.map((item: CatalogGradient) => {
                  const isSelected =
                    currentColorName.toLowerCase().trim() === item.name.toLowerCase().trim();

                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        onSelectColor(item.name, item.colors[0]);
                        onClose();
                      }}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-orange-50/80 border-[#F26522] ring-1 ring-[#F26522]/30"
                          : "bg-gray-50/60 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {/* Dual-Tone Split Bubble */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex border border-black/10 shadow-xs shrink-0">
                        <div className="w-1/2 h-full" style={{ backgroundColor: item.colors[0] }} />
                        <div className="w-1/2 h-full" style={{ backgroundColor: item.colors[1] }} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-xs font-bold truncate ${
                            isSelected ? "text-[#F26522]" : "text-[#052a51]"
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                            <span
                              className="w-2 h-2 rounded-full border border-black/10"
                              style={{ backgroundColor: item.colors[0] }}
                            />
                            {item.colors[0]}
                          </span>
                          <span className="text-[10px] text-gray-300">+</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                            <span
                              className="w-2 h-2 rounded-full border border-black/10"
                              style={{ backgroundColor: item.colors[1] }}
                            />
                            {item.colors[1]}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 size={18} className="text-[#F26522] shrink-0" />
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:border-[#F26522] hover:text-[#F26522]">
                          Select
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-gray-400 font-medium">
                  No matching gradients found for &ldquo;{search}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COLOR SPECTRUM MATRIX & CUSTOM COLOR */}
          {activeTab === "spectrum" && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-2">
                  2D Color Spectrum Matrix (Tap any shade):
                </p>
                <div className="p-3 bg-gray-100/80 rounded-xl border border-gray-200 space-y-1.5">
                  {SPECTRUM_COLORS.map((row, rowIdx) => (
                    <div key={rowIdx} className="flex gap-1.5 justify-between">
                      {row.map((hex, colIdx) => {
                        const isSelected = customHex.toLowerCase() === hex.toLowerCase();
                        return (
                          <button
                            key={colIdx}
                            type="button"
                            onClick={() => {
                              setCustomHex(hex);
                              setCustomName(`Shade (${hex.toUpperCase()})`);
                            }}
                            className={`flex-1 h-7 rounded-md border transition-all cursor-pointer relative flex items-center justify-center ${
                              isSelected
                                ? "scale-110 border-black shadow-md z-10 ring-2 ring-white"
                                : "border-black/10 hover:scale-105"
                            }`}
                            style={{ backgroundColor: hex }}
                            title={hex}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview & Custom Inputs */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div
                    className="w-16 h-16 rounded-2xl border-2 border-white shadow-md relative overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: customHex }}
                  >
                    <input
                      type="color"
                      value={customHex.startsWith("#") && customHex.length === 7 ? customHex : "#F26522"}
                      onChange={(e) => {
                        setCustomHex(e.target.value);
                        setCustomName(`Custom (${e.target.value.toUpperCase()})`);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      title="Click for Native Color Picker"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                    <Pipette size={10} /> Pick Eye
                  </span>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Color / Shade Name:
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder="e.g. Royal Emerald Green, Terracotta Bronze"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Hex Color Code:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customHex}
                        onChange={(e) => setCustomHex(e.target.value)}
                        placeholder="#FFFFFF"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-[#052a51] uppercase focus:outline-none focus:border-[#F26522]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#F26522] hover:bg-[#d95314] text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-98 cursor-pointer"
              >
                <Check size={16} />
                <span>Apply Custom Color ({customHex})</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span>Active Selection: <strong className="text-[#052a51]">{customName || "None"}</strong></span>
          <span className="font-mono font-bold text-[#F26522]">{customHex}</span>
        </div>
      </div>
    </div>
  );
}
