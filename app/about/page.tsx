"use client";

import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Truck, Sparkles, Award, ArrowRight, HeartHandshake } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      {/* Hero */}
      <div
        className="bg-[#052a51] text-white pt-[110px] md:pt-[168px] pb-16 md:pb-24"
      >
        <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] text-center">
          <span className="px-3.5 py-1.5 bg-[#F26522]/20 border border-[#F26522]/40 rounded-full text-[#F26522] text-xs font-bold uppercase tracking-wider inline-block mb-4">
            Our Story & Mission
          </span>
          <h1 className="text-[36px] sm:text-[46px] md:text-[56px] font-black leading-tight max-w-2xl mx-auto">
            Quality Tiles for <span className="text-[#F26522]">Strong Spaces</span>
          </h1>
          <p className="text-white/80 text-base md:text-lg mt-4 max-w-xl mx-auto leading-relaxed">
            Intrihub is on a mission to simplify interior & construction supply for Indian homeowners, architects, and builders. From high-grade vitrified floor tiles to electrical, plumbing, plywood, and granite, we deliver factory-fresh materials directly to your site.
          </p>
        </div>
      </div>

      {/* Story Content */}
      <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-14 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-8">
          {/* Story Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <p className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2">Why Intrihub</p>
              <h2 className="text-2xl sm:text-3xl font-black text-[#052a51] mb-4">
                Building materials shopping shouldn&apos;t be a headache.
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Traditional building material procurement involves multiple middlemen, unclear pricing, high transport breakages, and endless physical showroom trips.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                We started Intrihub in Bangalore to change that — transparent unit pricing, instant room coverage calculator, curated aesthetic designs, and safe freight delivery to your doorstep.
              </p>
            </div>
            <div className="relative aspect-4/3 rounded-3xl overflow-hidden shadow-lg bg-gray-100">
              <Image
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
                alt="Intrihub workspace"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Pillars */}
          <div>
            <h3 className="text-xl font-black text-[#052a51] text-center mb-8">What We Stand For</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Grade-1 Quality",
                  desc: "Zero compromise. Every batch undergoes strict curvature and strength quality tests.",
                },
                {
                  icon: Truck,
                  title: "Safe Pan-India Freight",
                  desc: "Specialized heavy goods packaging ensuring zero breakage in transit.",
                },
                {
                  icon: Sparkles,
                  title: "Curated Aesthetics",
                  desc: "Modern textures, Moroccan encaustic, Italian marble looks, and rustic stone.",
                },
                {
                  icon: HeartHandshake,
                  title: "Direct Support",
                  desc: "Our tile specialists help you estimate quantities and select the right finishes.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-bold text-[#052a51] text-base mb-2">{title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#052a51] text-white p-8 rounded-2xl text-center flex flex-col items-center">
            <h3 className="text-2xl font-black">Ready to build your dream space?</h3>
            <p className="text-white/70 text-sm mt-2 max-w-md">
              Browse 200+ premium designs and get them delivered to your home in 3–7 business days.
            </p>
            <Link href="/shop" className="mt-6">
              <button className="px-8 h-12 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center gap-2 shadow-md">
                Browse Shop Catalog <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
