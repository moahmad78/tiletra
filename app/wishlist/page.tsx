"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, ArrowRight, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistStore } from "@/lib/wishlist-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CompactProductCard from "@/components/CompactProductCard";

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const { items, clearWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeItems = mounted ? items : [];

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5] pt-[56px] md:pt-[124px]">
      <Header />

      <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex-1">
        {/* Breadcrumb & Header Bar */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-100 shadow-2xs">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-semibold mb-0.5">
              <Link href="/" className="hover:text-[#F26522] transition-colors">Home</Link>
              <span>/</span>
              <span className="text-[#052a51]">Wishlist</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-[#052a51] leading-tight flex items-center gap-2">
              <span>My Wishlist</span>
              {mounted && activeItems.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-[#F26522]/10 text-[#F26522] rounded-full">
                  {activeItems.length} {activeItems.length === 1 ? "design" : "designs"}
                </span>
              )}
            </h1>
          </div>

          {mounted && activeItems.length > 0 && (
            <button
              onClick={clearWishlist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/80 rounded-xl active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {!mounted || activeItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-16 text-center max-w-md mx-auto shadow-sm border border-gray-100 my-8">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 text-red-500">
              <Heart size={30} strokeWidth={1.75} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#052a51]">Your wishlist is empty</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Explore our catalog and tap the heart icon on any product to save your favorites here.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link href="/shop" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 h-11 bg-[#F26522] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                  Browse All Products <ArrowRight size={15} />
                </button>
              </Link>
              <Link href="/" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-5 h-11 bg-gray-100 text-[#052a51] text-xs sm:text-sm font-bold rounded-xl hover:bg-gray-200 active:scale-95 transition-all cursor-pointer">
                  Back to Home
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
            <AnimatePresence>
              {activeItems.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: Math.min((i % 12) * 0.02, 0.2) }}
                  className="h-full"
                >
                  <CompactProductCard product={product} className="w-full h-full" />
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

