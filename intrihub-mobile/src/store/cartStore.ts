import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product, ProductVariant, CartItem } from "../types";
import { syncCart } from "../api/cart";
import { useAuthStore } from "./authStore";

const CART_STORAGE_KEY = "intrihub_mobile_cart_v1";

interface CartState {
  items: CartItem[];
  isLoaded: boolean;

  // Actions
  loadCart: () => Promise<void>;
  addItem: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Computed helpers
  getItemCount: () => number;
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getTotal: () => number;
  syncWithServer: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoaded: false,

  loadCart: async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        set({ items: JSON.parse(stored), isLoaded: true });
      } else {
        set({ items: [], isLoaded: true });
      }
    } catch {
      set({ items: [], isLoaded: true });
    }
  },

  addItem: (product: Product, variant: ProductVariant | null = null, quantity = 1) => {
    const currentItems = [...get().items];
    const variantId = variant?.id || "default";
    const itemId = `${product.id}_${variantId}`;

    // Calculate item unit price
    let unitPrice = product.pricePerSqft;
    if (variant?.pricePerBox) {
      unitPrice = variant.pricePerBox;
    } else if (variant?.pricePerSqft && variant?.sqftPerBox) {
      unitPrice = variant.pricePerSqft * variant.sqftPerBox;
    } else if (product.pricePerSqft && product.coverageRate) {
      unitPrice = product.pricePerSqft * product.coverageRate;
    }

    const existingIndex = currentItems.findIndex((item) => item.id === itemId);

    if (existingIndex > -1) {
      currentItems[existingIndex].quantity += quantity;
      currentItems[existingIndex].calculatedPrice = currentItems[existingIndex].quantity * unitPrice;
    } else {
      currentItems.push({
        id: itemId,
        product,
        variant,
        quantity,
        calculatedPrice: quantity * unitPrice,
      });
    }

    set({ items: currentItems });
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(currentItems)).catch(() => {});
    get().syncWithServer();
  },

  removeItem: (itemId: string) => {
    const filtered = get().items.filter((item) => item.id !== itemId);
    set({ items: filtered });
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(filtered)).catch(() => {});
    get().syncWithServer();
  },

  updateQuantity: (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(itemId);
      return;
    }

    const updated = get().items.map((item) => {
      if (item.id === itemId) {
        let unitPrice = item.product.pricePerSqft;
        if (item.variant?.pricePerBox) {
          unitPrice = item.variant.pricePerBox;
        } else if (item.variant?.pricePerSqft && item.variant?.sqftPerBox) {
          unitPrice = item.variant.pricePerSqft * item.variant.sqftPerBox;
        } else if (item.product.pricePerSqft && item.product.coverageRate) {
          unitPrice = item.product.pricePerSqft * item.product.coverageRate;
        }

        return {
          ...item,
          quantity,
          calculatedPrice: quantity * unitPrice,
        };
      }
      return item;
    });

    set({ items: updated });
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
    get().syncWithServer();
  },

  clearCart: () => {
    set({ items: [] });
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
    get().syncWithServer();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.calculatedPrice, 0);
  },

  getDeliveryFee: () => {
    const subtotal = get().getSubtotal();
    if (subtotal === 0) return 0;
    // Free delivery above ₹15,000, otherwise ₹999 standard delivery
    return subtotal >= 15000 ? 0 : 999;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getDeliveryFee();
  },

  syncWithServer: async () => {
    try {
      const authState = useAuthStore.getState();
      if (!authState.isAuthenticated || !authState.user?.id) return;

      const payload = get().items.map((i) => ({
        productId: i.product.id,
        variantId: i.variant?.id || "default",
        quantity: i.quantity,
      }));

      await syncCart(payload);
    } catch {
      // Offline or sync failure is non-blocking
    }
  },
}));
