import { MetadataRoute } from "next";
import { BASE_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/shop",
        "/shop/*",
        "/categories",
        "/product/*",
        "/guides",
        "/guides/*",
        "/about",
        "/contact",
        "/founder",
        "/faq",
        "/designs",
        "/shipping-policy",
        "/returns-policy",
        "/privacy-policy",
        "/terms",
        "/for-architects",
        "/for-contractors",
        "/for-interior-designers",
        "/favicon.ico",
        "/favicon-32x32.png",
        "/favicon-16x16.png",
        "/apple-touch-icon.png",
        "/og-image.png",
        "/site.webmanifest",
      ],
      disallow: [
        "/api/",
        "/admin/",
        "/vendor/",
        "/account/",
        "/cart/",
        "/checkout/",
        "/checkout-v2/",
        "/upload/",
      ],
    },
    sitemap: `${BASE_SITE_URL}/sitemap.xml`,
  };
}
