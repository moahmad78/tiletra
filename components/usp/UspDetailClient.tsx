"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Building2,
  Truck,
  ShieldCheck,
  Zap,
  Home,
  Layers,
  ChevronRight,
} from "lucide-react";
import type { UspData } from "@/lib/data/usps";
import { USP_ITEMS } from "@/lib/data/usps";

interface UspDetailClientProps {
  usp: UspData;
}

export default function UspDetailClient({ usp }: UspDetailClientProps) {
  // Retrieve sibling USP data objects
  const siblingUsps = USP_ITEMS.filter((item) =>
    usp.siblingSlugs.includes(item.slug)
  );

  return (
    <div className="w-full bg-slate-50 min-h-screen text-slate-900 pb-16">
      {/* 1. Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="bg-white border-b border-slate-200 sticky top-[56px] md:top-[128px] z-20">
        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <ol className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-medium">
            <li>
              <Link href="/" className="hover:text-[#F26522] flex items-center gap-1">
                <Home size={13} />
                <span>Home</span>
              </Link>
            </li>
            <li>
              <ChevronRight size={12} className="text-slate-400" />
            </li>
            <li>
              <Link href="/why-intrihub" className="hover:text-[#F26522]">
                Why IntriHub
              </Link>
            </li>
            <li>
              <ChevronRight size={12} className="text-slate-400" />
            </li>
            <li className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">
              {usp.h1}
            </li>
          </ol>

          <Link
            href="/why-intrihub"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#F26522] hover:text-white text-slate-700 font-bold text-xs transition-all"
          >
            <ArrowLeft size={13} />
            <span>All 20 USPs Hub</span>
          </Link>
        </div>
      </nav>

      {/* 2. Hero Header Section */}
      <header className="relative bg-gradient-to-r from-[#031b34] via-[#052a51] to-[#08386a] text-white py-12 md:py-16 overflow-hidden border-b border-white/10">
        {/* Glow Accents */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F26522]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-black uppercase tracking-wider text-orange-300">
              <span>{usp.pillarEmoji}</span>
              <span>Pillar {usp.pillarId}: {usp.pillarName}</span>
              <span className="text-white/40">•</span>
              <span>USP #{usp.number}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15]">
              {usp.h1}
            </h1>

            <p className="text-base sm:text-xl font-medium text-slate-200 leading-relaxed">
              {usp.tagline}
            </p>

            {/* Primary Top CTA */}
            <div className="pt-3">
              <Link
                href="https://intrihub.com/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5 active:scale-95"
              >
                <span>Start Shopping on IntriHub</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Content Grid */}
      <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Article Body (8 cols) */}
          <article className="lg:col-span-8 space-y-8">
            {/* Executive Summary Card */}
            <section className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-[#F26522] uppercase tracking-wider">
                <Sparkles size={16} />
                <span>Executive Overview</span>
              </div>
              <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-normal">
                {usp.summary}
              </p>
            </section>

            {/* Concrete Real-World Scenario Showcase */}
            <section className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-orange-50/70 via-white to-amber-50/50 border border-orange-200 shadow-xs space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#F26522]/10 text-[#F26522] text-xs font-bold uppercase tracking-wide">
                <Building2 size={14} />
                <span>Concrete Implementation</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {usp.concreteScenario.title}
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                {usp.concreteScenario.scenario}
              </p>
            </section>

            {/* In-Depth Body Paragraphs */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-[#052a51]">
                Why This Advantage Matters for Your Project
              </h2>
              <div className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed font-normal">
                {usp.bodyParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </section>

            {/* Key Platform Benefits Checklist */}
            <section className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Key Strategic Takeaways
              </h2>
              <ul className="space-y-3">
                {usp.keyTakeaways.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Visible FAQs Section (Marked up with FAQPage JSON-LD) */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-black text-[#052a51] uppercase tracking-wider">
                  <HelpCircle size={16} className="text-[#F26522]" />
                  <span>Frequently Asked Questions</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                  Questions About {usp.h1}
                </h2>
              </div>

              <div className="space-y-4 pt-2">
                {usp.faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <h3 className="text-sm sm:text-base font-black text-[#052a51] flex items-start gap-2">
                      <span className="text-[#F26522] font-black">Q:</span>
                      <span>{faq.q}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-5">
                      <strong className="text-slate-800 font-semibold">A: </strong>
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Primary Action Card */}
            <section className="p-8 rounded-3xl bg-gradient-to-r from-[#031b34] to-[#052a51] text-white text-center space-y-4 shadow-xl border border-white/10">
              <span className="px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold uppercase tracking-wider inline-block">
                Ready to Experience Frictionless Procurement?
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                One Platform → Every Material → One Order → Direct to Site
              </h2>
              <p className="text-sm text-slate-300 max-w-xl mx-auto">
                Discover 10,000+ verified vitrified tiles, sanitary fixtures, electricals, and hardware with guaranteed 60-minute site delivery.
              </p>
              <div className="pt-2">
                <Link
                  href="https://intrihub.com/"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm md:text-base transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                  <span>Start Shopping on IntriHub</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </section>
          </article>

          {/* Right Sidebar: Pillar Context & Sibling Internal Links (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Hub Link Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <span className="text-xs font-black uppercase text-[#F26522] tracking-wider block">
                The Master Architecture
              </span>
              <h3 className="text-lg font-black text-slate-900">
                Explore All 20 USPs of IntriHub
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Learn how IntriHub unifies discovery, pricing transparency, and 60-minute site delivery for construction and interior materials.
              </p>
              <Link
                href="/why-intrihub"
                className="w-full px-4 py-2.5 rounded-xl bg-[#052a51] hover:bg-[#0b3b6d] text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
              >
                <span>View Full 20-USP Hub</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Sibling Pillar Pages (Internal Linking for Sitelinks & SEO Crawl Density) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                  Related Pillar Advantages
                </span>
                <span className="text-xs font-bold text-[#F26522]">
                  Pillar {usp.pillarId}
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Explore Sibling Solutions
              </h3>

              <div className="space-y-3">
                {siblingUsps.map((sibling) => (
                  <Link
                    key={sibling.slug}
                    href={`/${sibling.slug}`}
                    className="block p-3.5 rounded-2xl bg-slate-50 hover:bg-orange-50/70 border border-slate-200 hover:border-orange-300 transition-all group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#F26522] transition-colors">
                      <span>{sibling.h1}</span>
                      <ArrowRight size={13} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-[#F26522]" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {sibling.tagline}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Fast Facts Box */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-[#052a51] text-white shadow-xs space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-orange-400">
                Service Delivery Standard
              </span>
              <h4 className="text-base font-bold text-white">
                Express Logistics Across Bengaluru
              </h4>
              <ul className="text-xs text-slate-300 space-y-2 pt-1">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F26522]" />
                  <span>60-Minute average delivery time</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>0% transit breakage guarantee</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Free freight on orders above ₹15,000</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <span>100% compliant B2B GST invoices</span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
