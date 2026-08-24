"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Tag, Loader2 } from "lucide-react";
import { searchProducts } from "@/lib/actions/products";
import { getLowestPrice } from "@/lib/data/products";
import type { Product } from "@/lib/data/products";
import { formatPrice, formatUnitLabel, getProductPriceInfo } from "@/lib/formatters";

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      setResults([]);
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key globally with capture phase
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [onClose]);

  // Search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchProducts(query);
        setResults(res);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  if (!isOpen) return null;

  const popularSearches = [
    "Wires & Cables",
    "Modular Switches",
    "CPVC Pipes",
    "Sanitaryware",
    "Floor Tiles",
    "Plywood",
    "LED Lights",
    "Hardware & Fittings",
    "Granite & Marble",
    "Waterproofing",
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-start p-3 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 mt-4 sm:mt-12 flex flex-col max-h-[85vh]">
        {/* Search Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="p-3.5 sm:p-5 border-b border-gray-100 flex items-center gap-2.5 sm:gap-3"
        >
          {loading ? (
            <Loader2 size={20} className="text-[#F26522] animate-spin shrink-0" />
          ) : (
            <Search size={20} className="text-[#F26522] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            enterKeyHint="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                onClose();
              }
            }}
            placeholder="Search products, wires, tiles, pipes, hardware, plywood..."
            className="flex-1 text-sm sm:text-base font-semibold text-[#052a51] placeholder-gray-400 focus:outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              title="Clear search"
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close (Esc)"
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Esc
          </button>
        </form>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!query.trim() ? (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Popular Searches
              </p>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#052a51] text-xs font-bold rounded-full transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Tag size={12} className="text-[#F26522]" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-10 text-gray-400 text-sm">
              <Loader2 className="animate-spin inline-block mr-2 text-[#F26522]" size={18} />
              Searching catalog for "{query}"...
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-base font-bold text-[#052a51]">No matching products found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                Try searching with different keywords like 'wire', 'pipe', 'tile', 'plywood', 'switch', or view all in shop.
              </p>
              <div className="mt-4">
                <Link
                  href="/shop"
                  onClick={onClose}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26522] hover:underline"
                >
                  <span>Explore Full Catalog</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Results ({results.length})
                </p>
                <Link
                  href={`/shop?search=${encodeURIComponent(query.trim())}`}
                  onClick={onClose}
                  className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
                >
                  <span>View all in Shop</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                    <Image
                      src={product.images[0] || "/placeholders/product.svg"}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="56px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-[#F26522] uppercase tracking-wider">
                        {product.categoryName}
                      </span>
                      {product.material && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span className="text-[11px] text-gray-500">{product.material}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#052a51] line-clamp-1 group-hover:text-[#F26522] transition-colors">
                      {product.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {(() => {
                      const priceInfo = getProductPriceInfo(product);
                      return (
                        <div className="flex flex-col items-end">
                          <span className="text-xs sm:text-sm font-black text-[#052a51]">
                            {priceInfo.formattedPrice}
                          </span>
                          {priceInfo.discountPercent > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600">
                              {priceInfo.discountPercent}% off
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-[#F26522] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <Link
            href={query.trim() ? `/shop?search=${encodeURIComponent(query.trim())}` : "/shop"}
            onClick={onClose}
            className="text-xs font-bold text-[#F26522] hover:underline"
          >
            {query.trim()
              ? `View all results for "${query}" in Shop →`
              : "View Full Catalog in Shop →"}
          </Link>
        </div>
      </div>
    </div>
  );
}

