"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/data/categories";

interface DesktopCategoryRowProps {
  categories: Category[];
}

export default function DesktopCategoryRow({ categories }: DesktopCategoryRowProps) {
  const topCategories = categories.filter((c) => !c.parentId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);
  const isInteractingRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Triple the list for a completely seamless, jitter-free loop
  const duplicatedList = [...topCategories, ...topCategories, ...topCategories];

  const updateArrowState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const triggerUserInteraction = useCallback(() => {
    isInteractingRef.current = true;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
    updateArrowState();
  }, [updateArrowState]);

  // Smooth continuous auto-scroll loop without CSS scroll-smooth conflict
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let lastTime = performance.now();
    const speed = 38; // ~38 pixels per second for fluid motion

    const step = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (!isHoveredRef.current && !isInteractingRef.current && el) {
        el.scrollLeft += speed * delta;

        // Loop seamlessly at 1/3 width
        const oneThird = el.scrollWidth / 3;
        if (oneThird > 0 && el.scrollLeft >= oneThird * 2) {
          el.scrollLeft -= oneThird;
        }
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const handleManualScroll = (direction: "left" | "right") => {
    triggerUserInteraction();
    const el = scrollRef.current;
    if (!el) return;
    const distance = 360;
    el.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth",
    });
  };

  return (
    <section id="categories" className="py-6 select-none relative group/row">
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[11px] font-black text-[#F26522] uppercase tracking-wider">
              Explore By Category
            </span>
            <h2 className="text-xl lg:text-2xl font-black text-[#052a51] tracking-tight">
              Everything for Every Space
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

        {/* Continuous Auto-Scrolling Track (No CSS scroll-smooth to prevent jitter) */}
        <div
          ref={scrollRef}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
          onWheel={triggerUserInteraction}
          onPointerDown={triggerUserInteraction}
          onTouchStart={triggerUserInteraction}
          onScroll={updateArrowState}
          className="flex gap-3 overflow-x-auto scrollbar-none py-1 will-change-scroll"
        >
          {duplicatedList.map((cat, idx) => (
            <Link
              key={`${cat.slug}-${idx}`}
              href={`/shop/${cat.slug}`}
              className="shrink-0 w-[155px] sm:w-[165px] lg:w-[175px] group"
            >
              <div className="bg-white rounded-2xl p-2 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#F26522] transition-all text-center flex flex-col h-full active:scale-98">
                {/* Large Prominent Image with Minimal Whitespace */}
                <div className="relative w-full h-[115px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <Image
                    src={cat.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-108 transition-transform duration-300"
                    sizes="(max-width: 768px) 155px, 175px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Compact, High-Legibility Label Area */}
                <div className="px-1 pt-2 pb-1 flex flex-col items-center justify-between flex-1">
                  <p className="text-xs sm:text-sm font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors leading-tight line-clamp-1">
                    {cat.name}
                  </p>
                  <span className="text-[11px] text-gray-400 font-semibold mt-1 inline-flex items-center gap-0.5 group-hover:text-[#F26522] transition-colors">
                    {cat.productCount > 0 ? `${cat.productCount} Items` : "Explore"}
                    <ArrowRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
