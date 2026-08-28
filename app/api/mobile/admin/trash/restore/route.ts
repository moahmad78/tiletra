import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * POST /api/mobile/admin/trash/restore
 * Restores a soft-deleted Product or Order back to active marketplace state.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json();
    const { type, id } = body; // type: "product" | "order"

    if (!id || !type) {
      return mobileApiResponse({ success: false, error: "ID and type are required" }, 400);
    }

    if (type === "product") {
      const product = await prisma.product.findUnique({ where: { id } });
      if (!product) {
        return mobileApiResponse({ success: false, error: "Product not found in database" }, 404);
      }

      await prisma.product.update({
        where: { id },
        data: {
          status: "active",
          updatedAt: new Date(),
        },
      });

      // Clear trash audit log
      await prisma.auditLog.deleteMany({
        where: { action: "TRASH_DELETE", entity: "Product", entityId: id },
      });

      return mobileApiResponse({
        success: true,
        message: `Product "${product.name}" successfully restored to active catalog!`,
      });
    } else if (type === "order") {
      const order = await prisma.order.findUnique({ where: { id } });
      if (!order) {
        return mobileApiResponse({ success: false, error: "Order not found in database" }, 404);
      }

      await prisma.order.update({
        where: { id },
        data: {
          orderStatus: "confirmed",
          updatedAt: new Date(),
        },
      });

      // Clear trash audit log
      await prisma.auditLog.deleteMany({
        where: { action: "TRASH_DELETE", entity: "Order", entityId: id },
      });

      return mobileApiResponse({
        success: true,
        message: `Order #${order.id.slice(-6).toUpperCase()} successfully restored!`,
      });
    } else {
      return mobileApiResponse({ success: false, error: "Invalid entity type" }, 400);
    }
  } catch (err: any) {
    console.error("Mobile admin trash restore error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to restore item" },
      500
    );
  }
}
