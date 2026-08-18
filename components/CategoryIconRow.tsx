"use client";

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

  return (
    <div className="w-full bg-white border-b border-gray-100 py-3">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none px-4 snap-x [scroll-snap-type:x_mandatory]">
        {categoryList.map((cat) => {
          const shortName = getCategoryShortName(cat.name);
          return (
            <Link
              key={cat.id || cat.slug}
              href={`/shop/${cat.slug}`}
              className="flex flex-col items-center shrink-0 w-[64px] group active:scale-95 transition-transform snap-start"
            >
              <div className="w-[54px] h-[54px] rounded-2xl overflow-hidden relative p-0.5 bg-gradient-to-tr from-[#052a51]/10 to-[#F26522]/20 border border-gray-100 shadow-2xs group-hover:border-[#F26522]/40 transition-colors">
                <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                  <Image
                    src={cat.image || "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="54px"
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
  );
}
