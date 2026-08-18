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
  avatar?: string;
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
  activeOtpCode: string | null;
  otpSentAt: number | null;
  emailOtpSentAt: number | null;
  _hasHydrated: boolean; // true once localStorage rehydration is complete

  // Actions
  openLoginModal: (intent?: AuthIntent) => void;
  closeLoginModal: () => void;
  sendOtp: (phone: string) => Promise<{ success: boolean; message: string; simulatedOtp?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; message: string }>;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailOtp: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  googleSignIn: (userData: { name: string; email: string; avatar?: string; image?: string }) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string | null }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;

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
      emailOtpSentAt: null,
      _hasHydrated: false,

      setHasHydrated: (v) => set({ _hasHydrated: v }),

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

        // Generate 6-digit simulated OTP
        const generatedOtp = "123456"; // Consistent test OTP for demo
        set({ activeOtpCode: generatedOtp, otpSentAt: Date.now() });

        return {
          success: true,
          message: `OTP sent to +91 ${cleanPhone}. (Demo: use 123456)`,
          simulatedOtp: generatedOtp,
        };
      },

      verifyOtp: async (phone: string, otp: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        const currentOtp = get().activeOtpCode;

        // Allow '123456' as default demo code or generated OTP
        if (otp !== currentOtp && otp !== "123456") {
          return { success: false, message: "Invalid OTP. Please enter the 6-digit code sent to your phone." };
        }

        try {
          const { upsertCustomerUser } = await import("@/lib/actions/auth");
          const res = await upsertCustomerUser({
            phone: cleanPhone,
            name: get().user?.name || `User ${cleanPhone.slice(-4)}`,
            email: get().user?.email,
          });

          if (res.success && res.user) {
            const loggedUser: CustomerUser = {
              id: res.user.id,
              phone: res.user.phone,
              name: res.user.name,
              email: res.user.email,
              avatar: res.user.avatar,
              addresses: res.user.addresses?.length ? res.user.addresses : DEFAULT_SAMPLE_ADDRESSES,
              defaultAddressId: res.user.defaultAddressId || DEFAULT_SAMPLE_ADDRESSES[0].id,
              phoneVerified: true,
              createdAt: res.user.createdAt,
            };

            set({
              user: loggedUser,
              isAuthenticated: true,
              isLoginModalOpen: false,
              activeOtpCode: null,
            });

            return { success: true, message: "Logged in successfully!" };
          }
        } catch (e) {
          console.error("Failed to upsert user in DB:", e);
        }

        // Fallback user if DB is offline
        const loggedUser: CustomerUser = {
          id: `usr-${Date.now()}`,
          phone: cleanPhone,
          name: `User ${cleanPhone.slice(-4)}`,
          addresses: DEFAULT_SAMPLE_ADDRESSES,
          defaultAddressId: DEFAULT_SAMPLE_ADDRESSES[0].id,
          phoneVerified: true,
          createdAt: new Date().toISOString(),
        };

        set({
          user: loggedUser,
          isAuthenticated: true,
          isLoginModalOpen: false,
          activeOtpCode: null,
        });

        return { success: true, message: "Logged in successfully!" };
      },

      googleSignIn: async (userData) => {
        const phone = "9876543210";
        const avatar = userData.avatar || userData.image;
        try {
          const { upsertCustomerUser } = await import("@/lib/actions/auth");
          const res = await upsertCustomerUser({
            phone,
            name: userData.name,
            email: userData.email,
            avatar,
          });

          if (res.success && res.user) {
            const loggedUser: CustomerUser = {
              id: res.user.id,
              phone: res.user.phone,
              name: res.user.name,
              email: res.user.email,
              avatar: res.user.avatar || avatar,
              addresses: res.user.addresses?.length ? res.user.addresses : DEFAULT_SAMPLE_ADDRESSES,
              defaultAddressId: res.user.defaultAddressId || DEFAULT_SAMPLE_ADDRESSES[0].id,
              phoneVerified: true,
              createdAt: res.user.createdAt,
            };

            set({
              user: loggedUser,
              isAuthenticated: true,
              isLoginModalOpen: false,
            });
            return;
          }
        } catch (e) {
          console.error("Failed to upsert google user in DB:", e);
        }

        const newUser: CustomerUser = {
          id: `usr-google-${Date.now()}`,
          phone,
          name: userData.name,
          email: userData.email,
          avatar,
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

      sendEmailOtp: async (email: string) => {
        try {
          const { sendEmailOtp } = await import("@/lib/actions/email-otp");
          const res = await sendEmailOtp(email);
          if (res.success) {
            set({ emailOtpSentAt: Date.now() });
          }
          return res;
        } catch (e) {
          console.error("sendEmailOtp error:", e);
          return { success: false, message: "Failed to send email OTP. Please try again." };
        }
      },

      verifyEmailOtp: async (email: string, otp: string) => {
        try {
          const { verifyEmailOtp } = await import("@/lib/actions/email-otp");
          const res = await verifyEmailOtp(email, otp);
          if (res.success && res.userId) {
            // Fetch user record directly by email - verifyEmailOtp already created/updated it
            const { getDbUser } = await import("@/lib/actions/auth");
            const dbUser = await getDbUser(res.userId);
            if (dbUser) {
              const loggedUser: CustomerUser = {
                id: dbUser.id,
                phone: dbUser.phone,
                name: dbUser.name || email.split("@")[0],
                email: dbUser.email || email,
                avatar: dbUser.avatar || undefined,
                addresses: DEFAULT_SAMPLE_ADDRESSES,
                defaultAddressId: DEFAULT_SAMPLE_ADDRESSES[0].id,
                phoneVerified: dbUser.phoneVerified,
                createdAt: dbUser.createdAt.toISOString(),
              };
              set({
                user: loggedUser,
                isAuthenticated: true,
                isLoginModalOpen: false,
                emailOtpSentAt: null,
              });
              return { success: true, message: "Logged in successfully!" };
            }
          }
          return { success: res.success, message: res.message };
        } catch (e) {
          console.error("verifyEmailOtp error:", e);
          return { success: false, message: "Verification failed. Please try again." };
        }
      },


      updateProfile: async (data) => {
        const currentUser = get().user;
        if (!currentUser) return { success: false, message: "Not logged in" };

        try {
          const { updateUserProfile } = await import("@/lib/actions/auth");
          const res = await updateUserProfile(currentUser.id, data);
          if (res.success && res.user) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    name: res.user.name || state.user.name,
                    email: res.user.email || state.user.email,
                    avatar: res.user.avatar !== undefined ? (res.user.avatar || undefined) : state.user.avatar,
                  }
                : null,
            }));
            return { success: true, message: "Profile updated successfully!" };
          }
        } catch (e: any) {
          console.error("Failed to update profile:", e);
        }

        // Local state update fallback
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                name: data.name !== undefined ? data.name : state.user.name,
                email: data.email !== undefined ? data.email : state.user.email,
                avatar: data.avatar !== undefined ? (data.avatar || undefined) : state.user.avatar,
              }
            : null,
        }));

        return { success: true, message: "Profile updated!" };
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
      onRehydrateStorage: () => (state) => {
        // Called once localStorage hydration finishes — mark hydration complete
        state?.setHasHydrated(true);
      },
    }
  )
);

/** Hook: resolves true only after Zustand has rehydrated from localStorage */
export const useAuthHydrated = () => useAuthStore((s) => s._hasHydrated);
