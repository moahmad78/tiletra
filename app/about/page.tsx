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
            Tiletra is on a mission to simplify tile shopping for Indian homeowners. From high-grade vitrified floor tiles to designer wall mosaics, we deliver factory-fresh tiles directly to your home.
          </p>
        </div>
      </div>

      {/* Story Content */}
      <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-14 flex-1">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <p className="text-xs font-bold text-[#F26522] uppercase tracking-wider mb-2">Why Tiletra</p>
              <h2 className="text-2xl md:text-3xl font-black text-[#052a51] leading-tight">
                No middlemen, no confusing dealer rates. Just honest tiles.
              </h2>
              <p className="text-gray-600 text-sm md:text-base mt-4 leading-relaxed">
                Traditional tile buying involves visiting dusty wholesale markets, guessing how many boxes you need, and dealing with broken boxes and hidden delivery charges.
              </p>
              <p className="text-gray-600 text-sm md:text-base mt-3 leading-relaxed">
                We started Tiletra in Bangalore to change that — transparent box and sq.ft pricing, instant room coverage calculator, curated aesthetic designs, and safe freight delivery to your doorstep.
              </p>
            </div>

            <div className="relative h-[320px] md:h-[380px] rounded-2xl overflow-hidden shadow-md">
              <Image
                src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80"
                alt="Tiletra workspace"
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
