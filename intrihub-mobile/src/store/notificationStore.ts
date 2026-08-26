import { create } from "zustand";
import { AppNotification } from "../types";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../api/notifications";

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchUnreadCount: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  incrementUnreadCount: () => void;
  addNewNotification: (notif: AppNotification) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchUnreadCount: async () => {
    try {
      const count = await getUnreadNotificationCount();
      set({ unreadCount: count });
    } catch (err) {
      console.warn("Failed to fetch unread count:", err);
    }
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await getNotifications(1, 40);
      set({
        notifications: res.notifications || [],
        unreadCount: res.unreadCount ?? 0,
        isLoading: false,
      });
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
      set({ isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    // Optimistic update
    const current = get().notifications;
    const target = current.find((n) => n.id === id);
    if (target && !target.isRead) {
      set({
        notifications: current.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
      await markNotificationAsRead(id);
    }
  },

  markAllAsRead: async () => {
    // Optimistic update
    const current = get().notifications;
    set({
      notifications: current.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
    await markAllNotificationsAsRead();
  },

  incrementUnreadCount: () => {
    set((state) => ({ unreadCount: state.unreadCount + 1 }));
  },

  addNewNotification: (notif: AppNotification) => {
    set((state) => ({
      notifications: [notif, ...state.notifications],
      unreadCount: notif.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },
}));
