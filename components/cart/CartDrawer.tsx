"use client";

import { useEffect, useRef } from "react";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function CartDrawer() {
  const router = useRouter();
  const { isAuthenticated, openLoginModal } = useAuthStore();
  const { items, isOpen, closeCart, removeItem, updateQuantity, getSubtotal, getTotalSqft } = useCartStore();
  const subtotal = useCartStore((s) => s.getSubtotal());
  const totalSqft = useCartStore((s) => s.getTotalSqft());
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        closeCart();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClick);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeCart]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [closeCart]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity" />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 right-0 z-[70] h-full w-full max-w-[420px] bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideInRight 0.3s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#F26522]" />
            <h2 className="text-lg font-bold text-[#052a51]">
              Your Cart
              {items.length > 0 && (
                <span className="ml-2 text-sm font-medium text-gray-500">
                  ({items.length} {items.length === 1 ? "item" : "items"})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
              <ShoppingBag size={32} className="text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#052a51]">Your cart is empty</p>
              <p className="text-sm text-gray-500 mt-1">Browse our collection and add tiles to your cart</p>
            </div>
            <Link
              href="/shop"
              onClick={closeCart}
              className="mt-2 px-6 py-3 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] transition-colors flex items-center gap-2"
            >
              Shop Tiles <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.variant.id}
                  className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group"
                >
                  {/* Image */}
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <Image
                      src={item.product.images[0]}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#052a51] leading-tight line-clamp-1">
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.variant.size} · {item.variant.finish} · {item.variant.color}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(item.variant.sqftPerBox * item.quantity).toFixed(0)} sq.ft coverage
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {/* Qty stepper */}
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-1">
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#052a51] hover:text-[#F26522] transition-colors"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-bold text-[#052a51] min-w-[1.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#052a51] hover:text-[#F26522] transition-colors"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Price */}
                      <p className="text-sm font-bold text-[#052a51]">
                        {formatPrice(item.variant.pricePerBox * item.quantity)}
                      </p>
                    </div>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.variant.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity self-start p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-6 py-5 space-y-3">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total coverage</span>
                <span className="font-medium">{totalSqft.toFixed(0)} sq.ft</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#052a51]">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-400">Delivery charges calculated at checkout</p>

              <button
                onClick={() => {
                  closeCart();
                  if (!isAuthenticated) {
                    openLoginModal({ type: "checkout" });
                  } else {
                    router.push("/checkout");
                  }
                }}
                className="w-full h-12 bg-[#F26522] text-white font-bold rounded-xl hover:bg-[#d95a1e] transition-all hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-center gap-2 active:scale-95"
              >
                Proceed to Checkout <ArrowRight size={18} />
              </button>
              <Link href="/cart" onClick={closeCart} className="block text-center text-sm text-[#052a51] font-medium hover:text-[#F26522] transition-colors">
                View full cart →
              </Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
      `}</style>
    </>
  );
}
