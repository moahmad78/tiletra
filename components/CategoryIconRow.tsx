"use client";

import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/data/categories";

export default function CategoryIconRow() {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5">
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-none px-4 snap-x [scroll-snap-type:x_mandatory]">
        {categories.map((cat) => {
          // Short label for mobile display
          const shortName = cat.name.replace(" Tiles", "");
          return (
            <Link
              key={cat.id}
              href={`/shop/${cat.slug}`}
              className="flex flex-col items-center shrink-0 w-[64px] group active:scale-95 transition-transform snap-start"
            >
              <div className="w-[52px] h-[52px] rounded-2xl overflow-hidden relative p-0.5 bg-gradient-to-tr from-[#052a51]/10 to-[#F26522]/20 border border-gray-100 shadow-2xs group-hover:border-[#F26522]/40 transition-colors">
                <div className="w-full h-full rounded-[14px] overflow-hidden relative">
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes="52px"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>
              </div>
              <span className="text-[11px] font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors mt-1.5 text-center leading-tight">
                {shortName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
