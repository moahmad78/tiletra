import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { hashPassword } from "@/lib/password-security";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        products: {
          include: { variants: true },
          orderBy: { createdAt: "desc" },
        },
        splits: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return mobileApiResponse({ success: false, error: "Vendor not found" }, 404);
    }

    // Compute today's sales
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todaySplits = vendor.splits.filter(
      (s) => new Date(s.createdAt) >= startOfToday && s.fulfillmentStatus !== "cancelled"
    );
    const todaySales = todaySplits.reduce((acc, s) => acc + (s.subtotal || 0), 0);

    const totalSales = vendor.splits
      .filter((s) => s.fulfillmentStatus !== "cancelled")
      .reduce((acc, s) => acc + (s.subtotal || 0), 0);

    const totalPayoutSettled = vendor.splits
      .filter((s) => Boolean(s.payoutId))
      .reduce((acc, s) => acc + (s.vendorPayoutAmount || 0), 0);

    const pendingPayout = vendor.splits
      .filter((s) => !s.payoutId)
      .reduce((acc, s) => acc + (s.vendorPayoutAmount || 0), 0);

    // Fetch parent orders for splits
    const splitOrderIds = vendor.splits.map((s) => s.orderId);
    const orders = await prisma.order.findMany({
      where: { id: { in: splitOrderIds } },
      include: { items: true },
    });
    const orderMap = new Map(orders.map((o) => [o.id, o]));

    const enrichedSplits = vendor.splits.map((s) => ({
      ...s,
      parentOrder: orderMap.get(s.orderId) || null,
    }));

    const enrichedProducts = vendor.products.map((p) => {
      const v = p.variants?.[0];
      return {
        ...p,
        pricePerBox: v?.pricePerBox || 0,
        pricePerSqft: p.pricePerSqft || v?.pricePerSqft || 0,
        stockBoxes: v?.stockBoxes ?? (p.inStock ? 50 : 0),
      };
    });

    return mobileApiResponse({
      success: true,
      vendor: {
        ...vendor,
        loginMethod: vendor.loginMethod || "otp",
        hasPassword: Boolean(vendor.passwordHash),
        products: enrichedProducts,
        splits: enrichedSplits,
      },
      stats: {
        todaySales,
        totalSales,
        totalPayoutSettled,
        pendingPayout,
        totalOrdersCount: vendor.splits.length,
        totalProductsCount: vendor.products.length,
        activeProductsCount: vendor.products.filter((p) => p.status === "active").length,
        lowStockProductsCount: enrichedProducts.filter((p) => (p.stockBoxes ?? 0) < 10).length,
      },
    });
  } catch (err: any) {
    console.error("Mobile admin vendor detail error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendor" },
      500
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json();
    const {
      businessName,
      contactEmail,
      contactPhone,
      category,
      businessAddress,
      gstNumber,
      status,
      commissionRate,
      verified,
      deliveryMethod,
      autoPublishEnabled,
      ownerId,
      loginMethod,
      password,
    } = body;

    const data: any = {};
    if (businessName !== undefined) data.businessName = String(businessName).trim();
    if (contactEmail !== undefined) data.contactEmail = String(contactEmail).trim().toLowerCase();
    if (contactPhone !== undefined) data.contactPhone = String(contactPhone).replace(/\D/g, "");
    if (category !== undefined) data.category = String(category).trim();
    if (businessAddress !== undefined) data.businessAddress = String(businessAddress).trim();
    if (gstNumber !== undefined) data.gstNumber = String(gstNumber).trim();
    if (status !== undefined) data.status = status;
    if (commissionRate !== undefined) data.commissionRate = Number(commissionRate);
    if (verified !== undefined) data.kycStatus = verified ? "verified" : "pending";
    if (deliveryMethod !== undefined) data.deliveryMethod = deliveryMethod;
    if (autoPublishEnabled !== undefined) data.autoPublishEnabled = Boolean(autoPublishEnabled);
    if (ownerId !== undefined) data.ownerId = ownerId;
    if (body.logo !== undefined) data.logo = body.logo ? String(body.logo).trim() : null;
    if (body.shopPhotoUrl !== undefined) data.shopPhotoUrl = body.shopPhotoUrl ? String(body.shopPhotoUrl).trim() : null;

    let hashedPassword: string | null | undefined = undefined;

    if (loginMethod === "password") {
      data.loginMethod = "password";
      if (password && typeof password === "string" && password.trim().length >= 6) {
        hashedPassword = hashPassword(password.trim());
        data.passwordHash = hashedPassword;
      }
    } else if (loginMethod === "otp") {
      data.loginMethod = "otp";
      data.passwordHash = null;
      hashedPassword = null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.vendor.update({
        where: { id },
        data,
      });

      if (hashedPassword !== undefined && v.ownerId) {
        await tx.user.update({
          where: { id: v.ownerId },
          data: {
            passwordHash: hashedPassword,
            mustChangePassword: false,
          },
        }).catch(() => {});
      }

      return v;
    });

    return mobileApiResponse({
      success: true,
      message: `Vendor updated successfully`,
      vendor: updated,
    });
  } catch (err: any) {
    console.error("Mobile admin vendor update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update vendor" },
      500
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    await prisma.vendor.delete({
      where: { id },
    });

    return mobileApiResponse({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (err: any) {
    console.error("Mobile admin vendor delete error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to delete vendor" },
      500
    );
  }
}
