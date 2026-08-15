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
}

export default function DesktopProductRow({
  title,
  subtitle,
  badge,
  products,
  viewAllHref,
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
    const scrollAmount = direction === "left" ? -580 : 580;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(checkScroll, 350);
  };

  return (
    <section className="hidden md:block py-6">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        {/* Row Header */}
        <div className="flex items-end justify-between mb-5">
          <div>
            {badge && (
              <span className="text-[10px] font-black text-[#F26522] uppercase tracking-[2.5px] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
                {badge}
              </span>
            )}
            <h2 className="text-2xl lg:text-3xl font-black text-[#052a51] tracking-tight mt-1">
              {title}
            </h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-3">
            {/* Carousel Arrows */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                aria-label="Scroll left"
                className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:border-[#F26522] hover:text-[#F26522] flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 shadow-2xs transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                aria-label="Scroll right"
                className="w-9 h-9 rounded-full border border-gray-200 bg-white hover:border-[#F26522] hover:text-[#F26522] flex items-center justify-center text-gray-600 disabled:opacity-30 disabled:hover:border-gray-200 disabled:hover:text-gray-600 shadow-2xs transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <Link
              href={viewAllHref}
              className="text-xs font-black text-[#F26522] hover:underline flex items-center gap-1 ml-2"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Scrollable Products Track */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none scroll-smooth"
        >
          {products.map((prod) => (
            <div
              key={prod.id}
              className="w-[240px] lg:w-[270px] xl:w-[290px] shrink-0"
            >
              <ProductCard product={prod} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
