import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { mobileApiResponse, handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
        status: "active",
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logo: true,
            description: true,
            category: true,
          },
        },
        variants: true,
        attributes: true,
        reviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            calculatorType: true,
          },
        },
      },
    });

    if (!product) {
      return mobileApiResponse({ success: false, error: "Product not found" }, 404);
    }

    // Fetch related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        categorySlug: product.categorySlug,
        id: { not: product.id },
        status: "active",
        approvalStatus: "approved",
      },
      take: 6,
      select: {
        id: true,
        name: true,
        slug: true,
        images: true,
        pricePerSqft: true,
        mrp: true,
        unitOfSale: true,
        rating: true,
        reviewCount: true,
      },
    });

    return mobileApiResponse({
      success: true,
      product,
      relatedProducts,
    });
  } catch (err: any) {
    console.error("Mobile product details error:", err);
    return mobileApiResponse(
      { success: false, error: err.message || "Failed to fetch product details" },
      500
    );
  }
}
