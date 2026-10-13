"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/data/products";

interface DesktopProductRowProps {
  title: string;
  subtitle?: string;
  badge?: string;
  products: Product[];
  viewAllHref: string;
  compact?: boolean;
}

export default function DesktopProductRow({
  title,
  subtitle,
  badge,
  products,
  viewAllHref,
  compact = true,
}: DesktopProductRowProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -(compact ? 620 : 580) : (compact ? 620 : 580);
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="hidden md:block py-5">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Row Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {badge && (
              <span className="text-[10px] font-black text-[#F26522] uppercase tracking-[2.5px] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md inline-block mb-1">
                {badge}
              </span>
            )}
            <h3 className="text-xl lg:text-2xl font-black text-[#052a51] tracking-tight">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {/* Carousel Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:border-[#F26522] hover:text-[#F26522] flex items-center justify-center text-[#052a51] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-[#052a51] shadow-2xs transition-colors cursor-pointer active:scale-95"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="w-8 h-8 rounded-full border border-gray-200 bg-white hover:border-[#F26522] hover:text-[#F26522] flex items-center justify-center text-[#052a51] disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-[#052a51] shadow-2xs transition-colors cursor-pointer active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <Link
              href={viewAllHref}
              className="text-xs font-black text-[#F26522] hover:underline flex items-center gap-1 ml-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Scrollable Products Track */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className={`flex ${compact ? "gap-3" : "gap-4"} overflow-x-auto pb-3 pt-1 scrollbar-none scroll-smooth`}
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              className={
                compact
                  ? "w-[calc((100%-60px)/6)] min-w-[185px] max-w-[220px] shrink-0"
                  : "w-[240px] lg:w-[270px] xl:w-[290px] shrink-0"
              }
            >
              <ProductCard product={prod} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
