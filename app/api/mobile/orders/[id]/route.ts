import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedMobileUser(req);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                unitOfSale: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return mobileApiResponse({ success: false, error: "Order not found" }, 404);
    }

    const vendorSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            contactPhone: true,
          },
        },
      },
    });

    // Strict IDOR Security Check: Must be authenticated and either own the order or be admin
    if (!user) {
      return mobileApiResponse({ success: false, error: "Authentication required to view order details" }, 401);
    }

    const cleanUserPhone = (user.phone || "").replace(/\D/g, "").slice(-10);
    const cleanOrderPhone = (order.customerPhone || order.deliveryPhone || "").replace(/\D/g, "").slice(-10);
    const isOwner =
      order.userId === user.id ||
      (cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone) ||
      Boolean(user.email && order.customerEmail && user.email.toLowerCase().trim() === order.customerEmail.toLowerCase().trim());

    const isAdmin = user.role === "admin" || user.role === "superadmin";

    if (!isOwner && !isAdmin) {
      return mobileApiResponse({ success: false, error: "Forbidden: You do not have access to this order" }, 403);
    }

    return mobileApiResponse({
      success: true,
      order: {
        ...order,
        vendorSplits,
      },
    });
  } catch (err: any) {
    console.error("Mobile order details error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch order details" },
      500
    );
  }
}
