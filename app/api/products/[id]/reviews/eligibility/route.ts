import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getEligibleOrdersForReview } from "@/lib/reviews-server";
import { prisma } from "@/lib/prisma";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthenticatedUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, eligible: false, eligibleOrders: [], error: "Authentication required" },
        { status: 401 }
      );
    }

    // Resolve product if passed as slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, eligible: false, eligibleOrders: [], error: "Product not found" },
        { status: 404 }
      );
    }

    const eligibility = await getEligibleOrdersForReview(
      user.id,
      product.id,
      user.phone,
      user.email
    );

    const res = NextResponse.json({
      success: true,
      productId: product.id,
      productName: product.name,
      eligible: eligibility.eligible,
      eligibleOrders: eligibility.eligibleOrders,
    });

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id, X-User-Phone");
    return res;
  } catch (error: any) {
    console.error("[GET /api/products/:id/reviews/eligibility Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to check review eligibility" },
      { status: 500 }
    );
  }
}
