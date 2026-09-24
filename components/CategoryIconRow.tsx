"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { categories as defaultCategories, type Category } from "@/lib/data/categories";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

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

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  electrical: { bg: "bg-amber-500/10", text: "text-amber-600", ring: "group-hover:border-amber-500/40" },
  lighting: { bg: "bg-yellow-500/10", text: "text-yellow-600", ring: "group-hover:border-yellow-500/40" },
  "tiles-stone": { bg: "bg-blue-500/10", text: "text-blue-600", ring: "group-hover:border-blue-500/40" },
  "paint-finishes": { bg: "bg-rose-500/10", text: "text-rose-600", ring: "group-hover:border-rose-500/40" },
  "false-ceiling": { bg: "bg-purple-500/10", text: "text-purple-600", ring: "group-hover:border-purple-500/40" },
  flooring: { bg: "bg-emerald-500/10", text: "text-emerald-600", ring: "group-hover:border-emerald-500/40" },
  "doors-windows": { bg: "bg-teal-500/10", text: "text-teal-600", ring: "group-hover:border-teal-500/40" },
  "glass-mirror": { bg: "bg-cyan-500/10", text: "text-cyan-600", ring: "group-hover:border-cyan-500/40" },
  "hardware-fittings": { bg: "bg-orange-500/10", text: "text-orange-600", ring: "group-hover:border-orange-500/40" },
  furniture: { bg: "bg-indigo-500/10", text: "text-indigo-600", ring: "group-hover:border-indigo-500/40" },
  "kitchen-wardrobe": { bg: "bg-red-500/10", text: "text-red-600", ring: "group-hover:border-red-500/40" },
  "plumbing-sanitary": { bg: "bg-sky-500/10", text: "text-sky-600", ring: "group-hover:border-sky-500/40" },
  "wall-surface": { bg: "bg-fuchsia-500/10", text: "text-fuchsia-600", ring: "group-hover:border-fuchsia-500/40" },
  "decor-accessories": { bg: "bg-pink-500/10", text: "text-pink-600", ring: "group-hover:border-pink-500/40" },
  "curtains-blinds": { bg: "bg-violet-500/10", text: "text-violet-600", ring: "group-hover:border-violet-500/40" },
  "office-commercial": { bg: "bg-slate-500/10", text: "text-slate-600", ring: "group-hover:border-slate-500/40" },
  "outdoor-landscape": { bg: "bg-lime-500/10", text: "text-lime-600", ring: "group-hover:border-lime-500/40" },
  "smart-home": { bg: "bg-cyan-500/10", text: "text-cyan-600", ring: "group-hover:border-cyan-500/40" },
  "safety-fire": { bg: "bg-rose-500/10", text: "text-rose-600", ring: "group-hover:border-rose-500/40" },
  "tools-consumables": { bg: "bg-amber-500/10", text: "text-amber-600", ring: "group-hover:border-amber-500/40" },
};

function DistinctCategoryIconItem({
  cat,
  isCloned = false,
  onDragPrevent,
}: {
  cat: Category;
  isCloned?: boolean;
  onDragPrevent?: (e: React.MouseEvent) => void;
}) {
  const shortName = getCategoryShortName(cat.name);
  const color = CATEGORY_COLORS[cat.slug] || { bg: "bg-[#052a51]/10", text: "text-[#052a51]", ring: "group-hover:border-[#F26522]/40" };

  if (isCloned) {
    return (
      <div
        key={`clone-${cat.slug}`}
        aria-hidden="true"
        onClick={onDragPrevent}
        className="flex flex-col items-center shrink-0 w-[68px] group active:scale-95 transition-transform select-none cursor-pointer"
      >
        <div className={`w-[56px] h-[56px] rounded-2xl flex items-center justify-center border border-gray-100 shadow-2xs ${color.bg} ${color.ring} transition-all`}>
          <CategoryIcon slugOrName={cat.slug} size={24} className={`${color.text} group-hover:scale-110 transition-transform duration-200`} />
        </div>
        <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight truncate max-w-full">
          {shortName}
        </span>
      </div>
    );
  }

  return (
    <Link
      key={`orig-${cat.slug}`}
      href={`/shop/${cat.slug}`}
      onClick={onDragPrevent}
      aria-label={`Browse ${cat.name}`}
      className="flex flex-col items-center shrink-0 w-[68px] group active:scale-95 transition-transform"
    >
      <div className={`w-[56px] h-[56px] rounded-2xl flex items-center justify-center border border-gray-100 shadow-2xs ${color.bg} ${color.ring} transition-all`}>
        <CategoryIcon slugOrName={cat.slug} size={24} className={`${color.text} group-hover:scale-110 transition-transform duration-200`} />
      </div>
      <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight truncate max-w-full">
        {shortName}
      </span>
    </Link>
  );
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
    const timer = setTimeout(measureWidth, 200);
    window.addEventListener("resize", measureWidth);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureWidth);
    };
  }, [measureWidth]);

  useEffect(() => {
    let lastTime = performance.now();
    const speed = 24;

    const step = (now: number) => {
      const rawDelta = (now - lastTime) / 1000;
      const delta = Math.min(rawDelta, 0.035);
      lastTime = now;

      if (!isInteractingRef.current && trackRef.current) {
        posRef.current += speed * delta;

        const setWidth = singleSetWidthRef.current || (categoryList.length * 80);
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

    const setWidth = singleSetWidthRef.current || (categoryList.length * 80);
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
    }, 1500);
  };

  const handleDragPrevent = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
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
        {/* Set 1: Measured set with inline SVG icons */}
        <div ref={singleSetRef} className="flex items-center gap-3 pr-3 shrink-0">
          {categoryList.map((cat) => (
            <DistinctCategoryIconItem
              key={`s1-${cat.slug}`}
              cat={cat}
              isCloned={false}
              onDragPrevent={handleDragPrevent}
            />
          ))}
        </div>

        {/* Set 2: Seamless duplicated set for infinite loop */}
        <div className="flex items-center gap-3 pr-3 shrink-0" aria-hidden="true">
          {categoryList.map((cat) => (
            <DistinctCategoryIconItem
              key={`s2-${cat.slug}`}
              cat={cat}
              isCloned={true}
              onDragPrevent={handleDragPrevent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
