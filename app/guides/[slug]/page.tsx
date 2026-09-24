import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, Calendar, ChevronRight, User, BookOpen, ArrowRight, Share2, Tag, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getGuidePostBySlug, getGuidePosts, seedInitialGuidesIfEmpty } from "@/lib/actions/guides";
import { BUYING_GUIDES } from "@/lib/guides-data";
import {
  BASE_SITE_URL,
  getCanonicalUrl,
  generateArticleSchema,
  generateBreadcrumbSchema,
  safeJsonLd,
} from "@/lib/seo";

export const revalidate = 60; // ISR revalidate every 60 seconds
export const dynamicParams = true; // Allow newly published posts to render on demand

export async function generateStaticParams() {
  try {
    await seedInitialGuidesIfEmpty();
    const data = await getGuidePosts();
    return (data.posts || []).map((g) => ({ slug: g.slug }));
  } catch {
    return BUYING_GUIDES.map((g) => ({ slug: g.slug }));
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = await getGuidePostBySlug(slug);

  if (!guide) {
    return {
      title: "Guide Not Found | IntriHub",
      description: "Explore interior & construction material guides on IntriHub.",
    };
  }

  const canonicalUrl = getCanonicalUrl(`/guides/${guide.slug}`);
  const title = guide.metaTitle || `${guide.title} | IntriHub Guide`;
  const description =
    guide.metaDescription ||
    guide.excerpt ||
    "Explore comprehensive technical buying advice and material selection guidance on IntriHub.";

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "article",
      publishedTime: guide.publishedAt ? new Date(guide.publishedAt).toISOString() : undefined,
      modifiedTime: guide.updatedAt ? new Date(guide.updatedAt).toISOString() : undefined,
      authors: [guide.authorName || "Intrihub Editorial Team"],
      siteName: "IntriHub",
      images: guide.featuredImage
        ? [
            {
              url: guide.featuredImage,
              width: 1200,
              height: 630,
              alt: guide.title,
            },
          ]
        : [
            {
              url: "/logo/intri-web-logo.png",
              width: 1200,
              height: 630,
              alt: guide.title,
            },
          ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: guide.featuredImage ? [guide.featuredImage] : ["/logo/intri-web-logo.png"],
    },
  };
}

export default async function BuyingGuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = await getGuidePostBySlug(slug);

  if (!guide) {
    notFound();
  }

  // Related Guides (other posts in same or general categories)
  const data = await getGuidePosts();
  const relatedGuides = (data.posts || [])
    .filter((g: any) => g.slug !== guide.slug && g.status === "PUBLISHED")
    .slice(0, 3);

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides", url: "/guides" },
    { name: guide.title, url: `/guides/${guide.slug}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: guide.title,
    description: guide.metaDescription || guide.excerpt || guide.title,
    slug: guide.slug,
    publishedTime: guide.publishedAt ? new Date(guide.publishedAt).toISOString() : new Date().toISOString(),
    modifiedTime: guide.updatedAt ? new Date(guide.updatedAt).toISOString() : new Date().toISOString(),
    images: guide.featuredImage ? [guide.featuredImage] : [`${BASE_SITE_URL}/logo/intri-web-logo.png`],
    authorName: guide.authorName || "Intrihub Editorial Team",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(breadcrumbsSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(articleSchema),
        }}
      />

      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <article className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-6 flex-wrap">
            <Link href="/" className="hover:text-[#052A51] transition-colors">
              Home
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <Link href="/guides" className="hover:text-[#052A51] transition-colors">
              Guides
            </Link>
            <ChevronRight size={14} className="text-slate-400" />
            <span className="text-slate-900 font-medium truncate max-w-[280px] sm:max-w-md">
              {guide.title}
            </span>
          </nav>

          {/* Article Header Card */}
          <header className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xs mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#052A51]/10 text-[#052A51] text-xs font-bold uppercase tracking-wider mb-4">
              <Tag size={13} />
              {guide.category}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              {guide.title}
            </h1>

            {/* Author & Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-100 text-xs sm:text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#052A51] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  {guide.authorName ? guide.authorName.charAt(0) : "I"}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{guide.authorName}</p>
                  <p className="text-xs text-slate-500">{(guide as any).authorRole || "Intrihub Specialist"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#FF9900]" />
                  {new Date(guide.publishedAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} className="text-[#052A51]" />
                  {(guide as any).readTime || `${(guide as any).readTimeMinutes || 5} min read`}
                </span>
              </div>
            </div>

            {/* Featured Image */}
            {guide.featuredImage && (
              <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden mt-6 bg-slate-100 border border-slate-200 shadow-xs">
                <Image
                  src={guide.featuredImage}
                  alt={guide.featuredImageAlt || guide.title}
                  fill
                  className="object-cover"
                  priority={true}
                />
              </div>
            )}

            {/* Excerpt */}
            {guide.excerpt && (
              <div className="mt-8 p-5 bg-gradient-to-r from-[#052A51]/5 to-transparent border-l-4 border-[#052A51] rounded-r-2xl">
                <p className="text-base sm:text-lg text-slate-700 font-medium italic leading-relaxed">
                  {guide.excerpt}
                </p>
              </div>
            )}
          </header>

          {/* Main Article Content */}
          <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-slate-200/80 shadow-xs mb-10">
            <div
              className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-slate-100 prose-h3:text-xl sm:prose-h3:text-2xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-slate-700 prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-ul:my-4 prose-li:text-slate-700 prose-li:my-1 prose-img:rounded-2xl prose-img:shadow-md prose-img:border prose-img:border-slate-200 prose-a:text-[#052A51] prose-a:font-semibold hover:prose-a:text-[#FF9900] prose-a:transition-colors prose-blockquote:border-l-4 prose-blockquote:border-[#FF9900] prose-blockquote:bg-amber-50/50 prose-blockquote:p-4 prose-blockquote:rounded-r-xl prose-blockquote:italic"
              dangerouslySetInnerHTML={{ __html: guide.content }}
            />

            {/* Internal Product Callout Box */}
            <div className="mt-12 p-6 sm:p-8 bg-gradient-to-br from-[#052A51] to-[#093A6D] text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-bold">Looking to procure materials for your project?</h3>
                <p className="text-white/80 text-sm">
                  Browse verified collections, check live stock, and get instant wholesale GST pricing.
                </p>
              </div>
              <Link
                href="/shop"
                className="px-6 py-3 bg-[#FF9900] hover:bg-[#FF8800] text-[#052A51] font-bold text-sm rounded-xl shadow-md transition-transform active:scale-95 whitespace-nowrap"
              >
                Explore Marketplace
              </Link>
            </div>
          </div>

          {/* Related Guides Section */}
          {relatedGuides.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Related Buying Guides</h2>
                <Link
                  href="/guides"
                  className="text-xs sm:text-sm font-bold text-[#052A51] hover:underline flex items-center gap-1"
                >
                  View all guides <ArrowRight size={14} />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedGuides.map((rel: any) => (
                  <Link
                    key={rel.id || rel.slug}
                    href={`/guides/${rel.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                      {rel.featuredImage ? (
                        <Image
                          src={rel.featuredImage}
                          alt={rel.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <BookOpen size={24} />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-[#052A51]/90 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {rel.category}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#052A51] transition-colors line-clamp-2 leading-snug">
                        {rel.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-3">
                        {rel.readTime || "5 min read"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        <Footer />
      </main>
    </>
  );
}
