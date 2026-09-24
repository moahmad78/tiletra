import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Clock, Tag, Search, Sparkles, User, Calendar } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getGuidePosts, seedInitialGuidesIfEmpty } from "@/lib/actions/guides";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema, safeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Interior Material Buying Guides & Expert Technical Articles | IntriHub",
  description:
    "Explore comprehensive buying guides for tiles, sanitaryware, electricals, plumbing, and architectural materials. Compare specifications, calculate quantities, and make confident building decisions.",
  alternates: {
    canonical: getCanonicalUrl("/guides"),
  },
  openGraph: {
    title: "Interior Material Buying Guides & Technical Articles | IntriHub",
    description:
      "Expert technical buying guides for tiles, sanitaryware, electricals, plumbing, and construction materials. Step-by-step quantity calculation formulas and checklists.",
    url: getCanonicalUrl("/guides"),
    type: "website",
    siteName: "IntriHub",
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

export const revalidate = 60; // ISR revalidate every 60 seconds

export default async function GuidesIndexPage({
  searchParams,
}: {
  searchParams?: Promise<{ category?: string; q?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const activeCategory = resolvedParams.category || "all";
  const searchQuery = (resolvedParams.q || "").toLowerCase();

  // Auto seed and fetch guides
  await seedInitialGuidesIfEmpty();
  const data = await getGuidePosts();
  const allGuides = data.posts || [];

  // Filter published only (with publish dates in past or now)
  const publishedGuides = allGuides.filter((g) => {
    if (g.status !== "PUBLISHED") return false;
    if (g.publishedAt && new Date(g.publishedAt).getTime() > Date.now()) return false;
    return true;
  });

  // Extract unique categories
  const categories: string[] = ["all", ...Array.from(new Set(publishedGuides.map((g) => g.category)))];

  // Apply filters
  const filteredGuides = publishedGuides.filter((guide) => {
    const matchesCategory =
      activeCategory === "all" ||
      guide.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      guide.title.toLowerCase().includes(searchQuery) ||
      guide.slug.toLowerCase().includes(searchQuery) ||
      (guide.excerpt && guide.excerpt.toLowerCase().includes(searchQuery));

    return matchesCategory && matchesSearch;
  });

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
          <div className="bg-gradient-to-br from-[#052A51] via-[#093A6D] to-[#052A51] text-white rounded-3xl p-6 sm:p-10 md:p-14 mb-8 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#FF9900] text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
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

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory.toLowerCase() === cat.toLowerCase();
              return (
                <Link
                  key={cat}
                  href={cat === "all" ? "/guides" : `/guides?category=${encodeURIComponent(cat)}`}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-[#052A51] text-white shadow-md shadow-[#052A51]/20 scale-102"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  {cat === "all" ? "All Guides" : cat}
                </Link>
              );
            })}
          </div>

          {/* Guides Grid */}
          {filteredGuides.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-xs">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No guides found</h3>
              <p className="text-sm text-slate-500 mt-1">
                There are no published guides in this category yet. Check back soon!
              </p>
              <Link
                href="/guides"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#052A51] text-white text-xs font-semibold rounded-xl"
              >
                View All Guides
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredGuides.map((guide) => (
                <Link
                  key={guide.id || guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:border-[#052A51]/30 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
                    {guide.featuredImage ? (
                      <Image
                        src={guide.featuredImage}
                        alt={guide.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-[#052A51]/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                      {guide.category}
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mb-3">
                        <span className="flex items-center gap-1">
                          <Clock size={13} /> {(guide as any).readTime || `${guide.readTimeMinutes || 5} min read`}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(guide.publishedAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 group-hover:text-[#052A51] transition-colors line-clamp-2 leading-snug">
                        {guide.title}
                      </h2>

                      {guide.excerpt && (
                        <p className="text-slate-600 text-sm mt-3 line-clamp-3 leading-relaxed">
                          {guide.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[#052A51] font-bold text-sm">
                      <span>Read Complete Guide</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </main>
    </>
  );
}
