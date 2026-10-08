"use server";

import { prisma } from "@/lib/prisma";
import { requireCpoSession } from "@/lib/cpo/auth";
import { formatProduct, safeRevalidate } from "@/lib/formatters";
import { createVendorManually } from "@/lib/actions/admin-vendor";
import { evaluateCpoAction } from "@/lib/config/cpo-permissions";

/**
 * CPO Dashboard Overview Statistics
 */
export async function getCpoDashboardStats() {
  await requireCpoSession("dashboard:view");

  try {
    const [
      totalVendors,
      activeVendors,
      pausedVendors,
      suspendedVendors,
      totalProducts,
      activeProducts,
      pendingProducts,
      lowStockVariants,
      categoriesCount,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "approved" } }),
      prisma.vendor.count({ where: { status: "paused" } }),
      prisma.vendor.count({ where: { status: "suspended" } }),
      prisma.product.count({ where: { vendorId: { not: null } } }),
      prisma.product.count({ where: { vendorId: { not: null }, status: "active" } }),
      prisma.product.count({ where: { approvalStatus: "pending" } }),
      prisma.productVariant.count({ where: { stockBoxes: { lt: 15 } } }),
      prisma.category.count(),
    ]);

    return {
      totalVendors,
      activeVendors,
      pausedVendors,
      suspendedVendors,
      totalProducts,
      activeProducts,
      pendingProducts,
      lowStockVariants,
      categoriesCount,
    };
  } catch (error) {
    console.error("getCpoDashboardStats error:", error);
    return {
      totalVendors: 0,
      activeVendors: 0,
      pausedVendors: 0,
      suspendedVendors: 0,
      totalProducts: 0,
      activeProducts: 0,
      pendingProducts: 0,
      lowStockVariants: 0,
      categoriesCount: 0,
    };
  }
}

/**
 * Get all vendors for CPO with search, status and category filtering
 */
export async function getCpoVendors(options?: {
  search?: string;
  status?: string;
  category?: string;
}) {
  await requireCpoSession("vendor:list");

  try {
    const where: any = {};

    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }

    if (options?.category && options.category !== "all") {
      where.category = options.category;
    }

    if (options?.search) {
      const term = options.search.trim();
      where.OR = [
        { businessName: { contains: term, mode: "insensitive" } },
        { contactEmail: { contains: term, mode: "insensitive" } },
        { contactPhone: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { gstNumber: { contains: term, mode: "insensitive" } },
        { id: { contains: term, mode: "insensitive" } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            products: true,
            splits: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return vendors;
  } catch (error) {
    console.error("getCpoVendors error:", error);
    return [];
  }
}

/**
 * Update Vendor Settings as CPO (category, commission, status, internal notes).
 * High-risk financial operations (bank details, passwords) are strictly blocked per CPO matrix.
 */
export async function updateCpoVendorSettings(params: {
  vendorId: string;
  category?: string;
  commissionRate?: number;
  status?: string; // approved | paused | suspended
  internalNotes?: string;
  rejectionReason?: string;
}) {
  const cpo = await requireCpoSession("vendor:edit_settings");

  try {
    const existing = await prisma.vendor.findUnique({
      where: { id: params.vendorId },
    });

    if (!existing) {
      return { success: false, error: "Vendor not found." };
    }

    const data: any = {};
    if (params.category !== undefined) data.category = params.category;
    if (params.commissionRate !== undefined) data.commissionRate = Number(params.commissionRate);
    if (params.status !== undefined) data.status = params.status;
    if (params.internalNotes !== undefined) data.internalNotes = params.internalNotes;
    if (params.rejectionReason !== undefined) data.rejectionReason = params.rejectionReason;

    const updated = await prisma.vendor.update({
      where: { id: params.vendorId },
      data,
    });

    // Write audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        vendorId: existing.id,
        action: "CPO_VENDOR_SETTINGS_UPDATED",
        entity: "Vendor",
        entityId: existing.id,
        actorRole: "CPO",
        before: {
          category: existing.category,
          commissionRate: existing.commissionRate,
          status: existing.status,
          internalNotes: existing.internalNotes,
        },
        after: {
          category: updated.category,
          commissionRate: updated.commissionRate,
          status: updated.status,
          internalNotes: updated.internalNotes,
        },
      },
    });

    safeRevalidate("/cpo/vendors");
    safeRevalidate("/vendor");

    return {
      success: true,
      vendor: updated,
      message: `Settings updated for vendor "${updated.businessName}".`,
    };
  } catch (error: any) {
    console.error("updateCpoVendorSettings error:", error);
    return { success: false, error: error?.message || "Failed to update vendor settings." };
  }
}

/**
 * Add a new vendor through CPO (reusing standard manual vendor creation)
 */
export async function createCpoVendor(data: {
  businessName: string;
  ownerName: string;
  contactEmail: string;
  contactPhone: string;
  category?: string;
  businessAddress?: string;
  gstNumber?: string;
  description?: string;
  commissionRate?: number;
  customPassword?: string;
}) {
  const cpo = await requireCpoSession("vendor:create");
  const res = await createVendorManually(data);

  if (res.success && res.vendor) {
    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        vendorId: res.vendor.id,
        action: "CPO_VENDOR_CREATED",
        entity: "Vendor",
        entityId: res.vendor.id,
        actorRole: "CPO",
        after: {
          businessName: res.vendor.businessName,
          category: res.vendor.category,
          contactEmail: res.vendor.contactEmail,
        },
      },
    });
  }

  safeRevalidate("/cpo/vendors");
  return res;
}

/**
 * Get Cross-Vendor Catalog for CPO
 */
export async function getCpoCatalog(options?: {
  search?: string;
  vendorId?: string;
  categorySlug?: string;
  status?: string;
  imageFilter?: "all" | "missing" | "with_image";
  page?: number;
  limit?: number;
}) {
  await requireCpoSession("catalog:view");

  try {
    const where: any = {};

    if (options?.vendorId && options.vendorId !== "all") {
      where.vendorId = options.vendorId;
    }

    if (options?.categorySlug && options.categorySlug !== "all") {
      where.categorySlug = options.categorySlug;
    }

    if (options?.status && options.status !== "all") {
      if (options.status === "recycle_bin") {
        where.status = { in: ["archived", "discontinued"] };
      } else {
        where.status = options.status;
      }
    } else {
      where.status = { notIn: ["archived", "discontinued"] };
    }

    if (options?.search) {
      const term = options.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { brand: { contains: term, mode: "insensitive" } },
        { sku: { contains: term, mode: "insensitive" } },
        { categoryName: { contains: term, mode: "insensitive" } },
      ];
    }

    if (options?.imageFilter === "missing") {
      const missingCondition = {
        OR: [
          { images: { isEmpty: true } },
          { images: { has: "/placeholders/product.svg" } },
        ],
      };
      if (where.OR) {
        where.AND = [{ OR: where.OR }, missingCondition];
        delete where.OR;
      } else {
        where.OR = missingCondition.OR;
      }
    } else if (options?.imageFilter === "with_image") {
      where.AND = [
        ...(where.AND || []),
        { images: { isEmpty: false } },
        { NOT: { images: { has: "/placeholders/product.svg" } } },
      ];
    }

    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, options?.limit || 50);
    const skip = (page - 1) * limit;

    const recycleBinWhere: any = {
      status: { in: ["archived", "discontinued"] },
    };
    if (options?.vendorId && options.vendorId !== "all") {
      recycleBinWhere.vendorId = options.vendorId;
    }

    const [products, total, recycleBinCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          variants: true,
          attributes: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              status: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
      prisma.product.count({ where: recycleBinWhere }),
    ]);

    return {
      products: products.map(formatProduct),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      recycleBinCount,
    };
  } catch (error) {
    console.error("getCpoCatalog error:", error);
    return { products: [], total: 0, page: 1, totalPages: 1, recycleBinCount: 0 };
  }
}

/**
 * Bulk Edit Products across or within vendors (Price multiplier/override, stock, status, category)
 */
export async function bulkEditCpoProducts(params: {
  productIds: string[];
  action: "setStatus" | "setCategory" | "adjustPrice" | "adjustStock";
  value: string | number;
}) {
  const cpo = await requireCpoSession("catalog:bulk_edit");

  if (!params.productIds || params.productIds.length === 0) {
    return { success: false, error: "Please select at least one product." };
  }

  try {
    let updatedCount = 0;

    if (params.action === "setStatus") {
      const newStatus = String(params.value);
      const res = await prisma.product.updateMany({
        where: { id: { in: params.productIds } },
        data: { status: newStatus, updatedByCpoId: cpo.userId, actorRole: "CPO" },
      });
      updatedCount = res.count;
    } else if (params.action === "setCategory") {
      const catSlug = String(params.value);
      const cat = await prisma.category.findUnique({ where: { slug: catSlug } });
      const res = await prisma.product.updateMany({
        where: { id: { in: params.productIds } },
        data: {
          categorySlug: catSlug,
          categoryName: cat?.name || catSlug,
          categoryId: cat?.id || null,
          updatedByCpoId: cpo.userId,
          actorRole: "CPO",
        },
      });
      updatedCount = res.count;
    } else if (params.action === "adjustPrice") {
      // Adjust price by percent or fixed amount
      const multiplier = 1 + Number(params.value) / 100;
      const variants = await prisma.productVariant.findMany({
        where: { productId: { in: params.productIds } },
      });

      for (const v of variants) {
        const newBox = Math.round(v.pricePerBox * multiplier);
        const newSqft = Math.round((v.pricePerSqft || v.pricePerBox) * multiplier);
        await prisma.productVariant.update({
          where: { id: v.id },
          data: { pricePerBox: newBox, pricePerSqft: newSqft },
        });
      }
      updatedCount = params.productIds.length;
    } else if (params.action === "adjustStock") {
      const targetStock = Number(params.value);
      await prisma.productVariant.updateMany({
        where: { productId: { in: params.productIds } },
        data: { stockBoxes: targetStock },
      });
      updatedCount = params.productIds.length;
    }

    // Write audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        action: `CPO_BULK_EDIT_${params.action.toUpperCase()}`,
        entity: "Product",
        actorRole: "CPO",
        after: {
          productIds: params.productIds,
          action: params.action,
          value: params.value,
          updatedCount,
        },
      },
    });

    safeRevalidate("/cpo/catalog");
    safeRevalidate("/vendor/products");
    safeRevalidate("/shop");

    return {
      success: true,
      updatedCount,
      message: `Successfully updated ${updatedCount} products.`,
    };
  } catch (error: any) {
    console.error("bulkEditCpoProducts error:", error);
    return { success: false, error: error?.message || "Failed to bulk edit products." };
  }
}

/**
 * Fetch Unified Activity Log for CPO
 */
export async function getCpoActivityLogs(filters?: {
  vendorId?: string;
  action?: string;
  limit?: number;
}) {
  await requireCpoSession("activity:view");

  try {
    const where: any = {};
    if (filters?.vendorId && filters.vendorId !== "all") where.vendorId = filters.vendorId;
    if (filters?.action && filters.action !== "all") where.action = filters.action;

    const logs = await prisma.adminAuditLog.findMany({
      where,
      include: {
        admin: { select: { id: true, name: true, email: true, role: true } },
        vendor: { select: { id: true, businessName: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 50,
    });

    return logs.map((l) => ({
      id: l.id,
      actor: l.admin?.name || l.admin?.email || "IntriHub",
      actorRole: l.actorRole || (l.admin?.role === "cpo" ? "CPO" : "ADMIN"),
      vendorName: l.vendor?.businessName || "Global Platform",
      vendorId: l.vendorId,
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      before: l.before,
      after: l.after,
      ip: l.ip,
      createdAt: l.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("getCpoActivityLogs error:", error);
    return [];
  }
}

/**
 * Re-upload product images as CPO directly without opening full edit form
 */
export async function cpoReuploadProductImage(params: {
  productId: string;
  images: string[];
}) {
  const cpo = await requireCpoSession("catalog:edit");

  try {
    const existing = await prisma.product.findUnique({
      where: { id: params.productId },
      include: { variants: true },
    });
    if (!existing) return { success: false, error: "Product not found" };

    const validImages = params.images.filter(
      (img) => img && img.trim() && img !== "/placeholders/product.svg" && !img.includes("placeholder")
    );
    if (validImages.length === 0) {
      return { success: false, error: "Please provide at least one valid non-placeholder image." };
    }

    const updated = await prisma.product.update({
      where: { id: params.productId },
      data: {
        images: validImages,
        updatedByCpoId: cpo.userId,
        actorRole: "CPO",
        variants: {
          updateMany: {
            where: {
              OR: [
                { image: null },
                { image: "" },
                { image: "/placeholders/product.svg" },
              ],
            },
            data: {
              image: validImages[0],
            },
          },
        },
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        vendorId: existing.vendorId,
        action: "CPO_IMAGE_REUPLOAD",
        entity: "Product",
        entityId: existing.id,
        actorRole: "CPO",
        before: { images: existing.images },
        after: { images: validImages },
      },
    });

    safeRevalidate("/cpo/catalog");
    safeRevalidate("/shop");
    safeRevalidate(`/product/${existing.slug}`);

    return { success: true, product: formatProduct(updated) };
  } catch (error: any) {
    console.error("cpoReuploadProductImage error:", error);
    return { success: false, error: error?.message || "Failed to update product images." };
  }
}

/**
 * Bulk re-upload product images for multiple products
 */
export async function cpoBulkUpdateProductImages(
  updates: Array<{ productId: string; images: string[] }>
) {
  const cpo = await requireCpoSession("catalog:edit");

  try {
    let count = 0;
    for (const item of updates) {
      const validImages = item.images.filter(
        (img) => img && img.trim() && img !== "/placeholders/product.svg" && !img.includes("placeholder")
      );
      if (validImages.length > 0) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            images: validImages,
            updatedByCpoId: cpo.userId,
            variants: {
              updateMany: {
                where: {
                  OR: [{ image: null }, { image: "" }, { image: "/placeholders/product.svg" }],
                },
                data: { image: validImages[0] },
              },
            },
          },
        });
        count++;
      }
    }

    safeRevalidate("/cpo/catalog");
    return { success: true, updatedCount: count };
  } catch (error: any) {
    console.error("cpoBulkUpdateProductImages error:", error);
    return { success: false, error: error?.message || "Failed to bulk update images." };
  }
}

/**
 * Bulk Delete Products as CPO (Soft delete / Move to Recycle Bin, or Permanent Purge)
 */
export async function cpoBulkDeleteProducts(params: {
  productIds: string[];
  permanent?: boolean;
}) {
  const cpo = await requireCpoSession("catalog:delete_item");

  if (!params.productIds || params.productIds.length === 0) {
    return { success: false, error: "Please select at least one product." };
  }

  try {
    const { deleteProduct } = await import("@/lib/actions/products");

    if (params.permanent) {
      // Hard delete each product to ensure 301 redirects are properly recorded and variants cleaned up
      let deletedCount = 0;
      for (const id of params.productIds) {
        const res = await deleteProduct(id, { hardDelete: true });
        if (res.success) deletedCount++;
      }

      await prisma.adminAuditLog.create({
        data: {
          adminId: cpo.userId,
          action: "CPO_BULK_PERMANENT_DELETE",
          entity: "Product",
          actorRole: "CPO",
          after: {
            productIds: params.productIds,
            deletedCount,
          },
        },
      });

      safeRevalidate("/cpo/catalog");
      safeRevalidate("/cpo/recycle-bin");
      safeRevalidate("/shop");
      safeRevalidate("/vendor/products");

      return {
        success: true,
        count: deletedCount,
        message: `Permanently deleted ${deletedCount} product(s).`,
      };
    } else {
      // Soft delete: move to Recycle Bin (status: "archived")
      const res = await prisma.product.updateMany({
        where: { id: { in: params.productIds } },
        data: {
          status: "archived",
          updatedByCpoId: cpo.userId,
          actorRole: "CPO",
        },
      });

      await prisma.adminAuditLog.create({
        data: {
          adminId: cpo.userId,
          action: "CPO_BULK_MOVE_TO_RECYCLE_BIN",
          entity: "Product",
          actorRole: "CPO",
          after: {
            productIds: params.productIds,
            movedCount: res.count,
          },
        },
      });

      safeRevalidate("/cpo/catalog");
      safeRevalidate("/cpo/recycle-bin");
      safeRevalidate("/shop");
      safeRevalidate("/vendor/products");

      return {
        success: true,
        count: res.count,
        message: `Moved ${res.count} product(s) to Recycle Bin.`,
      };
    }
  } catch (error: any) {
    console.error("cpoBulkDeleteProducts error:", error);
    return { success: false, error: error?.message || "Failed to delete products." };
  }
}

/**
 * Restore a single product from Recycle Bin back to active
 */
export async function cpoRestoreProduct(productId: string) {
  const cpo = await requireCpoSession("catalog:edit_item");

  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!existing) {
      return { success: false, error: "Product not found." };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        status: "active",
        updatedByCpoId: cpo.userId,
        actorRole: "CPO",
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        vendorId: existing.vendorId,
        action: "CPO_PRODUCT_RESTORED",
        entity: "Product",
        entityId: existing.id,
        actorRole: "CPO",
        before: { status: existing.status },
        after: { status: "active" },
      },
    });

    safeRevalidate("/cpo/catalog");
    safeRevalidate("/cpo/recycle-bin");
    safeRevalidate("/shop");
    safeRevalidate(`/product/${existing.slug}`);

    return {
      success: true,
      product: formatProduct(updated),
      message: `Product "${existing.name}" restored to catalog!`,
    };
  } catch (error: any) {
    console.error("cpoRestoreProduct error:", error);
    return { success: false, error: error?.message || "Failed to restore product." };
  }
}

/**
 * Bulk restore multiple products from Recycle Bin back to active
 */
export async function cpoBulkRestoreProducts(productIds: string[]) {
  const cpo = await requireCpoSession("catalog:edit_item");

  if (!productIds || productIds.length === 0) {
    return { success: false, error: "Please select at least one product." };
  }

  try {
    const res = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: {
        status: "active",
        updatedByCpoId: cpo.userId,
        actorRole: "CPO",
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        action: "CPO_BULK_RESTORE_PRODUCTS",
        entity: "Product",
        actorRole: "CPO",
        after: {
          productIds,
          restoredCount: res.count,
        },
      },
    });

    safeRevalidate("/cpo/catalog");
    safeRevalidate("/cpo/recycle-bin");
    safeRevalidate("/shop");
    safeRevalidate("/vendor/products");

    return {
      success: true,
      count: res.count,
      message: `Successfully restored ${res.count} product(s) to active catalog!`,
    };
  } catch (error: any) {
    console.error("cpoBulkRestoreProducts error:", error);
    return { success: false, error: error?.message || "Failed to restore products." };
  }
}

/**
 * Empty the Recycle Bin completely (permanently purges all archived/discontinued items)
 */
export async function cpoEmptyRecycleBin(vendorId?: string) {
  const cpo = await requireCpoSession("catalog:delete_item");

  try {
    const { deleteProduct } = await import("@/lib/actions/products");

    const where: any = {
      status: { in: ["archived", "discontinued"] },
    };
    if (vendorId && vendorId !== "all") {
      where.vendorId = vendorId;
    }

    const items = await prisma.product.findMany({
      where,
      select: { id: true, name: true },
    });

    if (items.length === 0) {
      return { success: true, count: 0, message: "Recycle Bin is already empty." };
    }

    let purgedCount = 0;
    for (const item of items) {
      const res = await deleteProduct(item.id, { hardDelete: true });
      if (res.success) purgedCount++;
    }

    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        action: "CPO_EMPTY_RECYCLE_BIN",
        entity: "Product",
        actorRole: "CPO",
        after: {
          vendorId: vendorId || "all",
          purgedCount,
        },
      },
    });

    safeRevalidate("/cpo/catalog");
    safeRevalidate("/cpo/recycle-bin");
    safeRevalidate("/shop");
    safeRevalidate("/vendor/products");

    return {
      success: true,
      count: purgedCount,
      message: `Emptied Recycle Bin: permanently removed ${purgedCount} product(s).`,
    };
  } catch (error: any) {
    console.error("cpoEmptyRecycleBin error:", error);
    return { success: false, error: error?.message || "Failed to empty Recycle Bin." };
  }
}

/**
 * Bulk update product status (active | paused)
 */
export async function cpoBulkUpdateProductStatus(
  productIds: string[],
  status: "active" | "paused"
) {
  const cpo = await requireCpoSession("catalog:bulk_edit");

  if (!productIds || productIds.length === 0) {
    return { success: false, error: "Please select at least one product." };
  }

  try {
    const res = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: {
        status,
        updatedByCpoId: cpo.userId,
        actorRole: "CPO",
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId: cpo.userId,
        action: `CPO_BULK_STATUS_${status.toUpperCase()}`,
        entity: "Product",
        actorRole: "CPO",
        after: {
          productIds,
          status,
          updatedCount: res.count,
        },
      },
    });

    safeRevalidate("/cpo/catalog");
    safeRevalidate("/shop");
    safeRevalidate("/vendor/products");

    return {
      success: true,
      count: res.count,
      message: `Updated status to "${status}" for ${res.count} product(s).`,
    };
  } catch (error: any) {
    console.error("cpoBulkUpdateProductStatus error:", error);
    return { success: false, error: error?.message || "Failed to update product statuses." };
  }
}

/**
 * Fetch OrderAlerts for CPO Monitoring (PRD v2 Feature 3)
 */
export async function getCpoOrderAlerts(options?: {
  unacknowledgedOnly?: boolean;
  limit?: number;
}) {
  await requireCpoSession("dashboard:view");
  try {
    const where: any = {};
    if (options?.unacknowledgedOnly) {
      where.acknowledgedAt = null;
    }
    const alerts = await prisma.orderAlert.findMany({
      where,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
          },
        },
        order: {
          select: {
            id: true,
            customerName: true,
            total: true,
            orderStatus: true,
            readyBy: true,
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: options?.limit || 50,
    });
    return alerts;
  } catch (err) {
    console.error("getCpoOrderAlerts error:", err);
    return [];
  }
}


