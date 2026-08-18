import { getCategories } from "@/lib/actions/categories";
import {
  getTrendingProducts,
  getBestsellerProducts,
  getNewArrivalProducts,
} from "@/lib/actions/products";
import { getOfferBanners } from "@/lib/actions/settings";
import HomeClient from "@/components/HomeClient";

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

  return (
    <HomeClient
      categories={categories}
      trending={trending}
      bestsellers={bestsellers}
      newArrivals={newArrivals}
      banners={banners}
    />
  );
}
