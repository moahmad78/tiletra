import { MetadataRoute } from "next";
import { BASE_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/account/",
        "/cart/checkout-internal/",
        "/admin/",
        "/vendor/",
      ],
    },
    sitemap: `${BASE_SITE_URL}/sitemap.xml`,
  };
}



