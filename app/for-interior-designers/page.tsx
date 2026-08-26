import { Metadata } from "next";
import Link from "next/link";
import { Sparkles, Palette, Layers, Truck, ArrowRight, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Material Sourcing for Interior Designers & Studios | Intrihub",
  description:
    "Curated interior material sourcing for design studios: luxury vitrified tiles, designer bath fittings, lighting, textures, and bespoke stone surfaces with trade discounts.",
  alternates: {
    canonical: getCanonicalUrl("/for-interior-designers"),
  },
  openGraph: {
    title: "Material Sourcing for Interior Designers & Studios | Intrihub",
    description:
      "Curated interior material sourcing for design studios with trade discounts, sample deliveries, and fast site procurement.",
    url: getCanonicalUrl("/for-interior-designers"),
    type: "website",
    siteName: "Intrihub",
  },
};

export default function ForInteriorDesignersPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "For Interior Designers", url: "/for-interior-designers" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbsSchema) }}
      />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Hero Banner */}
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#052A51] text-white rounded-3xl p-8 sm:p-12 md:p-16 mb-12 shadow-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#FF9900] text-xs font-bold uppercase tracking-wider mb-6">
                <Palette size={15} />
                Interior Design Studio Trade Program
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Curated Material Sourcing for Modern Interior Designers
              </h1>
              <p className="text-white/80 text-base sm:text-lg mt-4 leading-relaxed">
                Elevate your residential and commercial projects with trend-forward surfaces, Italian-inspired tile aesthetics, matte black sanitaryware, and verified trade pricing.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="px-6 py-3.5 bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                >
                  Explore Designer Collections
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20"
                >
                  Join Trade Program
                </Link>
              </div>
            </div>
          </div>

          {/* Designer Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Sparkles size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Trend-Forward Aesthetics</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Discover marble bookmatches, fluted wall tiles, terrazzo patterns, and satin-touch vitrified finishes designed for contemporary Indian homes.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#052A51] flex items-center justify-center mb-5">
                <Layers size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Complete Mood Board Sourcing</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Consolidate flooring, wall panels, designer bathroom fixtures, and architectural lighting under a single verified purchase order.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Truck size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">White-Glove Site Delivery</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Carefully packaged, palletized shipments delivered on time to your client’s apartment or villa with zero hassle.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
