import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { syncProductRatingAggregate, revalidateReviewPaths } from "@/lib/reviews-server";
import { handleMobileCorsOptions } from "@/lib/mobile-auth";

export async function OPTIONS() {
  return handleMobileCorsOptions();
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "You must be signed in to submit a review." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { productId, orderId, rating, title, body: reviewBody } = body;

    // Validate inputs
    if (!productId || !orderId) {
      return NextResponse.json(
        { success: false, error: "Product ID and Order ID are required." },
        { status: 400 }
      );
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, error: "Rating must be an integer between 1 and 5." },
        { status: 400 }
      );
    }

    // 1. Check Product exists
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      select: { id: true, name: true, slug: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found." },
        { status: 404 }
      );
    }

    const cleanPhone = user.phone ? user.phone.replace(/\D/g, "").slice(-10) : "";

    // 2. Validate Order: must be DELIVERED, must contain productId, must belong to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { userId: user.id },
          ...(cleanPhone ? [{ customerPhone: { contains: cleanPhone } }] : []),
          ...(user.email ? [{ customerEmail: { equals: user.email, mode: "insensitive" as const } }] : []),
        ],
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Verified purchase order not found for this user." },
        { status: 403 }
      );
    }

    const statusLower = (order.orderStatus || "").toLowerCase();
    if (!statusLower.includes("deliver")) {
      return NextResponse.json(
        {
          success: false,
          error: "Reviews can only be submitted once the order has been delivered.",
        },
        { status: 400 }
      );
    }

    const hasItem = order.items.some((i) => i.productId === product.id);
    if (!hasItem) {
      return NextResponse.json(
        {
          success: false,
          error: "This order does not contain the specified product.",
        },
        { status: 400 }
      );
    }

    // 3. Ensure user hasn't already reviewed this order + product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId_orderId: {
          userId: user.id,
          productId: product.id,
          orderId: order.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: "You have already reviewed this product for this order.",
        },
        { status: 409 }
      );
    }

    // 4. Create Review (Auto-published immediately)
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        userId: user.id,
        orderId: order.id,
        rating: Math.round(numericRating),
        title: title ? String(title).trim() : null,
        body: reviewBody ? String(reviewBody).trim() : null,
        status: "PUBLISHED",
      },
      include: {
        user: { select: { name: true, avatar: true } },
        media: true,
      },
    });

    // 5. Recompute aggregate rating and revalidate caches
    const updatedStats = await syncProductRatingAggregate(product.id);
    revalidateReviewPaths(product.id, product.slug);

    const res = NextResponse.json({
      success: true,
      review,
      stats: updatedStats,
      message: "Your review has been published!",
    });

    res.headers.set("Access-Control-Allow-Origin", "*");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id, X-User-Phone");
    return res;
  } catch (error: any) {
    console.error("[POST /api/reviews Error]", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to submit review" },
      { status: 500 }
    );
  }
}
