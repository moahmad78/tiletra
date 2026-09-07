"use server";

import { prisma } from "@/lib/prisma";

export type OnboardingProgress = {
  hasProfile: boolean;          // logo + description both non-empty
  hasBankDetails: boolean;      // bankAccountNumber set
  hasFirstProduct: boolean;     // at least 1 product uploaded (any status)
  hasApprovedProduct: boolean;  // at least 1 product with approvalStatus = 'approved'
  hasFirstOrder: boolean;       // at least 1 VendorOrderSplit exists
};

export async function getVendorOnboardingProgress(
  vendorId: string
): Promise<OnboardingProgress> {
  const empty: OnboardingProgress = {
    hasProfile: false,
    hasBankDetails: false,
    hasFirstProduct: false,
    hasApprovedProduct: false,
    hasFirstOrder: false,
  };

  if (!vendorId) return empty;

  try {
    const [vendor, firstProduct, approvedProduct, firstOrder] =
      await Promise.all([
        prisma.vendor.findUnique({
          where: { id: vendorId },
          select: {
            logo: true,
            description: true,
            bankAccountNumber: true,
          },
        }),
        prisma.product.findFirst({
          where: { vendorId },
          select: { id: true },
        }),
        prisma.product.findFirst({
          where: { vendorId, approvalStatus: "approved" },
          select: { id: true },
        }),
        prisma.vendorOrderSplit.findFirst({
          where: { vendorId },
          select: { id: true },
        }),
      ]);

    if (!vendor) return empty;

    return {
      hasProfile:
        !!vendor.logo?.trim() && !!vendor.description?.trim(),
      hasBankDetails: !!vendor.bankAccountNumber?.trim(),
      hasFirstProduct: !!firstProduct,
      hasApprovedProduct: !!approvedProduct,
      hasFirstOrder: !!firstOrder,
    };
  } catch (error) {
    console.error("Error fetching vendor onboarding progress:", error);
    return empty;
  }
}
