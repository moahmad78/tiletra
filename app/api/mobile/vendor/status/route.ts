import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/vendor/status
 * Fetches vendor online status, autoAcceptOrders flag, and last heartbeat.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }
    const { vendor } = auth;
    return mobileApiResponse({
      success: true,
      vendor: {
        id: vendor.id,
        isOnline: vendor.isOnline,
        autoAcceptOrders: vendor.autoAcceptOrders,
        lastHeartbeatAt: vendor.lastHeartbeatAt,
        operatingHours: vendor.operatingHours,
      },
    });
  } catch (err: any) {
    return mobileApiResponse({ success: false, error: err.message }, 500);
  }
}

/**
 * PATCH /api/mobile/vendor/status
 * Updates isOnline, autoAcceptOrders, or operatingHours.
 */
export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const body = await req.json().catch(() => ({}));
    const updateData: any = {};

    if (typeof body.isOnline === "boolean") {
      updateData.isOnline = body.isOnline;
      if (body.isOnline) {
        updateData.lastHeartbeatAt = new Date();
      }
    }

    if (typeof body.autoAcceptOrders === "boolean") {
      updateData.autoAcceptOrders = body.autoAcceptOrders;
    }

    if (body.operatingHours !== undefined) {
      updateData.operatingHours = body.operatingHours;
    }

    const updated = await prisma.vendor.update({
      where: { id: auth.vendor.id },
      data: updateData,
      select: {
        id: true,
        isOnline: true,
        autoAcceptOrders: true,
        lastHeartbeatAt: true,
        operatingHours: true,
      },
    });

    return mobileApiResponse({
      success: true,
      vendor: updated,
      message: "Vendor status updated successfully",
    });
  } catch (err: any) {
    return mobileApiResponse({ success: false, error: err.message }, 500);
  }
}
