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

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    type: "approval_required",
    accentColor: "#EF4444",
    badge: {
      icon: "🔔",
      text: "Urgent",
      color: "#DC2626",
    },
    title: "Manual Order Approval Required!",
    body: "Order #ORD-8493 (₹12,400) requires manual approval. Stock check needed.",
    timestamp: "2m ago",
    orderId: "ORD-8493",
    amount: "₹12,400",
    isRead: false,
    actions: {
      type: "two_buttons",
      primaryText: "Accept",
      secondaryText: "Reject",
    },
  },
  {
    id: "notif-2",
    type: "auto_accepted",
    accentColor: "#3B82F6",
    title: "New Order Auto-Accepted!",
    body: "Order #ORD-8492 (₹4,850) auto-confirmed from inventory. Ready to pack!",
    timestamp: "5m ago",
    orderId: "ORD-8492",
    amount: "₹4,850",
    isRead: false,
    actions: {
      type: "single_button",
      primaryText: "View Order & Pack →",
    },
  },
  {
    id: "notif-3",
    type: "unacknowledged",
    accentColor: "#F97316",
    iconOverlay: "bell",
    title: "Order Unacknowledged",
    body: "Order #ORD-8490 is not acknowledged. Please take action immediately.",
    timestamp: "10m ago",
    orderId: "ORD-8490",
    isRead: false,
    actions: {
      type: "chevron",
    },
  },
  {
    id: "notif-4",
    type: "sla_warning",
    accentColor: "#EAB308",
    iconOverlay: "clock",
    title: "5 min to pack 📦",
    body: "Order #ORD-8488 packing deadline approaching! Mark ready to avoid SLA breach.",
    timestamp: "15m ago",
    orderId: "ORD-8488",
    isRead: false,
    actions: {
      type: "chevron",
    },
  },
  {
    id: "notif-5",
    type: "rider_arrived",
    accentColor: "#10B981",
    iconOverlay: "user",
    title: "Dispatch Rider Arrived",
    body: "Rohit Kumar arrived at your store for pickup of Order #ORD-8485.",
    timestamp: "25m ago",
    orderId: "ORD-8485",
    isRead: false,
    actions: {
      type: "chevron",
    },
  },
];

const STORAGE_KEY = "@intrihub_business_notifications_v2";

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
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.isRead).length,
  shakeNonce: 0,
  isInitialized: false,

  initNotifications: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NotificationItem[];
        if (Array.isArray(parsed)) {
          set({
            notifications: parsed,
            unreadCount: parsed.filter((n) => !n.isRead).length,
            isInitialized: true,
          });
          return;
        }
      }
      // If nothing saved yet, seed with initial list
      await persistNotifications(INITIAL_NOTIFICATIONS);
      set({
        notifications: INITIAL_NOTIFICATIONS,
        unreadCount: INITIAL_NOTIFICATIONS.filter((n) => !n.isRead).length,
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
    const newNotif: NotificationItem = {
      id: item.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: item.type || "general",
      accentColor: item.accentColor || "#3B82F6",
      title: item.title || "New Business Notification",
      body: item.body || "You have a new update in your store.",
      timestamp: item.timestamp || "Just now",
      orderId: item.orderId,
      amount: item.amount,
      image: item.image,
      images: item.images,
      badge: item.badge,
      iconOverlay: item.iconOverlay || "bell",
      actions: item.actions || { type: "chevron" },
      isRead: false,
      createdAt: Date.now(),
    };

    // Filter out if duplicate ID exists, prepend new notification
    const filtered = notifications.filter((n) => n.id !== newNotif.id);
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
