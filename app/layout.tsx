import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Noto_Sans_Devanagari } from "next/font/google";
import { cookies } from "next/headers";
import { Suspense } from "react";
import "./globals.css";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import BottomTabBar from "@/components/BottomTabBar";
import LoginModal from "@/components/auth/LoginModal";
import GoogleSessionHydrator from "@/components/auth/GoogleSessionHydrator";
import GoogleAnalyticsTracker from "@/components/analytics/GoogleAnalyticsTracker";
import AddToCartToast from "@/components/cart/AddToCartToast";
import AppInstallPrompt from "@/components/pwa/AppInstallPrompt";
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/translate/LanguageProvider";
import GoogleTranslateBootstrap from "@/components/translate/GoogleTranslateBootstrap";

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

const devanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});



export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#052a51" },
    { media: "(prefers-color-scheme: dark)", color: "#052a51" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_SITE_URL),
  referrer: "no-referrer-when-downgrade",
  title: {
    default: "Every Material. Every Space. | IntriHub",
    template: "%s | IntriHub",
  },
  description:
    "IntriHub: Every Material. Every Space. Buy vitrified tiles, electrical, plumbing, sanitaryware, plywood & hardware online with fast site delivery.",
  keywords: [
    "Intrihub",
    "IntriHub",
    "intrihub",
    "intrihub.com",
    "www.intrihub.com",
    "Sahil Sheikh",
    "Sahil Sheikh Intrihub",
    "Sahil Sheikh Founder",
    "Sahil Sheikh CEO",
    "Sahil Sheikh CTO",
    "Sahil Sheikh Maharajganj",
    "Intrihub Quickcommerce",
    "Intrihub QuickCommerce",
    "India's first company to digitalize local markets",
    "Digital India local market revolution",
    "Intrihub India",
    "Intrihub Bengaluru",
    "Intrihub Bangalore",
    "Intrihub Building Materials",
    "Intrihub Tiles",
    "Intrihub Granite",
    "Intrihub Sanitaryware",
    "Intrihub Electrical",
    "Intrihub Plywood",
    "Intrihub Hardware",
    "Intrihub Interior Supplies",
    "Intrihub Online Store",
    "building materials marketplace",
    "construction supplies bangalore",
    "instant building materials delivery",
    "tiles and sanitaryware online",
    "electrical supplies direct bangalore",
    "interior supplies marketplace",
    "interior materials bangalore",
    "tile delivery bangalore",
    "building materials online",
    "electrical supplies bangalore",
    "plumbing supplies bangalore",
    "plywood supplier bangalore",
    "quick delivery building materials",
    "b2b construction supplies",
  ],
  authors: [
    { name: "Sahil Sheikh", url: `${BASE_SITE_URL}/founder` },
    { name: "IntriHub", url: BASE_SITE_URL },
  ],
  creator: "Sahil Sheikh (Founder, CEO & CTO)",
  publisher: "IntriHub Quickcommerce",
  formatDetection: {
    telephone: true,
    date: false,
    address: true,
    email: true,
    url: true,
  },
  category: "Building & Construction Materials",
  alternates: {
    canonical: "https://www.intrihub.com/",
    languages: {
      "en": "https://www.intrihub.com/",
      "hi": "https://www.intrihub.com/?lang=hi",
      "kn": "https://www.intrihub.com/?lang=kn",
      "x-default": "https://www.intrihub.com/",
    },
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
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Every Material. Every Space. | IntriHub",
    description:
      "IntriHub — Every Material. Every Space. Buy vitrified tiles, electrical, plumbing, plywood, hardware & interior supplies online with instant doorstep site delivery.",
    type: "website",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
    locale: "en_IN",
    images: [
      {
        url: `${BASE_SITE_URL}/og-image.png?v=2`,
        width: 1200,
        height: 630,
        alt: "Every Material. Every Space. | IntriHub — Instant Building & Interior Materials Delivery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Every Material. Every Space. | IntriHub",
    description:
      "IntriHub — Every Material. Every Space. Buy vitrified tiles, electrical, plumbing, plywood, hardware & interior supplies online with instant doorstep site delivery.",
    images: [`${BASE_SITE_URL}/og-image.png?v=2`],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rootGraphSchema = generateRootGraphSchema();
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-EGVGF17EPS";
  const cookieStore = await cookies();
  const googtrans = cookieStore.get("googtrans")?.value;
  const currentLang = googtrans?.split("/")[2] || "en";

  return (
    <html
      lang={currentLang}
      className={`${jakarta.variable} ${devanagari.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        {/* DOM Mutation Safety Patch: Prevents React 19 hydration/reconciliation crashes from Google Translate wrapping nodes in <font> */}
        <script
          id="dom-mutation-safety-patch"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof Node === 'function' && Node.prototype && !Node.prototype.__intrihub_dom_safe) {
                  Node.prototype.__intrihub_dom_safe = true;
                  var origRemoveChild = Node.prototype.removeChild;
                  Node.prototype.removeChild = function(child) {
                    if (child && child.parentNode && child.parentNode !== this) {
                      return origRemoveChild.call(child.parentNode, child);
                    }
                    return origRemoveChild.apply(this, arguments);
                  };
                  var origInsertBefore = Node.prototype.insertBefore;
                  Node.prototype.insertBefore = function(newNode, refNode) {
                    if (refNode && refNode.parentNode && refNode.parentNode !== this) {
                      return origInsertBefore.call(refNode.parentNode, newNode, refNode);
                    }
                    return origInsertBefore.apply(this, arguments);
                  };
                }
              })();
            `,
          }}
        />
        {/* Google Tag Manager */}
        <Script
          id="google-tag-manager"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-PPTSVRKM');`,
          }}
        />
        {/* End Google Tag Manager */}

        {/* Developed & Founded by Sahil Sheikh | Instagram: @sahil_sheikh78 | Founder & Lead Architect */}
        <meta name="author" content="Sahil Sheikh (@sahil_sheikh78)" />
        <meta name="founder" content="Sahil Sheikh (@sahil_sheikh78)" />
        <meta name="developer" content="Sahil Sheikh (@sahil_sheikh78)" />
        <meta name="designer" content="Sahil Sheikh (@sahil_sheikh78)" />
        <Script
          id="developer-credit"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `console.log("%c🚀 Intrihub — Every Material. Every Space.%c\\n✨ Founded & Developed by Sahil Sheikh (@sahil_sheikh78)\\n📸 Instagram: https://instagram.com/sahil_sheikh78\\n💼 Founder & CEO | Intrihub Supply Network", "background: #052a51; color: #F26522; font-size: 14px; font-weight: 900; padding: 6px 12px; border-radius: 6px;", "color: #052a51; font-size: 12px; font-weight: 700; line-height: 1.6;");`,
          }}
        />

        {/* Preconnect to Required Services & Web Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        {/* Preload Hero Banner Image */}
        <link
          rel="preload"
          as="image"
          href="/images/banners/banner-slide-1-1400.webp"
          type="image/webp"
          // @ts-ignore
          fetchpriority="high"
        />

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
        {/* Google Website Translator Engine */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function() {
                try {
                  if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                    new window.google.translate.TranslateElement({
                      pageLanguage: 'en',
                      autoDisplay: false
                    }, 'google_translate_element');
                  }
                } catch (e) {}
              };
            `,
          }}
        />
        <Script
          id="google-translate-script"
          strategy="lazyOnload"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-PPTSVRKM"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {/* Unified Schema.org Structured Data @graph (Organization + LocalBusiness + WebSite) */}
        <JsonLd data={rootGraphSchema} id="root-entity-graph" />
        <LanguageProvider>
          <QuoteModalProvider>
            {children}
            <CartDrawer />
            <AddToCartToast />
            <BottomTabBar />
            <LoginModal />
            <AppInstallPrompt />
            <Toaster position="top-center" richColors />
            <Suspense fallback={null}>
              <GoogleSessionHydrator />
              <GoogleAnalyticsTracker measurementId={gaMeasurementId} />
            </Suspense>
          </QuoteModalProvider>
          <GoogleTranslateBootstrap />
        </LanguageProvider>
      </body>
    </html>
  );
}
