"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartToastStore } from "@/lib/cart-toast-store";
import { useCartStore } from "@/lib/cart-store";

export default function AddToCartToast() {
  const { isOpen, productName, quantity, message, toastKey, hideToast } = useCartToastStore();
  const { openCart, getTotalBoxes } = useCartStore();
  const totalBoxes = getTotalBoxes();

  const handleOpenCart = () => {
    hideToast();
    openCart();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed bottom-[74px] md:bottom-8 left-0 right-0 z-[55] pointer-events-none flex justify-center px-4">
          <motion.div
            key={toastKey}
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            onClick={handleOpenCart}
            role="button"
            tabIndex={0}
            className="pointer-events-auto cursor-pointer group select-none flex items-center gap-3 bg-[#052a51]/95 hover:bg-[#052a51] text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-full shadow-[0_12px_36px_rgba(5,42,81,0.35)] border border-white/20 backdrop-blur-md active:scale-95 transition-all max-w-[92vw] sm:max-w-md"
          >
            {/* Green Check Pill */}
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Check size={14} strokeWidth={3} />
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-bold text-white leading-tight truncate">
                {message || (productName ? `${productName}` : "Item added to cart")}
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-300 leading-tight mt-0.5 flex items-center gap-1.5 truncate">
                <span>✓ Added {quantity > 1 ? `${quantity} boxes` : "to cart"}</span>
                {totalBoxes > 0 && (
                  <>
                    <span>·</span>
                    <span className="text-orange-300 font-semibold">{totalBoxes} {totalBoxes === 1 ? "box" : "boxes"} in cart</span>
                  </>
                )}
              </p>
            </div>

            {/* View Cart Pill */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F26522] group-hover:bg-[#d95a1e] text-white text-[11px] sm:text-xs font-black shrink-0 transition-colors shadow-xs">
              <span>View</span>
              <ArrowRight size={12} strokeWidth={2.5} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
