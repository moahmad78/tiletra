"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  Package,
  Layers,
  ArrowRight,
} from "lucide-react";
import type { Category } from "@/lib/data/categories";
import type { Product } from "@/lib/data/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompactProductCard from "@/components/CompactProductCard";

function getCategoryShortName(name: string): string {
  const map: Record<string, string> = {
    "Electrical": "Electrical",
    "Lighting": "Lighting",
    "Tiles & Stone": "Tiles",
    "Paint & Finishes": "Paints",
    "False Ceiling": "Ceiling",
    "Flooring": "Flooring",
    "Doors & Windows": "Doors",
    "Glass & Mirror": "Glass",
    "Hardware & Fittings": "Hardware",
    "Furniture": "Furniture",
    "Kitchen & Wardrobe": "Kitchen",
    "Plumbing & Sanitary": "Plumbing",
    "Wall & Surface": "Wall Surface",
    "Decor & Accessories": "Decor",
    "Curtains & Blinds": "Curtains",
    "Office & Commercial": "Office",
    "Outdoor & Landscape": "Outdoor",
    "Smart Home": "Smart Home",
    "Safety & Fire": "Safety",
    "Tools & Consumables": "Tools",
  };
  return map[name] || name;
}

export default function CategoriesClient({
  categories,
  initialProducts = [],
}: {
  categories: Category[];
  initialProducts?: Product[];
}) {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const topCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const activeCategory = useMemo(() => {
    if (selectedCategorySlug === "all") return null;
    return topCategories.find((c) => c.slug === selectedCategorySlug) || null;
  }, [topCategories, selectedCategorySlug]);

  // Subcategories of selected category (if any)
  const subcategories = useMemo(() => {
    if (!activeCategory) return [];
    return categories.filter((c) => c.parentId === activeCategory.id);
  }, [categories, activeCategory]);

  // Filtered Products for selected category
  const displayedProducts = useMemo(() => {
    let list = initialProducts;

    // 1. Filter by category
    if (selectedCategorySlug !== "all") {
      const matchSlug = selectedCategorySlug.toLowerCase();
      const directMatches = list.filter((p) => {
        const catSlug = p.categorySlug?.toLowerCase() || "";
        const catName = p.categoryName?.toLowerCase() || "";
        return (
          catSlug === matchSlug ||
          catSlug.includes(matchSlug) ||
          matchSlug.includes(catSlug) ||
          catName.includes(activeCategory?.name.toLowerCase() || "")
        );
      });

      if (directMatches.length > 0) {
        list = directMatches;
      } else {
        // Fallback: show popular products so user is never presented with an empty void
        list = initialProducts.slice(0, 12);
      }
    }

    // 2. Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.categorySlug.toLowerCase().includes(q)
      );
    }

    return list;
  }, [initialProducts, selectedCategorySlug, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between">
      {/* Header */}
      <Header />

      <main className="flex-1 pt-[60px] md:pt-[150px] pb-24 md:pb-16">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 space-y-4">
          
          {/* Mobile Top Navigation & Search Bar */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="md:hidden w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#052a51] shadow-2xs active:scale-95 transition-transform shrink-0"
                  aria-label="Back to home"
                >
                  <ArrowLeft size={16} />
                </Link>
                <div>
                  <h1 className="text-lg sm:text-2xl font-black text-[#052a51] leading-tight">
                    Explore Categories
                  </h1>
                  <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                    20+ Building, Interior & Electrical Departments
                  </p>
                </div>
              </div>

              {activeCategory && (
                <Link
                  href={`/shop/${activeCategory.slug}`}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#F26522] hover:underline"
                >
                  <span>Full Catalog</span>
                  <ArrowRight size={13} />
                </Link>
              )}
            </div>

            {/* Quick Search */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, materials, or brands..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium text-[#052a51] placeholder-gray-400 focus:outline-none focus:border-[#F26522] shadow-2xs transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* ── 1. CATEGORY VISUAL BOXES (Horizontal Scroll Row on Mobile & Desktop) ── */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1.5">
                <Layers size={13} className="text-[#F26522]" />
                Select Category:
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                Tap to filter
              </span>
            </div>

            {/* Horizontal Scrollable Category Boxes */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
              {/* "All" Category Box */}
              <button
                type="button"
                onClick={() => setSelectedCategorySlug("all")}
                className={`flex flex-col items-center shrink-0 w-[64px] sm:w-[72px] group cursor-pointer transition-all active:scale-95 ${
                  selectedCategorySlug === "all" ? "scale-105" : "opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-2xl overflow-hidden relative p-0.5 border-2 transition-all flex items-center justify-center ${
                    selectedCategorySlug === "all"
                      ? "border-[#F26522] bg-[#F26522]/10 shadow-sm ring-2 ring-[#F26522]/20"
                      : "border-gray-200 bg-gray-50 group-hover:border-gray-300"
                  }`}
                >
                  <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-[#052a51] to-[#0a427d] flex flex-col items-center justify-center text-white">
                    <Sparkles size={20} className="text-[#F26522]" />
                    <span className="text-[9px] font-black uppercase tracking-wider mt-0.5">All</span>
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold mt-1.5 text-center leading-tight truncate max-w-full ${
                    selectedCategorySlug === "all" ? "text-[#F26522] font-black" : "text-[#052a51]"
                  }`}
                >
                  All Items
                </span>
              </button>

              {/* 20 Department Category Boxes */}
              {topCategories.map((cat) => {
                const isSelected = selectedCategorySlug === cat.slug;
                const shortName = getCategoryShortName(cat.name);

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`flex flex-col items-center shrink-0 w-[64px] sm:w-[72px] group cursor-pointer transition-all active:scale-95 ${
                      isSelected ? "scale-105" : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    <div
                      className={`w-[56px] h-[56px] sm:w-[62px] sm:h-[62px] rounded-2xl overflow-hidden relative p-0.5 border-2 transition-all ${
                        isSelected
                          ? "border-[#F26522] bg-orange-50 shadow-sm ring-2 ring-[#F26522]/20"
                          : "border-gray-200 bg-white group-hover:border-gray-300"
                      }`}
                    >
                      <div className="w-full h-full rounded-[12px] overflow-hidden relative bg-gray-100">
                        <Image
                          src={cat.image || "/placeholders/category.svg"}
                          alt={cat.name}
                          fill
                          loading="eager"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="64px"
                        />
                        <div
                          className={`absolute inset-0 transition-colors ${
                            isSelected ? "bg-orange-500/10" : "bg-black/10 group-hover:bg-black/0"
                          }`}
                        />
                      </div>
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-1.5 text-center leading-tight truncate max-w-full ${
                        isSelected ? "text-[#F26522] font-black" : "text-[#052a51] group-hover:text-[#F26522]"
                      }`}
                    >
                      {shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 2. ACTIVE CATEGORY HEADER STRIP & SUBCATEGORIES ── */}
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-[#052a51]">
                  {activeCategory ? activeCategory.name : "All Construction & Interior Supplies"}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-[#F26522]">
                  {displayedProducts.length} items
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {activeCategory
                  ? activeCategory.description
                  : "Explore materials across all 20 specialized interior and construction departments"}
              </p>
            </div>

            {activeCategory && (
              <Link
                href={`/shop/${activeCategory.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-2xs shrink-0 self-start sm:self-auto"
              >
                <span>View Full Category</span>
                <ChevronRight size={14} className="text-[#F26522]" />
              </Link>
            )}
          </div>

          {/* Subcategory Filter Chips (if any) */}
          {subcategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[10px] font-bold uppercase text-gray-400 shrink-0">
                Subcategories:
              </span>
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/shop/${sub.slug}`}
                  className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 hover:border-[#F26522] text-[11px] font-bold text-[#052a51] shrink-0 transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}

          {/* ── 3. PRODUCT CARDS GRID (AT LEAST 2 CARDS PER ROW ON MOBILE) ── */}
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {displayedProducts.map((product) => (
                <div key={product.id} className="h-full">
                  <CompactProductCard product={product} className="w-full h-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-2xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center mx-auto">
                <Package size={24} />
              </div>
              <h3 className="text-sm font-black text-[#052a51]">No matching products found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try searching for a different keyword or browse another category from the top bar.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorySlug("all");
                  setSearchQuery("");
                }}
                className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] transition-all cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}

        </div>
      </main>

      {/* Footer (Hidden on mobile < md) */}
      <Footer />
    </div>
  );
}
