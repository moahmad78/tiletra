"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Truck,
  ShieldCheck,
  Building2,
  Calculator,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
} from "lucide-react";

const BRAND_FAQS = [
  {
    q: "What is Intrihub?",
    a: "Intrihub (IntriHub) is India's premier instant building and interior materials marketplace. Intrihub connects homeowners, architects, interior designers, and contractors directly to certified manufacturing hubs, providing wholesale pricing on tiles, granite, electrical wires, sanitaryware, false ceilings, and hardware with 60-minute site delivery in Bengaluru and pan-India dispatch.",
  },
  {
    q: "How does Intrihub deliver building materials within 60 minutes?",
    a: "Intrihub operates a specialized quick-commerce network with micro-dark stores and direct tier-1 manufacturer hubs across Bengaluru. Once you place an order on Intrihub, our automated dispatch system assigns the nearest delivery fleet with live GPS tracking directly to your construction or renovation site.",
  },
  {
    q: "What product categories are available on Intrihub?",
    a: "Intrihub features over 20+ certified categories including Vitrified Floor & Wall Tiles, Natural Granite Slabs, Modular Switches & Electrical Wires, CPVC Plumbing & Sanitaryware, Designer Wallpapers, Waterproof Plywood, False Ceiling Materials, and Architectural Hardware.",
  },
  {
    q: "How does the Intrihub Smart Calculator help save costs?",
    a: "Intrihub includes a built-in, unit-aware smart calculator on product pages. By simply entering your room dimensions (sq.ft or meters), Intrihub calculates exact box counts, tile pieces, and coil lengths including standard cutting buffers (+10%), preventing over-purchasing and material wastage.",
  },
  {
    q: "Who is the founder of Intrihub?",
    a: "Intrihub was founded by Sahil Sheikh to streamline, digitize, and modernize the building material procurement supply chain across India, providing transparent wholesale rates and rapid site delivery.",
  },
  {
    q: "How can I contact Intrihub for bulk project discounts?",
    a: "You can contact Intrihub directly via phone or WhatsApp at +91 92649 20211, or email support@intrihub.com. Intrihub provides dedicated relationship managers and custom GST invoicing for large residential and commercial projects.",
  },
];

export default function IntrihubBrandSEOSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="bg-white py-12 md:py-16 border-t border-gray-100 text-gray-900">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ── 1. Main Brand Headline & Narrative ── */}
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#052a51]/5 border border-[#052a51]/10 text-xs font-black uppercase tracking-wider text-[#052a51]">
            <Sparkles size={14} className="text-[#F26522]" />
            <span>Intrihub • India's Building & Interior Marketplace</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#052a51] tracking-tight leading-tight">
            Why Thousands of Builders, Designers & Homeowners Trust{" "}
            <span className="text-[#F26522]">Intrihub</span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-gray-600 leading-relaxed font-medium">
            <strong>Intrihub</strong> is India&apos;s complete quick-commerce ecosystem for interior finishes and construction supplies. From foundation to final fixtures, Intrihub delivers factory-direct vitrified tiles, granite, electrical wires, sanitaryware, and hardware directly to your site within 60 minutes across Bengaluru and Pan-India.
          </p>
        </div>

        {/* ── 2. Brand Pillars Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/70 space-y-3 hover:border-[#F26522]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shadow-xs">
              <Building2 size={20} className="text-[#F26522]" />
            </div>
            <h3 className="text-sm font-black text-[#052a51]">Factory-Direct Intrihub Pricing</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Intrihub bypasses multi-tier middleman margins to provide wholesale factory rates on 20,000+ certified interior products.
            </p>
          </div>

          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/70 space-y-3 hover:border-[#F26522]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shadow-xs">
              <Truck size={20} className="text-[#F26522]" />
            </div>
            <h3 className="text-sm font-black text-[#052a51]">60-Minute Site Dispatch</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Never halt on-site work. Intrihub delivers critical materials directly to your doorstep or site with real-time GPS tracking.
            </p>
          </div>

          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/70 space-y-3 hover:border-[#F26522]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shadow-xs">
              <Calculator size={20} className="text-[#F26522]" />
            </div>
            <h3 className="text-sm font-black text-[#052a51]">Intrihub Smart Calculator</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Calculate exact box counts, tile pieces, and wire lengths automatically with +10% standard cutting buffer to prevent waste.
            </p>
          </div>

          <div className="bg-gray-50/80 p-5 rounded-2xl border border-gray-200/70 space-y-3 hover:border-[#F26522]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#052a51] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={20} className="text-[#F26522]" />
            </div>
            <h3 className="text-sm font-black text-[#052a51]">100% Genuine Intrihub Guarantee</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Every item on Intrihub is quality-inspected, backed by standard manufacturer warranties, and safely transit-packed.
            </p>
          </div>
        </div>

        {/* ── 3. Brand FAQ Accordion (Google Search Rich Snippets) ── */}
        <div className="max-w-4xl mx-auto space-y-4 pt-4">
          <div className="text-center space-y-1 pb-2">
            <h3 className="text-lg sm:text-xl font-black text-[#052a51]">
              Frequently Asked Questions About Intrihub
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Everything you need to know about ordering on Intrihub
            </p>
          </div>

          <div className="space-y-2.5">
            {BRAND_FAQS.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-gray-200/80 bg-white overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left gap-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-bold text-[#052a51]">
                      {faq.q}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-[#F26522] shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── 4. Bottom Brand CTA Strip ── */}
        <div className="bg-gradient-to-r from-[#052a51] via-[#073666] to-[#052a51] rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-md border border-white/10">
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="text-base sm:text-lg font-black text-white">
              Ready to Upgrade Your Space with Intrihub?
            </h4>
            <p className="text-xs text-white/80 max-w-xl font-medium">
              Browse 20+ categories on Intrihub or get immediate architectural consultation & bulk quotation via WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore Intrihub Catalog</span>
              <ArrowRight size={14} />
            </Link>

            <a
              href="https://wa.me/919264920211?text=Hi%20Intrihub,%20I%20want%20to%20know%20more%20about%20your%20products."
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneCall size={13} className="text-emerald-400" />
              <span>Talk to Intrihub Expert</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
