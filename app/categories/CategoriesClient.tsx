"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Sun,
  Grid,
  Palette,
  Square,
  Layers,
  DoorOpen,
  Maximize,
  Wrench,
  Armchair,
  Package,
  Droplets,
  Wallpaper,
  Sparkles,
  Sliders,
  Building,
  Trees,
  Cpu,
  ShieldAlert,
  Hammer,
  Search,
  ArrowLeft,
  ChevronRight,
  Sparkle,
} from "lucide-react";
import type { Category } from "@/lib/data/categories";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ICON_MAP: Record<string, any> = {
  Zap,
  Sun,
  Grid,
  Palette,
  Square,
  Layers,
  DoorOpen,
  Maximize,
  Wrench,
  Armchair,
  Package,
  Droplets,
  Wallpaper,
  Sparkles,
  Sliders,
  Building,
  Trees,
  Cpu,
  ShieldAlert,
  Hammer,
};

function getCategoryIcon(iconName?: string) {
  if (!iconName) return <Grid size={22} />;
  const IconComponent = ICON_MAP[iconName];
  if (!IconComponent) return <Grid size={22} />;
  return <IconComponent size={22} />;
}

export default function CategoriesClient({
  categories,
}: {
  categories: Category[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const topCategories = useMemo(() => {
    return categories.filter((c) => !c.parentId);
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return topCategories;
    const q = searchQuery.toLowerCase().trim();
    return topCategories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
    );
  }, [topCategories, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between">
      {/* Header */}
      <Header />

      <main className="flex-1 pt-[76px] md:pt-[170px] pb-24 md:pb-16">
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
          {/* Mobile Top Bar */}
          <div className="md:hidden flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-[#052a51] shadow-2xs active:scale-95 transition-transform shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-black text-[#052a51]">All Categories</h1>
              <p className="text-[11px] text-gray-500 font-medium">
                Explore all 20 supply departments
              </p>
            </div>
          </div>

          {/* Desktop Heading Banner */}
          <div className="hidden md:block mb-8 bg-gradient-to-r from-[#052a51] via-[#093d75] to-[#052a51] rounded-3xl p-8 text-white shadow-xs relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#F26522] bg-[#F26522]/15 px-3 py-1 rounded-full">
                Complete Catalog Index
              </span>
              <h1 className="text-3xl lg:text-4xl font-black mt-2 tracking-tight">
                All 20 Supply & Material Categories
              </h1>
              <p className="text-sm text-white/70 mt-2 leading-relaxed">
                Direct factory sourcing for electricals, tiles, lighting, hardware, plumbing, sanitaryware, and architectural finishes with Bangalore doorstep delivery.
              </p>
            </div>
          </div>

          {/* Search Filter Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search categories (e.g., Tiles, Electrical, Wires, Granite)..."
                className="w-full h-11 pl-10 pr-4 bg-white border border-gray-200 focus:border-[#F26522] rounded-2xl text-xs font-semibold text-[#052a51] outline-none shadow-2xs transition-colors placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Count Pill */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500">
              Showing <span className="text-[#052a51] font-black">{filteredCategories.length}</span> of {topCategories.length} Departments
            </p>
          </div>

          {/* Categories Grid */}
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 max-w-md mx-auto my-8 shadow-2xs">
              <Package size={36} className="mx-auto text-gray-300 mb-3" />
              <h3 className="font-black text-sm text-[#052a51]">No categories match "{searchQuery}"</h3>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Try searching for tiles, electrical, plumbing, paint or hardware.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl"
              >
                Reset Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 md:gap-5">
              {filteredCategories.map((cat, index) => {
                const subcats = categories.filter((c) => c.parentId === cat.id);
                return (
                  <Link
                    key={cat.id || cat.slug}
                    href={`/shop?category=${cat.slug}`}
                    className="group bg-white rounded-3xl p-5 border border-gray-200/80 hover:border-[#F26522]/50 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden active:scale-98"
                  >
                    {/* Top Accent Strip on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#F26522] opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div>
                      {/* Icon & Index Badge */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#052a51]/5 group-hover:bg-[#F26522]/10 text-[#052a51] group-hover:text-[#F26522] flex items-center justify-center transition-colors shadow-2xs">
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <span className="text-[11px] font-black text-gray-400 group-hover:text-[#F26522] transition-colors">
                          #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Name */}
                      <h2 className="text-base font-black text-[#052a51] group-hover:text-[#F26522] transition-colors line-clamp-1">
                        {cat.name}
                      </h2>

                      {/* Description */}
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {cat.description}
                      </p>

                      {/* Subcategories preview if any */}
                      {subcats.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {subcats.map((sub) => (
                            <span
                              key={sub.id || sub.slug}
                              className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md"
                            >
                              {sub.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom CTA bar */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors">
                      <span>Explore Supplies</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Desktop Footer (Hidden on mobile) */}
      <Footer />
    </div>
  );
}
