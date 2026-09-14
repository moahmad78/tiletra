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
const CACHED_USER_KEY = "intrihub_user";

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

      let cachedUser: User | null = null;
      try {
        const storedUserStr = await AsyncStorage.getItem(CACHED_USER_KEY);
        if (storedUserStr) cachedUser = JSON.parse(storedUserStr);
      } catch {}

      let savedAddress: Address | null = null;
      try {
        const storedAddrStr = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
        if (storedAddrStr) savedAddress = JSON.parse(storedAddrStr);
      } catch {}

      if (cachedUser) {
        if (!savedAddress && cachedUser.addresses && cachedUser.addresses.length > 0) {
          savedAddress = cachedUser.addresses.find((a) => a.isDefault) || cachedUser.addresses[0];
        }
        set({
          user: cachedUser,
          isAuthenticated: true,
          selectedAddress: savedAddress,
          isLoading: false,
        });
      }

      const res = await getProfile().catch(() => null);
      if (res?.success && res.user) {
        if (!savedAddress && res.user.addresses && res.user.addresses.length > 0) {
          savedAddress = res.user.addresses.find((a) => a.isDefault) || res.user.addresses[0];
        }
        await AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(res.user)).catch(() => {});
        set({
          user: res.user,
          isAuthenticated: true,
          selectedAddress: savedAddress,
          isLoading: false,
        });
      } else if (!cachedUser) {
        set({ user: null, isAuthenticated: false, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
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
    if (user) {
      AsyncStorage.setItem(CACHED_USER_KEY, JSON.stringify(user)).catch(() => {});
    } else {
      AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
    }
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
    await AsyncStorage.removeItem(CACHED_USER_KEY).catch(() => {});
    set({ user: null, isAuthenticated: false, selectedAddress: null });
  },
}));
