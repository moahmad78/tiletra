import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Truck,
  Sparkles,
  Layers,
  Ruler,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  Wrench,
  Paintbrush,
  Home,
  Flame,
  Tag,
  Share2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_SITE_URL } from "@/lib/seo";
import DiwaliInteractiveChecklist from "@/components/guides/DiwaliInteractiveChecklist";

export const metadata: Metadata = {
  title: "Diwali Home Renovation 2026 Checklist",
  description:
    "Diwali is on 8 November 2026. Use this 4-week plan and interior materials checklist to renovate your home on time, with delivery in Bengaluru.",
  alternates: {
    canonical: `${BASE_SITE_URL}/guides/diwali-home-renovation-2026-materials-checklist`,
  },
  openGraph: {
    title: "Diwali Home Renovation 2026 Checklist | IntriHub",
    description:
      "Diwali is on 8 November. Start now with this simple timeline and room-by-room materials checklist.",
    url: `${BASE_SITE_URL}/guides/diwali-home-renovation-2026-materials-checklist`,
    type: "article",
    publishedTime: "2026-10-08T00:00:00.000Z",
    modifiedTime: "2026-10-08T00:00:00.000Z",
    authors: ["IntriHub Team"],
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/images/guides/diwali-renovation-hero.jpg`,
        width: 1200,
        height: 630,
        alt: "Home renovation before Diwali with fresh paint and new lights",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diwali Home Renovation 2026: Materials Checklist and 4-Week Plan",
    description:
      "Diwali is on 8 November. Start now with this simple timeline and room-by-room materials checklist.",
    images: [`${BASE_SITE_URL}/images/guides/diwali-renovation-hero.jpg`],
  },
};

const guideFaqs = [
  {
    question: "When should I start my Diwali home renovation?",
    answer:
      "Ideally four to five weeks before. With Diwali on 8 November 2026, starting this week gives you time for repairs, painting and fittings without a last-minute rush.",
  },
  {
    question: "What should I do first: painting or repairs?",
    answer:
      "Repairs first. Fix cracks, damp patches, leaks and electrical issues before painting, so you do not have to redo the work.",
  },
  {
    question: "How much extra tile should I order?",
    answer:
      "Commonly 5 to 10% extra, from the same batch, to cover cutting waste and future repairs. Confirm with your tile fitter.",
  },
  {
    question: "Can I get building and interior materials delivered in Bengaluru quickly?",
    answer:
      "Yes. IntriHub offers 60-minute delivery in Bengaluru. Outside Bengaluru, delivery currently takes 3 to 7 days.",
  },
  {
    question: "What is a low-cost way to refresh my home for Diwali?",
    answer:
      "Paint one feature wall, replace old switch plates and handles, fix visible damage, and improve lighting.",
  },
];

export default function DiwaliHomeRenovationGuidePage() {
  const pageUrl = `${BASE_SITE_URL}/guides/diwali-home-renovation-2026-materials-checklist`;

  // Schema Block combining Article, BreadcrumbList, and the required FAQPage JSON-LD
  const unifiedSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        isPartOf: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        headline: "Diwali Home Renovation 2026: Interior Materials Checklist and 4-Week Timeline",
        description:
          "Diwali is on 8 November 2026. Use this 4-week plan and interior materials checklist to renovate your home on time, with delivery in Bengaluru.",
        image: [`${BASE_SITE_URL}/images/guides/diwali-renovation-hero.jpg`],
        datePublished: "2026-10-08T00:00:00.000Z",
        dateModified: "2026-10-08T00:00:00.000Z",
        mainEntityOfPage: pageUrl,
        author: {
          "@type": "Organization",
          name: "IntriHub Team",
          url: BASE_SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
          },
        },
        publisher: {
          "@type": "Organization",
          name: "IntriHub",
          url: BASE_SITE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_SITE_URL}/logo/intri-web-logo.png`,
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
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
            name: "Guides",
            item: `${BASE_SITE_URL}/guides`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Diwali Home Renovation 2026",
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "When should I start my Diwali home renovation?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Ideally four to five weeks before. With Diwali on 8 November 2026, starting this week gives you time for repairs, painting and fittings without a last-minute rush.",
            },
          },
          {
            "@type": "Question",
            name: "What should I do first: painting or repairs?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Repairs first. Fix cracks, damp patches, leaks and electrical issues before painting, so you do not have to redo the work.",
            },
          },
          {
            "@type": "Question",
            name: "How much extra tile should I order?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Commonly 5 to 10% extra, from the same batch, to cover cutting waste and future repairs. Confirm with your tile fitter.",
            },
          },
          {
            "@type": "Question",
            name: "Can I get building and interior materials delivered in Bengaluru quickly?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. IntriHub offers 60-minute delivery in Bengaluru. Outside Bengaluru, delivery currently takes 3 to 7 days.",
            },
          },
          {
            "@type": "Question",
            name: "What is a low-cost way to refresh my home for Diwali?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Paint one feature wall, replace old switch plates and handles, fix visible damage, and improve lighting.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(unifiedSchema) }}
      />

      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <article className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 flex-wrap"
          >
            <Link href="/" className="hover:text-[#052A51] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link href="/guides" className="hover:text-[#052A51] transition-colors">
              Guides
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-medium truncate max-w-[280px] sm:max-w-md">
              Diwali Home Renovation 2026
            </span>
          </nav>

          {/* Article Header Card */}
          <header className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xs mb-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#052A51]/10 text-[#052A51] text-xs font-bold uppercase tracking-wider">
                <Tag size={13} />
                Guides / Interior and Renovation
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 text-amber-900 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} className="text-amber-600" />
                Festive Home Edition 2026
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Diwali Home Renovation 2026: Interior Materials Checklist and 4-Week Timeline
            </h1>

            {/* Author & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#052A51] to-[#093A6D] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  I
                </div>
                <div>
                  <p className="font-bold text-slate-900">IntriHub Team</p>
                  <p className="text-xs text-slate-500">Interior Sourcing &amp; Technical Desk</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar size={14} className="text-[#FF9900]" />
                  Last updated: 8 October 2026
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock size={14} className="text-[#052A51]" />
                  6 min read
                </span>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden mt-6 bg-slate-100 border border-slate-200 shadow-xs">
              <Image
                src="/images/guides/diwali-renovation-hero.jpg"
                alt="Home renovation before Diwali with fresh paint and new lights"
                width={1200}
                height={630}
                priority={true}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Introductory Callout */}
            <div className="mt-8 p-6 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border-l-4 border-[#FF9900] rounded-r-2xl space-y-3">
              <p className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed">
                Diwali falls on Sunday, 8 November 2026. That is about four weeks away, which is enough time for a proper home refresh if you start now, and too little time if you wait until the last week, when everyone else is buying paint, lights and fittings at the same time.
              </p>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                This guide gives you a simple four-week plan, a room-by-room materials checklist, and tips to avoid the common festive-season mistakes.
              </p>
            </div>

            {/* Table of Contents */}
            <div className="mt-8 p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-2">
                <Layers size={16} className="text-[#052A51]" />
                In this guide
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm font-semibold text-[#052A51]">
                <a href="#why-start-this-week" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  1. Why start this week
                </a>
                <a href="#4-week-timeline" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  2. Your 4-week timeline
                </a>
                <a href="#room-by-room-checklist" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  3. Room-by-room materials checklist
                </a>
                <a href="#small-upgrades" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  4. Small upgrades that make a big difference
                </a>
                <a href="#mistakes-to-avoid" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  5. Mistakes to avoid
                </a>
                <a href="#how-intrihub-helps" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  6. How IntriHub helps
                </a>
                <a href="#interactive-checklist" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  Quick Diwali renovation checklist
                </a>
                <a href="#faqs" className="hover:text-[#FF9900] hover:underline flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#052A51]" />
                  Frequently asked questions
                </a>
              </div>
            </div>
          </header>

          {/* Main Article Body */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xs mb-10 text-slate-800 space-y-14">
            
            {/* Section 1: Why start this week */}
            <section id="why-start-this-week" className="space-y-6 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#052A51] text-white flex items-center justify-center text-sm font-bold">1</span>
                Why start this week
              </h2>

              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Beginning your renovation four weeks out gives you the breathing room needed for quality craftsmanship and smooth logistics:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#052A51]/30 transition-colors space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <Wrench size={18} className="text-[#052A51]" />
                    <h3>Contractors get busy</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Painters, carpenters, electricians and tile workers are in demand before Diwali. The earlier you book, the better your choice of dates.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#052A51]/30 transition-colors space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <Truck size={18} className="text-[#FF9900]" />
                    <h3>Delivery gets crowded</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Order volumes usually rise before festivals, so deliveries can take longer closer to the date.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#052A51]/30 transition-colors space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <Paintbrush size={18} className="text-[#052A51]" />
                    <h3>Paint and finishing need time</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Walls must dry between coats, and a house needs a day or two to air out before guests arrive.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#052A51]/30 transition-colors space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                    <ShieldCheck size={18} className="text-emerald-600" />
                    <h3>You get a buffer</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    If something is damaged or out of stock, you still have time to replace it.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Your 4-week timeline */}
            <section id="4-week-timeline" className="space-y-6 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#052A51] text-white flex items-center justify-center text-sm font-bold">2</span>
                Your 4-week timeline
              </h2>

              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Follow this structured 4-week roadmap to coordinate labour and materials without site bottlenecks:
              </p>

              {/* Timeline Graphic Image */}
              <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs my-4">
                <Image
                  src="/images/guides/diwali-renovation-timeline.jpg"
                  alt="4-week Diwali home renovation timeline"
                  width={1200}
                  height={630}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Table Container */}
              <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 shadow-xs my-6">
                <table className="w-full text-left text-sm border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold">
                      <th className="p-4 w-28">Week</th>
                      <th className="p-4 w-36">Dates (approx.)</th>
                      <th className="p-4">What to do</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">Week 1</td>
                      <td className="p-4 font-medium text-amber-700">8 to 14 Oct</td>
                      <td className="p-4 leading-relaxed">
                        Decide scope and budget. Measure rooms. Book painter, electrician and carpenter. Choose colours, tiles and fittings.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">Week 2</td>
                      <td className="p-4 font-medium text-amber-700">15 to 21 Oct</td>
                      <td className="p-4 leading-relaxed">
                        Order materials. Do repairs first: wall cracks, seepage, leaking taps, loose tiles. Do any electrical or plumbing changes now.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">Week 3</td>
                      <td className="p-4 font-medium text-amber-700">22 to 28 Oct</td>
                      <td className="p-4 leading-relaxed">
                        Painting and tiling work. Follow the drying times on the product instructions between coats.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-slate-900">Week 4</td>
                      <td className="p-4 font-medium text-amber-700">29 Oct to 7 Nov</td>
                      <td className="p-4 leading-relaxed">
                        Fit lights, switches, handles, fittings and curtains. Deep clean. Final touch-ups. Air the house.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Crucial Construction Cutoff Notice */}
              <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-sm font-semibold flex items-center gap-3">
                <CheckCircle2 size={18} className="text-[#052A51] shrink-0" />
                <span>
                  Leave Diwali week for decoration and cleaning only, not for construction work.
                </span>
              </div>

              {/* Pro-Tip Box */}
              <div className="p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-800 text-sm sm:text-base leading-relaxed flex items-start gap-3">
                <Lightbulb size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950 font-bold block mb-1">Tip for tight timelines:</strong>
                  If your timeline is tight, do repairs and the most visible rooms first (living room and entrance), and finish the rest after the festival.
                </div>
              </div>
            </section>

            {/* Section 3: Room-by-room materials checklist */}
            <section id="room-by-room-checklist" className="space-y-6 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#052A51] text-white flex items-center justify-center text-sm font-bold">3</span>
                Room-by-room materials checklist
              </h2>

              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                Consolidate your procurement across key living spaces to prevent missing hardware or mismatched finishes:
              </p>

              {/* Flat Lay Materials Image */}
              <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs my-4">
                <Image
                  src="/images/guides/diwali-renovation-materials.jpg"
                  alt="Interior materials checklist for Diwali home makeover in Bengaluru"
                  width={1200}
                  height={630}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Room Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
                {/* Living Room */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Home size={18} className="text-[#052A51]" />
                    Living room
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Interior wall paint, primer and putty</li>
                    <li>Modular switches and sockets (replace old, yellowed plates)</li>
                    <li>Lights: ceiling lights, cove or strip lights, wall lights</li>
                    <li>Skirting or wall panels (optional)</li>
                  </ul>
                </div>

                {/* Kitchen */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Sparkles size={18} className="text-[#FF9900]" />
                    Kitchen
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Tiles for backsplash or floor refresh</li>
                    <li>Taps, sink fittings and waste couplings</li>
                    <li>Cabinet handles, hinges and channels</li>
                    <li>Electrical sockets for new appliances</li>
                  </ul>
                </div>

                {/* Bathrooms */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Layers size={18} className="text-[#052A51]" />
                    Bathrooms
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Anti-skid floor tiles</li>
                    <li>CP fittings: taps, shower, mixer</li>
                    <li>Sealant and tile adhesive for repairs</li>
                    <li>Pipes and fittings if any leak needs fixing</li>
                  </ul>
                </div>

                {/* Bedrooms */}
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Paintbrush size={18} className="text-[#052A51]" />
                    Bedrooms
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Paint and putty</li>
                    <li>Switches and fan regulators</li>
                    <li>Wardrobe hardware: hinges, handles, locks</li>
                  </ul>
                </div>

                {/* Entrance and Balcony (Span 2 cols on md) */}
                <div className="md:col-span-2 p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                    <Flame size={18} className="text-[#FF9900]" />
                    Entrance and balcony
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-slate-700 list-disc pl-5">
                    <li>Name plate, door handles and locks</li>
                    <li>Exterior-grade paint or waterproof coating</li>
                    <li>Outdoor lights and weatherproof fittings</li>
                  </ul>
                </div>
              </div>

              {/* Quantity Confirmation Warning Box */}
              <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 text-slate-800 text-sm leading-relaxed flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950 font-bold block mb-1">Quantity Verification Checklist:</strong>
                  Before you order, ask your contractor to confirm the quantity for each item and add a small extra for wastage (for tiles, commonly 5 to 10% from the same batch).
                </div>
              </div>
            </section>

            {/* Section 4: Small upgrades that make a big difference */}
            <section id="small-upgrades" className="space-y-6 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#052A51] text-white flex items-center justify-center text-sm font-bold">4</span>
                Small upgrades that make a big difference
              </h2>

              <p className="text-base sm:text-lg leading-relaxed text-slate-700">
                If your budget is limited, these upgrades change how a home looks without major work:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-[#FF9900]/15 text-[#FF9900] flex items-center justify-center font-bold mb-3">
                    1
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Feature Wall Refresh</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Fresh paint on one feature wall instead of the whole house.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-[#052A51]/15 text-[#052A51] flex items-center justify-center font-bold mb-3">
                    2
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Switches &amp; Plates</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    New switch plates and lights, which instantly modernise a room.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-[#052A51]/15 text-[#052A51] flex items-center justify-center font-bold mb-3">
                    3
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Hardware Upgrades</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Replacing old handles, taps and door hardware.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-8 h-8 rounded-lg bg-[#052A51]/15 text-[#052A51] flex items-center justify-center font-bold mb-3">
                    4
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Repairing Surfaces</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Fixing visible cracks and damp patches before painting.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 sm:col-span-2 lg:col-span-1">
                  <div className="w-8 h-8 rounded-lg bg-[#FF9900]/15 text-[#FF9900] flex items-center justify-center font-bold mb-3">
                    5
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">Warm Ambient Lighting</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Better lighting in the living room and entrance.
                  </p>
                </div>
              </div>

              {/* Verified Inspiration Link Callout */}
              <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 text-sm sm:text-base flex items-center justify-between gap-4 flex-wrap">
                <span>
                  For ideas, see our{" "}
                  <Link
                    href="/shop"
                    className="text-[#052A51] font-bold underline hover:text-[#FF9900] transition-colors"
                  >
                    Interior Inspiration gallery
                  </Link>
                  .
                </span>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#052A51] hover:text-[#FF9900]"
                >
                  Explore gallery <ArrowRight size={14} />
                </Link>
              </div>
            </section>

            {/* Section 5: Mistakes to avoid */}
            <section id="mistakes-to-avoid" className="space-y-6 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center text-sm font-bold">5</span>
                Mistakes to avoid
              </h2>

              <div className="space-y-3.5">
                <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-start gap-3.5">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-950 text-sm sm:text-base">
                      Painting before repairs
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                      Fix cracks and seepage first, or the new paint will peel.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-start gap-3.5">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-950 text-sm sm:text-base">
                      Ordering tiles without extra
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                      A later batch can differ in shade. Always allocate 5 to 10% cutting buffer.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-start gap-3.5">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-950 text-sm sm:text-base">
                      Waiting for the last week
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                      Prices of labour, delivery slots and stock are all tighter then.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-start gap-3.5">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-950 text-sm sm:text-base">
                      Skipping the electrical check
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                      Old wiring and loose sockets are a safety risk, especially with festive lighting.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-red-50/60 border border-red-200/80 flex items-start gap-3.5">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-red-950 text-sm sm:text-base">
                      Mixing too many colours and finishes
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 mt-0.5 leading-relaxed">
                      Keep a simple palette so rooms look consistent.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: How IntriHub helps */}
            <section id="how-intrihub-helps" className="space-y-6 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-[#052A51] text-white flex items-center justify-center text-sm font-bold">6</span>
                How IntriHub helps
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#052A51]" />
                    Everything in one place
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Paint-ready materials, electrical items, tiles, plumbing, plywood, hardware and furniture, so you do not run between multiple shops.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#052A51]" />
                    Browse and compare online
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Explore{" "}
                    <Link
                      href="/building-materials-online"
                      className="text-[#052A51] font-bold underline hover:text-[#FF9900]"
                    >
                      building materials online
                    </Link>{" "}
                    at your own pace.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
                    <Truck size={18} className="text-[#FF9900]" />
                    60-minute delivery in Bengaluru
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Order what each stage needs, right when you need it, instead of stockpiling.
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-[#052A51]" />
                    Pan-India delivery
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Outside Bengaluru, delivery currently takes 3 to 7 days, so order early for your city.
                  </p>
                </div>
              </div>

              {/* Master Procurement CTA Box */}
              <div className="p-8 rounded-3xl bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#021830] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 my-8">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl font-black">
                    Ready to refresh your home for Diwali?
                  </h3>
                  <p className="text-slate-200 text-sm max-w-xl">
                    Source paint, tiles, electricals, and CP fittings with 60-minute doorstep delivery across Bengaluru.
                  </p>
                </div>

                <Link
                  href="/building-materials-online"
                  className="w-full md:w-auto px-7 py-3.5 rounded-xl bg-[#FF9900] hover:bg-[#FF8800] text-[#052A51] font-extrabold text-sm transition-all shadow-md text-center flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <span>Shop building and interior materials on IntriHub</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </section>

            {/* Interactive Checklist Component */}
            <section id="interactive-checklist" className="scroll-mt-28">
              <DiwaliInteractiveChecklist />
            </section>

            {/* FAQs Section */}
            <section id="faqs" className="space-y-6 pt-4 scroll-mt-28">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
                <HelpCircle size={24} className="text-[#052A51]" />
                Frequently asked questions
              </h2>

              <div className="space-y-4">
                {guideFaqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 hover:border-[#052A51]/30 transition-colors"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {faq.question}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-slate-500 italic mt-6 leading-relaxed">
                Disclaimer: Timelines and quantities are general guidance. Confirm drying times from the product instructions and quantities with your contractor.
              </p>
            </section>

          </div>

          {/* Navigation Back to Guides Hub */}
          <div className="flex items-center justify-between py-6 border-t border-slate-200">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#052A51] hover:text-[#FF9900] transition-colors"
            >
              <ChevronRight size={16} className="rotate-180" />
              <span>Back to all Guides</span>
            </Link>
            <Link
              href="/building-materials-online"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#052A51] hover:text-[#FF9900] transition-colors"
            >
              <span>Explore Building Materials Online</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}
