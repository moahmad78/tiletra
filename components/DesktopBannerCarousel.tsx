"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Truck } from "lucide-react";

export interface BannerSlide {
  id: string;
  badge: string;
  headline: string;
  subtext: string;
  ctaText: string;
  ctaHref: string;
  image: string;
  accentColor?: string;
}

const DEFAULT_DESKTOP_SLIDES: BannerSlide[] = [
  {
    id: "slide-1",
    badge: "Special Seasonal Offer",
    headline: "Grand Italian Marble Floor Collection",
    subtext: "Mirror-polished seamless 800x800mm vitrified tiles starting at ₹72/sq.ft. Safe doorstep crate delivery.",
    ctaText: "Explore Floor Tiles",
    ctaHref: "/shop/floor-tiles",
    image: "/placeholders/banner.svg",
    accentColor: "#F26522",
  },
  {
    id: "slide-2",
    badge: "Kitchen Renovation Picks",
    headline: "Nordic Subway & Artisan Splashbacks",
    subtext: "Beveled glossy subway tiles and textured ceramic walls. Wipe-clean and heat resistant.",
    ctaText: "Shop Kitchen Tiles",
    ctaHref: "/shop/kitchen-tiles",
    image: "/placeholders/banner.svg",
    accentColor: "#052a51",
  },
  {
    id: "slide-3",
    badge: "Monsoon Proof & Heavy Duty",
    headline: "Outdoor Balcony & Patio Pavers",
    subtext: "R11 anti-slip textured porcelain pavers designed for heavy Bangalore rains and garden terraces.",
    ctaText: "Browse Outdoor Tiles",
    ctaHref: "/shop/outdoor-tiles",
    image: "/placeholders/banner.svg",
    accentColor: "#2F7A4F",
  },
  {
    id: "slide-4",
    badge: "Fast Freight Across Bangalore",
    headline: "Direct Factory Pricing. Zero Middlemen.",
    subtext: "Free specialized freight delivery on all orders above ₹15,000 with 100% breakage protection.",
    ctaText: "Explore Catalog",
    ctaHref: "/shop",
    image: "/placeholders/banner.svg",
    accentColor: "#F26522",
  },
];

export default function DesktopBannerCarousel({ slides }: { slides?: BannerSlide[] }) {
  const bannerSlides = slides && slides.length > 0 ? slides : DEFAULT_DESKTOP_SLIDES;
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, bannerSlides.length]);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? bannerSlides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % bannerSlides.length);
  };

  return (
    <div
      className="hidden md:block w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-4 pb-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative h-[320px] lg:h-[350px] rounded-3xl overflow-hidden shadow-sm border border-gray-100 bg-[#052a51]">
        {/* Slides Track */}
        {bannerSlides.map((slide, index) => {
          const isActive = index === current;
          const accent = slide.accentColor || "#F26522";
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
            >
              {/* Background Photo */}
              <Image
                src={slide.image || "/placeholders/banner.svg"}
                alt={slide.headline}
                fill
                priority={index === 0}
                fetchPriority={index === 0 ? "high" : "auto"}
                loading={index === 0 ? "eager" : "lazy"}
                className="object-cover"
                sizes="(max-width: 1400px) 100vw, 1400px"
              />

              {/* Gradient Scrim for Readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#052a51]/95 via-[#052a51]/75 to-transparent w-full md:w-[65%]" />

              {/* Slide Content */}
              <div className="relative z-20 h-full flex flex-col justify-center max-w-xl pl-8 lg:pl-12 pr-6 text-white">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-3 w-fit shadow-xs"
                  style={{ backgroundColor: `${accent}33`, color: "#FFF", border: `1px solid ${accent}88` }}
                >
                  <Sparkles size={13} className="text-[#F26522]" />
                  {slide.badge || "Special Offer"}
                </span>

                <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-sm">
                  {slide.headline}
                </h2>

                <p className="text-xs lg:text-sm text-gray-200 mt-2.5 leading-relaxed max-w-md font-medium">
                  {slide.subtext}
                </p>

                <div className="flex items-center gap-4 mt-6">
                  <Link
                    href={slide.ctaHref || "/shop"}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    <span>{slide.ctaText || "Shop Now"}</span>
                    <ArrowRight size={15} />
                  </Link>

                  <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/80 font-bold">
                    <Truck size={14} className="text-[#F26522]" />
                    <span>Doorstep Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Left Arrow Button */}
        <button
          onClick={prevSlide}
          aria-label="Previous Banner"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all hover:scale-110 shadow-md cursor-pointer"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={nextSlide}
          aria-label="Next Banner"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs flex items-center justify-center transition-all hover:scale-110 shadow-md cursor-pointer"
        >
          <ChevronRight size={22} />
        </button>

        {/* Dot Indicators (with accessible 24px+ touch targets) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-black/30 backdrop-blur-xs px-2 py-1 rounded-full">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to slide ${i + 1}`}
              className="p-1.5 flex items-center justify-center cursor-pointer group"
            >
              <span
                className={`h-2 rounded-full block transition-transform duration-300 ${
                  i === current ? "w-6 bg-[#F26522]" : "w-2 bg-white/60 group-hover:bg-white"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
