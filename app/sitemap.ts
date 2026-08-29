import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BASE_SITE_URL } from "@/lib/seo";
import { BUYING_GUIDES } from "@/lib/guides-data";
import { products as defaultProducts } from "@/lib/data/products";
import { categories as defaultCategories } from "@/lib/data/categories";

export const revalidate = 3600; // Revalidate every 1 hour

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
      url: `${BASE_SITE_URL}/designs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
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
  ];

  // Buying Guide Routes
  const guideRoutes: MetadataRoute.Sitemap = BUYING_GUIDES.map((g) => ({
    url: `${BASE_SITE_URL}/guides/${g.slug}`,
    lastModified: new Date(g.updatedAt || Date.now()),
    changeFrequency: "weekly",
    priority: 0.85,
  }));

  try {
    const [categories, products] = await Promise.all([
      prisma.category.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.product.findMany({
        where: {
          approvalStatus: "approved",
          status: "active",
        },
        select: { slug: true, updatedAt: true },
        take: 5000,
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
            .filter((p) => (p.status || "active") === "active")
            .map((p) => ({ slug: p.slug, updatedAt: new Date() }));

    const categoryRoutes: MetadataRoute.Sitemap = resolvedCategories
      .filter((cat) => Boolean(cat.slug))
      .map((cat) => ({
        url: `${BASE_SITE_URL}/shop/${encodeURIComponent(cat.slug)}`,
        lastModified: cat.updatedAt instanceof Date ? cat.updatedAt : new Date(),
        changeFrequency: "daily",
        priority: 0.85,
      }));

    const productRoutes: MetadataRoute.Sitemap = resolvedProducts
      .filter((prod) => Boolean(prod.slug))
      .map((prod) => ({
        url: `${BASE_SITE_URL}/product/${encodeURIComponent(prod.slug)}`,
        lastModified: prod.updatedAt instanceof Date ? prod.updatedAt : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    // Deduplicate entries by canonical URL
    const allRoutes = [...staticRoutes, ...guideRoutes, ...categoryRoutes, ...productRoutes];
    const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const route of allRoutes) {
      if (!uniqueMap.has(route.url)) {
        uniqueMap.set(route.url, route);
      }
    }

    return Array.from(uniqueMap.values());
  } catch (error) {
    console.error("Error generating dynamic sitemap from DB, falling back to static catalog:", error);

    const fallbackCategoryRoutes: MetadataRoute.Sitemap = defaultCategories
      .filter((cat) => Boolean(cat.slug))
      .map((cat) => ({
        url: `${BASE_SITE_URL}/shop/${encodeURIComponent(cat.slug)}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.85,
      }));

    const fallbackProductRoutes: MetadataRoute.Sitemap = defaultProducts
      .filter((p) => Boolean(p.slug) && (p.status || "active") === "active")
      .map((prod) => ({
        url: `${BASE_SITE_URL}/product/${encodeURIComponent(prod.slug)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    const allFallback = [
      ...staticRoutes,
      ...guideRoutes,
      ...fallbackCategoryRoutes,
      ...fallbackProductRoutes,
    ];

    const uniqueMap = new Map<string, MetadataRoute.Sitemap[number]>();
    for (const route of allFallback) {
      if (!uniqueMap.has(route.url)) {
        uniqueMap.set(route.url, route);
      }
    }

    return Array.from(uniqueMap.values());
  }
}
