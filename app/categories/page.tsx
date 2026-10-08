import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import CategoriesClient from "./CategoriesClient";
import { BASE_SITE_URL, getCanonicalUrl, generateBreadcrumbSchema } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Browse All Product Categories",
  description:
    "Browse all 20 categories of construction, hardware, electrical, plumbing, sanitaryware, tiles, paint, and interior supplies at IntriHub Bangalore.",
  alternates: {
    canonical: getCanonicalUrl("/categories"),
  },
  openGraph: {
    title: "Browse All Product Categories | IntriHub",
    description:
      "Browse all 20 categories of construction, hardware, electrical, plumbing, sanitaryware, tiles, paint, and interior supplies at IntriHub Bangalore.",
    url: getCanonicalUrl("/categories"),
    type: "website",
    siteName: "IntriHub",
    images: [
      {
        url: `${BASE_SITE_URL}/images/intrihub-og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Browse All Product Categories | IntriHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse All Product Categories | IntriHub",
    description:
      "Browse all 20 categories of construction, hardware, electrical, plumbing, sanitaryware, tiles, paint, and interior supplies at IntriHub Bangalore.",
    images: [`${BASE_SITE_URL}/images/intrihub-og-image.jpg`],
  },
};

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ limit: 300 }),
  ]);

  const breadcrumbsSchema = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Categories", url: "/categories" },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="categories-breadcrumbs-schema" />
      <CategoriesClient categories={categories} initialProducts={products} />
    </>
  );
}
