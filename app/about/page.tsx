import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Truck,
  Palette,
  ArrowRight,
  HeartHandshake,
  Mail,
  Award,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Layers,
  Box,
  Zap,
  Phone,
  Building2,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LEADERSHIP_TEAM } from "@/lib/data/contacts";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "About Our 60-Minute Materials Marketplace",
  description:
    "Learn about IntriHub — India's instant building materials quick-commerce network. Founded in 2026 by Sahil Sheikh in Begur, Bengaluru to deliver factory-direct supplies in 60 minutes.",
  alternates: {
    canonical: getCanonicalUrl("/about"),
  },
  openGraph: {
    title: "About IntriHub | Build Better, We Deliver Faster",
    description:
      "India's instant building & interior materials quick commerce marketplace. Factory-direct sourcing with 60-minute site delivery in Bengaluru.",
    url: getCanonicalUrl("/about"),
    type: "website",
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/about/hero-facility.jpg`,
        width: 1200,
        height: 675,
        alt: "IntriHub Logistics and Architectural Procurement Center",
      },
    ],
  },
};

export default function AboutPage() {
  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${BASE_SITE_URL}/about#webpage`,
    name: "About IntriHub",
    url: `${BASE_SITE_URL}/about`,
    description:
      "IntriHub is India's premier quick-commerce marketplace for interior and construction materials, delivering factory-direct supplies in 60 minutes across Bengaluru.",
    mainEntity: {
      "@type": "Organization",
      "@id": `${BASE_SITE_URL}/#organization`,
      name: "IntriHub",
      alternateName: "IntriHub QuickCommerce",
      url: BASE_SITE_URL,
      logo: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
      image: `${BASE_SITE_URL}/about/hero-facility.jpg`,
      foundingDate: "2026",
      founder: {
        "@type": "Person",
        name: "Sahil Sheikh",
        jobTitle: "Founder, CEO & CTO",
        email: "sahil@intrihub.com",
        sameAs: "https://www.instagram.com/sahil_sheikh78/",
        description:
          "Spearheading the technology infrastructure, platform architecture, and overall vision of Intrihub.",
      },
      employee: [
        {
          "@type": "Person",
          name: "Gulshan",
          jobTitle: "Chief Operating Officer (COO)",
          email: "gulshan@intrihub.com",
          description:
            "Managing vendor relations, supply chain logistics, and ground operations to ensure lightning-fast execution.",
        },
        {
          "@type": "Person",
          name: "Vishal Poddar",
          jobTitle: "Chief Product Officer (CPO)",
          email: "vishal@intrihub.com",
          description:
            "Curating top-tier product catalogs, monitoring market trends, and ensuring the best value and variety for our customers.",
        },
      ],
      address: {
        "@type": "PostalAddress",
        streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
        addressLocality: "Begur, Bengaluru",
        addressRegion: "Karnataka",
        postalCode: "560114",
        addressCountry: "IN",
      },
    },
  };

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "About Us", url: "/about" },
  ]);

  return (
    <>
      <JsonLd data={aboutPageSchema} id="about-page-schema" />
      <JsonLd data={breadcrumbsSchema} id="about-breadcrumbs-schema" />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-[#021830] via-[#052a51] to-[#083363] text-white pt-[115px] md:pt-[170px] pb-20 md:pb-28 overflow-hidden">
          {/* Subtle background glow circles */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#F26522]/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -top-24 right-10 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold tracking-wide text-orange-200 mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#F26522] animate-pulse" />
              <span>India&apos;s Instant Material Commerce • Founded 2026, Bengaluru</span>
            </div>

            {/* H1 Heading */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[62px] font-black tracking-tight leading-[1.12] max-w-4xl mx-auto">
              Build Better, Deliver Faster — Direct To Site In{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26522] via-[#ff8f5a] to-[#F26522]">
                60 Minutes
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-200 text-base sm:text-lg md:text-xl mt-6 max-w-2xl mx-auto leading-relaxed font-normal">
              IntriHub is transforming interior and construction procurement for homeowners, architects, and
              contractors. High-grade tiles, electricals, plumbing, and sanitaryware delivered straight from the
              factory floor with zero middlemen.
            </p>

            {/* Official Verification Pill */}
            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#031830]/80 border border-white/10 text-xs text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Official Platform:{" "}
                <strong className="text-white font-bold underline decoration-[#F26522] underline-offset-4">
                  www.intrihub.com
                </strong>
                {" "}— Verified factory warranties &amp; Pan-India logistics
              </span>
            </div>

            {/* Key Metrics / Highlights Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-12 max-w-4xl mx-auto text-left">
              {[
                {
                  value: "60 Mins",
                  label: "Express Site Delivery",
                  sub: "Across Bengaluru core hubs",
                  icon: Clock,
                  accent: "text-[#F26522]",
                },
                {
                  value: "10,000+",
                  label: "Grade-1 Curated SKUs",
                  sub: "Tiles, sanitary, bath, wires",
                  icon: Layers,
                  accent: "text-blue-300",
                },
                {
                  value: "0% Breakage",
                  label: "Packaging Guarantee",
                  sub: "Cushioned heavy pallet freight",
                  icon: ShieldCheck,
                  accent: "text-emerald-400",
                },
                {
                  value: "100% Direct",
                  label: "Transparent Pricing",
                  sub: "Direct from manufacturing hubs",
                  icon: TrendingUp,
                  accent: "text-amber-300",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-[#F26522]/40 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-2xl sm:text-3xl font-black ${stat.accent}`}>{stat.value}</span>
                    <stat.icon className="w-5 h-5 text-white/50" />
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">{stat.label}</div>
                  <div className="text-xs text-slate-300 mt-1">{stat.sub}</div>
                </div>
              ))}
            </div>

            {/* Visual Hero Showcase Card */}
            <div className="relative mt-12 md:mt-16 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 bg-slate-900 group">
              <div className="relative aspect-[16/9] w-full">
                <Image
                  src="/about/hero-facility.jpg"
                  alt="IntriHub Logistics and Architectural Procurement Center"
                  fill
                  priority
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 1200px) 100vw, 1200px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
              </div>

              {/* Floating Badges inside Hero Image */}
              <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap gap-2">
                <div className="px-3.5 py-1.5 rounded-full bg-[#052a51]/80 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                  <MapPin className="w-3.5 h-3.5 text-[#F26522]" />
                  <span>Central Fulfillment Hub • Begur, Bengaluru</span>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-left">
                <div className="max-w-xl">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#F26522] text-white text-[11px] font-bold uppercase tracking-wider">
                    Next-Gen Commerce
                  </span>
                  <h3 className="text-lg sm:text-2xl font-black text-white mt-1.5 drop-shadow-md">
                    Where Architectural Elegance Meets Hyperlocal Logistics
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 line-clamp-2 drop-shadow">
                    Our omnichannel inventory hub combines live designer showcases with an automated high-density dispatch center.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-[#052a51] hover:bg-[#F26522] hover:text-white font-bold text-xs sm:text-sm transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span>Explore Live Catalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Narrative & The Problem We Solve */}
        <section className="py-16 md:py-24 bg-white border-b border-slate-100">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Text & Contrast */}
              <div className="lg:col-span-6 space-y-6">
                <div>
                  <span className="px-3 py-1 bg-orange-50 text-[#F26522] border border-orange-200/60 rounded-full text-xs font-black uppercase tracking-wider inline-block">
                    The Origin Story
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-[#052a51] mt-3 tracking-tight leading-snug">
                    Building material shopping shouldn&apos;t stall your project for weeks.
                  </h2>
                </div>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  For decades, procuring building and interior materials in India has been plagued by deep friction:
                  opaque broker markups, inaccurate coverage estimations, unverified quality grades, and painful transit breakages
                  that halt masons and contractors on-site.
                </p>

                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  Founded in Begur, Bengaluru in 2026, <strong className="text-slate-900 font-bold">IntriHub</strong> was built
                  to fundamentally engineer this problem away. We connected certified tile manufacturing hubs (including Morbi, Gujarat)
                  and premier sanitaryware brands directly to our high-speed urban fulfillment grid.
                </p>

                {/* Old vs New Comparison Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <div className="text-xs font-bold text-rose-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Traditional Method
                    </div>
                    <ul className="text-xs text-rose-900/80 space-y-1.5 mt-2">
                      <li>• 3–7 days delivery lag on-site</li>
                      <li>• 25–40% markup via multi-layer middlemen</li>
                      <li>• High breakage with zero transit liability</li>
                      <li>• Repeated physical store visits for matching lots</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <div className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      The IntriHub Way
                    </div>
                    <ul className="text-xs text-emerald-900/80 space-y-1.5 mt-2">
                      <li>• <strong>60-minute express</strong> site delivery</li>
                      <li>• <strong>Transparent unit pricing</strong> &amp; room calculator</li>
                      <li>• <strong>Guaranteed 0% breakage</strong> pallet packaging</li>
                      <li>• <strong>Batch-matched lots</strong> with lab calibration</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Showcase (Delivery Logistics) */}
              <div className="lg:col-span-6">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 group">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/about/express-delivery.jpg"
                      alt="IntriHub 60-Minute Fast Logistics and Site Unloading"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F26522] text-xs font-black uppercase tracking-wider mb-2">
                      <Zap className="w-3.5 h-3.5" />
                      <span>60-Min Hyperlocal Fleet</span>
                    </div>
                    <h4 className="text-lg font-black leading-snug">
                      On-Demand Material Handover Direct to Construction Sites
                    </h4>
                    <p className="text-xs text-slate-200 mt-1">
                      Our specialized electric transport fleet features reinforced crates and live GPS telemetry for instant delivery tracking.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quality Standards & Precision Engineering */}
        <section className="py-16 md:py-24 bg-[#F8FAFC]">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Visual Showcase (Quality Inspection) */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 group">
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src="/about/quality-inspection.jpg"
                      alt="Precision Quality Testing of IntriHub Tiles and Designer Fixtures"
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 text-white">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-xs font-black uppercase tracking-wider mb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Grade-1 Quality Lab</span>
                    </div>
                    <h4 className="text-lg font-black leading-snug">
                      Digital Caliper &amp; Surface Flatness Verification
                    </h4>
                    <p className="text-xs text-slate-200 mt-1">
                      Strict batch inspections ensure zero lippage, precise rectangularity, and uniform glaze depth before dispatch.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Quality Features */}
              <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
                <div>
                  <span className="px-3 py-1 bg-blue-50 text-[#052a51] border border-blue-200/60 rounded-full text-xs font-black uppercase tracking-wider inline-block">
                    Material Standards
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-[#052a51] mt-3 tracking-tight leading-snug">
                    Zero Compromise on Durability, Aesthetics &amp; Fit.
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
                    Whether you are an architect designing a luxury penthouse or a homeowner renovating a kitchen,
                    consistency is paramount. Every item on IntriHub undergoes comprehensive multi-point quality validation.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      title: "Laser Flatness & Precision Edges",
                      desc: "Vitrified tiles and slab collections are calibrated with millimeter accuracy to prevent lippage and uneven grout lines.",
                      icon: CheckCircle2,
                    },
                    {
                      title: "High Abrasion & PEI Durability",
                      desc: "Heavy foot-traffic certified surfaces resistant to scratches, chemical stains, and UV discoloration.",
                      icon: Award,
                    },
                    {
                      title: "Direct Certified Manufacturer Alliances",
                      desc: "Direct contracts with top ceramic clusters in Morbi and premier brands ensure authentic warranties without gray-market dilution.",
                      icon: Building2,
                    },
                    {
                      title: "Architect Sample Kit Support",
                      desc: "Physical texture boards, mood-board swatches, and grout samples delivered to your design studio within 2 hours.",
                      icon: Sparkles,
                    },
                  ].map((feat) => (
                    <div key={feat.title} className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0">
                        <feat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{feat.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feat.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How the 60-Minute Engine Works */}
        <section className="py-16 md:py-24 bg-white border-y border-slate-100">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 bg-orange-50 text-[#F26522] border border-orange-200/60 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-3">
                Logistics Flywheel
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#052a51] tracking-tight">
                How IntriHub Powers 60-Minute Site Deliveries
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                Our proprietary supply chain software links hyper-local fulfillment centers to real-time driver routing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: "01",
                  title: "Instant Stock Lock",
                  desc: "As soon as you order on www.intrihub.com, inventory at the nearest dark hub is digitally reserved.",
                  icon: Box,
                },
                {
                  step: "02",
                  title: "Heavy Pallet Packaging",
                  desc: "Fragile tiles and sanitary items are crated in high-density foam and strapped with heavy-duty corner guards.",
                  icon: ShieldCheck,
                },
                {
                  step: "03",
                  title: "Priority Fleet Routing",
                  desc: "Dedicated commercial three-wheelers and electric vans take optimized routes avoiding Bengaluru congestion.",
                  icon: Truck,
                },
                {
                  step: "04",
                  title: "Direct Site Handover",
                  desc: "Driver verifies intact packaging, helps unload safely, and executes instantaneous digital signature.",
                  icon: FileCheck,
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="relative p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-[#F26522]/30 hover:bg-white transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-black text-[#F26522] bg-[#F26522]/10 px-2.5 py-1 rounded-lg">
                        STAGE {item.step}
                      </span>
                      <item.icon className="w-5 h-5 text-slate-400" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Specialized Material Categories */}
        <section className="py-16 md:py-24 bg-[#F8FAFC]">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 bg-blue-50 text-[#052a51] border border-blue-200/60 rounded-full text-xs font-black uppercase tracking-wider inline-block mb-3">
                Full-Spectrum Catalog
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#052a51] tracking-tight">
                Everything Your Site Demands Under One Roof
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                Source complete project requirements across 20+ specialized trade categories.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Vitrified & Designer Tiles",
                  desc: "GVT, PGVT, Moroccan encaustic, Italian marble looks, full-body vitrified, and outdoor pavers.",
                  category: "tiles",
                  tag: "High Demand",
                },
                {
                  title: "Bath & Sanitaryware",
                  desc: "Rimless wall-hung closets, brass chrome faucets, counter basins, shower columns, and cisterns.",
                  category: "sanitaryware",
                  tag: "Grade-1 Brass",
                },
                {
                  title: "Electrical & Wiring",
                  desc: "FR PVC insulated copper wires, modular switchboards, MCBs, distribution boards, and conduit pipes.",
                  category: "electrical",
                  tag: "IS Certified",
                },
                {
                  title: "Plumbing & PVC Piping",
                  desc: "CPVC & UPVC pipes, brass fittings, ball valves, solvent cements, and drainage sumps.",
                  category: "plumbing",
                  tag: "Pressure Tested",
                },
                {
                  title: "Plywood & Hardware",
                  desc: "Boiling water resistant (BWR) ply, soft-close hydraulic hinges, mortise handles, and architectural hardware.",
                  category: "plywood-hardware",
                  tag: "Termite Proof",
                },
                {
                  title: "Tile Adhesives & Grouts",
                  desc: "Polymer-modified adhesives, epoxy grouts, waterproofing membranes, and tile leveling spacers.",
                  category: "adhesives",
                  tag: "High Bond",
                },
              ].map((cat) => (
                <div
                  key={cat.title}
                  className="p-6 rounded-3xl bg-white border border-slate-200/70 shadow-xs hover:border-[#F26522] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold text-[#F26522] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                        {cat.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{cat.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">{cat.desc}</p>
                  </div>

                  <Link
                    href={`/category/${cat.category}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#052a51] hover:text-[#F26522] transition-colors"
                  >
                    <span>Browse Collection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership Team & Corporate Transparency */}
        <section className="py-16 md:py-24 bg-white border-t border-slate-100">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="px-3 py-1 bg-blue-50 text-[#052a51] text-xs font-black rounded-full uppercase tracking-wider inline-block mb-3 border border-blue-100">
                Executive Leadership
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-[#052a51] tracking-tight">
                Meet the Builders Behind IntriHub
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-3">
                Engineers, supply chain veterans, and product specialists building India&apos;s most reliable materials commerce network.
              </p>
            </div>

            {/* Leadership Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {LEADERSHIP_TEAM.map((member) => (
                <div
                  key={member.name}
                  className={`p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between ${
                    member.isFounder
                      ? "bg-gradient-to-b from-orange-50/60 via-white to-white border-orange-200 shadow-md relative"
                      : "bg-white border-slate-200/80 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Header with avatar / badge */}
                    <div className="flex items-start justify-between gap-3 mb-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                          member.isFounder
                            ? "bg-[#F26522] text-white shadow-lg shadow-orange-500/25"
                            : "bg-[#052a51] text-white"
                        }`}
                      >
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>

                      {member.isFounder ? (
                        <span className="px-3 py-1 rounded-full bg-[#F26522]/10 border border-[#F26522]/30 text-[#F26522] text-[11px] font-black uppercase tracking-wider">
                          Founder &amp; Head
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider">
                          Executive Leader
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-black text-slate-900">{member.name}</h3>
                    <p className="text-xs font-bold text-[#F26522] mt-0.5">{member.role}</p>

                    <p className="text-xs text-slate-600 leading-relaxed mt-4">{member.bio}</p>

                    {member.isFounder && (
                      <Link
                        href="/founder"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F26522] hover:underline mt-3"
                      >
                        <span>Meet Our Founder — Sahil Sheikh &rarr;</span>
                      </Link>
                    )}
                  </div>

                  {/* Actions / Direct Contacts */}
                  <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2">
                    <a
                      href={`mailto:${member.email}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <Mail size={14} className="text-[#F26522]" />
                      <span>{member.email}</span>
                    </a>

                    {member.social && (
                      <a
                        href={member.social}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} Instagram`}
                        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity shrink-0 shadow-xs"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Corporate Transparency & Verification Card */}
            <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#052a51]/10 text-[#052a51] flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Headquarters</h4>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    41, 10th A Cross Rd, Janapriya Layout, Begur, Bengaluru, Karnataka 560114, India
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Hotline &amp; WhatsApp</h4>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    +91 70901 20211 (Customer &amp; Trade Desk)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Mon–Sun, 7:00 AM – 10:00 PM IST</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Official Domain Guarantee</h4>
                  <p className="text-sm font-semibold text-slate-900 mt-1">
                    https://www.intrihub.com
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    We operate exclusively through our official domain. Beware of duplicate third-party sites.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values / What We Stand For */}
        <section className="py-16 md:py-20 bg-[#F8FAFC]">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <h3 className="text-xl sm:text-2xl font-black text-[#052a51] text-center mb-10">
              The Four Pillars That Guide Every Shipment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Grade-1 Assurance",
                  desc: "Zero compromise. Every batch undergoes strict curvature, edge calibration, and wear tests.",
                },
                {
                  icon: Truck,
                  title: "Protected Freight",
                  desc: "Specialized heavy goods packaging and pallet protection ensuring zero breakage in transit.",
                },
                {
                  icon: Palette,
                  title: "Curated Aesthetics",
                  desc: "Modern textures, Moroccan encaustic, Italian marble styles, and authentic stone finishes.",
                },
                {
                  icon: HeartHandshake,
                  title: "Direct Specialist Support",
                  desc: "Our trade architects help you estimate exact lot coverage and recommend appropriate adhesives.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 bg-white rounded-3xl border border-slate-200/80 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-2xl bg-[#F26522]/10 text-[#F26522] flex items-center justify-center mx-auto mb-4">
                    <Icon size={24} />
                  </div>
                  <h4 className="font-bold text-[#052a51] text-base mb-2">{title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Grand CTA Banner */}
        <section className="pb-16 md:pb-24 pt-4 bg-[#F8FAFC]">
          <div className="w-full max-w-[1240px] mx-auto px-5 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-r from-[#021830] via-[#052a51] to-[#0a3f78] text-white p-8 sm:p-12 md:p-16 text-center overflow-hidden shadow-2xl">
              <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#F26522]/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-400/20 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10 max-w-2xl mx-auto">
                <span className="px-3.5 py-1 rounded-full bg-white/10 text-orange-200 border border-white/15 text-xs font-bold uppercase tracking-wider inline-block mb-4">
                  Instant Procurement
                </span>
                <h3 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                  Ready to Build Your Dream Space?
                </h3>
                <p className="text-slate-200 text-sm sm:text-base mt-4 max-w-lg mx-auto leading-relaxed">
                  Browse 10,000+ curated products across 20+ trade categories and get them delivered direct to your site in 60 minutes.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/shop"
                    className="w-full sm:w-auto px-8 h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold rounded-xl active:scale-95 transition-all inline-flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
                  >
                    <span>Browse Shop Catalog</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    href="/bulk-orders"
                    className="w-full sm:w-auto px-8 h-12 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl active:scale-95 transition-all inline-flex items-center justify-center gap-2 border border-white/20"
                  >
                    <span>Bulk &amp; Architect Orders</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
