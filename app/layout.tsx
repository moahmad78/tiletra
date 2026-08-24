import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import BottomTabBar from "@/components/BottomTabBar";
import LoginModal from "@/components/auth/LoginModal";
import GoogleSessionHydrator from "@/components/auth/GoogleSessionHydrator";
import AddToCartToast from "@/components/cart/AddToCartToast";
import PwaInstallPrompt from "@/components/pwa/PwaInstallPrompt";
import { Toaster } from "sonner";

import { BASE_SITE_URL, generateOrganizationSchema, generateWebSiteSchema, safeJsonLd } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  title: {
    default: "Intrihub | Everything for Every Space",
    template: "%s | Intrihub",
  },
  description:
    "Intrihub — Everything for Every Space. Buy electrical, lighting, tiles, flooring, paint, sanitaryware, hardware, plywood, and furniture online with direct site delivery across Bangalore & Pan-India.",
  keywords: [
    "interior materials online",
    "construction supplies bangalore",
    "tiles and sanitaryware online",
    "electrical supplies wholesale",
    "lighting fixtures india",
    "building materials marketplace",
    "plywood and hardware online",
    "Intrihub",
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
    title: "Intrihub | Everything for Every Space",
    description:
      "Intrihub — India's premier online marketplace for interior & construction materials. Factory-direct delivery for electrical, lighting, tiles, plumbing, and hardware.",
    type: "website",
    url: BASE_SITE_URL,
    siteName: "Intrihub",
    locale: "en_IN",
    images: [
      {
        url: "/logo/intri-web-logo.png",
        width: 1200,
        height: 630,
        alt: "Intrihub - Everything for Every Space",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intrihub | Everything for Every Space",
    description:
      "Intrihub — End-to-end interior & construction materials online marketplace.",
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
          </Suspense>
        </QuoteModalProvider>
      </body>
    </html>
  );
}
