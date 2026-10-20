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

const DEFAULT_SAMPLE_ADDRESSES: CustomerAddress[] = [
  {
    id: "addr_home_sample",
    name: "Sahil Sheikh",
    phone: "9264920211",
    label: "Home",
    line1: "Begur",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560114",
    isDefault: true,
  },
  {
    id: "addr_office_sample",
    name: "Sahil Sheikh",
    phone: "9264920211",
    label: "Office",
    line1: "HSR Layout",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560102",
    isDefault: false,
  },
  {
    id: "addr_other_sample",
    name: "Sahil Sheikh",
    phone: "9264920211",
    label: "Other",
    line1: "Koramangala",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560034",
    isDefault: false,
  },
];

export const useDeliveryAddressStore = create<DeliveryAddressState>()(
  persist(
    (set, get) => ({
      selectedAddress: DEFAULT_SAMPLE_ADDRESSES[0],
      savedAddresses: DEFAULT_SAMPLE_ADDRESSES,
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
    }
  )
);
