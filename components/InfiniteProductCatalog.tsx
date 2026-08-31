"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Sparkles, CheckCircle2, ArrowUp, Layers } from "lucide-react";
import CompactProductCard from "@/components/CompactProductCard";
import type { Product } from "@/lib/data/products";
import type { Category } from "@/lib/data/categories";

interface InfiniteProductCatalogProps {
  initialProducts?: Product[];
  categories?: Category[];
  excludeIds?: string[];
}

export default function InfiniteProductCatalog({
  initialProducts = [],
  categories = [],
  excludeIds = [],
}: InfiniteProductCatalogProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(initialProducts.length > 0);

  const seenIdsRef = useRef<Set<string>>(
    new Set([...excludeIds, ...initialProducts.map((p) => p.id)])
  );
  const observerTargetRef = useRef<HTMLDivElement | null>(null);

  // Fetch a page of products
  const fetchProducts = useCallback(
    async (pageToFetch: number, categorySlug: string, isReset = false) => {
      if (isLoading) return;
      setIsLoading(true);

      try {
        const excludeList = Array.from(seenIdsRef.current).slice(0, 100).join(",");
        const params = new URLSearchParams({
          page: pageToFetch.toString(),
          limit: "12",
          category: categorySlug,
          exclude: isReset ? "" : excludeList,
        });

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");

        const data: { products: Product[]; hasMore: boolean } = await res.json();
        const incomingProducts = data.products || [];

        // Deduplicate
        const uniqueIncoming: Product[] = [];
        for (const p of incomingProducts) {
          if (!seenIdsRef.current.has(p.id)) {
            seenIdsRef.current.add(p.id);
            uniqueIncoming.push(p);
          }
        }

        setProducts((prev) => (isReset ? uniqueIncoming : [...prev, ...uniqueIncoming]));
        setHasMore(data.hasMore && incomingProducts.length > 0);
        setPage(pageToFetch);
        setInitialLoaded(true);
      } catch (error) {
        console.error("Error loading products:", error);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // Initial fetch if no initialProducts were provided
  useEffect(() => {
    if (!initialLoaded && initialProducts.length === 0) {
      fetchProducts(1, selectedCategory, true);
    }
  }, [initialLoaded, initialProducts.length, selectedCategory, fetchProducts]);

  // Handle category change
  const handleCategoryChange = (categorySlug: string) => {
    if (selectedCategory === categorySlug || isLoading) return;
    setSelectedCategory(categorySlug);
    seenIdsRef.current = new Set(excludeIds);
    setProducts([]);
    setPage(1);
    setHasMore(true);
    fetchProducts(1, categorySlug, true);
  };

  // Setup Intersection Observer for infinite scrolling
  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          fetchProducts(page + 1, selectedCategory, false);
        }
      },
      {
        root: null,
        rootMargin: "350px",
        threshold: 0.05,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, isLoading, page, selectedCategory, fetchProducts]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 md:py-12 space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200/80 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/70 text-[10px] font-black uppercase tracking-wider text-[#F26522]">
            <Sparkles size={12} />
            <span>Complete Catalog</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#052a51] tracking-tight">
            Explore All Materials & Supplies
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl">
            Factory-direct tiles, electrical wires, sanitaryware, paints & hardware with direct 60-min delivery.
          </p>
        </div>

        {/* Total Product Count Counter */}
        {products.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500 shrink-0">
            <Layers size={15} className="text-[#F26522]" />
            <span>Showing {products.length} In-Stock Products</span>
          </div>
        )}
      </div>

      {/* ── Quick Category Filter Pills (if categories available) ── */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 ${
              selectedCategory === "all"
                ? "bg-[#052a51] text-white shadow-xs"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 10).map((cat) => (
            <button
              key={cat.id || cat.slug}
              type="button"
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shadow-2xs shrink-0 ${
                selectedCategory === cat.slug
                  ? "bg-[#052a51] text-white shadow-xs"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Responsive Product Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-4.5">
        {products.map((product) => (
          <CompactProductCard key={product.id} product={product} className="w-full" />
        ))}

        {/* Skeleton Cards when Loading */}
        {isLoading &&
          Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="bg-white rounded-2xl border border-gray-100 p-3 space-y-3 animate-pulse flex flex-col justify-between"
            >
              <div className="w-full aspect-square bg-gray-200 rounded-xl" />
              <div className="space-y-1.5">
                <div className="w-1/3 h-2.5 bg-gray-200 rounded-full" />
                <div className="w-full h-3 bg-gray-200 rounded-full" />
                <div className="w-2/3 h-3 bg-gray-200 rounded-full" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="w-12 h-3.5 bg-gray-200 rounded-full" />
                <div className="w-7 h-7 bg-gray-200 rounded-lg" />
              </div>
            </div>
          ))}
      </div>

      {/* ── Sentinel Observer Element ── */}
      <div ref={observerTargetRef} className="h-10 w-full flex items-center justify-center">
        {isLoading && (
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 py-4">
            <Loader2 size={16} className="animate-spin text-[#F26522]" />
            <span>Loading more products...</span>
          </div>
        )}
      </div>

      {/* ── End of Catalog Message ── */}
      {!hasMore && products.length > 0 && (
        <div className="text-center py-8 border-t border-gray-200/80 space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>You&apos;ve explored all {products.length} products in this catalog</span>
          </div>
          <div>
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#052a51] hover:text-[#F26522] transition-colors cursor-pointer bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs hover:border-[#F26522]"
            >
              <ArrowUp size={14} />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-8 space-y-3">
          <p className="text-sm font-bold text-[#052a51]">No products found in this category</p>
          <button
            type="button"
            onClick={() => handleCategoryChange("all")}
            className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Show All Categories
          </button>
        </div>
      )}
    </section>
  );
}
