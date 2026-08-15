"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartAddons from "@/components/suggestions/CartAddons";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function CartPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { items, removeItem, updateQuantity, getSubtotal, getTotalSqft } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const totalSqft = useCartStore((s) => s.getTotalSqft());
  const deliveryFee = subtotal >= 15000 ? 0 : 999;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeItems = mounted ? items : [];

  return (
    <main>
      <Header />
      <div className="min-h-screen bg-[#F3F4F5] pt-[110px] md:pt-[168px]">
        <div className="w-full max-w-[1200px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] py-12">
          <h1 className="text-[36px] font-black text-[#052a51] mb-8">Your Cart</h1>

          {!mounted || activeItems.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl">
              <ShoppingBag size={56} className="text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-black text-[#052a51]">Your cart is empty</p>
              <p className="text-gray-500 mt-2">Start shopping to add tiles here</p>
              <Link href="/shop">
                <button className="mt-6 h-12 px-8 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] transition-colors flex items-center gap-2 mx-auto">
                  Shop All Tiles <ArrowRight size={16} />
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
              {/* Items */}
              <div className="space-y-4">
                {activeItems.map((item, i) => (
                  <motion.div
                    key={item.variant.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-white rounded-2xl p-5 flex gap-5 items-start shadow-sm border border-gray-100"
                  >
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#F26522] font-bold uppercase">{item.product.categoryName}</p>
                      <h3 className="font-bold text-[#052a51] mt-0.5">{item.product.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.variant.size} · {item.variant.finish} · {item.variant.color}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.variant.sqftPerBox} sq.ft/box · {(item.variant.sqftPerBox * item.quantity).toFixed(0)} sq.ft total
                      </p>
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                            className="w-9 h-9 flex items-center justify-center text-[#052a51] hover:bg-gray-50 transition-colors"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-10 text-center font-bold text-sm text-[#052a51]">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                            className="w-9 h-9 flex items-center justify-center text-[#052a51] hover:bg-gray-50 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-black text-[#052a51] text-lg">
                            {formatPrice(item.variant.pricePerBox * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeItem(item.variant.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <div className="pt-4">
                  <CartAddons />
                </div>

                <Link href="/shop" className="text-sm text-[#F26522] font-bold hover:underline flex items-center gap-1 mt-2">
                  ← Continue Shopping
                </Link>
              </div>

              {/* Order Summary */}
              <div className="lg:sticky lg:top-[100px] h-fit">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-xl font-black text-[#052a51] mb-5">Order Summary</h2>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({items.length} {items.length === 1 ? "item" : "items"})</span>
                      <span className="font-bold">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Total coverage</span>
                      <span className="font-bold">{totalSqft.toFixed(0)} sq.ft</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery</span>
                      <span className={`font-bold ${deliveryFee === 0 ? "text-[#2F7A4F]" : ""}`}>
                        {deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}
                      </span>
                    </div>
                    {deliveryFee > 0 && (
                      <p className="text-xs text-gray-400 bg-[#F3F4F5] rounded-lg p-2.5">
                        Add {formatPrice(15000 - subtotal)} more for free delivery
                      </p>
                    )}
                    <hr className="border-gray-100" />
                    <div className="flex justify-between text-base font-black text-[#052a51]">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
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
                    className="w-full h-13 mt-5 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 py-3.5 active:scale-95"
                  >
                    Proceed to Checkout <ArrowRight size={18} />
                  </button>

                  <div className="mt-4 space-y-2 text-xs text-gray-500">
                    <p className="flex items-center gap-1.5">✓ Secure checkout</p>
                    <p className="flex items-center gap-1.5">✓ 3–7 day delivery</p>
                    <p className="flex items-center gap-1.5">✓ Quality guaranteed</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
