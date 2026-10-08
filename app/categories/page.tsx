import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import CategoriesClient from "./CategoriesClient";
import { getCanonicalUrl } from "@/lib/seo";

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
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse All Product Categories | IntriHub",
    description:
      "Browse all 20 categories of construction, hardware, electrical, plumbing, sanitaryware, tiles, paint, and interior supplies at IntriHub Bangalore.",
  },
};

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ limit: 300 }),
  ]);

  return <CategoriesClient categories={categories} initialProducts={products} />;
}
