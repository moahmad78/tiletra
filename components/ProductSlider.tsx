"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import CompactProductCard from "@/components/CompactProductCard";
import type { Product } from "@/lib/data/products";

interface ProductSliderProps {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  products: Product[];
  tag?: string;
}

export default function ProductSlider({
  title,
  subtitle,
  viewAllHref = "/shop",
  products,
  tag,
}: ProductSliderProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-2">
        <div className="flex items-center gap-2">
          <h2 className="text-[16px] font-black text-[#052a51] tracking-tight">
            {title}
          </h2>
          {tag && (
            <span className="px-2 py-0.5 bg-[#F26522]/10 text-[#F26522] text-[10px] font-bold rounded-full">
              {tag}
            </span>
          )}
        </div>
        <Link
          href={viewAllHref}
          className="text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center gap-0.5 active:opacity-70 transition-opacity"
        >
          View All
          <ChevronRight size={14} />
        </Link>
      </div>

      {subtitle && (
        <p className="text-xs text-gray-500 px-4 -mt-1 mb-2.5 line-clamp-1">{subtitle}</p>
      )}

      {/* Horizontal Scroll Slider */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 pt-0.5 scrollbar-none [scroll-snap-type:x_mandatory] -mx-0">
        {products.map((product) => (
          <CompactProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
