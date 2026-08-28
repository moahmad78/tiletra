import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        products: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        splits: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor) {
      return mobileApiResponse({ success: false, error: "Vendor not found" }, 404);
    }

    return mobileApiResponse({ success: true, vendor });
  } catch (err: any) {
    console.error("Mobile admin vendor detail error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendor" },
      500
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json();
    const { status, commissionRate, verified, deliveryMethod } = body;

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (commissionRate !== undefined) data.commissionRate = Number(commissionRate);
    if (verified !== undefined) data.kycStatus = verified ? "verified" : "pending";
    if (deliveryMethod !== undefined) data.deliveryMethod = deliveryMethod;

    const updated = await prisma.vendor.update({
      where: { id },
      data,
    });

    return mobileApiResponse({
      success: true,
      message: `Vendor updated successfully`,
      vendor: updated,
    });
  } catch (err: any) {
    console.error("Mobile admin vendor update error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to update vendor" },
      500
    );
  }
}
