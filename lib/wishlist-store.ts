"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/lib/data/products";
import { toast } from "sonner";

type WishlistState = {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleWishlist: (product) => {
        const isIn = get().items.some((p) => p.id === product.id);
        if (isIn) {
          set((s) => ({ items: s.items.filter((p) => p.id !== product.id) }));
          toast("Removed from wishlist", { icon: "💔" });
        } else {
          set((s) => ({ items: [...s.items, product] }));
          toast.success("Added to wishlist!", { icon: "❤️" });
        }
      },

      isWishlisted: (productId) => get().items.some((p) => p.id === productId),

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: "intrihub-wishlist",
    }
  )
);
