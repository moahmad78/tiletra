import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { getHomepageSections } from "@/lib/actions/products";
import { getOfferBanners } from "@/lib/actions/settings";
import HomeClient from "@/components/HomeClient";
import JsonLd from "@/components/JsonLd";
import { generateHomepageFaqSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Buy Tiles, Hardware & Standard Construction Items Online | IntriHub",
  description:
    "Explore standard vitrified tiles, sanitaryware, electricals & hardware items online at best prices. Build Better, We Deliver Faster across Bengaluru & Karnataka.",
  alternates: {
    canonical: "https://www.intrihub.com/",
  },
  openGraph: {
    title: "Buy Tiles, Hardware & Standard Construction Items Online | IntriHub",
    description:
      "Explore standard vitrified tiles, sanitaryware, electricals & hardware items online at best prices. Build Better, We Deliver Faster across Bengaluru & Karnataka.",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Buy Tiles, Hardware & Standard Construction Items Online | IntriHub",
    description:
      "Explore standard vitrified tiles, sanitaryware, electricals & hardware items online at best prices. Build Better, We Deliver Faster across Bengaluru & Karnataka.",
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
        IntriHub — Buy Standard Tiles, Hardware Supplies &amp; Construction Items Online
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
