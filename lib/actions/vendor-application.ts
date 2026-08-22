"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";
import crypto from "crypto";

export type VendorApplicationData = {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  category: string;
  address?: string;
  description?: string;
  aadharDocUrl?: string;
  panDocUrl?: string;
  shopPhotoUrl?: string;
  website_url_hp?: string; // Honeypot field (must remain empty)
};

// 1. Submit Public Vendor Application (Path A)
export async function submitVendorApplication(data: VendorApplicationData) {
  try {
    // Bot Honeypot Protection: If invisible honeypot field is populated, silently reject bot
    if (data.website_url_hp && data.website_url_hp.trim().length > 0) {
      console.warn("[Security] Bot trapped by vendor apply honeypot field:", data.website_url_hp);
      return {
        success: true,
        applicationId: "bot_filtered",
        message: "Application submitted successfully! Our team will contact you soon.",
      };
    }

    const cleanPhone = data.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return { success: false, error: "Please enter a valid 10-digit mobile number." };
    }

    const email = data.email.toLowerCase().trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: "Please enter a valid email address." };
    }

    // Rate Limiting: Max 3 applications per email/phone per hour
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const rateCheck = checkRateLimit(`vendor-apply:${cleanPhone}`, 3, 60 * 60 * 1000);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: "Too many application submissions from this number. Please wait before trying again.",
      };
    }

    if (!data.businessName || data.businessName.trim().length < 2) {
      return { success: false, error: "Please enter your business or shop name." };
    }

    if (!data.ownerName || data.ownerName.trim().length < 2) {
      return { success: false, error: "Please enter the owner's full name." };
    }

    const application = await prisma.vendorApplication.create({
      data: {
        businessName: data.businessName.trim(),
        ownerName: data.ownerName.trim(),
        phone: cleanPhone,
        email,
        category: data.category || "General",
        address: data.address?.trim() || "",
        description: data.description?.trim() || "",
        aadharDocUrl: data.aadharDocUrl || null,
        panDocUrl: data.panDocUrl || null,
        shopPhotoUrl: data.shopPhotoUrl || null,
        status: "new_inquiry",
      },
    });

    // Notify Super Admin
    try {
      await prisma.adminNotification.create({
        data: {
          title: "New Vendor Application",
          message: `${data.businessName} (${data.ownerName}) applied for ${data.category}`,
          type: "general",
          link: "/admin/vendor-applications",
          metadata: { applicationId: application.id },
        },
      });
    } catch {}

    safeRevalidate("/admin/vendor-applications");

    return {
      success: true,
      applicationId: application.id,
      message: "Application submitted successfully! Our team will contact you soon.",
    };
  } catch (error: any) {
    console.error("submitVendorApplication error:", error);
    return { success: false, error: error?.message || "Failed to submit application." };
  }
}

// 2. Super Admin: Get all applications with search & filter
export async function getVendorApplications(options?: {
  status?: string; // all | new_inquiry | contacted | converted | rejected
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
        { ownerName: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { category: { contains: term, mode: "insensitive" } },
      ];
    }

    const applications = await prisma.vendorApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return applications;
  } catch (error) {
    console.error("getVendorApplications error:", error);
    return [];
  }
}

// 3. Super Admin: Update application status or internal notes
export async function updateVendorApplication(
  applicationId: string,
  data: {
    status?: "new_inquiry" | "contacted" | "converted" | "rejected";
    internalNotes?: string;
    rejectionReason?: string;
  }
) {
  try {
    const updated = await prisma.vendorApplication.update({
      where: { id: applicationId },
      data: {
        status: data.status,
        internalNotes: data.internalNotes !== undefined ? data.internalNotes : undefined,
        rejectionReason: data.rejectionReason !== undefined ? data.rejectionReason : undefined,
      },
    });

    safeRevalidate("/admin/vendor-applications");
    return { success: true, application: updated };
  } catch (error: any) {
    console.error("updateVendorApplication error:", error);
    return { success: false, error: error?.message || "Failed to update application." };
  }
}

// Helper: Generate secure friendly password
function generateSecurePassword(): string {
  const words = ["Intri", "Vendor", "Hub", "Shop", "Market"];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const randomSpecial = ["#", "$", "@", "!"][Math.floor(Math.random() * 4)];
  return `${randomWord}${randomSpecial}${randomNum}`;
}

// 4. Super Admin: Convert Application ➔ Live Vendor Account
export async function createVendorFromApplication(
  applicationId: string,
  options?: {
    customPassword?: string;
    commissionRate?: number;
    gstNumber?: string;
  }
) {
  try {
    const app = await prisma.vendorApplication.findUnique({
      where: { id: applicationId },
    });

    if (!app) {
      return { success: false, error: "Application not found" };
    }

    if (app.status === "converted" && app.vendorId) {
      return { success: false, error: "This application has already been converted to a vendor account." };
    }

    const cleanPhone = app.phone.replace(/\D/g, "");
    const email = app.email.toLowerCase().trim();
    const plainPassword = options?.customPassword?.trim() || generateSecurePassword();
    const passwordHash = crypto.createHash("sha256").update(plainPassword).digest("hex");
    const commissionRate = options?.commissionRate !== undefined ? Number(options.commissionRate) : 15.0;

    // Base slug
    const baseSlug = app.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    const slug = `${baseSlug}-${cleanPhone.slice(-4)}`;

    // 1. Upsert or find User account
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ phone: cleanPhone }, { email }],
      },
      include: { vendor: true },
    });

    if (user?.vendor) {
      return {
        success: false,
        error: `A vendor account already exists for ${user.email || user.phone} (Shop: ${user.vendor.businessName}).`,
      };
    }

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: app.ownerName,
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
          name: app.ownerName,
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

    // 2. Create Vendor record
    const vendor = await prisma.vendor.create({
      data: {
        businessName: app.businessName,
        slug,
        ownerId: user.id,
        contactEmail: email,
        contactPhone: cleanPhone,
        businessAddress: app.address || "",
        category: app.category || "General",
        description: app.description || "",
        gstNumber: options?.gstNumber || null,
        status: "approved",
        commissionRate,
        applicationId: app.id,
        onboardingPath: "self_apply",
      },
    });

    // 3. Mark Application as converted
    await prisma.vendorApplication.update({
      where: { id: app.id },
      data: {
        status: "converted",
        vendorId: vendor.id,
      },
    });

    safeRevalidate("/admin/vendor-applications");
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
        ownerName: app.ownerName,
        commissionRate: vendor.commissionRate,
      },
      message: `Vendor account "${vendor.businessName}" created successfully!`,
    };
  } catch (error: any) {
    console.error("createVendorFromApplication error:", error);
    return { success: false, error: error?.message || "Failed to create vendor account." };
  }
}
