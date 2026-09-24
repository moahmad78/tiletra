import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://checkout.razorpay.com https://*.sentry.io;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https:;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://*.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.sentry.io https://api.razorpay.com https://lumberjack.razorpay.com https://*.intrihub.com wss://*.intrihub.com http://localhost:* ws://localhost:*;
  frame-src 'self' https://www.googletagmanager.com https://api.razorpay.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\s{2,}/g, " ").trim();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "no-referrer-when-downgrade" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "intrihub",
  project: "javascript-nextjs",
  silent: !process.env.CI,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
