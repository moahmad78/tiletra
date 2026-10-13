"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

        <div className="px-1 py-2 flex items-center justify-center flex-1">
          <p className="text-xs sm:text-sm font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors leading-tight line-clamp-1">
            {cat.name}
          </p>
        </div>
      </div>
    </Link>
  );
}

/**
 * DesktopCategoryRow
 * Seamless slow auto-scrolling category marquee.
 * Pauses on mouse hover and resumes smoothly on mouse leave.
 */
export default function DesktopCategoryRow({ categories }: DesktopCategoryRowProps) {
  const topCategories = categories.filter((c) => !c.parentId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef(false);
  const manualPauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gentle, slow infinite auto-scroll loop with 0 layout thrashing (INP optimized)
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el || topCategories.length === 0) return;

    let animId: number;
    let lastTime: number | null = null;
    let cachedHalfWidth = el.scrollWidth / 2;
    const speed = 36; // px per second - slow, elegant, smooth drift

    const updateMetrics = () => {
      if (el) {
        cachedHalfWidth = el.scrollWidth / 2;
      }
    };

    window.addEventListener("resize", updateMetrics, { passive: true });

    const handleVisibility = () => {
      if (document.hidden) {
        isPausedRef.current = true;
      } else {
        isPausedRef.current = false;
        lastTime = null;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility, { passive: true });

    // Pause immediately on user touch or pointer down so input events are 100% unblocked (INP protection)
    const onUserInteractionStart = () => {
      isPausedRef.current = true;
    };
    const onUserInteractionEnd = () => {
      if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current);
      manualPauseTimerRef.current = setTimeout(() => {
        isPausedRef.current = false;
        lastTime = null;
      }, 1500);
    };

    el.addEventListener("pointerdown", onUserInteractionStart, { passive: true });
    el.addEventListener("pointerup", onUserInteractionEnd, { passive: true });
    el.addEventListener("touchstart", onUserInteractionStart, { passive: true });
    el.addEventListener("touchend", onUserInteractionEnd, { passive: true });
    el.addEventListener("wheel", onUserInteractionStart, { passive: true });

    const step = (time: number) => {
      if (lastTime !== null && !isPausedRef.current && el) {
        const delta = (time - lastTime) / 1000;
        // Clamp to avoid jump if frame was delayed
        const clampedDelta = Math.min(delta, 0.05);
        const scrollAmount = speed * clampedDelta;

        let nextScroll = el.scrollLeft + scrollAmount;
        if (cachedHalfWidth > 0) {
          if (nextScroll >= cachedHalfWidth) {
            nextScroll -= cachedHalfWidth;
          } else if (nextScroll <= 0) {
            nextScroll += cachedHalfWidth;
          }
        }
        el.scrollLeft = nextScroll;
      }
      lastTime = time;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", updateMetrics);
      document.removeEventListener("visibilitychange", handleVisibility);
      el.removeEventListener("pointerdown", onUserInteractionStart);
      el.removeEventListener("pointerup", onUserInteractionEnd);
      el.removeEventListener("touchstart", onUserInteractionStart);
      el.removeEventListener("touchend", onUserInteractionEnd);
      el.removeEventListener("wheel", onUserInteractionStart);
      if (manualPauseTimerRef.current) {
        clearTimeout(manualPauseTimerRef.current);
      }
    };
  }, [topCategories.length]);

  const handleManualScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const shift = 380;
    scrollContainerRef.current.scrollBy({
      left: direction === "left" ? -shift : shift,
      behavior: "smooth",
    });

    isPausedRef.current = true;
    if (manualPauseTimerRef.current) clearTimeout(manualPauseTimerRef.current);
    manualPauseTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 2000);
  };

  // Duplicate categories to enable seamless infinite wrapping
  const displayCategories = topCategories.concat(topCategories);

  return (
    <section
      id="categories"
      className="py-6 select-none relative group/row"
      onMouseEnter={() => {
        isPausedRef.current = true;
      }}
      onMouseLeave={() => {
        isPausedRef.current = false;
      }}
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl lg:text-2xl font-black text-[#052a51] tracking-tight">
              Categories
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
          className="overflow-x-auto scrollbar-none py-1"
        >
          <div className="flex items-center gap-3.5 pr-3.5 w-max">
            {displayCategories.map((cat, idx) => (
              <SafeDesktopCategoryCard
                key={`cat-${cat.slug}-${idx}`}
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
