import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Building2,
  Truck,
  Store,
  ShieldCheck,
  Zap,
  HelpCircle,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";
import { USP_ITEMS, USP_PILLARS } from "@/lib/data/usps";

const canonicalUrl = getCanonicalUrl("/why-intrihub");

export const metadata: Metadata = {
  title: "Why IntriHub? 20 Reasons to Buy Building & Interior Materials Online | IntriHub",
  description:
    "Discover 20 reasons why builders, contractors, and homeowners choose IntriHub for building & interior material procurement with direct 60-minute site delivery.",
  robots: { index: true, follow: true },
  alternates: { canonical: canonicalUrl },
  openGraph: {
    title: "Why IntriHub? 20 Reasons to Buy Building & Interior Materials Online",
    description:
      "One Platform → Every Material → One Order → Direct to Site. Explore the 20 Unique Selling Propositions of IntriHub.",
    url: canonicalUrl,
    type: "website",
    siteName: "IntriHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Why IntriHub? 20 Reasons to Buy Building & Interior Materials Online",
    description:
      "One Platform → Every Material → One Order → Direct to Site. Fast 60-minute site delivery across Bengaluru.",
  },
};

const breadcrumbsSchema = generateBreadcrumbSchema([
  { name: "Home", url: "/" },
  { name: "Why IntriHub", url: "/why-intrihub" },
]);

const hubFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is IntriHub's core unique selling proposition (USP)?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "IntriHub is 'One Platform for Complete Construction & Interior Procurement — From Material Discovery to Site Delivery.' It connects verified Bengaluru suppliers and factories to deliver materials direct to your active job site in 60 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "How does IntriHub eliminate multi-vendor friction?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Instead of visiting separate stores for tiles, electrical, plumbing, paint, and hardware, IntriHub gives you 20+ categories, a single consolidated cart, unified GST billing, and one coordinated site delivery.",
      },
    },
    {
      "@type": "Question",
      name: "Is 60-minute delivery available for heavy building materials?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, IntriHub operates specialized commercial vehicles and micro-dark hubs across Bengaluru to fulfill direct-to-site orders in under 60 minutes with a zero-breakage pallet guarantee.",
      },
    },
  ],
};

const webpageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${canonicalUrl}#webpage`,
  name: "Why IntriHub? 20 Reasons to Buy Building & Interior Materials Online",
  url: canonicalUrl,
  description:
    "Discover 20 reasons why builders, contractors, and homeowners choose IntriHub for building & interior material procurement with direct 60-minute site delivery.",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${BASE_SITE_URL}/#website`,
    name: "IntriHub",
    url: BASE_SITE_URL,
  },
};

export default function WhyIntrihubPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      <JsonLd data={webpageSchema} id="why-intrihub-webpage-schema" />
      <JsonLd data={breadcrumbsSchema} id="why-intrihub-breadcrumbs-schema" />
      <JsonLd data={hubFaqSchema} id="why-intrihub-faq-schema" />

      <Header />

      <main className="flex-grow pt-[56px] md:pt-[128px]">
        {/* ========================================================================= */}
        {/* 1. HERO BANNER                                                            */}
        {/* ========================================================================= */}
        <header className="relative bg-gradient-to-r from-[#031b34] via-[#052a51] to-[#0a3f78] text-white py-14 md:py-20 overflow-hidden border-b border-white/10">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#F26522]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F26522]/20 border border-[#F26522]/50 text-orange-300 text-xs sm:text-sm font-black uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-[#F26522]" />
              <span>The Complete 20-USP Master Architecture</span>
            </div>

            <div className="space-y-2 max-w-4xl mx-auto">
              <p className="text-xs sm:text-sm font-bold text-orange-400 uppercase tracking-widest">
                The Master Workflow
              </p>
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                One Platform <span className="text-[#F26522]">→</span> Every Material{" "}
                <span className="text-[#F26522]">→</span> One Order{" "}
                <span className="text-[#F26522]">→</span> Direct to Site
              </h1>
            </div>

            <p className="text-base sm:text-xl font-medium text-slate-200 max-w-3xl mx-auto leading-relaxed">
              &ldquo;One Platform for Complete Construction &amp; Interior Procurement — From Material Discovery to Site Delivery.&rdquo;
            </p>

            <p className="text-xs sm:text-sm text-slate-300 italic max-w-xl mx-auto">
              From one screw to a complete project — explore the 20 distinct advantages that make IntriHub India&apos;s most reliable materials marketplace.
            </p>

            <div className="pt-2">
              <Link
                href="https://intrihub.com/"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm md:text-base transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <span>Start Shopping on IntriHub</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. THE 20 USPs GROUPED BY PILLAR                                          */}
        {/* ========================================================================= */}
        <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-16">
          {USP_PILLARS.map((pillar) => {
            const pillarUsps = USP_ITEMS.filter((u) => u.pillarId === pillar.id);

            return (
              <section key={pillar.id} className="space-y-6">
                {/* Pillar Header */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-200">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-black text-[#F26522] uppercase tracking-wider mb-1">
                      <span>{pillar.emoji}</span>
                      <span>Strategic Pillar 0{pillar.id}</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#052a51] tracking-tight">
                      {pillar.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">
                      {pillar.description}
                    </p>
                  </div>
                  <span className="text-xs font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">
                    {pillarUsps.length} Advantages
                  </span>
                </div>

                {/* Pillar Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {pillarUsps.map((usp) => (
                    <Link
                      key={usp.slug}
                      href={`/${usp.slug}`}
                      className="group relative bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs hover:shadow-xl hover:border-[#F26522]/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-orange-50 text-[#F26522] border border-orange-200/60">
                            {usp.badge}
                          </span>
                          <span className="text-xs font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            #{usp.number}
                          </span>
                        </div>

                        <h3 className="text-lg font-black text-slate-900 group-hover:text-[#052a51] transition-colors leading-snug">
                          {usp.h1}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {usp.summary}
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-[#F26522] transition-colors">
                        <span>Read Full USP Guide</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          {/* ========================================================================= */}
          {/* 3. VISIBLE FAQ SECTION                                                    */}
          {/* ========================================================================= */}
          <section className="p-6 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-black text-[#052a51] uppercase tracking-wider">
                <HelpCircle size={16} className="text-[#F26522]" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                Understanding the IntriHub Advantage
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {hubFaqSchema.mainEntity.map((item, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <h3 className="text-sm font-black text-[#052a51]">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================================= */}
          {/* 4. BOTTOM FAST ACTION CTA                                                 */}
          {/* ========================================================================= */}
          <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#031b34] to-[#052a51] text-white text-center space-y-5 shadow-xl border border-white/10">
            <span className="px-3 py-1 rounded-full bg-white/10 text-orange-300 text-xs font-bold uppercase tracking-wider inline-block">
              Modern Materials Quick-Commerce
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Ready to Source Materials for Your Next Project?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
              Enjoy direct pricing, verified Grade-1 materials, and guaranteed 60-minute site delivery across Bengaluru.
            </p>
            <div className="pt-3">
              <Link
                href="https://intrihub.com/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-base transition-all shadow-lg hover:scale-105 active:scale-95"
              >
                <span>Start Shopping on IntriHub</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
