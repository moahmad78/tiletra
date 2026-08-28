import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getCoupons, createCoupon } from "@/lib/actions/coupons";
import { prisma } from "@/lib/prisma";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toUpperCase().trim() || "";
    const status = searchParams.get("status") || "all";

    const allCoupons = await getCoupons();
    const now = new Date();

    const filtered = allCoupons.filter((c: any) => {
      const isExpired = c.validTill ? new Date(c.validTill) < now : false;
      const isLimitReached = c.usageLimit ? c.usedCount >= c.usageLimit : false;
      const isActive = c.isActive && !isExpired && !isLimitReached;

      const matchesStatus =
        status === "all" ||
        (status === "active" && isActive) ||
        (status === "expired" && (isExpired || isLimitReached)) ||
        (status === "disabled" && !c.isActive);

      const matchesSearch =
        !search ||
        c.code.toUpperCase().includes(search) ||
        c.discountType.toLowerCase().includes(search.toLowerCase());

      return matchesStatus && matchesSearch;
    });

    const activeCount = allCoupons.filter((c: any) => {
      const isExp = c.validTill ? new Date(c.validTill) < now : false;
      const isLim = c.usageLimit ? c.usedCount >= c.usageLimit : false;
      return c.isActive && !isExp && !isLim;
    }).length;

    const expiredCount = allCoupons.filter((c: any) => {
      const isExp = c.validTill ? new Date(c.validTill) < now : false;
      const isLim = c.usageLimit ? c.usedCount >= c.usageLimit : false;
      return isExp || isLim;
    }).length;

    const disabledCount = allCoupons.filter((c: any) => !c.isActive).length;

    return mobileApiResponse({
      success: true,
      coupons: filtered,
      total: allCoupons.length,
      counts: {
        all: allCoupons.length,
        active: activeCount,
        expired: expiredCount,
        disabled: disabledCount,
      },
    });
  } catch (error: any) {
    console.error("[Mobile Admin Coupons List Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch coupons" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const {
      code,
      discountType = "percentage",
      value,
      minOrderValue = 0,
      maxDiscountCap,
      usageLimit,
      validTill = "2026-12-31",
    } = body;

    if (!code || !code.trim()) {
      return mobileApiResponse({ success: false, error: "Coupon code is required" }, 400);
    }

    const cleanCode = code.toUpperCase().trim();
    const numValue = Number(value);

    if (isNaN(numValue) || numValue <= 0) {
      return mobileApiResponse({ success: false, error: "Valid discount value greater than 0 is required" }, 400);
    }

    if (discountType === "percentage" && (numValue <= 0 || numValue > 100)) {
      return mobileApiResponse({ success: false, error: "Percentage discount must be between 1% and 100%" }, 400);
    }

    // Check code uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return mobileApiResponse({ success: false, error: `Coupon code "${cleanCode}" already exists` }, 409);
    }

    const res = await createCoupon({
      code: cleanCode,
      discountType,
      value: numValue,
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscountCap: discountType === "percentage" && maxDiscountCap ? Number(maxDiscountCap) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      validTill,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      coupon: res.coupon,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Create Coupon Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to create coupon" },
      500
    );
  }
}
