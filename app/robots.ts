import { MetadataRoute } from "next";
import { BASE_SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/uploads/", "/api/feed/"],
        disallow: [
          "/admin",
          "/admin/",
          "/vendor",
          "/vendor/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/checkout/",
          "/api/auth/",
          "/api/payment/",
          "/api/create-order",
          "/api/verify-payment",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/api/uploads/", "/api/feed/"],
        disallow: [
          "/admin",
          "/admin/",
          "/vendor",
          "/vendor/",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/checkout/",
          "/api/auth/",
          "/api/payment/",
          "/api/create-order",
          "/api/verify-payment",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/api/uploads/", "/placeholders/", "/logo/"],
        disallow: ["/admin", "/vendor", "/account"],
      },
    ],
    sitemap: `${BASE_SITE_URL}/sitemap.xml`,
    host: BASE_SITE_URL,
  };
}


