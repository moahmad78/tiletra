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
import { SEO_PAGES_SEED_DATA } from "@/prisma/seed-seo-pages";

export const revalidate = 3600; // 1 hour ISR revalidation

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return SEO_PAGES_SEED_DATA.map((item) => ({
    slug: item.slug.split("/"),
  }));
}

async function getSeoPageData(slug: string) {
  let page: any = null;
  try {
    page = await prisma.seoPage.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.warn(`Prisma error fetching SeoPage for slug ${slug}, using fallback data:`, error);
  }

  if (page && page.isPublished) {
    return { page, redirectUrl: null };
  }

  // Check alias in DB
  try {
    const aliasMatch = await prisma.seoPage.findFirst({
      where: {
        aliases: { has: slug },
        isPublished: true,
      },
    });
    if (aliasMatch) {
      return { page: null, redirectUrl: `${BASE_SITE_URL}/${aliasMatch.slug}` };
    }
  } catch (error) {
    // fallback
  }

  // Fallback to SEO_PAGES_SEED_DATA
  const seedMatch = SEO_PAGES_SEED_DATA.find((p) => p.slug === slug);
  if (seedMatch) {
    return {
      page: {
        id: `seed-${seedMatch.slug.replace(/[^a-zA-Z0-9]/g, "-")}`,
        slug: seedMatch.slug,
        aliases: seedMatch.aliases || [],
        pageType: seedMatch.pageType,
        category: seedMatch.category,
        locality: seedMatch.locality || null,
        targetKeyword: seedMatch.targetKeyword,
        title: seedMatch.title,
        metaDescription: seedMatch.metaDescription,
        h1: seedMatch.h1,
        introContent: seedMatch.introContent,
        faqItems: seedMatch.faqItems,
        productFilter: seedMatch.productFilter,
        isPublished: true,
        updatedAt: new Date("2026-09-20"),
      },
      redirectUrl: null,
    };
  }

  const aliasSeed = SEO_PAGES_SEED_DATA.find((p) => p.aliases?.includes(slug));
  if (aliasSeed) {
    return { page: null, redirectUrl: `${BASE_SITE_URL}/${aliasSeed.slug}` };
  }

  return { page: null, redirectUrl: null };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug;

  const { page, redirectUrl } = await getSeoPageData(slug);

  if (redirectUrl) {
    return {
      title: "Redirecting...",
      alternates: {
        canonical: redirectUrl,
      },
    };
  }

  if (!page || !page.isPublished) {
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

  // 1. Direct Slug Lookup & Alias Lookup
  const { page, redirectUrl } = await getSeoPageData(slug);

  if (redirectUrl) {
    permanentRedirect(redirectUrl.replace(BASE_SITE_URL, ""));
  }

  if (!page || !page.isPublished) {
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
    try {
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
    } catch (error) {
      // fallback to seed data
    }

    if (siblingPages.length === 0) {
      siblingPages = SEO_PAGES_SEED_DATA
        .filter((p) => p.category === page.category && p.slug !== page.slug)
        .slice(0, 4)
        .map((p) => ({
          slug: p.slug,
          title: p.title,
          targetKeyword: p.targetKeyword,
          pageType: p.pageType,
        }));
    }
  }

  // 6. Fetch Parent Category Page
  let parentCategoryPage: { slug: string; title: string } | null = null;
  if (page.pageType !== "CATEGORY" && page.category) {
    try {
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
    } catch (error) {
      // fallback to seed data
    }

    if (!parentCategoryPage) {
      const parentSeed = SEO_PAGES_SEED_DATA.find(
        (p) => p.pageType === "CATEGORY" && p.category === page.category
      );
      if (parentSeed) {
        parentCategoryPage = { slug: parentSeed.slug, title: parentSeed.title };
      }
    }
  }

  // 7. Fetch Subcategory Pages (for Category pages) & Price Guide Pages (for Category & Subcategory pages)
  let subCategoryPages: Array<{ slug: string; title: string; targetKeyword: string }> = [];
  let priceGuidePages: Array<{ slug: string; title: string; targetKeyword: string }> = [];

  if (page.category) {
    if (page.pageType === "CATEGORY") {
      try {
        subCategoryPages = await prisma.seoPage.findMany({
          where: {
            category: page.category,
            pageType: "SUBCATEGORY",
            isPublished: true,
          },
          select: {
            slug: true,
            title: true,
            targetKeyword: true,
          },
        });
      } catch (error) {
        // fallback
      }

      if (subCategoryPages.length === 0) {
        subCategoryPages = SEO_PAGES_SEED_DATA
          .filter((p) => p.category === page.category && p.pageType === "SUBCATEGORY")
          .map((p) => ({
            slug: p.slug,
            title: p.title,
            targetKeyword: p.targetKeyword,
          }));
      }
    }

    if (page.pageType === "CATEGORY" || page.pageType === "SUBCATEGORY") {
      try {
        priceGuidePages = await prisma.seoPage.findMany({
          where: {
            category: page.category,
            pageType: "PRICE_INTENT",
            isPublished: true,
          },
          select: {
            slug: true,
            title: true,
            targetKeyword: true,
          },
        });
      } catch (error) {
        // fallback
      }

      if (priceGuidePages.length === 0) {
        priceGuidePages = SEO_PAGES_SEED_DATA
          .filter((p) => p.category === page.category && p.pageType === "PRICE_INTENT")
          .map((p) => ({
            slug: p.slug,
            title: p.title,
            targetKeyword: p.targetKeyword,
          }));
      }
    }
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
        subCategoryPages={subCategoryPages}
        priceGuidePages={priceGuidePages}
      />
    </>
  );
}
