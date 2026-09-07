import { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  CheckCircle2,
  FileText,
  Package,
  ArrowRight,
  Shield,
  PhoneCall,
  Layers,
  Sparkles,
  Award,
  Truck,
  Building2,
  Check,
  HelpCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getCanonicalUrl,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateArchitectServiceSchema,
  BASE_SITE_URL,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Material Sourcing for Architects & Specifiers | Intrihub Trade",
  description:
    "Factory-direct material procurement for architectural firms and specifiers. Access technical compliance data, certified sample swatch boxes, R9-R11 slip ratings, single-batch manufacturing runs, and express site delivery in Bengaluru.",
  alternates: {
    canonical: getCanonicalUrl("/for-architects"),
  },
  openGraph: {
    title: "Material Sourcing for Architects & Specifiers | Intrihub Trade",
    description:
      "End-to-end interior and construction material procurement for architectural firms with sampling support, BIM/CAD specs, single-batch allocations, and direct site delivery.",
    url: getCanonicalUrl("/for-architects"),
    type: "website",
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "IntriHub Architectural Specification & Material Sourcing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Material Sourcing for Architects & Specifiers | Intrihub Trade",
    description:
      "End-to-end interior & construction material procurement for architectural firms with sampling support, CAD/BIM data, and direct site delivery.",
    images: [`${BASE_SITE_URL}/og-image.png`],
  },
};

const architectFaqs = [
  {
    question: "How does Intrihub support architectural firms with material samples?",
    answer:
      "Intrihub delivers curated physical architectural sample boxes containing tile swatches, granite finishes, engineered veneer cutouts, and sanitaryware hardware directly to your design studio within 24 to 48 hours across Bengaluru and pan-India.",
  },
  {
    question: "How does Intrihub guarantee batch consistency for large commercial projects?",
    answer:
      "For commercial projects exceeding 5,000 sq.ft, Intrihub locks single-press and single-kiln production runs directly at partner manufacturing plants in Morbi and Bengaluru, ensuring zero caliber variation and uniform shade matching across all project floors.",
  },
  {
    question: "Can Intrihub provide certified technical data sheets and lab test certificates?",
    answer:
      "Yes. Every material catalog entry is accompanied by downloadable manufacturer test certificates covering slip resistance (R9-R11), water absorption (<0.05%), breaking strength (MOR >35 N/mm²), and IS:15622 / IS:2202 compliance.",
  },
  {
    question: "What credit terms and BOQ pricing support are available for registered specifiers?",
    answer:
      "Architectural partners and project specifiers receive volume project pricing tiers, dedicated account managers, custom Bill of Quantities (BOQ) matching, and milestone-based scheduled site deliveries.",
  },
];

export default function ForArchitectsPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "For Architects", url: "/for-architects" },
  ]);

  const faqSchema = generateFAQSchema(architectFaqs);
  const serviceSchema = generateArchitectServiceSchema();

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="architects-breadcrumbs-schema" />
      <JsonLd data={faqSchema} id="architects-faq-schema" />
      <JsonLd data={serviceSchema} id="architects-service-schema" />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#031D38] text-white rounded-3xl p-8 sm:p-12 md:p-16 mb-12 shadow-xl">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-[#FF9900] text-xs font-bold uppercase tracking-wider mb-6">
                <Compass size={15} />
                Architectural Specification & Material Sourcing
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Precision Material Sourcing for Architects & Specifiers
              </h1>
              <p className="text-white/80 text-base sm:text-lg mt-5 leading-relaxed">
                Streamline your design intent into physical reality. Access lab-certified technical data sheets, physical sample swatch boxes delivered to your studio, single-batch manufacturing allocations, and factory-direct project pricing for luxury residential, commercial, and hospitality projects.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/shop"
                  className="px-7 py-3.5 bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <span>Explore Material Catalog</span>
                  <ArrowRight size={16} />
                </Link>
                <Link
                  href="/contact"
                  className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-sm transition-all border border-white/20"
                >
                  Request Physical Sample Box
                </Link>
              </div>
            </div>
          </div>

          {/* Key Architectural Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#052A51] flex items-center justify-center mb-5">
                  <FileText size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Technical Data & Compliance</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Full access to DIN 51130 slip resistance ratings (R9 through R11), ISO 10545 water absorption certificates (&lt;0.05% for vitrified stoneware), Modulus of Rupture (MOR &gt;35 N/mm²), and IS:15622 / IS:2202 compliance certifications for every surface specification.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#052A51]">
                <Check size={14} className="text-emerald-600" />
                <span>Certified Lab Test Reports</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FF9900] flex items-center justify-center mb-5">
                  <Package size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Studio Sample Swatch Boxes</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Receive curated physical material kits with full-body vitrified tile cutouts, leathered and flamed granite samples, pre-laminated wood veneers, and hardware finishes shipped directly to your architectural studio within 24 to 48 hours across Bengaluru and pan-India.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#052A51]">
                <Check size={14} className="text-emerald-600" />
                <span>Delivered Within 48 Hours</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                  <Shield size={24} />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">Batch Consistency Guarantee</h2>
                <p className="text-slate-600 text-sm leading-relaxed">
                  Commercial allocations are locked to single-kiln and single-press production batches directly at source factories. We eliminate tonal shade variation, caliber mismatch, and dimensional discrepancies across multi-floor commercial and residential developments.
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#052A51]">
                <Check size={14} className="text-emerald-600" />
                <span>Zero Caliber Variance</span>
              </div>
            </div>
          </div>

          {/* Architectural Procurement Workflow */}
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-sm mb-12">
            <div className="max-w-3xl mb-10">
              <span className="text-xs font-bold text-[#FF9900] uppercase tracking-wider block mb-2">
                Structured Process
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                End-to-End Architectural Procurement Workflow
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
                From initial schematic concept and material moodboards to final on-site installation, Intrihub provides specifiers with transparent supply chain control, verified factory origins, and scheduled project dispatches.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "BOQ & Spec Mapping",
                  desc: "Submit your Bill of Quantities (BOQ) or design schedule. Our technical team maps exact factory equivalents with verified physical specs and direct price benchmarks.",
                },
                {
                  step: "02",
                  title: "Sample Verification",
                  desc: "Review high-resolution physical samples, surface textures, and photometric data directly at your design studio or with clients prior to sign-off.",
                },
                {
                  step: "03",
                  title: "Single-Batch Lot Locking",
                  desc: "We reserve entire project quantities in designated factory warehouse bays, securing production date codes to ensure absolute visual and dimensional uniformity.",
                },
                {
                  step: "04",
                  title: "Phased Site Dispatch",
                  desc: "Coordinate deliveries aligned with your contractor's flooring and civil schedule with palletized shrink-wrapped transit and live GPS tracking.",
                },
              ].map((item, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-2xl font-black text-[#FF9900] block mb-3 font-mono">
                      {item.step}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sourcing Categories */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Trade Specification Categories</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Over 20+ specialized material verticals engineered for architectural compliance.
                </p>
              </div>
              <Link
                href="/shop"
                className="text-xs font-bold text-[#052A51] hover:text-[#FF9900] flex items-center gap-1 underline underline-offset-4"
              >
                <span>Browse Full Catalog</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: "Large Format Vitrified Slabs", href: "/shop/floor-tiles" },
                { name: "Natural Granite & Italian Marble", href: "/shop/granite" },
                { name: "Commercial Sanitaryware & Basins", href: "/shop/plumbing" },
                { name: "Engineered Adhesives & Epoxy Grouts", href: "/shop/floor-tiles" },
                { name: "Architectural Lighting & Conduit", href: "/shop/electrical" },
                { name: "Concealed Brass Plumbing Fixtures", href: "/shop/plumbing" },
                { name: "Stainless Steel Hardware & Hinges", href: "/shop/hardware" },
                { name: "Solid Flush Doors & Aluminum Profiles", href: "/shop/aluminum-doors" },
                { name: "Acoustic Fluted Panels & Wallpapers", href: "/shop/wallpaper" },
                { name: "Waterproof BWP Plywood & Laminates", href: "/shop/plywood" },
                { name: "Outdoor Anti-Skid Paver Tiles", href: "/shop/floor-tiles" },
                { name: "Subway & Decorative Mosaic Tiles", href: "/shop/floor-tiles" },
              ].map((cat, i) => (
                <Link
                  key={i}
                  href={cat.href}
                  className="p-4 rounded-xl bg-slate-50 hover:bg-blue-50/50 border border-slate-100 hover:border-[#052A51]/30 transition-all font-semibold text-slate-800 text-xs sm:text-sm flex items-center justify-between group"
                >
                  <span className="truncate pr-2">{cat.name}</span>
                  <ArrowRight size={14} className="text-[#052A51] group-hover:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Architect FAQ Section */}
          <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-sm mb-12">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#FF9900] uppercase tracking-wider">
              <HelpCircle size={15} />
              <span>Frequently Asked Questions</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Architect & Trade Partner FAQ</h2>
            <div className="space-y-4">
              {architectFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2"
                >
                  <h3 className="text-sm sm:text-base font-bold text-[#052A51]">
                    {faq.question}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Trade Help Banner */}
          <div className="bg-[#052A51] text-white p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Have an Active Project or Tender BOQ?</h3>
              <p className="text-white/75 text-xs sm:text-sm mt-1 max-w-xl">
                Connect directly with our Architectural Trade Desk for volume estimates, sample dispatch, and project scheduling.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="https://wa.me/919264920211?text=Hi%20Intrihub%20Trade%20Desk,%20I%20am%20an%20architect%20specifier%20requesting%20BOQ%20support%20and%20sample%20boxes."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2"
              >
                <span>WhatsApp Trade Desk</span>
                <ArrowRight size={14} />
              </a>
              <a
                href="tel:+919264920211"
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs sm:text-sm transition-all border border-white/20 flex items-center gap-2"
              >
                <PhoneCall size={14} />
                <span>Call Support</span>
              </a>
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
