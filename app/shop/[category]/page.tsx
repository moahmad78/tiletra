"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { getCategoryBySlug, categories } from "@/lib/data/categories";
import { getProductsByCategory } from "@/lib/data/products";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { notFound } from "next/navigation";
import { use } from "react";

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category: categorySlug } = use(params);
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const categoryProducts = getProductsByCategory(categorySlug);

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      {/* Category Hero */}
      <div className="relative overflow-hidden pt-[110px] md:pt-[168px]">
        <div className="absolute inset-0">
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#052a51]/95 via-[#052a51]/85 to-[#052a51]/70" />
        </div>
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-14 md:py-20">
          <nav className="flex items-center gap-2 text-xs md:text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
            <span>/</span>
            <span className="text-white font-medium">{category.name}</span>
          </nav>
          <span className="inline-block px-3 py-1 bg-[#F26522] text-white text-xs font-bold rounded-full uppercase tracking-wider mb-3">
            Category
          </span>
          <h1 className="text-[36px] md:text-[54px] font-black text-white leading-tight">
            {category.name}
          </h1>
          <p className="text-white/80 mt-3 max-w-xl text-base md:text-lg leading-relaxed">
            {category.description}
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-white/70">
            <span>✨ {categoryProducts.length} curated designs</span>
            <span>·</span>
            <span>🚚 Free delivery above ₹15,000</span>
          </div>
        </div>
      </div>

      {/* Category navigation bar */}
      <div className="bg-white border-b border-gray-200 sticky top-[70px] md:top-[120px] z-30 shadow-sm">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-3 overflow-x-auto no-scrollbar flex items-center gap-2.5">
          <Link
            href="/shop"
            className="px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            All Categories
          </Link>
          {categories.map((c) => {
            const isCurrent = c.slug === categorySlug;
            return (
              <Link
                key={c.slug}
                href={`/shop/${c.slug}`}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-[#052a51] text-white shadow-sm"
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
      <section className="py-12 flex-1">
        <div className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px]">
          {categoryProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-sm max-w-md mx-auto my-8">
              <p className="text-xl font-black text-[#052a51]">No designs found in this category.</p>
              <Link href="/shop" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] text-white font-bold rounded-xl shadow-md">
                Browse all tiles <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {categoryProducts.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
