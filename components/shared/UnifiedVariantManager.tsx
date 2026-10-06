"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Layers,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Check,
  AlertTriangle,
  AlertCircle,
  IndianRupee,
  Package,
  Star,
  Upload,
  Palette,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import type { ProductVariant } from "@/lib/data/products";
import {
  getAttributeOptions,
  createAttributeOption,
  promoteAttributeOptionToGlobal,
  AttributeOptionItem,
} from "@/lib/actions/attributes";
import ColorPalettePickerModal from "@/components/admin/ColorPalettePickerModal";
import { resolveColorHex } from "@/lib/catalog";

export interface UnifiedVariantManagerProps {
  hasVariants: boolean;
  onHasVariantsChange: (hasVariants: boolean) => void;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  vendorId?: string | null;
  baseImages?: string[];
  defaultSellingPrice?: number;
  defaultMrp?: number;
  defaultStock?: number;
  unitOfSale?: string;
  readOnly?: boolean;
}

export interface AttributeSelection {
  type: "unit" | "colour" | "dimension" | "custom";
  name: string; // e.g., "Size/Weight", "Colour", "Dimension", "Grade", "Material"
  values: string[]; // selected values, e.g. ["1 kg", "5 kg", "20 kg"]
}

// Unit family lookup for mismatch warnings
const UNIT_FAMILIES: Record<string, string> = {
  kg: "weight",
  g: "weight",
  gm: "weight",
  mg: "weight",
  ton: "weight",
  l: "volume",
  litre: "volume",
  liter: "volume",
  ml: "volume",
  sqft: "area",
  sqm: "area",
  m: "length",
  cm: "length",
  mm: "length",
  ft: "length",
  inch: "length",
  pcs: "count",
  dozen: "count",
  pack: "count",
  box: "count",
};

function detectUnitFamily(str: string): string | null {
  const lower = str.toLowerCase();
  for (const [unit, family] of Object.entries(UNIT_FAMILIES)) {
    const regex = new RegExp(`\\b${unit}\\b`, "i");
    if (regex.test(lower)) return family;
  }
  return null;
}

export default function UnifiedVariantManager({
  hasVariants,
  onHasVariantsChange,
  variants,
  onChange,
  vendorId,
  baseImages = [],
  defaultSellingPrice = 499,
  defaultMrp = 699,
  defaultStock = 50,
  unitOfSale = "box",
  readOnly = false,
}: UnifiedVariantManagerProps) {
  // Attribute Options from DB
  const [dbOptions, setDbOptions] = useState<AttributeOptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Active Attribute Selections (Max 3)
  const [activeAttributes, setActiveAttributes] = useState<AttributeSelection[]>([
    { type: "unit", name: "Size / Quantity", values: [] },
  ]);

  // Color picker state
  const [colorPickerTargetRow, setColorPickerTargetRow] = useState<number | null>(null);
  const [colorPickerForAttr, setColorPickerForAttr] = useState(false);

  // Custom option addition modal/popover
  const [newOptionModal, setNewOptionModal] = useState<{
    open: boolean;
    type: "unit" | "colour" | "dimension" | "custom";
    name: string;
    value: string;
    hex?: string;
  }>({
    open: false,
    type: "custom",
    name: "Material",
    value: "",
  });

  // Bulk Edit Modal / Input
  const [bulkPriceInput, setBulkPriceInput] = useState<string>("");
  const [bulkMrpInput, setBulkMrpInput] = useState<string>("");
  const [bulkStockInput, setBulkStockInput] = useState<string>("");
  const [showBulkToolbar, setShowBulkToolbar] = useState(false);

  // Load attribute options from backend
  const loadOptions = async () => {
    setLoadingOptions(true);
    try {
      const res = await getAttributeOptions({ vendorId });
      if (res.success) {
        setDbOptions(res.options);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, [vendorId]);

  // Sync initial attribute values from existing variants if any
  useEffect(() => {
    if (variants.length > 0 && activeAttributes[0]?.values.length === 0) {
      const distinctSizes = Array.from(new Set(variants.map((v) => v.size || v.attributeValue).filter(Boolean))) as string[];
      const distinctColors = Array.from(new Set(variants.map((v) => v.color).filter((c) => c && c !== "Default" && c !== "Standard"))) as string[];

      const initialAttrs: AttributeSelection[] = [];
      if (distinctSizes.length > 0) {
        initialAttrs.push({
          type: "unit",
          name: "Size / Quantity",
          values: distinctSizes,
        });
      }
      if (distinctColors.length > 0) {
        initialAttrs.push({
          type: "colour",
          name: "Colour",
          values: distinctColors,
        });
      }
      if (initialAttrs.length > 0) {
        setActiveAttributes(initialAttrs);
      }
    }
  }, [variants.length]);

  // Available options filtered by type
  const getOptionsForType = (type: string, name?: string) => {
    return dbOptions.filter((opt) => {
      if (opt.type !== type) return false;
      if (type === "custom" && name && opt.name.toLowerCase() !== name.toLowerCase()) return false;
      return true;
    });
  };

  // Add an attribute dimension (Max 3)
  const handleAddAttribute = (type: "unit" | "colour" | "dimension" | "custom", customName?: string) => {
    if (activeAttributes.length >= 3) {
      toast.error("Maximum 3 attributes per product allowed");
      return;
    }
    const defaultName =
      type === "unit"
        ? "Size / Quantity"
        : type === "colour"
        ? "Colour"
        : type === "dimension"
        ? "Dimension"
        : customName || "Material";

    if (activeAttributes.some((a) => a.name.toLowerCase() === defaultName.toLowerCase())) {
      toast.info(`Attribute "${defaultName}" is already added.`);
      return;
    }

    setActiveAttributes([...activeAttributes, { type, name: defaultName, values: [] }]);
  };

  // Remove an attribute dimension
  const handleRemoveAttribute = (index: number) => {
    setActiveAttributes(activeAttributes.filter((_, idx) => idx !== index));
  };

  // Toggle a value chip inside an attribute
  const handleToggleValue = (attrIndex: number, value: string) => {
    const updated = [...activeAttributes];
    const currentValues = updated[attrIndex].values;
    if (currentValues.includes(value)) {
      updated[attrIndex].values = currentValues.filter((v) => v !== value);
    } else {
      updated[attrIndex].values = [...currentValues, value];
    }
    setActiveAttributes(updated);
  };

  // Create & Save custom option
  const handleSaveCustomOption = async () => {
    if (!newOptionModal.value.trim()) {
      toast.error("Option value cannot be empty");
      return;
    }
    try {
      const res = await createAttributeOption({
        type: newOptionModal.type,
        name: newOptionModal.name.trim(),
        value: newOptionModal.value.trim(),
        meta: newOptionModal.hex ? { hex: newOptionModal.hex } : undefined,
        vendorId,
      });

      if (res.success && res.option) {
        toast.success(`Option "${res.option.value}" saved successfully`);
        // Refresh options
        await loadOptions();
        // Automatically select in the active attribute
        const targetAttrIdx = activeAttributes.findIndex(
          (a) => a.type === newOptionModal.type || a.name.toLowerCase() === newOptionModal.name.toLowerCase()
        );
        if (targetAttrIdx !== -1) {
          handleToggleValue(targetAttrIdx, res.option.value);
        }
        setNewOptionModal({ open: false, type: "custom", name: "", value: "" });
      } else {
        toast.error(res.error || "Failed to save option");
      }
    } catch {
      toast.error("Failed to save custom option");
    }
  };

  // ── CARTESIAN COMBINATION MATRIX GENERATOR ──
  const handleGenerateMatrix = () => {
    const validAttrs = activeAttributes.filter((a) => a.values.length > 0);
    if (validAttrs.length === 0) {
      toast.error("Please pick at least one attribute value to generate variants.");
      return;
    }

    // Cartesian product algorithm
    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce<string[][]>(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]]
      );
    };

    const valueArrays = validAttrs.map((a) => a.values);
    const combinations = cartesian(valueArrays);

    if (combinations.length > 100) {
      toast.error(`Total combinations (${combinations.length}) exceeds maximum limit of 100 variants.`);
      return;
    }

    const fallbackImage = baseImages.find((img) => img && !img.includes("placeholder")) || null;

    const newVariants: ProductVariant[] = combinations.map((combo, idx) => {
      // Map attributes dictionary: { [attrName]: value }
      const attrMap: Record<string, string> = {};
      validAttrs.forEach((attr, i) => {
        attrMap[attr.name] = combo[i];
      });

      const variantName = combo.join(" / ");
      const sizeValue = attrMap["Size / Quantity"] || attrMap["Dimension"] || combo[0];
      const colorValue = attrMap["Colour"] || "Default";
      const colorHex = colorValue !== "Default" ? resolveColorHex(colorValue) : null;

      // Check if an existing variant matches this combination
      const existing = variants.find(
        (v) =>
          v.variantName === variantName ||
          (v.size === sizeValue && v.color === colorValue && (v as any).attributes?.[validAttrs[0]?.name] === combo[0])
      );

      if (existing) {
        return {
          ...existing,
          variantName,
          attributes: attrMap,
          active: existing.active !== undefined ? existing.active : true,
        };
      }

      // Generate a friendly SKU
      const cleanSkuPrefix = combo
        .map((c) => c.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase())
        .join("-");
      const sku = `SKU-${cleanSkuPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        id: `v-${Date.now()}-${idx}`,
        sku,
        variantName,
        size: sizeValue,
        finish: "Standard",
        color: colorValue,
        colorHex,
        image: fallbackImage,
        images: fallbackImage ? [fallbackImage] : [],
        unit: unitOfSale,
        attributes: attrMap,
        price: defaultSellingPrice,
        pricePerBox: defaultSellingPrice,
        mrp: defaultMrp,
        pricePerSqft: defaultSellingPrice,
        sqftPerBox: 1,
        piecesPerBox: 1,
        stockBoxes: defaultStock,
        active: true,
        inStock: defaultStock > 0,
        lowStockAlert: 10,
        minOrderQuantity: 1,
        isDefault: idx === 0,
      };
    });

    onChange(newVariants);
    toast.success(`Generated ${newVariants.length} product variants!`);
  };

  // ── ROW EDITING HANDLERS ──
  const handleUpdateRow = (index: number, updates: Partial<ProductVariant>) => {
    const updated = [...variants];
    const current = { ...updated[index], ...updates };

    // Auto calculate pricePerBox / price sync
    if (updates.price !== undefined) {
      current.pricePerBox = Number(updates.price);
      current.pricePerSqft = Number(updates.price);
    }
    if (updates.pricePerBox !== undefined) {
      current.price = Number(updates.pricePerBox);
    }

    updated[index] = current;
    onChange(updated);
  };

  const handleDeleteRow = (index: number) => {
    if (variants.length <= 1) {
      toast.error("A product with variants must have at least one variant row.");
      return;
    }
    const updated = variants.filter((_, idx) => idx !== index);
    // If deleted row was default, mark first remaining row as default
    if (variants[index].isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    onChange(updated);
    toast.info("Variant row removed.");
  };

  const handleSetDefaultVariant = (index: number) => {
    const updated = variants.map((v, idx) => ({
      ...v,
      isDefault: idx === index,
    }));
    onChange(updated);
    toast.success(`"${variants[index].variantName || `Variant ${index + 1}`}" set as primary display variant.`);
  };

  // ── BULK TOOLS ──
  const handleApplyBulkPrice = () => {
    const pNum = parseFloat(bulkPriceInput);
    const mNum = parseFloat(bulkMrpInput);
    if (isNaN(pNum) || pNum <= 0) {
      toast.error("Please enter a valid selling price greater than ₹0");
      return;
    }
    if (!isNaN(mNum) && pNum > mNum) {
      toast.error("Selling price cannot exceed MRP");
      return;
    }
    const updated = variants.map((v) => ({
      ...v,
      price: pNum,
      pricePerBox: pNum,
      pricePerSqft: pNum,
      mrp: !isNaN(mNum) && mNum > 0 ? mNum : v.mrp,
    }));
    onChange(updated);
    setBulkPriceInput("");
    setBulkMrpInput("");
    toast.success("Applied price to all variants!");
  };

  const handleApplyBulkStock = () => {
    const sNum = parseInt(bulkStockInput, 10);
    if (isNaN(sNum) || sNum < 0) {
      toast.error("Please enter a valid stock quantity");
      return;
    }
    const updated = variants.map((v) => ({
      ...v,
      stockBoxes: sNum,
      inStock: sNum > 0,
    }));
    onChange(updated);
    setBulkStockInput("");
    toast.success("Applied stock to all variants!");
  };

  const handleCopyFromFirstRow = () => {
    if (variants.length <= 1) return;
    const first = variants[0];
    const updated = variants.map((v, idx) => {
      if (idx === 0) return v;
      return {
        ...v,
        price: first.price,
        pricePerBox: first.pricePerBox,
        pricePerSqft: first.pricePerSqft,
        mrp: first.mrp,
        stockBoxes: first.stockBoxes,
        inStock: first.inStock,
        lowStockAlert: first.lowStockAlert,
      };
    });
    onChange(updated);
    toast.success("Copied commercial pricing and stock from 1st row to all variants!");
  };

  // ── VALIDATION WARNINGS ──
  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    if (!hasVariants) return warnings;

    const activeCount = variants.filter((v) => v.active !== false).length;
    if (activeCount === 0) {
      warnings.push("At least 1 variant must be toggled active.");
    }

    const invalidPrice = variants.some((v) => v.active !== false && (!v.price || v.price <= 0));
    if (invalidPrice) {
      warnings.push("All active variants must have a selling price greater than ₹0.");
    }

    const mrpMismatch = variants.some(
      (v) => v.active !== false && v.mrp !== null && v.mrp !== undefined && (v.price || 0) > v.mrp
    );
    if (mrpMismatch) {
      warnings.push("Selling price cannot exceed MRP on any variant.");
    }

    // Check mixed unit families
    const detectedFamilies = new Set<string>();
    variants.forEach((v) => {
      const fam = detectUnitFamily(v.size || v.variantName || "");
      if (fam) detectedFamilies.add(fam);
    });
    if (detectedFamilies.size > 1) {
      warnings.push(
        `Mixed unit families detected (${Array.from(detectedFamilies).join(
          ", "
        )}). Ensure consistent measurement units across variants.`
      );
    }

    return warnings;
  }, [hasVariants, variants]);

  return (
    <div className="space-y-6">
      {/* ── 1. Multi-Variety Master Toggle ── */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center font-bold shrink-0 border border-orange-100">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#052a51]">
                Multi-Variety & Variant Matrix Mode
              </h3>
              {hasVariants && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Active ({variants.length} Variants)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              Toggle ON to generate and manage items with multiple <strong>Sizes/Weights (1kg, 5kg, 20kg)</strong>, <strong>Colours</strong>, or <strong>Dimensions</strong> with independent prices, stock & SKUs.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={readOnly}
          onClick={() => {
            const next = !hasVariants;
            onHasVariantsChange(next);
            if (next && variants.length === 0) {
              // Populate 1 initial default variant
              onChange([
                {
                  id: `v-${Date.now()}-1`,
                  sku: `SKU-${Date.now().toString().slice(-6)}`,
                  variantName: "Standard",
                  size: "Standard",
                  finish: "Standard",
                  color: "Standard",
                  price: defaultSellingPrice,
                  pricePerBox: defaultSellingPrice,
                  pricePerSqft: defaultSellingPrice,
                  mrp: defaultMrp,
                  sqftPerBox: 1,
                  stockBoxes: defaultStock,
                  inStock: true,
                  active: true,
                  isDefault: true,
                },
              ]);
            }
          }}
          className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            hasVariants
              ? "bg-[#052a51] text-white shadow-md shadow-[#052a51]/20 hover:bg-[#073666]"
              : "bg-orange-50 text-[#F26522] border border-[#F26522]/30 hover:bg-orange-100"
          }`}
        >
          <span>{hasVariants ? "✓ Multi-Variety Enabled" : "+ Enable Multi-Variety"}</span>
        </button>
      </div>

      {hasVariants && (
        <div className="space-y-6 animate-in fade-in zoom-in-98 duration-150">
          {/* ── 2. Attribute Builder (Pick up to 3 Attributes) ── */}
          <div className="bg-white p-6 rounded-3xl border border-gray-200/90 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal size={14} className="text-[#F26522]" />
                  <span>Step 1: Pick Attributes (Up to 3) & Select Values</span>
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Choose combinations (e.g. 3 sizes × 2 colours = 6 variants). Combinations generate automatically below.
                </p>
              </div>

              {/* Add Attribute Dropdown */}
              {activeAttributes.length < 3 && !readOnly && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-500">Add Attribute:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!activeAttributes.some((a) => a.type === "unit") && (
                      <button
                        type="button"
                        onClick={() => handleAddAttribute("unit")}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#052a51] hover:text-white text-gray-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        + Size / Weight
                      </button>
                    )}
                    {!activeAttributes.some((a) => a.type === "colour") && (
                      <button
                        type="button"
                        onClick={() => handleAddAttribute("colour")}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#052a51] hover:text-white text-gray-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        + Colour
                      </button>
                    )}
                    {!activeAttributes.some((a) => a.type === "dimension") && (
                      <button
                        type="button"
                        onClick={() => handleAddAttribute("dimension")}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#052a51] hover:text-white text-gray-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        + Dimension
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setNewOptionModal({
                          open: true,
                          type: "custom",
                          name: "Material",
                          value: "",
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[#F26522] hover:bg-[#F26522] hover:text-white text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      + Custom Attribute...
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Render Each Active Attribute Section */}
            <div className="space-y-4">
              {activeAttributes.map((attr, attrIdx) => {
                const availableOptions = getOptionsForType(attr.type, attr.name);

                return (
                  <div
                    key={attr.name + attrIdx}
                    className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#052a51] text-white flex items-center justify-center text-[10px] font-black">
                          {attrIdx + 1}
                        </span>
                        <span className="text-xs font-black text-gray-900">{attr.name}</span>
                        <span className="text-[10px] font-bold text-gray-400">
                          ({attr.values.length} selected)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setNewOptionModal({
                              open: true,
                              type: attr.type,
                              name: attr.name,
                              value: "",
                            })
                          }
                          className="text-[11px] font-bold text-[#F26522] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Custom {attr.name}
                        </button>
                        {activeAttributes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAttribute(attrIdx)}
                            className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                            title="Remove attribute"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Value Selection Chips */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {/* Available presets from DB */}
                      {availableOptions.map((opt) => {
                        const selected = attr.values.includes(opt.value);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleToggleValue(attrIdx, opt.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              selected
                                ? "bg-[#052a51] text-white border-[#052a51] shadow-2xs"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {opt.type === "colour" && opt.meta?.hex && (
                              <span
                                className="w-3.5 h-3.5 rounded-full border border-gray-300 shrink-0"
                                style={{ backgroundColor: opt.meta.hex }}
                              />
                            )}
                            {selected && <Check size={12} />}
                            <span>{opt.value}</span>
                          </button>
                        );
                      })}

                      {/* Selected values that might not be in DB presets yet */}
                      {attr.values
                        .filter((v) => !availableOptions.some((o) => o.value === v))
                        .map((customVal) => (
                          <button
                            key={customVal}
                            type="button"
                            onClick={() => handleToggleValue(attrIdx, customVal)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#052a51] text-white border border-[#052a51] shadow-2xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check size={12} />
                            <span>{customVal}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Matrix Generation Trigger Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-xs text-gray-500 font-medium">
                {activeAttributes.filter((a) => a.values.length > 0).length > 0 ? (
                  <span>
                    Will generate:{" "}
                    <strong className="text-gray-900 font-mono">
                      {activeAttributes
                        .filter((a) => a.values.length > 0)
                        .map((a) => a.values.length)
                        .reduce((a, b) => a * b, 1)}{" "}
                      variant rows
                    </strong>
                  </span>
                ) : (
                  <span>Select at least 1 value above to generate variant matrix</span>
                )}
              </div>

              <button
                type="button"
                disabled={activeAttributes.every((a) => a.values.length === 0)}
                onClick={handleGenerateMatrix}
                className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95517] disabled:opacity-40 text-white rounded-xl text-xs font-black shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Wand2 size={14} />
                <span>⚡ Generate Variant Combinations</span>
              </button>
            </div>
          </div>

          {/* ── 3. Validation Warnings (if any) ── */}
          {validationWarnings.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                <span>Please review variant configuration:</span>
              </div>
              <ul className="list-disc pl-5 text-xs text-amber-800 space-y-0.5">
                {validationWarnings.map((warn, wIdx) => (
                  <li key={wIdx}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ── 4. Variant Table & Bulk Tools ── */}
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div>
                <h4 className="text-sm font-black text-[#052a51] flex items-center gap-2">
                  <span>Step 2: Variant Pricing, Stock & Media Table</span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg font-mono">
                    {variants.length} Total ({variants.filter((v) => v.active !== false).length} Active)
                  </span>
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set individual selling price, stock, SKU, and image for each combination row.
                </p>
              </div>

              {/* Bulk Toolbar Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkToolbar(!showBulkToolbar)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Copy size={13} className="text-[#F26522]" />
                  <span>Bulk Edit Tools</span>
                  {showBulkToolbar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Expandable Bulk Editing Toolbar */}
            {showBulkToolbar && (
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 space-y-3 animate-in fade-in duration-100">
                <div className="flex items-center justify-between text-xs font-black text-[#052a51]">
                  <span>Bulk Update All {variants.length} Variants</span>
                  <button
                    type="button"
                    onClick={handleCopyFromFirstRow}
                    className="text-[#F26522] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={12} /> Copy from 1st row to all
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Bulk Price */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Selling Price (₹)"
                      value={bulkPriceInput}
                      onChange={(e) => setBulkPriceInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    />
                    <input
                      type="number"
                      placeholder="MRP (₹)"
                      value={bulkMrpInput}
                      onChange={(e) => setBulkMrpInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkPrice}
                      className="px-3 py-1.5 bg-[#052a51] text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-[#073666]"
                    >
                      Set Price
                    </button>
                  </div>

                  {/* Bulk Stock */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Stock quantity"
                      value={bulkStockInput}
                      onChange={(e) => setBulkStockInput(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyBulkStock}
                      className="px-3 py-1.5 bg-[#052a51] text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer hover:bg-[#073666]"
                    >
                      Set Stock
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Variant Table */}
            <div className="overflow-x-auto border border-gray-200/80 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3 w-10 text-center">Live</th>
                    <th className="py-3 px-3 w-10 text-center">Primary</th>
                    <th className="py-3 px-3">Variant Combination / Name</th>
                    <th className="py-3 px-3 w-36">SKU / Code</th>
                    <th className="py-3 px-3 w-28">MRP (₹)</th>
                    <th className="py-3 px-3 w-32">Selling Price (₹) *</th>
                    <th className="py-3 px-3 w-24">Discount</th>
                    <th className="py-3 px-3 w-28">Stock Qty</th>
                    <th className="py-3 px-3 w-24">Low Alert</th>
                    <th className="py-3 px-3 w-16 text-center">Media</th>
                    <th className="py-3 px-3 w-10 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map((v, idx) => {
                    const priceVal = v.price ?? v.pricePerBox ?? 0;
                    const mrpVal = v.mrp ?? null;
                    const hasDiscount = mrpVal !== null && mrpVal > priceVal;
                    const discPercent = hasDiscount && mrpVal ? Math.round(((mrpVal - priceVal) / mrpVal) * 100) : 0;
                    const isActive = v.active !== false;

                    return (
                      <tr
                        key={v.id || idx}
                        className={`transition-colors ${
                          !isActive
                            ? "bg-gray-50/60 opacity-60"
                            : v.isDefault
                            ? "bg-orange-50/20"
                            : "hover:bg-gray-50/50"
                        }`}
                      >
                        {/* 1. Active / Inactive Toggle */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => handleUpdateRow(idx, { active: e.target.checked })}
                            className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
                            title={isActive ? "Variant is active" : "Variant is disabled"}
                          />
                        </td>

                        {/* 2. Default Variant Radio */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSetDefaultVariant(idx)}
                            className={`p-1 rounded-md transition-colors ${
                              v.isDefault ? "text-amber-500" : "text-gray-300 hover:text-gray-500"
                            }`}
                            title={v.isDefault ? "Default variant (shown first)" : "Set as default variant"}
                          >
                            <Star size={14} className={v.isDefault ? "fill-amber-400 text-amber-500" : ""} />
                          </button>
                        </td>

                        {/* 3. Variant Name */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={v.variantName || v.size || ""}
                            onChange={(e) => handleUpdateRow(idx, { variantName: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                          />
                          {v.attributes && (
                            <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                              {Object.entries(v.attributes)
                                .map(([k, val]) => `${k}: ${val}`)
                                .join(" • ")}
                            </div>
                          )}
                        </td>

                        {/* 4. SKU */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={v.sku || ""}
                            onChange={(e) => handleUpdateRow(idx, { sku: e.target.value })}
                            placeholder="Auto SKU"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-800 focus:outline-none focus:border-[#F26522]"
                          />
                        </td>

                        {/* 5. MRP */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={v.mrp ?? ""}
                            onChange={(e) =>
                              handleUpdateRow(idx, {
                                mrp: e.target.value ? Number(e.target.value) : null,
                              })
                            }
                            placeholder="Optional"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-500 focus:outline-none focus:border-[#F26522]"
                          />
                        </td>

                        {/* 6. Selling Price */}
                        <td className="py-3 px-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F26522]">
                              ₹
                            </span>
                            <input
                              type="number"
                              min={1}
                              value={priceVal || ""}
                              onChange={(e) =>
                                handleUpdateRow(idx, {
                                  price: Number(e.target.value),
                                })
                              }
                              className={`w-full pl-6 pr-2.5 py-1.5 bg-white border rounded-lg text-xs font-mono font-black text-gray-900 focus:outline-none ${
                                !priceVal || priceVal <= 0
                                  ? "border-rose-400 bg-rose-50/30"
                                  : "border-gray-200 focus:border-[#F26522]"
                              }`}
                            />
                          </div>
                        </td>

                        {/* 7. Discount % */}
                        <td className="py-3 px-3 font-mono text-[11px]">
                          {discPercent > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              {discPercent}% OFF
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>

                        {/* 8. Stock */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={v.stockBoxes ?? 50}
                            onChange={(e) =>
                              handleUpdateRow(idx, {
                                stockBoxes: Number(e.target.value),
                                inStock: Number(e.target.value) > 0,
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                          />
                        </td>

                        {/* 9. Low Alert */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={v.lowStockAlert ?? 10}
                            onChange={(e) =>
                              handleUpdateRow(idx, {
                                lowStockAlert: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-600 focus:outline-none focus:border-[#F26522]"
                          />
                        </td>

                        {/* 10. Image Thumbnail / Fallback */}
                        <td className="py-3 px-3 text-center">
                          <div className="relative inline-block group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={v.image || baseImages[0] || "/placeholders/product.svg"}
                              alt="thumb"
                              className="w-8 h-8 rounded-lg object-cover border border-gray-200 bg-gray-50"
                              onError={(e) => {
                                (e.target as any).src = "/placeholders/product.svg";
                              }}
                            />
                            {baseImages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  // Cycle to next base image
                                  const curIdx = baseImages.indexOf(v.image || "");
                                  const nextIdx = (curIdx + 1) % baseImages.length;
                                  handleUpdateRow(idx, { image: baseImages[nextIdx] });
                                }}
                                className="absolute inset-0 bg-black/40 text-white rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] font-bold transition-opacity"
                                title="Click to cycle thumbnail"
                              >
                                Cycle
                              </button>
                            )}
                          </div>
                        </td>

                        {/* 11. Delete Row */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 rounded-md text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete this variant"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Custom Option Creation Modal ── */}
      {newOptionModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-sm font-black text-gray-900">
                Add Custom {newOptionModal.name || newOptionModal.type}
              </h4>
              <button
                type="button"
                onClick={() => setNewOptionModal({ open: false, type: "custom", name: "", value: "" })}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Attribute Name (e.g. Size, Material, Flavour)
                </label>
                <input
                  type="text"
                  value={newOptionModal.name}
                  onChange={(e) => setNewOptionModal({ ...newOptionModal, name: e.target.value })}
                  placeholder="e.g. Grade, Material, Volume"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Option Value (e.g. 25 kg, SS 304, Forest Green)
                </label>
                <input
                  type="text"
                  value={newOptionModal.value}
                  onChange={(e) => setNewOptionModal({ ...newOptionModal, value: e.target.value })}
                  placeholder="e.g. 25 kg, SS 304, Grade A"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-[#F26522]"
                />
              </div>

              {newOptionModal.type === "colour" && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Hex Color Code (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newOptionModal.hex || "#F26522"}
                      onChange={(e) => setNewOptionModal({ ...newOptionModal, hex: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={newOptionModal.hex || "#F26522"}
                      onChange={(e) => setNewOptionModal({ ...newOptionModal, hex: e.target.value })}
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setNewOptionModal({ open: false, type: "custom", name: "", value: "" })}
                className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCustomOption}
                className="px-4 py-1.5 rounded-xl bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                Save & Select
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
