"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType =
  | "order_placed"
  | "order_status"
  | "price_drop"
  | "back_in_stock"
  | "review_reminder"
  | "promo";

export type InAppNotification = {
  id: string;
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

const SEED_NOTIFICATIONS: InAppNotification[] = [
  {
    id: "notif-001",
    type: "order_status",
    title: "Order TL-849201 Dispatched!",
    body: "Your Calacatta Marble Effect tiles have been dispatched via Delhivery Freight (DEL-TL-849201).",
    link: "/account/orders",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45m ago
  },
  {
    id: "notif-002",
    type: "review_reminder",
    title: "How do your new tiles look?",
    body: "Your Arctic White Subway tiles were delivered 3 days ago. Share a photo review and help homeowners!",
    link: "/product/arctic-white-subway-wall",
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3h ago
  },
  {
    id: "notif-003",
    type: "promo",
    title: "Weekend Deal: Flat 15% Off Vitrified Tiles",
    body: "Use code INTRI10 at checkout on floor tile orders above ₹10,000.",
    link: "/shop/floor-tiles",
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
  },
];

type NotificationsState = {
  notifications: InAppNotification[];
  preferences: NotificationPreferences;

  // Actions
  addNotification: (notif: Omit<InAppNotification, "id" | "read" | "createdAt">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  updatePreferences: (updates: Partial<NotificationPreferences>) => void;
  getUnreadCount: () => number;
};

export const useNotificationsStore = create<NotificationsState>()(
  persist(
    (set, get) => ({
      notifications: SEED_NOTIFICATIONS,
      preferences: {
        orderUpdates: true,
        priceDrops: true,
        backInStock: true,
        promotions: true,
        reviewReminders: true,
      },

      addNotification: (data) => {
        const id = `notif-${Date.now().toString().slice(-6)}`;
        const newNotif: InAppNotification = {
          ...data,
          id,
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [newNotif, ...s.notifications] }));
      },

      markAsRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllAsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),

      deleteNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      updatePreferences: (updates) =>
        set((s) => ({ preferences: { ...s.preferences, ...updates } })),

      getUnreadCount: () =>
        get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "intrihub-notifications",
    }
  )
);
