"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import type { Product } from "@/lib/data/products";
import CompactProductCard from "@/components/CompactProductCard";

interface CategoryCatalogClientProps {
  products: Product[];
  categoryName: string;
}

export default function CategoryCatalogClient({
  products,
  categoryName,
}: CategoryCatalogClientProps) {
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset if products array changes
  useEffect(() => {
    setVisibleCount(12);
  }, [products]);

  const displayedProducts = useMemo(() => {
    return products.slice(0, visibleCount);
  }, [products, visibleCount]);

  const hasMore = visibleCount < products.length;

  useEffect(() => {
    if (!hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 12, products.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: "250px" }
    );

    const target = loadMoreRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [hasMore, isLoadingMore, products.length]);

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-14 text-center border border-gray-100 shadow-sm max-w-md mx-auto my-8 space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F26522]/10 border border-[#F26522]/20 flex items-center justify-center text-[#F26522] mb-2">
          <Sparkles size={24} />
        </div>
        <h2 className="text-lg sm:text-xl font-black text-[#052a51]">No products in {categoryName} yet</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
          We are curating high-grade {categoryName} supplies. Explore our full catalog for other available materials.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <span>Browse All Supplies</span> <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Category Title & Count Header */}
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold mb-0.5">
            <Link href="/" className="hover:text-[#F26522] transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-[#F26522] transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-[#052a51]">{categoryName}</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-[#052a51] leading-tight">
            {categoryName}
          </h1>
        </div>
        <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200/70 px-3 py-1.5 rounded-xl shrink-0">
          <span className="text-[#052a51] font-black">{products.length}</span> {products.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
        <AnimatePresence>
          {displayedProducts.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ delay: Math.min((i % 12) * 0.02, 0.2) }}
              className="h-full"
            >
              <CompactProductCard product={product} className="w-full h-full" />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Skeleton loaders while loading next batch */}
        {isLoadingMore && (
          <>
            {[1, 2, 3, 4].map((n) => (
              <div
                key={`cat-skel-${n}`}
                className="bg-white rounded-2xl p-2.5 sm:p-3 border border-gray-100 shadow-2xs animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-square bg-gray-100 rounded-xl w-full" />
                  <div className="h-3.5 bg-gray-100 rounded w-3/4 mt-2.5" />
                  <div className="h-2.5 bg-gray-100/70 rounded w-1/2 mt-1.5" />
                </div>
                <div className="flex justify-between items-end pt-2 mt-2 border-t border-gray-50">
                  <div>
                    <div className="h-3.5 bg-gray-100 rounded w-12" />
                    <div className="h-2.5 bg-gray-100/60 rounded w-10 mt-1" />
                  </div>
                  <div className="w-7 h-7 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 flex justify-center items-center">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-xs">
            <Loader2 size={14} className="animate-spin text-[#F26522]" />
            <span>Loading more {categoryName}...</span>
          </div>
        </div>
      )}

      {/* End of Category results message */}
      {!hasMore && products.length > 0 && (
        <div className="mt-12 py-6 text-center border-t border-gray-200/60">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-500 text-xs font-bold border border-gray-200 shadow-xs">
            <Sparkles size={13} className="text-[#F26522]" />
            <span>You've seen all {products.length} {products.length === 1 ? "item" : "items"} in {categoryName}</span>
          </div>
        </div>
      )}
    </div>
  );
}
