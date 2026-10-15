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
  Hammer,
  DoorOpen,
  Boxes,
  Compass,
  FileText,
  Store,
  Share2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Hardware Material Online India: Buying Guide & Checklist",
  description:
    "Buy hardware material online in India: what to check, how to compare prices, mistakes to avoid, and fast delivery in Bengaluru.",
  alternates: {
    canonical: `${BASE_SITE_URL}/guides/hardware-material-online-buying-guide-india`,
  },
  openGraph: {
    title: "Hardware Material Online in India: A Practical Buying Guide",
    description:
      "What to check before you buy hardware online, and how to avoid common mistakes.",
    url: `${BASE_SITE_URL}/guides/hardware-material-online-buying-guide-india`,
    type: "article",
    publishedTime: "2026-10-14T00:00:00.000Z",
    modifiedTime: "2026-10-14T00:00:00.000Z",
    authors: ["IntriHub"],
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/images/categories/cat-hardware-fittings.jpg`,
        width: 1200,
        height: 630,
        alt: "Hardware material online in India: hinges, screws and door handles",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hardware Material Online in India: A Practical Buying Guide",
    description:
      "What to check before you buy hardware online, and how to avoid common mistakes.",
    images: [`${BASE_SITE_URL}/images/categories/cat-hardware-fittings.jpg`],
  },
};

const guideFaqs = [
  {
    question: "Can I buy hardware material online in India?",
    answer:
      "Yes. You can order fasteners, door and cabinet hardware, tools, plumbing and electrical accessories online. Check size, material and return terms before ordering.",
  },
  {
    question: "What should I check before buying hardware online?",
    answer:
      "Check size and dimensions, material and finish, brand, quantity, compatibility with existing parts, return terms, and keep the invoice.",
  },
  {
    question: "How much extra should I order for screws and bolts?",
    answer:
      "Commonly 5 to 10% extra, since small fasteners get lost or damaged.",
  },
  {
    question: "Can I get hardware delivered quickly in Bengaluru?",
    answer:
      "Yes. IntriHub offers 60-minute delivery in Bengaluru. Outside Bengaluru, delivery currently takes 3 to 7 days.",
  },
  {
    question: "Which material is best for bathroom and outdoor hardware?",
    answer:
      "Rust-resistant materials such as stainless steel or brass are commonly used for wet and outdoor areas.",
  },
];

export default function HardwareMaterialOnlineBuyingGuidePage() {
  const pageUrl = `${BASE_SITE_URL}/guides/hardware-material-online-buying-guide-india`;

  // Unified single application/ld+json graph schema
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
        headline: "Hardware Material Online in India: A Practical Buying Guide",
        description:
          "Buy hardware material online in India: what to check, how to compare prices, mistakes to avoid, and fast delivery in Bengaluru.",
        inLanguage: "en-IN",
        mainEntityOfPage: pageUrl,
        datePublished: "2026-10-14T00:00:00.000Z",
        dateModified: "2026-10-14T00:00:00.000Z",
        author: {
          "@type": "Organization",
          name: "IntriHub",
          url: BASE_SITE_URL,
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
        image: {
          "@type": "ImageObject",
          url: `${BASE_SITE_URL}/images/categories/cat-hardware-fittings.jpg`,
          width: 1200,
          height: 630,
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: guideFaqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
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
            name: "Hardware Material Online India Guide",
            item: pageUrl,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header />

      {/* JSON-LD Graph Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(unifiedSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="bg-white border-b border-slate-200 py-3 text-xs text-slate-500"
      >
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-1.5 flex-wrap">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <Link href="/guides" className="hover:text-blue-600 transition-colors">
            Guides
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-medium truncate max-w-[280px] sm:max-w-none">
            Hardware Material Online Guide
          </span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full">
        {/* Article Header */}
        <header className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Procurement & Buying Guide</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Hardware Material Online in India: A Practical Buying Guide
          </h1>

          {/* Subtitle / Timestamp */}
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-600 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Last updated: 14 October 2026</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>6 min read</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-blue-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Verified Hardware Specifications</span>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/categories/cat-hardware-fittings.jpg"
              alt="Hardware material online in India: hinges, screws and door handles"
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center">
            Assorted hardware materials: precision fasteners, hinges, handles, and fittings available for fast site delivery.
          </div>
        </div>

        {/* Intro Section */}
        <div className="prose prose-slate max-w-none mb-8">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
            Not long ago, buying hardware meant visiting two or three shops, asking for prices, carrying heavy bags and hoping the item matched what you needed. Today you can buy hardware material online, compare options at home and have it delivered. But hardware is not like a phone or a shirt: sizes, grades and finishes matter. This guide shows you how to buy it online without mistakes.
          </p>
        </div>

        {/* In This Guide Table of Contents */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 sm:p-6 mb-10 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>In this guide</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-blue-900">
            <li>
              <a href="#what-counts" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">1.</span> What counts as hardware material
              </a>
            </li>
            <li>
              <a href="#why-buy-online" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">2.</span> Why people now buy hardware online
              </a>
            </li>
            <li>
              <a href="#what-to-check" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">3.</span> What to check before you order
              </a>
            </li>
            <li>
              <a href="#hardware-by-room" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">4.</span> Hardware by room and job
              </a>
            </li>
            <li>
              <a href="#common-mistakes" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">5.</span> Common mistakes
              </a>
            </li>
            <li>
              <a href="#how-intrihub-helps" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">6.</span> How IntriHub helps
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline flex items-center gap-1.5">
                <span className="text-blue-500 font-bold">7.</span> Frequently asked questions
              </a>
            </li>
          </ul>
        </div>

        {/* Section 1 */}
        <section id="what-counts" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            1. What counts as hardware material
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            &ldquo;Hardware&rdquo; covers the small and mid-sized items that hold a home together. Common categories:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600 shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Fasteners</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Screws, nuts, bolts, nails, anchors, washers
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Door and window hardware</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Hinges, handles, locks, latches, door stoppers, tower bolts
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Cabinet and wardrobe hardware</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Channels, hinges, knobs, soft-close fittings
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600 shrink-0">
                <Hammer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Hand and power tools</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Hammers, spanners, drills, cutters, measuring tapes
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600 shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Plumbing hardware</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Taps, valves, couplings, clamps
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2 bg-rose-50 rounded-lg text-rose-600 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Adhesives and sealants</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Fevicol-type adhesives, silicone, tape
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 sm:col-span-2">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Electrical accessories</h3>
                <p className="text-xs text-slate-600 leading-normal">
                  Clips, conduits, junction boxes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="why-buy-online" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            2. Why people now buy hardware online
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Compare in one place:</span>
                <span className="text-slate-600 ml-1.5">
                  Check multiple brands, sizes, and price tiers together instead of walking from shop to shop.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Clear listings:</span>
                <span className="text-slate-600 ml-1.5">
                  Sizes, materials, load ratings, and finishes are written down clearly, not guessed over a busy counter.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Delivery to your site or home:</span>
                <span className="text-slate-600 ml-1.5">
                  Save time, vehicle fuel, and the hassle of hauling heavy metal fittings yourself.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-900">Order small and often:</span>
                <span className="text-slate-600 ml-1.5">
                  Procure stage-wise as carpentry or fitting work progresses, instead of tying up cash by buying everything at once.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="what-to-check" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            3. What to check before you order
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Hardware errors usually come from small details. Check these every time:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <Ruler className="w-4 h-4 text-blue-600" />
                <h3>Size and dimensions</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Length, diameter, thread and gauge for screws and bolts. Door and cabinet fittings must match the thickness and opening of your door or cabinet.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3>Material and finish</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stainless steel, brass, mild steel or zinc-plated. For bathrooms, balconies and outdoors, choose rust-resistant material.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h3>Brand and quality</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Prefer known brands for locks, hinges and fittings that you will use every day.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <Boxes className="w-4 h-4 text-amber-600" />
                <h3>Quantity</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add a small extra (commonly 5 to 10%) for fasteners, since they get lost or damaged on site.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <Wrench className="w-4 h-4 text-cyan-600" />
                <h3>Compatibility</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Make sure the new lock, handle or tap fits the existing cutout or borehole if you are replacing older fixtures.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <Truck className="w-4 h-4 text-indigo-600" />
                <h3>Return and replacement terms</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Know what happens if the size is wrong or if a fitting doesn&apos;t align with your cabinetry.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <h3>Proper bill</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Keep the invoice for warranty claims, manufacturer replacements, and GST documentation.
              </p>
            </div>
          </div>

          {/* Measurement Pro-Tip Box */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-xl">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-sm mb-1">
                  Pro-Tip: When in doubt, measure twice
                </h4>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  Take a photo of the old part, its screw spacing, and its tape measurements before you buy a replacement online. Sharing the photo with your carpenter or on-site fitter prevents 90% of ordering errors.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4 */}
        <section id="hardware-by-room" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            4. Hardware by room and job
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            Different installation jobs require specific grades of hardware. Use this reference checklist:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white mb-6">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6 w-1/3">Job</th>
                  <th className="py-3 px-4 sm:px-6">What you typically need</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    New wardrobe or kitchen cabinets
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Hinges, channels, handles, screws, adhesive
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Door replacement
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Hinges, lock set, tower bolts, door stopper, screws
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Bathroom repair
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Taps, couplings, sealant, clamps, anchors
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Wall fittings (shelves, TV, curtains)
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Wall anchors, screws, drill bits, brackets
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    General home maintenance kit
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Screwdrivers, spanner set, pliers, measuring tape, tape, adhesive
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Checklist Graphic Image */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            <div className="relative aspect-[16/8] w-full">
              <Image
                src="/images/categories/cat-tools-consumables.jpg"
                alt="Checklist before buying hardware online"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center">
              Checklist before buying hardware online: keep proper tools, anchors, and fasteners organized by room.
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="common-mistakes" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            5. Common mistakes
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Ordering without measuring:</span>
                <span className="text-rose-900 ml-1.5">
                  The most common reason for returns. Even 2mm difference in screw gauge or hinge crank can stop an installation.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Choosing the cheapest option for a lock or hinge:</span>
                <span className="text-rose-900 ml-1.5">
                  These components handle mechanical stress daily. Cheap zinc alloy fittings degrade quickly compared to forged brass or SS-304.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Using the wrong material outdoors or in wet areas:</span>
                <span className="text-rose-900 ml-1.5">
                  Mild steel fittings in bathrooms or balconies corrode and leave ugly rust streaks within months.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Not buying extra fasteners:</span>
                <span className="text-rose-900 ml-1.5">
                  Running short of three drywall screws or rawlplugs in the middle of a job halts labour and wastes hours.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Skipping the bill:</span>
                <span className="text-rose-900 ml-1.5">
                  You will need the authentic tax invoice if a branded lock fails under its 5-year or 10-year manufacturer warranty.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section id="how-intrihub-helps" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            6. How IntriHub helps
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">One place for hardware and more</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Hardware, electrical, plumbing, tiles, plywood and furniture together, so one order covers the job without juggling multiple deliveries.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Browse and compare online</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Explore{" "}
                <Link
                  href="/building-materials-online"
                  className="text-blue-600 font-semibold underline hover:text-blue-800"
                >
                  building materials online
                </Link>{" "}
                and compare specifications and pricing transparently at your own pace.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">60-minute delivery in Bengaluru</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Running short on fasteners or channel fittings? Order what you need right to your site in under an hour across Bengaluru.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-2">Pan-India delivery</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Outside Bengaluru, dependable courier and freight delivery currently takes 3 to 7 days directly to your doorstep.
              </p>
            </div>
          </div>

          {/* Internal Cross-Link Banner for Shop Owners (Post 2) */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl shrink-0">
                  <Store className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Own a hardware shop?</h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Grow your retail reach and digitalize your counter with IntriHub.
                  </p>
                </div>
              </div>
              <Link
                href="/guides/hardware-shop-online-marketing-ecommerce-guide"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shrink-0"
              >
                <span>Read shop owner guide</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Primary Shop Call to Action */}
          <div className="text-center py-4">
            <Link
              href="/building-materials-online"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-sm sm:text-base group"
            >
              <span>Shop hardware and building materials on IntriHub</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* Section 7: FAQs */}
        <section id="faq" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-6 pb-2 border-b border-slate-200 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <span>Frequently asked questions</span>
          </h2>

          <div className="space-y-4">
            {guideFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <h3 className="font-bold text-slate-900 text-base mb-2">
                  {faq.question}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-6 p-4 bg-slate-100 rounded-xl text-xs text-slate-500 border border-slate-200">
            <strong>Disclaimer:</strong> This guide is general information. Confirm sizes and specifications for your own job with your contractor or fitter.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
