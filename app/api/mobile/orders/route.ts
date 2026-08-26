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

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(30, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where: {
          OR: [{ userId: user.id }, { customerPhone: user.phone }, { customerEmail: user.email || undefined }],
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: true,
                  unitOfSale: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({
        where: {
          OR: [{ userId: user.id }, { customerPhone: user.phone }, { customerEmail: user.email || undefined }],
        },
      }),
    ]);

    return mobileApiResponse({
      success: true,
      orders,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err: any) {
    console.error("Mobile orders list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch orders" },
      500
    );
  }
}
