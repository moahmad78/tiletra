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
  quickSwitchVendor: (demoId: string) => void;
};

// Demo pre-configured vendors for instant zero-friction testing
export const DEMO_VENDORS: VendorSession[] = [
  {
    id: "vnd-001",
    businessName: "Sri Balaji Electricals & Hardware",
    slug: "sri-balaji-electricals",
    contactEmail: "balaji.electricals@intrihub.com",
    contactPhone: "9845012345",
    category: "Electricals & Lighting",
    status: "approved",
    commissionRate: 12.0,
    ownerName: "Ramesh Kumar",
    ownerId: "usr-vnd-001",
    mustChangePassword: false,
    lastLogin: new Date().toISOString(),
  },
  {
    id: "vnd-002",
    businessName: "Royal Ceramics & Sanitaryware",
    slug: "royal-ceramics",
    contactEmail: "royal.ceramics@intrihub.com",
    contactPhone: "9876543210",
    category: "Sanitary & Bath Fittings",
    status: "approved",
    commissionRate: 15.0,
    ownerName: "Anand Poddar",
    ownerId: "usr-vnd-002",
    mustChangePassword: false,
    lastLogin: new Date().toISOString(),
  },
  {
    id: "vnd-003",
    businessName: "Apex Plumbing Supplies",
    slug: "apex-plumbing",
    contactEmail: "apex.plumbing@intrihub.com",
    contactPhone: "9123456780",
    category: "Plumbing & Pipes",
    status: "pending",
    commissionRate: 15.0,
    ownerName: "Vikas Sharma",
    ownerId: "usr-vnd-003",
    mustChangePassword: false,
    lastLogin: new Date().toISOString(),
  },
];

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
          } catch {}
        }
      },

      setVendor: (vendor) => set({ vendor, isAuthenticated: Boolean(vendor) }),

      quickSwitchVendor: () => {},
    }),
    {
      name: "intrihub-vendor-auth",
    }
  )
);

