import { NextRequest, NextResponse } from "next/server";
import { notify } from "@/lib/notifications/service";
import { NotificationCatalogType } from "@/lib/notifications/catalog";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Admin Manual Push Notification Endpoint (PRD v1 A12)
 *
 * Allows Super Admin and Ops to dispatch targeted or segment push notifications.
 * Targets:
 *  - "user": Send to a single user by userId
 *  - "vendor": Send to a single vendor by vendorId
 *  - "all_vendors": Broadcast to all approved active vendors
 *  - "all_users": Broadcast to all registered mobile app users
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      target = "user",
      userId,
      vendorId,
      type = "PROMO_OFFER",
      title,
      body: messageBody,
      deepLink,
      imageUrl,
      adminId,
    } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { success: false, error: "Title and Body are required." },
        { status: 400 }
      );
    }

    // 1. Single User Target
    if (target === "user") {
      if (!userId) {
        return NextResponse.json(
          { success: false, error: "userId is required for user target." },
          { status: 400 }
        );
      }

      const res = await notify({
        type: (type as NotificationCatalogType) || "PROMO_OFFER",
        userId,
        title,
        body: messageBody,
        deepLink,
        imageUrl,
        sentByAdminId: adminId || "admin",
        ignoreQuietHours: true, // Manual admin sends bypass quiet hours
      });

      return NextResponse.json({ success: res.success, result: res });
    }

    // 2. Single Vendor Target
    if (target === "vendor") {
      if (!vendorId) {
        return NextResponse.json(
          { success: false, error: "vendorId is required for vendor target." },
          { status: 400 }
        );
      }

      const res = await notify({
        type: (type as NotificationCatalogType) || "ACCOUNT_UPDATE",
        vendorId,
        title,
        body: messageBody,
        deepLink,
        imageUrl,
        sentByAdminId: adminId || "admin",
      });

      return NextResponse.json({ success: res.success, result: res });
    }

    // 3. Broadcast to all active approved vendors
    if (target === "all_vendors") {
      const activeVendors = await prisma.vendor.findMany({
        where: {
          status: "approved",
        },
        select: { id: true, ownerId: true },
      });

      let sentCount = 0;
      for (const v of activeVendors) {
        const res = await notify({
          type: (type as NotificationCatalogType) || "ACCOUNT_UPDATE",
          vendorId: v.id,
          title,
          body: messageBody,
          deepLink,
          imageUrl,
          sentByAdminId: adminId || "admin",
        }).catch(() => null);
        if (res?.success) sentCount++;
      }

      return NextResponse.json({
        success: true,
        target: "all_vendors",
        totalVendors: activeVendors.length,
        sentCount,
      });
    }

    // 4. Broadcast to all active users
    if (target === "all_users") {
      const activeUserTokens = await prisma.deviceToken.findMany({
        where: {
          isActive: true,
          appType: "user",
        },
        select: { userId: true },
        distinct: ["userId"],
        take: 500, // Safe batch limit
      });

      let sentCount = 0;
      for (const t of activeUserTokens) {
        if (!t.userId) continue;
        const res = await notify({
          type: (type as NotificationCatalogType) || "PROMO_OFFER",
          userId: t.userId,
          title,
          body: messageBody,
          deepLink,
          imageUrl,
          sentByAdminId: adminId || "admin",
        }).catch(() => null);
        if (res?.success) sentCount++;
      }

      return NextResponse.json({
        success: true,
        target: "all_users",
        targetedUsers: activeUserTokens.length,
        sentCount,
      });
    }

    return NextResponse.json(
      { success: false, error: `Invalid target: ${target}` },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("[Admin Send Push Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to send manual push" },
      { status: 500 }
    );
  }
}
