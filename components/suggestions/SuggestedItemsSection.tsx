"use client";

import DiscoverMoreSection from "./DiscoverMoreSection";
import type { Product } from "@/lib/data/products";

interface SuggestedItemsProps {
  currentProductId?: string;
  excludedProductIds?: string[];
  title?: string;
  catalog?: Product[];
}

export default function SuggestedItemsSection({
  currentProductId,
  excludedProductIds = [],
  title = "Suggested for You",
  catalog,
}: SuggestedItemsProps) {
  return (
    <DiscoverMoreSection
      currentProductId={currentProductId}
      excludedProductIds={excludedProductIds}
      title={title}
      catalog={catalog}
    />
  );
}
