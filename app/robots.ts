import { MetadataRoute } from "next";
import { BASE_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const commonDisallows = [
    "/cart",
    "/cart/",
    "/checkout",
    "/checkout/",
    "/checkout-v2",
    "/checkout-v2/",
    "/account",
    "/account/",
    "/admin",
    "/admin/",
    "/api/",
    "/upload/",
    "/delete-account",
    "/search?*",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: commonDisallows,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: commonDisallows,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: commonDisallows,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: commonDisallows,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: commonDisallows,
      },
    ],
    sitemap: `${BASE_SITE_URL}/sitemap.xml`,
  };
}

