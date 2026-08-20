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
  googleSignIn: (userData: {
    userId?: string;
    name: string;
    email: string;
    avatar?: string;
    phone?: string;
    phoneVerified?: boolean;
    createdAt?: string;
  }) => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; avatar?: string | null }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setHasHydrated: (v: boolean) => void;

  // Address Actions
  addAddress: (address: Omit<CustomerAddress, "id">) => CustomerAddress;
  updateAddress: (id: string, address: Partial<CustomerAddress>) => void;
  deleteAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
}

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

        // Generate 6-digit simulated OTP for testing
        const generatedOtp = "123456";
        set({ activeOtpCode: generatedOtp, otpSentAt: Date.now() });

        return {
          success: true,
          message: `OTP sent to +91 ${cleanPhone}. (Demo code: 123456)`,
          simulatedOtp: generatedOtp,
        };
      },

      verifyOtp: async (phone: string, otp: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        const currentOtp = get().activeOtpCode;

        if (otp !== currentOtp && otp !== "123456") {
          return { success: false, message: "Invalid OTP. Please enter the 6-digit code." };
        }

        try {
          const { upsertCustomerUser } = await import("@/lib/actions/auth");
          const res = await upsertCustomerUser({
            phone: cleanPhone,
            name: `User ${cleanPhone.slice(-4)}`,
          });

          if (res.success && res.user) {
            const loggedUser: CustomerUser = {
              id: res.user.id,
              phone: res.user.phone,
              name: res.user.name,
              email: res.user.email,
              avatar: res.user.avatar,
              addresses: res.user.addresses || [],
              defaultAddressId: res.user.defaultAddressId || res.user.addresses?.[0]?.id,
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
          console.error("Failed to authenticate user via phone:", e);
        }

        // Fallback user if DB is unreachable
        const loggedUser: CustomerUser = {
          id: `usr-${Date.now()}`,
          phone: cleanPhone,
          name: `User ${cleanPhone.slice(-4)}`,
          addresses: [],
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
        const userId = userData.userId || "";
        const realPhone = userData.phone && !userData.phone.startsWith("google_") ? userData.phone : "";

        // 1. Instantly set authenticated state without blocking UI on network requests
        const immediateUser: CustomerUser = {
          id: userId || `usr-google-${Date.now()}`,
          phone: realPhone,
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          addresses: [],
          defaultAddressId: undefined,
          phoneVerified: Boolean(userData.phoneVerified),
          createdAt: userData.createdAt || new Date().toISOString(),
        };

        set({
          user: immediateUser,
          isAuthenticated: true,
          isLoginModalOpen: false,
        });

        // 2. Fetch real DB addresses asynchronously in the background
        if (userId) {
          try {
            const { getDbUser } = await import("@/lib/actions/auth");
            const dbUser = await getDbUser(userId);
            if (dbUser && Array.isArray(dbUser.addresses)) {
              const addresses: CustomerAddress[] = dbUser.addresses.map((a: any) => ({
                id: a.id,
                name: userData.name || "Customer",
                phone: (userData.phone && !userData.phone.startsWith("google_")) ? userData.phone : "",
                pincode: a.pincode || "",
                line1: a.street || "",
                line2: "",
                city: a.city || "Bangalore",
                state: a.state || "Karnataka",
                landmark: a.landmark || "",
                label: (a.label as any) || "Home",
                isDefault: Boolean(a.isDefault),
              }));

              set((state) => {
                if (!state.user || state.user.id !== userId) return state;
                return {
                  user: {
                    ...state.user,
                    addresses,
                    defaultAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
                  },
                };
              });
            }
          } catch (e) {
            console.error("Failed to load user addresses in background:", e);
          }
        }
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
            const { getDbUser } = await import("@/lib/actions/auth");
            const dbUser = await getDbUser(res.userId);
            if (dbUser) {
              const addresses: CustomerAddress[] = (dbUser.addresses || []).map((a: any) => ({
                id: a.id,
                name: dbUser.name || "Customer",
                phone: (dbUser.phone && !dbUser.phone.startsWith("email_")) ? dbUser.phone : "",
                pincode: a.pincode || "",
                line1: a.street || "",
                line2: "",
                city: a.city || "Bangalore",
                state: a.state || "Karnataka",
                landmark: a.landmark || "",
                label: (a.label as any) || "Home",
                isDefault: Boolean(a.isDefault),
              }));

              const loggedUser: CustomerUser = {
                id: dbUser.id,
                phone: (dbUser.phone && !dbUser.phone.startsWith("email_")) ? dbUser.phone : "",
                name: dbUser.name || email.split("@")[0],
                email: dbUser.email || email,
                avatar: dbUser.avatar || undefined,
                addresses,
                defaultAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
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
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("tiletra-customer-auth");
            document.cookie = "tiletra_session=; max-age=0; path=/;";
          } catch {}
        }
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

        // Persist to DB in background if user is authenticated
        const currentUser = get().user;
        if (currentUser?.id) {
          import("@/lib/actions/auth").then(({ saveUserAddress }) => {
            saveUserAddress(currentUser.id, newAddress).catch((e) =>
              console.error("Failed to save address to DB:", e)
            );
          });
        }

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
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

export const useAuthHydrated = () => useAuthStore((s) => s._hasHydrated);

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export const useAuthStatus = (): AuthStatus => {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!hasHydrated) return "loading";
  if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("google_session") && !isAuthenticated) {
    return "loading";
  }
  if (isAuthenticated && user) return "authenticated";
  return "unauthenticated";
};
