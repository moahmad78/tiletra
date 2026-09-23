"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Truck,
} from "lucide-react";
import type { Category } from "@/lib/data/categories";
import type { Product } from "@/lib/data/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryIconRow from "@/components/CategoryIconRow";
import OfferBanner, { type MobileBannerSlide } from "@/components/OfferBanner";
import ProductSlider from "@/components/ProductSlider";
import RecentlyViewedSlider from "@/components/suggestions/RecentlyViewedSlider";
import DesktopBannerCarousel, { type BannerSlide } from "@/components/DesktopBannerCarousel";
import DesktopProductRow from "@/components/DesktopProductRow";
import DesktopCategoryRow from "@/components/DesktopCategoryRow";
import IntrihubBrandSEOSection from "@/components/IntrihubBrandSEOSection";
import InfiniteProductCatalog from "@/components/InfiniteProductCatalog";

interface HomeClientProps {
  categories: Category[];
  trending: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
  banners: any[];
}

export default function HomeClient({
  categories,
  trending = [],
  bestsellers = [],
  newArrivals = [],
  banners = [],
}: HomeClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter distinct product lists to prevent duplicate carousels
  const trendingIds = new Set(trending.map((p) => p.id));
  const distinctBestsellers = bestsellers.filter((p) => !trendingIds.has(p.id));
  const usedIds = new Set([...trendingIds, ...distinctBestsellers.map((p) => p.id)]);
  const distinctNewArrivals = newArrivals.filter((p) => !usedIds.has(p.id));

  const hasTrending = trending.length > 0;
  const hasBestsellers = distinctBestsellers.length >= 3 || (bestsellers.length >= 3 && trending.length === 0);
  const hasNewArrivals = distinctNewArrivals.length >= 3;

  const displayBestsellers = distinctBestsellers.length >= 3 ? distinctBestsellers : bestsellers;
  const displayNewArrivals = distinctNewArrivals.length >= 3 ? distinctNewArrivals : newArrivals;

  const desktopBannerSlides: BannerSlide[] = banners.map((b) => ({
    id: b.id,
    badge: b.badge || "Special Offer",
    headline: b.title,
    subtext: b.subtitle || "Premium Vitrified & Ceramic Collection",
    ctaText: b.cta || "Shop Now",
    ctaHref: b.href || "/shop",
    image: b.image && b.image.trim() ? b.image : "/placeholders/banner.svg",
    accentColor: "#F26522",
  }));

  const mobileBannerSlides: MobileBannerSlide[] = banners.map((b) => ({
    id: b.id,
    badge: b.badge || "Special Offer",
    title: b.title,
    subtitle: b.subtitle || "",
    cta: b.cta || "Shop Now",
    href: b.href || "/shop",
    bgGradient: b.bgGradient || "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
    image: b.image && b.image.trim() ? b.image : "/placeholders/banner.svg",
  }));

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* ========================================================================= */}
      {/* MOBILE VIEWPORT LAYOUT (Flipkart / Amazon App Pattern) - < md breakpoint   */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col bg-neutral-50 pt-[56px] pb-10">
        {/* 1. Category Icons Row (Horizontal Scroll) */}
        <CategoryIconRow categories={categories} />

        {/* 2. Offer Banner */}
        <OfferBanner slides={mobileBannerSlides} />

        {/* 3. Product Row: Trending Products */}
        {hasTrending && (
          <div className="bg-white my-1 py-1 shadow-2xs">
            <ProductSlider
              title="Trending Products"
              subtitle="Most viewed and favored by builders & homeowners"
              tag="Trending"
              products={trending}
              viewAllHref="/shop"
            />
          </div>
        )}

        {/* 5. Mid Banner: Promo & Trust Strip */}
        <div className="px-3 py-2">
          <Link href="/shop">
            <div className="bg-gradient-to-r from-[#052a51] to-[#0d4b8a] rounded-2xl p-3.5 text-white flex items-center justify-between shadow-xs border border-white/10 active:scale-[0.99] transition-transform">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F26522] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-black text-white leading-tight">
                    Free Delivery on Orders Above ₹15,000
                  </p>
                  <p className="text-[10px] text-white/70 mt-0.5">
                    Safe transit · Within 60 Minutes Delivery
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-[#F26522] shrink-0" />
            </div>
          </Link>
        </div>

        {/* 6. Product Row: Bestsellers */}
        {hasBestsellers && (
          <div className="bg-white my-1 py-1 shadow-2xs">
            <ProductSlider
              title="Bestselling Products"
              subtitle="Highest rated materials with proven quality"
              tag="Top Rated"
              products={displayBestsellers}
              viewAllHref="/shop"
            />
          </div>
        )}

        {/* 7. Product Row: New Arrivals */}
        {hasNewArrivals && (
          <div className="bg-white my-1 py-1 shadow-2xs">
            <ProductSlider
              title="New Arrivals"
              subtitle="Fresh artisan patterns, zellige & marble textures"
              tag="New"
              products={displayNewArrivals}
              viewAllHref="/shop"
            />
          </div>
        )}

        {/* Recently Viewed on Mobile */}
        <div className="px-2 my-1">
          <RecentlyViewedSlider />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEWPORT LAYOUT (Flipkart / Amazon Desktop Pattern) - >= md        */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-neutral-50 pt-[var(--header-desktop-offset,168px)]">
        {/* 1. Desktop Banner Carousel */}
        <DesktopBannerCarousel slides={desktopBannerSlides} />

        {/* 2. Continuous Auto-Scrolling Category Row (Desktop Only) */}
        <DesktopCategoryRow categories={categories} />

        {/* 3. Trending Products Row */}
        {hasTrending && (
          <DesktopProductRow
            title="Trending Products Collection"
            badge="High Demand"
            subtitle="Top picked supplies, materials, and designer finishes for modern renovations"
            products={trending}
            viewAllHref="/shop"
          />
        )}

        {/* 4. Mid Promo Banner Strip */}
        <div className="w-full max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-4">
          <div className="bg-gradient-to-r from-[#052a51] via-[#0b3b6d] to-[#052a51] rounded-3xl p-6 text-white flex items-center justify-between shadow-xs border border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F26522]/20 border border-[#F26522]/40 flex items-center justify-center text-[#F26522]">
                <Truck size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#F26522] uppercase tracking-wider">
                  Bangalore Doorstep Delivery
                </span>
                <h3 className="text-xl font-black mt-0.5">
                  Free Freight Delivery on Orders Above ₹15,000
                </h3>
                <p className="text-xs text-white/70">
                  Specialized padded protective packaging ensuring zero damage in transit.
                </p>
              </div>
            </div>

            <Link
              href="/shop"
              aria-label="Explore Full Building Materials Catalog"
              className="px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Explore Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 5. Bestselling Products Row */}
        {hasBestsellers && (
          <DesktopProductRow
            title="Top Rated Bestsellers"
            badge="Most Popular"
            subtitle="Consistently 5-star rated by verified builders & homeowners"
            products={displayBestsellers}
            viewAllHref="/shop"
          />
        )}

        {/* 6. New Arrivals Product Row */}
        {hasNewArrivals && (
          <DesktopProductRow
            title="Fresh Stock Arrivals"
            badge="Fresh Stock"
            subtitle="Freshly added electricals, sanitaryware, hardware, and designer surfaces"
            products={displayNewArrivals}
            viewAllHref="/shop"
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* UNIFIED SITE-WIDE CATALOG & SEO FOUNDATION (Rendered Once)                */}
      {/* ========================================================================= */}
      <InfiniteProductCatalog
        categories={categories}
        initialProducts={[...trending, ...displayBestsellers, ...displayNewArrivals].slice(0, 12)}
      />
      <IntrihubBrandSEOSection />
      <Footer />
    </main>
  );
}
