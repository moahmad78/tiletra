"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CustomerAddress } from "./auth-store";

interface DeliveryAddressState {
  selectedAddress: CustomerAddress | null;
  savedAddresses: CustomerAddress[];
  isAddressModalOpen: boolean;
  
  // Actions
  openAddressModal: () => void;
  closeAddressModal: () => void;
  setSelectedAddress: (address: CustomerAddress) => void;
  addSavedAddress: (address: CustomerAddress) => void;
  deleteSavedAddress: (id: string) => void;
  setSavedAddresses: (addresses: CustomerAddress[]) => void;
}

export const useDeliveryAddressStore = create<DeliveryAddressState>()(
  persist(
    (set, get) => ({
      selectedAddress: null,
      savedAddresses: [],
      isAddressModalOpen: false,

      openAddressModal: () => set({ isAddressModalOpen: true }),
      closeAddressModal: () => set({ isAddressModalOpen: false }),

      setSelectedAddress: (address: CustomerAddress) =>
        set({
          selectedAddress: address,
          isAddressModalOpen: false,
        }),

      addSavedAddress: (address: CustomerAddress) => {
        const current = get().savedAddresses;
        const exists = current.some((a) => a.id === address.id);
        const updated = exists
          ? current.map((a) => (a.id === address.id ? address : a))
          : [address, ...current];
        set({
          savedAddresses: updated,
          selectedAddress: address,
          isAddressModalOpen: false,
        });
      },

      deleteSavedAddress: (id: string) => {
        const current = get().savedAddresses;
        const updated = current.filter((a) => a.id !== id);
        const selected = get().selectedAddress;
        set({
          savedAddresses: updated,
          selectedAddress: selected?.id === id ? updated[0] || null : selected,
        });
      },

      setSavedAddresses: (addresses: CustomerAddress[]) =>
        set({ savedAddresses: addresses }),
    }),
    {
      name: "intrihub_delivery_address_store",
      partialize: (state) => ({
        selectedAddress: state.selectedAddress,
        savedAddresses: state.savedAddresses,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Remove any legacy mock/sample addresses left in localStorage
          const cleanSaved = (state.savedAddresses || []).filter(
            (a) =>
              a &&
              !a.id?.includes("sample") &&
              a.phone !== "9264920211" &&
              !a.name?.includes("Sahil Sheikh")
          );
          state.savedAddresses = cleanSaved;
          if (
            state.selectedAddress &&
            (state.selectedAddress.id?.includes("sample") ||
              state.selectedAddress.phone === "9264920211" ||
              state.selectedAddress.name?.includes("Sahil Sheikh"))
          ) {
            state.selectedAddress = cleanSaved[0] || null;
          }
        }
      },
    }
  )
);
