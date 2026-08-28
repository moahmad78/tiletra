import { NextRequest } from "next/server";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";
import { getVendorApplications } from "@/lib/actions/vendor-application";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status") || "all";

    const applications = await getVendorApplications({
      status,
      search,
    });

    // Compute stats
    const total = applications.length;
    const pendingCount = applications.filter(
      (a) => a.status === "new_inquiry" || a.status === "contacted"
    ).length;

    return mobileApiResponse({
      success: true,
      applications: applications.map((app) => ({
        id: app.id,
        businessName: app.businessName,
        ownerName: app.ownerName,
        phone: app.phone,
        email: app.email,
        category: app.category,
        address: app.address,
        description: app.description,
        aadharDocUrl: app.aadharDocUrl,
        panDocUrl: app.panDocUrl,
        shopPhotoUrl: app.shopPhotoUrl,
        status: app.status,
        internalNotes: app.internalNotes,
        rejectionReason: app.rejectionReason,
        vendorId: app.vendorId,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
      })),
      total,
      pendingCount,
    });
  } catch (error: any) {
    console.error("[Mobile Admin Vendor Applications Error]", error);
    return mobileApiResponse(
      { success: false, error: error?.message || "Failed to fetch vendor applications" },
      500
    );
  }
}
