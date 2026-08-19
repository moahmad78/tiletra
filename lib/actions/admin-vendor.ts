"use server";

import { prisma } from "@/lib/prisma";
import { formatProduct, safeRevalidate } from "@/lib/formatters";
import type { Product } from "@/lib/data/products";

// 1. Get all vendors with status filtering & counts
export async function getAdminVendors(options?: {
  status?: string; // all | pending | approved | rejected | suspended
  search?: string;
}) {
  try {
    const where: any = {};

    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }

    if (options?.search) {
      const term = options.search.trim();
      where.OR = [
        { businessName: { contains: term, mode: "insensitive" } },
        { contactEmail: { contains: term, mode: "insensitive" } },
        { contactPhone: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
        { gstNumber: { contains: term, mode: "insensitive" } },
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
    console.error("Error fetching vendors for admin:", error);
    return [];
  }
}

// 2. Approve Vendor Account
export async function approveVendor(vendorId: string, commissionRate?: number) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: "approved",
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
        rejectionReason: null,
      },
    });

    safeRevalidate("/admin/vendors");
    safeRevalidate("/vendor");

    return {
      success: true,
      vendor: updated,
      message: `Vendor "${updated.businessName}" has been approved!`,
    };
  } catch (error: any) {
    console.error("Error approving vendor:", error);
    return { success: false, error: error?.message || "Failed to approve vendor" };
  }
}

// 3. Reject Vendor Application
export async function rejectVendor(vendorId: string, reason: string) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" };
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: "rejected",
        rejectionReason: reason.trim(),
      },
    });

    safeRevalidate("/admin/vendors");
    safeRevalidate("/vendor");

    return {
      success: true,
      vendor: updated,
      message: `Vendor application rejected.`,
    };
  } catch (error: any) {
    console.error("Error rejecting vendor:", error);
    return { success: false, error: error?.message || "Failed to reject vendor" };
  }
}

// 4. Suspend Vendor Account
export async function suspendVendor(vendorId: string, reason?: string) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: "suspended",
        rejectionReason: reason?.trim() || "Account temporarily suspended by platform administrator",
      },
    });

    // Auto-pause all products of suspended vendor so they don't appear in live store
    await prisma.product.updateMany({
      where: { vendorId },
      data: { status: "paused" },
    });

    safeRevalidate("/shop");
    safeRevalidate("/admin/vendors");
    safeRevalidate("/admin/products");
    safeRevalidate("/");

    return {
      success: true,
      vendor: updated,
      message: `Vendor "${updated.businessName}" has been suspended. All their products have been hidden from the storefront.`,
    };
  } catch (error: any) {
    console.error("Error suspending vendor:", error);
    return { success: false, error: error?.message || "Failed to suspend vendor" };
  }
}

// 5. Reactivate Suspended Vendor
export async function reactivateVendor(vendorId: string) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        status: "approved",
        rejectionReason: null,
      },
    });

    // Reactivate products that were approved
    await prisma.product.updateMany({
      where: { vendorId, approvalStatus: "approved" },
      data: { status: "active" },
    });

    safeRevalidate("/shop");
    safeRevalidate("/admin/vendors");
    safeRevalidate("/admin/products");
    safeRevalidate("/");

    return {
      success: true,
      vendor: updated,
      message: `Vendor "${updated.businessName}" has been reactivated.`,
    };
  } catch (error: any) {
    console.error("Error reactivating vendor:", error);
    return { success: false, error: error?.message || "Failed to reactivate vendor" };
  }
}

// 6. Update Vendor Commission Rate
export async function updateVendorCommission(vendorId: string, commissionRate: number) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: { commissionRate: Number(commissionRate) },
    });

    safeRevalidate("/admin/vendors");
    return { success: true, vendor: updated, message: `Commission rate updated to ${commissionRate}%` };
  } catch (error: any) {
    console.error("Error updating commission rate:", error);
    return { success: false, error: error?.message || "Failed to update commission rate" };
  }
}

// 7. Get Pending Product Approvals Queue
export async function getAdminPendingProducts(options?: {
  vendorId?: string;
  search?: string;
}): Promise<Product[]> {
  try {
    const where: any = {
      approvalStatus: "pending",
    };

    if (options?.vendorId) {
      where.vendorId = options.vendorId;
    }

    if (options?.search) {
      const term = options.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { categoryName: { contains: term, mode: "insensitive" } },
        { material: { contains: term, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        variants: true,
        attributes: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            status: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return products.map(formatProduct);
  } catch (error) {
    console.error("Error fetching pending products:", error);
    return [];
  }
}

// 8. Super Admin Approve Product
export async function approveProduct(productId: string) {
  try {
    if (!productId) return { success: false, error: "Product ID required" };

    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { vendor: true },
    });

    if (!existing) return { success: false, error: "Product not found" };

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: "approved",
        status: "active",
        rejectionReason: null,
      },
      include: {
        variants: true,
        attributes: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${updated.categorySlug}`);
    safeRevalidate(`/product/${updated.slug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    return {
      success: true,
      product: formatProduct(updated),
      message: `Product "${updated.name}" is approved and live on storefront!`,
    };
  } catch (error: any) {
    console.error("Error approving product:", error);
    return { success: false, error: error?.message || "Failed to approve product" };
  }
}

// 9. Super Admin Reject Product (with actionable reason)
export async function rejectProduct(productId: string, reason: string) {
  try {
    if (!productId) return { success: false, error: "Product ID required" };
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        approvalStatus: "rejected",
        rejectionReason: reason.trim(),
      },
      include: {
        variants: true,
        attributes: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            status: true,
          },
        },
      },
    });

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${updated.categorySlug}`);
    safeRevalidate("/admin/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/vendor/products");
    safeRevalidate("/");

    return {
      success: true,
      product: formatProduct(updated),
      message: `Product listing rejected with feedback.`,
    };
  } catch (error: any) {
    console.error("Error rejecting product:", error);
    return { success: false, error: error?.message || "Failed to reject product" };
  }
}

// 10. Super Admin Marketplace Summary Stats
export async function getAdminMarketplaceStats() {
  try {
    const [
      totalVendors,
      pendingVendors,
      approvedVendors,
      pendingProducts,
      totalVendorProducts,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "pending" } }),
      prisma.vendor.count({ where: { status: "approved" } }),
      prisma.product.count({ where: { approvalStatus: "pending" } }),
      prisma.product.count({ where: { vendorId: { not: null } } }),
    ]);

    return {
      totalVendors,
      pendingVendors,
      approvedVendors,
      pendingProducts,
      totalVendorProducts,
    };
  } catch (error) {
    console.error("Error fetching admin marketplace stats:", error);
    return {
      totalVendors: 0,
      pendingVendors: 0,
      approvedVendors: 0,
      pendingProducts: 0,
      totalVendorProducts: 0,
    };
  }
}
