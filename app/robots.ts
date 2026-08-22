import { MetadataRoute } from "next";
import { BASE_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/vendor/",
        "/api/",
        "/account/",
        "/cart",
        "/checkout",
      ],
    },
    sitemap: `${BASE_SITE_URL}/sitemap.xml`,
  };
}



