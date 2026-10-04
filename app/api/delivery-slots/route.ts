import { NextRequest, NextResponse } from "next/server";
import { getStoreDeliverySlotsConfig } from "@/lib/actions/settings";
import { getVendorDeliverySlotsConfig } from "@/lib/actions/vendor";
import { DEFAULT_DELIVERY_SLOTS, MASTER_DELIVERY_SLOTS } from "@/lib/delivery-slots";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    let result;
    if (vendorId) {
      result = await getVendorDeliverySlotsConfig(vendorId);
    } else {
      const storeConfig = await getStoreDeliverySlotsConfig();
      result = {
        activeSlots: storeConfig.activeSlots,
        isCustom: false,
        defaultSlots: storeConfig.defaultSlots,
        masterSlots: storeConfig.masterSlots,
      };
    }

    return NextResponse.json({
      success: true,
      slots: result.activeSlots,
      isCustom: result.isCustom,
      defaultSlots: result.defaultSlots,
      masterSlots: result.masterSlots,
    });
  } catch (error: any) {
    console.error("GET /api/delivery-slots error:", error);
    return NextResponse.json({
      success: true,
      slots: DEFAULT_DELIVERY_SLOTS,
      isCustom: false,
      defaultSlots: DEFAULT_DELIVERY_SLOTS,
      masterSlots: MASTER_DELIVERY_SLOTS,
    });
  }
}
