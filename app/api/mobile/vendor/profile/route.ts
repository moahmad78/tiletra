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
        // F1: GPS / Shop Location
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        locationAccuracy: vendor.locationAccuracy,
        // F3: Automation
        autoAcceptOrders: vendor.autoAcceptOrders,
        serviceAreaRadiusKm: vendor.serviceAreaRadiusKm,
        // Bank Details
        bankAccountHolder: vendor.bankAccountHolder,
        bankName: vendor.bankName,
        bankAccountNumber: vendor.bankAccountNumber,
        bankIfscCode: vendor.bankIfscCode,
        bankUpiId: vendor.bankUpiId,
        // KYC Documents
        shopPhotoUrl: vendor.shopPhotoUrl,
        panNumber: vendor.panNumber,
        panDocUrl: vendor.panDocUrl,
        aadharNumber: vendor.aadharNumber,
        aadharDocUrl: vendor.aadharDocUrl,
        gstNumber: vendor.gstNumber,
        gstDocUrl: vendor.gstDocUrl,
        chequeDocUrl: vendor.chequeDocUrl,
        tradeLicenseDocUrl: vendor.tradeLicenseDocUrl,
        kycStatus: vendor.kycStatus || "pending",
        kycNotes: vendor.kycNotes,
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
      logo,
      shopPhotoUrl,
      // Bank Details
      bankAccountHolder,
      bankName,
      bankAccountNumber,
      bankIfscCode,
      bankUpiId,
      // KYC Fields
      panNumber,
      panDocUrl,
      aadharNumber,
      aadharDocUrl,
      gstNumber,
      gstDocUrl,
      chequeDocUrl,
      tradeLicenseDocUrl,
      kycStatus,
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
    if (logo !== undefined) updateData.logo = logo ? String(logo).trim() : null;
    if (shopPhotoUrl !== undefined) updateData.shopPhotoUrl = shopPhotoUrl ? String(shopPhotoUrl).trim() : null;

    // Bank Details
    if (bankAccountHolder !== undefined) updateData.bankAccountHolder = bankAccountHolder ? String(bankAccountHolder).trim() : null;
    if (bankName !== undefined) updateData.bankName = bankName ? String(bankName).trim() : null;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber ? String(bankAccountNumber).trim().replace(/\s/g, "") : null;
    if (bankIfscCode !== undefined) updateData.bankIfscCode = bankIfscCode ? String(bankIfscCode).trim().toUpperCase() : null;
    if (bankUpiId !== undefined) updateData.bankUpiId = bankUpiId ? String(bankUpiId).trim() : null;

    // KYC Details & Legal Documents
    if (panNumber !== undefined) updateData.panNumber = panNumber ? String(panNumber).trim().toUpperCase() : null;
    if (panDocUrl !== undefined) updateData.panDocUrl = panDocUrl ? String(panDocUrl).trim() : null;
    if (aadharNumber !== undefined) updateData.aadharNumber = aadharNumber ? String(aadharNumber).trim().replace(/\D/g, "") : null;
    if (aadharDocUrl !== undefined) updateData.aadharDocUrl = aadharDocUrl ? String(aadharDocUrl).trim() : null;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber ? String(gstNumber).trim().toUpperCase() : null;
    if (gstDocUrl !== undefined) updateData.gstDocUrl = gstDocUrl ? String(gstDocUrl).trim() : null;
    if (chequeDocUrl !== undefined) updateData.chequeDocUrl = chequeDocUrl ? String(chequeDocUrl).trim() : null;
    if (tradeLicenseDocUrl !== undefined) updateData.tradeLicenseDocUrl = tradeLicenseDocUrl ? String(tradeLicenseDocUrl).trim() : null;

    // Handle KYC Status update (if submitted explicitly, or if documents uploaded)
    if (kycStatus !== undefined) {
      updateData.kycStatus = kycStatus;
    } else if (
      (panDocUrl || aadharDocUrl || shopPhotoUrl || gstDocUrl || chequeDocUrl) &&
      (vendor.kycStatus === "pending" || vendor.kycStatus === "rejected")
    ) {
      updateData.kycStatus = "submitted";
    }

    // F1: GPS coordinate update from body
    const { latitude, longitude, locationAccuracy, autoAcceptOrders, serviceAreaRadiusKm } = body;
    if (latitude !== undefined && longitude !== undefined) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        updateData.latitude = lat;
        updateData.longitude = lng;
        if (locationAccuracy !== undefined) updateData.locationAccuracy = Number(locationAccuracy);
      }
    }
    // F3: Per-vendor auto-accept toggle
    if (autoAcceptOrders !== undefined) updateData.autoAcceptOrders = Boolean(autoAcceptOrders);
    if (serviceAreaRadiusKm !== undefined) {
      updateData.serviceAreaRadiusKm = Math.max(1, Math.min(50, Number(serviceAreaRadiusKm)));
    }

    const updatedVendor = await prisma.vendor.update({
      where: { id: vendor.id },
      data: updateData,
    });

    // Also update underlying user record name/phone/avatar safely
    try {
      const userUpdateData: any = {};
      if (businessName !== undefined) userUpdateData.name = String(businessName).trim();
      if (logo !== undefined) userUpdateData.avatar = logo ? String(logo).trim() : null;

      if (cleanPhone && cleanPhone !== user.phone) {
        // Only attempt to update User.phone if no other user holds this phone number
        const phoneOwner = await prisma.user.findFirst({
          where: {
            phone: cleanPhone,
            id: { not: user.id },
          },
          select: { id: true },
        });

        if (!phoneOwner) {
          userUpdateData.phone = cleanPhone;
        } else {
          console.warn(
            `[Mobile Vendor Profile] Phone ${cleanPhone} is already registered to user ${phoneOwner.id}. Skipping User.phone update while keeping Vendor.contactPhone updated.`
          );
        }
      }

      if (Object.keys(userUpdateData).length > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: userUpdateData,
        });
      }
    } catch (userErr: any) {
      console.warn("[Mobile Vendor Profile] Could not update associated User record:", userErr?.message);
    }

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
