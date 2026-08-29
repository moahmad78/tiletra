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

    let fullAddress = "";

    if (
      order.deliveryAddress &&
      typeof order.deliveryAddress === "string" &&
      order.deliveryAddress.trim().length > 5 &&
      !order.deliveryAddress.toLowerCase().includes("site location") &&
      !order.deliveryAddress.toLowerCase().includes("site delivery")
    ) {
      fullAddress = order.deliveryAddress.trim();
    } else if (
      (order as any).customerAddress &&
      typeof (order as any).customerAddress === "string" &&
      (order as any).customerAddress.trim().length > 5 &&
      !(order as any).customerAddress.toLowerCase().includes("site location") &&
      !(order as any).customerAddress.toLowerCase().includes("site delivery")
    ) {
      fullAddress = (order as any).customerAddress.trim();
    } else {
      let addrObj: any = null;
      if (order.shippingAddress) {
        if (typeof order.shippingAddress === "string") {
          try {
            addrObj = JSON.parse(order.shippingAddress);
          } catch {
            const str = order.shippingAddress.trim();
            if (str.length > 3 && !str.toLowerCase().includes("site location") && !str.toLowerCase().includes("site delivery")) {
              fullAddress = str;
            }
          }
        } else if (typeof order.shippingAddress === "object") {
          addrObj = order.shippingAddress;
        }
      }

      if (!fullAddress && addrObj && typeof addrObj === "object") {
        if (addrObj.formattedAddress && typeof addrObj.formattedAddress === "string" && addrObj.formattedAddress.trim().length > 5) {
          fullAddress = addrObj.formattedAddress.trim();
        } else {
          const houseOrBuilding = [
            addrObj.houseNumber || addrObj.flatNumber || addrObj.houseNo || null,
            addrObj.buildingName || addrObj.building || null,
          ].filter(Boolean).join(", ");

          const streetAndArea = [
            addrObj.line1 || addrObj.street || addrObj.addressLine1 || addrObj.address || null,
            addrObj.line2 || addrObj.area || addrObj.addressLine2 || null,
          ].filter(Boolean).join(", ");

          const landmark = addrObj.landmark ? `Landmark: ${addrObj.landmark.replace(/^near\s+/i, "")}` : null;
          const city = addrObj.city || "Bengaluru";
          const statePin = [
            addrObj.state || "Karnataka",
            addrObj.pincode || addrObj.postalCode || addrObj.zipCode || "560068",
          ].filter(Boolean).join(" - ");

          fullAddress = [houseOrBuilding, streetAndArea, landmark, city, statePin].filter(Boolean).join(", ");
        }
      }

      if (!fullAddress || fullAddress.trim().length < 5 || fullAddress.toLowerCase().includes("site location") || fullAddress.toLowerCase().includes("site delivery")) {
        const houseOrBuilding = [
          order.deliveryHouseNumber || null,
          order.deliveryBuildingName || null,
        ].filter(Boolean).join(", ");

        const streetAndArea = [
          order.deliveryStreet && !order.deliveryStreet.toLowerCase().includes("site location") ? order.deliveryStreet : null,
          order.deliveryArea || null,
        ].filter(Boolean).join(", ");

        const landmark = order.deliveryLandmark ? `Landmark: ${order.deliveryLandmark.replace(/^near\s+/i, "")}` : null;
        const city = order.deliveryCity || "Bengaluru";
        const statePin = [
          order.deliveryState || "Karnataka",
          order.deliveryPostalCode || "560068",
        ].filter(Boolean).join(" - ");

        fullAddress = [houseOrBuilding, streetAndArea, landmark, city, statePin].filter(Boolean).join(", ");
      }
    }

    if (!fullAddress || fullAddress.trim().length < 3 || fullAddress.toLowerCase().includes("site location") || fullAddress.toLowerCase().includes("site delivery")) {
      fullAddress = "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068";
    }

    return mobileApiResponse({
      success: true,
      order: {
        ...order,
        deliveryAddress: fullAddress,
        vendorSplits,
      },
    });
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

    // Real-Time Socket Broadcast to customer and admin rooms
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: `order_${updated.id}`,
        event: "order-status-updated",
        data: {
          orderId: updated.id,
          orderStatus: updated.orderStatus,
          paymentStatus: updated.paymentStatus,
          estimatedDelivery: updated.estimatedDelivery,
          updatedAt: updated.updatedAt,
        },
      });
      await emitSocketEvent({
        room: "admin-room",
        event: "order-status-updated",
        data: {
          orderId: updated.id,
          orderStatus: updated.orderStatus,
          paymentStatus: updated.paymentStatus,
        },
      });
    } catch (socketErr) {
      console.error("Failed to emit order socket update from mobile admin:", socketErr);
    }

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
