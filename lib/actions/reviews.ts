"use server";

import { prisma } from "@/lib/prisma";
import { safeRevalidate } from "@/lib/formatters";

export async function getReviews(options?: {
  productId?: string;
  status?: string;
}) {
  try {
    const where: any = {};
    if (options?.productId) {
      where.productId = options.productId;
    }
    if (options?.status && options.status !== "all") {
      where.status = options.status;
    }

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return reviews;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export async function getApprovedReviewsForProduct(productId: string) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: "approved",
      },
      orderBy: { createdAt: "desc" },
    });

    return reviews;
  } catch (error) {
    console.error(`Error fetching reviews for product ${productId}:`, error);
    return [];
  }
}

export async function createReview(data: {
  productId: string;
  productName: string;
  author: string;
  rating: number;
  comment: string;
  city?: string;
  verifiedPurchase?: boolean;
}) {
  try {
    const review = await prisma.review.create({
      data: {
        productId: data.productId,
        productName: data.productName,
        author: data.author,
        rating: data.rating,
        comment: data.comment,
        date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        city: data.city || "Bangalore",
        verifiedPurchase: Boolean(data.verifiedPurchase),
        status: "pending",
      },
    });

    safeRevalidate("/admin/reviews");
    safeRevalidate(`/product/${data.productId}`);

    return { success: true, review };
  } catch (error: any) {
    console.error("Error creating review:", error);
    return { success: false, error: error?.message || "Failed to submit review" };
  }
}

export async function updateReviewStatus(id: string, status: "approved" | "rejected" | "pending") {
  try {
    const review = await prisma.review.update({
      where: { id },
      data: { status },
    });

    // Update product rating aggregate if approved
    if (status === "approved") {
      const approvedReviews = await prisma.review.findMany({
        where: { productId: review.productId, status: "approved" },
      });
      const avgRating =
        approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;

      await prisma.product.update({
        where: { id: review.productId },
        data: {
          rating: Number(avgRating.toFixed(1)),
          reviewCount: approvedReviews.length,
        },
      });
    }

    safeRevalidate("/admin/reviews");
    safeRevalidate(`/product/${review.productId}`);
    safeRevalidate("/shop");
    safeRevalidate("/");
    safeRevalidate("/account/reviews");

    return { success: true, review };
  } catch (error: any) {
    console.error("Error updating review status:", error);
    return { success: false, error: error?.message || "Failed to update review" };
  }
}

export async function deleteReview(id: string) {
  try {
    const review = await prisma.review.findUnique({ where: { id } });
    await prisma.review.delete({ where: { id } });

    safeRevalidate("/admin/reviews");
    if (review?.productId) safeRevalidate(`/product/${review.productId}`);
    safeRevalidate("/shop");
    safeRevalidate("/");
    safeRevalidate("/account/reviews");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return { success: false, error: error?.message || "Failed to delete review" };
  }
}
