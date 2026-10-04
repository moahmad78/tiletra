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
      where.status = options.status;
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

    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, options?.limit || 50);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
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
    ]);

    return {
      products: products.map(formatProduct),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("getCpoCatalog error:", error);
    return { products: [], total: 0, page: 1, totalPages: 1 };
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
