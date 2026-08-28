"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Star,
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  ShoppingCart,
  Calculator,
  Check,
  ArrowRight,
  Shield,
  Truck,
  Heart,
  Zap,
  MessageSquare,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import type { Product, ProductVariant } from "@/lib/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { trackProductView } from "@/lib/recommendations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompactProductCard from "@/components/CompactProductCard";
import ReviewSection from "@/components/reviews/ReviewSection";
import FrequentlyBoughtTogether from "@/components/suggestions/FrequentlyBoughtTogether";
import RecentlyViewedSlider from "@/components/suggestions/RecentlyViewedSlider";
import DiscoverMoreSection from "@/components/suggestions/DiscoverMoreSection";
import { showCartToast } from "@/lib/cart-toast-store";
import VariantSelector from "@/components/products/VariantSelector";
import SmartCalculator from "@/components/products/SmartCalculator";
import { formatUnitLabel, formatUnitName, getProductPriceInfo } from "@/lib/formatters";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

interface ProductDetailsClientProps {
  product: Product;
  relatedProducts: Product[];
  allProducts?: Product[];
}

export default function ProductDetailsClient({
  product: definedProduct,
  relatedProducts,
  allProducts,
}: ProductDetailsClientProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    definedProduct.variants[0] || {
      id: "v-default",
      size: "Standard",
      finish: "Glossy",
      color: "Standard",
      pricePerBox: 2400,
      pricePerSqft: 60,
      sqftPerBox: 40,
      stockBoxes: 50,
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [roomSqft, setRoomSqft] = useState<string>("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Dynamic gallery images including variant specific images
  const allGalleryImages = useMemo(() => {
    const raw =
      definedProduct.images && definedProduct.images.length > 0
        ? definedProduct.images.filter(Boolean)
        : [];

    const variantImages = (definedProduct.variants || [])
      .map((v) => v.image)
      .filter((img): img is string => Boolean(img && typeof img === "string"));

    const combined = Array.from(new Set([
      ...(selectedVariant.image ? [selectedVariant.image] : []),
      ...raw,
      ...variantImages,
    ]));

    if (combined.length > 0) return combined;

    return ["/placeholders/product.svg"];
  }, [definedProduct.images, definedProduct.variants, selectedVariant.image]);

  const handleSelectVariant = (v: ProductVariant) => {
    setSelectedVariant(v);
    if (v.image) {
      const idx = allGalleryImages.indexOf(v.image);
      if (idx !== -1) {
        setActiveImage(idx);
      } else {
        setActiveImage(0);
      }
    }
  };

  const handleSelectImage = (imgUrl: string) => {
    const idx = allGalleryImages.indexOf(imgUrl);
    if (idx !== -1) {
      setActiveImage(idx);
    } else {
      setActiveImage(0);
    }
  };

  // Touch & Drag swipe support for gallery
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);

  const minSwipeDistance = 35;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance && allGalleryImages.length > 1) {
      setActiveImage((prev) => (prev + 1) % allGalleryImages.length);
    } else if (distance < -minSwipeDistance && allGalleryImages.length > 1) {
      setActiveImage((prev) => (prev - 1 + allGalleryImages.length) % allGalleryImages.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseStartX(e.clientX);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartX === null) return;
    const distance = mouseStartX - e.clientX;
    if (distance > minSwipeDistance && allGalleryImages.length > 1) {
      setActiveImage((prev) => (prev + 1) % allGalleryImages.length);
    } else if (distance < -minSwipeDistance && allGalleryImages.length > 1) {
      setActiveImage((prev) => (prev - 1 + allGalleryImages.length) % allGalleryImages.length);
    }
    setMouseStartX(null);
  };

  const isOutOfStock = selectedVariant.stockBoxes <= 0;
  const wishlisted = isWishlisted(definedProduct.id);

  const totalPrice = selectedVariant.pricePerBox * quantity;
  const totalSqft = selectedVariant.sqftPerBox * quantity;

  const boxesNeeded = roomSqft
    ? Math.ceil((parseFloat(roomSqft) * 1.1) / selectedVariant.sqftPerBox)
    : null;
  const totalCostForRoom = boxesNeeded ? boxesNeeded * selectedVariant.pricePerBox : null;

  useEffect(() => {
    setMounted(true);
    trackProductView(definedProduct.id);
  }, [definedProduct.id]);

  const { isAuthenticated, openLoginModal } = useAuthStore();

  function handleAddToCart() {
    if (isOutOfStock) return;
    addItem(definedProduct, selectedVariant, quantity);
    setAddedToCart(true);
    showCartToast(definedProduct.name, quantity);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleBuyNow() {
    if (isOutOfStock) return;
    if (!isAuthenticated) {
      openLoginModal({
        type: "buy_now",
        data: {
          productId: definedProduct.id,
          variantId: selectedVariant.id,
          quantity,
        },
      });
      return;
    }
    addItem(definedProduct, selectedVariant, quantity);
    router.push("/checkout");
  }

  const coveragePerUnit =
    selectedVariant.sqftPerBox > 0
      ? selectedVariant.sqftPerBox
      : definedProduct.unitOfSale === "roll"
      ? 57
      : 40;

  const isTileProduct =
    definedProduct.categorySlug?.includes("tile") ||
    definedProduct.categorySlug?.includes("stone") ||
    definedProduct.unitOfSale === "sqft" ||
    definedProduct.unitOfSale === "box" ||
    (!definedProduct.unitOfSale && definedProduct.material === "Vitrified");

  const unitLabel = formatUnitName(selectedVariant.unit || definedProduct.unitOfSale || (isTileProduct ? "box" : "piece"));

  return (
    <main className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-[76px] sm:pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
        {/* ── Main PDP Grid: Gallery (Left) + Buy Box (Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[460px_1fr] xl:grid-cols-[500px_1fr] gap-6 lg:gap-10 items-start">
          {/* Gallery Column (Compact Flipkart Pattern) */}
          <div className="space-y-3.5 max-w-[500px] w-full mx-auto">
            {/* Main Active Image Box */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              className="relative w-full h-[340px] sm:h-[380px] lg:h-[400px] rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-2xs group select-none cursor-grab active:cursor-grabbing p-2 flex items-center justify-center"
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-50">
                <Image
                  src={allGalleryImages[activeImage] || allGalleryImages[0]}
                  alt={definedProduct.name}
                  fill
                  priority
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 500px"
                />
              </div>

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {definedProduct.isBestseller && (
                  <span className="px-3 py-1 bg-[#F26522] text-white text-[11px] font-bold rounded-full shadow-sm uppercase tracking-wide">
                    Bestseller
                  </span>
                )}
                {definedProduct.isNew && (
                  <span className="px-3 py-1 bg-[#052a51] text-white text-[11px] font-bold rounded-full shadow-sm uppercase tracking-wide">
                    New Arrival
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(definedProduct)}
                aria-label={mounted && wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-90 cursor-pointer"
              >
                <Heart
                  size={18}
                  className={mounted && wishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}
                />
              </button>

              {/* Prev / Next Chevrons */}
              {allGalleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage((prev) => (prev - 1 + allGalleryImages.length) % allGalleryImages.length);
                    }}
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#052a51] hover:bg-white active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveImage((prev) => (prev + 1) % allGalleryImages.length);
                    }}
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-[#052a51] hover:bg-white active:scale-95 transition-all cursor-pointer"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>

            {/* Flipkart-Style Thumbnails Strip Below Main Image */}
            {allGalleryImages.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto py-1 scrollbar-none justify-start sm:justify-center">
                {allGalleryImages.map((img, i) => {
                  const isSelected = activeImage === i;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      onMouseEnter={() => setActiveImage(i)}
                      className={`relative w-[64px] h-[64px] sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden border-2 transition-all active:scale-95 cursor-pointer shrink-0 p-0.5 bg-white ${
                        isSelected
                          ? "border-[#F26522] ring-2 ring-[#F26522]/30 shadow-xs scale-105"
                          : "border-gray-200 opacity-75 hover:opacity-100 hover:border-gray-400"
                      }`}
                    >
                      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-50">
                        <Image src={img} alt={`Thumbnail ${i + 1}`} fill className="object-cover" sizes="72px" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Consolidated Buy Box (Flipkart Pattern) ── */}
          <div className="space-y-5 lg:sticky lg:top-[125px] h-fit bg-white p-5 sm:p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
            {/* Header: Category, Title, Rating */}
            <div>
              <span className="text-xs font-bold text-[#F26522] uppercase tracking-widest">
                {definedProduct.categoryName}
              </span>
              <h1 className="text-[22px] sm:text-[28px] md:text-[32px] font-black text-[#052a51] mt-1 leading-tight">
                {definedProduct.name}
              </h1>

              {/* Rating & Specifications */}
              {(() => {
                const displayRating =
                  definedProduct.manualRating !== null && definedProduct.manualRating !== undefined
                    ? definedProduct.manualRating
                    : definedProduct.rating;
                const displayReviewCount =
                  definedProduct.manualReviewCount !== null && definedProduct.manualReviewCount !== undefined
                    ? definedProduct.manualReviewCount
                    : definedProduct.reviewCount;

                return (
                  <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                    {displayRating && displayRating > 0 ? (
                      <div className="flex items-center gap-1.5 bg-amber-50/90 px-2.5 py-1 rounded-xl border border-amber-200/80 shadow-2xs">
                        <Star size={13} className="fill-amber-400 text-amber-400 shrink-0" />
                        <span className="text-xs font-black text-amber-900 leading-none">{displayRating}</span>
                        {displayReviewCount !== null && displayReviewCount !== undefined && displayReviewCount > 0 && (
                          <span className="text-[11px] font-semibold text-gray-500">
                            ({displayReviewCount} reviews)
                          </span>
                        )}
                      </div>
                    ) : null}
                    <span className="text-xs font-semibold text-gray-600">Material: {definedProduct.material}</span>
                  </div>
                );
              })()}
            </div>

            {/* ── 1. Flipkart-Style Prominent Price, MRP & Off % ── */}
            {(() => {
              const priceInfo = getProductPriceInfo(definedProduct, selectedVariant);
              return (
                <div className="bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 border border-gray-100 space-y-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <div className="flex items-baseline">
                      <span className="text-3xl sm:text-4xl font-black text-[#052a51] tracking-tight">
                        {formatPrice(selectedVariant.pricePerBox)}
                      </span>
                      {priceInfo.unitSuffix && (
                        <span className="text-sm sm:text-base font-bold text-gray-500 ml-1">
                          /{priceInfo.unitSuffix}
                        </span>
                      )}
                    </div>
                    {priceInfo.formattedMrp && (
                      <span className="text-base sm:text-lg text-gray-400 line-through font-medium">
                        {priceInfo.formattedMrp}
                      </span>
                    )}
                    {priceInfo.discountPercent > 0 && (
                      <span className="text-base sm:text-lg font-black text-emerald-600">
                        {priceInfo.discountPercent}% off
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 font-medium pt-1 border-t border-gray-200/60">
                    <span>Inclusive of all taxes</span>
                    <span className="text-gray-300">·</span>
                    <span className={isOutOfStock ? "text-red-500 font-bold" : "text-[#2F7A4F] font-bold"}>
                      {isOutOfStock ? "Out of stock" : `In stock (${selectedVariant.stockBoxes} ${unitLabel}s available)`}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* ── 2. Flipkart-Style Dynamic Variant Selector (Color Swatches, Volume Chips, Dimensions) ── */}
            <VariantSelector
              product={definedProduct}
              selectedVariant={selectedVariant}
              onSelectVariant={handleSelectVariant}
              onSelectImage={handleSelectImage}
            />

            {/* ── 3. Quantity Stepper + Dynamic Total ── */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
                  Quantity ({unitLabel.charAt(0).toUpperCase() + unitLabel.slice(1)}s)
                </p>
                <span className="text-xs text-gray-500 font-medium">
                  Subtotal: <strong className="text-sm font-black text-[#052a51]">{formatPrice(totalPrice)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-[#052a51] hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-12 text-center font-black text-[#052a51] text-sm">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(selectedVariant.stockBoxes, quantity + 1))}
                    disabled={quantity >= selectedVariant.stockBoxes || isOutOfStock}
                    className="w-10 h-10 flex items-center justify-center text-[#052a51] hover:bg-gray-100 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {isTileProduct && (
                  <span className="text-xs text-gray-400 font-medium">
                    ({totalSqft.toFixed(0)} sq.ft coverage)
                  </span>
                )}
              </div>
            </div>

            {/* ── 4. Smart Category-Aware Calculator (Area→Boxes, Area→Volume, Length→Units) ── */}
            <SmartCalculator
              product={definedProduct}
              selectedVariant={selectedVariant}
              onApplyQuantity={(newQty, matchedVariant) => {
                setQuantity(newQty);
                if (matchedVariant) {
                  handleSelectVariant(matchedVariant);
                }
              }}
            />

            {/* ── 5. Primary Action Buttons (Add to Cart & Buy Now - Side by Side) ── */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                id="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 min-w-0 h-12 px-3 sm:px-4 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer whitespace-nowrap ${
                  addedToCart
                    ? "bg-[#2F7A4F] text-white"
                    : isOutOfStock
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#F26522] text-white hover:bg-[#d95a1e]"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check size={16} className="shrink-0" />
                    <span className="whitespace-nowrap truncate">Added!</span>
                  </>
                ) : isOutOfStock ? (
                  <span className="whitespace-nowrap truncate">Out of Stock</span>
                ) : (
                  <>
                    <ShoppingCart size={16} className="shrink-0" />
                    <span className="whitespace-nowrap truncate">Add to Cart</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 min-w-0 h-12 px-3 sm:px-4 font-bold text-xs sm:text-sm rounded-full flex items-center justify-center gap-1.5 bg-[#052a51] text-white hover:bg-[#041f3d] active:scale-95 transition-all shadow-md disabled:opacity-40 cursor-pointer whitespace-nowrap"
              >
                <Zap size={16} className="text-[#F26522] shrink-0" />
                <span className="whitespace-nowrap truncate">Buy Now</span>
              </button>
            </div>

            {/* ── 6. Trust & Dispatch Badges ── */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-gray-600 font-medium">
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                <Truck size={14} className="text-[#F26522] shrink-0" />
                <span className="truncate">Free delivery &gt; ₹15K</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                <Shield size={14} className="text-[#F26522] shrink-0" />
                <span className="truncate">100% Genuine</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                <Package size={14} className="text-[#F26522] shrink-0" />
                <span className="truncate">Direct Dispatch</span>
              </div>
            </div>

            {/* ── 7. Dedicated Inline WhatsApp Support (Gulshan Ali Sheikh) ── */}
            <div className="pt-2 border-t border-gray-100">
              <a
                href={`https://wa.me/919198035803?text=${encodeURIComponent(`Hi Gulshan (Intrihub), I need expert guidance or project quote for ${definedProduct.name}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <MessageCircle size={14} />
                  </div>
                  <span>Need expert guidance or project quote?</span>
                </div>
                <span className="text-[#25D366] group-hover:translate-x-0.5 transition-transform font-bold flex items-center gap-1">
                  <span>Connect with Expert</span>
                  <ArrowRight size={14} />
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* ── Product Specifications & Attributes Section ── */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 md:p-8">
          <button
            onClick={() => setSpecsOpen(!specsOpen)}
            className="w-full flex items-center justify-between group cursor-pointer"
          >
            <h2 className="text-xl font-black text-[#052a51] flex items-center gap-2">
              <Sparkles size={18} className="text-[#F26522]" />
              <span>Product Specifications & Details</span>
            </h2>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#052a51]">
              {specsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          {specsOpen && (
            <div className="mt-6 space-y-6 animate-in fade-in duration-200">
              {/* Dynamic Category Attributes */}
              {definedProduct.attributes && definedProduct.attributes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {definedProduct.attributes.map((attr, idx) => (
                    <div key={idx} className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                        {attr.key}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#052a51]">{attr.value}</span>
                    </div>
                  ))}
                  <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      Material
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#052a51]">{definedProduct.material}</span>
                  </div>
                  <div className="bg-[#F8F9FA] p-3.5 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                      Unit of Sale
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#052a51] capitalize">{unitLabel}</span>
                  </div>
                </div>
              ) : (
                /* Tile Specifications Table Fallback */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                  {[
                    { label: "Material", value: definedProduct.material },
                    { label: "Size", value: selectedVariant.size },
                    { label: "Surface Finish", value: selectedVariant.finish },
                    { label: "Thickness", value: definedProduct.specs?.thickness || definedProduct.thickness || "Standard" },
                    { label: "Water Absorption", value: definedProduct.specs?.waterAbsorption || "Impervious" },
                    { label: "Breaking Strength", value: definedProduct.specs?.breakingStrength || "High" },
                    { label: "Coverage per Box", value: `${selectedVariant.sqftPerBox} sq.ft` },
                    { label: "Stock Availability", value: `${selectedVariant.stockBoxes} boxes available` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2.5 border-b border-gray-100 text-xs md:text-sm">
                      <span className="text-gray-500 font-medium">{label}</span>
                      <span className="text-[#052a51] font-bold">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Dedicated Product Description Container */}
              <div className="w-full bg-[#F8F9FA] rounded-2xl p-4 sm:p-5 border border-gray-200/70 shadow-2xs space-y-2">
                <h3 className="text-xs font-bold text-[#052a51] uppercase tracking-wider">About This Product</h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words whitespace-pre-line max-w-full">
                  {definedProduct.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Frequently Bought Together ── */}
        <div className="mt-12">
          <FrequentlyBoughtTogether product={definedProduct} />
        </div>

        {/* ── Related Products (Same Category) ── */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 mb-8 bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/80 shadow-2xs space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg font-black text-[#052a51] tracking-tight">
                Similar Products
              </h2>
              <Link
                href={`/shop/${definedProduct.categorySlug}`}
                className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Mobile Swipeable Slider */}
            <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pt-1 pb-2 scrollbar-none">
              {relatedProducts.map((p) => (
                <div key={p.id} className="snap-start shrink-0">
                  <CompactProductCard product={p} />
                </div>
              ))}
            </div>

            {/* Desktop Grid Layout */}
            <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 pt-1">
              {relatedProducts.map((p) => (
                <CompactProductCard key={p.id} product={p} className="w-full h-full" />
              ))}
            </div>
          </div>
        )}

        {/* ── Discover More Across Intrihub (Cross-Category Shuffle) ── */}
        <div className="mt-10 mb-8">
          <DiscoverMoreSection
            currentProductId={definedProduct.id}
            excludedProductIds={relatedProducts.map((p) => p.id)}
            catalog={allProducts}
          />
        </div>

        {/* ── Recently Viewed Slider ── */}
        <div className="mt-8 mb-10">
          <RecentlyViewedSlider currentProductId={definedProduct.id} />
        </div>
      </div>

      {/* ── Sticky Mobile PDP Bottom Bar (Live Price Sync + Side-by-Side Buttons) ── */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-gray-200 px-3.5 py-2.5 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
        <div className="shrink-0 min-w-0 pr-1">
          <p className="text-base sm:text-lg font-black text-[#052a51] leading-none">
            {formatPrice(totalPrice)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5 font-medium truncate">
            {quantity} {unitLabel}{quantity > 1 ? "s" : ""} · {selectedVariant.size}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 min-w-0 h-11 px-2.5 sm:px-3 font-bold text-xs rounded-xl active:scale-95 flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer whitespace-nowrap ${
              addedToCart
                ? "bg-[#2F7A4F] text-white"
                : isOutOfStock
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-[#F26522] text-white hover:bg-[#d95a1e]"
            }`}
          >
            {addedToCart ? (
              <>
                <Check size={14} className="shrink-0" />
                <span className="whitespace-nowrap">Added!</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} className="shrink-0" />
                <span className="whitespace-nowrap">Add to Cart</span>
              </>
            )}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 min-w-0 h-11 px-2.5 sm:px-3 bg-[#052a51] text-white text-xs font-bold rounded-xl active:scale-95 flex items-center justify-center gap-1 shadow-sm disabled:opacity-40 cursor-pointer hover:bg-[#041f3d] transition-all whitespace-nowrap"
          >
            <Zap size={14} className="text-[#F26522] shrink-0" />
            <span className="whitespace-nowrap">Buy Now</span>
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
