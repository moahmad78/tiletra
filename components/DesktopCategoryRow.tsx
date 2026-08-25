"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import type { Category } from "@/lib/data/categories";

interface DesktopCategoryRowProps {
  categories: Category[];
}

export default function DesktopCategoryRow({ categories }: DesktopCategoryRowProps) {
  const topCategories = categories.filter((c) => !c.parentId);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const singleSetRef = useRef<HTMLDivElement>(null);

  const posRef = useRef(0);
  const isHoveredRef = useRef(false);
  const isInteractingRef = useRef(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const singleSetWidthRef = useRef(0);

  const measureWidth = useCallback(() => {
    if (singleSetRef.current) {
      singleSetWidthRef.current = singleSetRef.current.scrollWidth;
    }
  }, []);

  useEffect(() => {
    measureWidth();
    const timer = setTimeout(measureWidth, 200);
    window.addEventListener("resize", measureWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureWidth);
    };
  }, [measureWidth]);

  // Buttery-smooth GPU hardware-accelerated scroll loop with delta clamping
  useEffect(() => {
    let lastTime = performance.now();
    const speed = 36; // 36px per second (smooth & readable)

    const step = (now: number) => {
      const rawDelta = (now - lastTime) / 1000;
      const delta = Math.min(rawDelta, 0.035);
      lastTime = now;

      if (!isHoveredRef.current && !isInteractingRef.current && trackRef.current) {
        posRef.current += speed * delta;

        const setWidth = singleSetWidthRef.current || (topCategories.length * 185);
        if (posRef.current >= setWidth) {
          posRef.current -= setWidth;
        }

        trackRef.current.style.transform = `translate3d(-${posRef.current.toFixed(2)}px, 0, 0)`;
      }

      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [topCategories.length]);

  const triggerUserInteraction = () => {
    isInteractingRef.current = true;
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, 2500);
  };

  const handleManualScroll = (direction: "left" | "right") => {
    triggerUserInteraction();
    const setWidth = singleSetWidthRef.current || (topCategories.length * 185);
    const shift = 380;
    let newPos = direction === "left" ? posRef.current - shift : posRef.current + shift;
    while (newPos < 0) newPos += setWidth;
    while (newPos >= setWidth) newPos -= setWidth;
    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${newPos.toFixed(2)}px, 0, 0)`;
    }
  };

  return (
    <section id="categories" className="py-6 select-none relative group/row overflow-hidden">
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

        {/* Continuous GPU Auto-Scrolling Track */}
        <div
          ref={containerRef}
          onMouseEnter={() => {
            isHoveredRef.current = true;
          }}
          onMouseLeave={() => {
            isHoveredRef.current = false;
          }}
          className="overflow-hidden py-1"
        >
          <div
            ref={trackRef}
            className="flex items-center will-change-transform transform-gpu"
            style={{ transform: "translate3d(0, 0, 0)" }}
          >
            {/* Set 1: Measured set */}
            <div ref={singleSetRef} className="flex items-center gap-3.5 pr-3.5 shrink-0">
              {topCategories.map((cat) => (
                <Link
                  key={`d1-${cat.slug}`}
                  href={`/shop/${cat.slug}`}
                  className="shrink-0 w-[155px] sm:w-[165px] lg:w-[175px] group"
                >
                  <div className="bg-white rounded-2xl p-2 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#F26522] transition-all text-center flex flex-col h-full active:scale-98">
                    <div className="relative w-full h-[115px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={cat.image || "/placeholders/category.svg"}
                        alt={cat.name}
                        fill
                        loading="eager"
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
              ))}
            </div>

            {/* Set 2: Seamless duplicated set */}
            <div className="flex items-center gap-3.5 pr-3.5 shrink-0" aria-hidden="true">
              {topCategories.map((cat) => (
                <Link
                  key={`d2-${cat.slug}`}
                  href={`/shop/${cat.slug}`}
                  tabIndex={-1}
                  className="shrink-0 w-[155px] sm:w-[165px] lg:w-[175px] group"
                >
                  <div className="bg-white rounded-2xl p-2 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#F26522] transition-all text-center flex flex-col h-full active:scale-98">
                    <div className="relative w-full h-[115px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={cat.image || "/placeholders/category.svg"}
                        alt={cat.name}
                        fill
                        loading="eager"
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
              ))}
            </div>

            {/* Set 3: Buffer set */}
            <div className="flex items-center gap-3.5 pr-3.5 shrink-0" aria-hidden="true">
              {topCategories.map((cat) => (
                <Link
                  key={`d3-${cat.slug}`}
                  href={`/shop/${cat.slug}`}
                  tabIndex={-1}
                  className="shrink-0 w-[155px] sm:w-[165px] lg:w-[175px] group"
                >
                  <div className="bg-white rounded-2xl p-2 border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#F26522] transition-all text-center flex flex-col h-full active:scale-98">
                    <div className="relative w-full h-[115px] sm:h-[120px] rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={cat.image || "/placeholders/category.svg"}
                        alt={cat.name}
                        fill
                        loading="eager"
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
