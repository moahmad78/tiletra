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
import { Toaster } from "sonner";
import { LanguageProvider } from "@/components/translate/LanguageProvider";
import GoogleTranslateBootstrap from "@/components/translate/GoogleTranslateBootstrap";
import RealtimeGlobalSync from "@/components/realtime/RealtimeGlobalSync";

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
    default: "IntriHub | Building Materials Online, 60-Minute Delivery in Bengaluru",
    template: "%s | IntriHub",
  },
  description:
    "Shop tiles, hardware, electrical, lighting and construction materials online with IntriHub. Quality materials, competitive prices and fast delivery across Bengaluru.",
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
    title: "IntriHub – Every Material. Every Space.",
    description:
      "Shop interior and construction materials online. Everything you need for every space, delivered across Bengaluru.",
    type: "website",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
    locale: "en_IN",
    images: [
      {
        url: `${BASE_SITE_URL}/images/intrihub-og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "IntriHub – Every Material. Every Space.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IntriHub – Every Material. Every Space.",
    description:
      "Shop interior and construction materials online. Everything you need for every space, delivered across Bengaluru.",
    images: [`${BASE_SITE_URL}/images/intrihub-og-image.jpg`],
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
      className={`${jakarta.variable} ${devanagari.variable} h-full antialiased`}
    >
      <head>
        {/* DOM Mutation Safety Patch: High-performance try/catch fallback preventing React 19 reconciliation crashes if Google Translate wraps nodes in <font> without slowing down native DOM fast-paths */}
        <script
          id="dom-mutation-safety-patch"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (typeof Node === 'function' && Node.prototype && !Node.prototype.__intrihub_dom_safe) {
                  Node.prototype.__intrihub_dom_safe = true;
                  var origRemoveChild = Node.prototype.removeChild;
                  Node.prototype.removeChild = function(child) {
                    try {
                      return origRemoveChild.call(this, child);
                    } catch (err) {
                      if (child && child.parentNode && child.parentNode !== this) {
                        return origRemoveChild.call(child.parentNode, child);
                      }
                      throw err;
                    }
                  };
                  var origInsertBefore = Node.prototype.insertBefore;
                  Node.prototype.insertBefore = function(newNode, refNode) {
                    try {
                      return origInsertBefore.call(this, newNode, refNode);
                    } catch (err) {
                      if (refNode && refNode.parentNode && refNode.parentNode !== this) {
                        return origInsertBefore.call(refNode.parentNode, newNode, refNode);
                      }
                      throw err;
                    }
                  };
                }
              })();
            `,
          }}
        />
        {/* IntriHub Pvt Ltd | Official Platform */}
        <meta name="author" content="IntriHub Pvt Ltd" />
        <meta name="publisher" content="IntriHub Pvt Ltd" />
        <meta name="copyright" content="IntriHub Pvt Ltd" />

        {/* Preconnect to Required Services & Web Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap"
          as="style"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600;700&display=swap"
          media="print"
          // @ts-ignore
          onLoad="this.media='all'"
        />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

        {/* Preload Responsive Hero Banner Image for High-Speed LCP */}
        <link
          rel="preload"
          as="image"
          href="/images/banners/banner-slide-1-1400.webp"
          type="image/webp"
          media="(min-width: 768px)"
          // @ts-ignore
          fetchPriority="high"
          // @ts-ignore
          fetchpriority="high"
        />
        <link
          rel="preload"
          as="image"
          href="/images/banners/banner-slide-1-750.webp"
          type="image/webp"
          media="(max-width: 767px)"
          // @ts-ignore
          fetchPriority="high"
          // @ts-ignore
          fetchpriority="high"
        />

        {/* Deferred Google Tag Manager & Google Analytics (Zero TBT Impact) */}
        <Script
          id="deferred-analytics-gtm"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var loaded = false;
                function initAnalytics() {
                  if (loaded) return;
                  loaded = true;

                  // 1. GTM
                  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','GTM-PPTSVRKM');

                  // 2. GA4
                  var s = document.createElement('script');
                  s.src = 'https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}';
                  s.async = true;
                  document.head.appendChild(s);
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
                }

                var events = ['pointerdown', 'touchstart', 'scroll', 'keydown'];
                function onUserTouch() {
                  events.forEach(function(e) { window.removeEventListener(e, onUserTouch); });
                  initAnalytics();
                }
                events.forEach(function(e) { window.addEventListener(e, onUserTouch, { passive: true, once: true }); });

                if ('requestIdleCallback' in window) {
                  window.requestIdleCallback(function() { setTimeout(initAnalytics, 1500); });
                } else {
                  setTimeout(initAnalytics, 2500);
                }
              })();
            `,
          }}
        />

        {/* On-Demand Google Website Translator Engine */}
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

              (function() {
                var hasNonEnglish = false;
                try {
                  var cookies = document.cookie.split(';');
                  for (var i = 0; i < cookies.length; i++) {
                    var c = cookies[i].trim();
                    if (c.indexOf('googtrans=') === 0 && c !== 'googtrans=/en/en') {
                      hasNonEnglish = true;
                      break;
                    }
                  }
                  if (!hasNonEnglish && localStorage.getItem('intrihub_user_lang') && localStorage.getItem('intrihub_user_lang') !== 'en') {
                    hasNonEnglish = true;
                  }
                } catch (e) {}

                var loaded = false;
                function loadGTranslate() {
                  if (loaded) return;
                  loaded = true;
                  var s = document.createElement('script');
                  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                  s.async = true;
                  document.head.appendChild(s);
                }

                if (hasNonEnglish) {
                  loadGTranslate();
                } else {
                  var events = ['pointerdown', 'touchstart', 'scroll', 'keydown'];
                  function onInteraction() {
                    events.forEach(function(e) { window.removeEventListener(e, onInteraction); });
                    loadGTranslate();
                  }
                  events.forEach(function(e) { window.addEventListener(e, onInteraction, { passive: true, once: true }); });
                  if ('requestIdleCallback' in window) {
                    window.requestIdleCallback(function() { setTimeout(loadGTranslate, 3500); });
                  } else {
                    setTimeout(loadGTranslate, 5000);
                  }
                }
              })();
            `,
          }}
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
            <RealtimeGlobalSync />
            <CartDrawer />
            <AddToCartToast />
            <BottomTabBar />
            <LoginModal />
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
