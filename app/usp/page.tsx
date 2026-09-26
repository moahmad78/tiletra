import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Home, Sparkles, ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import USPSection from "@/components/USPSection";
import JsonLd from "@/components/JsonLd";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";

const canonicalUrl = getCanonicalUrl("/usp");

export const metadata: Metadata = {
  title: "Top 20 USPs — One Platform → Every Material → One Order → Direct to Site | IntriHub",
  description:
    "Explore the top 20 Unique Selling Propositions (USPs) of IntriHub. One platform for complete construction and interior procurement — from material discovery to 60-minute site delivery.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "IntriHub Top 20 USPs — One Platform for Complete Site Procurement",
    description:
      "One Platform → Every Material → One Order → Direct to Site. Discover the 20 reasons why builders, contractors, and homeowners choose IntriHub.",
    url: canonicalUrl,
    type: "website",
    siteName: "IntriHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "IntriHub Top 20 USPs — Direct to Site Building Materials",
    description:
      "One Platform → Every Material → One Order → Direct to Site. Fast 60-minute delivery across Bengaluru.",
  },
};

const breadcrumbsSchema = generateBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Top 20 USPs", url: "/usp" },
]);

export default function USPPage() {
  return (
    <div className="min-h-screen bg-neutral-50 text-slate-900 flex flex-col antialiased">
      <JsonLd data={breadcrumbsSchema} id="usp-breadcrumbs-schema" />
      <Header />

      <main className="flex-grow pt-[56px] md:pt-[130px]">
        {/* Top Breadcrumb & Back to Home Bar */}
        <div className="bg-white border-b border-slate-200">
          <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <Link href="/" className="hover:text-[#F26522] flex items-center gap-1">
                <Home size={14} />
                <span>Home</span>
              </Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Top 20 USPs</span>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#F26522] hover:text-white text-slate-700 font-bold text-xs transition-all"
            >
              <ArrowLeft size={13} />
              <span>Back to Home Storefront</span>
            </Link>
          </div>
        </div>

        {/* The Full Interactive USP Section Component */}
        <USPSection />

        {/* Bottom Fast Action Banner */}
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-[#F26522] text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Experience The Future of Material Sourcing</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#052a51] tracking-tight">
              Ready to Order Materials for Your Site?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Explore 10,000+ certified vitrified tiles, sanitaryware, modular electricals, and hardware with guaranteed 60-minute site delivery.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/"
                className="px-6 py-3 bg-[#052a51] hover:bg-[#0b3b6d] text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Go to Homepage</span>
                <Home size={16} />
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <span>Explore Catalog</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
