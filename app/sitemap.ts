import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BASE_SITE_URL } from "@/lib/seo";
import { BUYING_GUIDES } from "@/lib/guides-data";
import { products as defaultProducts } from "@/lib/data/products";
import { categories as defaultCategories } from "@/lib/data/categories";
import { SEO_LOCATIONS } from "@/lib/data/seo-locations";

import { SEO_PAGES_SEED_DATA } from "@/prisma/seed-seo-pages";

export const revalidate = 3600; // Revalidate every 1 hour

// Strict regex patterns for paths that MUST NEVER appear in public sitemap
const EXCLUDED_SITEMAP_PATTERNS = [
  /^\/account(\/.*)?$/i,
  /^\/admin(\/.*)?$/i,
  /^\/vendor(?!\/apply$).*$/i, // excludes /vendor/* except /vendor/apply
  /^\/cart(\/.*)?$/i,
  /^\/checkout(\/.*)?$/i,
  /^\/checkout-v2(\/.*)?$/i,
  /^\/api(\/.*)?$/i,
  /^\/upload(\/.*)?$/i,
  /^\/designs(\/.*)?$/i, // Redirects to /shop
  /^\/inspiration(\/.*)?$/i, // Redirects to /shop
];

function isPublicIndexableUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const path = parsed.pathname.toLowerCase();

    // Must not match any excluded private/auth pattern
    if (EXCLUDED_SITEMAP_PATTERNS.some((pattern) => pattern.test(path))) {
      return false;
    }

    // Must not contain obvious test product slugs
    if (path.includes("test-") || path.includes("-test") || path.includes("/test")) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_SITE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_SITE_URL}/categories`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_SITE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE_SITE_URL}/for-architects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_SITE_URL}/for-interior-designers`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_SITE_URL}/for-contractors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_SITE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_SITE_URL}/vendor/apply`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_SITE_URL}/shipping-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_SITE_URL}/returns-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_SITE_URL}/founder`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_SITE_URL}/bulk-orders`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Buying Guide Routes
  const guideRoutes: MetadataRoute.Sitemap = BUYING_GUIDES.map((g) => ({
    url: `${BASE_SITE_URL}/guides/${g.slug}`,
    lastModified: new Date(g.updatedAt || Date.now()),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  try {
    const [categories, products, seoPages] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: {
          approvalStatus: "approved",
          status: "active",
          NOT: {
            OR: [
              { slug: { contains: "test", mode: "insensitive" } },
              { name: { contains: "test", mode: "insensitive" } },
            ],
          },
        },
        select: { slug: true, updatedAt: true },
        take: 5000,
      }),
      prisma.seoPage.findMany({
        where: { isPublished: true },
        select: { slug: true, pageType: true, updatedAt: true },
      }),
    ]);

    const resolvedCategories =
      categories.length > 0
        ? categories
        : defaultCategories.map((c) => ({ slug: c.slug, updatedAt: new Date() }));

    const resolvedProducts =
      products.length > 0
        ? products
        : defaultProducts
            .filter((p) => (p.status || "active") === "active" && !p.slug.toLowerCase().includes("test"))
            .map((p) => ({ slug: p.slug, updatedAt: new Date() }));

    const categoryRoutes: MetadataRoute.Sitemap = resolvedCategories
      .filter((cat) => Boolean(cat.slug) && !cat.slug.toLowerCase().includes("test"))
      .map((cat) => ({
        url: `${BASE_SITE_URL}/shop/${encodeURIComponent(cat.slug)}`,
        lastModified: cat.updatedAt instanceof Date ? cat.updatedAt : new Date(),
        changeFrequency: "daily",
        priority: 0.85,
      }));

    const productRoutes: MetadataRoute.Sitemap = resolvedProducts
      .filter((prod) => Boolean(prod.slug) && !prod.slug.toLowerCase().includes("test"))
      .map((prod) => ({
        url: `${BASE_SITE_URL}/product/${encodeURIComponent(prod.slug)}`,
        lastModified: prod.updatedAt instanceof Date ? prod.updatedAt : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    // Location sub-page routes: category × location matrix
    const locationRoutes: MetadataRoute.Sitemap = resolvedCategories
      .filter((cat) => Boolean(cat.slug) && !cat.slug.toLowerCase().includes("test"))
      .flatMap((cat) =>
        SEO_LOCATIONS.map((loc) => ({
          url: `${BASE_SITE_URL}/shop/${encodeURIComponent(cat.slug)}/${loc.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        }))
      );

    // Dynamic SEO Keyword Landing Page routes (Strictly primary slugs, zero aliases)
    const seoLandingRoutes: MetadataRoute.Sitemap = seoPages
      .filter((page) => Boolean(page.slug) && !page.slug.toLowerCase().includes("test"))
      .map((page) => ({
        url: `${BASE_SITE_URL}/${page.slug}`,
        lastModified: page.updatedAt instanceof Date ? page.updatedAt : new Date(),
        changeFrequency: page.pageType === "PRICE_INTENT" ? ("weekly" as const) : ("monthly" as const),
        priority: page.pageType === "CATEGORY" ? 0.8 : 0.6,
      }));

    // Deduplicate entries by canonical URL and filter out non-public/private/test URLs
    const allRoutes = [
      ...staticRoutes,
      ...guideRoutes,
      ...categoryRoutes,
      ...locationRoutes,
      ...productRoutes,
      ...seoLandingRoutes,
    ];

    const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const route of allRoutes) {
      if (!uniqueMap.has(route.url) && isPublicIndexableUrl(route.url)) {
        uniqueMap.set(route.url, route);
      }
    }

    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error("Error generating dynamic sitemap from DB, falling back to static catalog:", error);

    const fallbackCategoryRoutes: MetadataRoute.Sitemap = defaultCategories
      .filter((cat) => Boolean(cat.slug) && !cat.slug.toLowerCase().includes("test"))
      .map((cat) => ({
        url: `${BASE_SITE_URL}/shop/${encodeURIComponent(cat.slug)}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.85,
      }));

    const fallbackProductRoutes: MetadataRoute.Sitemap = defaultProducts
      .filter((p) => Boolean(p.slug) && (p.status || "active") === "active" && !p.slug.toLowerCase().includes("test"))
      .map((prod) => ({
        url: `${BASE_SITE_URL}/product/${encodeURIComponent(prod.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const fallbackSeoRoutes: MetadataRoute.Sitemap = SEO_PAGES_SEED_DATA.map((page) => ({
      url: `${BASE_SITE_URL}/${page.slug}`,
      lastModified: new Date(),
      changeFrequency: page.pageType === "PRICE_INTENT" ? ("weekly" as const) : ("monthly" as const),
      priority: page.pageType === "CATEGORY" ? 0.8 : 0.6,
    }));

    const allFallback = [
      ...staticRoutes,
      ...guideRoutes,
      ...fallbackCategoryRoutes,
      ...fallbackProductRoutes,
      ...fallbackSeoRoutes,
    ];

    const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const route of allFallback) {
      if (!uniqueMap.has(route.url) && isPublicIndexableUrl(route.url)) {
        uniqueMap.set(route.url, route);
      }
    }

    return Array.from(uniqueMap.values());
  }
}
