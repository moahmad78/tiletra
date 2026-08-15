"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Sparkles, ArrowRight, Truck, Package } from "lucide-react";

interface BannerSlide {
  id: string;
  badge: string;
  badgeIcon: typeof Sparkles;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  bgGradient: string;
  image: string;
}

const slides: BannerSlide[] = [
  {
    id: "slide-1",
    badge: "Special Offer",
    badgeIcon: Sparkles,
    title: "Flat 20% Off Vitrified Tiles",
    subtitle: "Premium Italian marble & concrete looks",
    cta: "Shop Now",
    href: "/shop/floor-tiles",
    bgGradient: "from-[#052a51]/95 via-[#052a51]/80 to-transparent",
    image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
  },
  {
    id: "slide-2",
    badge: "Zero Shipping Cost",
    badgeIcon: Truck,
    title: "Free Delivery Above ₹15,000",
    subtitle: "Safe box packing & direct doorstep transit",
    cta: "Explore Tiles",
    href: "/shop",
    bgGradient: "from-[#0c3966]/95 via-[#052a51]/85 to-transparent",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
  {
    id: "slide-3",
    badge: "Confidence First",
    badgeIcon: Package,
    title: "Order a Tile Sample Box",
    subtitle: "Check finish & light in your home before buying",
    cta: "Get Samples",
    href: "/shop",
    bgGradient: "from-[#1a1c29]/95 via-[#052a51]/85 to-transparent",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
  },
];

export default function OfferBanner() {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

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
      setCurrent((prev) => (prev + 1) % slides.length);
    } else if (isRightSwipe) {
      setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
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
        {slides.map((slide, index) => {
          const isActive = index === current;
          const BadgeIcon = slide.badgeIcon;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                isActive ? "opacity-100 pointer-events-auto z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              <Link href={slide.href} className="block w-full h-full relative">
                {/* Background Image */}
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                />

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.bgGradient}`} />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-center px-4 max-w-[75%]">
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F26522] text-white text-[9px] font-extrabold rounded-full w-fit mb-1 shadow-xs">
                    <BadgeIcon size={10} />
                    <span>{slide.badge}</span>
                  </div>

                  <h3 className="text-[15px] font-black text-white leading-tight tracking-tight drop-shadow-xs">
                    {slide.title}
                  </h3>

                  <p className="text-[11px] text-white/80 mt-0.5 line-clamp-1">
                    {slide.subtitle}
                  </p>

                  <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#F26522] bg-white/95 px-2.5 py-1 rounded-lg w-fit shadow-xs active:scale-95 transition-transform">
                    <span>{slide.cta}</span>
                    <ArrowRight size={11} />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}

        {/* Dot Indicators */}
        <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-4 bg-[#F26522]" : "w-1.5 bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
