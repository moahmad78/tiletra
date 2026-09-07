import { Metadata } from "next";
import Link from "next/link";
import {
  HardHat,
  Truck,
  FileCheck,
  Percent,
  ArrowRight,
  MessageCircle,
  Package,
  CheckCircle2,
  Layers,
  Zap,
  Droplets,
  Wrench,
  Grid3x3,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import {
  getCanonicalUrl,
  generateBreadcrumbSchema,
  generateArchitectServiceSchema,
  generateFAQSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: "Bulk Construction Material Orders for Contractors | Intrihub Bangalore",
  description:
    "Order bulk tiles, electrical, plumbing, plywood & hardware for construction projects in Bangalore. Factory-direct pricing, GST invoices, phased site delivery. Intrihub.",
  alternates: {
    canonical: getCanonicalUrl("/bulk-orders"),
  },
  openGraph: {
    title: "Bulk Construction Material Orders for Contractors | Intrihub Bangalore",
    description:
      "Bulk construction materials for contractors in Bangalore — tiles, electrical, plumbing, plywood, hardware. GST invoices & site delivery.",
    url: getCanonicalUrl("/bulk-orders"),
    type: "website",
    siteName: "Intrihub",
    images: [{ url: "https://intrihub.com/og-image.png", alt: "Bulk Orders — Intrihub" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bulk Construction Material Orders for Contractors | Intrihub Bangalore",
    description:
      "Bulk construction materials for contractors in Bangalore — tiles, electrical, plumbing, plywood, hardware.",
    images: ["https://intrihub.com/og-image.png"],
  },
};

const CATEGORIES_COVERED = [
  { name: "Tiles & Stone", icon: Grid3x3, href: "/shop/tiles-stone", desc: "Vitrified, ceramic, granite, marble" },
  { name: "Electrical", icon: Zap, href: "/shop/electrical", desc: "Wires, switches, MCBs, panels" },
  { name: "Plumbing & Sanitary", icon: Droplets, href: "/shop/plumbing-sanitary", desc: "CPVC pipes, faucets, EWCs" },
  { name: "Plywood & Laminates", icon: Layers, href: "/shop/plywood", desc: "BWP, MR grade, MDF, laminates" },
  { name: "Hardware & Fittings", icon: Wrench, href: "/shop/hardware-fittings", desc: "Hinges, locks, handles, screws" },
  { name: "Paint & Finishes", icon: Package, href: "/shop/paint-finishes", desc: "Interior, exterior, wood finishes" },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Share Your Material List",
    desc: "Send us your bill of quantities (BOQ), floor plan, or a simple WhatsApp message describing what you need. Our project desk responds within 2 hours.",
  },
  {
    step: "02",
    title: "Receive a Project Quote",
    desc: "We prepare a consolidated quote with tiered pricing based on quantity — no per-item haggling, just transparent volume rates with GST included.",
  },
  {
    step: "03",
    title: "Confirm & Schedule Delivery",
    desc: "Approve the quote and we schedule phased deliveries to your site aligned to your construction milestones — floor by floor, room by room if needed.",
  },
  {
    step: "04",
    title: "GST Invoice & Payment",
    desc: "Every order ships with a valid B2B GST tax invoice with HSN/SAC codes — ready for Input Tax Credit (ITC) claims with zero paperwork from your end.",
  },
];

const BULK_FAQS = [
  {
    question: "What is the minimum order value for bulk pricing on Intrihub?",
    answer:
      "Bulk contractor pricing is available on orders above ₹25,000. For orders above ₹1 lakh, we assign a dedicated project relationship manager who handles your entire procurement from quote to delivery. Contact our contractor desk via WhatsApp to discuss your project requirements.",
  },
  {
    question: "Can I order materials for multiple floors on a phased schedule?",
    answer:
      "Yes. Intrihub specializes in phased project delivery — you can specify delivery dates per floor or construction milestone. Our logistics team coordinates lift access, floor-level delivery, and handles all unloading coordination to protect your completed work.",
  },
  {
    question: "Do you provide GST tax invoices for bulk orders?",
    answer:
      "Every Intrihub order includes a valid B2B GST tax invoice with correct HSN/SAC codes, supplier GSTIN, and itemized pricing. These invoices are immediately eligible for Input Tax Credit (ITC) with zero modifications required. Consolidated invoices for multi-delivery projects are also available on request.",
  },
  {
    question: "Which areas in Bangalore do you cover for bulk construction deliveries?",
    answer:
      "Intrihub delivers to all major construction zones across Bangalore including Whitefield, Koramangala, HSR Layout, Electronic City, Sarjapur Road, Hebbal, Marathahalli, Indiranagar, Jayanagar, JP Nagar, BTM Layout, and Begur. For sites outside these zones, contact our logistics desk for coverage confirmation.",
  },
  {
    question: "How is Intrihub different from a local building material dealer for bulk orders?",
    answer:
      "Local dealers typically have limited brand variety, manual pricing with negotiation required, and cash-only or limited invoice options. Intrihub offers a verified catalog across 20+ categories, transparent tiered pricing online, GST B2B invoicing, real-time order tracking, and a dedicated project manager for orders above ₹1 lakh — all without the middleman markup that local distributors add.",
  },
];

export default function BulkOrdersPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Bulk Orders", url: "/bulk-orders" },
  ]);
  const serviceSchema = generateArchitectServiceSchema();
  const faqSchema = generateFAQSchema(BULK_FAQS);

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="bulk-orders-breadcrumbs-schema" />
      <JsonLd data={serviceSchema} id="bulk-orders-service-schema" />
      <JsonLd data={faqSchema} id="bulk-orders-faq-schema" />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">

          {/* ── Hero ── */}
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#052A51] text-white rounded-3xl p-8 sm:p-12 md:p-16 mb-12 shadow-xl relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#F26522]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-8 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-[#F26522] text-xs font-bold uppercase tracking-wider mb-6">
                <HardHat size={15} />
                Contractor &amp; Builder Direct Supply
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Bulk Construction Material Orders for Contractors in Bangalore
              </h1>
              <p className="text-white/80 text-base sm:text-lg mt-5 leading-relaxed max-w-2xl">
                Order tiles, electrical, plumbing, plywood, hardware, and more in bulk — with
                transparent factory-direct pricing, phased site delivery, and GST B2B invoices on every
                order. No middleman. No hidden markup.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="https://wa.me/917090120211?text=Hi%2C%20I%20want%20to%20place%20a%20bulk%20construction%20material%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-green-500/30"
                >
                  <MessageCircle size={17} />
                  WhatsApp Us Your BOQ
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20"
                >
                  Request a Formal Quote
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── Why Intrihub for Bulk Orders ── */}
          <div className="mb-12">
            <h2 className="text-2xl font-black text-[#052a51] mb-6">
              Why Contractors Choose Intrihub for Bulk Orders
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Percent,
                  color: "amber",
                  title: "Volume Tier Pricing",
                  desc: "Volume-based pricing tiers activate automatically — the more you order, the lower the per-unit cost. No negotiation required, rates are transparent.",
                },
                {
                  icon: FileCheck,
                  color: "blue",
                  title: "100% GST B2B Invoices",
                  desc: "Every order ships with a valid GST tax invoice (HSN/SAC coded) for immediate ITC eligibility. Consolidated invoices available for multi-phase deliveries.",
                },
                {
                  icon: Truck,
                  color: "emerald",
                  title: "Phased Site Logistics",
                  desc: "Schedule material drops by floor, zone, or construction milestone. Our fleet handles lift access, floor-level delivery, and safe unloading to protect finished work.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${
                      card.color === "amber"
                        ? "bg-amber-50 text-[#F26522]"
                        : card.color === "blue"
                        ? "bg-blue-50 text-[#052A51]"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <card.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── About Bulk Orders at Intrihub (SEO content block) ── */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 mb-12">
            <h2 className="text-xl font-black text-[#052a51] mb-5">
              How Bulk Material Ordering Works at Intrihub
            </h2>
            <div className="prose prose-slate max-w-none text-[15px] leading-relaxed text-gray-700 space-y-4">
              <p>
                For contractors, builders, and developers managing residential and commercial construction
                projects across Bangalore, sourcing quality materials at competitive prices — while maintaining
                consistent supply across construction phases — is one of the most operationally demanding parts of
                the job. Intrihub's bulk order desk was built specifically to address this: a direct procurement
                channel from certified manufacturers to your construction site, without the distributor-to-dealer
                markup chain that inflates market prices by 20–40%.
              </p>
              <p>
                Our catalog covers the full construction materials spectrum — vitrified and ceramic tiles, natural
                granite slabs, ISI-certified electrical wires and modular switches, CPVC plumbing pipes and
                sanitaryware fittings, BWP and MR grade plywood, decorative laminates, architectural hardware, and
                surface finishing materials including paints and waterproofing compounds. All products carry brand
                certifications (ISI, BEE, FRLS, BIS) and complete technical documentation.
              </p>
              <p>
                Unlike ordering from a local dealer where pricing varies by negotiation skill, Intrihub's tiered
                pricing is transparent and applies automatically based on quantity — no back-and-forth required.
                For large projects above ₹1 lakh in total material value, we assign a dedicated project
                relationship manager who prepares your consolidated bill of quantities (BOQ), coordinates
                with your site supervisor on delivery scheduling, and manages returns or replacements if any
                material arrives damaged.
              </p>
              <p>
                Intrihub is not a cash-and-carry operation — we issue valid B2B GST tax invoices with correct
                HSN codes on every shipment, enabling straightforward Input Tax Credit (ITC) claims that
                reduce your effective material cost further. Payment terms for established contractors are
                available on discussion with our project desk.
              </p>
            </div>
          </div>

          {/* ── Process Steps ── */}
          <div className="mb-12">
            <h2 className="text-2xl font-black text-[#052a51] mb-6">
              How to Place a Bulk Order — 4 Steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PROCESS_STEPS.map((step) => (
                <div
                  key={step.step}
                  className="bg-white rounded-2xl border border-gray-200 p-6 flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#052a51] text-[#F26522] flex items-center justify-center font-black text-sm shrink-0">
                    {step.step}
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Categories Covered ── */}
          <div className="mb-12">
            <h2 className="text-2xl font-black text-[#052a51] mb-6">
              Categories Available for Bulk Orders
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {CATEGORIES_COVERED.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-[#052a51]/30 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#052a51]/8 text-[#052a51] flex items-center justify-center mb-3 group-hover:bg-[#052a51] group-hover:text-white transition-colors">
                    <cat.icon size={20} />
                  </div>
                  <h3 className="text-[14px] font-bold text-gray-900 mb-0.5">{cat.name}</h3>
                  <p className="text-[12px] text-gray-500 leading-tight">{cat.desc}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ── FAQs ── */}
          <div className="mb-12 max-w-3xl">
            <h2 className="text-2xl font-black text-[#052a51] mb-6">
              Bulk Order FAQs
            </h2>
            <div className="space-y-3">
              {BULK_FAQS.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-bold text-[14px] text-gray-800 select-none hover:bg-gray-50 transition-colors">
                    {faq.question}
                    <ArrowRight
                      size={16}
                      className="text-gray-400 shrink-0 transition-transform group-open:rotate-90"
                    />
                  </summary>
                  <div className="px-5 pb-4 text-[14px] text-gray-600 leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* ── Final CTA ── */}
          <div className="bg-gradient-to-r from-[#052a51] to-[#093A6D] rounded-3xl p-8 sm:p-12 text-white text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#F26522] text-xs font-bold uppercase tracking-wider mb-4">
              <CheckCircle2 size={13} />
              Ready to Order
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Start Your Bulk Order Today
            </h2>
            <p className="text-white/70 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
              Share your material list on WhatsApp or fill the quote form — our project desk will respond
              within 2 hours with a consolidated project quote.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="https://wa.me/917090120211?text=Hi%2C%20I%20want%20to%20place%20a%20bulk%20construction%20material%20order"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-green-500/30"
              >
                <MessageCircle size={17} />
                WhatsApp Your BOQ
              </a>
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-colors border border-white/20"
              >
                Browse Full Catalog
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
