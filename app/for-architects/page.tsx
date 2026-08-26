import { Metadata } from "next";
import Link from "next/link";
import { Compass, CheckCircle2, FileText, Package, ArrowRight, Shield, PhoneCall } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Material Sourcing for Architects & Specifiers | Intrihub Trade",
  description:
    "End-to-end interior & construction material procurement for architectural firms. Factory-direct vitrified tiles, granite, sanitaryware, and electrical specifications with sampling support.",
  alternates: {
    canonical: getCanonicalUrl("/for-architects"),
  },
  openGraph: {
    title: "Material Sourcing for Architects & Specifiers | Intrihub Trade",
    description:
      "End-to-end interior & construction material procurement for architectural firms with sampling support, CAD/BIM data, and direct site delivery.",
    url: getCanonicalUrl("/for-architects"),
    type: "website",
    siteName: "Intrihub",
  },
};

export default function ForArchitectsPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "For Architects", url: "/for-architects" },
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
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#031D38] text-white rounded-3xl p-8 sm:p-12 md:p-16 mb-12 shadow-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#FF9900] text-xs font-bold uppercase tracking-wider mb-6">
                <Compass size={15} />
                Architectural Specification & Sourcing
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Precision Material Sourcing for Architects & Specifiers
              </h1>
              <p className="text-white/80 text-base sm:text-lg mt-4 leading-relaxed">
                Streamline your design intent into physical reality. Access technical data sheets, physical sample boxes, and direct factory supply for commercial and luxury residential projects.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="px-6 py-3.5 bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                >
                  Explore Material Catalog
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20"
                >
                  Request Sample Box
                </Link>
              </div>
            </div>
          </div>

          {/* Key Architectural Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#052A51] flex items-center justify-center mb-5">
                <FileText size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Technical Data & Compliance</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Full access to slip resistance ratings (R9-R11), water absorption certificates, MOR testing data, and ISO/ISI compliance certifications for all surfaces.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FF9900] flex items-center justify-center mb-5">
                <Package size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Physical Sample Deliveries</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receive curated physical tile, stone, finish, and laminate swatches directly at your design studio or project site in Bangalore and Pan-India.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Shield size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Batch Consistency Guarantee</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Direct factory manufacturing allocations prevent shade variation and ensure caliber alignment across entire multi-story project floors.
              </p>
            </div>
          </div>

          {/* Sourcing Categories */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Specification Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Large Format Vitrified Tiles", href: "/shop/floor-tiles" },
                { name: "Natural Granite & Quartz", href: "/shop/granite-marble" },
                { name: "Commercial Sanitaryware", href: "/shop/sanitaryware" },
                { name: "Engineered Adhesives & Grouts", href: "/shop/tile-adhesives" },
                { name: "Architectural Lighting", href: "/shop/electricals" },
                { name: "Concealed Plumbing Fixtures", href: "/shop/bath-fittings" },
                { name: "Hardware & Door Fittings", href: "/shop/hardware" },
                { name: "Waterproofing Systems", href: "/shop/tile-adhesives" },
              ].map((cat, i) => (
                <Link
                  key={i}
                  href={cat.href}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-[#052A51]/30 transition-all font-semibold text-slate-800 text-sm flex items-center justify-between"
                >
                  <span>{cat.name}</span>
                  <ArrowRight size={14} className="text-[#052A51]" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
