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

import { BASE_SITE_URL, generateOrganizationSchema, generateWebSiteSchema, safeJsonLd } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: {
    default: "IntriHub | Building Materials Marketplace — Bengaluru & Pan-India",
    template: "%s | IntriHub",
  },
  description:
    "IntriHub — India's instant building & interior materials quick-commerce marketplace. Direct factory delivery within 60 minutes for tiles, electrical, plumbing, sanitaryware, and hardware across Bengaluru & Pan-India.",
  keywords: [
    "IntriHub",
    "IntriHub QuickCommerce",
    "building materials marketplace",
    "construction supplies bangalore",
    "instant building materials delivery",
    "tiles and sanitaryware online",
    "electrical supplies wholesale bangalore",
    "lighting fixtures india",
    "plywood and hardware online",
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
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "IntriHub | Building Materials Marketplace — Bengaluru & Pan-India",
    description:
      "IntriHub — India's instant building materials quick-commerce network. Factory-direct delivery within 60 minutes for electrical, lighting, tiles, plumbing, and hardware.",
    type: "website",
    url: BASE_SITE_URL,
    siteName: "IntriHub",
    locale: "en_IN",
    images: [
      {
        url: "/logo/intri-web-logo.png",
        width: 1200,
        height: 630,
        alt: "IntriHub - Building Materials Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntriHub | Building Materials Marketplace — Bengaluru & Pan-India",
    description:
      "IntriHub — India's instant building materials quick-commerce network. Direct factory site delivery within 60 minutes.",
    images: ["/logo/intri-web-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <script
          dangerouslySetInnerHTML={{
            __html: `console.log("%c🚀 Intrihub — Everything for Every Space%c\\n✨ Founded & Developed by Sahil Sheikh (@sahil_sheikh78)\\n📸 Instagram: https://instagram.com/sahil_sheikh78\\n💼 Founder & CEO | Intrihub Supply Network", "background: #052a51; color: #F26522; font-size: 14px; font-weight: 900; padding: 6px 12px; border-radius: 6px;", "color: #052a51; font-size: 12px; font-weight: 700; line-height: 1.6;");`,
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
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        />
        <script
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
        {/* Schema.org Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(websiteSchema),
          }}
        />
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
