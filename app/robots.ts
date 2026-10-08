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
    "/admin/*",
    "/vendor",
    "/vendor/",
    "/vendor/*",
    "/cpo",
    "/cpo/",
    "/cpo/*",
    "/api/",
    "/upload",
    "/upload/",
    "/delete-account",
    "/delete-account/",
    "/wishlist",
    "/wishlist/",
    "/search",
    "/search?*",
  ];

  const commonAllows = [
    "/",
    "/vendor/apply",
    "/shop/outdoor-tiles",
    "/inspiration",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: commonAllows,
        disallow: commonDisallows,
      },
      {
        userAgent: "Google-Extended",
        allow: commonAllows,
        disallow: commonDisallows,
      },
      {
        userAgent: "GPTBot",
        allow: commonAllows,
        disallow: commonDisallows,
      },
      {
        userAgent: "PerplexityBot",
        allow: commonAllows,
        disallow: commonDisallows,
      },
      {
        userAgent: "ClaudeBot",
        allow: commonAllows,
        disallow: commonDisallows,
      },
    ],
    sitemap: `${BASE_SITE_URL}/sitemap.xml`,
  };
}

