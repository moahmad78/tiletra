import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getAuthenticatedVendor } from "../dashboard/route";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * POST /api/mobile/vendor/heartbeat
 * Updates vendor lastHeartbeatAt timestamp.
 * Throttled to at most once per 20 seconds per vendor.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedVendor(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status as any);
    }

    const { vendor } = auth;
    const now = new Date();

    // Check throttle: if lastHeartbeatAt is under 20 seconds old, return success without DB write
    if (vendor.lastHeartbeatAt) {
      const diffMs = now.getTime() - new Date(vendor.lastHeartbeatAt).getTime();
      if (diffMs < 20 * 1000) {
        return mobileApiResponse({
          success: true,
          throttled: true,
          lastHeartbeatAt: vendor.lastHeartbeatAt,
        });
      }
    }

    const updated = await prisma.vendor.update({
      where: { id: vendor.id },
      data: {
        lastHeartbeatAt: now,
      },
      select: {
        id: true,
        isOnline: true,
        lastHeartbeatAt: true,
      },
    });

    return mobileApiResponse({
      success: true,
      vendor: updated,
    });
  } catch (err: any) {
    console.error("Vendor heartbeat error:", err);
    return mobileApiResponse({ success: false, error: err.message || "Heartbeat failed" }, 500);
  }
}
