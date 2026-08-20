"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { getStoreSettings } from "@/lib/actions/settings";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartAddons from "@/components/suggestions/CartAddons";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<{ freeDeliveryThreshold: number; standardDeliveryFee: number }>({
    freeDeliveryThreshold: 15000,
    standardDeliveryFee: 999,
  });

  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { items, removeItem, updateQuantity, getSubtotal, getTotalSqft } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const totalSqft = useCartStore((s) => s.getTotalSqft());

  const freeThreshold = settings.freeDeliveryThreshold ?? 15000;
  const standardFee = settings.standardDeliveryFee ?? 999;
  const deliveryFee = subtotal >= freeThreshold ? 0 : standardFee;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    setMounted(true);
    getStoreSettings().then((res) => {
      if (res) {
        setSettings({
          freeDeliveryThreshold: res.freeDeliveryThreshold ?? 15000,
          standardDeliveryFee: res.standardDeliveryFee ?? 999,
        });
      }
    });
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
              <span className="text-[#052a51]">Cart</span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-[#052a51] leading-tight flex items-center gap-2">
              <span>Your Cart</span>
              {mounted && activeItems.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-[#F26522]/10 text-[#F26522] rounded-full">
                  {activeItems.length} {activeItems.length === 1 ? "item" : "items"}
                </span>
              )}
            </h1>
          </div>

          {mounted && activeItems.length > 0 && (
            <Link
              href="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#F26522] hover:underline"
            >
              <span>+ Add More Products</span>
            </Link>
          )}
        </div>

        {!mounted || activeItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 md:p-16 text-center max-w-md mx-auto shadow-sm border border-gray-100 my-8">
            <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4 text-[#F26522]">
              <ShoppingBag size={30} strokeWidth={1.75} />
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#052a51]">Your cart is empty</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1.5 leading-relaxed">
              Explore our catalog to add tiles, electrical, plumbing, hardware, and supplies to your cart.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <Link href="/shop" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-6 h-11 bg-[#F26522] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer">
                  Shop All Products <ArrowRight size={15} />
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
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
            {/* Items Column */}
            <div className="space-y-3.5">
              {activeItems.map((item, i) => (
                <motion.div
                  key={item.variant.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-4 sm:p-5 flex gap-3.5 sm:gap-4 items-start shadow-2xs border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#F26522]">
                          {item.product.categoryName}
                        </span>
                        <Link href={`/product/${item.product.slug}`}>
                          <h3 className="font-bold text-[#052a51] text-sm sm:text-base leading-snug hover:text-[#F26522] transition-colors line-clamp-1">
                            {item.product.name}
                          </h3>
                        </Link>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.variant.size} · {item.variant.finish} · {item.variant.color}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {item.variant.sqftPerBox} sq.ft/box · {(item.variant.sqftPerBox * item.quantity).toFixed(0)} sq.ft total
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.variant.id)}
                        aria-label="Remove item"
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 active:scale-90"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50 flex-wrap gap-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#052a51] hover:bg-gray-100 transition-colors active:scale-90"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-9 text-center font-bold text-xs sm:text-sm text-[#052a51]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-[#052a51] hover:bg-gray-100 transition-colors active:scale-90"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-black text-[#052a51] text-base sm:text-lg leading-none">
                          {formatPrice(item.variant.pricePerBox * item.quantity)}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {formatPrice(item.variant.pricePerBox)}/box
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              <div className="pt-2">
                <CartAddons />
              </div>
            </div>

            {/* Order Summary Column */}
            <div className="lg:sticky lg:top-[140px] h-fit">
              <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xs border border-gray-100 space-y-4">
                <h2 className="text-lg font-black text-[#052a51]">Order Summary</h2>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
                    <span className="font-bold text-[#052a51]">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Total tile coverage</span>
                    <span className="font-bold text-[#052a51]">{totalSqft.toFixed(0)} sq.ft</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery charges</span>
                    <span className={`font-bold ${deliveryFee === 0 ? "text-emerald-600" : "text-[#052a51]"}`}>
                      {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                    </span>
                  </div>
                  {deliveryFee > 0 && subtotal < freeThreshold && (
                    <div className="text-[11px] text-gray-600 bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 leading-snug">
                      ✨ Add <span className="font-bold text-[#F26522]">{formatPrice(freeThreshold - subtotal)}</span> more for <strong>FREE Delivery</strong>
                    </div>
                  )}
                  <hr className="border-gray-100 my-2" />
                  <div className="flex justify-between text-base font-black text-[#052a51]">
                    <span>Total Amount</span>
                    <span className="text-[#F26522]">{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      openLoginModal({ type: "checkout" });
                    } else {
                      router.push("/checkout");
                    }
                  }}
                  className="w-full h-12 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] transition-all hover:shadow-md flex items-center justify-center gap-2 active:scale-95 shadow-xs cursor-pointer text-sm"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-500">
                  <p className="flex items-center gap-1.5">✓ 100% Secure SSL Checkout</p>
                  <p className="flex items-center gap-1.5">✓ Direct Doorstep Safe Delivery</p>
                  <p className="flex items-center gap-1.5">✓ Damage Protection Guaranteed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
