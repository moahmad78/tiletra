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
    <ShopCatalogClient
      initialProducts={initialProducts}
      categories={categories}
    />
  );
}
