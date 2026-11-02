import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NotificationItem {
  id: string;
  type: "approval_required" | "auto_accepted" | "unacknowledged" | "sla_warning" | "rider_arrived" | "general";
  accentColor: string;
  badge?: {
    icon: string;
    text: string;
    color: string;
  };
  iconOverlay?: "bell" | "clock" | "user";
  title: string;
  body: string;
  timestamp: string;
  orderId?: string;
  amount?: string;
  image?: string;
  images?: string[];
  isRead: boolean;
  actions?: {
    type: "two_buttons" | "single_button" | "chevron";
    primaryText?: string;
    secondaryText?: string;
  };
  createdAt?: number;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

const STORAGE_KEY = "@intrihub_business_notifications_v3";

const persistNotifications = async (items: NotificationItem[]) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("[NOTIFICATION STORE] Failed to persist notifications:", e);
  }
};

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  shakeNonce: number;
  isInitialized: boolean;

  initNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (item: Partial<NotificationItem>) => void;
  triggerShake: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  shakeNonce: 0,
  isInitialized: false,

  initNotifications: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NotificationItem[];
        if (Array.isArray(parsed)) {
          // Deduplicate by orderId or id and remove old dummy placeholder notifications
          const seenOrders = new Set<string>();
          const seenIds = new Set<string>();
          const deduped: NotificationItem[] = [];

          for (const n of parsed) {
            // Filter out old mock items and old generic store notifications
            if (["notif-1", "notif-2", "notif-3", "notif-4", "notif-5"].includes(n.id)) continue;
            if (["ORD-8493", "ORD-8492", "ORD-8490", "ORD-8488", "ORD-8485"].includes(n.orderId || "")) continue;
            if (n.title === "Store Notification") continue; // Purge old generic duplicate

            const orderKey = n.orderId || (n.body && n.body.match(/ORD-[\w-]+/)?.[0]);
            if (orderKey) {
              if (seenOrders.has(orderKey)) continue;
              seenOrders.add(orderKey);
            }
            if (n.id) {
              if (seenIds.has(n.id)) continue;
              seenIds.add(n.id);
            }
            deduped.push(n);
          }

          set({
            notifications: deduped,
            unreadCount: deduped.filter((n) => !n.isRead).length,
            isInitialized: true,
          });

          persistNotifications(deduped);
          return;
        }
      }
      set({
        notifications: [],
        unreadCount: 0,
        isInitialized: true,
      });
    } catch {
      set({ isInitialized: true });
    }
  },

  markAsRead: (id: string) => {
    const { notifications } = get();
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    const unread = updated.filter((n) => !n.isRead).length;
    set({ notifications: updated, unreadCount: unread });
    persistNotifications(updated);
  },

  markAllAsRead: () => {
    const { notifications } = get();
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated, unreadCount: 0 });
    persistNotifications(updated);
  },

  removeNotification: (id: string) => {
    const { notifications } = get();
    const updated = notifications.filter((n) => n.id !== id);
    const unread = updated.filter((n) => !n.isRead).length;
    set({ notifications: updated, unreadCount: unread });
    persistNotifications(updated);
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
    persistNotifications([]);
  },

  addNotification: (item: Partial<NotificationItem>) => {
    const { notifications, shakeNonce } = get();

    // 1. Deduplicate by order key (orderId or body match) to strictly guarantee 1 notification per order
    const orderKey = item.orderId || (item.body && item.body.match(/ORD-[\w-]+/)?.[0]);
    if (orderKey) {
      const existingIdx = notifications.findIndex(
        (n) =>
          n.orderId === orderKey ||
          n.id === `order-${orderKey}` ||
          (n.body && n.body.includes(orderKey))
      );
      if (existingIdx !== -1) {
        // Update existing notification without creating duplicate
        const updated = [...notifications];
        updated[existingIdx] = {
          ...updated[existingIdx],
          ...item,
          id: updated[existingIdx].id,
          orderId: orderKey,
          title: item.title || updated[existingIdx].title || "New Order Received! 🛍️",
          timestamp: "Just now",
        };
        const unread = updated.filter((n) => !n.isRead).length;
        set({
          notifications: updated,
          unreadCount: unread,
          shakeNonce: shakeNonce + 1,
        });
        persistNotifications(updated);
        return;
      }
    }

    const notifId = item.id || (orderKey ? `order-${orderKey}` : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);

    const newNotif: NotificationItem = {
      id: notifId,
      type: item.type || "general",
      accentColor: item.accentColor || "#3B82F6",
      title: item.title || (orderKey ? "New Order Received! 🛍️" : "New Business Notification"),
      body: item.body || "You have a new update in your store.",
      timestamp: item.timestamp || "Just now",
      orderId: orderKey,
      amount: item.amount,
      image: item.image,
      images: item.images,
      badge: item.badge,
      iconOverlay: item.iconOverlay || "bell",
      actions: item.actions || { type: "chevron" },
      isRead: false,
      createdAt: Date.now(),
    };

    // Filter out if duplicate ID or matching orderKey exists, prepend new notification
    const filtered = notifications.filter(
      (n) =>
        n.id !== newNotif.id &&
        (!orderKey || (n.orderId !== orderKey && !n.body?.includes(orderKey)))
    );
    const updated = [newNotif, ...filtered];
    const unread = updated.filter((n) => !n.isRead).length;

    set({
      notifications: updated,
      unreadCount: unread,
      shakeNonce: shakeNonce + 1, // Triggers bell shake animation
    });
    persistNotifications(updated);
  },

  triggerShake: () => {
    set((state) => ({ shakeNonce: state.shakeNonce + 1 }));
  },
}));
