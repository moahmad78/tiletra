import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { getHomepageSections } from "@/lib/actions/products";
import { getOfferBanners } from "@/lib/actions/settings";
import HomeClient from "@/components/HomeClient";
import JsonLd from "@/components/JsonLd";
import { generateHomepageFaqSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "IntriHub – Every Material. Every Space.",
  },
  description:
    "Shop tiles, hardware, electrical, lighting and construction materials online with IntriHub. Quality materials, competitive prices and fast delivery across Bengaluru.",
  alternates: {
    canonical: "https://www.intrihub.com/",
  },
  openGraph: {
    title: "IntriHub – Every Material. Every Space.",
    description:
      "Shop interior and construction materials online. Everything you need for every space, delivered across Bengaluru.",
    type: "website",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
    images: [
      {
        url: "https://www.intrihub.com/images/intrihub-og-image.jpg",
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
    images: ["https://www.intrihub.com/images/intrihub-og-image.jpg"],
  },
};

// ISR: 1 hour background revalidation; purged on-demand when catalog is updated
export const revalidate = 3600;

export default async function HomePage() {
  const [categories, sections, banners] = await Promise.all([
    getCategories(),
    getHomepageSections(),
    getOfferBanners(),
  ]);

  const { trending, bestsellers, newArrivals } = sections;
  const faqSchema = generateHomepageFaqSchema();

  return (
    <>
      <JsonLd data={faqSchema} id="homepage-faq-schema" />
      <h1 className="sr-only">
        IntriHub — Every Material. Every Space. | Buy Standard Tiles, Hardware Supplies &amp; Construction Items Online
      </h1>
      <HomeClient
        categories={categories}
        trending={trending}
        bestsellers={bestsellers}
        newArrivals={newArrivals}
        banners={banners}
      />
    </>
  );
}
