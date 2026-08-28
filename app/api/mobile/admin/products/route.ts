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
    const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
        { categorySlug: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    });

    return mobileApiResponse({
      success: true,
      products: products.map((p) => {
        const estPricePerBox = Math.round((p.pricePerSqft || 45) * (p.coverageRate || 19.36));
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          categorySlug: p.categorySlug,
          categoryName: p.categoryName || p.categorySlug,
          pricePerSqft: p.pricePerSqft,
          pricePerBox: estPricePerBox,
          mrp: p.mrp || Math.round(estPricePerBox * 1.3),
          stockBoxes: p.inStock ? 250 : 0,
          status: p.status,
          featured: p.isTrending || p.isBestseller,
          images: p.images,
          vendorName: p.vendor?.businessName || "Direct / Admin",
          vendorId: p.vendorId,
          createdAt: p.createdAt,
        };
      }),
      count: products.length,
    });
  } catch (err: any) {
    console.error("Mobile admin products list error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch products" },
      500
    );
  }
}
