"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import CompactProductCard from "@/components/CompactProductCard";
import { products as defaultProducts, type Product } from "@/lib/data/products";

const emptySubscribe = () => () => {};

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
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const allSuggestedProducts = useMemo(() => {
    const excludedSet = new Set([
      ...(currentProductId ? [currentProductId] : []),
      ...excludedProductIds,
    ]);

    const pool = (catalog && catalog.length > 0 ? catalog : defaultProducts).filter(
      (p) => !excludedSet.has(p.id) && !excludedSet.has(p.slug)
    );

    if (pool.length === 0) return [];

    // Group by category to ensure rich cross-category variety
    const categoryMap = new Map<string, Product[]>();
    for (const p of pool) {
      const catKey = p.categorySlug || "other";
      const list = categoryMap.get(catKey) || [];
      list.push(p);
      categoryMap.set(catKey, list);
    }

    // Deterministic shuffle using id hash for pure rendering
    const hash = (str: string) => {
      let h = 0;
      for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) & 0x7fffffff;
      }
      return h;
    };

    const categoriesArray = Array.from(categoryMap.keys()).sort((a, b) => hash(a) - hash(b));
    const categoryQueues = categoriesArray.map((catKey) => {
      const items = [...(categoryMap.get(catKey) || [])];
      return items.sort((a, b) => hash(a.id) - hash(b.id));
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

    return shuffled;
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
          <div key={`h-${product.id}`} className="snap-start shrink-0 w-[150px] sm:w-[165px] md:w-[175px] xl:w-[calc((100%-60px)/6)]">
            <CompactProductCard product={product} className="w-full h-full" />
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {allSuggestedProducts.map((product) => (
          <div key={`g-${product.id}`} className="h-full">
            <CompactProductCard product={product} className="w-full h-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
