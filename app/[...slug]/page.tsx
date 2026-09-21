import { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BASE_SITE_URL, generateSeoKeywordPageSchemas } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import SeoLandingPageClient, {
  type SeoLandingPageData,
} from "@/components/seo/SeoLandingPageClient";
import { getProducts } from "@/lib/actions/products";
import type { Product } from "@/lib/data/products";

export const revalidate = 3600; // 1 hour ISR revalidation

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug;

  const page = await prisma.seoPage.findUnique({
    where: { slug },
  });

  if (!page || !page.isPublished) {
    // Check if it's an alias
    const aliasMatch = await prisma.seoPage.findFirst({
      where: {
        aliases: { has: slug },
        isPublished: true,
      },
    });

    if (aliasMatch) {
      return {
        title: "Redirecting...",
        alternates: {
          canonical: `${BASE_SITE_URL}/${aliasMatch.slug}`,
        },
      };
    }

    return {
      title: "Page Not Found | IntriHub",
      robots: { index: false, follow: false },
    };
  }

  const canonicalUrl = `${BASE_SITE_URL}/${page.slug}`;

  return {
    title: page.title,
    description: page.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: `${page.title} | IntriHub`,
      description: page.metaDescription,
      url: canonicalUrl,
      type: "website",
      siteName: "IntriHub",
      images: [
        {
          url: `${BASE_SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${page.targetKeyword} — IntriHub`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${page.title} | IntriHub`,
      description: page.metaDescription,
      images: [`${BASE_SITE_URL}/og-image.png`],
    },
  };
}

export default async function SeoLandingPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug;

  // 1. Direct Slug Lookup
  let page = await prisma.seoPage.findUnique({
    where: { slug },
  });

  // 2. Alias Lookup and 301/308 Permanent Redirection
  if (!page || !page.isPublished) {
    const aliasMatch = await prisma.seoPage.findFirst({
      where: {
        aliases: { has: slug },
        isPublished: true,
      },
    });

    if (aliasMatch) {
      permanentRedirect(`/${aliasMatch.slug}`);
    }

    // 3. Fall through to standard Next.js 404
    notFound();
  }

  // 4. Fetch Live Filtered Catalog Products
  const filterConfig = (page.productFilter as any) || {};
  let products: Product[] = [];

  try {
    products = await getProducts({
      categorySlug: filterConfig.categorySlug || page.category || undefined,
      search: filterConfig.search || undefined,
      limit: filterConfig.limit || 8,
    });

    // Fallback if category filter returns fewer than 3 products
    if (products.length < 3 && page.category) {
      const fallbackProducts = await getProducts({
        categorySlug: page.category,
        limit: 8,
      });
      if (fallbackProducts.length > 0) {
        products = fallbackProducts;
      }
    }
  } catch (error) {
    console.error(`Error fetching products for SeoPage ${page.slug}:`, error);
  }

  // 5. Fetch Sibling Pages for Contextual Internal Linking
  let siblingPages: Array<{
    slug: string;
    title: string;
    targetKeyword: string;
    pageType: string;
  }> = [];

  if (page.category) {
    siblingPages = await prisma.seoPage.findMany({
      where: {
        category: page.category,
        id: { not: page.id },
        isPublished: true,
      },
      take: 4,
      select: {
        slug: true,
        title: true,
        targetKeyword: true,
        pageType: true,
      },
    });
  }

  // 6. Fetch Parent Category Page
  let parentCategoryPage: { slug: string; title: string } | null = null;
  if (page.pageType !== "CATEGORY" && page.category) {
    parentCategoryPage = await prisma.seoPage.findFirst({
      where: {
        pageType: "CATEGORY",
        category: page.category,
        isPublished: true,
      },
      select: {
        slug: true,
        title: true,
      },
    });
  }

  // 7. Generate Rich Structured Data Schemas
  const schemas = generateSeoKeywordPageSchemas({
    slug: page.slug,
    title: page.title,
    targetKeyword: page.targetKeyword,
    categoryName: parentCategoryPage?.title?.split("—")[0]?.trim() || page.category || undefined,
    localityName: page.locality || undefined,
    faqItems: (page.faqItems as any) || null,
    products: products.map((p) => {
      const defaultVariant = p.variants?.[0];
      const price = defaultVariant?.pricePerBox ?? p.pricePerSqft ?? 0;
      return {
        name: p.name,
        slug: p.slug,
        price,
        image: p.images?.[0],
      };
    }),
  });

  const pageData: SeoLandingPageData = {
    id: page.id,
    slug: page.slug,
    pageType: page.pageType,
    category: page.category,
    locality: page.locality,
    targetKeyword: page.targetKeyword,
    title: page.title,
    metaDescription: page.metaDescription,
    h1: page.h1,
    introContent: page.introContent,
    faqItems: (page.faqItems as any) || null,
    updatedAt: page.updatedAt.toISOString(),
  };

  return (
    <>
      <JsonLd data={schemas.breadcrumbSchema} id={`seo-breadcrumb-${page.id}`} />
      <JsonLd data={schemas.localBusinessSchema} id={`seo-localbusiness-${page.id}`} />
      {schemas.faqSchema && <JsonLd data={schemas.faqSchema} id={`seo-faq-${page.id}`} />}
      {schemas.itemListSchema && <JsonLd data={schemas.itemListSchema} id={`seo-itemlist-${page.id}`} />}

      <SeoLandingPageClient
        pageData={pageData}
        products={products}
        siblingPages={siblingPages}
        parentCategoryPage={parentCategoryPage}
      />
    </>
  );
}
