"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Zap,
  Sliders,
  DollarSign,
  Package,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Layers,
  Copy,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { quickUpdateProductRatesAndStock, QuickRateVariantItem } from "@/lib/actions/products";
import { resolveColorHex } from "@/lib/catalog";

export interface ProductEditModalData {
  id: string;
  name: string;
  slug?: string;
  sku?: string | null;
  images?: string[];
  categoryName?: string;
  status?: string;
  mrp?: number | null;
  price?: number | null;
  pricePerBox?: number | null;
  costPrice?: number | null;
  stockBoxes?: number | null;
  variants?: Array<{
    id: string;
    sku?: string | null;
    variantName?: string | null;
    size?: string;
    color?: string;
    image?: string | null;
    mrp?: number | null;
    price?: number | null;
    pricePerBox?: number | null;
    costPrice?: number | null;
    stockBoxes?: number | null;
    variantSpecs?: any;
  }>;
}

interface ProductEditChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductEditModalData | null;
  editUrl: string;
  onSuccess?: () => void;
}

export default function ProductEditChoiceModal({
  isOpen,
  onClose,
  product,
  editUrl,
  onSuccess,
}: ProductEditChoiceModalProps) {
  const router = useRouter();

  // Mode: "choice" = Selection between Instant vs Custom, "instant" = Rate/Stock quick form
  const [mode, setMode] = useState<"choice" | "instant">("choice");
  const [saving, setSaving] = useState(false);

  // Master rate & stock inputs for instant update
  const [masterMrp, setMasterMrp] = useState<string>("");
  const [masterSaleRate, setMasterSaleRate] = useState<string>("");
  const [masterBuyRate, setMasterBuyRate] = useState<string>("");
  const [masterStock, setMasterStock] = useState<string>("");

  // Individual variant states
  const [variantRows, setVariantRows] = useState<
    Array<{
      id: string;
      sku: string;
      name: string;
      color: string;
      mrp: string;
      saleRate: string;
      buyRate: string;
      stock: string;
    }>
  >([]);

  // Reset form when modal opens or product changes
  useEffect(() => {
    if (isOpen && product) {
      setMode("choice");

      const primaryVar = product.variants?.[0];
      const pMrp = product.mrp ?? primaryVar?.mrp ?? "";
      const pSale = product.price ?? product.pricePerBox ?? primaryVar?.price ?? primaryVar?.pricePerBox ?? "";
      const pBuy = product.costPrice ?? primaryVar?.costPrice ?? primaryVar?.variantSpecs?.costPrice ?? primaryVar?.variantSpecs?.buyRate ?? "";
      const pStock = product.stockBoxes ?? primaryVar?.stockBoxes ?? "50";

      setMasterMrp(pMrp ? String(pMrp) : "");
      setMasterSaleRate(pSale ? String(pSale) : "");
      setMasterBuyRate(pBuy ? String(pBuy) : "");
      setMasterStock(pStock !== undefined && pStock !== null ? String(pStock) : "50");

      if (product.variants && product.variants.length > 0) {
        setVariantRows(
          product.variants.map((v) => ({
            id: v.id,
            sku: v.sku || "",
            name: v.variantName || v.size || "Standard",
            color: v.color || "Standard",
            mrp: v.mrp ? String(v.mrp) : pMrp ? String(pMrp) : "",
            saleRate: v.price ? String(v.price) : v.pricePerBox ? String(v.pricePerBox) : pSale ? String(pSale) : "",
            buyRate: v.costPrice
              ? String(v.costPrice)
              : v.variantSpecs?.costPrice
              ? String(v.variantSpecs.costPrice)
              : pBuy
              ? String(pBuy)
              : "",
            stock: v.stockBoxes !== undefined && v.stockBoxes !== null ? String(v.stockBoxes) : "50",
          }))
        );
      } else {
        setVariantRows([]);
      }
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Real-time calculations for master inputs
  const mrpNum = Number(masterMrp) || 0;
  const saleNum = Number(masterSaleRate) || 0;
  const buyNum = Number(masterBuyRate) || 0;

  const discountAmount = mrpNum > saleNum ? mrpNum - saleNum : 0;
  const discountPercent = mrpNum > 0 && discountAmount > 0 ? Math.round((discountAmount / mrpNum) * 100) : 0;

  const profitAmount = saleNum > buyNum && buyNum > 0 ? saleNum - buyNum : 0;
  const profitMarginPercent = saleNum > 0 && buyNum > 0 ? ((profitAmount / saleNum) * 100).toFixed(1) : "0";

  // Apply master values to all variant rows
  const handleApplyMasterToAll = () => {
    setVariantRows((prev) =>
      prev.map((r) => ({
        ...r,
        mrp: masterMrp,
        saleRate: masterSaleRate,
        buyRate: masterBuyRate,
        stock: masterStock,
      }))
    );
    toast.success("Applied master rates & stock to all variant rows!");
  };

  // Update specific variant row
  const handleUpdateVariantRow = (idx: number, field: string, val: string) => {
    setVariantRows((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  // Submit Instant Update
  const handleSaveInstantUpdate = async () => {
    if (!masterSaleRate && variantRows.every((v) => !v.saleRate)) {
      toast.error("Please enter a valid SALE Rate / Price");
      return;
    }

    try {
      setSaving(true);
      const res = await quickUpdateProductRatesAndStock({
        productId: product.id,
        mrp: masterMrp ? Number(masterMrp) : null,
        saleRate: masterSaleRate ? Number(masterSaleRate) : undefined,
        buyRate: masterBuyRate ? Number(masterBuyRate) : null,
        stock: masterStock ? Number(masterStock) : undefined,
        variants:
          variantRows.length > 0
            ? variantRows.map((v) => ({
                id: v.id,
                sku: v.sku || null,
                variantName: v.name,
                mrp: v.mrp ? Number(v.mrp) : null,
                saleRate: v.saleRate ? Number(v.saleRate) : Number(masterSaleRate || 0),
                buyRate: v.buyRate ? Number(v.buyRate) : masterBuyRate ? Number(masterBuyRate) : null,
                stock: v.stock ? Number(v.stock) : Number(masterStock || 50),
              }))
            : undefined,
      });

      if (res.success) {
        toast.success("Rates & stock updated instantly!");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to update rates");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Error updating rates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-linear-to-r from-orange-50/50 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            {/* Product Thumbnail */}
            <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 overflow-hidden shrink-0 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images?.[0] || "/placeholders/product.svg"}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholders/product.svg";
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {product.categoryName || "Product"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              <h3 className="text-sm font-black text-[#052a51] truncate max-w-xs sm:max-w-md">
                {product.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── STEP 1: CHOICE SCREEN (Instant Update vs Custom Update) ── */}
        {mode === "choice" && (
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="text-center space-y-1">
              <h2 className="text-lg font-black text-[#052a51]">Choose Edit Option</h2>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Select whether you want to update price and stock in seconds or customize all catalog specifications.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Card 1: Instant Update */}
              <button
                type="button"
                onClick={() => setMode("instant")}
                className="group relative flex flex-col p-5 rounded-3xl border-2 border-orange-200 hover:border-[#F26522] bg-linear-to-b from-orange-50/40 to-white hover:shadow-lg transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 group-hover:bg-[#F26522] text-[#F26522] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                    <Zap size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange-100 text-[#F26522] px-2.5 py-1 rounded-full">
                    ⚡ Instant (Fast)
                  </span>
                </div>

                <h4 className="text-base font-black text-gray-900 group-hover:text-[#F26522] transition-colors">
                  Instant Update
                </h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed flex-1">
                  Change <strong>3 Rates (MRP, SALE Rate, BUY Rate)</strong> aur <strong>Stock</strong> instantly bina page reload kiye update karein.
                </p>

                <div className="mt-4 pt-3 border-t border-orange-100 flex items-center justify-between text-xs font-bold text-[#F26522]">
                  <span>Update Price &amp; Stock</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Card 2: Custom Update (Full Editor) */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(editUrl);
                }}
                className="group relative flex flex-col p-5 rounded-3xl border-2 border-blue-200 hover:border-[#052a51] bg-linear-to-b from-blue-50/40 to-white hover:shadow-lg transition-all text-left cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-[#052a51] text-[#052a51] group-hover:text-white flex items-center justify-center transition-colors shadow-2xs">
                    <Sliders size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#052a51] px-2.5 py-1 rounded-full">
                    🛠️ Full Customize
                  </span>
                </div>

                <h4 className="text-base font-black text-gray-900 group-hover:text-[#052a51] transition-colors">
                  Custom Update
                </h4>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed flex-1">
                  Everything customise karein: <strong>Photos, Colours, Specifications, Variant Combinations, Badges, SEO &amp; Description</strong>.
                </p>

                <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-xs font-bold text-[#052a51]">
                  <span>Open Full Editor</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: INSTANT UPDATE (3 RATES & STOCK FAST FORM) ── */}
        {mode === "instant" && (
          <div className="p-6 space-y-5 overflow-y-auto">
            {/* Navigation & Title */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setMode("choice")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#052a51] cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Options</span>
              </button>

              <span className="text-xs font-bold text-gray-400">
                {product.variants?.length ? `${product.variants.length} Variants Available` : "Single Item"}
              </span>
            </div>

            {/* Live Metrics: Discount & Margin */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-linear-to-r from-emerald-50/70 to-teal-50/70 border border-emerald-200">
              <div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Customer Discount
                </span>
                <span className="text-sm font-black text-emerald-950 font-mono">
                  {discountPercent > 0 ? `${discountPercent}% OFF (Saves ₹${discountAmount})` : "No Discount"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                  Your Profit / Margin
                </span>
                <span className="text-sm font-black text-teal-950 font-mono">
                  {profitAmount > 0 ? `+₹${profitAmount.toLocaleString("en-IN")} (${profitMarginPercent}%)` : "Enter Buy Rate"}
                </span>
              </div>
            </div>

            {/* Master 3 Rates & Stock Form */}
            <div className="space-y-3 bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[#F26522]" />
                  <span>3 Rates &amp; Stock Configuration</span>
                </h4>
                {variantRows.length > 1 && (
                  <button
                    type="button"
                    onClick={handleApplyMasterToAll}
                    className="text-[11px] font-bold text-[#F26522] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} /> Apply to all {variantRows.length} variants
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* 1. MRP */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    1. MRP (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 799"
                    value={masterMrp}
                    onChange={(e) => setMasterMrp(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                  <span className="text-[9px] text-gray-400 block mt-0.5">Printed price</span>
                </div>

                {/* 2. SALE Rate */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    2. SALE Rate (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 549"
                    value={masterSaleRate}
                    onChange={(e) => setMasterSaleRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 focus:outline-none focus:border-[#F26522]"
                    required
                  />
                  <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">Selling price</span>
                </div>

                {/* 3. BUY Rate */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    3. BUY Rate (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 380"
                    value={masterBuyRate}
                    onChange={(e) => setMasterBuyRate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                  <span className="text-[9px] text-gray-400 block mt-0.5">Landing cost</span>
                </div>

                {/* 4. Stock */}
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={masterStock}
                    onChange={(e) => setMasterStock(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                  <span className="text-[9px] text-gray-400 block mt-0.5">Boxes / Units</span>
                </div>
              </div>
            </div>

            {/* Individual Variant Table (If variants exist) */}
            {variantRows.length > 1 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#052a51] flex items-center gap-1.5">
                    <Layers size={13} className="text-[#F26522]" />
                    <span>Variant-Wise Independent Rates &amp; Stock</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Adjust specific size/colour rows if required
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-200 rounded-2xl max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead className="bg-gray-100/80 text-gray-600 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="py-2 px-3">Variant</th>
                        <th className="py-2 px-2 w-24">1. MRP (₹)</th>
                        <th className="py-2 px-2 w-28">2. SALE Rate (₹)</th>
                        <th className="py-2 px-2 w-24">3. BUY Rate (₹)</th>
                        <th className="py-2 px-2 w-24">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {variantRows.map((row, idx) => {
                        const hex = resolveColorHex(row.color);
                        return (
                          <tr key={row.id} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-bold text-gray-800">
                              <div className="flex items-center gap-1.5">
                                {row.color && row.color !== "Standard" && (
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                                    style={{ backgroundColor: hex }}
                                  />
                                )}
                                <span className="truncate max-w-[130px]">{row.name}</span>
                              </div>
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min="0"
                                value={row.mrp}
                                onChange={(e) => handleUpdateVariantRow(idx, "mrp", e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min="0"
                                value={row.saleRate}
                                onChange={(e) => handleUpdateVariantRow(idx, "saleRate", e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-900"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min="0"
                                value={row.buyRate}
                                onChange={(e) => handleUpdateVariantRow(idx, "buyRate", e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                              />
                            </td>
                            <td className="py-1 px-2">
                              <input
                                type="number"
                                min="0"
                                value={row.stock}
                                onChange={(e) => handleUpdateVariantRow(idx, "stock", e.target.value)}
                                className="w-full px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(editUrl);
                }}
                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Sliders size={13} />
                <span>Switch to Full Custom Editor</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveInstantUpdate}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#d95517] disabled:opacity-50 text-white text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={3} />
                      <span>Save &amp; Update Instantly</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
