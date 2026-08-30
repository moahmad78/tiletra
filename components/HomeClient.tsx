"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Truck,
  ChevronRight,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Award,
} from "lucide-react";
import type { Category } from "@/lib/data/categories";
import type { Product } from "@/lib/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
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



interface HomeClientProps {
  categories: Category[];
  trending: Product[];
  bestsellers: Product[];
  newArrivals: Product[];
  banners: any[];
}

export default function HomeClient({
  categories,
  trending,
  bestsellers,
  newArrivals,
  banners,
}: HomeClientProps) {
  const [mounted, setMounted] = useState(false);

  const { toggleCart } = useCartStore();
  const totalBoxes = useCartStore((s) => s.getTotalBoxes());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  useEffect(() => {
    setMounted(true);
  }, []);

  const desktopBannerSlides: BannerSlide[] = banners.map((b) => ({
    id: b.id,
    badge: b.badge || "Special Offer",
    headline: b.title,
    subtext: b.subtitle || "Premium Vitrified & Ceramic Collection",
    ctaText: b.cta || "Shop Now",
    ctaHref: b.href || "/shop",
    image: b.image || "/placeholders/product.svg",
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
    image: b.image || "/placeholders/product.svg",
  }));

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* ========================================================================= */}
      {/* MOBILE VIEWPORT LAYOUT (Flipkart / Amazon App Pattern) - < md breakpoint   */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col bg-[#F8F9FA] pt-[56px] pb-10">
        {/* 1. Category Icons Row (Horizontal Scroll) */}
        <CategoryIconRow categories={categories} />

        {/* 2. Offer Banner */}
        <OfferBanner slides={mobileBannerSlides} />

        {/* 3. Product Row: Trending Products */}
        <div className="bg-white my-1 py-1 shadow-2xs">
          <ProductSlider
            title="Trending Products"
            subtitle="Most viewed and favored by builders & homeowners"
            tag="Trending"
            products={trending}
            viewAllHref="/shop"
          />
        </div>

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
        <div className="bg-white my-1 py-1 shadow-2xs">
          <ProductSlider
            title="Bestselling Products"
            subtitle="Highest rated materials with proven quality"
            tag="Top Rated"
            products={bestsellers}
            viewAllHref="/shop"
          />
        </div>

        {/* 7. Product Row: New Arrivals */}
        <div className="bg-white my-1 py-1 shadow-2xs">
          <ProductSlider
            title="New Arrivals"
            subtitle="Fresh artisan patterns, zellige & marble textures"
            tag="New"
            products={newArrivals}
            viewAllHref="/shop"
          />
        </div>

        {/* Recently Viewed on Mobile */}
        <div className="px-2 my-1">
          <RecentlyViewedSlider />
        </div>



        {/* Mini Trust Badges on Mobile */}
        <div className="px-4 py-4 grid grid-cols-2 gap-2 text-[11px] text-[#052a51] font-bold">
          <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
            <ShieldCheck size={16} className="text-[#F26522] shrink-0" />
            <span>100% Quality Assured</span>
          </div>
          <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-100 shadow-2xs">
            <Award size={16} className="text-[#F26522] shrink-0" />
            <span>500+ Happy Spaces</span>
          </div>
        </div>

        {/* Brand SEO & FAQs Section for Mobile */}
        <IntrihubBrandSEOSection />

        {/* Mobile Footer */}
        <Footer />
      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEWPORT LAYOUT (Flipkart / Amazon Desktop Pattern) - >= md        */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-[#F8F9FA]" style={{ paddingTop: "168px" }}>
        {/* 1. Desktop Banner Carousel */}
        <DesktopBannerCarousel slides={desktopBannerSlides} />

        {/* 2. Continuous Auto-Scrolling Category Row (Desktop Only) */}
        <DesktopCategoryRow categories={categories} />

        {/* 3. Trending Products Row */}
        <DesktopProductRow
          title="Trending Products"
          badge="High Demand"
          subtitle="Top picked supplies, materials, and designer finishes for modern renovations"
          products={trending}
          viewAllHref="/shop"
        />

        {/* 4. Mid Promo Banner Strip */}
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-4">
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
              className="px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-md transition-all shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <span>Explore Catalog</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* 5. Bestselling Products Row */}
        <DesktopProductRow
          title="Bestselling Products"
          badge="Most Popular"
          subtitle="Consistently 5-star rated by 500+ verified builders & homeowners"
          products={bestsellers}
          viewAllHref="/shop"
        />

        {/* 6. New Arrivals Product Row */}
        <DesktopProductRow
          title="New Arrivals"
          badge="Fresh Stock"
          subtitle="Freshly added electricals, sanitaryware, hardware, and designer surfaces"
          products={newArrivals}
          viewAllHref="/shop"
        />



        {/* ── QUICK COMMERCE DISPATCH & SITE DELIVERY BANNER ──────────────── */}
        <section className="relative overflow-hidden py-12 md:py-16 bg-gradient-to-r from-[#031b34] via-[#052a51] to-[#08386a] border-y border-white/10 text-white">
          {/* Subtle Ambient Glow Orbs */}
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#F26522]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#2F7A4F]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-12">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="max-w-2xl space-y-4"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 text-[11px] font-black uppercase tracking-wider text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>⚡ Quick Commerce Express Site Delivery</span>
                </div>

                <h2 className="text-[26px] sm:text-[32px] md:text-[40px] font-black text-white leading-tight tracking-tight">
                  Need Materials Fast? <br className="hidden sm:inline" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26522] via-orange-300 to-amber-300">
                    Get Direct Site Delivery Within 60 Minutes
                  </span>
                </h2>

                <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-xl font-medium">
                  Order Tiles, Granite, Paints, Plywood & Hardware with real-time GPS tracking, verified wholesale rates, and guaranteed damage-free unloading directly at your project.
                </p>

                {/* Quick-Commerce Feature Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-bold text-white/90">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <span className="text-[#F26522] text-sm font-black">⚡</span>
                    <span>Within 60 Minutes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <span className="text-[#2F7A4F] text-sm font-black">✓</span>
                    <span>Free Above ₹15,000</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs col-span-2 sm:col-span-1">
                    <span className="text-amber-400 text-sm font-black">★</span>
                    <span>Wholesale Rates</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0"
              >
                <Link href="/shop" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto h-13 px-8 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm md:text-base rounded-2xl shadow-lg shadow-orange-500/25 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap">
                    <span>Order for Instant Dispatch</span>
                    <ArrowRight size={18} />
                  </button>
                </Link>

                <a
                  href="https://wa.me/919264920211?text=Hi%20Intrihub,%20I%20need%20urgent%20building%20materials%20delivery%20to%20my%20site."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <button className="w-full sm:w-auto h-12 px-6 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs md:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md">
                    <span>💬 WhatsApp Quick Order Desk</span>
                  </button>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Brand SEO & FAQs Section for Desktop */}
        <IntrihubBrandSEOSection />

        <Footer />
      </div>
    </main>
  );
}
