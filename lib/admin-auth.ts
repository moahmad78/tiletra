"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AdminRole = "admin" | "staff";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  lastLogin: string;
};

type AdminAuthState = {
  user: AdminUser | null;
  isAuthenticated: boolean;
  setSession: (user: { id: string; name: string; email: string; role: string }) => void;
  logout: () => void;
};

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setSession: (user) => {
        const adminUser: AdminUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: (user.role as AdminRole) || "admin",
          lastLogin: new Date().toISOString(),
        };
        set({ user: adminUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          document.cookie = "intrihub_admin_session=; path=/; max-age=0;";
        }
      },
    }),
    {
      name: "intrihub-admin-auth-v2",
    }
  )
);
