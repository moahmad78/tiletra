"use server";

import { prisma } from "@/lib/prisma";
import type { Product } from "@/lib/data/products";
import { formatProduct, safeRevalidate } from "@/lib/formatters";
import { createProduct, updateProduct, deleteProduct, CreateProductInput } from "./products";

export type VendorApplicationInput = {
  businessName: string;
  ownerName: string;
  contactEmail: string;
  contactPhone: string;
  category?: string;
  businessAddress?: string;
  gstNumber?: string;
  description?: string;
  logo?: string;
};

// 1. Vendor Registration / Self-Signup (creates user + vendor application)
export async function registerVendor(input: VendorApplicationInput) {
  try {
    const cleanPhone = input.contactPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit phone number" };
    }

    const email = input.contactEmail.toLowerCase().trim();
    if (!email || !email.includes("@")) {
      return { success: false, error: "Please enter a valid email address" };
    }

    if (!input.businessName || input.businessName.trim().length < 2) {
      return { success: false, error: "Please provide a valid shop/business name" };
    }

    // Generate unique slug for the vendor
    const baseSlug = input.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${cleanPhone.slice(-4)}`;

    // Check if phone or email is already registered as vendor
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { email }],
      },
      include: { vendor: true },
    });

    if (existingUser?.vendor) {
      return {
        success: false,
        error: "A vendor account with this phone or email already exists. Please log in.",
      };
    }

    let userId = existingUser?.id;

    if (existingUser) {
      // Upgrade existing user role to vendor
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: input.ownerName || existingUser.name,
          role: "vendor",
        },
      });
    } else {
      // Create new user with vendor role
      const newUser = await prisma.user.create({
        data: {
          name: input.ownerName || input.businessName,
          phone: cleanPhone,
          email,
          role: "vendor",
          phoneVerified: true,
          emailVerified: true,
        },
      });
      userId = newUser.id;
    }

    // Create the Vendor record in pending state
    const newVendor = await prisma.vendor.create({
      data: {
        businessName: input.businessName.trim(),
        slug,
        ownerId: userId!,
        contactEmail: email,
        contactPhone: cleanPhone,
        businessAddress: input.businessAddress || "",
        category: input.category || "General Building Materials",
        gstNumber: input.gstNumber?.trim().toUpperCase() || null,
        description: input.description || "",
        logo: input.logo || null,
        status: "pending",
        commissionRate: 15.0,
      },
    });

    safeRevalidate("/admin/vendors");
    safeRevalidate("/vendor");

    return {
      success: true,
      vendor: newVendor,
      message: "Application submitted successfully! Our team will review and approve your account shortly.",
    };
  } catch (error: any) {
    console.error("Error registering vendor:", error);
    return { success: false, error: error?.message || "Failed to submit vendor application" };
  }
}

// 2. Fetch Vendor Profile
export async function getVendorProfile(vendorId: string) {
  try {
    if (!vendorId) return null;
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });
    return vendor;
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    return null;
  }
}

// 3. Update Vendor Profile (scoped)
export async function updateVendorProfile(
  vendorId: string,
  input: {
    businessName?: string;
    contactEmail?: string;
    contactPhone?: string;
    businessAddress?: string;
    description?: string;
    logo?: string;
    shopPhotoUrl?: string;
    category?: string;
    gstNumber?: string;
    deliveryMethod?: string;
    deliveryFeeEnabled?: boolean;
    customDeliveryFee?: number | null;
    freeDeliveryThreshold?: number | null;
  }
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        businessName: input.businessName?.trim(),
        contactEmail: input.contactEmail?.toLowerCase().trim(),
        contactPhone: input.contactPhone?.trim(),
        businessAddress: input.businessAddress?.trim(),
        description: input.description?.trim(),
        logo: input.logo,
        shopPhotoUrl: input.shopPhotoUrl?.trim(),
        category: input.category?.trim(),
        gstNumber: input.gstNumber?.trim().toUpperCase(),
        ...(input.deliveryMethod !== undefined && { deliveryMethod: input.deliveryMethod.trim() }),
        ...(input.deliveryFeeEnabled !== undefined && { deliveryFeeEnabled: input.deliveryFeeEnabled }),
        ...(input.customDeliveryFee !== undefined && { customDeliveryFee: input.customDeliveryFee }),
        ...(input.freeDeliveryThreshold !== undefined && { freeDeliveryThreshold: input.freeDeliveryThreshold }),
      } as any,
    });

    safeRevalidate("/vendor/settings");
    safeRevalidate("/vendor");
    safeRevalidate(`/admin/vendors`);
    safeRevalidate(`/admin/vendors/${vendorId}`);

    return { success: true, vendor: updated, message: "Shop details updated successfully!" };
  } catch (error: any) {
    console.error("Error updating vendor profile:", error);
    return { success: false, error: error?.message || "Failed to update profile" };
  }
}

// 3b. Update Vendor Delivery & Shipping Settings
export async function updateVendorDeliverySettings(
  vendorId: string,
  input: {
    deliveryMethod?: "self" | "platform";
    deliveryFeeEnabled: boolean;
    customDeliveryFee?: number | null;
    freeDeliveryThreshold?: number | null;
  }
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updateData: any = {
      deliveryFeeEnabled: input.deliveryFeeEnabled,
      customDeliveryFee: input.customDeliveryFee !== undefined ? input.customDeliveryFee : undefined,
      freeDeliveryThreshold: input.freeDeliveryThreshold !== undefined ? input.freeDeliveryThreshold : undefined,
    };

    if (input.deliveryMethod) {
      updateData.deliveryMethod = input.deliveryMethod;
    }

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: updateData,
    });

    safeRevalidate("/vendor/settings");
    safeRevalidate("/vendor");
    safeRevalidate("/checkout");
    safeRevalidate("/cart");

    return {
      success: true,
      vendor: updated,
      message: "Delivery and shipping settings saved successfully!",
    };
  } catch (error: any) {
    console.error("Error updating vendor delivery settings:", error);
    return {
      success: false,
      error: error?.message || "Failed to update delivery settings",
    };
  }
}

// 4. Get Vendor Products (Strictly Scoped by vendorId)
export async function getVendorProducts(
  vendorId: string,
  options?: {
    search?: string;
    status?: string; // all | active | paused | draft
    approvalStatus?: string; // all | pending | approved | rejected
  }
): Promise<Product[]> {
  try {
    if (!vendorId) return [];

    const where: any = { vendorId };

    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }
    if (options?.approvalStatus && options.approvalStatus !== "all") {
      where.approvalStatus = options.approvalStatus;
    }
    if (options?.search) {
      const term = options.search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { categoryName: { contains: term, mode: "insensitive" } },
          ],
        },
      ];
    }

    const dbProducts = await prisma.product.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });

    return dbProducts.map(formatProduct);
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return [];
  }
}

// Helper to ensure demo/registered vendor exists in DB
async function ensureVendorRecord(vendorId: string) {
  let vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
  if (vendor) return vendor;

  const demoMap: Record<string, { name: string; slug: string; email: string; phone: string; cat: string; owner: string }> = {
    "vnd-001": {
      name: "Sri Balaji Electricals & Hardware",
      slug: "sri-balaji-electricals",
      email: "balaji.electricals@intrihub.com",
      phone: "9845012345",
      cat: "Electricals & Lighting",
      owner: "Ramesh Kumar",
    },
    "vnd-002": {
      name: "Royal Ceramics & Sanitaryware",
      slug: "royal-ceramics",
      email: "royal.ceramics@intrihub.com",
      phone: "9876543210",
      cat: "Sanitary & Bath Fittings",
      owner: "Anand Poddar",
    },
    "vnd-003": {
      name: "Apex Plumbing Supplies",
      slug: "apex-plumbing",
      email: "apex.plumbing@intrihub.com",
      phone: "9123456780",
      cat: "Plumbing & Pipes",
      owner: "Vikas Sharma",
    },
  };

  const demo = demoMap[vendorId];
  if (demo) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ phone: demo.phone }, { email: demo.email }] },
    });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: demo.owner,
          email: demo.email,
          phone: demo.phone,
          role: "vendor",
          phoneVerified: true,
        },
      });
    }
    vendor = await prisma.vendor.upsert({
      where: { id: vendorId },
      update: {
        businessName: demo.name,
        slug: demo.slug,
        contactEmail: demo.email,
        contactPhone: demo.phone,
        category: demo.cat,
        status: "approved",
        ownerId: user.id,
      },
      create: {
        id: vendorId,
        businessName: demo.name,
        slug: demo.slug,
        contactEmail: demo.email,
        contactPhone: demo.phone,
        category: demo.cat,
        status: "approved",
        ownerId: user.id,
      },
    });
  }

  return vendor;
}

// 5. Vendor Create Product (Submits with approvalStatus: "pending")
export async function createVendorProduct(vendorId: string, input: CreateProductInput) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const vendor = await ensureVendorRecord(vendorId);
    if (!vendor) return { success: false, error: "Vendor not found. Please refresh and try again." };

    if (vendor.status === "suspended") {
      return { success: false, error: "Your vendor account is suspended. Contact support." };
    }

    // Determine auto-publish status directly from DB record
    const isAutoPublish = Boolean(vendor.autoPublishEnabled);
    const approvalStatus = isAutoPublish ? "approved" : (input.approvalStatus || "pending");

    // Force vendorId and status for vendor submissions
    const res = await createProduct({
      ...input,
      vendorId: vendor.id,
      status: input.status || "active",
      approvalStatus,
      rejectionReason: null,
    });

    if (res.success && res.product) {
      try {
        if (!isAutoPublish) {
          await prisma.adminNotification.create({
            data: {
              title: "New Product Awaiting Approval",
              message: `Vendor "${vendor.businessName}" submitted "${res.product.name}" for catalog approval.`,
              type: "new_order",
              link: "/admin/product-approvals",
              metadata: {
                productId: res.product.id,
                vendorId: vendor.id,
                vendorName: vendor.businessName,
              },
            },
          });

          // Dispatch Push Notification to Super Admin devices
          const { notifyAdminPush } = await import("@/lib/push-notifications");
          await notifyAdminPush({
            title: "Product Pending Approval ⏳",
            body: `Vendor "${vendor.businessName}" submitted "${res.product.name}" for approval.`,
            data: { productId: res.product.id, type: "product_approval" },
          });
        }
      } catch (notifErr) {
        console.error("Error creating admin notification:", notifErr);
      }
    }

    safeRevalidate("/vendor/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/admin/products");
    safeRevalidate("/shop");
    safeRevalidate("/");

    return res;
  } catch (error: any) {
    console.error("Error creating vendor product:", error);
    return { success: false, error: error?.message || "Failed to create product" };
  }
}

// 6. Vendor Update Product (Verifies ownership, auto-publishes if enabled else resets approval)
export async function updateVendorProduct(
  vendorId: string,
  productId: string,
  input: Partial<CreateProductInput>
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const vendor = await ensureVendorRecord(vendorId);
    if (!vendor) return { success: false, error: "Vendor not found" };

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing || existing.vendorId !== vendor.id) {
      return { success: false, error: "Unauthorized: You do not own this product" };
    }

    const isAutoPublish = Boolean(vendor.autoPublishEnabled);
    const approvalStatus = isAutoPublish ? "approved" : "pending";

    // Resubmit for approval upon modifications if auto-publish is false
    const res = await updateProduct(productId, {
      ...input,
      vendorId: vendor.id,
      approvalStatus,
      rejectionReason: null,
    });

    if (res.success && res.product && !isAutoPublish) {
      try {
        await prisma.adminNotification.create({
          data: {
            title: "Product Listing Updated",
            message: `Vendor "${vendor.businessName}" updated "${res.product.name}". Queued for re-approval.`,
            type: "general",
            link: "/admin/product-approvals",
            metadata: {
              productId: res.product.id,
              vendorId: vendor.id,
              vendorName: vendor.businessName,
            },
          },
        });
      } catch (notifErr) {
        console.error("Error creating admin notification:", notifErr);
      }
    }

    safeRevalidate("/vendor/products");
    safeRevalidate("/admin/product-approvals");
    safeRevalidate("/admin/products");
    safeRevalidate("/shop");
    safeRevalidate("/");

    return res;
  } catch (error: any) {
    console.error("Error updating vendor product:", error);
    return { success: false, error: error?.message || "Failed to update product" };
  }
}

// 6.1 Super Admin Toggle Vendor Auto-Publish Setting with Audit Trail
export async function toggleVendorAutoPublish(
  vendorId: string,
  autoPublishEnabled: boolean,
  adminUserId?: string
) {
  try {
    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: { autoPublishEnabled },
    });

    // Write to Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          action: "VENDOR_AUTO_PUBLISH_TOGGLED",
          entity: "Vendor",
          entityId: vendor.id,
          userId: adminUserId || null,
          details: {
            vendorName: vendor.businessName,
            autoPublishEnabled,
            updatedBy: adminUserId ? "Admin" : "Super Admin",
            timestamp: new Date().toISOString(),
          },
        },
      });
    } catch (auditErr) {
      console.error("Audit log creation error:", auditErr);
    }

    safeRevalidate("/admin/vendors");
    safeRevalidate(`/admin/vendors/${vendorId}`);
    safeRevalidate("/vendor/products/new");
    safeRevalidate("/vendor/products");

    return { success: true, vendor };
  } catch (error: any) {
    console.error("Error toggling vendor auto-publish:", error);
    return { success: false, error: error?.message || "Failed to toggle auto-publish" };
  }
}

// 7. Toggle Product Pause / Active Status (Requested feature)
export async function toggleVendorProductStatus(
  vendorId: string,
  productId: string,
  newStatus: "active" | "paused"
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing || existing.vendorId !== vendorId) {
      return { success: false, error: "Unauthorized: You do not own this product" };
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: { status: newStatus },
      include: { variants: true, attributes: true },
    });

    safeRevalidate("/shop");
    safeRevalidate(`/shop/${updated.categorySlug}`);
    safeRevalidate(`/product/${updated.slug}`);
    safeRevalidate("/vendor/products");
    safeRevalidate("/admin/products");
    safeRevalidate("/");

    return {
      success: true,
      product: formatProduct(updated),
      message: `Product is now ${newStatus === "active" ? "active on storefront" : "paused (hidden from storefront)"}`,
    };
  } catch (error: any) {
    console.error("Error toggling product status:", error);
    return { success: false, error: error?.message || "Failed to toggle status" };
  }
}

// 8. Delete Vendor Product (Ownership check)
export async function deleteVendorProduct(vendorId: string, productId: string) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const existing = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!existing || existing.vendorId !== vendorId) {
      return { success: false, error: "Unauthorized: You do not own this product" };
    }

    const res = await deleteProduct(productId);
    safeRevalidate("/vendor/products");
    return res;
  } catch (error: any) {
    console.error("Error deleting vendor product:", error);
    return { success: false, error: error?.message || "Failed to delete product" };
  }
}

// 9. Vendor Dashboard Stats
export async function getVendorDashboardStats(vendorId: string) {
  try {
    if (!vendorId) {
      return {
        totalProducts: 0,
        activeProducts: 0,
        pausedProducts: 0,
        pendingApprovals: 0,
        rejectedProducts: 0,
        lowStockCount: 0,
        totalOrders: 0,
        totalRevenue: 0,
      };
    }

    const [allProducts, lowStockVariants, splits] = await Promise.all([
      prisma.product.findMany({
        where: { vendorId },
        select: {
          id: true,
          status: true,
          approvalStatus: true,
        },
      }),
      prisma.productVariant.count({
        where: {
          product: { vendorId },
          stockBoxes: { lt: 15 },
        },
      }),
      prisma.vendorOrderSplit.findMany({
        where: { vendorId },
        select: {
          subtotal: true,
          vendorPayoutAmount: true,
          fulfillmentStatus: true,
        },
      }),
    ]);

    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter((p) => p.status === "active" && p.approvalStatus === "approved").length;
    const pausedProducts = allProducts.filter((p) => p.status === "paused").length;
    const pendingApprovals = allProducts.filter((p) => p.approvalStatus === "pending").length;
    const rejectedProducts = allProducts.filter((p) => p.approvalStatus === "rejected").length;
    const totalOrders = splits.length;
    const totalRevenue = splits.reduce((acc, s) => acc + s.vendorPayoutAmount, 0);

    return {
      totalProducts,
      activeProducts,
      pausedProducts,
      pendingApprovals,
      rejectedProducts,
      lowStockCount: lowStockVariants,
      totalOrders,
      totalRevenue,
    };
  } catch (error) {
    console.error("Error getting vendor dashboard stats:", error);
    return {
      totalProducts: 0,
      activeProducts: 0,
      pausedProducts: 0,
      pendingApprovals: 0,
      rejectedProducts: 0,
      lowStockCount: 0,
      totalOrders: 0,
      totalRevenue: 0,
    };
  }
}

// 10. Change Vendor Password (First-Login Reset or Settings Update)
export async function changeVendorPassword(ownerId: string, newPassword: string) {
  try {
    if (!ownerId) return { success: false, error: "User ID required" };
    
    const { validatePasswordStrength, hashPassword } = await import("@/lib/password-security");
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return { success: false, error: strengthCheck.error || "Password does not meet security requirements." };
    }

    const passwordHash = hashPassword(newPassword.trim());

    await prisma.user.update({
      where: { id: ownerId },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    safeRevalidate("/vendor");
    return { success: true, message: "Your password has been updated successfully!" };
  } catch (error: any) {
    console.error("changeVendorPassword error:", error);
    return { success: false, error: error?.message || "Failed to update password." };
  }
}

// 11. Vendor Payout / Bank Details Update (Part B)
export async function updateVendorBankDetails(
  vendorId: string,
  bankData: {
    bankAccountHolder?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankUpiId?: string;
  }
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        bankAccountHolder: bankData.bankAccountHolder?.trim() || null,
        bankName: bankData.bankName?.trim() || null,
        bankAccountNumber: bankData.bankAccountNumber?.trim() || null,
        bankIfscCode: bankData.bankIfscCode?.trim().toUpperCase() || null,
        bankUpiId: bankData.bankUpiId?.trim().toLowerCase() || null,
      },
    });

    safeRevalidate("/vendor/settings");
    safeRevalidate("/vendor/payouts");
    safeRevalidate(`/admin/vendors/${vendorId}`);

    return {
      success: true,
      vendor: updated,
      message: "Bank and payout details updated successfully!",
    };
  } catch (error: any) {
    console.error("updateVendorBankDetails error:", error);
    return { success: false, error: error?.message || "Failed to update bank details" };
  }
}

// 11b. Vendor KYC & Legal Documents Submission
export async function updateVendorKycDocuments(
  vendorId: string,
  kycData: {
    panNumber?: string;
    panDocUrl?: string;
    aadharNumber?: string;
    aadharDocUrl?: string;
    gstNumber?: string;
    gstDocUrl?: string;
    chequeDocUrl?: string;
    tradeLicenseDocUrl?: string;
    shopPhotoUrl?: string;
  }
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID required" };

    const hasMandatory =
      (kycData.panNumber || kycData.panDocUrl) &&
      (kycData.aadharNumber || kycData.aadharDocUrl);

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        panNumber: kycData.panNumber?.trim().toUpperCase() || undefined,
        panDocUrl: kycData.panDocUrl?.trim() || undefined,
        aadharNumber: kycData.aadharNumber?.trim() || undefined,
        aadharDocUrl: kycData.aadharDocUrl?.trim() || undefined,
        gstNumber: kycData.gstNumber?.trim().toUpperCase() || undefined,
        gstDocUrl: kycData.gstDocUrl?.trim() || undefined,
        chequeDocUrl: kycData.chequeDocUrl?.trim() || undefined,
        tradeLicenseDocUrl: kycData.tradeLicenseDocUrl?.trim() || undefined,
        shopPhotoUrl: kycData.shopPhotoUrl?.trim() || undefined,
        kycStatus: hasMandatory ? "submitted" : "pending",
      } as any,
    });

    safeRevalidate("/vendor/settings");
    safeRevalidate("/vendor");
    safeRevalidate(`/admin/vendors/${vendorId}`);

    return {
      success: true,
      vendor: updated,
      message: "KYC legal documents uploaded and submitted for Super Admin verification!",
    };
  } catch (error: any) {
    console.error("updateVendorKycDocuments error:", error);
    return { success: false, error: error?.message || "Failed to update KYC documents" };
  }
}

// 12. Vendor Orders Query (Strictly Scoped by vendorId)
export async function getVendorOrders(vendorId: string) {
  try {
    if (!vendorId) return [];

    const splits = await prisma.vendorOrderSplit.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
    });

    const orderIds = splits.map((s) => s.orderId);
    const parentOrders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: true,
      },
    });

    const orderMap = new Map(parentOrders.map((o) => [o.id, o]));

    return splits.map((split) => {
      const parent = orderMap.get(split.orderId);
      return {
        id: split.id,
        orderId: split.orderId,
        vendorId: split.vendorId,
        subtotal: split.subtotal,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        vendorPayoutAmount: split.vendorPayoutAmount,
        fulfillmentStatus: split.fulfillmentStatus,
        trackingNumber: split.trackingNumber,
        courierName: split.courierName,
        createdAt: split.createdAt,
        updatedAt: split.updatedAt,
        parentOrder: parent
          ? {
              customerName: parent.customerName,
              customerPhone: parent.customerPhone,
              customerEmail: parent.customerEmail,
              shippingAddress: parent.shippingAddress,
              paymentStatus: parent.paymentStatus,
              paymentMethod: parent.paymentMethod,
              orderStatus: parent.orderStatus,
              items: parent.items,
            }
          : null,
      };
    });
  } catch (error) {
    console.error("getVendorOrders error:", error);
    return [];
  }
}

// 13. Vendor Delivery Method Configuration (Self-Delivery vs Platform Logistics)
export async function updateVendorDeliveryMethod(
  vendorId: string,
  deliveryMethod: "self" | "platform"
) {
  try {
    if (!vendorId) return { success: false, error: "Vendor ID is required" };

    const updated = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        deliveryMethod,
      },
    });

    safeRevalidate("/vendor/settings");
    safeRevalidate("/vendor/orders");
    safeRevalidate(`/admin/vendors/${vendorId}`);

    return {
      success: true,
      vendor: updated,
      message: `Delivery method updated to ${
        deliveryMethod === "self" ? "Self-Delivery (Vendor Courier)" : "Platform Centralized Logistics"
      }!`,
    };
  } catch (error: any) {
    console.error("updateVendorDeliveryMethod error:", error);
    return { success: false, error: error?.message || "Failed to update delivery method" };
  }
}

// 14. Update Vendor Order Split Fulfillment Status (With Commission Finalization upon Delivery)
export async function updateVendorFulfillmentStatus(
  splitId: string,
  vendorId: string,
  status: string,
  trackingNumber?: string,
  courierName?: string,
  paymentCollected?: boolean
) {
  try {
    if (!splitId || !vendorId) {
      return { success: false, error: "Split ID and Vendor ID are required" };
    }

    const existing = await prisma.vendorOrderSplit.findFirst({
      where: { id: splitId, vendorId },
    });

    if (!existing) {
      return { success: false, error: "Order split not found or unauthorized" };
    }

    const normalizedStatus = status.toLowerCase();
    const isDelivered = normalizedStatus === "delivered";

    const updateData: any = {
      fulfillmentStatus: normalizedStatus,
      trackingNumber: trackingNumber !== undefined ? trackingNumber.trim() : existing.trackingNumber,
      courierName: courierName !== undefined ? courierName.trim() : existing.courierName,
    };

    if (paymentCollected !== undefined) {
      updateData.paymentCollected = paymentCollected;
    }

    // Finalize Commission & Payout calculations when reaching "delivered" status
    if (isDelivered) {
      const commissionAmount = Number(((existing.subtotal * existing.commissionRate) / 100).toFixed(2));
      const vendorPayoutAmount = Number((existing.subtotal - commissionAmount).toFixed(2));
      updateData.commissionAmount = commissionAmount;
      updateData.vendorPayoutAmount = vendorPayoutAmount;
      updateData.deliveredAt = new Date();

      // If online paid or confirmed collected, mark paymentCollected true
      if (paymentCollected !== false) {
        updateData.paymentCollected = true;
      }
    }

    const updated = await prisma.vendorOrderSplit.update({
      where: { id: splitId },
      data: updateData,
    });

    // Sync tracking & courier to parent Order record so Admin Console & Customer App reflect it instantly
    try {
      await prisma.order.update({
        where: { id: existing.orderId },
        data: {
          ...(updateData.trackingNumber ? { trackingNumber: updateData.trackingNumber } : {}),
          ...(updateData.courierName ? { courierName: updateData.courierName } : {}),
          ...(normalizedStatus === "dispatched" ? { orderStatus: "dispatched" } : {}),
          ...(isDelivered ? { orderStatus: "delivered", deliveredAt: new Date() } : {}),
        },
      });
    } catch (parentSyncErr) {
      console.warn("Parent order tracking sync warning:", parentSyncErr);
    }

    // Real-Time Socket Broadcast to customer and admin rooms
    try {
      const { emitSocketEvent } = await import("@/lib/socket-server-emit");
      await emitSocketEvent({
        room: `order_${existing.orderId}`,
        event: "order-status-updated",
        data: {
          orderId: existing.orderId,
          splitId: updated.id,
          fulfillmentStatus: updated.fulfillmentStatus,
          trackingNumber: updated.trackingNumber,
          courierName: updated.courierName,
          updatedAt: updated.updatedAt,
        },
      });
      await emitSocketEvent({
        room: "admin-room",
        event: "vendor-order-updated",
        data: {
          orderId: existing.orderId,
          splitId: updated.id,
          vendorId,
          fulfillmentStatus: updated.fulfillmentStatus,
        },
      });
    } catch (socketErr) {
      console.error("Failed to emit vendor fulfillment socket update:", socketErr);
    }

    safeRevalidate("/vendor/orders");
    safeRevalidate("/vendor/payouts");
    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/deliveries");
    safeRevalidate(`/admin/vendors/${vendorId}`);

    return {
      success: true,
      split: updated,
      message: `Fulfillment status updated to ${status}!`,
    };
  } catch (error: any) {
    console.error("updateVendorFulfillmentStatus error:", error);
    return { success: false, error: error?.message || "Failed to update fulfillment status" };
  }
}

// 14b. Bulk Update Vendor Order Split Fulfillment Status
export async function updateVendorFulfillmentBulk(
  splitIds: string[],
  vendorId: string,
  status: string
) {
  try {
    if (!splitIds || splitIds.length === 0 || !vendorId) {
      return { success: false, error: "Split IDs and Vendor ID are required" };
    }

    const normalizedStatus = status.toLowerCase();
    const isDelivered = normalizedStatus === "delivered";

    const splits = await prisma.vendorOrderSplit.findMany({
      where: { id: { in: splitIds }, vendorId },
    });

    if (splits.length === 0) {
      return { success: false, error: "No matching order splits found" };
    }

    let updatedCount = 0;
    for (const split of splits) {
      const updateData: any = {
        fulfillmentStatus: normalizedStatus,
      };

      if (isDelivered) {
        const commissionAmount = Number(((split.subtotal * split.commissionRate) / 100).toFixed(2));
        const vendorPayoutAmount = Number((split.subtotal - commissionAmount).toFixed(2));
        updateData.commissionAmount = commissionAmount;
        updateData.vendorPayoutAmount = vendorPayoutAmount;
        updateData.deliveredAt = new Date();
        updateData.paymentCollected = true;
      }

      await prisma.vendorOrderSplit.update({
        where: { id: split.id },
        data: updateData,
      });
      updatedCount++;
    }

    safeRevalidate("/vendor/orders");
    safeRevalidate("/vendor/payouts");
    safeRevalidate("/admin/orders");
    safeRevalidate("/admin/deliveries");
    safeRevalidate(`/admin/vendors/${vendorId}`);

    return {
      success: true,
      count: updatedCount,
      message: `Successfully updated ${updatedCount} order(s) to "${status}"!`,
    };
  } catch (error: any) {
    console.error("updateVendorFulfillmentBulk error:", error);
    return { success: false, error: error?.message || "Failed to bulk update fulfillment status" };
  }
}

// 15. Super Admin Platform Centralized Logistics Orders Query
export async function getPlatformDeliveryOrders() {
  try {
    const splits = await prisma.vendorOrderSplit.findMany({
      where: { deliveryMethod: "platform" },
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            contactEmail: true,
            businessAddress: true,
          },
        },
      },
    });

    const orderIds = splits.map((s) => s.orderId);
    const parentOrders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        items: true,
      },
    });

    const orderMap = new Map(parentOrders.map((o) => [o.id, o]));

    return splits.map((split) => {
      const parent = orderMap.get(split.orderId);
      return {
        id: split.id,
        orderId: split.orderId,
        vendorId: split.vendorId,
        vendor: split.vendor,
        subtotal: split.subtotal,
        commissionRate: split.commissionRate,
        commissionAmount: split.commissionAmount,
        vendorPayoutAmount: split.vendorPayoutAmount,
        deliveryMethod: split.deliveryMethod,
        fulfillmentStatus: split.fulfillmentStatus,
        paymentCollected: split.paymentCollected,
        trackingNumber: split.trackingNumber,
        courierName: split.courierName,
        deliveredAt: split.deliveredAt,
        createdAt: split.createdAt,
        updatedAt: split.updatedAt,
        parentOrder: parent
          ? {
              customerName: parent.customerName,
              customerPhone: parent.customerPhone,
              customerEmail: parent.customerEmail,
              shippingAddress: parent.shippingAddress,
              paymentStatus: parent.paymentStatus,
              paymentMethod: parent.paymentMethod,
              orderStatus: parent.orderStatus,
              items: parent.items,
            }
          : null,
      };
    });
  } catch (error) {
    console.error("getPlatformDeliveryOrders error:", error);
    return [];
  }
}

// 16. Super Admin Platform Logistics Status Update (Pickup -> Transit -> Delivery -> Reconcile COD)
export async function updatePlatformDeliveryStatus(
  splitId: string,
  status: string,
  trackingNumber?: string,
  courierName?: string,
  paymentCollected?: boolean
) {
  try {
    if (!splitId) return { success: false, error: "Split ID required" };

    const existing = await prisma.vendorOrderSplit.findUnique({
      where: { id: splitId },
    });

    if (!existing) return { success: false, error: "Delivery split not found" };

    const normalizedStatus = status.toLowerCase();
    const isDelivered = normalizedStatus === "delivered";

    const updateData: any = {
      fulfillmentStatus: normalizedStatus,
      trackingNumber: trackingNumber !== undefined ? trackingNumber.trim() : existing.trackingNumber,
      courierName: courierName !== undefined ? courierName.trim() : existing.courierName,
    };

    if (paymentCollected !== undefined) {
      updateData.paymentCollected = paymentCollected;
    }

    if (isDelivered) {
      const commissionAmount = Number(((existing.subtotal * existing.commissionRate) / 100).toFixed(2));
      const vendorPayoutAmount = Number((existing.subtotal - commissionAmount).toFixed(2));
      updateData.commissionAmount = commissionAmount;
      updateData.vendorPayoutAmount = vendorPayoutAmount;
      updateData.deliveredAt = new Date();
      if (paymentCollected !== false) {
        updateData.paymentCollected = true;
      }
    }

    const updated = await prisma.vendorOrderSplit.update({
      where: { id: splitId },
      data: updateData,
    });

    safeRevalidate("/admin/deliveries");
    safeRevalidate("/admin/orders");
    safeRevalidate("/vendor/orders");
    safeRevalidate("/vendor/payouts");
    safeRevalidate(`/admin/vendors/${existing.vendorId}`);

    return {
      success: true,
      split: updated,
      message: `Platform delivery updated to ${status}!`,
    };
  } catch (error: any) {
    console.error("updatePlatformDeliveryStatus error:", error);
    return { success: false, error: error?.message || "Failed to update platform delivery" };
  }
}

// 15. Server action for Vendor Login Authentication (Phone/Email + Password)
export async function loginVendor(username: string, password?: string) {
  try {
    const query = (username || "").toLowerCase().trim();
    if (!query) {
      return { success: false, error: "Please enter your email or phone number" };
    }

    const { isLockedOut, recordFailedAttempt, resetFailedAttempts } = await import("@/lib/rate-limit");
    const lockoutStatus = isLockedOut(`vendor-auth:${query}`);
    if (lockoutStatus.locked) {
      const waitMinutes = Math.ceil(((lockoutStatus.lockoutUntil || Date.now()) - Date.now()) / 60000);
      return { success: false, error: `Account temporarily locked due to repeated failed logins. Please retry in ${waitMinutes} minute(s).` };
    }

    const cleanPhone = query.replace(/\D/g, "");

    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { contactEmail: { equals: query, mode: "insensitive" } },
          cleanPhone.length === 10 ? { contactPhone: cleanPhone } : {},
          { slug: query },
        ],
      },
      include: { owner: true },
    });

    if (!vendor) {
      recordFailedAttempt(`vendor-auth:${query}`, 5, 15 * 60 * 1000);
      return { success: false, error: "No vendor account found with this email or phone number." };
    }

    if (vendor.owner?.passwordHash) {
      if (!password || !password.trim()) {
        recordFailedAttempt(`vendor-auth:${query}`, 5, 15 * 60 * 1000);
        return { success: false, error: "Password is required to access vendor portal." };
      }

      const { verifyPassword } = await import("@/lib/password-security");
      const isValid = verifyPassword(password.trim(), vendor.owner.passwordHash);
      if (!isValid) {
        const attemptResult = recordFailedAttempt(`vendor-auth:${query}`, 5, 15 * 60 * 1000);
        return {
          success: false,
          error: attemptResult.locked
            ? "Too many failed attempts. Account locked for 15 minutes."
            : `Incorrect password. ${attemptResult.remainingAttempts} attempt(s) remaining.`,
        };
      }
    }

    resetFailedAttempts(`vendor-auth:${query}`);

    return {
      success: true,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        slug: vendor.slug,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        category: vendor.category,
        status: vendor.status,
        commissionRate: vendor.commissionRate,
        rejectionReason: vendor.rejectionReason,
        ownerName: vendor.owner?.name || vendor.businessName,
        ownerId: vendor.ownerId,
        mustChangePassword: vendor.owner?.mustChangePassword ?? false,
      },
    };
  } catch (error: any) {
    console.error("loginVendor server action error:", error);
    return { success: false, error: error?.message || "Internal server error" };
  }
}

