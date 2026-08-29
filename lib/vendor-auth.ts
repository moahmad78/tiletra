"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VendorSession = {
  id: string;
  businessName: string;
  slug: string;
  contactEmail: string;
  contactPhone: string;
  category?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  commissionRate: number;
  ownerName: string;
  ownerId: string;
  autoPublishEnabled?: boolean;
  rejectionReason?: string | null;
  mustChangePassword?: boolean;
  lastLogin: string;
};

type VendorAuthState = {
  vendor: VendorSession | null;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>;
  logout: () => void;
  setVendor: (vendor: VendorSession | null) => void;
};

export const useVendorAuth = create<VendorAuthState>()(
  persist(
    (set, get) => ({
      vendor: null,
      isAuthenticated: false,
      login: async (emailOrPhone, password) => {
        const input = emailOrPhone.toLowerCase().trim();

        // Query Database / Server API via POST
        try {
          const res = await fetch("/api/auth/vendor-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: input, password }),
          });

          const data = await res.json();
          if (res.ok && data?.vendor) {
            const session: VendorSession = {
              id: data.vendor.id,
              businessName: data.vendor.businessName,
              slug: data.vendor.slug,
              contactEmail: data.vendor.contactEmail,
              contactPhone: data.vendor.contactPhone,
              category: data.vendor.category,
              status: data.vendor.status,
              commissionRate: data.vendor.commissionRate,
              ownerName: data.vendor.ownerName,
              ownerId: data.vendor.ownerId,
              autoPublishEnabled: Boolean(data.vendor.autoPublishEnabled),
              rejectionReason: data.vendor.rejectionReason,
              mustChangePassword: data.vendor.mustChangePassword,
              lastLogin: new Date().toISOString(),
            };
            set({ vendor: session, isAuthenticated: true });
            return { success: true, mustChangePassword: data.vendor.mustChangePassword };
          } else if (data?.error) {
            return { success: false, error: data.error };
          }
        } catch (e) {
          console.error("Vendor login error:", e);
        }

        return { success: false, error: "Invalid vendor credentials. Please check username and password." };
      },

      logout: () => {
        set({ vendor: null, isAuthenticated: false });
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("intrihub-vendor-auth");
            sessionStorage.clear();
            document.cookie = "intrihub_vendor_session=; path=/; max-age=0;";
          } catch {}
        }
      },

      setVendor: (vendor) => set({ vendor, isAuthenticated: Boolean(vendor) }),
    }),
    {
      name: "intrihub-vendor-auth",
    }
  )
);

