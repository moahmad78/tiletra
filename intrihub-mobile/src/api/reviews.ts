import { apiClient } from "./client";

export interface ReviewMedia {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string | null;
}

export interface ReviewItem {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  author: string;
  authorAvatar?: string | null;
  verifiedPurchase: boolean;
  createdAt: string;
  media: ReviewMedia[];
}

export interface ProductReviewsResponse {
  success: boolean;
  reviews: ReviewItem[];
  total: number;
  page: number;
  totalPages: number;
  stats: {
    avgRating: number;
    reviewCount: number;
    distribution: Record<number, number>;
  };
  error?: string;
}

export async function getProductReviews(
  productId: string,
  sort: "newest" | "highest" | "lowest" = "newest"
): Promise<ProductReviewsResponse> {
  try {
    const res = await apiClient.get<ProductReviewsResponse>(
      `/api/products/${productId}/reviews?sort=${sort}&limit=50`
    );
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      reviews: [],
      total: 0,
      page: 1,
      totalPages: 0,
      stats: {
        avgRating: 0,
        reviewCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      error: err?.response?.data?.error || err?.message || "Failed to fetch reviews",
    };
  }
}

export async function checkReviewEligibility(productId: string) {
  try {
    const res = await apiClient.get<{
      success: boolean;
      productId: string;
      productName: string;
      eligible: boolean;
      eligibleOrders: Array<{
        id: string;
        orderStatus: string;
        createdAt: string;
        items: any[];
      }>;
      error?: string;
    }>(`/api/products/${productId}/reviews/eligibility`);
    return res.data;
  } catch (err: any) {
    return {
      success: false,
      eligible: false,
      eligibleOrders: [],
      error: err?.response?.data?.error || err?.message,
    };
  }
}

export async function createReview(data: {
  productId: string;
  orderId: string;
  rating: number;
  title?: string;
  body: string;
}) {
  const res = await apiClient.post<{
    success: boolean;
    review?: any;
    stats?: any;
    error?: string;
    message?: string;
  }>("/api/reviews", data);
  return res.data;
}

export async function uploadReviewMedia(
  reviewId: string,
  mediaFiles: Array<{ uri: string; name: string; type: string }>
) {
  const formData = new FormData();
  mediaFiles.forEach((f) => {
    formData.append("files", {
      uri: f.uri,
      name: f.name,
      type: f.type,
    } as any);
  });

  const res = await apiClient.post<{
    success: boolean;
    media?: ReviewMedia[];
    error?: string;
  }>(`/api/reviews/${reviewId}/media`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}
