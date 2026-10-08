import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { getHomepageSections } from "@/lib/actions/products";
import { getOfferBanners } from "@/lib/actions/settings";
import HomeClient from "@/components/HomeClient";
import JsonLd from "@/components/JsonLd";
import { generateHomepageFaqSchema } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "Every Material. Every Space. | IntriHub",
  },
  description:
    "IntriHub: Every Material. Every Space. Buy vitrified tiles, electrical, plumbing, sanitaryware, plywood & hardware online with fast site delivery.",
  alternates: {
    canonical: "https://www.intrihub.com/",
  },
  openGraph: {
    title: "Every Material. Every Space. | IntriHub",
    description:
      "IntriHub: Every Material. Every Space. Buy vitrified tiles, electrical, plumbing, sanitaryware, plywood & hardware online with fast site delivery.",
    url: "https://www.intrihub.com/",
    siteName: "IntriHub",
    images: [
      {
        url: "https://www.intrihub.com/images/intrihub-og-image.jpg",
        width: 1024,
        height: 537,
        alt: "Every Material. Every Space. | IntriHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Every Material. Every Space. | IntriHub",
    description:
      "IntriHub: Every Material. Every Space. Buy vitrified tiles, electrical, plumbing, sanitaryware, plywood & hardware online with fast site delivery.",
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
