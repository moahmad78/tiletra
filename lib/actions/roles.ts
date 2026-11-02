"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export async function getTeamMembers() {
  try {
    const [team, roleStats] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: { in: ["admin", "staff", "cpo"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          phoneVerified: true,
          emailVerified: true,
          createdAt: true,
          avatar: true,
        },
      }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
    ]);

    const counts: Record<string, number> = {};
    roleStats.forEach((r) => {
      counts[r.role] = r._count.id;
    });

    return {
      success: true,
      team,
      counts: {
        admin: counts["admin"] || 0,
        staff: counts["staff"] || 0,
        cpo: counts["cpo"] || 0,
        vendor: counts["vendor"] || 0,
        customer: counts["customer"] || 0,
        total: Object.values(counts).reduce((a, b) => a + b, 0),
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || "Failed to load team members",
      team: [],
      counts: { admin: 0, staff: 0, cpo: 0, vendor: 0, customer: 0, total: 0 },
    };
  }
}

export async function updateUserRole(params: {
  userId: string;
  newRole: "admin" | "staff" | "cpo" | "customer";
  adminName?: string;
}) {
  try {
    const { userId, newRole, adminName = "Super Admin" } = params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    try {
      await (prisma as any).adminNotification.create({
        data: {
          title: `Role Updated: ${user.name || user.email || user.phone}`,
          message: `Changed from ${user.role} to ${newRole} by ${adminName}`,
          type: "role_change",
          link: "/admin/roles",
        },
      });
    } catch {}

    safeRevalidate("/admin/roles");
    safeRevalidate("/admin/customers");

    return {
      success: true,
      message: `User role updated to ${newRole.toUpperCase()} successfully.`,
      user: updated,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update role" };
  }
}

export async function getActiveSessionsAndDevices() {
  try {
    const [deviceTokens, mobileTokens] = await Promise.all([
      prisma.deviceToken.findMany({
        take: 100,
        orderBy: { updatedAt: "desc" },
      }),
      (prisma as any).mobilePushToken.findMany({
        take: 100,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    // Fetch user info for tokens
    const userIds = Array.from(
      new Set([
        ...deviceTokens.map((d: any) => d.userId),
        ...mobileTokens.map((m: any) => m.userId),
      ])
    ).filter(Boolean);

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, phone: true, email: true, role: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const sessions = [
      ...deviceTokens.map((d: any) => ({
        id: d.id,
        userId: d.userId,
        user: userMap.get(d.userId) || null,
        platform: d.platform,
        tokenSnippet: d.token ? `${d.token.slice(0, 16)}...` : "Active Token",
        updatedAt: d.updatedAt,
        type: "device" as const,
      })),
      ...mobileTokens.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        user: userMap.get(m.userId) || null,
        platform: m.platform,
        tokenSnippet: m.token ? `${m.token.slice(0, 16)}...` : "Active Mobile Token",
        updatedAt: m.updatedAt,
        type: "mobile" as const,
      })),
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return {
      success: true,
      sessions,
      totalSessions: sessions.length,
    };
  } catch (error: any) {
    return { success: false, sessions: [], totalSessions: 0, error: error?.message };
  }
}

export async function revokeSessionToken(tokenId: string, type: "device" | "mobile") {
  try {
    if (type === "device") {
      await prisma.deviceToken.delete({ where: { id: tokenId } });
    } else {
      await (prisma as any).mobilePushToken.delete({ where: { id: tokenId } });
    }
    safeRevalidate("/admin/roles");
    return { success: true, message: "Device session revoked successfully." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to revoke session" };
  }
}
