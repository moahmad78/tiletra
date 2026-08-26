import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Clock, Tag } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BUYING_GUIDES } from "@/lib/guides-data";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Interior Material Buying Guides & Calculation Tips | Intrihub",
  description:
    "Expert technical buying guides for tiles, granite, electricals, plumbing, and construction materials. Step-by-step quantity calculation formulas and checklists for architects and contractors.",
  alternates: {
    canonical: getCanonicalUrl("/guides"),
  },
  openGraph: {
    title: "Interior Material Buying Guides & Calculation Tips | Intrihub",
    description:
      "Expert technical buying guides for tiles, granite, electricals, plumbing, and construction materials. Step-by-step quantity calculation formulas and checklists.",
    url: getCanonicalUrl("/guides"),
    type: "website",
    siteName: "Intrihub",
    images: [
      {
        url: "/logo/intri-web-logo.png",
        width: 1200,
        height: 630,
        alt: "Intrihub Buying Guides",
      },
    ],
  },
};

export default function GuidesIndexPage() {
  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides & Resources", url: "/guides" },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <div className="w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#052A51] text-white rounded-3xl p-6 sm:p-10 md:p-14 mb-10 shadow-lg relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FF9900] text-xs font-bold uppercase tracking-wider mb-4">
                <BookOpen size={14} />
                Knowledge Base & Material Guides
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Interior & Construction Material Buying Guides
              </h1>
              <p className="text-white/80 text-sm sm:text-base mt-3 leading-relaxed">
                Clear, practical advice on choosing materials, calculating quantities, comparing specifications, and managing project procurement without guesswork.
              </p>
            </div>
          </div>

          {/* Guides Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {BUYING_GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#052A51]/30 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={guide.image}
                    alt={guide.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-[#052A51]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {guide.category}
                  </div>
                </div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                      <span className="flex items-center gap-1">
                        <Clock size={13} /> {guide.readTime}
                      </span>
                      <span>•</span>
                      <span>{new Date(guide.publishedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#052A51] transition-colors line-clamp-2 leading-snug">
                      {guide.title}
                    </h2>

                    <p className="text-slate-600 text-sm mt-3 line-clamp-3 leading-relaxed">
                      {guide.shortDescription}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[#052A51] font-bold text-sm">
                    <span>Read Complete Guide</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
