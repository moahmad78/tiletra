import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Calendar, ShieldCheck, ChevronRight, HelpCircle, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BUYING_GUIDES, getBuyingGuideBySlug } from "@/lib/guides-data";
import {
  BASE_SITE_URL,
  getCanonicalUrl,
  generateArticleSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  safeJsonLd,
} from "@/lib/seo";

export async function generateStaticParams() {
  return BUYING_GUIDES.map((guide) => ({
    slug: guide.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getBuyingGuideBySlug(slug);

  if (!guide) {
    return {
      title: "Guide Not Found | Intrihub",
      description: "Explore interior & construction material guides on Intrihub.",
    };
  }

  const canonicalUrl = getCanonicalUrl(`/guides/${guide.slug}`);

  return {
    title: `${guide.title} | Intrihub Guide`,
    description: guide.shortDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: guide.title,
      description: guide.shortDescription,
      url: canonicalUrl,
      type: "article",
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      authors: [guide.author],
      siteName: "Intrihub",
      images: [
        {
          url: guide.image,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.shortDescription,
      images: [guide.image],
    },
  };
}

export default async function BuyingGuideDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getBuyingGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Guides & Resources", url: "/guides" },
    { name: guide.title, url: `/guides/${guide.slug}` },
  ]);

  const articleSchema = generateArticleSchema({
    title: guide.title,
    description: guide.shortDescription,
    slug: guide.slug,
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
    images: [guide.image],
    authorName: guide.author,
  });

  const faqSchema = generateFAQSchema(guide.faqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbsSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(faqSchema) }}
      />

      <main className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Header />

        <article className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 pt-[84px] md:pt-[175px] lg:pt-[180px] pb-16 flex-1">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-6 flex-wrap">
            <Link href="/" className="hover:text-[#052A51]">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link href="/guides" className="hover:text-[#052A51]">
              Guides & Resources
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-800 line-clamp-1">{guide.title}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#052A51]/10 text-[#052A51] text-xs font-bold uppercase tracking-wider mb-4">
              {guide.category}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {guide.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-4 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                By {guide.author}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar size={13} />{" "}
                {new Date(guide.publishedAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock size={13} /> {guide.readTime}
              </span>
            </div>
          </header>

          {/* Hero Featured Image */}
          <div className="relative h-[280px] sm:h-[400px] w-full rounded-2xl overflow-hidden mb-10 shadow-md">
            <Image src={guide.image} alt={guide.title} fill className="object-cover" priority />
          </div>

          {/* Summary Box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 sm:p-6 mb-10">
            <h3 className="text-sm font-extrabold text-amber-900 uppercase tracking-wider mb-2">
              Key Takeaway
            </h3>
            <p className="text-slate-800 text-sm sm:text-base leading-relaxed font-medium">
              {guide.summary}
            </p>
          </div>

          {/* Guide Sections */}
          <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
            {guide.sections.map((section, idx) => (
              <section key={idx} className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-4">
                  {section.heading}
                </h2>

                {section.content.map((paragraph, pIdx) => (
                  <p key={pIdx} className="text-sm sm:text-base leading-relaxed text-slate-600 mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}

                {section.bulletPoints && section.bulletPoints.length > 0 && (
                  <ul className="mt-4 space-y-2 pl-4 list-disc text-sm sm:text-base text-slate-700 font-medium">
                    {section.bulletPoints.map((point, ptIdx) => (
                      <li key={ptIdx}>{point}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* FAQ Accordion Section */}
          {guide.faqs && guide.faqs.length > 0 && (
            <section className="mt-12 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <HelpCircle size={22} color="#052A51" />
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-4">
                {guide.faqs.map((faq, fIdx) => (
                  <div key={fIdx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Sourcing Links */}
          <div className="mt-10 p-6 rounded-2xl bg-gradient-to-r from-[#052A51] to-[#093A6D] text-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-white">Need materials for your active site?</h3>
              <p className="text-white/80 text-xs sm:text-sm mt-1">
                Explore factory-direct supplies on Intrihub with site delivery.
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#FF9900] hover:bg-[#e68a00] text-white font-bold rounded-xl text-sm transition-colors whitespace-nowrap"
            >
              Browse Catalog
              <ArrowRight size={16} />
            </Link>
          </div>
        </article>

        <Footer />
      </main>
    </>
  );
}
