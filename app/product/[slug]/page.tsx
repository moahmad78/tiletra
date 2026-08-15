"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Package,
  ChevronDown,
  ChevronUp,
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
  ThumbsUp,
} from "lucide-react";
import { getProductBySlug, getBestsellers } from "@/lib/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { trackProductView, getYouMayAlsoLike } from "@/lib/recommendations";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import ReviewSection from "@/components/reviews/ReviewSection";
import FrequentlyBoughtTogether from "@/components/suggestions/FrequentlyBoughtTogether";
import RecentlyViewedSlider from "@/components/suggestions/RecentlyViewedSlider";
import { notFound } from "next/navigation";
import { use, useEffect } from "react";
import type { ProductVariant } from "@/lib/data/products";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const definedProduct = product!;

  const { addItem } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(definedProduct.variants[0]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [roomSqft, setRoomSqft] = useState<string>("");
  const [addedToCart, setAddedToCart] = useState(false);
  const [specsOpen, setSpecsOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isOutOfStock = selectedVariant.stockBoxes <= 0;
  const wishlisted = isWishlisted(definedProduct.id);

  const totalPrice = selectedVariant.pricePerBox * quantity;
  const totalSqft = selectedVariant.sqftPerBox * quantity;

  const boxesNeeded = roomSqft
    ? Math.ceil((parseFloat(roomSqft) * 1.1) / selectedVariant.sqftPerBox) // 10% wastage buffer
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
    toast.success(`Added ${quantity} box(es) of ${definedProduct.name} to cart!`);
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

  const youMayAlsoLike = getYouMayAlsoLike(definedProduct, 3);

  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Header />

      <div
        className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-[110px] md:pt-[168px] pb-6 md:pb-10 flex-1"
      >
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-6 flex-wrap">
          <Link href="/" className="hover:text-[#F26522] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop" className="hover:text-[#F26522] transition-colors">Shop</Link>
          <span>/</span>
          <Link href={`/shop/${definedProduct.categorySlug}`} className="hover:text-[#F26522] transition-colors">
            {definedProduct.categoryName}
          </Link>
          <span>/</span>
          <span className="text-[#052a51] font-semibold line-clamp-1 max-w-[200px]">{definedProduct.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-10 xl:gap-14 items-start">
          {/* ── Image Gallery (Mobile Swipeable + Desktop Thumbnails) ── */}
          <div className="space-y-4">
            <div className="relative h-[340px] sm:h-[440px] md:h-[500px] rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
              <Image
                src={definedProduct.images[activeImage]}
                alt={definedProduct.name}
                fill
                priority
                className="object-cover transition-all duration-300"
                sizes="(max-width: 768px) 100vw, 55vw"
              />

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                {definedProduct.isBestseller && (
                  <span className="px-3 py-1.5 bg-[#F26522] text-white text-xs font-bold rounded-full shadow-sm uppercase tracking-wide">
                    Bestseller
                  </span>
                )}
                {definedProduct.isNew && (
                  <span className="px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-full shadow-sm uppercase tracking-wide">
                    New Arrival
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={() => toggleWishlist(definedProduct)}
                aria-label={mounted && wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-all hover:scale-110 active:scale-90"
              >
                <Heart
                  size={20}
                  className={mounted && wishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}
                />
              </button>

              {/* Mobile Dot Indicators */}
              {definedProduct.images.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 md:hidden">
                  {definedProduct.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`h-2 rounded-full transition-all ${
                        activeImage === i ? "w-6 bg-[#F26522]" : "w-2 bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Thumbnails */}
            {definedProduct.images.length > 1 && (
              <div className="hidden md:flex gap-3">
                {definedProduct.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all active:scale-95 ${
                      activeImage === i
                        ? "border-[#F26522] ring-2 ring-[#F26522]/20"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Sticky Buy Box (Right Column) ── */}
          <div className="space-y-6 lg:sticky lg:top-[125px] h-fit bg-white lg:p-6 lg:rounded-3xl lg:border lg:border-gray-200/80 lg:shadow-2xs">
            <div>
              <span className="text-xs font-bold text-[#F26522] uppercase tracking-widest">
                {definedProduct.categoryName}
              </span>
              <h1 className="text-[26px] sm:text-[32px] md:text-[38px] font-black text-[#052a51] mt-1 leading-tight">
                {definedProduct.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-900">{definedProduct.rating}</span>
                </div>
                <button
                  onClick={() => setReviewsOpen(true)}
                  className="text-xs font-semibold text-gray-500 hover:text-[#052a51] underline"
                >
                  {definedProduct.reviewCount} customer reviews
                </button>
                <span className="text-gray-300">|</span>
                <span className="text-xs font-semibold text-gray-500">Material: {definedProduct.material}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-[#F3F4F5] rounded-3xl p-5 md:p-6 border border-gray-100">
              <div className="flex items-baseline gap-3 flex-wrap">
                <p className="text-[32px] md:text-[38px] font-black text-[#052a51]">
                  {formatPrice(selectedVariant.pricePerBox)}
                </p>
                <p className="text-sm font-semibold text-gray-500">per box (incl. taxes)</p>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3 pt-3 border-t border-gray-200/60 text-xs md:text-sm text-gray-600">
                <span>
                  <strong className="text-[#052a51]">{formatPrice(selectedVariant.pricePerSqft)}</strong>/sq.ft
                </span>
                <span className="text-gray-300">·</span>
                <span>
                  <strong className="text-[#052a51]">{selectedVariant.sqftPerBox} sq.ft</strong> coverage/box
                </span>
                <span className="text-gray-300">·</span>
                <span className={isOutOfStock ? "text-red-500 font-bold" : "text-[#2F7A4F] font-bold"}>
                  {isOutOfStock ? "Out of stock" : `In stock (${selectedVariant.stockBoxes} boxes available)`}
                </span>
              </div>
            </div>

            {/* Variant Selectors */}
            <div className="space-y-4">
              {/* Size */}
              <div>
                <p className="text-xs font-bold text-[#052a51] uppercase tracking-wider mb-2">
                  Select Size: <span className="text-[#F26522] normal-case">{selectedVariant.size}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(definedProduct.variants.map((v) => v.size))].map((size) => {
                    const v = definedProduct.variants.find((vv) => vv.size === size)!;
                    const isSelected = selectedVariant.size === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border-2 transition-all active:scale-95 ${
                          isSelected
                            ? "border-[#F26522] bg-[#F26522]/10 text-[#F26522] shadow-xs"
                            : "border-gray-200 text-[#052a51] hover:border-gray-400 bg-white"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Finish */}
              <div>
                <p className="text-xs font-bold text-[#052a51] uppercase tracking-wider mb-2">
                  Select Finish: <span className="text-[#F26522] normal-case">{selectedVariant.finish}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {[...new Set(definedProduct.variants.map((v) => v.finish))].map((finish) => {
                    const v = definedProduct.variants.find((vv) => vv.finish === finish)!;
                    const isSelected = selectedVariant.finish === finish;
                    return (
                      <button
                        key={finish}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2.5 text-xs font-bold rounded-xl border-2 transition-all active:scale-95 ${
                          isSelected
                            ? "border-[#F26522] bg-[#F26522]/10 text-[#F26522] shadow-xs"
                            : "border-gray-200 text-[#052a51] hover:border-gray-400 bg-white"
                        }`}
                      >
                        {finish}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quantity Stepper */}
            <div>
              <p className="text-xs font-bold text-[#052a51] uppercase tracking-wider mb-2">Quantity (Boxes)</p>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="w-11 h-11 flex items-center justify-center text-[#052a51] hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <Minus size={15} />
                  </button>
                  <span className="w-12 text-center font-black text-[#052a51] text-base">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant.stockBoxes, quantity + 1))}
                    disabled={quantity >= selectedVariant.stockBoxes || isOutOfStock}
                    className="w-11 h-11 flex items-center justify-center text-[#052a51] hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>

                <div className="text-xs text-gray-500 font-medium">
                  Total: <strong className="text-sm font-black text-[#052a51]">{formatPrice(totalPrice)}</strong>
                  <span className="ml-2 text-gray-400">({totalSqft.toFixed(0)} sq.ft coverage)</span>
                </div>
              </div>
            </div>

            {/* Room Area Coverage Calculator (Integrated in Buy Box) */}
            <div className="bg-[#052a51]/5 rounded-2xl p-4 border border-[#052a51]/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#052a51] flex items-center gap-1.5">
                  <Calculator size={15} className="text-[#F26522]" />
                  <span>Room Area Calculator</span>
                </span>
                <span className="text-[10px] text-gray-400 font-medium">+10% waste buffer included</span>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={roomSqft}
                  onChange={(e) => {
                    setRoomSqft(e.target.value);
                    if (e.target.value) {
                      const needed = Math.ceil((parseFloat(e.target.value) * 1.1) / selectedVariant.sqftPerBox);
                      setQuantity(needed);
                    }
                  }}
                  placeholder="Enter sq.ft (e.g. 150)"
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                />
                <span className="flex items-center px-3 bg-gray-100 rounded-xl text-xs font-bold text-gray-600">
                  sq.ft
                </span>
              </div>

              {boxesNeeded && (
                <div className="text-[11px] text-[#052a51] font-semibold flex justify-between pt-1 border-t border-gray-200/60">
                  <span>Calculated for {roomSqft} sq.ft:</span>
                  <span className="font-bold text-[#F26522]">{boxesNeeded} boxes ({formatPrice(totalCostForRoom!)})</span>
                </div>
              )}
            </div>

            {/* Action Buttons (Desktop & Tablet) */}
            <div className="flex gap-3 pt-1">
              <button
                id="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 h-13 font-bold text-sm md:text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md ${
                  addedToCart
                    ? "bg-[#2F7A4F] text-white"
                    : isOutOfStock
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-[#F26522] text-white hover:bg-[#d95a1e]"
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check size={18} /> Added to Cart!
                  </>
                ) : isOutOfStock ? (
                  "Out of Stock"
                ) : (
                  <>
                    <ShoppingCart size={18} /> Add to Cart
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 h-13 font-bold text-sm md:text-base rounded-2xl flex items-center justify-center gap-2 bg-[#052a51] text-white hover:bg-[#041f3d] active:scale-95 transition-all shadow-md disabled:opacity-40"
              >
                <Zap size={18} className="text-[#F26522]" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Delivery & Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-gray-600 font-medium">
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                <Truck size={15} className="text-[#F26522] shrink-0" />
                <span>Free delivery &gt; ₹15K</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                <Shield size={15} className="text-[#F26522] shrink-0" />
                <span>Quality Assured</span>
              </div>
              <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl">
                <Package size={15} className="text-[#F26522] shrink-0" />
                <span>3–7 Days Dispatch</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Specifications & About Section (Below the 2-column fold) ── */}
        <div className="mt-12 bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 md:p-8">
          <button
            onClick={() => setSpecsOpen(!specsOpen)}
            className="w-full flex items-center justify-between group"
          >
            <h2 className="text-xl font-black text-[#052a51]">Specifications & Technical Details</h2>
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[#052a51]">
              {specsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          </button>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            {[
              { label: "Material", value: definedProduct.material },
              { label: "Selected Size", value: selectedVariant.size },
              { label: "Surface Finish", value: selectedVariant.finish },
              { label: "Thickness", value: definedProduct.specs.thickness },
              { label: "Water Absorption", value: definedProduct.specs.waterAbsorption },
              { label: "Slip Resistance", value: definedProduct.specs.slipResistance },
              { label: "Breaking Strength", value: definedProduct.specs.breakingStrength },
              { label: "Frost Resistance", value: definedProduct.specs.frostResistance },
              { label: "Coverage per Box", value: `${selectedVariant.sqftPerBox} sq.ft` },
              { label: "Stock Availability", value: `${selectedVariant.stockBoxes} boxes in stock` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2.5 border-b border-gray-100 text-xs md:text-sm">
                <span className="text-gray-500 font-medium">{label}</span>
                <span className="text-[#052a51] font-bold">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1">About This Tile</p>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">{definedProduct.description}</p>
          </div>
        </div>

        {/* ── Frequently Bought Together (Cross-Sell Bundle) ── */}
        <div className="mt-12">
          <FrequentlyBoughtTogether product={definedProduct} />
        </div>

        {/* ── Customer Reviews & Photo Ratings (Phase 3 Real Data) ── */}
        <div className="mt-14">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={22} className="text-[#F26522]" />
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#052a51]">
                Customer Reviews & Photos
              </h2>
              <p className="text-xs text-gray-500">
                Real photos & ratings from verified tile buyers
              </p>
            </div>
          </div>

          <ReviewSection
            productId={definedProduct.id}
            productName={definedProduct.name}
          />
        </div>

        {/* ── You May Also Like (Category & Style Recommendations) ── */}
        {youMayAlsoLike.length > 0 && (
          <div className="mt-16 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-[10px] font-black text-[#F26522] uppercase tracking-wider bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
                  Similar Designs
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#052a51] mt-1">
                  You May Also Like
                </h2>
              </div>
              <Link
                href={`/shop/${definedProduct.categorySlug}`}
                className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
              >
                View all in {definedProduct.categoryName} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {youMayAlsoLike.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── Recently Viewed Slider ── */}
        <div className="mt-12 mb-8">
          <RecentlyViewedSlider currentProductId={definedProduct.id} />
        </div>
      </div>

      {/* ── Sticky Mobile PDP Bottom Bar (Flipkart / Amazon App Pattern) ── */}
      <div className="md:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-black text-[#052a51] leading-none">
            {formatPrice(selectedVariant.pricePerBox)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">
            {formatPrice(selectedVariant.pricePerSqft)}/sq.ft · {selectedVariant.size}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="px-4 h-11 bg-[#F26522] text-white text-xs font-bold rounded-xl active:scale-95 flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <ShoppingCart size={15} />
            <span>Add</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="px-4 h-11 bg-[#052a51] text-white text-xs font-bold rounded-xl active:scale-95 flex items-center gap-1.5 shadow-sm disabled:opacity-40"
          >
            <Zap size={15} className="text-[#F26522]" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
