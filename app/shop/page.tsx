import { Suspense } from "react";
import { getProducts } from "@/lib/actions/products";
import { getCategories } from "@/lib/actions/categories";
import ShopCatalogClient from "@/components/ShopCatalogClient";

export const revalidate = 60;

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

