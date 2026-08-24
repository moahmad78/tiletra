import { Metadata } from "next";
import { getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import CategoriesClient from "./CategoriesClient";
import { getCanonicalUrl } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "All Categories — Explore 20+ Construction & Interior Supplies | Intrihub",
  description:
    "Browse all 20 categories of construction, hardware, electrical, plumbing, sanitaryware, tiles, paint, and interior supplies at Intrihub Bangalore.",
  alternates: {
    canonical: getCanonicalUrl("/categories"),
  },
};

export default async function CategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ limit: 300 }),
  ]);

  return <CategoriesClient categories={categories} initialProducts={products} />;
}
