import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedMobileUser, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    let vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { ownerId: user.id },
          { contactEmail: user.email || "" },
          { contactPhone: user.phone || "" },
        ],
      },
    });

    if (!vendor) {
      return mobileApiResponse({ success: false, error: "Vendor profile not found" }, 404);
    }

    return mobileApiResponse({
      success: true,
      vendor: {
        id: vendor.id,
        businessName: vendor.businessName,
        contactEmail: vendor.contactEmail,
        contactPhone: vendor.contactPhone,
        businessAddress: vendor.businessAddress,
        category: vendor.category,
        deliveryMethod: vendor.deliveryMethod,
        logo: vendor.logo,
        description: vendor.description,
        status: vendor.status,
        commissionRate: vendor.commissionRate,
      },
    });
  } catch (error: any) {
    console.error("[Mobile Vendor Profile Get Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch vendor profile" },
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedMobileUser(req);
    if (!user) {
      return mobileApiResponse({ success: false, error: "Unauthorized" }, 401);
    }

    let vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { ownerId: user.id },
          { contactEmail: user.email || "" },
          { contactPhone: user.phone || "" },
        ],
      },
    });

    if (!vendor) {
      return mobileApiResponse({ success: false, error: "Vendor profile not found" }, 404);
    }

    const body = await req.json().catch(() => ({}));
    const {
      businessName,
      contactPhone,
      contactEmail,
      businessAddress,
      category,
      deliveryMethod,
      description,
    } = body;

    let cleanPhone: string | undefined = undefined;
    if (contactPhone !== undefined && contactPhone !== null) {
      const digits = String(contactPhone).replace(/\D/g, "");
      if (digits.length === 10) {
        cleanPhone = digits;
      } else if (digits.length === 12 && digits.startsWith("91")) {
        cleanPhone = digits.slice(2);
      } else if (digits.length > 0) {
        return mobileApiResponse(
          { success: false, error: "Please enter a valid 10-digit phone number" },
          400
        );
      }
    }

    const updateData: any = {};
    if (businessName !== undefined) updateData.businessName = String(businessName).trim();
    if (contactEmail !== undefined) updateData.contactEmail = String(contactEmail).trim().toLowerCase();
    if (cleanPhone !== undefined) updateData.contactPhone = cleanPhone;
    if (businessAddress !== undefined) updateData.businessAddress = String(businessAddress).trim();
    if (category !== undefined) updateData.category = String(category).trim();
    if (deliveryMethod !== undefined) updateData.deliveryMethod = String(deliveryMethod).trim();
    if (description !== undefined) updateData.description = String(description).trim();

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    });

    // Also update underlying user record name/phone
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: businessName !== undefined ? String(businessName).trim() : undefined,
        phone: cleanPhone !== undefined ? cleanPhone : undefined,
      },
    });

    return mobileApiResponse({
      success: true,
      message: "Vendor store profile updated successfully!",
      vendor: updatedVendor,
    });
  } catch (error: any) {
    console.error("[Mobile Vendor Profile Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update vendor profile" },
      500
    );
  }
}
