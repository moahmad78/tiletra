"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { getLowestPrice, getLowestBoxPrice, type Product } from "@/lib/data/products";
import { formatPrice, formatUnitLabel, getProductPriceInfo } from "@/lib/formatters";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { showCartToast } from "@/lib/cart-toast-store";

function formatPriceInternal(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function ProductCard({ product }: { product: Product }) {
  const [mounted, setMounted] = useState(false);
  const { addItem } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();
  const defaultVariant = product.variants[0];
  const wishlisted = isWishlisted(product.id);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, defaultVariant, 1);
    showCartToast(product.name, 1);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
    >
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="block">
          <div className="relative h-56 overflow-hidden bg-gray-100">
            <Image
              src={product.images && product.images[0] ? product.images[0] : "/placeholders/product.svg"}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.isBestseller && (
                <span className="px-2.5 py-1 bg-[#F26522] text-white text-[10px] font-bold rounded-full uppercase tracking-wide shadow-sm">
                  Bestseller
                </span>
              )}
              {product.isNew && (
                <span className="px-2.5 py-1 bg-[#052a51] text-white text-[10px] font-bold rounded-full uppercase tracking-wide shadow-sm">
                  New
                </span>
              )}
            </div>

            {/* Category tag */}
            <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
              <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-[#052a51] text-[11px] font-bold rounded-full shadow-sm">
                {product.categoryName}
              </span>
            </div>
          </div>
        </Link>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          aria-label={mounted && wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
        >
          <Heart
            size={18}
            className={
              mounted && wishlisted
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            }
          />
        </button>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-bold text-[#052a51] text-[14px] leading-tight hover:text-[#F26522] transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-gray-500 mt-1">
            {defaultVariant.size} · {defaultVariant.finish} · {product.material}
          </p>

          {/* Rating (Admin Controlled / DB) */}
          {(() => {
            const cardRating =
              product.manualRating !== null && product.manualRating !== undefined
                ? product.manualRating
                : product.rating;
            const cardReviewCount =
              product.manualReviewCount !== null && product.manualReviewCount !== undefined
                ? product.manualReviewCount
                : product.reviewCount;

            if (!cardRating || cardRating <= 0) return null;

            return (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      className={s <= Math.round(cardRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                    />
                  ))}
                </div>
                <span className="text-[11px] text-gray-500 font-medium">
                  {cardRating}
                  {cardReviewCount !== null && cardReviewCount !== undefined && cardReviewCount > 0 ? ` (${cardReviewCount})` : ""}
                </span>
              </div>
            );
          })()}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 gap-2">
          {(() => {
            const priceInfo = getProductPriceInfo(product, defaultVariant);
            return (
              <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                <span className="text-[15px] sm:text-base font-black text-[#052a51] tracking-tight">
                  {priceInfo.formattedPrice}
                </span>
                {priceInfo.discountPercent > 0 && (
                  <>
                    <span className="text-xs text-gray-400 line-through">
                      {priceInfo.formattedMrp}
                    </span>
                    <span className="text-xs font-black text-emerald-600">
                      {priceInfo.discountPercent}% off
                    </span>
                  </>
                )}
              </div>
            );
          })()}
          <button
            onClick={handleAddToCart}
            className="px-3.5 py-2 bg-[#F26522] text-white text-xs font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center gap-1.5 shadow-sm hover:shadow whitespace-nowrap shrink-0"
          >
            <ShoppingBag size={13} className="shrink-0" />
            <span className="whitespace-nowrap">Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
