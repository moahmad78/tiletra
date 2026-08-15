"use client";

import { useEffect, useState } from "react";
import { Clock, Eye } from "lucide-react";
import { getRecentlyViewed } from "@/lib/recommendations";
import CompactProductCard from "@/components/CompactProductCard";
import type { Product } from "@/lib/data/products";

export default function RecentlyViewedSlider({
  currentProductId,
  title = "Recently Viewed",
}: {
  currentProductId?: string;
  title?: string;
}) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const list = getRecentlyViewed(currentProductId, 8);
    setRecentProducts(list);
  }, [currentProductId]);

  if (!mounted || recentProducts.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-[#F26522]" />
        <div>
          <h3 className="text-base sm:text-lg font-black text-[#052a51] leading-tight">
            {title}
          </h3>
          <p className="text-xs text-gray-400">Picks you recently explored</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pt-1 pb-2 scrollbar-none">
        {recentProducts.map((prod) => (
          <div key={prod.id} className="snap-start shrink-0">
            <CompactProductCard product={prod} />
          </div>
        ))}
      </div>
    </section>
  );
}
