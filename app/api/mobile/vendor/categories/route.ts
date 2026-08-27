import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        popularFinishes: true,
        popularSizes: true,
      },
    });

    return mobileApiResponse({
      success: true,
      categories,
    });
  } catch (err: any) {
    console.error("Mobile categories error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch categories" },
      500
    );
  }
}
