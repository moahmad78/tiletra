"use client";

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

export interface HomeBannerInput {
  id: string;
  badge?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  href?: string;
  image?: string;
  bgGradient?: string;
}

interface HomeClientProps {
  categories: Category[];
  trending: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
  banners: HomeBannerInput[];
}

export default function HomeClient({
  categories,
  trending = [],
  bestsellers = [],
  newArrivals = [],
  banners = [],
}: HomeClientProps) {

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
            products={trending}
            viewAllHref="/shop"
          />
        )}

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
