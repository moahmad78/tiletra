"use client";

import Image from "next/image";
import Link from "next/link";
import { Plus, Check, ShoppingBag, Sparkles } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { getCartAddons } from "@/lib/recommendations";
import { getLowestPrice, getLowestBoxPrice } from "@/lib/data/products";
import { showCartToast } from "@/lib/cart-toast-store";
import { useState } from "react";

function formatPrice(n: number | string): string {
  const num = typeof n === "number" ? n : Number(n) || 0;
  return "₹" + num.toLocaleString("en-IN");
}

export default function CartAddons() {
  const { items, addItem } = useCartStore();
  const [addedId, setAddedId] = useState<string | null>(null);

  const cartProductIds = items.map((i) => i.product.id);
  const addons = getCartAddons(cartProductIds, 4);

  if (addons.length === 0) return null;

  const handleAdd = (prod: any) => {
    addItem(prod, prod.variants[0], 1);
    setAddedId(prod.id);
    showCartToast(prod.name, 1);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-[#052a51]">Add These Too</h3>
          <p className="text-xs text-gray-500">Popular companion supplies & essentials</p>
        </div>
        <span className="text-[10px] font-black uppercase text-[#F26522] bg-[#F26522]/10 px-2.5 py-0.5 rounded-md">
          Recommended
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {addons.map((prod) => (
          <div
            key={prod.id}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:border-gray-200 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
                <Image
                  src={prod.images[0]}
                  alt={prod.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/product/${prod.slug}`}
                  className="text-xs font-bold text-[#052a51] hover:text-[#F26522] line-clamp-1"
                >
                  {prod.name}
                </Link>
                <p className="text-[10px] text-gray-400">
                  {prod.variants[0].size} · {prod.variants[0].finish}
                </p>
                <p className="text-xs font-black text-[#F26522] mt-0.5">
                  {formatPrice(getLowestBoxPrice(prod))}
                  <span className="text-[10px] text-gray-400 font-normal">/box</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleAdd(prod)}
              className="shrink-0 w-8 h-8 rounded-xl bg-[#052a51] hover:bg-[#F26522] text-white flex items-center justify-center transition-colors active:scale-90 shadow-2xs"
              title="Add 1 box to cart"
            >
              {addedId === prod.id ? <Check size={14} /> : <Plus size={15} strokeWidth={2.5} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
