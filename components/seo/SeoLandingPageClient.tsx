"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  ChevronDown,
  MapPin,
  Phone,
  Truck,
  ShieldCheck,
  Clock,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  ExternalLink,
  Info,
  Sparkles,
  Layers,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/data/products";

export interface SeoLandingPageData {
  id: string;
  slug: string;
  pageType: "CATEGORY" | "SUBCATEGORY" | "LOCAL" | "PRICE_INTENT" | "TREND";
  category: string | null;
  locality: string | null;
  targetKeyword: string;
  title: string;
  metaDescription: string;
  h1: string;
  introContent: string;
  faqItems: Array<{ question: string; answer: string }> | null;
  updatedAt: string;
}

interface SeoLandingPageClientProps {
  pageData: SeoLandingPageData;
  products: Product[];
  siblingPages: Array<{ slug: string; targetKeyword: string; pageType: string }>;
  parentCategoryPage?: { slug: string; title: string } | null;
  subCategoryPages?: Array<{ slug: string; title: string; targetKeyword: string }>;
  priceGuidePages?: Array<{ slug: string; title: string; targetKeyword: string }>;
}

export default function SeoLandingPageClient({
  pageData,
  products,
  siblingPages,
  parentCategoryPage,
  subCategoryPages = [],
  priceGuidePages = [],
}: SeoLandingPageClientProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const getPageTypeBadge = (type: string) => {
    switch (type) {
      case "CATEGORY":
        return { label: "Catalog Category", color: "bg-blue-50 text-[#052a51] border-blue-200" };
      case "SUBCATEGORY":
        return { label: "Specialized Material", color: "bg-orange-50 text-[#F26522] border-orange-200" };
      case "LOCAL":
        return { label: "Bengaluru Site Delivery Hub", color: "bg-emerald-50 text-emerald-800 border-emerald-200" };
      case "PRICE_INTENT":
        return { label: "Live Sourcing Price Index", color: "bg-amber-50 text-amber-800 border-amber-200" };
      case "TREND":
        return { label: "Architectural & Interior Trend", color: "bg-purple-50 text-purple-800 border-purple-200" };
      default:
        return { label: "Material Sourcing", color: "bg-gray-50 text-gray-800 border-gray-200" };
    }
  };

  const badge = getPageTypeBadge(pageData.pageType);
  const formattedDate = new Date(pageData.updatedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-1 pt-[72px] md:pt-[130px] lg:pt-[140px]">
        {/* ── Breadcrumb Navigation ────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 py-3">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none">
              <Link href="/" className="hover:text-[#F26522] transition-colors font-medium">
                Home
              </Link>
              <ChevronRight size={13} className="text-slate-400 shrink-0" />
              {parentCategoryPage ? (
                <>
                  <Link
                    href={`/${parentCategoryPage.slug}`}
                    className="hover:text-[#F26522] transition-colors font-medium"
                  >
                    {parentCategoryPage.title.split("—")[0].trim()}
                  </Link>
                  <ChevronRight size={13} className="text-slate-400 shrink-0" />
                </>
              ) : (
                <>
                  <Link href="/shop" className="hover:text-[#F26522] transition-colors font-medium">
                    Catalog
                  </Link>
                  <ChevronRight size={13} className="text-slate-400 shrink-0" />
                </>
              )}
              <span className="text-slate-900 font-bold truncate max-w-[280px] sm:max-w-none">
                {pageData.targetKeyword}
              </span>
            </nav>
          </div>
        </div>

        {/* ── Hero Section ──────────────────────────────────────── */}
        <section className="bg-white border-b border-slate-200 py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              {/* Type Badge & Meta Tags */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
                >
                  <Sparkles size={13} />
                  {badge.label}
                </span>

                {pageData.locality && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <MapPin size={12} className="text-[#F26522]" />
                    {pageData.locality.toUpperCase()}, BENGALURU
                  </span>
                )}

                {pageData.pageType === "PRICE_INTENT" && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock size={12} />
                    Verified: {formattedDate}
                  </span>
                )}
              </div>

              {/* H1 Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4">
                {pageData.h1}
              </h1>

              {/* Subtitle / Meta Description */}
              <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mb-6 font-normal">
                {pageData.metaDescription}
              </p>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#products-section"
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 active:scale-95"
                >
                  <ShoppingBag size={16} />
                  <span>Browse In-Stock Materials</span>
                </a>
                <a
                  href={`https://wa.me/919264920211?text=${encodeURIComponent(
                    `Hello IntriHub, I am interested in sourcing ${pageData.targetKeyword} for my project.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm flex items-center gap-2 active:scale-95"
                >
                  <span>Chat on WhatsApp (+91 92649 20211)</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── Main Content Grid ─────────────────────────────────── */}
        <section className="py-8 md:py-12">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: 300+ Word Editorial Content + Products */}
              <div className="lg:col-span-8 space-y-10">
                {/* Editorial Content Card */}
                <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 pb-4 mb-5 border-b border-slate-100">
                    <Layers size={18} className="text-[#F26522]" />
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Material Specification & Sourcing Overview
                    </h2>
                  </div>

                  {/* Prose Content */}
                  <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-4">
                    {pageData.introContent.split("\n\n").map((para, idx) => (
                      <p key={idx} className="leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>

                  {/* Price Intent Disclaimer Block */}
                  {pageData.pageType === "PRICE_INTENT" && (
                    <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
                      <Info size={18} className="text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Real-Time Price & Quantity Note:</strong>
                        <p className="leading-relaxed text-amber-800">
                          Prices displayed in this index reflect prevailing Bangalore factory rates as of {formattedDate}. Final project rates fluctuate based on order volume, thickness/gauge specifications, and delivery site logistics. Live rates with applicable GST tax invoices are confirmed directly upon cart checkout.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Local Hub Dispatch Guarantee */}
                  {pageData.locality && (
                    <div className="mt-6 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 text-emerald-950 text-xs sm:text-sm flex items-start gap-3">
                      <Truck size={18} className="text-emerald-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">
                          Express Site Delivery to {pageData.locality.toUpperCase()}:
                        </strong>
                        <p className="leading-relaxed text-emerald-900">
                          IntriHub coordinates direct vehicle dispatch from our primary Central Supply Hub in Begur to construction and residential sites across {pageData.locality}. Palletized, zero-breakage transport guarantees that materials reach your supervisors on time.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live Filtered Products Listing */}
                <div id="products-section" className="scroll-mt-24 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        In-Stock Materials for {pageData.targetKeyword}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Live inventory directly sourced from certified manufacturers.
                      </p>
                    </div>
                    <Link
                      href="/shop"
                      className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
                    >
                      View All Catalog <ArrowRight size={12} />
                    </Link>
                  </div>

                  {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3 sm:gap-4">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                      <p className="text-slate-600 text-sm">
                        Specific customized SKUs for this selection are assembled on demand for turnkey projects.
                      </p>
                      <Link
                        href="/shop"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#052a51] text-white rounded-xl text-xs font-bold hover:bg-[#083b70] transition-colors"
                      >
                        Explore General Catalog
                      </Link>
                    </div>
                  )}
                </div>

                {/* Shop by Type / Subcategory Section (Task 3.4) */}
                {pageData.pageType === "CATEGORY" && subCategoryPages.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-[#F26522] uppercase tracking-wider">
                        Specialized Classifications
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        Shop by Type — {pageData.title.split("—")[0].trim()}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Browse dedicated sourcing guides and calibrated product specifications for every application.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pt-2">
                      {subCategoryPages.map((sub) => (
                        <Link
                          key={sub.slug}
                          href={`/${sub.slug}`}
                          className="p-4 rounded-xl border border-slate-200/80 hover:border-[#F26522] bg-slate-50/50 hover:bg-orange-50/20 transition-all duration-200 group flex flex-col justify-between"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#F26522] transition-colors">
                              {sub.title.split("—")[0].trim()}
                            </h3>
                            <ArrowRight
                              size={14}
                              className="text-slate-400 group-hover:text-[#F26522] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                            Explore verified {sub.targetKeyword} direct from certified manufacturers with express site dispatch.
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price Guides & Rate Estimators Widget (Task 3.5) */}
                {priceGuidePages.length > 0 && (
                  <div className="bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-500/10 rounded-2xl p-6 sm:p-8 border border-amber-200/80 space-y-4">
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={12} className="text-amber-600" />
                        Market Intelligence &amp; Cost Estimation
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        Price Guides &amp; Rate Estimators
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                        Real-time market rate breakdowns, per-unit costs, and bulk estimation guides for Bengaluru site projects.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {priceGuidePages.map((guide) => (
                        <Link
                          key={guide.slug}
                          href={`/${guide.slug}`}
                          className="p-4 rounded-xl bg-white border border-amber-200 shadow-2xs hover:shadow-sm hover:border-amber-400 transition-all duration-200 group flex items-center justify-between gap-3"
                        >
                          <div>
                            <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                              {guide.title.split("—")[0].trim()}
                            </h3>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              Live Bengaluru benchmark rates &amp; specs &rarr;
                            </span>
                          </div>
                          <ArrowRight
                            size={14}
                            className="text-amber-500 group-hover:translate-x-1 transition-transform shrink-0"
                          />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* FAQ Section */}
                {pageData.faqItems && pageData.faqItems.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        Frequently Asked Questions
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Helpful technical and procurement answers regarding {pageData.targetKeyword}.
                      </p>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {pageData.faqItems.map((faq, idx) => {
                        const isOpen = openFaqIndex === idx;
                        return (
                          <div key={idx} className="py-3.5">
                            <button
                              type="button"
                              onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                              className="w-full text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-[#F26522] transition-colors cursor-pointer"
                            >
                              <span>{faq.question}</span>
                              <ChevronDown
                                size={16}
                                className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                                  isOpen ? "rotate-180 text-[#F26522]" : ""
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed animate-in fade-in-50 duration-150">
                                {faq.answer}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Verified NAP, GBP Block, Internal Sibling Links */}
              <aside className="lg:col-span-4 space-y-6">
                {/* Verified Business NAP Card */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                    <ShieldCheck size={18} className="text-[#F26522]" />
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                      Verified Supplier Profile
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Official Entity
                      </span>
                      <strong className="text-slate-900 font-bold text-base">IntriHub</strong>
                      <p className="text-slate-500 text-xs">Building Materials Store & Interior Materials Supplier</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Headquarters & Hub
                      </span>
                      <p className="text-slate-800 font-medium">Begur, Bengaluru, Karnataka</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Direct Desk & Escalation
                      </span>
                      <a
                        href="tel:+919264920211"
                        className="text-[#052a51] hover:text-[#F26522] font-bold text-sm transition-colors block"
                      >
                        +91 92649 20211
                      </a>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Website URL
                      </span>
                      <Link
                        href="https://intrihub.com"
                        className="text-slate-600 hover:text-[#F26522] text-xs font-semibold"
                      >
                        https://intrihub.com
                      </Link>
                    </div>
                  </div>

                  <a
                    href="tel:+919264920211"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#052a51] hover:bg-[#0a3a6c] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors active:scale-95"
                  >
                    <Phone size={14} />
                    <span>Call Support (+91 92649 20211)</span>
                  </a>
                </div>

                {/* Sibling Related Pages (SEO Internal Equity Transfer) */}
                {siblingPages.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Related Sourcing Pages
                    </h3>
                    <ul className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {siblingPages.map((sibling) => (
                        <li key={sibling.slug} className="py-2.5">
                          <Link
                            href={`/${sibling.slug}`}
                            className="text-slate-800 hover:text-[#F26522] font-semibold flex items-center justify-between group transition-colors"
                          >
                            <span className="line-clamp-1">{sibling.targetKeyword}</span>
                            <ArrowRight
                              size={13}
                              className="text-slate-300 group-hover:text-[#F26522] shrink-0 ml-2 transition-colors"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Price Guides Sidebar Card */}
                {priceGuidePages.length > 0 && (
                  <div className="bg-white rounded-2xl p-6 border border-amber-200/80 shadow-2xs space-y-3">
                    <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-600" />
                      Price &amp; Rate Indices
                    </h3>
                    <ul className="divide-y divide-slate-100 text-xs sm:text-sm">
                      {priceGuidePages.map((guide) => (
                        <li key={guide.slug} className="py-2.5">
                          <Link
                            href={`/${guide.slug}`}
                            className="text-slate-800 hover:text-amber-700 font-semibold flex items-center justify-between group transition-colors"
                          >
                            <span className="line-clamp-1">{guide.targetKeyword}</span>
                            <ArrowRight
                              size={13}
                              className="text-slate-300 group-hover:text-amber-600 shrink-0 ml-2 transition-colors"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Parent Category Link */}
                {parentCategoryPage && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#052a51] text-white space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
                      Main Hub
                    </span>
                    <h4 className="font-bold text-sm text-white">
                      Explore Full {parentCategoryPage.title.split("—")[0].trim()} Collection
                    </h4>
                    <p className="text-xs text-white/70">
                      Access all verified finishes, dimensions, and commercial volume tiered quotes.
                    </p>
                    <Link
                      href={`/${parentCategoryPage.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-white transition-colors pt-1"
                    >
                      <span>Go to Parent Category</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
