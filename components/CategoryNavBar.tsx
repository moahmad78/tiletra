"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Sparkles, ArrowRight, Layers, Home, Flame } from "lucide-react";
import { categories } from "@/lib/data/categories";

const POPULAR_FINISHES = [
  { name: "High-Gloss Polished", slug: "polished", desc: "Reflective mirror shine" },
  { name: "Satin Matte", slug: "matte", desc: "Smooth non-reflective texture" },
  { name: "Rustic Textured", slug: "textured", desc: "Anti-slip outdoor grip" },
  { name: "Carving Finish", slug: "carving", desc: "Subtle tactile grooves" },
];

const POPULAR_SIZES = [
  { label: "800x800mm", desc: "Large Grand Living Rooms" },
  { label: "600x600mm", desc: "Standard Living & Bedrooms" },
  { label: "300x600mm", desc: "Wall & Bathroom Tiles" },
  { label: "300x150mm", desc: "Subway Kitchen Splashbacks" },
];

export default function CategoryNavBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <div className="hidden md:block bg-white border-b border-gray-200 shadow-2xs relative z-40">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        <div className="flex items-center justify-between h-[44px] text-xs font-bold text-[#052a51]">
          {/* Categories List */}
          <nav className="flex items-center gap-1 lg:gap-2">
            {categories.map((cat) => (
              <div
                key={cat.slug}
                className="relative group"
                onMouseEnter={() => setActiveMenu(cat.slug)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <Link
                  href={`/shop/${cat.slug}`}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:text-[#F26522] hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <span>{cat.name}</span>
                  <ChevronDown
                    size={13}
                    className="text-gray-400 group-hover:text-[#F26522] transition-transform group-hover:rotate-180"
                  />
                </Link>

                {/* Mega-menu Dropdown on Hover */}
                {activeMenu === cat.slug && (
                  <div className="absolute top-full left-0 w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                      <div>
                        <h4 className="font-black text-[#052a51] text-sm">{cat.name}</h4>
                        <p className="text-[11px] text-gray-500">{cat.description}</p>
                      </div>
                      <Link
                        href={`/shop/${cat.slug}`}
                        className="text-[11px] font-bold text-[#F26522] hover:underline flex items-center gap-1"
                      >
                        All {cat.name} <ArrowRight size={12} />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: Popular Finishes */}
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                          Popular Finishes
                        </span>
                        <div className="space-y-1.5">
                          {POPULAR_FINISHES.map((f) => (
                            <Link
                              key={f.slug}
                              href={`/shop/${cat.slug}?finish=${f.slug}`}
                              className="block p-1.5 rounded-lg hover:bg-[#F26522]/5 transition-colors group/item"
                            >
                              <p className="text-xs font-bold text-[#052a51] group-hover/item:text-[#F26522]">
                                {f.name}
                              </p>
                              <p className="text-[10px] text-gray-400">{f.desc}</p>
                            </Link>
                          ))}
                        </div>
                      </div>

                      {/* Right: Popular Sizes */}
                      <div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-2">
                          Sizes
                        </span>
                        <div className="space-y-1.5">
                          {POPULAR_SIZES.map((s) => (
                            <Link
                              key={s.label}
                              href={`/shop/${cat.slug}?size=${s.label}`}
                              className="block p-1.5 rounded-lg hover:bg-[#052a51]/5 transition-colors group/item"
                            >
                              <p className="text-xs font-bold text-[#052a51] group-hover/item:text-[#F26522]">
                                {s.label}
                              </p>
                              <p className="text-[10px] text-gray-400">{s.desc}</p>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Room Inspiration Link */}
            <Link
              href="/inspiration"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[#F26522] hover:bg-[#F26522]/10 transition-colors whitespace-nowrap font-black"
            >
              <Sparkles size={14} />
              <span>Room Inspiration</span>
            </Link>
          </nav>

          {/* Right Highlights */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-gray-500">
            <Link
              href="/shop?sort=Price:+Low+to+High"
              className="hover:text-[#052a51] transition-colors"
            >
              Budget Tiles Under ₹50/sq.ft
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              href="/shop?sort=Popular"
              className="hover:text-[#052a51] transition-colors flex items-center gap-1"
            >
              <Flame size={13} className="text-[#F26522]" /> Bestselling Floor Tiles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
