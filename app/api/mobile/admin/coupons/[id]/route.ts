import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { updateCoupon, deleteCoupon } from "@/lib/actions/coupons";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({ where: { id } });

    if (!coupon) {
      return mobileApiResponse({ success: false, error: "Coupon not found" }, 404);
    }

    return mobileApiResponse({ success: true, coupon });
  } catch (error: any) {
    console.error("[Mobile Admin Coupon Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch coupon" },
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const updateData: any = {};

    if (body.code !== undefined) {
      const cleanCode = body.code.toUpperCase().trim();
      const existing = await prisma.coupon.findFirst({
        where: { code: cleanCode, NOT: { id } },
      });
      if (existing) {
        return mobileApiResponse({ success: false, error: `Coupon code "${cleanCode}" already exists` }, 409);
      }
      updateData.code = cleanCode;
    }

    if (body.discountType !== undefined) {
      updateData.discountType = body.discountType;
    }

    if (body.value !== undefined) {
      const val = Number(body.value);
      if (isNaN(val) || val <= 0) {
        return mobileApiResponse({ success: false, error: "Discount value must be greater than 0" }, 400);
      }
      updateData.value = val;
    }

    if (body.minOrderValue !== undefined) {
      updateData.minOrderValue = Number(body.minOrderValue) || 0;
    }

    if (body.maxDiscountCap !== undefined) {
      updateData.maxDiscountCap = body.maxDiscountCap ? Number(body.maxDiscountCap) : null;
    }

    if (body.usageLimit !== undefined) {
      updateData.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
    }

    if (body.validTill !== undefined) {
      updateData.validTill = body.validTill;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const res = await updateCoupon(id, updateData);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Coupon updated successfully!",
      coupon: res.coupon,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Coupon Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update coupon" },
      500
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const res = await deleteCoupon(id);

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Coupon deleted successfully!",
    });
  } catch (error: any) {
    console.error("[Mobile Admin Coupon Delete Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to delete coupon" },
      500
    );
  }
}
