"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Star, Heart, ShoppingBag } from "lucide-react";
import { type Product } from "@/lib/data/products";
import { getProductPriceInfo } from "@/lib/formatters";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { showCartToast } from "@/lib/cart-toast-store";
import { SafeImage } from "@/components/ui/SafeImage";

const emptySubscribe = () => () => {};

export default function ProductCard({
  product,
  priority = false,
  compact = false,
}: {
  product: Product;
  priority?: boolean;
  compact?: boolean;
}) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const addItem = useCartStore((s) => s.addItem);
  const wishlisted = useWishlistStore((s) => s.items.some((p) => p.id === product.id));
  const toggleWishlist = useWishlistStore((s) => s.toggleWishlist);
  const defaultVariant = product.variants[0];
  const productImg = product.images && product.images[0] ? product.images[0] : null;

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
    <div
      className={`group bg-white ${
        compact ? "rounded-xl shadow-2xs hover:shadow-md hover:-translate-y-0.5" : "rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1"
      } overflow-hidden border border-gray-100 transition-[transform,box-shadow] duration-200 ease-out flex flex-col justify-between h-full`}
    >
      <div className="relative">
        <Link href={`/product/${product.slug}`} aria-label={`View ${product.name} details`} className="block" prefetch={false}>
          <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
            <SafeImage
              src={productImg}
              variantSize={400}
              alt={product.name}
              fill
              priority={priority}
              className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none select-none"
              sizes={compact ? "160px" : "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"}
            />
            {/* Badges */}
            <div className={`absolute ${compact ? "top-1.5 left-1.5 gap-1" : "top-3 left-3 gap-1.5"} flex flex-col z-10 pointer-events-none`}>
              {product.isBestseller && (
                <span className={`${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"} bg-[#F26522] text-white font-bold rounded-full uppercase tracking-wide shadow-sm`}>
                  Bestseller
                </span>
              )}
              {product.isNew && (
                <span className={`${compact ? "px-1.5 py-0.5 text-[9px]" : "px-2.5 py-1 text-[10px]"} bg-[#052a51] text-white font-bold rounded-full uppercase tracking-wide shadow-sm`}>
                  New
                </span>
              )}
            </div>

            {/* Category tag */}
            <div className={`absolute ${compact ? "bottom-1.5 left-1.5 max-w-[85%]" : "bottom-3 left-3"} z-10 pointer-events-none`}>
              <span className={`${compact ? "px-1.5 py-0.5 text-[9px] truncate block" : "px-2.5 py-1 text-[11px]"} bg-white/90 backdrop-blur-sm text-[#052a51] font-bold rounded-full shadow-sm`}>
                {product.categoryName}
              </span>
            </div>
          </div>
        </Link>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          aria-label={mounted && wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute ${compact ? "top-1.5 right-1.5 w-6 h-6" : "top-3 right-3 w-9 h-9"} z-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer`}
        >
          <Heart
            size={compact ? 12 : 18}
            className={
              mounted && wishlisted
                ? "fill-red-500 text-red-500"
                : "text-gray-600 hover:text-red-500"
            }
          />
        </button>
      </div>

      <div className={`${compact ? "p-2.5" : "p-4"} flex-1 flex flex-col justify-between`}>
        <div>
          <Link href={`/product/${product.slug}`} prefetch={false}>
            <h3 className={`font-bold text-[#052a51] ${compact ? "text-xs" : "text-[14px]"} leading-tight hover:text-[#F26522] transition-colors line-clamp-1`}>
              {product.name}
            </h3>
          </Link>
          <p className={`${compact ? "text-[10px] mt-0.5 truncate" : "text-xs mt-1"} text-gray-500`}>
            {Boolean(product.hasVariants) || (product.variants && product.variants.length > 1)
              ? `${(product.variants || []).filter((v) => v.active !== false).length} options available · ${product.material || "Quality"}`
              : `${defaultVariant?.size || "Standard"} · ${defaultVariant?.finish || "Matte"} · ${product.material}`}
          </p>

          {/* Rating (Admin Controlled / DB) */}
          {(() => {
            const cardReviewCount =
              product.manualReviewCount !== null && product.manualReviewCount !== undefined && product.manualReviewCount > 0
                ? product.manualReviewCount
                : product.reviewCount && product.reviewCount > 0
                ? product.reviewCount
                : 0;

            const cardRating =
              product.manualRating !== null && product.manualRating !== undefined && product.manualRating > 0
                ? product.manualRating
                : product.avgRating && product.avgRating > 0
                ? product.avgRating
                : product.rating && product.rating > 0
                ? product.rating
                : 0;

            if (cardReviewCount <= 0 || cardRating <= 0) return null;

            return (
              <div className={`flex items-center gap-1 mt-1`}>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={compact ? 9 : 11}
                      className={s <= Math.round(cardRating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                    />
                  ))}
                </div>
                <span className={`${compact ? "text-[10px]" : "text-[11px]"} text-gray-500 font-medium`}>
                  {cardRating}
                  {!compact && cardReviewCount !== null && cardReviewCount !== undefined && cardReviewCount > 0 ? ` (${cardReviewCount})` : ""}
                </span>
              </div>
            );
          })()}
        </div>

        <div className={`flex items-center justify-between ${compact ? "mt-2 pt-1.5 border-t border-gray-100 gap-1" : "mt-4 pt-3 border-t border-gray-50 gap-2"}`}>
          {(() => {
            const priceInfo = getProductPriceInfo(product, null);
            return (
              <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                <div className="flex items-baseline">
                  <span className={`${compact ? "text-xs sm:text-[13px]" : "text-[15px] sm:text-base"} font-black text-[#052a51] tracking-tight`}>
                    {priceInfo.formattedPrice}
                  </span>
                  {priceInfo.unitSuffix && (
                    <span className={`${compact ? "text-[9px]" : "text-[11px] sm:text-xs"} font-semibold text-gray-500 ml-0.5`}>
                      /{priceInfo.unitSuffix}
                    </span>
                  )}
                </div>
                {priceInfo.formattedMrp && (
                  <span className={`${compact ? "text-[10px]" : "text-xs"} text-gray-500 line-through`}>
                    {priceInfo.formattedMrp}
                  </span>
                )}
                {priceInfo.discountPercent > 0 && (
                  <span className={`${compact ? "text-[10px]" : "text-xs"} font-black text-emerald-700`}>
                    {priceInfo.discountPercent}% off
                  </span>
                )}
              </div>
            );
          })()}
          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`${
              compact ? "px-2 py-1 text-[11px] rounded-lg gap-1" : "px-3.5 py-2 text-xs rounded-xl gap-1.5"
            } bg-[#F26522] text-white font-bold hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center shadow-2xs whitespace-nowrap shrink-0 cursor-pointer`}
          >
            <ShoppingBag size={compact ? 11 : 13} className="shrink-0" />
            <span className="whitespace-nowrap">Add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
