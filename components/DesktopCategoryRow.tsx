"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/data/categories";
import { SafeImage } from "@/components/ui/SafeImage";

interface DesktopCategoryRowProps {
  categories: Category[];
}

function SafeDesktopCategoryCard({
  cat,
  priority = false,
}: {
  cat: Category;
  priority?: boolean;
}) {
  const categoryImage = cat.image && cat.image.trim() ? cat.image : `/images/categories/cat-${cat.slug}.jpg`;

  return (
    <Link
      href={`/shop/${cat.slug}`}
      aria-label={`Explore ${cat.name}`}
      className="shrink-0 w-[155px] sm:w-[165px] lg:w-[175px] group"
    >
      <div className="bg-white rounded-2xl p-2 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#F26522] transition-all text-center flex flex-col h-full active:scale-98">
        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <SafeImage
            src={categoryImage}
            alt={cat.name}
            fill
            priority={priority}
            className="object-cover group-hover:scale-108 transition-transform duration-300"
            sizes="175px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="px-1 pt-2 pb-1 flex flex-col items-center justify-between flex-1">
          <p className="text-xs sm:text-sm font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors leading-tight line-clamp-1">
            {cat.name}
          </p>
          <span className="text-[11px] text-gray-500 font-semibold mt-1 inline-flex items-center gap-0.5 group-hover:text-[#F26522] transition-colors">
            {cat.productCount > 0 ? `${cat.productCount} Items` : "Explore"}
            <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * DesktopCategoryRow (INP Optimized)
 * Replaces continuous 60fps JavaScript rAF loops with GPU-accelerated native smooth scrolling.
 * Zero CPU overhead on idle or interaction; instant response on click.
 */
export default function DesktopCategoryRow({ categories }: DesktopCategoryRowProps) {
  const topCategories = categories.filter((c) => !c.parentId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleManualScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const shift = 380;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -shift : shift,
      behavior: "smooth",
    });
  };

  return (
    <section id="categories" className="py-6 select-none relative group/row">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-black text-[#F26522] uppercase tracking-wider">
              Explore Building Supplies
            </span>
            <h2 className="text-xl lg:text-2xl font-black text-[#052a51] tracking-tight">
              Explore Tiles, Hardware &amp; Standard Construction Materials
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleManualScroll("left")}
              aria-label="Previous categories"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-[#F26522] hover:text-[#F26522] text-[#052a51] shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => handleManualScroll("right")}
              aria-label="Next categories"
              className="w-8 h-8 rounded-full bg-white border border-gray-200 hover:border-[#F26522] hover:text-[#F26522] text-[#052a51] shadow-2xs flex items-center justify-center transition-all cursor-pointer active:scale-95"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* High-Performance Smooth Horizontal Track */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-none py-1 scroll-smooth"
        >
          <div className="flex items-center gap-3.5 pr-3.5 w-max">
            {topCategories.map((cat, idx) => (
              <SafeDesktopCategoryCard
                key={`cat-${cat.slug}`}
                cat={cat}
                priority={idx < 7}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
