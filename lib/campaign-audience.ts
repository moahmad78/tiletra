import { prisma as rawPrisma } from "@/lib/prisma";
import { compareSemver } from "@/lib/semver";
import { resolveTokenAppType, isTokenActive } from "@/lib/push-notifications";

const prisma = rawPrisma as any;

export interface AudienceFilter {
  type:
    | "all"
    | "no_orders_days"
    | "ordered_days"
    | "cart_has_items"
    | "city"
    | "cart_product"
    | "wishlist_product"
    | "version_below"
    | "custom_segment";
  days?: number;
  city?: string;
  cartProductId?: string;
  wishlistProductId?: string;
  versionBelow?: string;
  appType?: "user" | "business" | "both";
  language?: "all" | "en" | "hi" | "kn";
}

/**
 * Resolves user IDs matching the campaign audience filter, including product-specific,
 * semver version-below, appType, and language segmentation.
 */
export async function resolveAudienceUserIds(
  audience: AudienceFilter | null | undefined
): Promise<string[]> {
  const filterType = audience?.type || "all";
  const now = new Date();
  let candidateUserIds: string[] = [];

  if (filterType === "all") {
    const roleFilter =
      audience?.appType === "business"
        ? { in: ["vendor", "rider", "admin", "cpo"] }
        : audience?.appType === "user"
        ? "customer"
        : undefined;

    const users = await prisma.user.findMany({
      where: roleFilter ? { role: roleFilter } : undefined,
      select: { id: true },
    });
    candidateUserIds = users.map((u: any) => u.id);
  } else if (filterType === "cart_has_items") {
    const carts = await prisma.cart.findMany({
      where: {
        items: { some: {} },
      },
      select: { userId: true },
    });
    candidateUserIds = Array.from(new Set(carts.map((c: any) => c.userId)));
  } else if (filterType === "cart_product") {
    const targetProductId = (audience?.cartProductId || "").trim();
    if (!targetProductId) {
      return resolveAudienceUserIds({ ...audience, type: "cart_has_items" });
    }
    const carts = await prisma.cart.findMany({
      where: {
        items: { some: { productId: targetProductId } },
      },
      select: { userId: true },
    });
    candidateUserIds = Array.from(new Set(carts.map((c: any) => c.userId)));
  } else if (filterType === "wishlist_product") {
    const targetProductId = (audience?.wishlistProductId || "").trim();
    if (!targetProductId) {
      candidateUserIds = [];
    } else {
      const items = await prisma.wishlistItem.findMany({
        where: { productId: targetProductId },
        select: { userId: true },
      });
      candidateUserIds = Array.from(new Set(items.map((w: any) => w.userId)));
    }
  } else if (filterType === "version_below") {
    const targetVersion = (audience?.versionBelow || "").trim();
    if (!targetVersion) {
      candidateUserIds = [];
    } else {
      const tokens = await prisma.deviceToken.findMany({
        where: { appVersion: { not: null } },
        select: { userId: true, appVersion: true },
      });
      const matchingUserIds = new Set<string>();
      for (const t of tokens) {
        if (t.appVersion && compareSemver(t.appVersion, targetVersion) < 0) {
          matchingUserIds.add(t.userId);
        }
      }
      candidateUserIds = Array.from(matchingUserIds);
    }
  } else if (filterType === "no_orders_days") {
    const days = audience?.days || 30;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const recentOrderUsers = await prisma.order.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { userId: true },
    });
    const recentUserIds = new Set(recentOrderUsers.map((o: any) => o.userId).filter(Boolean));

    const allCustomers = await prisma.user.findMany({
      where: { role: "customer" },
      select: { id: true },
    });

    candidateUserIds = allCustomers
      .map((u: any) => u.id)
      .filter((id: string) => !recentUserIds.has(id));
  } else if (filterType === "ordered_days") {
    const days = audience?.days || 7;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: cutoff } },
      select: { userId: true },
    });
    candidateUserIds = Array.from(new Set(orders.map((o: any) => o.userId).filter(Boolean)));
  } else if (filterType === "city") {
    const city = (audience?.city || "").trim().toLowerCase();
    if (!city) {
      return resolveAudienceUserIds({ ...audience, type: "all" });
    }

    const matchingAddresses = await prisma.userAddress.findMany({
      where: {
        city: { contains: city, mode: "insensitive" },
      },
      select: { userId: true },
    });

    candidateUserIds = Array.from(new Set(matchingAddresses.map((a: any) => a.userId).filter(Boolean)));
  }

  if (candidateUserIds.length === 0) return [];

  // Post-filter 1: Language Filter
  if (audience?.language && audience.language !== "all") {
    const langUsers = await prisma.user.findMany({
      where: {
        id: { in: candidateUserIds },
        language: audience.language,
      },
      select: { id: true },
    });
    const langSet = new Set(langUsers.map((u: any) => u.id));
    candidateUserIds = candidateUserIds.filter((id) => langSet.has(id));
  }

  // Post-filter 2: App Target Filter (user vs business)
  if (audience?.appType && audience.appType !== "both") {
    const targetType = audience.appType;
    const tokens = await prisma.deviceToken.findMany({
      where: { userId: { in: candidateUserIds } },
      select: { userId: true, role: true, appVersion: true, appType: true, lastSeenAt: true },
    });

    const validUserSet = new Set<string>();
    for (const t of tokens) {
      if (isTokenActive(t) && resolveTokenAppType(t) === targetType) {
        validUserSet.add(t.userId);
      }
    }
    candidateUserIds = candidateUserIds.filter((id) => validUserSet.has(id));
  }

  return candidateUserIds;
}

/**
 * Returns audience device counts split by Android and iPhone for preview and pre-flight confirmation.
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
      lastSeenAt: true,
    },
  });

  const activeTokens = tokens.filter((t: any) => isTokenActive(t));
  const androidTokens = activeTokens.filter((t: any) => (t.platform || "android").toLowerCase().includes("android"));
  const iosTokens = activeTokens.filter((t: any) => (t.platform || "").toLowerCase().includes("ios"));

  let matchingUsers = new Set<string>();
  if (platformFilter === "android") {
    androidTokens.forEach((t: any) => matchingUsers.add(t.userId));
  } else if (platformFilter === "ios") {
    iosTokens.forEach((t: any) => matchingUsers.add(t.userId));
  } else {
    activeTokens.forEach((t: any) => matchingUsers.add(t.userId));
  }

  const effectiveTotalTokens =
    platformFilter === "android"
      ? androidTokens.length
      : platformFilter === "ios"
      ? iosTokens.length
      : activeTokens.length;

  return {
    totalUsers: matchingUsers.size,
    totalTokens: effectiveTotalTokens,
    androidCount: androidTokens.length,
    iosCount: iosTokens.length,
  };
}
