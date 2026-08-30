"use server";

import { prisma } from "@/lib/prisma";
import { syncProductRatingAggregate, revalidateReviewPaths } from "@/lib/reviews-server";

export interface ReviewResponseItem {
  id: string;
  productId: string;
  orderId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: "PUBLISHED" | "HIDDEN";
  hiddenReason: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user: {
    name: string | null;
    avatar: string | null;
  };
  product?: {
    id: string;
    name: string;
    slug: string;
    images: string[];
    avgRating: number | null;
    reviewCount: number;
  };
  media: Array<{
    id: string;
    type: "IMAGE" | "VIDEO";
    url: string;
    thumbnailUrl: string | null;
  }>;
}

/**
 * Public action to fetch published reviews for a product
 */
export async function getPublishedReviewsForProduct(
  productId: string,
  options?: {
    page?: number;
    limit?: number;
    sort?: "newest" | "highest" | "lowest";
  }
) {
  try {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(50, Math.max(1, options?.limit || 10));
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: "desc" };
    if (options?.sort === "highest") {
      orderBy = [{ rating: "desc" }, { createdAt: "desc" }];
    } else if (options?.sort === "lowest") {
      orderBy = [{ rating: "asc" }, { createdAt: "desc" }];
    }

    // Lookup product by ID or slug
    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id: productId }, { slug: productId }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        avgRating: true,
        reviewCount: true,
      },
    });

    if (!product) {
      return {
        reviews: [],
        total: 0,
        page,
        totalPages: 0,
        stats: {
          avgRating: 0,
          reviewCount: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      };
    }

    const [reviews, total, allRatings] = await Promise.all([
      prisma.review.findMany({
        where: {
          productId: product.id,
          status: "PUBLISHED",
        },
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              name: true,
              avatar: true,
            },
          },
          media: {
            select: {
              id: true,
              type: true,
              url: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: {
          productId: product.id,
          status: "PUBLISHED",
        },
      }),
      prisma.review.findMany({
        where: {
          productId: product.id,
          status: "PUBLISHED",
        },
        select: {
          rating: true,
        },
      }),
    ]);

    // Calculate rating distribution
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sumRating = 0;
    allRatings.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      sumRating += r.rating;
    });

    const computedAvg = total > 0 ? Number((sumRating / total).toFixed(1)) : 0;

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        avgRating: product.avgRating ?? computedAvg,
        reviewCount: product.reviewCount || total,
        distribution,
      },
    };
  } catch (error) {
    console.error("Error fetching published reviews:", error);
    return {
      reviews: [],
      total: 0,
      page: 1,
      totalPages: 0,
      stats: {
        avgRating: 0,
        reviewCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    };
  }
}

/**
 * Admin action to fetch all reviews with status filtering
 */
export async function getAdminReviews(options?: {
  status?: string;
  productId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.min(100, Math.max(1, options?.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.status && options.status !== "all") {
      where.status = options.status.toUpperCase();
    }
    if (options?.productId) {
      where.productId = options.productId;
    }
    if (options?.search) {
      const q = options.search.trim();
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
        { product: { name: { contains: q, mode: "insensitive" } } },
        { user: { name: { contains: q, mode: "insensitive" } } },
        { user: { phone: { contains: q } } },
      ];
    }

    const [reviews, total, publishedCount, hiddenCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
              categoryName: true,
            },
          },
          order: {
            select: {
              id: true,
              orderStatus: true,
              deliveredAt: true,
              createdAt: true,
            },
          },
          media: true,
        },
      }),
      prisma.review.count({ where }),
      prisma.review.count({ where: { status: "PUBLISHED" } }),
      prisma.review.count({ where: { status: "HIDDEN" } }),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      counts: {
        all: publishedCount + hiddenCount,
        published: publishedCount,
        hidden: hiddenCount,
      },
    };
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return {
      reviews: [],
      total: 0,
      page: 1,
      totalPages: 0,
      counts: { all: 0, published: 0, hidden: 0 },
    };
  }
}

/**
 * Admin action: Hide review with reason
 */
export async function hideReviewByAdmin(id: string, reason: string) {
  try {
    if (!reason || !reason.trim()) {
      return { success: false, error: "A reason is required to hide a review." };
    }

    const review = await prisma.review.update({
      where: { id },
      data: {
        status: "HIDDEN",
        hiddenReason: reason.trim(),
      },
      include: {
        product: { select: { id: true, slug: true } },
      },
    });

    await syncProductRatingAggregate(review.productId);
    revalidateReviewPaths(review.productId, review.product?.slug);

    return { success: true, review };
  } catch (error: any) {
    console.error("Error hiding review:", error);
    return { success: false, error: error?.message || "Failed to hide review" };
  }
}

/**
 * Admin action: Restore review (publish)
 */
export async function restoreReviewByAdmin(id: string) {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        hiddenReason: null,
      },
      include: {
        product: { select: { id: true, slug: true } },
      },
    });

    await syncProductRatingAggregate(review.productId);
    revalidateReviewPaths(review.productId, review.product?.slug);

    return { success: true, review };
  } catch (error: any) {
    console.error("Error restoring review:", error);
    return { success: false, error: error?.message || "Failed to restore review" };
  }
}

/**
 * Delete review (owner or admin)
 */
export async function deleteReviewAction(id: string) {
  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, slug: true } },
      },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    await prisma.review.delete({
      where: { id },
    });

    await syncProductRatingAggregate(review.productId);
    revalidateReviewPaths(review.productId, review.product?.slug);

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return { success: false, error: error?.message || "Failed to delete review" };
  }
}
