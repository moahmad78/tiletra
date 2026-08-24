"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Compass } from "lucide-react";
import CompactProductCard from "@/components/CompactProductCard";
import { products as defaultProducts, type Product } from "@/lib/data/products";

interface DiscoverMoreSectionProps {
  currentProductId?: string;
  excludedProductIds?: string[];
  title?: string;
  subtitle?: string;
  catalog?: Product[];
}

export default function DiscoverMoreSection({
  currentProductId,
  excludedProductIds = [],
  title = "Discover More at Intrihub",
  subtitle = "Popular materials & finishes from across our 20 departments",
  catalog = defaultProducts,
}: DiscoverMoreSectionProps) {
  const [shuffledProducts, setShuffledProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

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

    // Group by category for high cross-category diversity
    const categoryMap = new Map<string, Product[]>();
    for (const p of pool) {
      const list = categoryMap.get(p.categorySlug) || [];
      list.push(p);
      categoryMap.set(p.categorySlug, list);
    }

    // Shuffle inside each category
    const categoriesArray = Array.from(categoryMap.keys()).sort(() => Math.random() - 0.5);
    const categoryQueues = categoriesArray.map((catKey) => {
      const items = [...(categoryMap.get(catKey) || [])];
      return items.sort(() => Math.random() - 0.5);
    });

    // Round-robin selection across different categories
    const selected: Product[] = [];
    let round = 0;
    const maxRounds = 5;
    while (selected.length < 12 && round < maxRounds) {
      let addedInRound = false;
      for (const queue of categoryQueues) {
        if (queue.length > 0 && selected.length < 12) {
          const item = queue.shift()!;
          selected.push(item);
          addedInRound = true;
        }
      }
      if (!addedInRound) break;
      round++;
    }

    setShuffledProducts(selected);
  }, [catalog, currentProductId, excludedProductIds]);

  if (!mounted || shuffledProducts.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/80 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
            Explore Broader Catalog
          </span>
          <h3 className="text-lg sm:text-xl font-black text-[#052a51] mt-1">
            {title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        <Link
          href="/shop"
          className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1 group"
        >
          <span>Explore All 20 Categories</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Mobile Swipeable Slider */}
      <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pt-1 pb-2 scrollbar-none">
        {shuffledProducts.map((product) => (
          <div key={product.id} className="snap-start shrink-0">
            <CompactProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Desktop Grid Layout */}
      <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pt-1">
        {shuffledProducts.map((product) => (
          <CompactProductCard
            key={product.id}
            product={product}
            className="w-full h-full"
          />
        ))}
      </div>
    </section>
  );
}
