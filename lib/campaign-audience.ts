import { prisma as rawPrisma } from "@/lib/prisma";

const prisma = rawPrisma as any;

export interface AudienceFilter {
  type: "all" | "no_orders_days" | "ordered_days" | "cart_has_items" | "city";
  days?: number;
  city?: string;
}

/**
 * Resolves user IDs matching the campaign audience filter.
 */
export async function resolveAudienceUserIds(
  audience: AudienceFilter | null | undefined
): Promise<string[]> {
  const filterType = audience?.type || "all";
  const now = new Date();

  if (filterType === "all") {
    const users = await prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true },
    });
    return users.map((u: any) => u.id);
  }

  if (filterType === "cart_has_items") {
    const carts = await prisma.cart.findMany({
      where: {
        items: { some: {} },
      },
      select: { userId: true },
    });
    return Array.from(new Set(carts.map((c: any) => c.userId)));
  }

  if (filterType === "no_orders_days") {
    const days = audience?.days || 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Users with orders after cutoff
    const recentOrderUsers = await prisma.order.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { userId: true },
    });
    const recentUserIds = new Set(recentOrderUsers.map((o: any) => o.userId).filter(Boolean));

    const allCustomers = await prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true },
    });

    return allCustomers
      .map((u: any) => u.id)
      .filter((id: string) => !recentUserIds.has(id));
  }

  if (filterType === "ordered_days") {
    const days = audience?.days || 7;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { userId: true },
    });
    return Array.from(new Set(orders.map((o: any) => o.userId).filter(Boolean)));
  }

  if (filterType === "city") {
    const city = (audience?.city || "").trim().toLowerCase();
    if (!city) {
      return resolveAudienceUserIds({ type: "all" });
    }

    // Match addresses in UserAddress or Order delivery address
    const matchingAddresses = await prisma.userAddress.findMany({
      where: {
        city: { contains: city, mode: "insensitive" },
      },
      select: { userId: true },
    });

    return Array.from(new Set(matchingAddresses.map((a: any) => a.userId).filter(Boolean)));
  }

  return [];
}

/**
 * Returns audience device counts split by Android and iPhone for preview.
 */
export async function getAudiencePreview(
  audience: AudienceFilter | null | undefined,
  platformFilter: "all" | "android" | "ios" = "all"
): Promise<{
  totalUsers: number;
  totalTokens: number;
  androidCount: number;
  iosCount: number;
}> {
  const userIds = await resolveAudienceUserIds(audience);
  if (userIds.length === 0) {
    return { totalUsers: 0, totalTokens: 0, androidCount: 0, iosCount: 0 };
  }

  // Find registered device tokens for these users
  const tokens = await prisma.deviceToken.findMany({
    where: {
      userId: { in: userIds },
    },
    select: {
      userId: true,
      platform: true,
    },
  });

  const androidTokens = tokens.filter((t: any) => t.platform === "android");
  const iosTokens = tokens.filter((t: any) => t.platform === "ios");

  // Determine audience size according to platform filter
  let matchingUsers = new Set<string>();
  if (platformFilter === "android") {
    androidTokens.forEach((t: any) => matchingUsers.add(t.userId));
  } else if (platformFilter === "ios") {
    iosTokens.forEach((t: any) => matchingUsers.add(t.userId));
  } else {
    tokens.forEach((t: any) => matchingUsers.add(t.userId));
  }

  const effectiveTotalTokens =
    platformFilter === "android"
      ? androidTokens.length
      : platformFilter === "ios"
      ? iosTokens.length
      : tokens.length;

  return {
    totalUsers: matchingUsers.size,
    totalTokens: effectiveTotalTokens,
    androidCount: androidTokens.length,
    iosCount: iosTokens.length,
  };
}
