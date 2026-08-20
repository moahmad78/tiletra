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
      inquiriesCount,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "pending" } }),
      prisma.vendor.count({ where: { status: "approved" } }),
      prisma.product.count({ where: { approvalStatus: "pending" } }),
      prisma.product.count({ where: { vendorId: { not: null } } }),
      prisma.vendorApplication.count({ where: { status: "new_inquiry" } }),
    ]);

    return {
      totalVendors,
      pendingVendors,
      approvedVendors,
      pendingProducts,
      totalVendorProducts,
      inquiriesCount,
    };
  } catch (error) {
    console.error("Error fetching admin marketplace stats:", error);
    return {
      totalVendors: 0,
      pendingVendors: 0,
      approvedVendors: 0,
      pendingProducts: 0,
      totalVendorProducts: 0,
      inquiriesCount: 0,
    };
  }
}

// 11. Path B: Direct Manual Vendor Creation (No prior application)
export async function createVendorManually(data: {
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
  try {
    const cleanPhone = data.contactPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit phone number" };
    }

    const email = data.contactEmail.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address" };
    }

    if (!data.businessName || data.businessName.trim().length < 2) {
      return { success: false, error: "Please enter a valid shop/business name" };
    }

    const baseSlug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${cleanPhone.slice(-4)}`;

    const words = ["Intri", "Vendor", "Hub", "Shop", "Seller"];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const plainPassword = data.customPassword?.trim() || `${randomWord}#${randomNum}`;
    const crypto = await import("crypto");
    const passwordHash = crypto.createHash("sha256").update(plainPassword).digest("hex");
    const commissionRate = data.commissionRate !== undefined ? Number(data.commissionRate) : 15.0;

    let user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { email }],
      },
      include: { vendor: true },
    });

    if (user?.vendor) {
      return {
        success: false,
        error: `A vendor account already exists for ${user.email || user.phone} (${user.vendor.businessName}).`,
      };
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: data.ownerName || data.businessName,
          email,
          role: "vendor",
          passwordHash,
          mustChangePassword: true,
          authProvider: "credentials",
        },
        include: { vendor: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: data.ownerName || data.businessName,
          email,
          phone: cleanPhone,
          role: "vendor",
          passwordHash,
          mustChangePassword: true,
          authProvider: "credentials",
          phoneVerified: true,
          emailVerified: true,
        },
        include: { vendor: true },
      });
    }

    const vendor = await prisma.vendor.create({
      data: {
        businessName: data.businessName.trim(),
        slug,
        ownerId: user.id,
        contactEmail: email,
        contactPhone: cleanPhone,
        businessAddress: data.businessAddress || "",
        category: data.category || "General",
        description: data.description || "",
        gstNumber: data.gstNumber || null,
        status: "approved",
        commissionRate,
        onboardingPath: "admin_created",
      },
    });

    safeRevalidate("/admin/vendors");
    safeRevalidate("/vendor");

    return {
      success: true,
      vendor,
      credentials: {
        username: email,
        phone: cleanPhone,
        password: plainPassword,
        businessName: vendor.businessName,
        commissionRate: vendor.commissionRate,
      },
      message: `Vendor "${vendor.businessName}" created successfully!`,
    };
  } catch (error: any) {
    console.error("createVendorManually error:", error);
    return { success: false, error: error?.message || "Failed to create vendor" };
  }
}

// Helper: Mask Account Number for list view
export async function maskAccountNumber(accountNum?: string | null): Promise<string> {
  if (!accountNum || accountNum.trim().length < 4) return "Not Added";
  const clean = accountNum.trim();
  return "XXXX XXXX " + clean.slice(-4);
}

// 12. Super Admin: Per-Vendor Detail Analytics (/admin/vendors/[id])
export async function getVendorDetailAnalytics(vendorId: string) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        },
        products: {
          include: {
            variants: true,
            attributes: true,
          },
          orderBy: { createdAt: "desc" },
        },
        splits: {
          orderBy: { createdAt: "desc" },
        },
        payouts: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) return null;

    // Fetch parent orders for vendor splits to enrich with customer info
    const splitOrderIds = vendor.splits.map((s) => s.orderId);
    const parentOrders = await prisma.order.findMany({
      where: { id: { in: splitOrderIds } },
      include: { items: true },
    });
    const orderMap = new Map(parentOrders.map((o) => [o.id, o]));

    // Calculate totals
    let totalGrossRevenue = 0;
    let totalCommissionEarned = 0;
    let totalVendorEarnings = 0;
    const dayMap: Record<string, { orders: number; revenue: number; commission: number; vendorPayout: number }> = {};

    vendor.splits.forEach((split) => {
      totalGrossRevenue += split.subtotal;
      totalCommissionEarned += split.commissionAmount;
      totalVendorEarnings += split.vendorPayoutAmount;

      const dayKey = split.createdAt.toISOString().slice(0, 10);
      if (!dayMap[dayKey]) {
        dayMap[dayKey] = { orders: 0, revenue: 0, commission: 0, vendorPayout: 0 };
      }
      dayMap[dayKey].orders += 1;
      dayMap[dayKey].revenue += split.subtotal;
      dayMap[dayKey].commission += split.commissionAmount;
      dayMap[dayKey].vendorPayout += split.vendorPayoutAmount;
    });

    const dayWiseTrends = Object.entries(dayMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Calculate Low/Critical stock variants
    let lowStockCount = 0;
    vendor.products.forEach((p) => {
      p.variants.forEach((v) => {
        if (v.stockBoxes < 15) lowStockCount++;
      });
    });

    // Enhanced Product breakdown
    const productStats = {
      total: vendor.products.length,
      live: vendor.products.filter((p) => p.approvalStatus === "approved" && p.status === "active").length,
      underReview: vendor.products.filter((p) => p.approvalStatus === "pending").length,
      rejected: vendor.products.filter((p) => p.approvalStatus === "rejected").length,
      paused: vendor.products.filter((p) => p.status === "paused").length,
      lowStockCount,
    };

    // Enhanced Order Fulfillment breakdown
    const orderStats = {
      total: vendor.splits.length,
      newPending: vendor.splits.filter((s) => s.fulfillmentStatus === "Processing").length,
      processing: vendor.splits.filter((s) => s.fulfillmentStatus === "Processing").length,
      dispatched: vendor.splits.filter((s) => s.fulfillmentStatus === "Dispatched").length,
      delivered: vendor.splits.filter((s) => s.fulfillmentStatus === "Delivered").length,
      cancelled: vendor.splits.filter((s) => s.fulfillmentStatus === "Cancelled").length,
    };

    const enrichedSplits = vendor.splits.map((split) => {
      const parent = orderMap.get(split.orderId);
      return {
        ...split,
        customerName: parent?.customerName || "Customer",
        customerPhone: parent?.customerPhone || "",
        customerCity: (parent?.shippingAddress as any)?.city || "Bangalore",
        paymentStatus: parent?.paymentStatus || "Paid",
        paymentMethod: parent?.paymentMethod || "Online",
        orderDate: parent?.createdAt || split.createdAt,
      };
    });

    return {
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        category: vendor.category,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        businessAddress: vendor.businessAddress,
        gstNumber: vendor.gstNumber,
        status: vendor.status,
        rejectionReason: vendor.rejectionReason,
        commissionRate: vendor.commissionRate,
        onboardingPath: vendor.onboardingPath,
        applicationId: vendor.applicationId,
        createdAt: vendor.createdAt,
        owner: vendor.owner,
        // Bank Details
        bankAccountHolder: vendor.bankAccountHolder,
        bankName: vendor.bankName,
        bankAccountNumber: vendor.bankAccountNumber,
        bankIfscCode: vendor.bankIfscCode,
        bankUpiId: vendor.bankUpiId,
      },
      stats: {
        totalOrders: vendor.splits.length,
        totalGrossRevenue,
        totalCommissionEarned,
        totalVendorEarnings,
      },
      productStats,
      orderStats,
      dayWiseTrends,
      products: vendor.products.map(formatProduct),
      splits: enrichedSplits,
      payouts: vendor.payouts,
    };
  } catch (error) {
    console.error("getVendorDetailAnalytics error:", error);
    return null;
  }
}

// 13. Super Admin: Top Vendors Ranking Report (/admin/reports)
export async function getTopVendorsReport() {
  try {
    const vendors = await prisma.vendor.findMany({
      include: {
        splits: true,
        _count: {
          select: { products: true },
        },
      },
    });

    const ranked = vendors.map((v) => {
      const totalRevenue = v.splits.reduce((acc, s) => acc + s.subtotal, 0);
      const totalCommission = v.splits.reduce((acc, s) => acc + s.commissionAmount, 0);
      const totalPayout = v.splits.reduce((acc, s) => acc + s.vendorPayoutAmount, 0);
      const totalOrders = v.splits.length;

      return {
        id: v.id,
        businessName: v.businessName,
        category: v.category,
        contactPhone: v.contactPhone,
        status: v.status,
        commissionRate: v.commissionRate,
        totalProducts: v._count.products,
        totalOrders,
        totalRevenue,
        totalCommission,
        totalPayout,
      };
    });

    ranked.sort((a, b) => b.totalRevenue - a.totalRevenue);
    return ranked;
  } catch (error) {
    console.error("getTopVendorsReport error:", error);
    return [];
  }
}

// 14. Super Admin: Delete Vendor (Cascades Vendor, Products, Splits, and User account)
export async function deleteVendor(vendorId: string) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: { products: true },
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    const productIds = vendor.products.map((p) => p.id);

    // Cascade delete vendor data in a safe transaction
    await prisma.$transaction(async (tx) => {
      // 1. Delete cart items, variants, attributes, and products
      if (productIds.length > 0) {
        await tx.cartItem.deleteMany({ where: { productId: { in: productIds } } });
        await tx.productAttribute.deleteMany({ where: { productId: { in: productIds } } });
        await tx.productVariant.deleteMany({ where: { productId: { in: productIds } } });
        await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
        await tx.product.deleteMany({ where: { id: { in: productIds } } });
      }

      // 2. Delete vendor splits, payouts & coupons
      await tx.vendorOrderSplit.deleteMany({ where: { vendorId } });
      await tx.payout.deleteMany({ where: { vendorId } });
      await tx.vendorCoupon.deleteMany({ where: { vendorId } });

      // 3. Delete the vendor record
      await tx.vendor.delete({ where: { id: vendorId } });

      // 4. Delete the linked user login account if present
      if (vendor.ownerId) {
        await tx.user.delete({ where: { id: vendor.ownerId } }).catch(() => {});
      }
    });

    return { success: true, message: `Vendor "${vendor.businessName}" deleted successfully` };
  } catch (error: any) {
    console.error("deleteVendor error:", error);
    return { success: false, error: error?.message || "Failed to delete vendor" };
  }
}
