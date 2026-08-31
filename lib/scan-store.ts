"use client";

import { create } from "zustand";

interface ScanStore {
  isOpen: boolean;
  openScan: () => void;
  closeScan: () => void;
  toggleScan: () => void;
}

export const useScanStore = create<ScanStore>((set) => ({
  isOpen: false,
  openScan: () => set({ isOpen: true }),
  closeScan: () => set({ isOpen: false }),
  toggleScan: () => set((state) => ({ isOpen: !state.isOpen })),
}));
