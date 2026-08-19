"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, Star, Plus, Check, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { showCartToast } from "@/lib/cart-toast-store";
import { products as defaultProducts, type Product } from "@/lib/data/products";

function formatPrice(n: number | string): string {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

interface SuggestedItemsProps {
  currentProductId?: string;
  title?: string;
  subtitle?: string;
  catalog?: Product[];
}

export default function SuggestedItemsSection({
  currentProductId,
  title = "Suggested for You",
  subtitle = "Inspired by your browsing & top picks across categories",
  catalog = defaultProducts,
}: SuggestedItemsProps) {
  const [mounted, setMounted] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const { addItem } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickAdd = (product: Product) => {
    const variant = product.variants?.[0] || {
      id: `${product.id}-v1`,
      size: "Standard",
      finish: "Glossy",
      color: "Default",
      pricePerBox: 1500,
      pricePerSqft: 50,
      sqftPerBox: 30,
      stockBoxes: 100,
    };
    addItem(product, variant, 1);
    showCartToast(product.name, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  // Diverse mix across different categories (Flipkart style)
  const mixedSuggestions = useMemo(() => {
    const pool = (catalog && catalog.length > 0 ? catalog : defaultProducts).filter(
      (p) => p.id !== currentProductId && p.slug !== currentProductId
    );

    // Group by category to ensure rich cross-category diversity
    const categoryMap = new Map<string, Product[]>();
    for (const p of pool) {
      const list = categoryMap.get(p.categorySlug) || [];
      list.push(p);
      categoryMap.set(p.categorySlug, list);
    }

    const mixed: Product[] = [];
    const entries = Array.from(categoryMap.values());
    let maxLen = 0;
    for (const arr of entries) {
      if (arr.length > maxLen) maxLen = arr.length;
    }

    // Interleave across categories
    for (let i = 0; i < maxLen; i++) {
      for (const catList of entries) {
        if (catList[i] && mixed.length < 12) {
          mixed.push(catList[i]);
        }
      }
    }

    return mixed.slice(0, 8);
  }, [catalog, currentProductId]);

  if (!mounted || mixedSuggestions.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl p-4 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#052a51] leading-tight">
              {title}
            </h3>
            {/* Caption hidden on mobile as requested */}
            <p className="text-xs text-gray-400 font-medium hidden sm:block">{subtitle}</p>
          </div>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1 group"
        >
          <span>Explore All</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Flipkart-Style Mixed Suggested Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {mixedSuggestions.map((product) => {
          const variant = product.variants?.[0];
          const price = variant?.pricePerBox || 1500;
          const unit = product.unitOfSale || "box";
          const rating = product.manualRating || product.rating || 4.8;
          const reviews = product.manualReviewCount || product.reviewCount || 14;
          const isAdded = addedId === product.id;

          return (
            <Link
              key={product.id || product.slug}
              href={`/product/${product.slug}`}
              className="group bg-white rounded-2xl border border-gray-200/90 hover:border-[#F26522] hover:shadow-md transition-all flex flex-col justify-between overflow-hidden p-2.5 active:scale-98 relative"
            >
              {/* Product Thumbnail */}
              <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gray-50 mb-2 border border-gray-100">
                <Image
                  src={
                    product.images?.[0] ||
                    "/placeholders/product.svg"
                  }
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-108 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                {product.isBestseller && (
                  <span className="absolute top-2 left-2 bg-[#F26522] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                    Hot
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#F26522] uppercase tracking-wider block truncate">
                    {product.categoryName}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                </div>

                <div className="pt-2">
                  {/* Rating Pill */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                      <Star size={10} className="fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-black text-amber-900 leading-none">
                        {rating}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium truncate">
                      ({reviews})
                    </span>
                  </div>

                  {/* Price & Quick Add to Cart Button */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-baseline gap-0.5 truncate">
                      <span className="text-sm sm:text-base font-black text-[#052a51]">
                        {formatPrice(price)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium truncate">/{unit}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleQuickAdd(product);
                      }}
                      aria-label={`Add ${product.name} to cart`}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 ${
                        isAdded
                          ? "bg-emerald-600 text-white"
                          : "bg-[#F26522] hover:bg-[#d95a1e] text-white"
                      }`}
                    >
                      {isAdded ? <Check size={13} className="stroke-[3]" /> : <Plus size={15} className="stroke-[2.5]" />}
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
