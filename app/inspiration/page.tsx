import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import InspirationGalleryClient from "./InspirationGalleryClient";

export const metadata: Metadata = {
  title: "Room Inspiration & Interior Design Gallery | Intrihub",
  description:
    "Explore real room transformations with Intrihub materials. Browse living room floors, luxury marble bathrooms, modern kitchen splashbacks, and outdoor patios — and shop each look directly.",
  openGraph: {
    title: "Room Inspiration Gallery | Intrihub",
    description: "Browse curated interior and construction looks across real living rooms, kitchens, bathrooms, and commercial spaces.",
  },
};

export default function InspirationPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 md:px-8 pt-[110px] md:pt-[168px] pb-10">
        {/* Page Header */}
        <div className="mb-6 md:mb-10 text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-[#F26522] uppercase tracking-[3px] bg-[#F26522]/10 px-3 py-1 rounded-full">
            Real Spaces · Shop the Look
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-[#052a51] tracking-tight mt-3">
            Room <span className="text-[#F26522]">Inspiration</span> Gallery
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
            See how premium vitrified, ceramic, and porcelain tiles transform real interiors.
            Tap any room photo to explore the tiles used and estimate your square footage.
          </p>
        </div>

        {/* Client Gallery with Tabs & Interactive Shop-the-Look */}
        <InspirationGalleryClient />
      </main>

      <Footer />
    </div>
  );
}
