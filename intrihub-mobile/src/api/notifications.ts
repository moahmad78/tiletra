import { apiClient } from "./client";
import { AppNotification } from "../types";

export interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
  unreadCount: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function getNotifications(page = 1, limit = 20): Promise<NotificationsResponse> {
  const { data } = await apiClient.get<NotificationsResponse>("/api/mobile/notifications", {
    params: { page, limit },
  });
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const { data } = await apiClient.get<{ success: boolean; unreadCount: number }>(
      "/api/mobile/notifications/unread-count"
    );
    return data?.unreadCount || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const { data } = await apiClient.patch<{ success: boolean }>(
      `/api/mobile/notifications/${id}/read`
    );
    return data?.success || false;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const { data } = await apiClient.patch<{ success: boolean }>(
      "/api/mobile/notifications/read-all"
    );
    return data?.success || false;
  } catch {
    return false;
  }
}
