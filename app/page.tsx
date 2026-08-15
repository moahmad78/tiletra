"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Star,
  Package,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  ShoppingCart,
  ShieldCheck,
  Award,
} from "lucide-react";
import { categories } from "@/lib/data/categories";
import {
  getBestsellers,
  getTrending,
  getNewArrivals,
  getLowestPrice,
  getLowestBoxPrice,
} from "@/lib/data/products";
import { useCartStore } from "@/lib/cart-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import Header from "@/components/Header";
import WhyChooseUs from "@/components/WhyChooseUs";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import MobileStickySearchBar from "@/components/MobileStickySearchBar";
import CategoryIconRow from "@/components/CategoryIconRow";
import OfferBanner from "@/components/OfferBanner";
import ProductSlider from "@/components/ProductSlider";
import RecentlyViewedSlider from "@/components/suggestions/RecentlyViewedSlider";
import DesktopBannerCarousel from "@/components/DesktopBannerCarousel";
import DesktopProductRow from "@/components/DesktopProductRow";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

// ── Counter animation ──────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      let start = 0;
      const step = Math.max(1, Math.floor(target / 40));
      const timer = setInterval(() => {
        start += step;
        if (start >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, 25);
      return () => clearInterval(timer);
    }
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

// ── Room inspiration data ──────────────────────────────────────────
const roomInspirations = [
  {
    title: "Master Bathroom",
    tag: "Onyx Black Marble",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    slug: "/product/onyx-black-marble-bathroom",
  },
  {
    title: "Modern Kitchen",
    tag: "White Metro Splashback",
    image: "https://images.unsplash.com/photo-1556909172-b6b6f3f0ecf6?w=800&q=80",
    slug: "/product/white-metro-splashback-kitchen",
  },
  {
    title: "Living Room",
    tag: "Calacatta Marble Effect",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
    slug: "/product/calacatta-marble-effect-floor",
  },
  {
    title: "Outdoor Patio",
    tag: "Slate Grey Porcelain",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
    slug: "/product/slate-grey-porcelain-patio-outdoor",
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const bestsellers = getBestsellers(8);
  const trending = getTrending(8);
  const newArrivals = getNewArrivals(8);

  const { toggleCart } = useCartStore();
  const totalBoxes = useCartStore((s) => s.getTotalBoxes());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [carouselStart, setCarouselStart] = useState(0);
  const visibleCount = 4;
  const canPrev = carouselStart > 0;
  const canNext = carouselStart + visibleCount < bestsellers.length;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-white">
      {/* ========================================================================= */}
      {/* MOBILE VIEWPORT LAYOUT (Flipkart / Amazon App Pattern) - < md breakpoint   */}
      {/* ========================================================================= */}
      <div className="md:hidden flex flex-col bg-[#F8F9FA] pb-10">
        {/* 0. Mobile Top Brand Bar */}
        <div className="bg-[#052a51] px-4 py-2.5 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/Tiletra/logo/web-logo.png"
              alt="Tiletra"
              className="h-[28px] w-auto object-contain brightness-0 invert"
            />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/90 active:scale-90 transition-transform"
            >
              <Heart size={20} />
              {mounted && wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            <button
              onClick={toggleCart}
              aria-label="Cart"
              className="relative w-8 h-8 rounded-full flex items-center justify-center text-white/90 active:scale-90 transition-transform"
            >
              <ShoppingCart size={20} />
              {mounted && totalBoxes > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center">
                  {totalBoxes > 9 ? "9+" : totalBoxes}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 1. Sticky Search Bar (Top) */}
        <MobileStickySearchBar />

        {/* 2. Category Icons Row (Horizontal Scroll) */}
        <CategoryIconRow />

        {/* 3. Offer Banner (Thin Carousel, Replaces Big Hero) */}
        <OfferBanner />

        {/* 4. Product Row: Trending Tiles */}
        <div className="bg-white my-1 py-1 shadow-2xs">
          <ProductSlider
            title="Trending Tiles"
            subtitle="Most viewed and favored by homeowners"
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
                    Safe box transit · 3–7 Days Pan-India Delivery
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
            title="Bestselling Tiles"
            subtitle="Highest rated designs with proven durability"
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

        {/* 8. Room Inspiration (Horizontal Slider for Mobile) */}
        <section className="bg-white my-1 py-3 px-4 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-[16px] font-black text-[#052a51] tracking-tight">
                Room Inspiration
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">See tiles installed in real spaces</p>
            </div>
            <Link
              href="/inspiration"
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
        <Header />

        {/* 1. Desktop Banner Carousel (~320-350px, replaces full-viewport Hero) */}
        <DesktopBannerCarousel />

        {/* 2. Category Shortcuts Grid (6 Columns) */}
        <section id="categories" className="py-6">
          <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
            <div className="grid grid-cols-6 gap-3.5">
              {categories.map((cat) => (
                <Link key={cat.id} href={`/shop/${cat.slug}`}>
                  <div className="group bg-white rounded-2xl p-3 border border-gray-200/80 shadow-2xs hover:shadow-xs hover:border-[#F26522] transition-all text-center flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden mb-2 bg-gray-100 border border-gray-100">
                      <Image
                        src={cat.image}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="64px"
                      />
                    </div>
                    <p className="text-xs font-bold text-[#052a51] group-hover:text-[#F26522] transition-colors leading-tight">
                      {cat.name}
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium mt-0.5">
                      {cat.productCount} Designs
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Trending Tiles Product Row (Carousel with Arrows) */}
        <DesktopProductRow
          title="Trending Tiles"
          badge="High Demand"
          subtitle="Top picked vitrified & glossy subway finishes for home renovations"
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
                  Free Freight Delivery on Tile Orders Above ₹15,000
                </h3>
                <p className="text-xs text-white/70">
                  Specialized padded crate packaging ensuring zero tile breakages in transit.
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

        {/* 5. Bestselling Tiles Product Row (Carousel with Arrows) */}
        <DesktopProductRow
          title="Bestselling Tiles"
          badge="Most Popular"
          subtitle="Consistently 5-star rated by 500+ Bangalore homeowners"
          products={bestsellers}
          viewAllHref="/shop"
        />

        {/* 6. New Arrivals Product Row (Carousel with Arrows) */}
        <DesktopProductRow
          title="New Arrivals"
          badge="Fresh Stock"
          subtitle="Freshly manufactured designer Italian marble and stone textures"
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
                See how our tiles look in real spaces — click any photo to shop the look
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

        {/* ── WHY CHOOSE US ────────────────────────────────────────── */}
        <WhyChooseUs />

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
                  <button className="h-14 px-8 bg-[#F26522] text-white font-bold text-base rounded-2xl hover:bg-[#d95a1e] transition-all hover:-translate-y-1 hover:shadow-xl whitespace-nowrap flex items-center gap-2">
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
