"use client";

import Link from "next/link";
import { categories as defaultCategories, type Category } from "@/lib/data/categories";
import { SafeImage } from "@/components/ui/SafeImage";

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

function DistinctCategoryItem({ cat }: { cat: Category }) {
  const shortName = getCategoryShortName(cat.name);
  const categoryImage = cat.image && cat.image.trim() ? cat.image : `/images/categories/cat-${cat.slug}.jpg`;

  return (
    <Link
      href={`/shop/${cat.slug}`}
      aria-label={`Browse ${cat.name}`}
      className="flex flex-col items-center shrink-0 w-[68px] sm:w-[74px] group active:scale-95 transition-transform scroll-snap-align-start"
    >
      <div className="w-[58px] h-[58px] sm:w-[64px] sm:h-[64px] rounded-2xl overflow-hidden relative border border-gray-200/90 bg-gray-100 shadow-2xs group-hover:border-[#F26522] transition-all">
        <SafeImage
          src={categoryImage}
          alt={cat.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300 pointer-events-none"
          sizes="64px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent opacity-30 group-hover:opacity-10 transition-opacity pointer-events-none" />
      </div>
      <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight truncate max-w-full px-0.5">
        {shortName}
      </span>
    </Link>
  );
}

/**
 * Mobile CategoryIconRow (INP Optimized)
 * Uses native GPU-accelerated touch momentum scrolling without JS animation loops.
 * Zero main-thread blocking, zero drag delay, instant tap responsiveness.
 */
export default function CategoryIconRow({ categories }: { categories?: Category[] }) {
  const rawList = categories && categories.length > 0 ? categories : defaultCategories;
  const categoryList = rawList.filter((c) => !c.parentId);

  return (
    <div className="w-full bg-white border-b border-gray-100 py-3 overflow-x-auto scrollbar-none select-none touch-pan-x [scroll-snap-type:x_proximity] -webkit-overflow-scrolling-touch">
      <div className="flex items-center gap-3 px-3 w-max">
        {categoryList.map((cat) => (
          <DistinctCategoryItem
            key={`orig-${cat.slug}`}
            cat={cat}
          />
        ))}
      </div>
    </div>
  );
}
