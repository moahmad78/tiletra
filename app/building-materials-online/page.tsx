import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Truck,
  ShieldCheck,
  Clock,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  ArrowRight,
  Layers,
  Zap,
  Droplets,
  Wrench,
  Square,
  Sparkles,
  Building2,
  FileText,
  ChevronDown,
  MapPin,
  PackageCheck,
  BadgePercent,
  HelpCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BASE_SITE_URL, getCanonicalUrl } from "@/lib/seo";

export const revalidate = 3600; // 1-hour ISR revalidation

const PAGE_TITLE = "Buy Building Materials Online | 60-Min Express Delivery in Bengaluru | IntriHub";
const PAGE_DESCRIPTION =
  "Order 100% genuine building & construction materials online in Bengaluru. Direct manufacturer pricing on cement, TMT steel, CPVC plumbing, vitrified tiles, electricals, false ceiling, and hardware. Fast 60-minute site delivery with GST invoice.";
const CANONICAL_URL = getCanonicalUrl("/building-materials-online");

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: CANONICAL_URL,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: CANONICAL_URL,
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/images/banners/banner-slide-1-1400.webp`,
        width: 1400,
        height: 600,
        alt: "IntriHub - Buy Building Materials Online in Bengaluru",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${BASE_SITE_URL}/images/banners/banner-slide-1-1400.webp`],
  },
};

const CORE_CATEGORIES = [
  {
    name: "Tiles, Stone & Granite",
    slug: "tiles-stone",
    icon: Layers,
    description: "Vitrified floor tiles, PGVT slabs, anti-skid bathroom tiles, and South Indian natural granite slabs.",
    popularBrands: ["Kajaria", "Simpolo", "Roff Adhesives", "Jet Black Granite"],
    image: "/images/categories/cat-tiles-stone.jpg",
    link: "/shop?category=tiles-stone",
  },
  {
    name: "Plumbing, Pipes & Sanitary",
    slug: "plumbing",
    icon: Droplets,
    description: "SDR 11 CPVC hot/cold water pipes, UPVC external lines, SWR drainage fittings, and brass taps.",
    popularBrands: ["Astral", "Ashirvad", "Supreme", "Sintex Tanks"],
    image: "/images/categories/cat-plumbing.jpg",
    link: "/shop?category=plumbing",
  },
  {
    name: "Electrical, Wires & Lighting",
    slug: "electrical",
    icon: Zap,
    description: "FRLS copper house wires, heavy PVC conduits, modular switches, metal back boxes, and LED panels.",
    popularBrands: ["Polycab", "Havells", "Schneider Electric", "Finolex"],
    image: "/images/categories/cat-electrical.jpg",
    link: "/shop?category=electrical",
  },
  {
    name: "Plywood, Laminates & Doors",
    slug: "plywood",
    icon: Square,
    description: "IS:710 Marine grade & IS:303 MR plywood, 1mm decorative laminates, and solid pine wood flush doors.",
    popularBrands: ["Greenpanel", "CenturyPly", "Greenlam", "Merino"],
    image: "/images/categories/cat-plywood.jpg",
    link: "/shop?category=plywood",
  },
  {
    name: "Hardware, Fasteners & Locks",
    slug: "hardware",
    icon: Wrench,
    description: "SS 304 ball-bearing hinges, mortise cylinder locks, self-drilling screws, and telescopic drawer channels.",
    popularBrands: ["Godrej", "Yale", "Dorset", "Hettich Compatible"],
    image: "/images/categories/cat-hardware.jpg",
    link: "/shop?category=hardware",
  },
  {
    name: "False Ceiling & Waterproofing",
    slug: "false-ceiling",
    icon: Sparkles,
    description: "Gypsum plasterboards, 0.50mm GI framing channels, POP powder, and 2-coat polymer waterproofing membranes.",
    popularBrands: ["Saint-Gobain Gyproc", "Dr. Fixit", "Fosroc", "Roff"],
    image: "/images/categories/cat-false-ceiling.jpg",
    link: "/shop?category=false-ceiling",
  },
];

const FAQS = [
  {
    q: "How does 60-minute building material delivery work in Bengaluru?",
    a: "IntriHub operates micro-fulfillment dark stores and direct verified manufacturing hubs across Bengaluru (Begur, HSR, Whitefield, Electronic City). Once an order is placed, materials are picked, verified, and dispatched via our dedicated flatbed and rapid two-wheeler/three-wheeler logistics fleet directly to your construction site within 60 minutes.",
  },
  {
    q: "Can I get GST tax invoices for commercial and residential construction projects?",
    a: "Yes, 100% of orders placed on IntriHub include a formal GST invoice with complete HSN code breakdowns, allowing builders, contractors, and homeowners to claim input tax credit (ITC) seamlessly.",
  },
  {
    q: "What building materials can I purchase online on IntriHub?",
    a: "You can order all 7 stages of building and interior materials: cement (OPC/PPC), TMT steel rebar, CPVC/UPVC plumbing pipes, vitrified floor & wall tiles, tile adhesives & epoxy grouts, electrical FRLS wiring & conduits, plywood & laminates, false ceiling channels, and architectural hardware.",
  },
  {
    q: "Is there a minimum order quantity (MOQ) for online orders?",
    a: "No! Whether you need 1 bag of tile adhesive for a quick site patch-up or 200 bags of cement and 5,000 sq.ft of vitrified tiles for a multi-floor villa project, IntriHub fulfills both instant retail needs and scheduled bulk project orders.",
  },
  {
    q: "How do IntriHub online prices compare to local hardware and tile shops?",
    a: "IntriHub sources directly from authorized primary manufacturers and brand factories, eliminating multi-tier broker and commission markups. You receive direct transparent rates published openly online with no hidden bargaining or arbitrary pricing.",
  },
  {
    q: "Do you offer delivery outside Bengaluru across India?",
    a: "Yes! While Bengaluru enjoys our signature 60-minute rapid delivery, IntriHub provides 3-7 day express Pan-India road and freight delivery for all states across India with real-time transit tracking.",
  },
  {
    q: "What payment methods are supported for construction material orders?",
    a: "We support instant online checkout via Razorpay (UPI, Credit/Debit Cards, Net Banking, EMI) as well as direct corporate NEFT/RTGS bank transfers for large bulk contractor orders.",
  },
  {
    q: "What if materials arrive damaged or excess unopened boxes remain?",
    a: "Every delivery is inspected with our OTP-verified handoff. In the rare event of transit damage, instant replacement is dispatched immediately. We also offer easy returns on standard unopened tile boxes and hardware items per our return policy.",
  },
];

const BENGALURU_DELIVERY_HUBS = [
  "Begur",
  "HSR Layout",
  "Koramangala",
  "Whitefield",
  "Indiranagar",
  "Electronic City",
  "Sarjapur Road",
  "Bellandur",
  "Marathahalli",
  "JP Nagar",
  "Jayanagar",
  "BTM Layout",
  "Bannerghatta Road",
  "Hebbal",
  "Yelahanka",
  "Thanisandra",
  "Kanakapura Road",
  "Rajarajeshwari Nagar",
];

export default function BuildingMaterialsOnlinePage() {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: BASE_SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Building Materials Online",
        item: CANONICAL_URL,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  const storeSchema = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "IntriHub - Online Building Materials & Interior Supplies",
    url: CANONICAL_URL,
    logo: `${BASE_SITE_URL}/images/brand/logo.png`,
    image: `${BASE_SITE_URL}/images/banners/banner-slide-1-1400.webp`,
    description: PAGE_DESCRIPTION,
    telephone: "+91-9876543210",
    address: {
      "@type": "PostalAddress",
      streetAddress: "41, 10th A Cross Rd, Janapriya Layout, Begur",
      addressLocality: "Bengaluru",
      addressRegion: "Karnataka",
      postalCode: "560114",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "12.8785",
      longitude: "77.6258",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "07:00",
      closes: "22:00",
    },
    priceRange: "₹₹",
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex flex-col antialiased selection:bg-amber-200">
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={faqSchema} />
      <JsonLd data={storeSchema} />

      <Header />

      {/* Hi-Vis Yellow Fast Delivery Announcement Bar */}
      <div className="bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 text-center text-xs md:text-sm border-b border-amber-500/30 flex items-center justify-center gap-2 shadow-sm">
        <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
        <span>⚡ <strong>60-Minute Fast Site Delivery</strong> across Bengaluru</span>
        <span className="hidden sm:inline text-amber-900">•</span>
        <span className="hidden sm:inline">3-7 Days Express Pan-India Delivery</span>
        <span className="hidden md:inline text-amber-900">•</span>
        <span className="hidden md:inline">100% Genuine Brands with GST Invoices</span>
      </div>

      <main className="flex-grow">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-white to-[#FDFBF7] border-b border-stone-200/70 py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Column: Value Prop & CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-300/80 text-amber-950 text-xs font-semibold tracking-wide uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Direct Factory Sourcing • Zero Middlemen Markups
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                  Buy <span className="text-amber-600 underline decoration-amber-400 decoration-wavy underline-offset-4">Building Materials Online</span> with 60-Minute Delivery
                </h1>

                <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
                  Order verified cement, TMT steel, CPVC plumbing, vitrified floor tiles, electricals, false ceiling, and architectural hardware from top manufacturers. Live stock, direct transparent pricing, and instant doorstep site dispatch across Bengaluru.
                </p>

                {/* Key Benefit Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center text-center">
                    <Truck className="w-5 h-5 text-amber-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900">60-Min Dispatch</span>
                    <span className="text-[10px] text-slate-700 font-medium">Bengaluru Core</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center text-center">
                    <BadgePercent className="w-5 h-5 text-emerald-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900">Direct Pricing</span>
                    <span className="text-[10px] text-slate-700 font-medium">No Broker Markup</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center text-center">
                    <FileText className="w-5 h-5 text-blue-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900">100% GST Invoice</span>
                    <span className="text-[10px] text-slate-700 font-medium">ITC Compliant</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center text-center">
                    <PackageCheck className="w-5 h-5 text-purple-600 mb-1" />
                    <span className="text-xs font-bold text-slate-900">Genuine Brands</span>
                    <span className="text-[10px] text-slate-700 font-medium">ISI & ISO Certified</span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4">
                  <Link
                    href="/shop"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-950 text-white font-bold text-sm shadow-md hover:bg-amber-600 hover:text-white transition-all transform hover:-translate-y-0.5"
                  >
                    <span>Browse All Materials</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/guides/building-material-list-for-house-construction-bengaluru"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border-2 border-stone-300 text-slate-800 font-bold text-sm shadow-sm hover:border-amber-500 hover:text-amber-600 transition-all"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <span>View Construction Checklist</span>
                  </Link>
                  <a
                    href="https://wa.me/919876543210?text=Hi%20IntriHub,%20I%20need%20a%20quote%20for%20building%20materials%20in%20Bengaluru"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-sm hover:bg-emerald-700 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Quote</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl bg-white p-4 sm:p-6 border border-stone-200/80 shadow-xl space-y-4">
                  <div className="relative h-60 sm:h-72 w-full rounded-xl overflow-hidden bg-stone-100">
                    <Image
                      src="/images/categories/cat-tiles-stone.jpg"
                      alt="Buy Building Materials Online in Bengaluru"
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                      <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">Live Inventory Dispatch</span>
                      <h3 className="text-lg font-bold">Bangalore&apos;s Fastest Construction Marketplace</h3>
                      <p className="text-xs text-stone-200">Zero site downtime • Flatbed & express fleet on standby</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-semibold border-b border-stone-100 pb-2">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-amber-600" /> Average Bengaluru Dispatch</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">42 Minutes</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-700 font-semibold border-b border-stone-100 pb-2">
                      <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-blue-600" /> Active Delivery Zones</span>
                      <span>18+ Bengaluru Hubs</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-700 font-semibold">
                      <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-purple-600" /> Direct Factory Guarantee</span>
                      <span>100% Genuine with Warranty</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 6 CORE CATEGORIES SECTION */}
        <section className="py-16 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Shop Building & Construction Materials by Category
              </h2>
              <p className="text-slate-700 text-sm sm:text-base font-normal">
                Direct access to high-grade construction, plumbing, electrical, and finishing materials engineered for residential villas, apartments, and commercial projects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {CORE_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                return (
                  <div
                    key={cat.slug}
                    className="group bg-[#FDFBF7] rounded-2xl border border-stone-200/90 p-5 hover:border-amber-400 hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="relative h-44 w-full rounded-xl overflow-hidden bg-stone-100">
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 380px"
                        />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                          <IconComponent className="w-5 h-5 text-amber-600" />
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-700 mt-1 leading-relaxed font-normal">
                          {cat.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-stone-200/70">
                        <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider mb-1.5">
                          Top Brands:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.popularBrands.map((b) => (
                            <span
                              key={b}
                              className="text-[11px] bg-white border border-stone-200 px-2 py-0.5 rounded-md text-slate-800 font-medium"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-200/80 flex items-center justify-between">
                      <Link
                        href={cat.link}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        <span>Explore {cat.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-900 text-white text-xs sm:text-sm font-bold hover:bg-amber-600 transition-colors"
              >
                <span>View All 28 Building Material Categories</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* COMPARISON: TRADITIONAL VS INTRIHUB */}
        <section className="py-16 bg-[#FDFBF7] border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Why Buy Construction Materials Online from IntriHub?
              </h2>
              <p className="text-slate-700 text-sm sm:text-base font-normal">
                Eliminating the pain points of traditional hardware markets with transparent tech, verified grades, and rapid delivery.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Traditional Offline Markets */}
              <div className="bg-red-50/60 rounded-2xl border border-red-200/80 p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-700 font-bold text-base">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Traditional Offline Material Sourcing
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Opaque Pricing:</strong> Arbitrary pricing based on negotiations with multiple middleman broker commissions.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Costly Site Downtime:</strong> 2 to 4-day delivery delays while masons, plumbers, and carpenters sit idle on site.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>Unverified Sub-Grades:</strong> Risk of secondary duplicate rebar, diluted adhesives, or fake commercial brand labels.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-red-500 font-bold">✕</span>
                    <span><strong>No Tax Invoices:</strong> Unorganized cash receipts without GST breakdown for Input Tax Credit.</span>
                  </li>
                </ul>
              </div>

              {/* IntriHub Online Platform */}
              <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  IntriHub Online Direct Marketplace
                </div>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-800">
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Direct Transparent Rates:</strong> Published upfront pricing directly from certified primary manufacturers.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>60-Minute Fast Logistics:</strong> Immediate site delivery across Bengaluru to keep construction running non-stop.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>100% Genuine Certification:</strong> Standard factory-sealed packaging with ISI, ISO, and manufacturer test certificates.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="text-emerald-600 font-bold">✓</span>
                    <span><strong>Complete GST Billing:</strong> Automated digital invoices with HSN codes ready for immediate tax filing.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3-STEP ORDERING PROCESS */}
        <section className="py-16 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                How to Order Building Materials Online in 3 Steps
              </h2>
              <p className="text-slate-700 text-sm sm:text-base font-normal">
                Streamlined ordering designed for busy architects, site engineers, contractors, and individual home builders.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-stone-200 relative text-center space-y-3">
                <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg mx-auto shadow-sm">
                  1
                </div>
                <h3 className="text-base font-bold text-slate-900">Select Required Materials</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  Search by category, brand, or material specification. Use our integrated tile box and material coverage calculators to estimate precise quantities.
                </p>
              </div>

              <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-stone-200 relative text-center space-y-3">
                <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg mx-auto shadow-sm">
                  2
                </div>
                <h3 className="text-base font-bold text-slate-900">Live Inventory & GST Checkout</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  View real-time stock availability across Bengaluru fulfillment centers. Pay securely via Razorpay (UPI/Card/NetBanking) or corporate invoice transfer.
                </p>
              </div>

              <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-stone-200 relative text-center space-y-3">
                <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center font-black text-lg mx-auto shadow-sm">
                  3
                </div>
                <h3 className="text-base font-bold text-slate-900">60-Min Site Delivery</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-normal">
                  Track live GPS dispatch direct to your construction site. Inspect goods and verify delivery with OTP handoff for complete peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED TECHNICAL GUIDE BANNER */}
        <section className="py-12 bg-gradient-to-r from-slate-900 to-stone-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Technical Construction Guide</span>
                <h3 className="text-xl sm:text-2xl font-black">
                  Building a New Home in Bengaluru? Read Our Complete 7-Stage Checklist
                </h3>
                <p className="text-xs sm:text-sm text-stone-300">
                  Comprehensive guide covering cement grades (OPC vs PPC), TMT steel specifications, CPVC vs UPVC plumbing, and tile wastage buffering.
                </p>
              </div>
              <Link
                href="/guides/building-material-list-for-house-construction-bengaluru"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm hover:bg-amber-400 transition-colors whitespace-nowrap shadow-md"
              >
                <span>Read Bengaluru Checklist</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* BENGALURU COVERAGE AREAS */}
        <section className="py-12 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                60-Minute Fast Delivery Active Across Bengaluru Zones
              </h2>
            </div>
            <p className="text-xs text-slate-700 mb-6 font-normal">
              Direct site delivery dispatched from our local fulfillment hubs across key construction corridors:
            </p>
            <div className="flex flex-wrap gap-2">
              {BENGALURU_DELIVERY_HUBS.map((hub) => (
                <span
                  key={hub}
                  className="text-xs bg-[#FDFBF7] border border-stone-200 px-3 py-1.5 rounded-lg text-slate-800 font-medium hover:border-amber-400 transition-colors"
                >
                  📍 {hub}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FAQS ACCORDION SECTION */}
        <section className="py-16 bg-[#FDFBF7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Everything You Need to Know About Buying Building Materials Online
              </h2>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <details
                  key={idx}
                  className="group bg-white rounded-2xl border border-stone-200/90 p-5 open:shadow-md transition-all"
                >
                  <summary className="flex items-center justify-between font-bold text-slate-900 text-sm sm:text-base cursor-pointer list-none">
                    <span>{faq.q}</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 group-open:rotate-180 transition-transform duration-200 flex-shrink-0 ml-3" />
                  </summary>
                  <p className="text-xs sm:text-sm text-slate-700 mt-3 pt-3 border-t border-stone-100 leading-relaxed font-normal">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>

            {/* Direct Support Card */}
            <div className="mt-12 bg-white rounded-2xl border border-stone-200 p-6 text-center space-y-3 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">Have a Custom Bill of Quantities (BOQ) or Bulk Requirement?</h3>
              <p className="text-xs text-slate-700 max-w-xl mx-auto font-normal">
                Our civil and materials engineering team provides free BOQ quantity estimation, batch coordination, and corporate site dispatch scheduling.
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <a
                  href="tel:+919876543210"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-xs hover:bg-amber-600 transition-colors"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call Material Specialist</span>
                </a>
                <a
                  href="https://wa.me/919876543210?text=Hi%20IntriHub,%20I%20have%20a%20bulk%20BOQ%20list%20for%20construction%20materials"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send BOQ on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
