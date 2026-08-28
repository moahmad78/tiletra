import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { notifyVendorPush, notifyAdminPush } from "@/lib/push-notifications";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json();
    const { vendorId, productId, productName, stockBoxes, customMessage } = body;

    if (!vendorId) {
      return mobileApiResponse({ success: false, error: "vendorId is required" }, 400);
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { owner: true },
    });

    if (!vendor) {
      return mobileApiResponse({ success: false, error: "Vendor not found" }, 404);
    }

    const title = "⚠️ Urgent Inventory Restock Notice";
    const message =
      customMessage ||
      `Restock Alert: Your product "${productName || "Catalog Item"}" has only ${stockBoxes ?? 0} units left in stock. Please restock immediately to avoid losing customer orders.`;

    // 1. Create In-App Notification record for Vendor
    if (vendor.ownerId) {
      await prisma.notification.create({
        data: {
          userId: vendor.ownerId,
          type: "system",
          title,
          message,
          link: productId ? `/product/${productId}` : undefined,
        },
      });
    }

    // 2. Send Push Notification to Vendor's phone
    await notifyVendorPush({
      vendorId,
      title,
      body: message,
      data: { productId, stockBoxes, screen: "/(vendor)/inventory" },
    });

    // 3. Confirm to Admin via Push Notification
    await notifyAdminPush({
      title: "✅ Vendor Notice Sent",
      body: `Restock notice dispatched to ${vendor.businessName} for ${productName || "Item"}.`,
      data: { screen: "/(admin)/dashboard" },
    });

    return mobileApiResponse({
      success: true,
      message: `Restock notice sent successfully to ${vendor.businessName}!`,
    });
  } catch (err: any) {
    console.error("Admin notify vendor error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to notify vendor" },
      500
    );
  }
}
