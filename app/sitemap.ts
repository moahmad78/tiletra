import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { BASE_SITE_URL } from "@/lib/seo";
import { BUYING_GUIDES } from "@/lib/guides-data";

export const revalidate = 3600; // Revalidate every 1 hour (Section 4.5)

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
  ];

  // Buying Guide Routes
  const guideRoutes: MetadataRoute.Sitemap = BUYING_GUIDES.map((g) => ({
    url: `${BASE_SITE_URL}/guides/${g.slug}`,
    lastModified: new Date(g.updatedAt),
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

    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${BASE_SITE_URL}/shop/${cat.slug}`,
      lastModified: cat.updatedAt || new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    }));

    const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
      url: `${BASE_SITE_URL}/product/${prod.slug}`,
      lastModified: prod.updatedAt || new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...guideRoutes, ...categoryRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error generating dynamic sitemap:", error);
    return [...staticRoutes, ...guideRoutes];
  }
}
