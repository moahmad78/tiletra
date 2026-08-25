"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import CompactProductCard from "@/components/CompactProductCard";
import { products as defaultProducts, type Product } from "@/lib/data/products";

interface DiscoverMoreSectionProps {
  currentProductId?: string;
  excludedProductIds?: string[];
  title?: string;
  catalog?: Product[];
}

export default function DiscoverMoreSection({
  currentProductId,
  excludedProductIds = [],
  title = "Suggested for You",
  catalog = defaultProducts,
}: DiscoverMoreSectionProps) {
  const [mounted, setMounted] = useState(false);
  const [allSuggestedProducts, setAllSuggestedProducts] = useState<Product[]>([]);

  useEffect(() => {
    setMounted(true);

    const excludedSet = new Set([
      ...(currentProductId ? [currentProductId] : []),
      ...excludedProductIds,
    ]);

    const pool = (catalog && catalog.length > 0 ? catalog : defaultProducts).filter(
      (p) => !excludedSet.has(p.id) && !excludedSet.has(p.slug)
    );

    if (pool.length === 0) return;

    // Group by category to ensure rich cross-category variety
    const categoryMap = new Map<string, Product[]>();
    for (const p of pool) {
      const catKey = p.categorySlug || "other";
      const list = categoryMap.get(catKey) || [];
      list.push(p);
      categoryMap.set(catKey, list);
    }

    // Shuffle inside each category bucket
    const categoriesArray = Array.from(categoryMap.keys()).sort(() => Math.random() - 0.5);
    const categoryQueues = categoriesArray.map((catKey) => {
      const items = [...(categoryMap.get(catKey) || [])];
      return items.sort(() => Math.random() - 0.5);
    });

    // Round-robin selection across diverse categories so all products are included
    const shuffled: Product[] = [];
    let hasItems = true;
    while (hasItems) {
      hasItems = false;
      for (const queue of categoryQueues) {
        if (queue.length > 0) {
          shuffled.push(queue.shift()!);
          hasItems = true;
        }
      }
    }

    setAllSuggestedProducts(shuffled);
  }, [catalog, currentProductId, excludedProductIds]);

  if (!mounted || allSuggestedProducts.length === 0) return null;

  // Horizontal Quick Swipe list (Top 10-12 items)
  const horizontalProducts = allSuggestedProducts.slice(0, 12);

  return (
    <section className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200/80 shadow-2xs space-y-4">
      {/* ── Minimalist Clean Header ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-black text-[#052a51] tracking-tight">
          {title}
        </h3>

        <Link
          href="/shop"
          className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1 group"
        >
          <span>View All</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* ── 1. Horizontal Left-Right Swipe Slider ── */}
      <div className="flex gap-2.5 sm:gap-3 overflow-x-auto snap-x snap-mandatory pt-1 pb-2 no-scrollbar scroll-smooth">
        {horizontalProducts.map((product) => (
          <div key={`h-${product.id}`} className="snap-start shrink-0">
            <CompactProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-[10px] font-black uppercase text-gray-400 tracking-wider">
            More to Explore
          </span>
        </div>
      </div>

      {/* ── 2. All Suggested Items Grid (Phone & Desktop) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5 sm:gap-3.5">
        {allSuggestedProducts.map((product) => (
          <div key={`g-${product.id}`} className="h-full">
            <CompactProductCard product={product} className="w-full h-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
