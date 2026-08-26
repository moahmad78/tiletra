import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, Address } from "../types";
import { getProfile, logout as apiLogout } from "../api/auth";
import { getStoredAccessToken } from "../api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedAddress: Address | null;
  
  // Actions
  initAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSelectedAddress: (address: Address | null) => void;
  logout: () => Promise<void>;
}

const SELECTED_ADDRESS_KEY = "intrihub_selected_address";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedAddress: null,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getStoredAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const res = await getProfile();
      if (res.success && res.user) {
        let savedAddress: Address | null = null;
        try {
          const storedAddrStr = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
          if (storedAddrStr) savedAddress = JSON.parse(storedAddrStr);
        } catch {}

        if (!savedAddress && res.user.addresses && res.user.addresses.length > 0) {
          savedAddress = res.user.addresses[0];
        }

        set({
          user: res.user,
          isAuthenticated: true,
          selectedAddress: savedAddress,
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User | null) => {
    let defaultAddress: Address | null = null;
    if (user?.addresses && user.addresses.length > 0) {
      defaultAddress = user.addresses.find((a) => a.isDefault) || user.addresses[0];
    }
    set({
      user,
      isAuthenticated: Boolean(user),
      selectedAddress: defaultAddress || get().selectedAddress,
    });
  },

  setSelectedAddress: (address: Address | null) => {
    set({ selectedAddress: address });
    if (address) {
      AsyncStorage.setItem(SELECTED_ADDRESS_KEY, JSON.stringify(address)).catch(() => {});
    } else {
      AsyncStorage.removeItem(SELECTED_ADDRESS_KEY).catch(() => {});
    }
  },

  logout: async () => {
    await apiLogout();
    await AsyncStorage.removeItem(SELECTED_ADDRESS_KEY).catch(() => {});
    set({ user: null, isAuthenticated: false, selectedAddress: null });
  },
}));
