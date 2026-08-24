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
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

// Owner credentials for secure access
const VALID_CREDENTIALS = [
  {
    email: "moahmadmail92@gmail.com",
    password: "admin",
    user: {
      id: "adm-001",
      name: "Super Admin",
      email: "moahmadmail92@gmail.com",
      role: "admin" as AdminRole,
      lastLogin: new Date().toISOString(),
    },
  },
];

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: VALID_CREDENTIALS[0].user,
      isAuthenticated: true,

      login: (email, password) => {
        const match = VALID_CREDENTIALS.find(
          (c) => c.email.toLowerCase() === email.toLowerCase().trim() && c.password === password
        );
        if (match) {
          const userWithTimestamp = {
            ...match.user,
            lastLogin: new Date().toISOString(),
          };
          set({ user: userWithTimestamp, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: "intrihub-admin-auth",
    }
  )
);
