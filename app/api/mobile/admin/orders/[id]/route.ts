import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return mobileApiResponse({ success: false, error: "Order not found" }, 404);
    }

    const vendorSplits = await prisma.vendorOrderSplit.findMany({
      where: { orderId: id },
      include: {
        vendor: true,
      },
    });

    return mobileApiResponse({ success: true, order: { ...order, vendorSplits } });
  } catch (err: any) {
    console.error("Mobile admin order detail error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch order" },
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
    const { orderStatus, paymentStatus, estimatedDelivery } = body;

    const data: any = {};
    if (orderStatus !== undefined) data.orderStatus = orderStatus;
    if (paymentStatus !== undefined) data.paymentStatus = paymentStatus;
    if (estimatedDelivery !== undefined) data.estimatedDelivery = estimatedDelivery;

    const updated = await prisma.order.update({
      where: { id },
      data,
    });

    return mobileApiResponse({
      success: true,
      message: "Order updated successfully",
      order: updated,
    });
  } catch (err: any) {
    console.error("Mobile admin order update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update order" },
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
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return mobileApiResponse({ success: false, error: "Order not found" }, 404);
    }

    // Soft-delete order
    await prisma.order.update({
      where: { id },
      data: {
        orderStatus: "deleted",
        updatedAt: new Date(),
      },
    });

    // Create Audit Log for Trash retention & auto 3-day countdown
    await prisma.auditLog.create({
      data: {
        action: "TRASH_DELETE",
        entity: "Order",
        entityId: id,
        userId: auth.user.id,
        details: {
          deletedByName: auth.user.name || "Admin",
          deletedByRole: auth.user.role || "ADMIN",
          deletedByEmail: auth.user.email || "",
          deletedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          orderSnapshot: {
            customerName: order.customerName,
            customerPhone: order.customerPhone,
            total: order.total,
            itemsCount: order.items.length,
          },
        },
      },
    });

    return mobileApiResponse({
      success: true,
      message: `Order #${order.id.slice(-6).toUpperCase()} moved to Trash. You can restore it within 3 days.`,
    });
  } catch (err: any) {
    console.error("Mobile admin order delete error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to move order to trash" },
      500
    );
  }
}
