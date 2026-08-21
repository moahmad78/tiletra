import { Metadata } from "next";
import { Suspense } from "react";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import ShopCatalogClient from "@/components/ShopCatalogClient";
import { getCanonicalUrl } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All Interior & Construction Materials Online | Intrihub",
  description:
    "Browse India's largest catalog of interior and construction supplies: electrical, lighting, tiles, sanitaryware, plywood, hardware, and furniture. Fast site delivery across Bangalore.",
  alternates: {
    canonical: getCanonicalUrl("/shop"),
  },
  openGraph: {
    title: "Shop Interior & Construction Supplies | Intrihub",
    description:
      "Buy factory-direct interior & construction materials online with doorstep delivery.",
    url: getCanonicalUrl("/shop"),
  },
};

export default async function ShopPage() {
  const [initialProducts, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F3F4F5]" />}>
      <ShopCatalogClient
        initialProducts={initialProducts}
        categories={categories}
      />
    </Suspense>
  );
}

