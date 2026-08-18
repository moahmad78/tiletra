"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

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
