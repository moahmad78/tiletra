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

const roomInspirations = [
  {
    title: "Master Bathroom",
    tag: "Onyx Black Marble",
    image: "/placeholders/product.svg",
    slug: "/shop/bathroom-tiles",
  },
  {
    title: "Modern Kitchen",
    tag: "White Metro Splashback",
    image: "/placeholders/product.svg",
    slug: "/shop/kitchen-tiles",
  },
  {
    title: "Living Room",
    tag: "Calacatta Marble Effect",
    image: "/placeholders/product.svg",
    slug: "/shop/floor-tiles",
  },
  {
    title: "Outdoor Patio",
    tag: "Slate Grey Porcelain",
    image: "/placeholders/product.svg",
    slug: "/shop/outdoor-tiles",
  },
];

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
                    Safe transit · 3–7 Days Pan-India Delivery
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

        {/* 8. Room Inspiration */}
        <section className="bg-white my-1 py-3 px-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[16px] font-black text-[#052a51] tracking-tight">
                Room Inspiration
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">See materials & finishes in real spaces</p>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold text-[#F26522] flex items-center gap-0.5"
            >
              All Looks <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pt-1 pb-2 scrollbar-none">
            {roomInspirations.map((room) => (
              <Link
                key={room.title}
                href={room.slug}
                className="w-[200px] shrink-0 snap-start rounded-2xl overflow-hidden relative shadow-xs group"
                style={{ height: "140px" }}
              >
                <Image
                  src={room.image}
                  alt={room.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-2 left-2.5 right-2.5 text-white">
                  <p className="text-xs font-bold leading-tight drop-shadow-xs">{room.title}</p>
                  <p className="text-[10px] text-[#F26522] font-semibold mt-0.5 truncate">
                    {room.tag}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

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

        {/* ── ROOM INSPIRATION ─────────────────────────────────────── */}
        <section className="py-20 bg-[#F3F4F5]">
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <p className="text-sm font-bold text-[#F26522] uppercase tracking-[3px] mb-3">
                Real Homes
              </p>
              <h2 className="text-[36px] md:text-[44px] font-black text-[#052a51] leading-tight">
                Room <span className="text-[#F26522]">Inspiration</span>
              </h2>
              <p className="text-gray-500 mt-3 max-w-md mx-auto">
                See how our materials and finishes look in real spaces — click any photo to shop the look
              </p>
            </motion.div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {roomInspirations.map((room, i) => (
                <motion.div
                  key={room.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link href={room.slug}>
                    <div
                      className="group relative rounded-2xl overflow-hidden cursor-pointer"
                      style={{ height: i % 2 === 0 ? "320px" : "260px" }}
                    >
                      <Image
                        src={room.image}
                        alt={room.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <p className="text-sm font-bold">{room.title}</p>
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[11px] text-white/80">Shop: {room.tag}</span>
                          <ArrowRight size={11} className="text-[#F26522]" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SAMPLE CTA BANNER ────────────────────────────────────── */}
        <section className="py-16 bg-[#052a51]">
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <p className="text-sm font-bold text-[#F26522] uppercase tracking-[3px] mb-2">
                  Not sure yet?
                </p>
                <h2 className="text-[28px] md:text-[36px] font-black text-white leading-tight">
                  Order a free sample first
                </h2>
                <p className="text-white/70 mt-2 max-w-md">
                  Get a tile sample delivered to your home before you commit. Touch it, see it in your light, and order with confidence.
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <Link href="/shop">
                  <button className="h-14 px-8 bg-[#F26522] text-white font-bold text-base rounded-2xl hover:bg-[#d95a1e] transition-all hover:-translate-y-1 hover:shadow-xl whitespace-nowrap flex items-center gap-2 cursor-pointer">
                    Request a Sample <ArrowRight size={18} />
                  </button>
                </Link>
              </motion.div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </main>
  );
}
