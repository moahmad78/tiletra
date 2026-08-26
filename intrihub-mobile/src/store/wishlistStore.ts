import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../types";

interface WishlistState {
  items: Product[];
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  clearWishlist: () => void;
  getItemCount: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggleWishlist: (product: Product) => {
        const exists = get().items.some((p) => p.id === product.id);
        if (exists) {
          set({ items: get().items.filter((p) => p.id !== product.id) });
        } else {
          set({ items: [product, ...get().items] });
        }
      },
      isWishlisted: (productId: string) => {
        return get().items.some((p) => p.id === productId);
      },
      clearWishlist: () => set({ items: [] }),
      getItemCount: () => get().items.length,
    }),
    {
      name: "intrihub-wishlist",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
