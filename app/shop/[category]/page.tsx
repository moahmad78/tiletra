import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { getCategoryBySlug, getCategories } from "@/lib/actions/categories";
import { getProducts } from "@/lib/actions/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCatalogClient from "@/components/CategoryCatalogClient";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = await params;
  const [category, categories, categoryProducts] = await Promise.all([
    getCategoryBySlug(categorySlug),
    getCategories(),
    getProducts({ categorySlug }),
  ]);

  if (!category) {
    notFound();
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[124px]">
      <Header />

      {/* Category navigation bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[56px] md:top-[124px] z-30 shadow-2xs">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">
          <Link
            href="/shop"
            className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            All Categories
          </Link>
          {categories.filter((c) => !c.parentId).map((c) => {
            const isCurrent = c.slug === categorySlug;
            return (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-[#052a51] text-white shadow-xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      <section className="py-6 sm:py-8 md:py-10 flex-1">
        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <CategoryCatalogClient
            products={categoryProducts}
            categoryName={category.name}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
