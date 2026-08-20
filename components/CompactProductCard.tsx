"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Heart, Check } from "lucide-react";
import { getLowestPrice, getLowestBoxPrice, type Product } from "@/lib/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { showCartToast } from "@/lib/cart-toast-store";
import { cn } from "@/lib/utils";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function CompactProductCard({
  product,
  className,
}: {
  product: Product;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
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
    setJustAdded(true);
    showCartToast(product.name, 1);
    setTimeout(() => setJustAdded(false), 1200);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group",
        className || "w-[145px] sm:w-[155px] shrink-0 snap-start"
      )}
    >
      {/* Top Image Container */}
      <div className="relative">
        <Link href={`/product/${product.slug}`} className="block relative aspect-square w-full bg-gray-50 overflow-hidden">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="155px"
          />
          {/* Badge */}
          {product.isBestseller && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#F26522] text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider shadow-xs">
              Top
            </span>
          )}
          {!product.isBestseller && product.isNew && (
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#052a51] text-white text-[9px] font-extrabold rounded-md uppercase tracking-wider shadow-xs">
              New
            </span>
          )}
        </Link>

        {/* Compact Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          aria-label={mounted && wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-white/90 backdrop-blur-xs shadow-xs flex items-center justify-center transition-transform active:scale-75"
        >
          <Heart
            size={12}
            className={
              mounted && wishlisted
                ? "fill-red-500 text-red-500"
                : "text-gray-500 hover:text-red-500"
            }
          />
        </button>
      </div>

      {/* Info Section */}
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/product/${product.slug}`}>
            <h3 className="text-[12px] font-bold text-[#052a51] leading-snug line-clamp-1 hover:text-[#F26522] transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-[10px] text-gray-400 mt-0.5 truncate">
            {defaultVariant.size} · {defaultVariant.finish}
          </p>
        </div>

        <div className="flex items-end justify-between mt-2 pt-1.5 border-t border-gray-50">
          <div>
            {product.unitOfSale && product.unitOfSale !== "box" && product.unitOfSale !== "sqft" ? (
              <>
                <p className="text-[12px] font-black text-[#052a51] leading-none">
                  {formatPrice(defaultVariant.pricePerBox)}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5 capitalize">/{product.unitOfSale}</p>
              </>
            ) : product.unitOfSale === "sqft" ? (
              <>
                <p className="text-[12px] font-black text-[#052a51] leading-none">
                  {formatPrice(defaultVariant.pricePerSqft || defaultVariant.pricePerBox)}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">/sq.ft</p>
              </>
            ) : (product.categorySlug?.includes("tile") || product.categorySlug?.includes("stone")) ? (
              <>
                <p className="text-[12px] font-black text-[#052a51] leading-none">
                  {formatPrice(getLowestPrice(product))}
                  <span className="text-[9px] font-normal text-gray-500">/sqft</span>
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">{formatPrice(getLowestBoxPrice(product))}/box</p>
              </>
            ) : (
              <>
                <p className="text-[12px] font-black text-[#052a51] leading-none">
                  {formatPrice(defaultVariant.pricePerBox)}
                </p>
                <p className="text-[9px] text-gray-400 mt-0.5">/box</p>
              </>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            aria-label={`Add ${product.name} to cart`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-xs ${
              justAdded
                ? "bg-green-600 text-white"
                : "bg-[#F26522] text-white hover:bg-[#d95a1e]"
            }`}
          >
            {justAdded ? <Check size={14} /> : <Plus size={15} strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </div>
  );
}
