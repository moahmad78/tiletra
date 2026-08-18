"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Plus, Check, ShoppingBag, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import type { Product } from "@/lib/data/products";
import { getFrequentlyBoughtTogether, type FrequentPair } from "@/lib/recommendations";
import { showCartToast } from "@/lib/cart-toast-store";
import { toast } from "sonner";

function formatPrice(n: number | string): string {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

export default function FrequentlyBoughtTogether({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const pair = getFrequentlyBoughtTogether(product);

  const [includeMain, setIncludeMain] = useState(true);
  const [includePaired, setIncludePaired] = useState(true);
  const [added, setAdded] = useState(false);

  if (!pair) return null;

  const mainVariant = pair.mainProduct.variants[0];
  const pairedVariant = pair.pairedProduct.variants[0];

  const totalCalculated =
    (includeMain ? mainVariant.pricePerBox : 0) +
    (includePaired ? pairedVariant.pricePerBox : 0);

  const discountAmount =
    includeMain && includePaired
      ? Math.round((totalCalculated * pair.bundleDiscountPercent) / 100)
      : 0;

  const finalPrice = totalCalculated - discountAmount;

  const handleAddBundle = () => {
    if (!includeMain && !includePaired) return;

    if (includeMain) {
      addItem(pair.mainProduct, mainVariant, 1);
    }
    if (includePaired) {
      addItem(pair.pairedProduct, pairedVariant, 1);
    }

    setAdded(true);
    showCartToast(
      `${pair.mainProduct.name} + ${pair.pairedProduct.name}`,
      2,
      "Design combination added to cart!"
    );
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
            Design Combination
          </span>
          <h3 className="text-lg sm:text-xl font-black text-[#052a51] mt-1">
            Frequently Bought Together
          </h3>
          <p className="text-xs text-gray-500">
            Homeowners often pair this floor tile with complementary wall finishes
          </p>
        </div>

        {includeMain && includePaired && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <Sparkles size={13} /> Save {pair.bundleDiscountPercent}% on Bundle
          </span>
        )}
      </div>

      {/* Product Pair Grid */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* Main Item */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMain}
                onChange={(e) => setIncludeMain(e.target.checked)}
                className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
              />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                <Image
                  src={pair.mainProduct.images[0]}
                  alt={pair.mainProduct.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </label>
            <div className="max-w-[140px] text-xs">
              <p className="font-bold text-[#052a51] line-clamp-1">{pair.mainProduct.name}</p>
              <p className="text-[11px] text-gray-400">{mainVariant.size}</p>
              <p className="font-black text-[#F26522] mt-0.5">
                {formatPrice(mainVariant.pricePerBox)}
              </p>
            </div>
          </div>

          {/* Plus sign */}
          <div className="w-8 h-8 rounded-full bg-gray-100 text-[#052a51] flex items-center justify-center font-black shrink-0">
            <Plus size={16} />
          </div>

          {/* Paired Companion Item */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePaired}
                onChange={(e) => setIncludePaired(e.target.checked)}
                className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
              />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                <Image
                  src={pair.pairedProduct.images[0]}
                  alt={pair.pairedProduct.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            </label>
            <div className="max-w-[140px] text-xs">
              <Link
                href={`/product/${pair.pairedProduct.slug}`}
                className="font-bold text-[#052a51] hover:text-[#F26522] line-clamp-1"
              >
                {pair.pairedProduct.name}
              </Link>
              <p className="text-[11px] text-gray-400">{pairedVariant.size}</p>
              <p className="font-black text-[#F26522] mt-0.5">
                {formatPrice(pairedVariant.pricePerBox)}
              </p>
            </div>
          </div>
        </div>

        {/* Bundle Math & Add to Cart Button */}
        <div className="w-full lg:w-auto p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row lg:flex-col items-center justify-between gap-3 text-center sm:text-left lg:text-center min-w-[230px]">
          <div>
            <div className="flex items-baseline justify-center sm:justify-start lg:justify-center gap-2">
              <span className="text-xl font-black text-[#052a51]">
                {formatPrice(finalPrice)}
              </span>
              {discountAmount > 0 && (
                <span className="text-xs text-gray-400 line-through font-semibold">
                  {formatPrice(totalCalculated)}
                </span>
              )}
            </div>
            {discountAmount > 0 && (
              <p className="text-[11px] font-extrabold text-emerald-700 mt-0.5">
                Includes ₹{discountAmount} bundle discount
              </p>
            )}
          </div>

          <button
            onClick={handleAddBundle}
            disabled={!includeMain && !includePaired}
            className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 whitespace-nowrap ${
              added
                ? "bg-emerald-600 text-white"
                : "bg-[#F26522] hover:bg-[#d95a1e] text-white"
            } disabled:opacity-40`}
          >
            {added ? (
              <>
                <Check size={15} className="shrink-0" /> <span className="whitespace-nowrap">Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag size={15} className="shrink-0" /> <span className="whitespace-nowrap">Add Both to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
