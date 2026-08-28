"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { categories as defaultCategories, type Category } from "@/lib/data/categories";

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

export default function CategoryIconRow({ categories }: { categories?: Category[] }) {
  const rawList = categories && categories.length > 0 ? categories : defaultCategories;
  const categoryList = rawList.filter((c) => !c.parentId);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const singleSetRef = useRef<HTMLDivElement>(null);

  const posRef = useRef(0);
  const isInteractingRef = useRef(false);
  const touchStartXRef = useRef(0);
  const touchStartPosRef = useRef(0);
  const touchTimerRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const singleSetWidthRef = useRef(0);
  const isDraggingRef = useRef(false);

  const measureWidth = useCallback(() => {
    if (singleSetRef.current) {
      singleSetWidthRef.current = singleSetRef.current.scrollWidth;
    }
  }, []);

  useEffect(() => {
    measureWidth();
    // Re-measure after initial image decodes
    const timer = setTimeout(measureWidth, 200);
    window.addEventListener("resize", measureWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureWidth);
    };
  }, [measureWidth]);

  // Silky 60fps GPU auto-scroll loop with delta clamp to prevent initial load jitter
  useEffect(() => {
    let lastTime = performance.now();
    const speed = 24; // Smooth ~24px per second

    const step = (now: number) => {
      // Clamp delta to 35ms max so initial page load / hydration never causes a stutter or sudden jump
      const rawDelta = (now - lastTime) / 1000;
      const delta = Math.min(rawDelta, 0.035);
      lastTime = now;

      if (!isInteractingRef.current && trackRef.current) {
        posRef.current += speed * delta;

        const setWidth = singleSetWidthRef.current || (categoryList.length * 78);
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
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, [categoryList.length]);

  // Touch and drag handlers for responsive swipe without lag
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    isInteractingRef.current = true;
    isDraggingRef.current = false;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    touchStartXRef.current = clientX;
    touchStartPosRef.current = posRef.current;
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isInteractingRef.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = touchStartXRef.current - clientX;

    if (Math.abs(diff) > 4) {
      isDraggingRef.current = true;
    }

    const setWidth = singleSetWidthRef.current || (categoryList.length * 78);
    let newPos = touchStartPosRef.current + diff;
    while (newPos < 0) newPos += setWidth;
    while (newPos >= setWidth) newPos -= setWidth;

    posRef.current = newPos;
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(-${newPos.toFixed(2)}px, 0, 0)`;
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      isDraggingRef.current = false;
    }, 2000);
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-white border-b border-gray-100 py-3 overflow-hidden select-none touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      <div
        ref={trackRef}
        className="flex items-center will-change-transform transform-gpu"
        style={{ transform: "translate3d(0, 0, 0)" }}
      >
        {/* Set 1: Measured set */}
        <div ref={singleSetRef} className="flex items-center gap-3 pr-3 shrink-0">
          {categoryList.map((cat) => {
            const shortName = getCategoryShortName(cat.name);
            return (
              <Link
                key={`s1-${cat.slug}`}
                href={`/shop/${cat.slug}`}
                onClick={(e) => {
                  if (isDraggingRef.current) e.preventDefault();
                }}
                className="flex flex-col items-center shrink-0 w-[66px] group active:scale-95 transition-transform"
              >
                <div className="w-[56px] h-[56px] rounded-2xl overflow-hidden relative p-0.5 bg-gradient-to-tr from-[#052a51]/10 to-[#F26522]/20 border border-gray-100 shadow-2xs group-hover:border-[#F26522]/40 transition-colors">
                  <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                    <Image
                      src={cat.image || "/placeholders/category.svg"}
                      alt={cat.name}
                      fill
                      loading="eager"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="56px"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight truncate max-w-full">
                  {shortName}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Set 2: Seamless duplicated set for infinite loop */}
        <div className="flex items-center gap-3 pr-3 shrink-0" aria-hidden="true">
          {categoryList.map((cat) => {
            const shortName = getCategoryShortName(cat.name);
            return (
              <Link
                key={`s2-${cat.slug}`}
                href={`/shop/${cat.slug}`}
                tabIndex={-1}
                onClick={(e) => {
                  if (isDraggingRef.current) e.preventDefault();
                }}
                className="flex flex-col items-center shrink-0 w-[66px] group active:scale-95 transition-transform"
              >
                <div className="w-[56px] h-[56px] rounded-2xl overflow-hidden relative p-0.5 bg-gradient-to-tr from-[#052a51]/10 to-[#F26522]/20 border border-gray-100 shadow-2xs group-hover:border-[#F26522]/40 transition-colors">
                  <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                    <Image
                      src={cat.image || "/placeholders/category.svg"}
                      alt={cat.name}
                      fill
                      loading="eager"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="56px"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight truncate max-w-full">
                  {shortName}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Set 3: Buffer set */}
        <div className="flex items-center gap-3 pr-3 shrink-0" aria-hidden="true">
          {categoryList.map((cat) => {
            const shortName = getCategoryShortName(cat.name);
            return (
              <Link
                key={`s3-${cat.slug}`}
                href={`/shop/${cat.slug}`}
                tabIndex={-1}
                onClick={(e) => {
                  if (isDraggingRef.current) e.preventDefault();
                }}
                className="flex flex-col items-center shrink-0 w-[66px] group active:scale-95 transition-transform"
              >
                <div className="w-[56px] h-[56px] rounded-2xl overflow-hidden relative p-0.5 bg-gradient-to-tr from-[#052a51]/10 to-[#F26522]/20 border border-gray-100 shadow-2xs group-hover:border-[#F26522]/40 transition-colors">
                  <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                    <Image
                      src={cat.image || "/placeholders/category.svg"}
                      alt={cat.name}
                      fill
                      loading="eager"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="56px"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight truncate max-w-full">
                  {shortName}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
