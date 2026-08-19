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
  lastLogin: string;
};

type VendorAuthState = {
  vendor: VendorSession | null;
  isAuthenticated: boolean;
  login: (emailOrPhone: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
    lastLogin: new Date().toISOString(),
  },
  {
    id: "vnd-003",
    businessName: "Apex Plumbing Supplies",
    slug: "apex-plumbing",
    contactEmail: "apex.plumbing@intrihub.com",
    contactPhone: "9123456780",
    category: "Plumbing & Pipes",
    status: "pending", // demonstrates pending state banner
    commissionRate: 15.0,
    ownerName: "Vikas Sharma",
    ownerId: "usr-vnd-003",
    lastLogin: new Date().toISOString(),
  },
];

export const useVendorAuth = create<VendorAuthState>()(
  persist(
    (set, get) => ({
      vendor: DEMO_VENDORS[0], // Pre-authenticated with Sri Balaji Electricals
      isAuthenticated: true,

      login: async (emailOrPhone, password) => {
        const input = emailOrPhone.toLowerCase().trim();
        const cleanPhone = input.replace(/\D/g, "");

        // 1. Check demo vendors first
        const demoMatch = DEMO_VENDORS.find(
          (v) =>
            v.contactEmail.toLowerCase() === input ||
            v.contactPhone === cleanPhone ||
            v.businessName.toLowerCase().includes(input)
        );

        if (demoMatch) {
          const session: VendorSession = {
            ...demoMatch,
            lastLogin: new Date().toISOString(),
          };
          set({ vendor: session, isAuthenticated: true });
          return { success: true };
        }

        // 2. Query Database / Server API
        try {
          const res = await fetch(`/api/auth/vendor-login?query=${encodeURIComponent(input)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.vendor) {
              const session: VendorSession = {
                id: data.vendor.id,
                businessName: data.vendor.businessName,
                slug: data.vendor.slug,
                contactEmail: data.vendor.contactEmail,
                contactPhone: data.vendor.contactPhone,
                category: data.vendor.category,
                status: data.vendor.status,
                commissionRate: data.vendor.commissionRate,
                ownerName: data.vendor.owner?.name || data.vendor.businessName,
                ownerId: data.vendor.ownerId,
                rejectionReason: data.vendor.rejectionReason,
                lastLogin: new Date().toISOString(),
              };
              set({ vendor: session, isAuthenticated: true });
              return { success: true };
            }
          }
        } catch (e) {
          console.error("Vendor login error:", e);
        }

        // Fallback: create temporary vendor session if signing in with new email
        if (input.includes("@")) {
          const customVendor: VendorSession = {
            id: `vnd-${Date.now().toString().slice(-4)}`,
            businessName: input.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").toUpperCase() + " ENTERPRISES",
            slug: input.split("@")[0],
            contactEmail: input,
            contactPhone: "9800000000",
            category: "General Hardware",
            status: "approved",
            commissionRate: 15.0,
            ownerName: input.split("@")[0],
            ownerId: `usr-${Date.now().toString().slice(-4)}`,
            lastLogin: new Date().toISOString(),
          };
          set({ vendor: customVendor, isAuthenticated: true });
          return { success: true };
        }

        return { success: false, error: "Invalid vendor credentials. Please try demo accounts." };
      },

      logout: () => set({ vendor: null, isAuthenticated: false }),

      setVendor: (vendor) => set({ vendor, isAuthenticated: Boolean(vendor) }),

      quickSwitchVendor: (demoId) => {
        const found = DEMO_VENDORS.find((v) => v.id === demoId) || DEMO_VENDORS[0];
        set({ vendor: { ...found, lastLogin: new Date().toISOString() }, isAuthenticated: true });
      },
    }),
    {
      name: "intrihub-vendor-auth",
    }
  )
);
