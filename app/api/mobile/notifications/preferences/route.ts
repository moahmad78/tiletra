import { NextRequest } from "next/server";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { prisma as rawPrisma } from "@/lib/prisma";
import { cancelCartReminder } from "@/lib/cart-reminder-runner";

const prisma = rawPrisma as any;

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    const userId = user?.id || req.nextUrl.searchParams.get("userId");

    if (!userId) {
      // Default preferences for guest/logged-out
      return mobileApiResponse({
        success: true,
        preferences: {
          offersEnabled: true,
          cartRemindersEnabled: true,
          orderUpdates: true,
        },
      });
    }

    const pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    return mobileApiResponse({
      success: true,
      preferences: {
        offersEnabled: pref?.offersEnabled ?? true,
        cartRemindersEnabled: pref?.cartRemindersEnabled ?? true,
        orderUpdates: true, // Always true and cannot be switched off (Rule R-1)
      },
    });
  } catch (error: any) {
    console.error("[Notification Preferences] GET error:", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to load preferences" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    const body = await req.json().catch(() => ({}));
    const userId = user?.id || body.userId;

    if (!userId) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    const offersEnabled = body.offersEnabled !== undefined ? Boolean(body.offersEnabled) : true;
    const cartRemindersEnabled =
      body.cartRemindersEnabled !== undefined ? Boolean(body.cartRemindersEnabled) : true;

    const pref = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        offersEnabled,
        cartRemindersEnabled,
      },
      create: {
        userId,
        offersEnabled,
        cartRemindersEnabled,
      },
    });

    // Rule R-6: Stop cart reminder ladder at once if user switches Cart reminders off
    if (!cartRemindersEnabled) {
      await cancelCartReminder(userId);
    }

    return mobileApiResponse({
      success: true,
      preferences: {
        offersEnabled: pref.offersEnabled,
        cartRemindersEnabled: pref.cartRemindersEnabled,
        orderUpdates: true,
      },
    });
  } catch (error: any) {
    console.error("[Notification Preferences] POST/PUT error:", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to save preferences" },
      500
    );
  }
}
