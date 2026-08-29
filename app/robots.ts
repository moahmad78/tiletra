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
