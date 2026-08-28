import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedAdmin, mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

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

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { contactPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const vendors = await prisma.vendor.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            products: true,
            splits: true,
          },
        },
      },
    });

    return mobileApiResponse({
      success: true,
      vendors: vendors.map((v) => ({
        id: v.id,
        businessName: v.businessName,
        slug: v.slug,
        category: v.category,
        status: v.status,
        contactEmail: v.contactEmail,
        contactPhone: v.contactPhone,
        businessAddress: v.businessAddress,
        commissionRate: v.commissionRate,
        verified: v.kycStatus === "verified",
        productsCount: v._count.products,
        ordersCount: v._count.splits,
        createdAt: v.createdAt,
      })),
      count: vendors.length,
    });
  } catch (err: any) {
    console.error("Mobile admin vendors list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch vendors" },
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin(req);
    if ("error" in auth) {
      return mobileApiResponse({ success: false, error: auth.error }, auth.status);
    }

    const body = await req.json().catch(() => ({}));
    const { createVendorManually } = await import("@/lib/actions/admin-vendor");
    const result = await createVendorManually(body);

    if (!result.success) {
      return mobileApiResponse({ success: false, error: result.error }, 400);
    }

    return mobileApiResponse({
      success: true,
      vendor: result.vendor,
      plainPassword: (result as any).plainPassword,
      message: result.message || "Vendor onboarded successfully!",
    });
  } catch (err: any) {
    console.error("Mobile admin manual vendor creation error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to create vendor" },
      500
    );
  }
}
