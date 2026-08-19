"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Eye,
  SlidersHorizontal,
} from "lucide-react";

type RoomInspirationItem = {
  id: string;
  title: string;
  roomType: "living-room" | "bathroom" | "kitchen" | "outdoor" | "feature-wall";
  roomLabel: string;
  image: string;
  description: string;
  featuredProduct: {
    name: string;
    slug: string;
    material: string;
    size: string;
    finish: string;
    ratePerSqft: number;
    pricePerBox: number;
    thumbnail: string;
  };
};

const INSPIRATION_ITEMS: RoomInspirationItem[] = [
  {
    id: "look-1",
    title: "Italian Marble Living Room",
    roomType: "living-room",
    roomLabel: "Living Room",
    image: "/placeholders/product.svg",
    description: "Expansive light-filled living area featuring high-gloss seamless vitrified marble flooring.",
    featuredProduct: {
      name: "Calacatta Marble Effect",
      slug: "calacatta-marble-effect-floor",
      material: "Vitrified",
      size: "800x800mm",
      finish: "Polished",
      ratePerSqft: 72,
      pricePerBox: 3200,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-2",
    title: "Hotel-Style Onyx Bathroom",
    roomType: "bathroom",
    roomLabel: "Bathroom",
    image: "/placeholders/product.svg",
    description: "Moody, ultra-luxe master ensuite with full-height black onyx marble wall tiles.",
    featuredProduct: {
      name: "Onyx Black Marble",
      slug: "onyx-black-marble-bathroom",
      material: "Porcelain",
      size: "600x600mm",
      finish: "Matte",
      ratePerSqft: 95,
      pricePerBox: 3800,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-3",
    title: "Nordic White Subway Kitchen",
    roomType: "kitchen",
    roomLabel: "Kitchen",
    image: "/placeholders/product.svg",
    description: "Clean Scandinavian kitchen splashback with beveled glossy white subway brick tiles.",
    featuredProduct: {
      name: "Arctic White Subway",
      slug: "arctic-white-subway-wall",
      material: "Ceramic",
      size: "300x150mm",
      finish: "Glossy",
      ratePerSqft: 32,
      pricePerBox: 950,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-4",
    title: "Mediterranean Courtyard Patio",
    roomType: "outdoor",
    roomLabel: "Outdoor",
    image: "/placeholders/product.svg",
    description: "Slip-resistant heavy-duty outdoor pavers for open terraces and balcony gardens.",
    featuredProduct: {
      name: "Slate Grey Porcelain",
      slug: "slate-grey-porcelain-patio-outdoor",
      material: "Porcelain",
      size: "600x600mm",
      finish: "Textured",
      ratePerSqft: 70,
      pricePerBox: 2800,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-5",
    title: "Urban Industrial Loft Flooring",
    roomType: "living-room",
    roomLabel: "Living Room",
    image: "/placeholders/product.svg",
    description: "Raw cement-look matte tiles delivering seamless contemporary minimalism.",
    featuredProduct: {
      name: "Concrete Grey Industrial",
      slug: "concrete-grey-industrial-floor",
      material: "Vitrified",
      size: "600x600mm",
      finish: "Matte",
      ratePerSqft: 45,
      pricePerBox: 1800,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-6",
    title: "Emerald Green Feature Wall",
    roomType: "bathroom",
    roomLabel: "Bathroom",
    image: "/placeholders/product.svg",
    description: "Rich jewel-toned subway tiles stacked vertically in a modern walk-in shower.",
    featuredProduct: {
      name: "Emerald Green Subway",
      slug: "emerald-green-subway-wall",
      material: "Ceramic",
      size: "300x100mm",
      finish: "Glossy",
      ratePerSqft: 38,
      pricePerBox: 1150,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-7",
    title: "Artisan Moroccan Splashback",
    roomType: "kitchen",
    roomLabel: "Kitchen",
    image: "/placeholders/product.svg",
    description: "Intricate geometric ceramic tiles adding warmth and bespoke character behind the hob.",
    featuredProduct: {
      name: "Moroccan Heritage Pattern",
      slug: "moroccan-heritage-pattern-kitchen",
      material: "Ceramic",
      size: "300x300mm",
      finish: "Satin",
      ratePerSqft: 52,
      pricePerBox: 1550,
      thumbnail: "/placeholders/product.svg",
    },
  },
  {
    id: "look-8",
    title: "Sunlit Terracotta Balcony",
    roomType: "outdoor",
    roomLabel: "Outdoor",
    image: "/placeholders/product.svg",
    description: "Earthy natural stone finish outdoor tiles resistant to monsoon rain and UV exposure.",
    featuredProduct: {
      name: "Sandstone Beige Outdoor",
      slug: "sandstone-beige-outdoor-paver",
      material: "Natural Stone",
      size: "400x400mm",
      finish: "Textured",
      ratePerSqft: 65,
      pricePerBox: 2200,
      thumbnail: "/placeholders/product.svg",
    },
  },
];

const ROOM_TABS = [
  { label: "All Spaces", value: "all" },
  { label: "Living Room", value: "living-room" },
  { label: "Bathroom", value: "bathroom" },
  { label: "Kitchen", value: "kitchen" },
  { label: "Outdoor", value: "outdoor" },
];

export default function InspirationGalleryClient() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredItems = INSPIRATION_ITEMS.filter((item) =>
    activeTab === "all" ? true : item.roomType === activeTab
  );

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Filter Tabs Bar */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ROOM_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.value
                ? "bg-[#052a51] text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl overflow-hidden border border-gray-200/80 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
          >
            {/* Room Photo */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Room Tag Badge */}
              <span className="absolute top-3.5 left-3.5 px-3 py-1 bg-[#052a51]/80 backdrop-blur-md text-white text-[11px] font-black rounded-full uppercase tracking-wider">
                {item.roomLabel}
              </span>

              {/* Title on Photo */}
              <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white">
                <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-sm">
                  {item.title}
                </h3>
                <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-medium">
                  {item.description}
                </p>
              </div>
            </div>

            {/* "Shop This Look" Product Card Bar */}
            <div className="p-4 bg-white border-t border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522] block mb-2">
                Featured Tile in this Room
              </span>

              <Link
                href={`/product/${item.featuredProduct.slug}`}
                className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 hover:bg-[#F26522]/5 border border-gray-200 rounded-2xl transition-all group/link"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
                    <Image
                      src={item.featuredProduct.thumbnail}
                      alt={item.featuredProduct.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-[#052a51] truncate group-hover/link:text-[#F26522] transition-colors">
                      {item.featuredProduct.name}
                    </h4>
                    <p className="text-[10px] text-gray-500">
                      {item.featuredProduct.size} · {item.featuredProduct.finish}
                    </p>
                    <p className="text-xs font-black text-[#F26522] mt-0.5">
                      ₹{item.featuredProduct.ratePerSqft}
                      <span className="text-[10px] text-gray-400 font-normal">/sqft</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 w-8 h-8 rounded-xl bg-[#052a51] group-hover/link:bg-[#F26522] text-white flex items-center justify-center transition-colors shadow-xs">
                  <ArrowRight size={14} />
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA Box */}
      <div className="mt-12 bg-gradient-to-r from-[#052a51] to-[#0c3c6d] rounded-3xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div>
          <span className="text-xs font-bold text-[#F26522] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
            Need design advice?
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black mt-2">
            Calculate your room's tile requirement
          </h2>
          <p className="text-xs sm:text-sm text-white/80 mt-1 max-w-xl">
            Every Intrihub product page includes a built-in Tile Calculator with automatic 10% wastage buffer.
            Enter your square footage and get instant box counts!
          </p>
        </div>

        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-sm font-bold rounded-2xl shadow-lg active:scale-95 transition-all shrink-0"
        >
          <span>Explore All 200+ Designs</span>
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
