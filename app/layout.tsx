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
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://intrihub.com"),
  title: "Intrihub | Everything for Every Space.",
  description: "Intrihub — Everything for Every Space. Shop tiles, electricals, plumbing, hardware, plywood, granite, aluminum doors, and wallpaper online. Delivery across Bangalore & Pan-India.",
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
    title: "Intrihub | Everything for Every Space.",
    description: "Intrihub — Everything for Every Space. End-to-end interior and construction supplies: tiles, electrical, plumbing, hardware, plywood, granite & more.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://intrihub.com",
    images: ["/logo/intri-web-logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intrihub | Everything for Every Space.",
    description: "Intrihub — Everything for Every Space. End-to-end interior and construction supplies.",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Intrihub",
              "image": "/placeholders/product.svg",
              "@id": "",
              "url": process.env.NEXT_PUBLIC_APP_URL || "https://intrihub.com",
              "telephone": "+919264920211",
              "email": "info@intrihub.com",
              "address": {
                "@type": "PostalAddress",
                "streetAddress": "41, 10th A Cross Rd, Janapriya Layout, Classic Paradise Layout, Begur",
                "addressLocality": "Bengaluru",
                "addressRegion": "Karnataka",
                "postalCode": "560114",
                "addressCountry": "IN"
              },
              "geo": {
                "@type": "GeoCoordinates",
                "latitude": 12.879,
                "longitude": 77.625
              },
              "founder": {
                "@type": "Person",
                "name": "Sahil Sheikh",
                "jobTitle": "Founder & CEO",
                "sameAs": "https://www.instagram.com/sahil_sheikh78/"
              },
              "priceRange": "$$",
              "areaServed": {
                "@type": "City",
                "name": "Bangalore"
              }
            })
          }}
        />
        <QuoteModalProvider>
          {children}
          <CartDrawer />
          <AddToCartToast />
          <BottomTabBar />
          <LoginModal />
          <Toaster position="top-center" richColors />
          <Suspense fallback={null}>
            <GoogleSessionHydrator />
          </Suspense>
        </QuoteModalProvider>
      </body>
    </html>
  );
}
