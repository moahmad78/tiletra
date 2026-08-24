"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

// =========================================================================
// 1. ADMIN NOTIFICATIONS
// =========================================================================

export async function getAdminNotifications(limit = 15) {
  try {
    const notifications = await prisma.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return notifications;
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
    return [];
  }
}

export async function getUnreadAdminNotificationCount() {
  try {
    const count = await prisma.adminNotification.count({
      where: { isRead: false },
    });
    return count;
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    return 0;
  }
}

export async function markAdminNotificationAsRead(id: string) {
  try {
    await prisma.adminNotification.update({
      where: { id },
      data: { isRead: true },
    });
    safeRevalidate("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: error?.message };
  }
}

export async function markAllAdminNotificationsAsRead() {
  try {
    await prisma.adminNotification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
    safeRevalidate("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: error?.message };
  }
}

// =========================================================================
// 2. CUSTOMER NOTIFICATIONS (Strictly Scoped by userId)
// =========================================================================

export async function getCustomerNotifications(userId: string, limit = 20) {
  if (!userId || typeof userId !== "string") return [];
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      type: (n.type as any) || "info",
      title: n.title,
      body: n.message,
      link: n.link || "/account",
      read: n.isRead,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching customer notifications for user", userId, error);
    return [];
  }
}

export async function getUnreadCustomerNotificationCount(userId: string) {
  if (!userId || typeof userId !== "string") return 0;
  try {
    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return count;
  } catch (error) {
    console.error("Error counting unread customer notifications:", error);
    return 0;
  }
}

export async function markCustomerNotificationAsRead(id: string, userId: string) {
  if (!id || !userId) return { success: false, error: "Missing parameters" };
  try {
    await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error marking customer notification as read:", error);
    return { success: false, error: error?.message };
  }
}

export async function markAllCustomerNotificationsAsRead(userId: string) {
  if (!userId) return { success: false, error: "Missing userId" };
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error marking all customer notifications as read:", error);
    return { success: false, error: error?.message };
  }
}

export async function deleteCustomerNotification(id: string, userId: string) {
  if (!id || !userId) return { success: false, error: "Missing parameters" };
  try {
    await prisma.notification.deleteMany({
      where: { id, userId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer notification:", error);
    return { success: false, error: error?.message };
  }
}

export async function createCustomerNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
}) {
  if (!data.userId || !data.title || !data.message) {
    return { success: false, error: "Missing required notification fields" };
  }
  try {
    const created = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "info",
        link: data.link || null,
        isRead: false,
      },
    });
    return { success: true, notification: created };
  } catch (error: any) {
    console.error("Error creating customer notification:", error);
    return { success: false, error: error?.message };
  }
}
