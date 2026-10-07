"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Heart,
  Share2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ShoppingCart,
  Zap,
  Check,
  Bell,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { SafeImage } from "@/components/ui/SafeImage";
import type { Product, ProductVariant } from "@/lib/data/products";

export interface ProductImageGalleryProps {
  product: Product;
  selectedVariant: ProductVariant;
  images: string[];
  activeImage: number;
  onSelectImage: (index: number) => void;
  isWishlisted: boolean;
  onToggleWishlist: () => void;
  isOutOfStock: boolean;
  addedToCart: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onNotifyMe: () => void;
  notifySuccess: boolean;
}

export default function ProductImageGallery({
  product,
  selectedVariant,
  images,
  activeImage,
  onSelectImage,
  isWishlisted,
  onToggleWishlist,
  isOutOfStock,
  addedToCart,
  onAddToCart,
  onBuyNow,
  onNotifyMe,
  notifySuccess,
}: ProductImageGalleryProps) {
  const safeImages = images && images.length > 0 ? images : ["/placeholders/product.svg"];
  const currentIdx = Math.min(Math.max(0, activeImage), safeImages.length - 1);
  const activeImageUrl = safeImages[currentIdx] || safeImages[0];

  // ── 1. Desktop Hover Zoom State ──
  const [isZooming, setIsZooming] = useState(false);
  const [zoomCoords, setZoomCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!previewBoxRef.current) return;
    const rect = previewBoxRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomCoords({ x, y });
  };

  // ── 2. Fullscreen Lightbox Modal State ──
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const openLightbox = () => {
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setLightboxZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePrevImage = useCallback(() => {
    onSelectImage((currentIdx - 1 + safeImages.length) % safeImages.length);
    setPanOffset({ x: 0, y: 0 });
  }, [currentIdx, onSelectImage, safeImages.length]);

  const handleNextImage = useCallback(() => {
    onSelectImage((currentIdx + 1) % safeImages.length);
    setPanOffset({ x: 0, y: 0 });
  }, [currentIdx, onSelectImage, safeImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, handlePrevImage, handleNextImage]);

  // ── 3. Touch Swipe Handling for Mobile ──
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const minSwipeDistance = 35;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchStartX - touchEndX;
    if (distance > minSwipeDistance && safeImages.length > 1) {
      handleNextImage();
    } else if (distance < -minSwipeDistance && safeImages.length > 1) {
      handlePrevImage();
    }
    setTouchStartX(null);
  };

  // ── 4. Vertical Thumbnail Scroll (Desktop) ──
  const thumbnailListRef = useRef<HTMLDivElement>(null);

  const scrollThumbnails = (direction: "up" | "down") => {
    if (!thumbnailListRef.current) return;
    const offset = direction === "up" ? -140 : 140;
    thumbnailListRef.current.scrollBy({ top: offset, behavior: "smooth" });
  };

  // ── 5. Share Product URL ──
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on IntriHub!`,
          url: window.location.href,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied to clipboard!");
      }
    } catch {
      // User cancelled share
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* ── Flipkart Desktop & Mobile Gallery Grid ── */}
      <div className="flex flex-col-reverse md:flex-row gap-3 lg:gap-4 items-start w-full">
        {/* ── Left Vertical Thumbnails Strip (Flipkart Desktop Signature) ── */}
        {safeImages.length > 1 && (
          <div className="flex md:flex-col items-center gap-2 w-full md:w-auto shrink-0 order-2 md:order-1">
            {/* Scroll Up Button (Desktop only if > 5 images) */}
            {safeImages.length > 5 && (
              <button
                type="button"
                onClick={() => scrollThumbnails("up")}
                aria-label="Scroll thumbnails up"
                className="hidden md:flex items-center justify-center w-full py-1 text-gray-400 hover:text-[#052a51] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronUp size={16} />
              </button>
            )}

            {/* Thumbnails Container */}
            <div
              ref={thumbnailListRef}
              className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-h-[460px] lg:max-h-[500px] w-full md:w-auto py-1 px-0.5 scrollbar-none items-center"
            >
              {safeImages.map((img, i) => {
                const isSelected = currentIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectImage(i)}
                    onMouseEnter={() => onSelectImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`relative w-[60px] h-[60px] sm:w-[68px] sm:h-[68px] lg:w-[72px] lg:h-[72px] rounded-xl overflow-hidden border-2 transition-all duration-150 shrink-0 cursor-pointer p-0.5 bg-white ${
                      isSelected
                        ? "border-[#F26522] ring-2 ring-[#F26522]/30 shadow-xs scale-102"
                        : "border-gray-200 hover:border-gray-400 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-50 pointer-events-none">
                      <SafeImage
                        src={img}
                        variantSize={400}
                        alt={`${product.name} thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="72px"
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Scroll Down Button (Desktop only if > 5 images) */}
            {safeImages.length > 5 && (
              <button
                type="button"
                onClick={() => scrollThumbnails("down")}
                aria-label="Scroll thumbnails down"
                className="hidden md:flex items-center justify-center w-full py-1 text-gray-400 hover:text-[#052a51] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        )}

        {/* ── Main Preview Box with Flipkart Magnifier Zoom ── */}
        <div className="relative flex-1 w-full order-1 md:order-2">
          <div
            ref={previewBoxRef}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={openLightbox}
            className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] lg:h-[490px] xl:h-[510px] rounded-2xl overflow-hidden bg-white border border-gray-200/90 shadow-2xs group cursor-zoom-in p-2 sm:p-3 flex items-center justify-center"
          >
            {/* The Image Container with Lens Zoom Effect */}
            <div className="relative w-full h-full rounded-xl overflow-hidden bg-gray-50">
              <div
                className="relative w-full h-full transition-transform duration-100 ease-out will-change-transform"
                style={{
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  transform: isZooming ? "scale(2.2)" : "scale(1)",
                }}
              >
                <SafeImage
                  src={activeImageUrl}
                  variantSize={1200}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover pointer-events-none select-none"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>

              {/* Flipkart Magnifier Lens Overlay on Desktop */}
              {isZooming && (
                <div
                  className="hidden md:block absolute pointer-events-none rounded-md border border-white/60 bg-white/20 backdrop-blur-[1px] shadow-sm transition-opacity duration-150"
                  style={{
                    width: "120px",
                    height: "120px",
                    left: `calc(${zoomCoords.x}% - 60px)`,
                    top: `calc(${zoomCoords.y}% - 60px)`,
                  }}
                />
              )}
            </div>

            {/* Badges (Top Left) */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.isBestseller && (
                <span className="px-2.5 py-1 bg-[#F26522] text-white text-[10px] sm:text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Sparkles size={11} />
                  Bestseller
                </span>
              )}
              {product.isNew && (
                <span className="px-2.5 py-1 bg-[#052a51] text-white text-[10px] sm:text-[11px] font-extrabold rounded-full uppercase tracking-wider shadow-sm">
                  New Arrival
                </span>
              )}
              {product.brand && (
                <span className="px-2 py-0.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold rounded-md tracking-wide">
                  {product.brand}
                </span>
              )}
            </div>

            {/* Top Right Actions: Wishlist + Share */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={handleShare}
                aria-label="Share product"
                className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-600 hover:text-[#052a51] hover:bg-white active:scale-95 transition-all cursor-pointer"
              >
                <Share2 size={16} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist();
                }}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-90 cursor-pointer"
              >
                <Heart
                  size={18}
                  className={isWishlisted ? "fill-red-500 text-red-500" : "text-gray-600 hover:text-red-500"}
                />
              </button>
            </div>

            {/* Floating Navigation Chevrons */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevImage();
                  }}
                  aria-label="Previous image"
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-[#052a51] hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  aria-label="Next image"
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-[#052a51] hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Bottom Controls: Zoom Hint & Fullscreen Lightbox Button */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              {/* Flipkart-Style Image Counter on Mobile */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                <span>{currentIdx + 1}</span>
                <span className="opacity-60">/</span>
                <span>{safeImages.length}</span>
              </div>

              {/* Desktop Hover to Zoom Hint */}
              <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-gray-600 text-[11px] font-semibold shadow-xs">
                <ZoomIn size={12} className="text-[#F26522]" />
                Hover to zoom
              </span>

              {/* Fullscreen Expand Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openLightbox();
                }}
                aria-label="Expand image fullscreen"
                className="pointer-events-auto p-1.5 rounded-full bg-white/90 backdrop-blur-sm text-gray-700 hover:text-[#052a51] hover:bg-white shadow-md active:scale-95 transition-all cursor-pointer"
              >
                <Maximize2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Flipkart Iconic Action Buttons Directly Below Image (Desktop) ── */}
      <div className="hidden md:grid grid-cols-2 gap-2.5 sm:gap-3 w-full pt-1">
        <button
          type="button"
          onClick={onAddToCart}
          disabled={isOutOfStock || product.status === "discontinued"}
          className={`h-12 sm:h-13 px-4 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer ${
            addedToCart
              ? "bg-[#2F7A4F] text-white shadow-emerald-500/20"
              : product.status === "discontinued" || isOutOfStock
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#FF9F00] hover:bg-[#f09300] text-white shadow-orange-500/20"
          }`}
        >
          {addedToCart ? (
            <>
              <Check size={18} className="shrink-0" />
              <span>ADDED TO CART</span>
            </>
          ) : isOutOfStock ? (
            <span>OUT OF STOCK</span>
          ) : (
            <>
              <ShoppingCart size={18} className="shrink-0" />
              <span>ADD TO CART</span>
            </>
          )}
        </button>

        {isOutOfStock ? (
          <button
            type="button"
            onClick={onNotifyMe}
            className="h-12 sm:h-13 px-4 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 bg-[#052a51] text-white hover:bg-[#041f3d] active:scale-98 transition-all shadow-sm cursor-pointer"
          >
            <Bell size={18} className="text-[#F26522] shrink-0" />
            <span>{notifySuccess ? "NOTIFIED!" : "NOTIFY ME"}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onBuyNow}
            disabled={product.status === "discontinued"}
            className="h-12 sm:h-13 px-4 font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 bg-[#FB641B] hover:bg-[#e75713] text-white active:scale-98 transition-all shadow-sm shadow-orange-600/20 disabled:opacity-40 cursor-pointer"
          >
            <Zap size={18} className="fill-white shrink-0" />
            <span>BUY NOW</span>
          </button>
        )}
      </div>

      {/* ── Flipkart Fullscreen Lightbox Modal (High-Res Inspector) ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <h2 className="text-sm sm:text-base font-bold truncate max-w-[240px] sm:max-w-md">
                {product.name}
              </h2>
              <span className="text-xs text-gray-400 font-semibold px-2 py-0.5 rounded-full bg-white/10">
                {currentIdx + 1} of {safeImages.length}
              </span>
            </div>

            {/* Controls: Zoom In, Zoom Out, Reset, Close */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.min(prev + 0.5, 3))}
                aria-label="Zoom in"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ZoomIn size={18} />
              </button>
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.max(prev - 0.5, 1))}
                aria-label="Zoom out"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ZoomOut size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                aria-label="Reset zoom"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                onClick={closeLightbox}
                aria-label="Close photo viewer"
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors ml-2 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Center Stage Image with Drag/Pan support when zoomed */}
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-3 cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              if (lightboxZoom > 1) {
                setIsDragging(true);
                dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
              }
            }}
            onMouseMove={(e) => {
              if (isDragging && lightboxZoom > 1) {
                setPanOffset({
                  x: e.clientX - dragStartRef.current.x,
                  y: e.clientY - dragStartRef.current.y,
                });
              }
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
          >
            <div
              className="relative max-w-full max-h-[75vh] aspect-square w-[550px] sm:w-[650px] lg:w-[750px] transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${lightboxZoom}) translate(${panOffset.x / lightboxZoom}px, ${panOffset.y / lightboxZoom}px)`,
              }}
            >
              <SafeImage
                src={activeImageUrl}
                variantSize={1400}
                alt={product.name}
                fill
                priority
                className="object-contain pointer-events-none select-none"
                sizes="100vw"
              />
            </div>

            {/* Chevrons */}
            {safeImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip in Lightbox */}
          {safeImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 overflow-x-auto py-2 scrollbar-none">
              {safeImages.map((img, i) => {
                const isSelected = currentIdx === i;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSelectImage(i);
                      setPanOffset({ x: 0, y: 0 });
                    }}
                    className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer p-0.5 bg-black/40 ${
                      isSelected ? "border-[#F26522] scale-105" : "border-white/20 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="relative w-full h-full rounded overflow-hidden">
                      <SafeImage
                        src={img}
                        variantSize={400}
                        alt={`Thumbnail ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
