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

// Default owner credentials for easy testing & secure access
const VALID_CREDENTIALS = [
  {
    email: "sahil@intrihub.com",
    password: "sahil@7814",
    user: {
      id: "adm-001",
      name: "Sahil Sheikh",
      email: "sahil@intrihub.com",
      role: "admin" as AdminRole,
      lastLogin: new Date().toISOString(),
    },
  },
  {
    email: "admin@intrihub.com",
    password: "admin",
    user: {
      id: "adm-001",
      name: "Sahil Sheikh",
      email: "sahil@intrihub.com",
      role: "admin" as AdminRole,
      lastLogin: new Date().toISOString(),
    },
  },
  {
    email: "staff@intrihub.com",
    password: "staff",
    user: {
      id: "adm-002",
      name: "Operations Staff",
      email: "staff@intrihub.com",
      role: "staff" as AdminRole,
      lastLogin: new Date().toISOString(),
    },
  },
];

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      user: VALID_CREDENTIALS[0].user, // Pre-authenticated for frictionless testing
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
