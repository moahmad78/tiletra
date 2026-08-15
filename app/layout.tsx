import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import BottomTabBar from "@/components/BottomTabBar";
import LoginModal from "@/components/auth/LoginModal";
import { Toaster } from "sonner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiletra | Quality Tiles for Strong Spaces",
  description: "Tiletra — India's premium tile store. Shop floor tiles, wall tiles, bathroom tiles, kitchen tiles, outdoor & designer tiles. Free delivery on orders above ₹15,000. Browse 200+ curated tiles online.",
  openGraph: {
    title: "Tiletra | Quality Tiles for Strong Spaces",
    description: "Shop premium floor, wall, bathroom, kitchen & outdoor tiles at Tiletra. Free delivery above ₹15,000. 200+ curated tiles, expert advice.",
    type: "website",
    images: ["/Tiletra/logo/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiletra | Quality Tiles for Strong Spaces",
    description: "Shop premium floor, wall, bathroom & kitchen tiles at Tiletra. Free delivery above ₹15,000.",
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
        <link rel="icon" href="/Tiletra/logo/icon.png" sizes="any" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900 pb-[60px] md:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Tiletra",
              "image": "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop",
              "@id": "",
              "url": "https://tiletra.in",
              "telephone": "+917870935277",
              "email": "vishalpoddar393@gmail.com",
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
                "name": "Vishal Poddar"
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
          <BottomTabBar />
          <LoginModal />
          <Toaster position="top-center" richColors />
        </QuoteModalProvider>
      </body>
    </html>
  );
}
