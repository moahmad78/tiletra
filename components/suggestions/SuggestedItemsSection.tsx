"use client";

import DiscoverMoreSection from "./DiscoverMoreSection";
import type { Product } from "@/lib/data/products";

interface SuggestedItemsProps {
  currentProductId?: string;
  excludedProductIds?: string[];
  title?: string;
  subtitle?: string;
  catalog?: Product[];
}

export default function SuggestedItemsSection({
  currentProductId,
  excludedProductIds = [],
  title = "Discover More at Intrihub",
  subtitle = "Popular materials & finishes from across our 20 departments",
  catalog,
}: SuggestedItemsProps) {
  return (
    <DiscoverMoreSection
      currentProductId={currentProductId}
      excludedProductIds={excludedProductIds}
      title={title}
      subtitle={subtitle}
      catalog={catalog}
    />
  );
}
