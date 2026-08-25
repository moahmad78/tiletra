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
  updateUserPhone: (phone: string) => Promise<{ success: boolean; message?: string }>;
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

        // Explicit defense-in-depth: Clear any existing session before logging in new user
        set({ user: null, isAuthenticated: false });

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
        const realPhone = userData.phone && !userData.phone.startsWith("google_") && !userData.phone.startsWith("email_") ? userData.phone.replace(/\D/g, "").slice(-10) : "";

        // 1. Explicit clean session start: wipe any previous user state immediately
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

        // 2. Fetch real DB data (phone + addresses) for THIS specific user
        try {
          const { getDbUser, getDbUserByEmail } = await import("@/lib/actions/auth");
          let dbUser = null;
          if (userId && !userId.startsWith("usr-")) {
            dbUser = await getDbUser(userId);
          }
          if (!dbUser && userData.email) {
            dbUser = await getDbUserByEmail(userData.email);
          }

          if (dbUser) {
            // Resolve real phone if verified in DB
            const dbPhone = dbUser.phone && !dbUser.phone.startsWith("google_") && !dbUser.phone.startsWith("email_") ? dbUser.phone.replace(/\D/g, "").slice(-10) : "";
            const resolvedPhone = dbPhone || realPhone;

            const addresses: CustomerAddress[] = (dbUser.addresses || []).map((a: any) => ({
              id: a.id,
              name: dbUser.name || userData.name || "Customer",
              phone: resolvedPhone,
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
              // Safety: only update if state is still this same email/user
              if (!state.user || (state.user.email && state.user.email !== userData.email)) return state;
              return {
                user: {
                  ...state.user,
                  id: dbUser.id,
                  phone: resolvedPhone,
                  phoneVerified: dbUser.phoneVerified,
                  addresses,
                  defaultAddressId: addresses.find((a) => a.isDefault)?.id || addresses[0]?.id,
                },
              };
            });
          }
        } catch (e) {
          console.error("Failed to load user data in background:", e);
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
            // Explicit clean session start
            set({ user: null, isAuthenticated: false });

            const { getDbUser } = await import("@/lib/actions/auth");
            const dbUser = await getDbUser(res.userId);
            if (dbUser) {
              const realPhone = (dbUser.phone && !dbUser.phone.startsWith("email_") && !dbUser.phone.startsWith("google_")) ? dbUser.phone.replace(/\D/g, "").slice(-10) : "";
              const addresses: CustomerAddress[] = (dbUser.addresses || []).map((a: any) => ({
                id: a.id,
                name: dbUser.name || "Customer",
                phone: realPhone,
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
                phone: realPhone,
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

        const targetName = data.name !== undefined ? data.name.trim() : currentUser.name;
        const targetEmail = data.email !== undefined ? data.email.trim().toLowerCase() : currentUser.email;
        const targetAvatar = data.avatar !== undefined ? (data.avatar || undefined) : currentUser.avatar;

        try {
          const { updateUserProfile } = await import("@/lib/actions/auth");
          const res = await updateUserProfile(currentUser.id, {
            name: targetName,
            email: targetEmail,
            avatar: targetAvatar,
          });

          if (res.success && res.user) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    id: res.user.id || state.user.id,
                    name: res.user.name || targetName,
                    email: res.user.email || targetEmail,
                    avatar: res.user.avatar !== undefined ? (res.user.avatar || undefined) : targetAvatar,
                    phone: res.user.phone || state.user.phone,
                  }
                : null,
            }));
            return { success: true, message: "Profile updated successfully!" };
          }
        } catch (e: any) {
          console.error("Failed to update profile on backend:", e);
        }

        // Local state update fallback
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                name: targetName,
                email: targetEmail,
                avatar: targetAvatar,
              }
            : null,
        }));

        return { success: true, message: "Profile updated!" };
      },

      updateUserPhone: async (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, "").slice(-10);
        if (cleanPhone.length !== 10) return { success: false, message: "Enter a valid 10-digit mobile number" };
        const currentUser = get().user;
        if (!currentUser) return { success: false, message: "Not logged in" };
        try {
          const { updateUserPhoneInDb } = await import("@/lib/actions/auth");
          const res = await updateUserPhoneInDb(currentUser.id, cleanPhone, currentUser.email);
          if (res.success) {
            set((state) => ({
              user: state.user
                ? {
                    ...state.user,
                    id: res.userId || state.user.id,
                    phone: cleanPhone,
                    phoneVerified: true,
                  }
                : null,
            }));
            return { success: true, message: "Mobile number linked successfully!" };
          }
          return { success: false, message: res.error || "Failed to update phone" };
        } catch (e: any) {
          return { success: false, message: e?.message || "Failed to update phone" };
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, pendingIntent: null, activeOtpCode: null });
        if (typeof window !== "undefined") {
          try {
            const { useNotificationsStore } = require("@/lib/notifications-store");
            useNotificationsStore.getState().reset();
          } catch {}
          try {
            localStorage.removeItem("intrihub-customer-auth");
            localStorage.removeItem("tiletra-customer-auth");
            localStorage.removeItem("intrihub-notifications");
            localStorage.removeItem("intrihub-notifications-v2");
            sessionStorage.clear();
            document.cookie = "intrihub_session=; max-age=0; path=/;";
            document.cookie = "tiletra_session=; max-age=0; path=/;";
            document.cookie = "oauth_state=; max-age=0; path=/;";
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
      name: "intrihub-customer-auth",
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
