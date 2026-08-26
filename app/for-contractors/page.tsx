import { Metadata } from "next";
import Link from "next/link";
import { HardHat, Truck, FileCheck, Percent, ArrowRight, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Bulk Material Sourcing for Civil & Interior Contractors | Intrihub",
  description:
    "Wholesale interior & construction materials for contractors: bulk vitrified tiles, CPVC pipes, FRLS cables, tile adhesives, and sanitaryware with direct site delivery and GST billing.",
  alternates: {
    canonical: getCanonicalUrl("/for-contractors"),
  },
  openGraph: {
    title: "Bulk Material Sourcing for Civil & Interior Contractors | Intrihub",
    description:
      "Wholesale interior & construction materials for contractors with GST invoices, phased site deliveries, and factory pricing.",
    url: getCanonicalUrl("/for-contractors"),
    type: "website",
    siteName: "Intrihub",
  },
};

export default function ForContractorsPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "For Contractors", url: "/for-contractors" },
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
                <HardHat size={15} />
                Contractor Direct Supply Desk
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Direct Bulk Material Supply for Contractors & Builders
              </h1>
              <p className="text-white/80 text-base sm:text-lg mt-4 leading-relaxed">
                Zero middleman markup, phased multi-floor site deliveries, 100% genuine ISI/ISO certified supplies, and instant GST invoices for input tax credit.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="px-6 py-3.5 bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
                >
                  Order Project Supplies
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20"
                >
                  Request Bulk Quote (RFQ)
                </Link>
              </div>
            </div>
          </div>

          {/* Contractor Advantages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FF9900] flex items-center justify-center mb-5">
                <Percent size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Wholesale Tier Pricing</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Unlock direct volume discounts on full-truckload and multi-pallet orders of tiles, adhesive bags, electrical coils, and bathroom packages.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#052A51] flex items-center justify-center mb-5">
                <FileCheck size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">100% GST Tax Invoices</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Receive clean, itemized B2B GST tax invoices with valid HSN/SAC codes for seamless Input Tax Credit (ITC) claiming.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Truck size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">Phased Site Logistics</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Schedule material drops as each construction milestone arrives to avoid site congestion and on-site material breakage.
              </p>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
