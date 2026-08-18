"use client";

import { create } from "zustand";

type CartToastState = {
  isOpen: boolean;
  productName: string;
  quantity: number;
  message?: string;
  toastKey: number;
  timerId: NodeJS.Timeout | null;
  showToast: (params: { productName: string; quantity?: number; message?: string }) => void;
  hideToast: () => void;
};

export const useCartToastStore = create<CartToastState>((set, get) => ({
  isOpen: false,
  productName: "",
  quantity: 1,
  message: undefined,
  toastKey: 0,
  timerId: null,

  showToast: ({ productName, quantity = 1, message }) => {
    const { timerId, toastKey } = get();
    if (timerId) {
      clearTimeout(timerId);
    }

    const newTimerId = setTimeout(() => {
      set({ isOpen: false, timerId: null });
    }, 1800);

    set({
      isOpen: true,
      productName,
      quantity,
      message,
      toastKey: toastKey + 1,
      timerId: newTimerId,
    });
  },

  hideToast: () => {
    const { timerId } = get();
    if (timerId) {
      clearTimeout(timerId);
    }
    set({ isOpen: false, timerId: null });
  },
}));

export function showCartToast(productName: string, quantity = 1, message?: string) {
  useCartToastStore.getState().showToast({ productName, quantity, message });
}
