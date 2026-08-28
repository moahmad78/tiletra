import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import {
  createVendorFromApplication,
  updateVendorApplication,
} from "@/lib/actions/vendor-application";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const application = await prisma.vendorApplication.findUnique({
      where: { id },
    });

    if (!application) {
      return mobileApiResponse({ success: false, error: "Application not found" }, 404);
    }

    return mobileApiResponse({
      success: true,
      application,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Vendor Application Detail Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch application" },
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { action, status, rejectionReason, internalNotes, commissionRate, customPassword, gstNumber } = body;

    // Action: Approve & Convert Application ➔ Live Vendor Account
    if (action === "approve" || status === "converted") {
      const res = await createVendorFromApplication(id, {
        commissionRate: commissionRate !== undefined ? Number(commissionRate) : undefined,
        customPassword: customPassword || undefined,
        gstNumber: gstNumber || undefined,
      });

      if (!res.success) {
        return mobileApiResponse({ success: false, error: res.error }, 400);
      }

      return mobileApiResponse({
        success: true,
        message: res.message || "Vendor approved successfully!",
        vendor: res.vendor,
        credentials: res.credentials,
      });
    }

    // Action: Reject Application
    if (action === "reject" || status === "rejected") {
      const res = await updateVendorApplication(id, {
        status: "rejected",
        rejectionReason: rejectionReason || "Application did not meet seller criteria.",
        internalNotes,
      });

      if (!res.success) {
        return mobileApiResponse({ success: false, error: res.error }, 400);
      }

      return mobileApiResponse({
        success: true,
        message: "Application rejected.",
        application: res.application,
      });
    }

    // General status update (e.g. contacted, internal notes)
    const res = await updateVendorApplication(id, {
      status,
      internalNotes,
      rejectionReason,
    });

    if (!res.success) {
      return mobileApiResponse({ success: false, error: res.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      message: "Application updated successfully",
      application: res.application,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Vendor Application Update Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to update vendor application" },
      500
    );
  }
}
