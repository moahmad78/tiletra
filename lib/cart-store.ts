"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant } from "@/lib/data/products";
import { useAuthStore } from "@/lib/auth-store";
import { syncCartToDb } from "@/lib/actions/cart";

export type CartItem = {
  product: Product;
  variant: ProductVariant;
  quantity: number; // in boxes
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;

  // Actions
  addItem: (product: Product, variant: ProductVariant, quantity?: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setItems: (items: CartItem[]) => void;
  syncWithDatabase: (userId?: string) => Promise<void>;

  // Computed helpers (called as functions)
  getTotalItems: () => number;
  getTotalBoxes: () => number;
  getSubtotal: () => number;
  getTotalSqft: () => number;
  getTotalWeightKg: () => number;
};

const triggerDbSync = async (items: CartItem[]) => {
  try {
    const authState = useAuthStore.getState();
    const user = authState.user;
    // Guest carts stay in localStorage only. Only sync to DB if authenticated with a real DB user id
    if (authState.isAuthenticated && user?.id && !user.id.startsWith("usr-")) {
      await syncCartToDb(
        user.id,
        items.map((i) => ({
          productId: i.product.id,
          variantId: i.variant.id,
          quantity: i.quantity,
        }))
      );
    }
  } catch (err) {
    console.error("Failed to sync cart with database:", err);
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, variant, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.variant.id === variant.id);
          let newItems: CartItem[];
          if (existing) {
            newItems = state.items.map((i) =>
              i.variant.id === variant.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            );
          } else {
            newItems = [...state.items, { product, variant, quantity }];
          }
          triggerDbSync(newItems);
          return { items: newItems };
        });
      },

      removeItem: (variantId) => {
        set((state) => {
          const newItems = state.items.filter((i) => i.variant.id !== variantId);
          triggerDbSync(newItems);
          return { items: newItems };
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set((state) => {
          const newItems = state.items.map((i) =>
            i.variant.id === variantId ? { ...i, quantity } : i
          );
          triggerDbSync(newItems);
          return { items: newItems };
        });
      },

      clearCart: () => {
        set({ items: [] });
        triggerDbSync([]);
      },

      setItems: (items) => {
        set({ items });
        triggerDbSync(items);
      },

      syncWithDatabase: async (userId) => {
        const authState = useAuthStore.getState();
        const uid = userId || authState.user?.id;
        if (!uid || uid.startsWith("usr-") || !authState.isAuthenticated) return;
        const currentItems = get().items;
        await syncCartToDb(
          uid,
          currentItems.map((i) => ({
            productId: i.product.id,
            variantId: i.variant.id,
            quantity: i.quantity,
          }))
        );
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),

      getTotalItems: () => get().items.length,
      getTotalBoxes: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getSubtotal: () =>
        get().items.reduce(
          (sum, i) => sum + i.variant.pricePerBox * i.quantity,
          0
        ),
      getTotalSqft: () =>
        get().items.reduce(
          (sum, i) => sum + i.variant.sqftPerBox * i.quantity,
          0
        ),
      getTotalWeightKg: () =>
        get().items.reduce((sum, i) => {
          const vWeight = (i.variant as any)?.weightKg;
          const pWeight = (i.product as any)?.weightKg;
          const defaultWeight =
            i.product.categorySlug?.includes("tile") || i.product.categorySlug?.includes("stone")
              ? 12.0
              : i.product.categorySlug?.includes("plywood") || i.product.categorySlug?.includes("board")
              ? 18.0
              : i.product.categorySlug?.includes("paint")
              ? 4.5
              : 2.0;
          const weight = vWeight ?? pWeight ?? defaultWeight;
          return sum + weight * i.quantity;
        }, 0),
    }),
    {
      name: "intrihub-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
