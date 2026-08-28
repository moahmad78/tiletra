import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

/**
 * GET /api/mobile/admin/trash
 * Retrieves all soft-deleted items (Products & Orders) with deletion audit metadata.
 * Automatically permanently purges items older than 3 days (72 hours).
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const now = new Date();
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // 1. Auto-purge expired products (> 3 days in trash)
    const expiredProducts = await prisma.product.findMany({
      where: {
        status: "deleted",
        updatedAt: { lt: threeDaysAgo },
      },
      select: { id: true },
    });

    if (expiredProducts.length > 0) {
      const expIds = expiredProducts.map((p) => p.id);
      await prisma.product.deleteMany({
        where: { id: { in: expIds } },
      });
      await prisma.auditLog.deleteMany({
        where: {
          action: "TRASH_DELETE",
          entity: "Product",
          entityId: { in: expIds },
        },
      });
    }

    // 2. Auto-purge expired orders (> 3 days in trash)
    const expiredOrders = await prisma.order.findMany({
      where: {
        orderStatus: "deleted",
        updatedAt: { lt: threeDaysAgo },
      },
      select: { id: true },
    });

    if (expiredOrders.length > 0) {
      const expOrderIds = expiredOrders.map((o) => o.id);
      await prisma.order.deleteMany({
        where: { id: { in: expOrderIds } },
      });
      await prisma.auditLog.deleteMany({
        where: {
          action: "TRASH_DELETE",
          entity: "Order",
          entityId: { in: expOrderIds },
        },
      });
    }

    // 3. Fetch active soft-deleted products
    const deletedProducts = await prisma.product.findMany({
      where: { status: "deleted" },
      orderBy: { updatedAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
          },
        },
      },
    });

    // 4. Fetch active soft-deleted orders
    const deletedOrders = await prisma.order.findMany({
      where: { orderStatus: "deleted" },
      orderBy: { updatedAt: "desc" },
      include: {
        items: true,
      },
    });

    // 5. Fetch audit logs for deletion details
    const productIds = deletedProducts.map((p) => p.id);
    const orderIds = deletedOrders.map((o) => o.id);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        action: "TRASH_DELETE",
        OR: [
          { entity: "Product", entityId: { in: productIds } },
          { entity: "Order", entityId: { in: orderIds } },
        ],
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    const auditMap = new Map<string, any>();
    auditLogs.forEach((log) => {
      if (log.entityId) {
        auditMap.set(log.entityId, {
          deletedAt: log.createdAt,
          deletedByName: log.user?.name || (log.details as any)?.deletedByName || "System Admin",
          deletedByRole: log.user?.role || (log.details as any)?.deletedByRole || "ADMIN",
          deletedByPhone: log.user?.phone || (log.details as any)?.deletedByPhone || "",
          deletedByEmail: log.user?.email || (log.details as any)?.deletedByEmail || "",
          details: log.details,
        });
      }
    });

    // Format products response
    const formattedProducts = deletedProducts.map((p) => {
      const audit = auditMap.get(p.id) || {
        deletedAt: p.updatedAt,
        deletedByName: p.vendor?.businessName || "Admin",
        deletedByRole: p.vendor ? "VENDOR" : "ADMIN",
        deletedByPhone: p.vendor?.contactPhone || "",
      };

      const deletedTime = new Date(audit.deletedAt).getTime();
      const expiresAt = new Date(deletedTime + 3 * 24 * 60 * 60 * 1000);
      const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingDays = Math.floor(remainingHours / 24);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        categorySlug: p.categorySlug,
        categoryName: p.categoryName || p.categorySlug,
        pricePerSqft: p.pricePerSqft,
        images: p.images,
        vendorName: p.vendor?.businessName || "Direct / Admin",
        vendorId: p.vendorId,
        deletedAt: audit.deletedAt,
        deletedByName: audit.deletedByName,
        deletedByRole: audit.deletedByRole,
        deletedByPhone: audit.deletedByPhone,
        expiresAt: expiresAt.toISOString(),
        remainingHours,
        remainingDays,
        countdownText:
          remainingDays > 0
            ? `${remainingDays}d ${remainingHours % 24}h remaining`
            : `${remainingHours}h remaining`,
      };
    });

    // Format orders response
    const formattedOrders = deletedOrders.map((o) => {
      const audit = auditMap.get(o.id) || {
        deletedAt: o.updatedAt,
        deletedByName: "Admin",
        deletedByRole: "ADMIN",
        deletedByPhone: "",
      };

      const deletedTime = new Date(audit.deletedAt).getTime();
      const expiresAt = new Date(deletedTime + 3 * 24 * 60 * 60 * 1000);
      const remainingMs = Math.max(0, expiresAt.getTime() - now.getTime());
      const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
      const remainingDays = Math.floor(remainingHours / 24);

      return {
        id: o.id,
        customerName: o.customerName || "Customer",
        customerPhone: o.customerPhone || "",
        total: o.total,
        itemCount: o.items.length,
        items: o.items,
        deletedAt: audit.deletedAt,
        deletedByName: audit.deletedByName,
        deletedByRole: audit.deletedByRole,
        deletedByPhone: audit.deletedByPhone,
        expiresAt: expiresAt.toISOString(),
        remainingHours,
        remainingDays,
        countdownText:
          remainingDays > 0
            ? `${remainingDays}d ${remainingHours % 24}h remaining`
            : `${remainingHours}h remaining`,
      };
    });

    return mobileApiResponse({
      success: true,
      products: formattedProducts,
      orders: formattedOrders,
      counts: {
        products: formattedProducts.length,
        orders: formattedOrders.length,
        total: formattedProducts.length + formattedOrders.length,
      },
    });
  } catch (err: any) {
    console.error("Mobile admin trash fetch error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch trash items" },
      500
    );
  }
}

/**
 * DELETE /api/mobile/admin/trash
 * Permanently purges a specific item immediately from database.
 */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // "product" | "order"
    const id = searchParams.get("id");

    if (!id || !type) {
      return mobileApiResponse({ success: false, error: "ID and type are required" }, 400);
    }

    if (type === "product") {
      await prisma.product.delete({ where: { id } });
      await prisma.auditLog.deleteMany({
        where: { action: "TRASH_DELETE", entity: "Product", entityId: id },
      });
    } else if (type === "order") {
      await prisma.order.delete({ where: { id } });
      await prisma.auditLog.deleteMany({
        where: { action: "TRASH_DELETE", entity: "Order", entityId: id },
      });
    } else {
      return mobileApiResponse({ success: false, error: "Invalid entity type" }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: `${type === "product" ? "Product" : "Order"} permanently deleted.`,
    });
  } catch (err: any) {
    console.error("Mobile admin trash permanent delete error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to permanently delete item" },
      500
    );
  }
}
