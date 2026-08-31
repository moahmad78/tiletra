"use client";

import Link from "next/link";
import { HelpCircle, ArrowRight, Sparkles, MessageCircle, PhoneCall, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQ from "@/components/FAQ";

export default function FAQPage() {
  return (
    <main className="min-h-screen flex flex-col bg-neutral-50 font-sans">
      <Header />

      {/* Top Hero Banner in Brand Navy */}
      <section className="bg-gradient-to-b from-[#031c38] via-[#052a51] to-[#0a396b] text-white pt-[140px] md:pt-[175px] pb-12 sm:pb-16 border-b border-white/10 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F26522]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] relative z-10 text-center">
          {/* Breadcrumbs */}
          <nav className="flex items-center justify-center gap-1.5 text-xs text-white/70 mb-4">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-white/80">Support & Guidance</span>
            <ChevronRight size={12} />
            <span className="text-[#F26522] font-bold">Frequently Asked Questions</span>
          </nav>

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-[#F26522] text-xs font-black uppercase tracking-wider mb-4 border border-white/15">
            <Sparkles size={13} />
            <span>IntriHub Knowledge Center</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            Frequently Asked <span className="text-[#F26522]">Questions</span>
          </h1>

          <p className="text-white/80 text-xs sm:text-sm md:text-base mt-4 max-w-2xl mx-auto leading-relaxed font-medium">
            Everything you need to know about factory-direct procurement, 60-minute site delivery in Bengaluru, smart quantity estimations, and transit damage protection.
          </p>
        </div>
      </section>

      {/* Main FAQ Container */}
      <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-8 sm:py-12 flex-1">
        <FAQ />
      </div>

      <Footer />
    </main>
  );
}
