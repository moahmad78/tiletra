"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export async function getCoupons() {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return coupons;
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
}

export async function validateCoupon(code: string, orderTotal: number) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!coupon) {
      return { valid: false, error: "Invalid coupon code" };
    }

    if (!coupon.isActive) {
      return { valid: false, error: "This coupon is currently inactive" };
    }

    if (coupon.validTill) {
      const expiry = new Date(coupon.validTill);
      if (new Date() > expiry) {
        return { valid: false, error: "This coupon has expired" };
      }
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }

    if (coupon.minOrderValue && orderTotal < coupon.minOrderValue) {
      return {
        valid: false,
        error: `Minimum order amount of ₹${coupon.minOrderValue.toLocaleString("en-IN")} required`,
      };
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((orderTotal * coupon.value) / 100);
      if (coupon.maxDiscountCap && discount > coupon.maxDiscountCap) {
        discount = coupon.maxDiscountCap;
      }
    } else {
      discount = coupon.value;
    }

    return {
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        value: coupon.value,
        discountAmount: discount,
      },
    };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Failed to validate coupon" };
  }
}

export async function createCoupon(data: {
  code: string;
  discountType: string;
  value: number;
  minOrderValue?: number;
  maxDiscountCap?: number;
  usageLimit?: number;
  validTill?: string;
}) {
  try {
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase().trim(),
        discountType: data.discountType,
        value: data.value,
        minOrderValue: data.minOrderValue || 0,
        maxDiscountCap: data.maxDiscountCap ?? undefined,
        usageLimit: data.usageLimit ?? undefined,
        validTill: data.validTill ?? undefined,
        isActive: true,
      },
    });

    safeRevalidate("/admin/coupons");
    safeRevalidate("/checkout");
    safeRevalidate("/cart");
    return { success: true, coupon };
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    return { success: false, error: error?.message || "Failed to create coupon" };
  }
}

export async function updateCoupon(id: string, data: any) {
  try {
    const coupon = await prisma.coupon.update({
      where: { id },
      data,
    });

    safeRevalidate("/admin/coupons");
    safeRevalidate("/checkout");
    safeRevalidate("/cart");
    return { success: true, coupon };
  } catch (error: any) {
    console.error("Error updating coupon:", error);
    return { success: false, error: error?.message || "Failed to update coupon" };
  }
}

export async function deleteCoupon(id: string) {
  try {
    await prisma.coupon.delete({ where: { id } });

    safeRevalidate("/admin/coupons");
    safeRevalidate("/checkout");
    safeRevalidate("/cart");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: error?.message || "Failed to delete coupon" };
  }
}
