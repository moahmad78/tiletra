"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { SlidersHorizontal, X, ChevronDown, Check } from "lucide-react";
import { products, getLowestPrice } from "@/lib/data/products";
import { categories } from "@/lib/data/categories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

const FINISHES = ["Matte", "Glossy", "Textured", "Satin", "Polished"] as const;
const MATERIALS = ["Ceramic", "Vitrified", "Porcelain", "Natural Stone", "Mosaic"] as const;
const SIZES = ["300x300mm", "300x600mm", "600x600mm", "800x800mm"] as const;
const SORTS = ["Popular", "Price: Low to High", "Price: High to Low", "New Arrivals"] as const;

type SortOption = (typeof SORTS)[number];

export default function ShopPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFinishes, setSelectedFinishes] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [sort, setSort] = useState<SortOption>("Popular");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileSortOpen, setMobileSortOpen] = useState(false);

  function toggle<T>(list: T[], item: T): T[] {
    return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
  }

  const filtered = useMemo(() => {
    let result = [...products];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.categorySlug));
    }
    if (selectedFinishes.length > 0) {
      result = result.filter((p) =>
        p.variants.some((v) => selectedFinishes.includes(v.finish))
      );
    }
    if (selectedMaterials.length > 0) {
      result = result.filter((p) => selectedMaterials.includes(p.material));
    }
    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.variants.some((v) => selectedSizes.some((s) => v.size.includes(s)))
      );
    }
    result = result.filter((p) => {
      const lowestSqft = getLowestPrice(p);
      return lowestSqft >= priceRange[0] && lowestSqft <= priceRange[1];
    });

    switch (sort) {
      case "Price: Low to High":
        result.sort((a, b) => getLowestPrice(a) - getLowestPrice(b));
        break;
      case "Price: High to Low":
        result.sort((a, b) => getLowestPrice(b) - getLowestPrice(a));
        break;
      case "New Arrivals":
        result = result.filter((p) => p.isNew).concat(result.filter((p) => !p.isNew));
        break;
      default: // Popular
        result.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    return result;
  }, [selectedCategories, selectedFinishes, selectedMaterials, selectedSizes, priceRange, sort]);

  const activeFilterCount =
    selectedCategories.length + selectedFinishes.length + selectedMaterials.length + selectedSizes.length;

  function clearFilters() {
    setSelectedCategories([]);
    setSelectedFinishes([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setPriceRange([0, 300]);
  }

  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-[#052a51] text-sm mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat.slug} className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.slug)}
                onChange={() => setSelectedCategories(toggle(selectedCategories, cat.slug))}
                className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-[#052a51] transition-colors">
                {cat.name}
              </span>
              <span className="ml-auto text-xs text-gray-400">{cat.productCount}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Finish */}
      <div>
        <h3 className="font-bold text-[#052a51] text-sm mb-3">Finish</h3>
        <div className="flex flex-wrap gap-2">
          {FINISHES.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFinishes(toggle(selectedFinishes, f))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                selectedFinishes.includes(f)
                  ? "bg-[#F26522] text-white border-[#F26522] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#F26522] hover:text-[#F26522]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Material */}
      <div>
        <h3 className="font-bold text-[#052a51] text-sm mb-3">Material</h3>
        <div className="space-y-2">
          {MATERIALS.map((m) => (
            <label key={m} className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={selectedMaterials.includes(m)}
                onChange={() => setSelectedMaterials(toggle(selectedMaterials, m))}
                className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600 group-hover:text-[#052a51] transition-colors">{m}</span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Size */}
      <div>
        <h3 className="font-bold text-[#052a51] text-sm mb-3">Size</h3>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSizes(toggle(selectedSizes, s))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all active:scale-95 ${
                selectedSizes.includes(s)
                  ? "bg-[#052a51] text-white border-[#052a51] shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#052a51] hover:text-[#052a51]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Price per sqft */}
      <div>
        <h3 className="font-bold text-[#052a51] text-sm mb-3">
          Price: ₹{priceRange[0]} – ₹{priceRange[1]} <span className="text-xs font-normal text-gray-500">/sq.ft</span>
        </h3>
        <input
          type="range"
          min={0}
          max={300}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
          className="w-full accent-[#F26522] cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1 font-medium">
          <span>₹0</span>
          <span>₹300/sq.ft</span>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 text-sm font-bold text-red-500 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 active:scale-95 transition-all"
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      {/* Page Header Banner */}
      <div
        className="bg-[#052a51] text-white pt-[110px] md:pt-[168px] pb-9"
      >
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-white/50 mb-3">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Shop Tiles</span>
          </nav>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-xs md:text-sm font-bold text-[#F26522] uppercase tracking-[3px] mb-1">Catalog</p>
              <h1 className="text-[32px] md:text-[44px] font-black leading-tight">Explore Tiles</h1>
            </div>
            <p className="text-white/70 text-sm font-medium">
              Showing {filtered.length} of {products.length} tile designs
            </p>
          </div>
        </div>
      </div>

      {/* Horizontal Scrollable Category Chips (App Pattern) */}
      <div className="bg-white border-b border-gray-200 sticky top-[70px] md:top-[120px] z-30 shadow-sm">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-3 overflow-x-auto no-scrollbar flex items-center gap-2.5">
          <button
            onClick={() => setSelectedCategories([])}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
              selectedCategories.length === 0
                ? "bg-[#052a51] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Tiles ({products.length})
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategories.includes(cat.slug);
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategories(toggle(selectedCategories, cat.slug))}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-[#F26522] text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {isSelected && <Check size={12} />}
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-8 flex-1">
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-[150px] bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-h-[calc(100vh-180px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-[#052a51] text-base">Filters</h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <FilterSidebar />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Filter bar & Sort */}
            <div className="flex items-center justify-between gap-3 mb-6 flex-wrap bg-white p-3.5 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-xs md:text-sm text-gray-500 font-medium">
                Found <span className="text-[#052a51] font-black">{filtered.length}</span> tiles
              </p>

              <div className="flex items-center gap-2">
                {/* Mobile Filter Sheet Button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 bg-gray-100 rounded-xl text-xs font-bold text-[#052a51] hover:bg-gray-200 active:scale-95 transition-all"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#F26522] text-white text-[10px] font-black flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Mobile Sort Sheet Button */}
                <button
                  onClick={() => setMobileSortOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 rounded-xl text-xs font-bold text-[#052a51] hover:bg-gray-200 active:scale-95 transition-all"
                >
                  <span>Sort: {sort.split(":")[0]}</span>
                  <ChevronDown size={14} />
                </button>

                {/* Desktop Sort Dropdown */}
                <div className="hidden lg:flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-400">Sort by:</span>
                  <div className="relative">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortOption)}
                      className="appearance-none pl-3.5 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522] cursor-pointer"
                    >
                      {SORTS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {filtered.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm my-6">
                <p className="text-2xl font-black text-[#052a51]">No matching tiles found</p>
                <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
                  Try adjusting your filters or price range to find available tile designs.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-6 px-6 py-2.5 bg-[#F26522] text-white text-sm font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all shadow-md"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                <AnimatePresence>
                  {filtered.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 16 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    >
                      <ProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Bottom Sheet (Flipkart App Pattern) */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-[#F26522]" />
                <h2 className="text-lg font-black text-[#052a51]">Filters</h2>
                {activeFilterCount > 0 && (
                  <span className="text-xs font-bold text-gray-500">({activeFilterCount} active)</span>
                )}
              </div>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <FilterSidebar />
            </div>

            <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex-1 h-12 border-2 border-gray-200 text-[#052a51] font-bold rounded-xl active:scale-95"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex-[2] h-12 bg-[#052a51] text-white font-bold rounded-xl shadow-md active:scale-95"
              >
                Show {filtered.length} Tiles
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Sort Bottom Sheet */}
      {mobileSortOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileSortOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-black text-[#052a51] text-base">Sort Tiles By</h3>
              <button onClick={() => setMobileSortOpen(false)} className="text-gray-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-1">
              {SORTS.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSort(option);
                    setMobileSortOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition-colors ${
                    sort === option
                      ? "bg-[#F26522]/10 text-[#F26522]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{option}</span>
                  {sort === option && <Check size={16} className="text-[#F26522]" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <Footer />
    </main>
  );
}
