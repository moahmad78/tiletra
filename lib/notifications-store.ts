"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  getCustomerNotifications,
  getUnreadCustomerNotificationCount,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead,
  deleteCustomerNotification,
  createCustomerNotification,
} from "@/lib/actions/notifications";

export type NotificationType =
  | "order_placed"
  | "order_status"
  | "price_drop"
  | "back_in_stock"
  | "review_reminder"
  | "promo"
  | "info"
  | "general";

export type InAppNotification = {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
};

export type NotificationPreferences = {
  orderUpdates: boolean;
  priceDrops: boolean;
  backInStock: boolean;
  promotions: boolean;
  reviewReminders: boolean;
};

type NotificationsState = {
  currentUserId: string | null;
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  preferences: NotificationPreferences;

  // Actions
  fetchForUser: (userId: string | null | undefined) => Promise<void>;
  addNotification: (
    notif: Omit<InAppNotification, "id" | "read" | "createdAt">,
    userIdOverride?: string
  ) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  reset: () => void;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  getUnreadCount: () => number;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      preferences: {
        orderUpdates: true,
        priceDrops: true,
        backInStock: true,
        promotions: true,
        reviewReminders: true,
      },

      fetchForUser: async (userId) => {
        if (!userId) {
          set({ currentUserId: null, notifications: [], unreadCount: 0, isLoading: false });
          return;
        }

        set({ isLoading: true });
        try {
          const [list, count] = await Promise.all([
            getCustomerNotifications(userId, 20),
            getUnreadCustomerNotificationCount(userId),
          ]);

          set({
            currentUserId: userId,
            notifications: list as InAppNotification[],
            unreadCount: count,
            isLoading: false,
          });
        } catch (err) {
          console.error("Failed to fetch customer notifications:", err);
          set({ isLoading: false });
        }
      },

      addNotification: async (data, userIdOverride) => {
        const userId = userIdOverride || get().currentUserId;
        if (!userId) return;

        try {
          const res = await createCustomerNotification({
            userId,
            title: data.title,
            message: data.body,
            type: data.type,
            link: data.link,
          });

          const newNotif: InAppNotification = {
            ...data,
            id: res.notification?.id || `notif-${Date.now()}`,
            userId,
            read: false,
            createdAt: new Date().toISOString(),
          };

          set((s) => ({
            notifications: [newNotif, ...s.notifications.filter((n) => n.id !== newNotif.id)],
            unreadCount: s.unreadCount + 1,
          }));
        } catch (err) {
          console.error("Error creating customer notification:", err);
        }
      },

      markAsRead: async (id) => {
        const userId = get().currentUserId;
        set((s) => {
          const notif = s.notifications.find((n) => n.id === id);
          const wasUnread = notif && !notif.read;
          return {
            notifications: s.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
          };
        });

        if (userId) {
          try {
            await markCustomerNotificationAsRead(id, userId);
          } catch (err) {
            console.error("Failed to mark notification as read on server:", err);
          }
        }
      },

      markAllAsRead: async () => {
        const userId = get().currentUserId;
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));

        if (userId) {
          try {
            await markAllCustomerNotificationsAsRead(userId);
          } catch (err) {
            console.error("Failed to mark all notifications as read on server:", err);
          }
        }
      },

      deleteNotification: async (id) => {
        const userId = get().currentUserId;
        set((s) => {
          const notif = s.notifications.find((n) => n.id === id);
          const wasUnread = notif && !notif.read;
          return {
            notifications: s.notifications.filter((n) => n.id !== id),
            unreadCount: wasUnread ? Math.max(0, s.unreadCount - 1) : s.unreadCount,
          };
        });

        if (userId) {
          try {
            await deleteCustomerNotification(id, userId);
          } catch (err) {
            console.error("Failed to delete notification on server:", err);
          }
        }
      },

      reset: () => {
        set({
          currentUserId: null,
          notifications: [],
          unreadCount: 0,
          isLoading: false,
        });
      },

      updatePreferences: (updates) =>
        set((s) => ({ preferences: { ...s.preferences, ...updates } })),

      getUnreadCount: () => {
        const state = get();
        if (!state.currentUserId) return 0;
        return state.unreadCount;
      },
    }),
    {
      name: "intrihub-notifications-v2",
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);
