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
        businessAddress: input.businessAddress,
        description: input.description,
        logo: input.logo,
      },
    });

    safeRevalidate("/vendor/settings");
    safeRevalidate(`/admin/vendors`);

    return { success: true, vendor: updated };
  } catch (error: any) {
    console.error("Error updating vendor profile:", error);
    return { success: false, error: error?.message || "Failed to update profile" };
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

    // Force vendorId and pending approval status for vendor submissions
    const res = await createProduct({
      ...input,
      vendorId: vendor.id,
      status: "active",
      approvalStatus: "pending",
      rejectionReason: null,
    });

    if (res.success && res.product) {
      try {
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

// 6. Vendor Update Product (Verifies ownership, resets approval if edited)
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

    // Resubmit for approval upon modifications
    const res = await updateProduct(productId, {
      ...input,
      vendorId: vendor.id,
      approvalStatus: "pending",
      rejectionReason: null,
    });

    if (res.success && res.product) {
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

    const [allProducts, lowStockVariants] = await Promise.all([
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
    ]);

    const totalProducts = allProducts.length;
    const activeProducts = allProducts.filter((p) => p.status === "active" && p.approvalStatus === "approved").length;
    const pausedProducts = allProducts.filter((p) => p.status === "paused").length;
    const pendingApprovals = allProducts.filter((p) => p.approvalStatus === "pending").length;
    const rejectedProducts = allProducts.filter((p) => p.approvalStatus === "rejected").length;

    return {
      totalProducts,
      activeProducts,
      pausedProducts,
      pendingApprovals,
      rejectedProducts,
      lowStockCount: lowStockVariants,
      totalOrders: 0, // Expanded in 8b
      totalRevenue: 0, // Expanded in 8c
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
