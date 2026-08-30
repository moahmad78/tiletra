import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Recomputes the denormalized avgRating and reviewCount for a product
 * based exclusively on PUBLISHED reviews.
 * Can run inside an existing Prisma transaction or standalone.
 */
export async function syncProductRatingAggregate(
  productId: string,
  txPrisma?: any
): Promise<{ avgRating: number; reviewCount: number }> {
  const db = txPrisma || prisma;

  const aggregate = await db.review.aggregate({
    where: {
      productId,
      status: "PUBLISHED",
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  });

  const rawAvg = aggregate._avg.rating || 0;
  const reviewCount = aggregate._count.id || 0;
  const avgRating = reviewCount > 0 ? Number(rawAvg.toFixed(1)) : 0;

  await db.product.update({
    where: { id: productId },
    data: {
      avgRating,
      reviewCount,
      // Keep legacy rating aligned for backwards compatibility if needed
      rating: avgRating > 0 ? avgRating : 4.8,
    },
  });

  return { avgRating, reviewCount };
}

/**
 * Checks which delivered orders containing this productId belong to the user
 * and have not yet been reviewed.
 */
export async function getEligibleOrdersForReview(
  userId: string,
  productId: string,
  userPhone?: string | null,
  userEmail?: string | null
) {
  // Normalize phone for comparison
  const cleanPhone = userPhone ? userPhone.replace(/\D/g, "").slice(-10) : "";

  // 1. Fetch all delivered orders for this user
  const deliveredOrders = await prisma.order.findMany({
    where: {
      OR: [
        { userId: userId },
        ...(cleanPhone ? [{ customerPhone: { contains: cleanPhone } }] : []),
        ...(userEmail ? [{ customerEmail: { equals: userEmail, mode: "insensitive" as const } }] : []),
      ],
      orderStatus: {
        in: ["Delivered", "DELIVERED", "delivered"],
      },
      items: {
        some: {
          productId: productId,
        },
      },
    },
    select: {
      id: true,
      orderStatus: true,
      deliveredAt: true,
      createdAt: true,
      items: {
        where: { productId: productId },
        select: {
          id: true,
          productId: true,
          productName: true,
          variantDetails: true,
          boxQuantity: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (deliveredOrders.length === 0) {
    return { eligible: false, eligibleOrders: [] };
  }

  // 2. Fetch existing reviews by this user for this product
  const existingReviews = await prisma.review.findMany({
    where: {
      userId,
      productId,
    },
    select: {
      orderId: true,
    },
  });

  const reviewedOrderIds = new Set(existingReviews.map((r) => r.orderId));

  // 3. Filter orders that have not yet been reviewed
  const eligibleOrders = deliveredOrders.filter((o) => !reviewedOrderIds.has(o.id));

  return {
    eligible: eligibleOrders.length > 0,
    eligibleOrders,
  };
}

/**
 * Revalidates all relevant Next.js cache paths when reviews change.
 */
export function revalidateReviewPaths(productId: string, productSlug?: string) {
  try {
    if (productSlug) {
      revalidatePath(`/product/${productSlug}`);
    }
    revalidatePath(`/product/${productId}`);
    revalidatePath(`/shop`);
    revalidatePath(`/`);
    revalidatePath(`/account/orders`);
    revalidatePath(`/admin/reviews`);
  } catch (err) {
    console.warn("revalidateReviewPaths warning:", err);
  }
}
