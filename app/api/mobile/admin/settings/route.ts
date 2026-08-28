import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getStoreSettings, updateStoreSettings } from "@/lib/actions/settings";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const settings = await getStoreSettings();

    return mobileApiResponse({
      success: true,
      settings,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Settings Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch store settings" },
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const updateData: any = {};

    if (body.storeName !== undefined) updateData.storeName = body.storeName.trim();
    if (body.gstNumber !== undefined) updateData.gstNumber = body.gstNumber.trim().toUpperCase();
    if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone.trim();
    if (body.whatsappNumber !== undefined) updateData.whatsappNumber = body.whatsappNumber.trim();
    if (body.email !== undefined) updateData.email = body.email.trim();
    if (body.address !== undefined) updateData.address = body.address.trim();

    if (body.freeDeliveryThreshold !== undefined) {
      const val = Number(body.freeDeliveryThreshold);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid free delivery threshold" }, 400);
      updateData.freeDeliveryThreshold = val;
    }

    if (body.standardDeliveryFee !== undefined) {
      const val = Number(body.standardDeliveryFee);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid standard delivery fee" }, 400);
      updateData.standardDeliveryFee = val;
    }

    if (body.deliveryFeeEnabled !== undefined) {
      updateData.deliveryFeeEnabled = Boolean(body.deliveryFeeEnabled);
    }

    if (body.bikeDeliveryRate !== undefined) {
      const val = Number(body.bikeDeliveryRate);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid bike delivery rate" }, 400);
      updateData.bikeDeliveryRate = val;
    }

    if (body.fourWheelerDeliveryRate !== undefined) {
      const val = Number(body.fourWheelerDeliveryRate);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid 4-wheeler delivery rate" }, 400);
      updateData.fourWheelerDeliveryRate = val;
    }

    if (body.weightThresholdKg !== undefined) {
      const val = Number(body.weightThresholdKg);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid weight threshold" }, 400);
      updateData.weightThresholdKg = val;
    }

    if (body.lowStockThreshold !== undefined) {
      const val = Number(body.lowStockThreshold);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid low stock threshold" }, 400);
      updateData.lowStockThreshold = val;
    }

    if (body.codEnabled !== undefined) {
      updateData.codEnabled = Boolean(body.codEnabled);
    }

    if (body.codMaxLimit !== undefined) {
      const val = Number(body.codMaxLimit);
      if (isNaN(val) || val < 0) return mobileApiResponse({ success: false, error: "Invalid COD max limit" }, 400);
      updateData.codMaxLimit = val;
    }

    if (body.codBlockedPincodes !== undefined) {
      if (Array.isArray(body.codBlockedPincodes)) {
        updateData.codBlockedPincodes = body.codBlockedPincodes.map((p: any) => String(p).trim()).filter(Boolean);
      } else if (typeof body.codBlockedPincodes === "string") {
        updateData.codBlockedPincodes = body.codBlockedPincodes.split(",").map((p: string) => p.trim()).filter(Boolean);
      }
    }

    const res = await updateStoreSettings(updateData);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Global store settings updated successfully!",
      settings: res.settings,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Settings Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update store settings" },
      500
    );
  }
}
