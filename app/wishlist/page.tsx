"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistStore } from "@/lib/wishlist-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, clearWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeItems = mounted ? items : [];

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="w-full max-w-[1400px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-[110px] md:pt-[168px] pb-10 flex-1"
      >
        {/* Breadcrumb & Header */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-[#F26522] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#052a51] font-semibold">Wishlist</span>
        </nav>

        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-black text-[#052a51] leading-tight flex items-center gap-3">
              <span>My Wishlist</span>
              {mounted && activeItems.length > 0 && (
                <span className="text-base font-bold px-3 py-1 bg-[#F26522]/10 text-[#F26522] rounded-full">
                  {activeItems.length} {activeItems.length === 1 ? "item" : "items"}
                </span>
              )}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Keep track of the tiles you love and add them to cart anytime.
            </p>
          </div>

          {mounted && activeItems.length > 0 && (
            <button
              onClick={clearWishlist}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 active:scale-95 transition-all shadow-sm"
            >
              <Trash2 size={15} />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {!mounted || activeItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 md:p-16 text-center max-w-lg mx-auto shadow-sm border border-gray-100 my-8">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6 text-red-500">
              <Heart size={36} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-black text-[#052a51]">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
              Explore our tile collections and tap the heart icon on any design to save your favorites here!
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/shop" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 h-12 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md">
                  Browse All Tiles <ArrowRight size={16} />
                </button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 h-12 bg-gray-100 text-[#052a51] font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            <AnimatePresence>
              {activeItems.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
