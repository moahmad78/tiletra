"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Truck, Package } from "lucide-react";

export interface MobileBannerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bgGradient: string;
  image: string;
}

const DEFAULT_SLIDES: MobileBannerSlide[] = [
  {
    id: "slide-1",
    badge: "Special Offer",
    title: "Flat 20% Off Vitrified Tiles",
    subtitle: "Premium Italian marble & concrete looks",
    cta: "Shop Now",
    href: "/shop/floor-tiles",
    bgGradient: "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
    image: "/placeholders/banner.svg",
  },
  {
    id: "slide-2",
    badge: "Zero Shipping Cost",
    title: "Free Delivery Above ₹15,000",
    subtitle: "Safe packaging & direct doorstep transit",
    cta: "Explore Catalog",
    href: "/shop",
    bgGradient: "from-[#0c3966]/95 via-[#052a51]/85 to-transparent",
    image: "/placeholders/banner.svg",
  },
  {
    id: "slide-3",
    badge: "Confidence First",
    title: "Order Material Samples",
    subtitle: "Check finish & quality in your space before buying",
    cta: "Get Samples",
    href: "/shop",
    bgGradient: "from-[#1a1c29]/95 via-[#052a51]/85 to-transparent",
    image: "/placeholders/banner.svg",
  },
  {
    id: "slide-vendor",
    badge: "Sell on Intrihub",
    title: "Become a Vendor Partner",
    subtitle: "Grow your shop, reach more customers across Bangalore",
    cta: "Apply as Seller",
    href: "/vendor/apply",
    bgGradient: "from-[#031d38]/95 via-[#052a51]/85 to-transparent",
    image: "/placeholders/banner.svg",
  },
];

export default function OfferBanner({ slides }: { slides?: MobileBannerSlide[] }) {
  const bannerSlides = slides && slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<any>(null);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerSlides.length);
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [bannerSlides.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      setCurrent((prev) => (prev + 1) % bannerSlides.length);
    } else if (isRightSwipe) {
      setCurrent((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  return (
    <div className="w-full px-3 py-2.5">
      <div
        className="relative h-[135px] sm:h-[145px] w-full rounded-2xl overflow-hidden shadow-xs border border-gray-100"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {bannerSlides.map((slide, index) => {
          const isActive = index === current;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <Link href={slide.href || "/shop"} className="block w-full h-full relative">
                {/* Background Image */}
                <Image
                  src={slide.image || "/placeholders/banner.svg"}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index === 0 ? "eager" : "lazy"}
                />

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient || "from-[#052a51]/95 via-[#052a51]/80 to-transparent"}`} />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-center px-4 max-w-[75%]">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F26522] text-white text-[9px] font-extrabold rounded-full w-fit mb-1 shadow-xs">
                    <Sparkles size={10} />
                    <span>{slide.badge || "Special Offer"}</span>
                  </div>

                  <h3 className="text-[15px] font-black text-white leading-tight tracking-tight drop-shadow-xs">
                    {slide.title}
                  </h3>

                  <p className="text-[11px] text-white/80 mt-0.5 line-clamp-1">
                    {slide.subtitle}
                  </p>

                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#F26522] bg-white/95 px-2.5 py-1 rounded-lg w-fit shadow-xs active:scale-95 transition-transform">
                    <span>{slide.cta || "Shop Now"}</span>
                    <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Dot Indicators (with accessible touch target) */}
        <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1 bg-black/30 backdrop-blur-xs px-1.5 py-0.5 rounded-full">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className="p-1 flex items-center justify-center cursor-pointer group"
            >
              <span
                className={`h-1.5 rounded-full block transition-transform duration-300 ${
                  i === current ? "w-4 bg-[#F26522]" : "w-1.5 bg-white/60 group-hover:bg-white"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
