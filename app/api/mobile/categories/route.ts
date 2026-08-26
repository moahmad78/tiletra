import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      orderBy: { order: "asc" },
      include: {
        children: {
          orderBy: { order: "asc" },
          include: {
            _count: {
              select: { products: { where: { status: "active", approvalStatus: "approved" } } },
            },
          },
        },
        _count: {
          select: { products: { where: { status: "active", approvalStatus: "approved" } } },
        },
      },
    });

    // Also fetch banners for category / home carousel
    const banners = await prisma.offerBanner.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    return mobileApiResponse({
      success: true,
      categories,
      banners,
    });
  } catch (err: any) {
    console.error("Mobile categories error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch categories" },
      500
    );
  }
}
