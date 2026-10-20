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
import ColorRadioSelector from "@/components/shared/ColorRadioSelector";
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
  defaultCostPrice?: number;
  defaultStock?: number;
  unitOfSale?: string;
  readOnly?: boolean;
  isAdminOrCpo?: boolean;
  initialColorImages?: Record<string, string>;
  initialColorRates?: Record<string, string>;
  initialColorDescriptions?: Record<string, string>;
  onColorImagesChange?: (imgs: Record<string, string>) => void;
  onColorRatesChange?: (rates: Record<string, string>) => void;
  onColorDescriptionsChange?: (descs: Record<string, string>) => void;
}

export interface AttributeSelection {
  type: "unit" | "colour" | "dimension" | "thickness" | "custom";
  name: string; // e.g., "Size/Weight", "Colour", "Dimension", "Thickness", "Grade", "Material"
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
  defaultCostPrice,
  defaultStock = 50,
  unitOfSale = "box",
  readOnly = false,
  isAdminOrCpo = false,
  initialColorImages,
  initialColorRates,
  initialColorDescriptions,
  onColorImagesChange,
  onColorRatesChange,
  onColorDescriptionsChange,
}: UnifiedVariantManagerProps) {
  // Attribute Options from DB
  const [dbOptions, setDbOptions] = useState<AttributeOptionItem[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Active Attribute Selections (Max 3)
  const [activeAttributes, setActiveAttributes] = useState<AttributeSelection[]>([
    { type: "unit", name: "Size / Quantity", values: [] },
  ]);

  // Variant colour-wise assets (Images, Rates, Descriptions)
  const [variantColorImages, setVariantColorImages] = useState<Record<string, string>>(initialColorImages || {});
  const [variantColorRates, setVariantColorRates] = useState<Record<string, string>>(initialColorRates || {});
  const [variantColorDescriptions, setVariantColorDescriptions] = useState<Record<string, string>>(initialColorDescriptions || {});

  useEffect(() => {
    if (initialColorImages) setVariantColorImages(initialColorImages);
  }, [initialColorImages]);

  useEffect(() => {
    if (initialColorRates) setVariantColorRates(initialColorRates);
  }, [initialColorRates]);

  useEffect(() => {
    if (initialColorDescriptions) setVariantColorDescriptions(initialColorDescriptions);
  }, [initialColorDescriptions]);

  // Color picker state
  const [colorPickerTargetRow, setColorPickerTargetRow] = useState<number | null>(null);
  const [colorPickerForAttr, setColorPickerForAttr] = useState(false);

  // Custom option addition modal/popover
  const [newOptionModal, setNewOptionModal] = useState<{
    open: boolean;
    type: "unit" | "colour" | "dimension" | "thickness" | "custom";
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

  // Available options filtered by type (with robust fallbacks)
  const getOptionsForType = (type: string, name?: string) => {
    const filtered = dbOptions.filter((opt) => {
      if (opt.type !== type) return false;
      if (type === "custom" && name && opt.name.toLowerCase() !== name.toLowerCase()) return false;
      return true;
    });

    if (filtered.length > 0) return filtered;

    // Fallbacks if database options haven't synced yet
    if (type === "thickness") {
      return [
        "4 mm", "6 mm", "8 mm", "9 mm", "10 mm", "12 mm", "15 mm", "16 mm",
        "18 mm", "19 mm", "20 mm", "25 mm", "30 mm", "32 mm", "0.5 inch", "0.75 inch", "1.0 inch"
      ].map((val, idx) => ({
        id: `fb-thick-${idx}`,
        scope: "global" as const,
        type: "thickness" as const,
        name: "Thickness",
        value: val,
        displayOrder: idx,
        isActive: true,
        createdAt: new Date(),
      }));
    }

    if (type === "dimension") {
      return [
        "600x600 mm (2x2 ft)", "600x1200 mm (2x4 ft)", "800x1600 mm (2.6x5.2 ft)",
        "300x450 mm (1x1.5 ft)", "8x4 ft", "7x4 ft", "7x3 ft",
        "0.5 inch (15mm)", "0.75 inch (20mm)", "1.0 inch (25mm)", "60x60 cm", "30x60 cm"
      ].map((val, idx) => ({
        id: `fb-dim-${idx}`,
        scope: "global" as const,
        type: "dimension" as const,
        name: "Dimension",
        value: val,
        displayOrder: idx,
        isActive: true,
        createdAt: new Date(),
      }));
    }

    return [];
  };

  // Add an attribute dimension (Max 3)
  const handleAddAttribute = (type: "unit" | "colour" | "dimension" | "thickness" | "custom", customName?: string) => {
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
        : type === "thickness"
        ? "Thickness"
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
      const thicknessValue = attrMap["Thickness"] || null;

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
          variantSpecs: {
            ...((existing as any).variantSpecs || {}),
            ...(thicknessValue ? { thickness: thicknessValue } : {}),
          },
          active: existing.active !== undefined ? existing.active : true,
        };
      }

      // Generate a friendly SKU
      const cleanSkuPrefix = combo
        .map((c) => c.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase())
        .join("-");
      const sku = `SKU-${cleanSkuPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      const customColorImage = variantColorImages[colorValue];
      const customColorRate = variantColorRates[colorValue] && !isNaN(Number(variantColorRates[colorValue]))
        ? Number(variantColorRates[colorValue])
        : null;
      const customColorDesc = variantColorDescriptions[colorValue];

      const rowPrice = customColorRate !== null ? customColorRate : defaultSellingPrice;
      const rowImage = customColorImage || fallbackImage;

      return {
        id: `v-${Date.now()}-${idx}`,
        sku,
        variantName,
        size: sizeValue,
        finish: "Standard",
        color: colorValue,
        colorHex,
        image: rowImage,
        images: rowImage ? [rowImage] : [],
        unit: unitOfSale,
        attributes: attrMap,
        thickness: thicknessValue,
        variantSpecs: {
          ...(thicknessValue ? { thickness: thicknessValue } : {}),
          ...(customColorDesc ? { colorDescription: customColorDesc } : {}),
        },
        price: rowPrice,
        pricePerBox: rowPrice,
        mrp: defaultMrp,
        pricePerSqft: rowPrice,
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

  // ── 1-CLICK DUPLICATE VARIANT (PRD Req) ──
  const handleDuplicateRow = (index: number) => {
    const source = variants[index];
    if (!source) return;
    const duplicated: ProductVariant = {
      ...source,
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku: source.sku ? `${source.sku}-COPY` : `SKU-${Date.now().toString().slice(-6)}`,
      variantName: `${source.variantName || "Variant"} (Copy)`,
      isDefault: false,
    };
    const next = [...variants];
    next.splice(index + 1, 0, duplicated);
    onChange(next);
    toast.success(`📄 Duplicated variant "${source.variantName || "Variant"}"!`);
  };

  // ── + ADD MULTI-VARIANT / SUB-ITEM (PRD Req) ──
  const handleAddNewSubItem = () => {
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      variantName: `Option ${variants.length + 1}`,
      size: "Standard",
      finish: "Standard",
      color: "Standard",
      price: defaultSellingPrice || 499,
      pricePerBox: defaultSellingPrice || 499,
      pricePerSqft: defaultSellingPrice || 499,
      mrp: defaultMrp || 699,
      costPrice: defaultCostPrice !== undefined ? defaultCostPrice : Math.round((defaultSellingPrice || 499) * 0.75),
      sqftPerBox: 16.5,
      stockBoxes: defaultStock || 50,
      lowStockAlert: 5,
      inStock: true,
      active: true,
      isDefault: variants.length === 0,
    };
    onChange([...variants, newVariant]);
    toast.success("Added new sub-item variant row!");
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
                        + Dimension (ft/in/mm/cm)
                      </button>
                    )}
                    {!activeAttributes.some((a) => a.type === "thickness") && (
                      <button
                        type="button"
                        onClick={() => handleAddAttribute("thickness")}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#052a51] hover:text-white text-gray-700 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        + Thickness
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
                    {attr.type === "colour" ? (
                      <div className="pt-1">
                        <ColorRadioSelector
                          value={attr.values.join(", ")}
                          defaultMulti={true}
                          allowCustom={true}
                          nameGroup={`variant-colour-${attrIdx}`}
                          label="Variant Colours (Multi-Colour Selection Supported)"
                          helperText="Choose colours for variants. For each colour, you can optionally attach a photo, custom rate (₹) and description."
                          initialColorImages={variantColorImages}
                          onColorImagesChange={(imgs) => {
                            setVariantColorImages(imgs);
                            if (onColorImagesChange) onColorImagesChange(imgs);
                          }}
                          initialColorRates={variantColorRates}
                          onColorRatesChange={(rates) => {
                            setVariantColorRates(rates);
                            if (onColorRatesChange) onColorRatesChange(rates);
                          }}
                          initialColorDescriptions={variantColorDescriptions}
                          onColorDescriptionsChange={(descs) => {
                            setVariantColorDescriptions(descs);
                            if (onColorDescriptionsChange) onColorDescriptionsChange(descs);
                          }}
                          onChange={(_joined, _hex, list, newImgs, dataMap) => {
                            const updated = [...activeAttributes];
                            updated[attrIdx].values = list || [];
                            setActiveAttributes(updated);
                            if (newImgs) {
                              setVariantColorImages(newImgs);
                              if (onColorImagesChange) onColorImagesChange(newImgs);
                            }
                            if (dataMap?.rates) {
                              setVariantColorRates(dataMap.rates);
                              if (onColorRatesChange) onColorRatesChange(dataMap.rates);
                            }
                            if (dataMap?.descriptions) {
                              setVariantColorDescriptions(dataMap.descriptions);
                              if (onColorDescriptionsChange) onColorDescriptionsChange(dataMap.descriptions);
                            }
                          }}
                        />
                      </div>
                    ) : (
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
                    )}
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

            {/* Variant Table (Desktop View) */}
            <div className="hidden md:block overflow-x-auto border border-gray-200/80 rounded-2xl pb-1">
              <table className="w-full min-w-[980px] text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-3 w-10 text-center">Live</th>
                    <th className="py-3 px-3 w-10 text-center">Primary</th>
                    <th className="py-3 px-3">Variant Combination / Name</th>
                    <th className="py-3 px-3 w-32">SKU / Code</th>
                    <th className="py-3 px-3 w-24" title="Maximum Retail Price">1. MRP (₹)</th>
                    <th className="py-3 px-3 w-28" title="Customer Selling Price (Sale Rate)">2. SALE Rate (₹) *</th>
                    <th className="py-3 px-3 w-24" title="Hame kitne me mil rha hai (Purchase / Landing Cost)">3. BUY Rate (₹)</th>
                    {isAdminOrCpo && (
                      <th className="py-3 px-3 w-28 text-right" title="Real-Time Profit & Margin % (Sale Rate - Buy Rate)">⚡ Profit / Margin</th>
                    )}
                    <th className="py-3 px-3 w-24">Coverage (sqft)</th>
                    <th className="py-3 px-3 w-32">Stock &amp; Status</th>
                    <th className="py-3 px-3 w-24" title="Triggers Low Stock Alert when inventory falls below this limit (Default: 5)">🚨 Alert Limit</th>
                    <th className="py-3 px-3 w-14 text-center">Media</th>
                    <th className="py-3 px-3 w-10 text-center" title="1-Click Duplicate Variant">Copy</th>
                    <th className="py-3 px-3 w-10 text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {variants.map((v, idx) => {
                    const priceVal = v.price ?? v.pricePerBox ?? 0;
                    const mrpVal = v.mrp ?? null;
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
                          {(v.customBadgeText || (v.tags && v.tags.length > 0)) && (
                            <div className="mt-0.5">
                              <span className="inline-block px-1.5 py-0.2 rounded-md bg-orange-100 text-[#F26522] text-[9px] font-bold truncate max-w-[120px]">
                                🏷️ {v.customBadgeText || v.tags?.[0]}
                              </span>
                            </div>
                          )}
                          {v.variantSpecs?.colorDescription && (
                            <div className="mt-0.5">
                              <span className="inline-block px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 text-[9px] font-medium border border-blue-200 truncate max-w-[140px]" title={v.variantSpecs.colorDescription}>
                                📝 {v.variantSpecs.colorDescription}
                              </span>
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
                            placeholder="MRP"
                            className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-500 focus:outline-none focus:border-[#F26522]"
                          />
                        </td>

                        {/* 6. Selling Price */}
                        <td className="py-3 px-3">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F26522]">
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
                              className={`w-full pl-5 pr-2 py-1.5 bg-white border rounded-lg text-xs font-mono font-black text-gray-900 focus:outline-none ${
                                !priceVal || priceVal <= 0
                                  ? "border-rose-400 bg-rose-50/30"
                                  : "border-gray-200 focus:border-[#F26522]"
                              }`}
                            />
                          </div>
                        </td>

                        {/* Cost Price / Purchase Rate (PRD Section 2) */}
                        <td className="py-3 px-3">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 font-mono text-[11px]">
                              ₹
                            </span>
                            <input
                              type="number"
                              min={0}
                              placeholder="Cost"
                              value={v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : ""}
                              onChange={(e) =>
                                handleUpdateRow(idx, {
                                  costPrice: e.target.value ? Number(e.target.value) : undefined,
                                })
                              }
                              className="w-full pl-5 pr-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-700 focus:outline-none focus:border-[#F26522]"
                              title="Purchase / landing cost (Used for admin profit margin calculation)"
                            />
                          </div>
                        </td>

                        {/* 🟢 Admin/CPO Live Profit Margin Metric (PRD Section 2 & 5 - Hidden for Vendor) */}
                        {isAdminOrCpo && (
                          <td className="py-3 px-3 text-right font-mono">
                            {(() => {
                              const cp = Number(v.costPrice || 0);
                              const sp = Number(v.price || v.pricePerBox || 0);
                              if (sp > 0 && cp > 0) {
                                const profit = sp - cp;
                                const margin = ((profit / sp) * 100).toFixed(1);
                                const isPositive = profit >= 0;
                                return (
                                  <div className="flex flex-col items-end">
                                    <span className={`text-[11px] font-black ${isPositive ? "text-emerald-700" : "text-rose-600"}`}>
                                      {isPositive ? "+" : ""}₹{profit.toLocaleString("en-IN")}
                                    </span>
                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                      Number(margin) >= 20 ? "bg-emerald-100 text-emerald-800" : Number(margin) > 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                    }`}>
                                      {margin}% margin
                                    </span>
                                  </div>
                                );
                              }
                              return <span className="text-[10px] text-gray-400 font-mono">-</span>;
                            })()}
                          </td>
                        )}

                        {/* 7. Smart Calculator Coverage (sqft/box) */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            placeholder="sq.ft"
                            value={v.sqftPerBox ?? ""}
                            onChange={(e) =>
                              handleUpdateRow(idx, {
                                sqftPerBox: e.target.value ? Number(e.target.value) : undefined,
                              })
                            }
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                            title="Coverage area in square feet per unit/box"
                          />
                        </td>

                        {/* 8. Stock Count & Real-Time Status Detection (PRD Section 6) */}
                        <td className="py-3 px-3">
                          <div className="space-y-1">
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
                              className={`w-full px-2 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold focus:outline-none ${
                                (v.stockBoxes ?? 50) === 0
                                  ? "border-rose-400 text-rose-700 bg-rose-50/20"
                                  : (v.stockBoxes ?? 50) <= (v.lowStockAlert ?? 5)
                                  ? "border-amber-400 text-amber-700 bg-amber-50/20"
                                  : "border-gray-200 text-gray-900 focus:border-[#F26522]"
                              }`}
                            />
                            <div className="flex items-center">
                              {(v.stockBoxes ?? 50) === 0 ? (
                                <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 leading-none">
                                  Out of Stock
                                </span>
                              ) : (v.stockBoxes ?? 50) <= (v.lowStockAlert ?? 5) ? (
                                <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 leading-none">
                                  Low Stock ⚠️
                                </span>
                              ) : (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 leading-none">
                                  In Stock ✓
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 9. Low Stock Alert Threshold Limit (PRD Section 3 & 4) */}
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={v.lowStockAlert ?? 5}
                            onChange={(e) =>
                              handleUpdateRow(idx, {
                                lowStockAlert: Number(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-medium text-gray-600 focus:outline-none focus:border-[#F26522]"
                            title="Triggers alert when stock is at or below this threshold (Default: 5)"
                          />
                        </td>

                        {/* 9. Image Thumbnail */}
                        <td className="py-3 px-3 text-center">
                          <div className="relative inline-block group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={v.image || baseImages[0] || "/placeholders/product.svg"}
                              alt="thumb"
                              className="w-7 h-7 rounded-lg object-cover border border-gray-200 bg-gray-50"
                              onError={(e) => {
                                (e.target as any).src = "/placeholders/product.svg";
                              }}
                            />
                            {baseImages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
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

                        {/* 10. 1-Click Duplicate Variant (PRD Req) */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDuplicateRow(idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#F26522] hover:bg-orange-50 transition-colors cursor-pointer"
                            title="1-Click Duplicate this variant (copies specs, price & stock)"
                          >
                            <Copy size={13} />
                          </button>
                        </td>

                        {/* 11. Delete Row */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

            {/* 📱 Mobile Variant Card View (Responsive Table Alternative - PRD Section 2 & 3) */}
            <div className="block md:hidden space-y-3">
              {variants.map((v, idx) => {
                const priceVal = v.price ?? v.pricePerBox ?? 0;
                const mrpVal = v.mrp ?? null;
                const isActive = v.active !== false;
                const stockVal = v.stockBoxes ?? 50;
                const alertVal = v.lowStockAlert ?? 5;

                return (
                  <div
                    key={v.id || idx}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      !isActive
                        ? "bg-gray-50/70 border-gray-200 opacity-60"
                        : v.isDefault
                        ? "bg-orange-50/30 border-[#F26522] shadow-xs"
                        : "bg-white border-gray-200 shadow-2xs"
                    }`}
                  >
                    {/* Top Row: Thumbnail + Title + Live Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={v.image || baseImages[0] || "/placeholders/product.svg"}
                          alt="thumb"
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 bg-gray-50 shrink-0"
                          onError={(e) => {
                            (e.target as any).src = "/placeholders/product.svg";
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-gray-900 truncate">
                              {v.variantName || `${v.size || "Standard"} / ${v.color || "Standard"}`}
                            </span>
                            {v.isDefault && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-[#052a51] text-white">
                                Primary
                              </span>
                            )}
                            {(v.customBadgeText || (v.tags && v.tags.length > 0)) && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-[#F26522] truncate max-w-[100px]">
                                🏷️ {v.customBadgeText || v.tags?.[0]}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">
                            SKU: {v.sku || "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Stock Status Badge */}
                      <div className="shrink-0 text-right">
                        {stockVal === 0 ? (
                          <span className="text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            Out of Stock
                          </span>
                        ) : stockVal <= alertVal ? (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Low Stock ⚠️
                          </span>
                        ) : (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            In Stock ✓
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Grid: 3-Tier Pricing (MRP, SALE Rate, BUY Rate) */}
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block truncate">1. MRP (₹)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="MRP"
                          value={mrpVal || ""}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              mrp: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700 focus:outline-none focus:border-[#F26522]"
                        />
                      </div>

                      <div className="p-2 rounded-xl bg-blue-50/40 border border-blue-200 space-y-1">
                        <label className="text-[9px] font-bold text-blue-900 uppercase block truncate">2. SALE Rate (₹) *</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Selling"
                          value={priceVal || ""}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              price: Number(e.target.value),
                              pricePerBox: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>

                      <div className="p-2 rounded-xl bg-amber-50/40 border border-amber-200 space-y-1">
                        <label className="text-[9px] font-bold text-amber-900 uppercase block truncate">3. BUY Rate (₹)</label>
                        <input
                          type="number"
                          min={0}
                          placeholder="Cost"
                          value={v.costPrice !== undefined && v.costPrice !== null ? v.costPrice : ""}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              costPrice: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950 focus:outline-none focus:border-[#F26522]"
                          title="Hame kitne me mil rha hai"
                        />
                      </div>
                    </div>

                    {/* 🟢 Live Metrics Indicator: Admin Margin vs Vendor Customer Discount */}
                    {(() => {
                      const cp = Number(v.costPrice || 0);
                      const sp = Number(priceVal || 0);
                      const mp = Number(mrpVal || 0);
                      const profit = sp - cp;
                      const margin = sp > 0 && cp > 0 ? ((profit / sp) * 100).toFixed(1) : null;
                      const disc = mp > 0 && mp > sp ? Math.round(((mp - sp) / mp) * 100) : null;

                      if (isAdminOrCpo && (sp > 0 || cp > 0)) {
                        return (
                          <div className="p-2 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between text-[10px] font-mono">
                            <span className="font-bold text-[#052a51]">
                              ⚡ Profit: <strong className={profit >= 0 ? "text-emerald-700" : "text-rose-600"}>{profit >= 0 ? "+" : ""}₹{profit.toLocaleString("en-IN")}</strong>
                            </span>
                            {margin && (
                              <span className="font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                📊 Margin: {margin}%
                              </span>
                            )}
                            {disc !== null && (
                              <span className="text-gray-500 font-bold">
                                🏷️ {disc}% OFF
                              </span>
                            )}
                          </div>
                        );
                      }

                      if (!isAdminOrCpo && disc !== null) {
                        return (
                          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 text-center">
                            🏷️ Customer Discount: {disc}% OFF MRP
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Stock & Alert Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">Stock Count</label>
                        <input
                          type="number"
                          min={0}
                          value={stockVal}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              stockBoxes: Number(e.target.value),
                              inStock: Number(e.target.value) > 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                        />
                      </div>

                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">🚨 Alert Limit</label>
                        <input
                          type="number"
                          min={0}
                          value={alertVal}
                          onChange={(e) =>
                            handleUpdateRow(idx, {
                              lowStockAlert: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold text-gray-700 focus:outline-none focus:border-[#F26522]"
                        />
                      </div>
                    </div>

                    {/* Bottom Action Strip: Duplicate, Primary, Active Toggle, Delete */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={(e) => handleUpdateRow(idx, { active: e.target.checked })}
                            className="w-4 h-4 accent-[#F26522] rounded"
                          />
                          <span>Live</span>
                        </label>
                        {!v.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultVariant(idx)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 ml-2 cursor-pointer"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRow(idx)}
                          className="px-2.5 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-[#F26522] text-xs font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                          title="1-Click Duplicate this variant"
                        >
                          <Copy size={12} />
                          <span>Duplicate</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(idx)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete variant"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* + Add Multi-Variant / Sub-Item Button (PRD Req) */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleAddNewSubItem}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 border-dashed border-[#F26522] bg-orange-50/60 hover:bg-orange-100 text-[#F26522] text-xs font-black transition-all cursor-pointer shadow-2xs self-start"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>+ Add Multi-Variant / Sub-Item</span>
              </button>
              <span className="text-[11px] text-gray-400 font-medium">
                💡 Tip: Click duplicate (<Copy size={11} className="inline text-[#F26522]" />) on any row to clone pricing &amp; coverage instantly.
              </span>
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
                  Option Value (e.g. 25 kg, 600x600 mm, 9 mm)
                </label>
                <input
                  type="text"
                  value={newOptionModal.value}
                  onChange={(e) => setNewOptionModal({ ...newOptionModal, value: e.target.value })}
                  placeholder={
                    newOptionModal.type === "thickness"
                      ? "e.g. 9 mm, 12 mm, 18 mm, 0.5 inch"
                      : newOptionModal.type === "dimension"
                      ? "e.g. 600x600 mm, 2x2 ft, 8x4 ft, 1 inch"
                      : "e.g. 25 kg, SS 304, Grade A"
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:bg-white focus:border-[#F26522]"
                />
              </div>

              {newOptionModal.type === "thickness" && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500">Quick Thickness Presets:</span>
                  <div className="flex flex-wrap gap-1">
                    {["4 mm", "6 mm", "8 mm", "9 mm", "10 mm", "12 mm", "16 mm", "18 mm", "19 mm", "20 mm", "25 mm", "0.5 inch", "1.0 inch"].map((thk) => (
                      <button
                        key={thk}
                        type="button"
                        onClick={() => setNewOptionModal({ ...newOptionModal, value: thk })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                          newOptionModal.value === thk
                            ? "bg-[#052a51] text-white border-[#052a51]"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200"
                        }`}
                      >
                        {thk}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newOptionModal.type === "dimension" && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500">Choose Dimension Unit / Format:</span>
                  <div className="flex flex-wrap gap-1">
                    {["feet (ft)", "inch (in)", "mm", "cm"].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => {
                          const unitClean = u.split(" ")[0];
                          if (!newOptionModal.value) {
                            setNewOptionModal({ ...newOptionModal, value: unitClean });
                          } else {
                            setNewOptionModal({ ...newOptionModal, value: `${newOptionModal.value} ${unitClean}`.trim() });
                          }
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-orange-50 text-[#F26522] border border-orange-200 font-bold hover:bg-orange-100"
                      >
                        +{u}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
