"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CustomerAddress {
  id: string;
  name: string;
  phone: string;
  pincode: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  landmark?: string;
  label: "Home" | "Work" | "Other";
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface CustomerUser {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  phoneVerified: boolean;
  createdAt: string;
}

export type AuthIntent =
  | { type: "checkout" }
  | { type: "buy_now"; data: { productId: string; variantId: string; quantity: number } }
  | null;

interface AuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoginModalOpen: boolean;
  pendingIntent: AuthIntent;
  activeOtpCode: string | null; // For simulated verification / SMS bridge
  otpSentAt: number | null;

  // Actions
  openLoginModal: (intent?: AuthIntent) => void;
  closeLoginModal: () => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; simulatedOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  googleSignIn: (userData: { name: string; email: string }) => void;
  logout: () => void;

  // Address Actions
  addAddress: (address: Omit<CustomerAddress, "id">) => CustomerAddress;
  updateAddress: (id: string, address: Partial<CustomerAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

const DEFAULT_SAMPLE_ADDRESSES: CustomerAddress[] = [
  {
    id: "addr-001",
    name: "Mohammad Ahmad",
    phone: "9876543210",
    pincode: "560034",
    line1: "#42, 3rd Cross, 5th Main, Koramangala 4th Block",
    line2: "Near Sony World Signal",
    city: "Bangalore",
    state: "Karnataka",
    landmark: "Behind Forum Mall",
    label: "Home",
    latitude: 12.9352,
    longitude: 77.6245,
    isDefault: true,
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoginModalOpen: false,
      pendingIntent: null,
      activeOtpCode: null,
      otpSentAt: null,

      openLoginModal: (intent = null) => {
        set({ isLoginModalOpen: true, pendingIntent: intent });
      },

      closeLoginModal: () => {
        set({ isLoginModalOpen: false, pendingIntent: null, activeOtpCode: null });
      },

      sendOtp: async (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
          return { success: false, message: "Please enter a valid 10-digit mobile number." };
        }

        // Generate 4-digit simulated OTP (e.g. 1234 or random)
        const generatedOtp = "1234"; // Consistent test OTP, but works with real SMS gateways
        set({ activeOtpCode: generatedOtp, otpSentAt: Date.now() });

        return {
          success: true,
          message: `OTP sent to +91 ${cleanPhone}. Use code: ${generatedOtp}`,
          simulatedOtp: generatedOtp,
        };
      },

      verifyOtp: async (phone: string, otp: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        const currentOtp = get().activeOtpCode;

        // Allow '1234' as default master demo code or generated OTP
        if (otp !== currentOtp && otp !== "1234") {
          return { success: false, message: "Invalid OTP. Please enter the 4-digit code sent to your phone." };
        }

        // Check if user already exists or create new one
        const existingUser = get().user;
        let loggedUser: CustomerUser;

        if (existingUser && existingUser.phone === cleanPhone) {
          loggedUser = { ...existingUser, phoneVerified: true };
        } else {
          loggedUser = {
            id: `usr-${Date.now()}`,
            phone: cleanPhone,
            name: `User ${cleanPhone.slice(-4)}`,
            addresses: DEFAULT_SAMPLE_ADDRESSES,
            defaultAddressId: DEFAULT_SAMPLE_ADDRESSES[0].id,
            phoneVerified: true,
            createdAt: new Date().toISOString(),
          };
        }

        set({
          user: loggedUser,
          isAuthenticated: true,
          isLoginModalOpen: false,
          activeOtpCode: null,
        });

        return { success: true, message: "Logged in successfully!" };
      },

      googleSignIn: (userData) => {
        const newUser: CustomerUser = {
          id: `usr-google-${Date.now()}`,
          phone: "9876543210",
          name: userData.name,
          email: userData.email,
          addresses: DEFAULT_SAMPLE_ADDRESSES,
          defaultAddressId: DEFAULT_SAMPLE_ADDRESSES[0].id,
          phoneVerified: true,
          createdAt: new Date().toISOString(),
        };

        set({
          user: newUser,
          isAuthenticated: true,
          isLoginModalOpen: false,
        });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, pendingIntent: null });
      },

      addAddress: (addressData) => {
        const newAddress: CustomerAddress = {
          ...addressData,
          id: `addr-${Date.now()}`,
        };

        set((state) => {
          if (!state.user) return state;
          const addresses = [...state.user.addresses, newAddress];
          const isFirst = addresses.length === 1;
          return {
            user: {
              ...state.user,
              addresses,
              defaultAddressId: isFirst || newAddress.isDefault ? newAddress.id : state.user.defaultAddressId,
            },
          };
        });

        return newAddress;
      },

      updateAddress: (id, updates) => {
        set((state) => {
          if (!state.user) return state;
          const addresses = state.user.addresses.map((a) => (a.id === id ? { ...a, ...updates } : a));
          return {
            user: {
              ...state.user,
              addresses,
            },
          };
        });
      },

      deleteAddress: (id) => {
        set((state) => {
          if (!state.user) return state;
          const addresses = state.user.addresses.filter((a) => a.id !== id);
          return {
            user: {
              ...state.user,
              addresses,
              defaultAddressId: state.user.defaultAddressId === id ? addresses[0]?.id : state.user.defaultAddressId,
            },
          };
        });
      },

      setDefaultAddress: (id) => {
        set((state) => {
          if (!state.user) return state;
          const addresses = state.user.addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }));
          return {
            user: {
              ...state.user,
              addresses,
              defaultAddressId: id,
            },
          };
        });
      },
    }),
    {
      name: "tiletra-customer-auth",
    }
  )
);
