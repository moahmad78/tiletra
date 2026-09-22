import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import {
  getTrendingProducts,
  getBestsellerProducts,
  getNewArrivalProducts,
} from "@/lib/actions/products";
import { getOfferBanners } from "@/lib/actions/settings";
import HomeClient from "@/components/HomeClient";
import JsonLd from "@/components/JsonLd";
import { generateHomepageFaqSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Build Better, We Deliver Faster | IntriHub",
  description:
    "Buy tiles, electrical, plumbing & hardware supplies online at best prices. Build Better, We Deliver Faster across Bengaluru & Pan-India with IntriHub.",
  alternates: {
    canonical: "https://www.intrihub.com/",
  },
  openGraph: {
    title: "Build Better, We Deliver Faster | IntriHub",
    description:
      "Buy tiles, electrical, plumbing & hardware supplies online at best prices. Build Better, We Deliver Faster across Bengaluru & Pan-India with IntriHub.",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Build Better, We Deliver Faster | IntriHub",
    description:
      "Buy tiles, electrical, plumbing & hardware supplies online at best prices. Build Better, We Deliver Faster across Bengaluru & Pan-India with IntriHub.",
  },
};

// Revalidate page on demand or periodically
export const revalidate = 60;

export default async function HomePage() {
  const [categories, trending, bestsellers, newArrivals, banners] = await Promise.all([
    getCategories(),
    getTrendingProducts(8),
    getBestsellerProducts(8),
    getNewArrivalProducts(8),
    getOfferBanners(),
  ]);

  const faqSchema = generateHomepageFaqSchema();

  return (
    <>
      <JsonLd data={faqSchema} id="homepage-faq-schema" />
      <h1 className="sr-only">
        IntriHub — Interior &amp; Construction Materials, Delivered Across Karnataka &amp; Pan-India
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
