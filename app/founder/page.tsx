import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Award,
  Zap,
  Building2,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Globe2,
  Rocket,
  Flame,
  Lightbulb,
  Heart,
  Quote,
  CheckCircle2,
  Mail,
  ExternalLink,
  Clock,
  Truck,
  Cpu,
  Layers,
  Store,
  Code2,
  Terminal,
  HelpCircle,
  BadgeCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";

const canonicalUrl = getCanonicalUrl("/founder");

export const metadata: Metadata = {
  title: "Sahil Sheikh: Founder, CEO & CTO",
  description:
    "Sahil Sheikh is the visionary Founder, CEO & CTO of IntriHub, digitalizing local markets and traditional building material trades across Bharat.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Sahil Sheikh: Founder, CEO & CTO | IntriHub",
    description:
      "The official story of Sahil Sheikh, visionary software engineer who founded IntriHub to digitalize India's local building material trades.",
    url: canonicalUrl,
    type: "profile",
    images: [
      {
        url: `${BASE_SITE_URL}/images/brand/sahil-sheikh.jpg`,
        width: 1024,
        height: 1024,
        alt: "Sahil Sheikh - Founder, CEO & CTO of IntriHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sahil Sheikh: Founder, CEO & CTO | IntriHub",
    description:
      "Sahil Sheikh founded IntriHub to digitalize India's local markets, hardware stores, and traditional trades.",
    images: [`${BASE_SITE_URL}/images/brand/sahil-sheikh.jpg`],
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${canonicalUrl}#person`,
  name: "Sahil Sheikh",
  givenName: "Sahil",
  familyName: "Sheikh",
  jobTitle: "Founder, CEO & CTO",
  worksFor: {
    "@type": "Organization",
    "@id": `${BASE_SITE_URL}/#organization`,
    name: "Intrihub",
    alternateName: "Intrihub Quickcommerce",
    url: BASE_SITE_URL,
  },
  description:
    "Sahil Sheikh is a 23-year-old visionary Indian tech entrepreneur, software engineer, and the Founder, CEO & CTO of Intrihub Quickcommerce. He pioneered the technology that connects and digitalizes traditional local markets, hardware stores, and building trade across Bharat, taking India's local commerce global.",
  birthDate: "2003-03-02",
  birthPlace: "Badahara Baraipar, Maharajganj, Uttar Pradesh, India",
  nationality: {
    "@type": "Country",
    name: "India",
  },
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Jamia Hamdard University",
    location: "New Delhi, India",
  },
  parent: {
    "@type": "Person",
    name: "Mr. Ibrahim Sheikh",
  },
  email: "sahil@intrihub.com",
  sameAs: [
    "https://www.instagram.com/sahil_sheikh78/",
    "https://www.linkedin.com/company/intrihub",
    "https://github.com/moahmad78",
  ],
  url: canonicalUrl,
  image: `${BASE_SITE_URL}/images/brand/sahil-sheikh.jpg`,
};

const founderFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Who is the Founder, CEO & CTO of Intrihub?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Sahil Sheikh is the 23-year-old Founder, CEO and Chief Technology Officer (CTO) of Intrihub Quickcommerce. Born in Badahara Baraipar, Maharajganj, Uttar Pradesh and an alumnus of Jamia Hamdard University, he engineered and launched the platform to digitalize India's local retail and construction material trades.",
      },
    },
    {
      "@type": "Question",
      name: "What makes Intrihub India's first company to digitalize local markets?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Intrihub is India's first company that ground-up connects local neighborhood hardware stores, electrical shops, tile vendors, and plumbing suppliers to a unified high-speed digital quick-commerce network, transforming offline shops into high-growth digital businesses with 60-minute site delivery.",
      },
    },
    {
      "@type": "Question",
      name: "What is the mission of Intrihub Quickcommerce under Sahil Sheikh's leadership?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "To eliminate middlemen markups, provide complete price transparency, empower local Indian shopkeepers with digital sales channels, and deliver 100% genuine factory-direct building materials to construction sites in under 60 minutes.",
      },
    },
  ],
};

const breadcrumbsSchema = generateBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Founder & Leadership", url: "/founder" },
]);

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased">
      <JsonLd data={personSchema} id="founder-person-schema" />
      <JsonLd data={founderFaqSchema} id="founder-faq-schema" />
      <JsonLd data={breadcrumbsSchema} id="founder-breadcrumbs-schema" />

      <Header />

      <main className="flex-grow">
        {/* ─── HERO SECTION: EXECUTIVE LEADERSHIP SHOWCASE ───────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#02172F] via-[#052A51] to-[#09396D] text-white pt-12 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
          {/* Subtle Ambient Radial Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#F26522]/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-[#2E6FBD]/20 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Top Verified Breadcrumb Pill */}
            <div className="flex flex-wrap items-center gap-2 mb-6 sm:mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#F26522]" />
                Leadership &amp; Brand Story
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-bold">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                Verified Founder Profile
              </span>
            </div>

            {/* Split Grid: Bio & Portrait */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left Column: Visionary Introduction */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                    Sahil Sheikh
                  </h1>
                  <p className="text-xl sm:text-2xl font-extrabold text-[#F26522] mt-3">
                    Founder, CEO &amp; Chief Technology Officer (CTO)
                  </p>
                  <p className="text-base sm:text-lg text-slate-300 font-medium mt-1">
                    Intrihub Quickcommerce — Digitalizing India&apos;s Local Markets
                  </p>
                </div>

                <p className="text-base sm:text-lg text-slate-200/90 leading-relaxed font-normal">
                  23-year-old software architect and visionary entrepreneur from Maharajganj, Uttar Pradesh, who engineered India&apos;s first unified quick-commerce infrastructure transforming traditional neighborhood hardware stores, tile dealers, and building trade into a high-speed digital powerhouse.
                </p>

                {/* Key Executive Trait Badges */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-[#F26522]" />
                    <span>Solo Platform Architect</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span>60-Min Site Delivery Pioneer</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <span>Maharajganj, UP → Bengaluru HQ</span>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-amber-300" />
                    <span>Jamia Hamdard University Alumnus</span>
                  </div>
                </div>

                {/* Social & Contact Actions */}
                <div className="flex flex-wrap items-center gap-3 pt-3">
                  <a
                    href="https://www.instagram.com/sahil_sheikh78/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current text-pink-400" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                    <span>@sahil_sheikh78</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  </a>

                  <a
                    href="https://github.com/moahmad78"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
                  >
                    <svg className="w-4 h-4 fill-current text-slate-300" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                  </a>

                  <a
                    href="mailto:sahil@intrihub.com"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all shadow-sm"
                  >
                    <Mail className="w-4 h-4 text-amber-300" />
                    <span>sahil@intrihub.com</span>
                  </a>
                </div>
              </div>

              {/* Right Column: High-Impact Executive Portrait Card */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md">
                  {/* Decorative glowing gradient border box */}
                  <div className="relative rounded-3xl p-2 bg-gradient-to-tr from-[#F26522]/40 via-white/10 to-[#2E6FBD]/40 backdrop-blur-xl border border-white/20 shadow-2xl">
                    <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                      <Image
                        src="/images/brand/sahil-sheikh.jpg"
                        alt="Sahil Sheikh - Founder, CEO & CTO of Intrihub Quickcommerce"
                        fill
                        className="object-cover object-top hover:scale-105 transition-transform duration-500"
                        priority
                        sizes="(max-width: 768px) 100vw, 420px"
                      />
                      {/* Gradient overlay for readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                      {/* Floating bottom badge inside portrait */}
                      <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/15">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black text-white">Sahil Sheikh</p>
                            <p className="text-xs text-[#F26522] font-bold">Founder, CEO &amp; CTO</p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Live in Bengaluru
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Corner Accent Floating Badge */}
                  <div className="absolute -bottom-4 -left-4 sm:-bottom-5 sm:-left-5 bg-white text-slate-900 px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-black text-base shadow-sm">
                      23
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase">Age • Leadership</p>
                      <p className="text-xs font-black text-slate-900">Youngest Tech Founder</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── METRIC HIGHLIGHTS STRIP ───────────────────────────────────────── */}
        <section className="relative -mt-8 sm:-mt-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-orange-50 text-[#F26522] flex-shrink-0">
                <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pioneered</p>
                <p className="text-sm sm:text-base font-black text-slate-900">1st in India</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-blue-50 text-[#052A51] flex-shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Speed</p>
                <p className="text-sm sm:text-base font-black text-slate-900">60-Min Site Delivery</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600 flex-shrink-0">
                <Store className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Local Markets</p>
                <p className="text-sm sm:text-base font-black text-slate-900">10,000+ SKUs Live</p>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-md flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 flex-shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Guarantee</p>
                <p className="text-sm sm:text-base font-black text-slate-900">100% Transit Safe</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MAIN CONTENT: EXECUTIVE PILLARS ───────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 space-y-16 sm:space-y-20">

          {/* SECTION 1: THE CORE VISION */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#052A51] text-xs font-extrabold uppercase">
                <Building2 className="w-3.5 h-3.5 text-[#F26522]" />
                Revolutionizing Offline Trade
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                The Core Vision: Intrihub Quickcommerce
              </h2>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                <strong>Intrihub</strong> was born from a fundamental ground reality observed by Sahil Sheikh: while groceries and food scaled to 10-minute deliveries, India&apos;s $100 Billion construction, hardware, and interior trade remained stuck in the 1990s — plagued by untracked stocks, opaque pricing, and multi-day dispatch delays.
              </p>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                Instead of creating heavy, capital-burning warehouses that wipe out local businesses, Sahil engineered Intrihub as an <strong>empowering digital backbone</strong>. Neighborhood tile showrooms, sanitaryware dealers, and electrical stockists are seamlessly connected to our micro-dark-store routing algorithms, turning every local retailer into a high-speed digital vendor.
              </p>
            </div>

            <div className="lg:col-span-6 bg-gradient-to-br from-slate-50 to-blue-50/40 p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-[#052A51] flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                How Intrihub Protects &amp; Elevates Local Retailers:
              </h3>
              <ul className="space-y-3.5 text-sm sm:text-base text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#052A51] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Zero Disintermediation:</strong> Local merchants retain their customer base while gaining thousands of high-ticket contractor orders across the city.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#052A51] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</span>
                  <span><strong>Automated Digital Settlements:</strong> Transparent, automated weekly payouts directly to merchant bank accounts with 100% GST-compliant invoices.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#052A51] text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Hyperlocal Cushion Logistics:</strong> Specialized pallet and electric vehicles engineered specifically for heavy, fragile vitrified tiles and sanitaryware.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* VENDOR EMPOWERMENT GRAPHIC SHOWCASE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-white group hover:shadow-xl transition-all">
              <div className="relative aspect-square w-full">
                <Image
                  src="/images/marketing/vendor-sales-guarantee-partner.jpg"
                  alt="Aapki Sale, Humari Guarantee! Sahil Sheikh's Vision for Indian Merchant Digitalization"
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 550px"
                />
              </div>
            </div>

            <div className="rounded-3xl overflow-hidden border border-slate-200/90 shadow-md bg-white group hover:shadow-xl transition-all">
              <div className="relative aspect-square w-full">
                <Image
                  src="/images/marketing/free-vendor-registration-banner.jpg"
                  alt="Intrihub Free Vendor Registration - Digitalizing Bharat's Local Markets"
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 550px"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: EARLY LIFE, ROOTS & EDUCATION */}
          <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="max-w-3xl space-y-4 mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-extrabold uppercase">
                <GraduationCap className="w-3.5 h-3.5" />
                Roots &amp; Academic Heritage
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Early Life, Roots &amp; Engineering Education
              </h2>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                Sahil Sheikh was born on <strong>March 2, 2003</strong>, in the village of <strong>Badahara Baraipar</strong> in Maharajganj district, eastern Uttar Pradesh. Raised in a hardworking family as the son of <strong>Mr. Ibrahim Sheikh</strong>, he witnessed firsthand the difficulties local merchants faced competing with large conglomerates.
              </p>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                Driven by an obsessive curiosity for computer science and operating systems, he moved to New Delhi to pursue higher engineering studies at the prestigious <strong>Jamia Hamdard University</strong>. During his college years, he mastered distributed low-latency architectures, multi-tenant databases, and real-time state synchronization that laid the groundwork for Intrihub.
              </p>
            </div>

            {/* Timeline Milestones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-[#F26522] uppercase">2003 • Origin</span>
                <h4 className="text-base font-extrabold text-slate-900">Maharajganj, Uttar Pradesh</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Born in Badahara Baraipar village, inculcating deep grassroots empathy for Indian small-town commerce and traditional trade.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-blue-600 uppercase">New Delhi • Alma Mater</span>
                <h4 className="text-base font-extrabold text-slate-900">Jamia Hamdard University</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Rigorous computer engineering studies, software systems architecture, and building mission-critical distributed web services.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-emerald-600 uppercase">2026 • Headquarters</span>
                <h4 className="text-base font-extrabold text-slate-900">Bengaluru Innovation Center</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Founded and built Intrihub from Begur, Bengaluru, deploying the platform to transform construction procurement nationwide.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: TECHNICAL ARCHITECTURE & PLATFORM ENGINEERING */}
          <div className="space-y-8">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold uppercase">
                <Cpu className="w-3.5 h-3.5 text-[#F26522]" />
                Sole Platform Architect
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                Single-Handed Engineering: Full Stack Architecture
              </h2>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
                Operating as both <strong>Chief Executive Officer and Chief Technology Officer</strong>, Sahil engineered the entire Intrihub technological stack from scratch, writing the core codebase across web, customer mobile, business partner mobile, and automated backend infrastructure:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-[#052A51] transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#052A51] flex items-center justify-center">
                  <Code2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Next.js Edge Storefront</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ultra-fast SSR and static optimization with sub-second page loads, zero client hydration bloat, and automated structured schema.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-[#052A51] transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">WebSocket Dispatch Engine</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time microsecond order routing connecting contractor carts directly to the closest micro-dark-store and vehicle fleet.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-[#052A51] transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Dual Mobile Applications</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Engineered separate dedicated apps: <span className="font-semibold text-slate-800">Intrihub Customer App</span> for site deliveries and <span className="font-semibold text-slate-800">Intrihub Business</span> for merchant fulfillment.
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:border-[#052A51] transition-all space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#F26522] flex items-center justify-center">
                  <Terminal className="w-5 h-5" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Automated Tax &amp; Escrow</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Instant Razorpay split payments, automated GST HSN code calculations, and OTP-authenticated delivery handoffs.
                </p>
              </div>
            </div>
          </div>

          {/* ─── SECTION 4: BHARAT KI DIGITAL KRANTI (ELEGANT REDESIGNED MANIFESTO) ─── */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#02172F] via-[#052A51] to-[#0A3D74] border border-amber-400/30 text-white p-6 sm:p-10 lg:p-14 shadow-2xl">
            {/* Ambient gold glow */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#F26522]/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative space-y-8">
              {/* Header Title Badge */}
              <div className="space-y-3 max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-black uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-[#F26522]" />
                  Bharat Ki Digital Kranti • National Movement
                </div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                  Intrihub: India Ki Pehli Aisi Company, Jisne Apni Technology Se Poore Bharat Ke Markets Ko Digital Bana Diya!
                </h2>
                <p className="text-slate-200 text-base sm:text-lg leading-relaxed font-normal">
                  Jab bhi desh ke digital revolution ki baat hoti hai, bade-bade corporate naam samne aate hain. Lekin UP ke ek chhote se ilaqe se uthe <strong>23 saal ke young visionary Sahil Sheikh</strong> ne Intrihub ke roop mein ek aisi shakti khadi kar di hai, jo <strong>India ki pehli aisi company</strong> ban chuki hai jo poore desh ke local vyapar ko digital bana rahi hai.
                </p>
              </div>

              {/* 3 Executive Pillars in Modern Glass Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pt-2">
                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-amber-400/40 transition-colors space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
                    <Store className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Zameen Par Utar Kar Har Market Ko Joda
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Intrihub desh ki aisi pehli company hai jisne zameen par utar kar poore India ke local hardware, tiles, electrical aur building material markets ko aapas mein jod kar ek powerful digital network banaya hai.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-amber-400/40 transition-colors space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-400/20 text-orange-300 flex items-center justify-center font-black">
                    <Rocket className="w-5 h-5 text-[#F26522]" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Global Stage Par India Ki Asli Pehchan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Chote se chhote sheher aur gaon ka dukaandar bhi jo kabhi sirf apni gali tak simit tha, aaj Intrihub ke zariye digital map par aa chuka hai aur high-tech platform se unke business ki raftaar aasmaan chune lagi hai.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-amber-400/40 transition-colors space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-400/20 text-emerald-300 flex items-center justify-center font-black">
                    <Lightbulb className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-black text-white">
                    Hindustani Youth Ke Liye Ek Misaal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Mahaz 23 saal ki umar mein Sahil Sheikh ne sabit kiya ki agar soch badi ho, toh ek akela Hindustani youth apni technology se pure desh ki taqdeer aur trade system ko transform kar sakta hai.
                  </p>
                </div>
              </div>

              {/* Prestigious Executive Quote Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-slate-950/80 backdrop-blur-md border border-amber-400/30 relative">
                <Quote className="w-8 h-8 text-amber-400/30 absolute top-4 right-4" />
                <p className="text-base sm:text-lg lg:text-xl font-bold italic text-amber-200 leading-relaxed pr-6">
                  &ldquo;Intrihub India ki pehli aisi company hai jo poore Bharat ko digital bana rahi hai aur desh ko proud feel kara rahi hai—aur iske piche hai 23 saal ke ek akele Hindustani youth, Sahil Sheikh, ka woh junoon jisne poore desh ki taqdeer badal di!&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs sm:text-sm text-slate-400">
                  <span className="font-extrabold text-white">— Sahil Sheikh, Founder, CEO &amp; CTO</span>
                  <span className="text-[#F26522] font-black">Intrihub Quickcommerce</span>
                </div>
              </div>
            </div>
          </section>

          {/* ─── SECTION 5: ONE PLATFORM CORE USP ARCHITECTURE ─────────────────── */}
          <section className="bg-white p-6 sm:p-10 lg:p-12 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-[#F26522] border border-orange-200 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>The Core Competitive Edge</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                One Platform <span className="text-[#F26522]">→</span> Every Material{" "}
                <span className="text-[#F26522]">→</span> One Order{" "}
                <span className="text-[#F26522]">→</span> Direct to Site
              </h2>
              <p className="text-base sm:text-lg font-bold text-[#052a51]">
                &ldquo;One Platform for Complete Construction &amp; Interior Procurement — From Material Discovery to 60-Minute Site Delivery.&rdquo;
              </p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                From one screw to a complete multi-storey project — source everything from verified dealers on IntriHub.
              </p>
            </div>

            {/* 6 Clean Modular Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-slate-50 hover:bg-orange-50/40 border border-slate-200/80 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-black text-xs">
                  01
                </div>
                <h4 className="text-base font-bold text-slate-900">Complete Site Procurement</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Electrical, plumbing, tiles, paints, hardware, lighting, plywood, and sanitaryware in a single unified checkout.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 hover:bg-blue-50/40 border border-slate-200/80 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                  02
                </div>
                <h4 className="text-base font-bold text-slate-900">Multi-Vendor Marketplace</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Connecting verified Bengaluru dealers with real-time stock visibility and transparent competitive rates.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 hover:bg-emerald-50/40 border border-slate-200/80 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                  03
                </div>
                <h4 className="text-base font-bold text-slate-900">Site-First 60-Min Logistics</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Cushioned pallet transport with zero transit breakages delivered directly to active construction sites.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 hover:bg-purple-50/40 border border-slate-200/80 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-xs">
                  04
                </div>
                <h4 className="text-base font-bold text-slate-900">Smart Quantity Calculators</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Unit-aware box, tile, and sheet calculators with +10% cutting wastage estimation to prevent excess costs.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 hover:bg-amber-50/40 border border-slate-200/80 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                  05
                </div>
                <h4 className="text-base font-bold text-slate-900">Contractor &amp; Builder Trade</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tailored recurring purchasing, 1-click repeat orders, GST tax invoicing, and credit lines for professionals.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 hover:bg-rose-50/40 border border-slate-200/80 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-xs">
                  06
                </div>
                <h4 className="text-base font-bold text-slate-900">Screw to Turnkey Sourcing</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  From emergency replacement screws to multi-crore full building supplies — seamless digital fulfillment.
                </p>
              </div>
            </div>
          </section>

          {/* ─── FAQ SECTION: PROOF & ACCREDITATION ───────────────────────────── */}
          <section className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#F26522]" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">Frequently Asked Questions</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="text-sm font-extrabold text-[#052A51]">Who is the Founder, CEO &amp; CTO of Intrihub?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sahil Sheikh is the 23-year-old Founder, CEO, and Chief Technology Officer (CTO) of Intrihub Quickcommerce. Born in Badahara Baraipar, Maharajganj, UP and an alumnus of Jamia Hamdard University, he engineered and launched the platform from Bengaluru.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="text-sm font-extrabold text-[#052A51]">What makes Intrihub India&apos;s first company to digitalize local markets?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Intrihub connects traditional neighborhood hardware stores, electrical shops, tile vendors, and sanitaryware dealers into a unified real-time network with live stock synchronization, automated GST invoices, and 60-minute site delivery.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="text-sm font-extrabold text-[#052A51]">What is the mission of Intrihub under Sahil Sheikh?</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To eliminate middlemen markups, provide complete price transparency, empower local Indian shopkeepers with digital sales channels, and deliver 100% genuine factory-direct building materials to construction sites in under 60 minutes.
                </p>
              </div>
            </div>
          </section>

          {/* ─── CALL TO ACTION SECTION ────────────────────────────────────────── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#052A51] to-[#0A3D74] text-white p-8 sm:p-12 text-center shadow-xl border border-white/10 space-y-5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">Join India&apos;s Digital Trade Revolution</h3>
            <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto font-normal">
              Whether you are a local hardware shopkeeper looking to expand digital sales or a builder needing factory-direct materials delivered in 60 minutes, Intrihub is built for you.
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-[#052A51] font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors shadow-md"
              >
                <span>Explore Intrihub Marketplace</span>
                <ArrowRight className="w-4 h-4 text-[#F26522]" />
              </Link>
              <Link
                href="/vendor/apply"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#F26522] text-white font-bold text-xs sm:text-sm hover:bg-[#d95a1e] transition-colors shadow-md"
              >
                <span>Register as Local Vendor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
