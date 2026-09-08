import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import BottomTabBar from "@/components/BottomTabBar";
import LoginModal from "@/components/auth/LoginModal";
import GoogleSessionHydrator from "@/components/auth/GoogleSessionHydrator";
import GoogleAnalyticsTracker from "@/components/analytics/GoogleAnalyticsTracker";
import AddToCartToast from "@/components/cart/AddToCartToast";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import { Toaster } from "sonner";

import Script from "next/script";

import JsonLd from "@/components/JsonLd";
import {
  BASE_SITE_URL,
  generateRootGraphSchema,
} from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: {
    default: "IntriHub - Construction & Interior Materials Bangalore",
    template: "%s | IntriHub",
  },
  description:
    "Buy tiles, electrical, plumbing, plywood, hardware & furniture online at best prices. Fast delivery across Bengaluru & Pan-India with IntriHub.",
  keywords: [
    "Intrihub",
    "IntriHub",
    "intrihub",
    "intrihub.com",
    "www.intrihub.com",
    "Intrihub India",
    "Intrihub Bengaluru",
    "Intrihub Bangalore",
    "Intrihub QuickCommerce",
    "Intrihub Building Materials",
    "Intrihub Tiles",
    "Intrihub Granite",
    "Intrihub Sanitaryware",
    "Intrihub Electrical",
    "Intrihub Plywood",
    "Intrihub Interior Supplies",
    "Intrihub Online Store",
    "building materials marketplace",
    "construction supplies bangalore",
    "instant building materials delivery",
    "tiles and sanitaryware online",
    "electrical supplies direct bangalore",
  ],
  alternates: {
    canonical: BASE_SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "IntriHub - Construction & Interior Materials Bangalore",
    description:
      "Buy tiles, electrical, plumbing, plywood, hardware & furniture online at best prices. Delivery across Bengaluru.",
    type: "website",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
    locale: "en_IN",
    images: [
      {
        url: `${BASE_SITE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        alt: "IntriHub QuickCommerce — Build Better. We Deliver Faster. Delivery in 60 Minutes — Shop Now at www.intrihub.com",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntriHub - Construction & Interior Materials Bangalore",
    description:
      "Buy tiles, electrical, plumbing, plywood, hardware & furniture online at best prices. Delivery across Bengaluru.",
    images: [`${BASE_SITE_URL}/og-image.png?v=2`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rootGraphSchema = generateRootGraphSchema();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-EGVGF17EPS";

  return (
    <html
      lang="en"
      className={`${jakarta.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        {/* Developed & Founded by Sahil Sheikh | Instagram: @sahil_sheikh78 | Founder & Lead Architect */}
        <meta name="author" content="Sahil Sheikh (@sahil_sheikh78)" />
        <meta name="founder" content="Sahil Sheikh (@sahil_sheikh78)" />
        <meta name="developer" content="Sahil Sheikh (@sahil_sheikh78)" />
        <meta name="designer" content="Sahil Sheikh (@sahil_sheikh78)" />
        <Script
          id="developer-credit"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `console.log("%c🚀 Intrihub — Build Better, We Deliver Faster%c\\n✨ Founded & Developed by Sahil Sheikh (@sahil_sheikh78)\\n📸 Instagram: https://instagram.com/sahil_sheikh78\\n💼 Founder & CEO | Intrihub Supply Network", "background: #052a51; color: #F26522; font-size: 14px; font-weight: 900; padding: 6px 12px; border-radius: 6px;", "color: #052a51; font-size: 12px; font-weight: 700; line-height: 1.6;");`,
          }}
        />

        {/* Preconnect to High-Priority Asset & Image CDNs */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.orientbell.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://rukmini1.flixcart.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://5.imimg.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://encrypted-tbn0.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

        {/* Google Analytics 4 (gtag.js) */}
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaMeasurementId}', {
                page_path: window.location.pathname,
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900 pb-[60px] md:pb-0">
        {/* Unified Schema.org Structured Data @graph (Organization + LocalBusiness + WebSite) */}
        <JsonLd data={rootGraphSchema} id="root-entity-graph" />
        <QuoteModalProvider>
          {children}
          <CartDrawer />
          <AddToCartToast />
          <BottomTabBar />
          <LoginModal />
          <PwaInstallPrompt />
          <Toaster position="top-center" richColors />
          <Suspense fallback={null}>
            <GoogleSessionHydrator />
            <GoogleAnalyticsTracker measurementId={gaMeasurementId} />
          </Suspense>
        </QuoteModalProvider>
      </body>
    </html>
  );
}
