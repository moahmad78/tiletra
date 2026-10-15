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
  Phone,
  MessageSquare,
  Globe,
  TrendingUp,
  Search,
  Camera,
  Star,
  Users,
  Building2,
  ShoppingBag,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BASE_SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Hardware Shop Online: How to Sell & Market Your Dukan",
  description:
    "Own a hardware shop? Learn how to sell hardware material online, get found on Google and grow with ecommerce, step by step.",
  alternates: {
    canonical: `${BASE_SITE_URL}/guides/hardware-shop-online-marketing-ecommerce-guide`,
  },
  openGraph: {
    title: "Hardware Shop Online: How Hardware Dukan Owners Can Sell Online",
    description:
      "Seven simple steps to list your products, get found on Google and grow with ecommerce.",
    url: `${BASE_SITE_URL}/guides/hardware-shop-online-marketing-ecommerce-guide`,
    type: "article",
    publishedTime: "2026-10-14T00:00:00.000Z",
    modifiedTime: "2026-10-14T00:00:00.000Z",
    authors: ["IntriHub"],
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/images/categories/cat-hardware.webp`,
        width: 1200,
        height: 630,
        alt: "Hardware shop owner selling hardware material online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hardware Shop Online: How Hardware Dukan Owners Can Sell Online",
    description:
      "Seven simple steps to list your products, get found on Google and grow with ecommerce.",
    images: [`${BASE_SITE_URL}/images/categories/cat-hardware.webp`],
  },
};

const guideFaqs = [
  {
    question: "How can I sell hardware material online?",
    answer:
      "List your products with clear names, sizes and photos, set a delivery plan, create a Google Business Profile, and start on a marketplace or your own website.",
  },
  {
    question: "Do I need my own website to sell online?",
    answer:
      "No. Many hardware shops start on a marketplace, learn what sells, and build their own website later.",
  },
  {
    question: "How do I make my hardware shop show up on Google?",
    answer:
      "Create a Google Business Profile with correct name, address, phone, hours, photos and categories, and collect genuine customer reviews.",
  },
  {
    question: "What hardware items sell best online?",
    answer:
      "Fasteners, door and cabinet hardware, tools, plumbing fittings, adhesives and electrical accessories are common repeat purchases. Check your own sales to see what works for you.",
  },
  {
    question: "Hardware dukan online kaise shuru karein?",
    answer:
      "Pehle apne top 20 se 30 items ki clear list aur photos banayein, Google Business Profile banayein, WhatsApp par jaldi reply dein, aur marketplace par listing se shuru karein.",
  },
];

export default function HardwareShopOnlineMarketingEcommerceGuidePage() {
  const pageUrl = `${BASE_SITE_URL}/guides/hardware-shop-online-marketing-ecommerce-guide`;

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
        headline:
          "Hardware Shop Online: How Hardware Dukan Owners Can Sell Online and Grow",
        description:
          "Own a hardware shop? Learn how to sell hardware material online, get found on Google and grow with ecommerce, step by step.",
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
          url: `${BASE_SITE_URL}/images/categories/cat-hardware.webp`,
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
            name: "Hardware Shop Online Seller Guide",
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
            Hardware Shop Online Seller Guide
          </span>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto px-4 py-8 sm:py-12 w-full">
        {/* Article Header */}
        <header className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-full mb-4">
            <Store className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seller & Retailer Growth Guide</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            Hardware Shop Online: How Hardware Dukan Owners Can Sell Online and Grow
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
              <span>7 min read</span>
            </div>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Ecommerce & Local Marketing</span>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-md border border-slate-200 bg-white">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/categories/cat-hardware.webp"
              alt="Hardware shop owner selling hardware material online"
              fill
              priority
              sizes="(max-width: 896px) 100vw, 896px"
              className="object-cover"
            />
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center">
            Hardware shop owner selling hardware material online: taking local inventory digital for contractors and homeowners.
          </div>
        </div>

        {/* Intro Section */}
        <div className="prose prose-slate max-w-none mb-8">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
            If you run a hardware shop, your customers are already searching for you on their phones: &ldquo;hardware shop near me&rdquo;, &ldquo;door hinges online&rdquo;, &ldquo;buy screws online&rdquo;. If they cannot find you, they find someone else. You do not need a big budget or a technical team to fix that. This guide shows a simple path to take a hardware dukan online, get found on Google and start selling through ecommerce.
          </p>
        </div>

        {/* In This Guide Table of Contents */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 sm:p-6 mb-10 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <span>In this guide</span>
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-emerald-950">
            <li>
              <a href="#why-go-online" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">1.</span> Why go online
              </a>
            </li>
            <li>
              <a href="#seven-steps" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">2.</span> Seven steps to get started
              </a>
            </li>
            <li>
              <a href="#marketplace-vs-website" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">3.</span> Marketplace or your own website
              </a>
            </li>
            <li>
              <a href="#hinglish-guide" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">4.</span> Hardware dukan online (Hinglish guide)
              </a>
            </li>
            <li>
              <a href="#selling-on-intrihub" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">5.</span> Selling on IntriHub
              </a>
            </li>
            <li>
              <a href="#mistakes-to-avoid" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">6.</span> Mistakes to avoid
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:underline flex items-center gap-1.5">
                <span className="text-emerald-600 font-bold">7.</span> Frequently asked questions
              </a>
            </li>
          </ul>
        </div>

        {/* Section 1 */}
        <section id="why-go-online" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            1. Why go online
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Customers search first, visit later
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Many people check options, prices, and availability on their phones before stepping out to buy.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Expand beyond shop hours and street limits
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Your physical shop has limited hours and a limited footfall radius. An online listing works around the clock and displays your range across town.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0 mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Hardware is a repeat purchase
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Contractors, carpenters, plumbers, and active renovators come back for the same fittings, screws, and tools again and again.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0 mt-0.5">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">
                  Your stock is already your advantage
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  You know what sells and you have the inventory ready on your shelves. You only need to show it clearly to customers online.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2 */}
        <section id="seven-steps" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            2. Seven steps to get started
          </h2>

          <div className="space-y-4 mb-8">
            {/* Step 1 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  List your products with clear names
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-10">
                Write the product the way a customer searches for it. &ldquo;SS door hinge 4 inch, pack of 2&rdquo; works far better than &ldquo;hinge&rdquo;. Always include size, material, finish and brand.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Take clear photos
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-10">
                Use daylight, a plain white or grey background, and place a coin or ruler beside the fitting for scale. One sharp photo is better than five blurry ones.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Organise into categories
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-10">
                Group items the way customers think: fasteners, door hardware, cabinet fittings, tools, plumbing, adhesives, electrical accessories.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Keep price and stock current
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-10">
                Wrong prices and out-of-stock items cost you customer trust. Update the items that change most often first, especially fast-moving fast-track items.
              </p>
            </div>

            {/* Step 5 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  5
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Decide your delivery plan
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-10">
                Choose your delivery area and how you will send items. Local delivery within your city or neighbourhood using bike couriers is the easiest place to start.
              </p>
            </div>

            {/* Step 6 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  6
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Get found on Google
                </h3>
              </div>
              <div className="text-sm text-slate-600 leading-relaxed pl-10 space-y-2">
                <p>
                  Create or claim your <strong>Google Business Profile</strong> with your shop name, exact address, phone number, opening hours and clear shopfront photos.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
                  <li>Use the exact same name, address and phone number everywhere.</li>
                  <li>Add the main categories you sell (hardware store, tool store, plumbing supply).</li>
                  <li>Ask happy customers to leave a review, and reply politely to every review.</li>
                </ul>
              </div>
            </div>

            {/* Step 7 */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  7
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  Use WhatsApp for fast orders
                </h3>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pl-10">
                Many hardware customers prefer to message directly. Share a simple PDF or link catalogue, reply quickly and confirm size and quantity before dispatching.
              </p>
            </div>
          </div>

          {/* Graphic Image */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
            <div className="relative aspect-[16/8] w-full">
              <Image
                src="/images/categories/cat-hardware-fittings.jpg"
                alt="Seven steps to take a hardware shop online"
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 text-center">
              Seven steps to take a hardware shop online: clear product naming, categories, and fast local communication.
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section id="marketplace-vs-website" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            3. Selling on a marketplace or your own website
          </h2>

          <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white mb-6">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 sm:px-6 w-1/4">Aspect</th>
                  <th className="py-3 px-4 sm:px-6 w-3/8">Marketplace</th>
                  <th className="py-3 px-4 sm:px-6 w-3/8">Own website</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Setup effort
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Lower: list items and start selling
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Higher: needs a site, payments and delivery setup
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Customers
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Existing visitors who already shop there
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    You must bring your own traffic through ads or SEO
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Control over branding
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Limited
                  </td>
                  <td className="py-3.5 px-4 sm:px-6">
                    Full
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                    Best for
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-blue-700">
                    Getting your first online orders quickly
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-800">
                    Building a long-term brand
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-slate-600 italic">
            Many shops start on a marketplace to learn what sells online, and build their own website later.
          </p>
        </section>

        {/* Section 4 */}
        <section id="hinglish-guide" className="scroll-mt-20 mb-12">
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-6 sm:p-7 shadow-sm">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-700" />
              <span>4. Hardware dukan ko online kaise laayein (Hinglish quick guide)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 mb-4 font-medium">
              Agar aap apni hardware dukan online laana chahte hain, to yeh simple order follow karein:
            </p>

            <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed mb-5">
              <li>
                <strong>Apne sabse zyada bikne wale 20 se 30 items ki list banayein.</strong>
              </li>
              <li>
                <strong>Har item ka size, material aur brand likhein,</strong> saath mein saaf photo lein.
              </li>
              <li>
                <strong>Apna price aur stock ek jagah sahi rakhein.</strong>
              </li>
              <li>
                <strong>Google par apna Google Business Profile banayein,</strong> taaki &ldquo;hardware dukan near me&rdquo; search mein aap dikhein.
              </li>
              <li>
                <strong>Customers ke liye WhatsApp number rakhein</strong> aur jaldi reply dein.
              </li>
              <li>
                <strong>Local delivery se shuru karein,</strong> phir dheere dheere area badhayein.
              </li>
              <li>
                <strong>Online marketplace par apne items list karke</strong> pehle orders lein.
              </li>
            </ol>

            <div className="p-3 bg-white rounded-xl border border-amber-300 text-amber-950 font-bold text-xs sm:text-sm text-center">
              Chhota shuru karein, par shuru zaroor karein.
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="selling-on-intrihub" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            5. Selling on IntriHub
          </h2>
          <p className="text-slate-700 leading-relaxed mb-6">
            IntriHub is an online marketplace for building materials, hardware, electrical, plumbing, tiles and more, serving customers in Bengaluru and across India. Shop owners can list their products and reach customers who are already searching online.
          </p>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">
                Ready to take your store digital?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                Join verified vendor partners supplying building and hardware materials online.
              </p>
            </div>
            <Link
              href="/vendor/apply"
              className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-sm shrink-0"
            >
              <span>Become a seller on IntriHub</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600">
            <span>Questions before you start?</span>
            <Link
              href="/help"
              className="text-blue-600 font-semibold underline hover:text-blue-800"
            >
              Visit our help desk
            </Link>
            <span>and ask our vendor support team.</span>
          </div>

          {/* Cross link to Buyer Guide (Post 1) */}
          <div className="mt-6 p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs sm:text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Looking to buy hardware instead?</span>{" "}
              Read our comprehensive buyer checklist for sizing, materials, and fast delivery:
            </div>
            <Link
              href="/guides/hardware-material-online-buying-guide-india"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Read Buyer Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Section 6 */}
        <section id="mistakes-to-avoid" className="scroll-mt-20 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            6. Mistakes to avoid
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Vague product names:</span>
                <span className="text-rose-900 ml-1.5">
                  Customers cannot find what you do not describe. &ldquo;Screw&rdquo; won&apos;t rank; &ldquo;Drywall screw 25mm black&rdquo; will.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Old prices and stock:</span>
                <span className="text-rose-900 ml-1.5">
                  Update regularly so buyers aren&apos;t surprised after placing an order.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Poor photos:</span>
                <span className="text-rose-900 ml-1.5">
                  Dark, blurry photos lose customer trust and increase queries.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">No reply on WhatsApp or phone:</span>
                <span className="text-rose-900 ml-1.5">
                  Speed wins hardware orders. Contractors buy from whoever replies first on site.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Ignoring reviews:</span>
                <span className="text-rose-900 ml-1.5">
                  Reply politely to every review on your Google profile, even to complaints.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-rose-950">Trying to list the whole shop on day one:</span>
                <span className="text-rose-900 ml-1.5">
                  Start with your top 20 to 30 bestsellers, establish your workflow, and add more gradually.
                </span>
              </div>
            </div>
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
            <strong>Disclaimer:</strong> This guide is general information. Please confirm the terms of any platform before you sign up.
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
