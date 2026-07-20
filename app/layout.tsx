import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { QuoteModalProvider } from "@/components/QuoteModalProvider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tiletra | Premium Tile Contractor in Bangalore",
  description: "Tiletra is a professional tile contractor in Bangalore offering floor tile installation, wall tile installation, bathroom tiles, kitchen tiles, marble, granite, and commercial tile solutions. Contact us today for a free site visit and quotation.",
  openGraph: {
    title: "Tiletra | Premium Tile Contractor in Bangalore",
    description: "Tiletra is a professional tile contractor in Bangalore offering floor tile installation, wall tile installation, bathroom tiles, kitchen tiles, marble, granite, and commercial tile solutions. Contact us today for a free site visit and quotation.",
    type: "website",
    images: ["/Tiletra/logo/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tiletra | Premium Tile Contractor in Bangalore",
    description: "Tiletra is a professional tile contractor in Bangalore offering floor tile installation, wall tile installation, bathroom tiles, kitchen tiles, marble, granite, and commercial tile solutions. Contact us today for a free site visit and quotation.",
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
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
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
        </QuoteModalProvider>
      </body>
    </html>
  );
}
