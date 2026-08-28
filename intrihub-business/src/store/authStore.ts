import { create } from "zustand";
import { User, UserRole } from "../types";
import { getProfile, logout as apiLogout } from "../api/auth";
import { getStoredAccessToken } from "../api/client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: UserRole | null;

  // Actions
  initAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  role: null,

  initAuth: async () => {
    try {
      set({ isLoading: true });
      const token = await getStoredAccessToken();
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false, role: null });
        return;
      }

      const res = await getProfile();
      if (res.success && res.user) {
        set({
          user: res.user,
          isAuthenticated: true,
          isLoading: false,
          role: res.user.role || "customer",
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false, role: null });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false, role: null });
    }
  },

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
    });
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch {}
    set({
      user: null,
      isAuthenticated: false,
      role: null,
    });
  },
}));
