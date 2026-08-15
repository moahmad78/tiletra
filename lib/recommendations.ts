"use client";

import { products, type Product } from "@/lib/data/products";

const RECENTLY_VIEWED_KEY = "tiletra-recently-viewed";

/**
 * Record a product visit in local storage
 */
export function trackProductView(productId: string) {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    let ids: string[] = stored ? JSON.parse(stored) : [];

    // Remove if existing to move to front
    ids = ids.filter((id) => id !== productId);
    ids.unshift(productId);

    // Keep max 12 items
    ids = ids.slice(0, 12);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error("Failed to track product view", e);
  }
}

/**
 * Retrieve recently viewed products for current user
 */
export function getRecentlyViewed(currentProductId?: string, limit = 6): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];

    const ids: string[] = JSON.parse(stored);
    const filteredIds = currentProductId ? ids.filter((id) => id !== currentProductId) : ids;

    return filteredIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .slice(0, limit);
  } catch (e) {
    return [];
  }
}

/**
 * "You May Also Like" recommendation logic:
 * Same category + similar finish/material, excluding current product
 */
export function getYouMayAlsoLike(product: Product, limit = 4): Product[] {
  // First match same category
  const sameCategory = products.filter(
    (p) => p.categorySlug === product.categorySlug && p.id !== product.id
  );

  if (sameCategory.length >= limit) {
    return sameCategory.slice(0, limit);
  }

  // Fallback to same material
  const sameMaterial = products.filter(
    (p) => p.material === product.material && p.id !== product.id && !sameCategory.includes(p)
  );

  return [...sameCategory, ...sameMaterial, ...products.filter((p) => p.id !== product.id)].slice(
    0,
    limit
  );
}

export type FrequentPair = {
  mainProduct: Product;
  pairedProduct: Product;
  bundleDiscountPercent: number;
  totalOriginalPrice: number;
  totalBundlePrice: number;
  savings: number;
};

/**
 * "Frequently Bought Together" paired co-occurrence logic:
 * Finds a matching floor/wall complement or subway companion tile
 */
export function getFrequentlyBoughtTogether(product: Product): FrequentPair | null {
  // Find a complementary tile (e.g. wall for floor, or subway for bathroom)
  let paired = products.find((p) => {
    if (p.id === product.id) return false;
    if (product.categorySlug === "floor-tiles" && p.categorySlug === "wall-tiles") return true;
    if (product.categorySlug === "bathroom-tiles" && p.categorySlug === "floor-tiles") return true;
    if (product.categorySlug === "kitchen-tiles" && p.categorySlug === "wall-tiles") return true;
    return p.material === product.material;
  });

  if (!paired) {
    paired = products.find((p) => p.id !== product.id) || products[0];
  }

  if (!paired) return null;

  const mainBoxPrice = product.variants[0]?.pricePerBox || 2000;
  const pairedBoxPrice = paired.variants[0]?.pricePerBox || 1500;
  const totalOriginal = mainBoxPrice + pairedBoxPrice;
  const discountPercent = 10; // 10% bundle saving
  const savings = Math.round((totalOriginal * discountPercent) / 100);
  const totalBundlePrice = totalOriginal - savings;

  return {
    mainProduct: product,
    pairedProduct: paired,
    bundleDiscountPercent: discountPercent,
    totalOriginalPrice: totalOriginal,
    totalBundlePrice,
    savings,
  };
}

/**
 * Cart cross-sells: Products not yet in the cart
 */
export function getCartAddons(cartProductIds: string[], limit = 4): Product[] {
  return products.filter((p) => !cartProductIds.includes(p.id)).slice(0, limit);
}
