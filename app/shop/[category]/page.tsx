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
    <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[175px] lg:pt-[180px]">
      <Header />

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
