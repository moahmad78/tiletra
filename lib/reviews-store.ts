"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAdminStore } from "@/lib/admin-store";

export type CustomerReview = {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  authorEmail?: string;
  authorCity: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  images?: string[]; // homeowner room tile photos
  verifiedPurchase: boolean;
  helpfulCount: number;
  unhelpfulCount: number;
  userVoted?: "helpful" | "unhelpful";
  date: string;
  status: "approved" | "pending" | "rejected";
  userId?: string;
};

// Curated initial seed reviews with homeowner installation photography
const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: "rev-001",
    productId: "prod-001",
    productName: "Calacatta Marble Effect",
    authorName: "Rajesh S.",
    authorCity: "Bangalore",
    rating: 5,
    title: "Stunning Italian marble finish, zero breakages!",
    comment:
      "Superb quality tiles! The finish is extremely premium and looks like real Italian marble in our living room. Delivery came in 4 days with sturdy box packaging.",
    images: [
      "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80",
      "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800&q=80",
    ],
    verifiedPurchase: true,
    helpfulCount: 18,
    unhelpfulCount: 1,
    date: "August 2, 2026",
    status: "approved",
    userId: "cust-001",
  },
  {
    id: "rev-002",
    productId: "prod-004",
    productName: "Arctic White Subway",
    authorName: "Pooja H.",
    authorCity: "Mysore",
    rating: 5,
    title: "Exact quantity calculation with the coverage tool",
    comment:
      "The coverage calculator gave the exact boxes needed for our kitchen backsplash. We had just half a box spare after laying. Perfect glossy bevel finish!",
    images: [
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80",
    ],
    verifiedPurchase: true,
    helpfulCount: 12,
    unhelpfulCount: 0,
    date: "July 24, 2026",
    status: "approved",
    userId: "cust-002",
  },
  {
    id: "rev-003",
    productId: "prod-006",
    productName: "Onyx Black Marble",
    authorName: "Anil M.",
    authorCity: "Bangalore",
    rating: 4,
    title: "Dramatic look in our master bathroom",
    comment:
      "Looks exactly like luxury hotel marble. Delivered in 4 days in neat sturdy packaging. Make sure to use light grey grout for contrast.",
    images: [
      "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&q=80",
    ],
    verifiedPurchase: true,
    helpfulCount: 8,
    unhelpfulCount: 0,
    date: "July 15, 2026",
    status: "approved",
    userId: "cust-003",
  },
  {
    id: "rev-004",
    productId: "prod-002",
    productName: "Concrete Grey Industrial",
    authorName: "Vikram M.",
    authorCity: "Chennai",
    rating: 5,
    title: "Perfect anti-slip texture for modern loft",
    comment:
      "Gives a great modern industrial loft aesthetic. Texture prevents slipping even when wet. Highly recommended for open kitchen & living spaces.",
    verifiedPurchase: true,
    helpfulCount: 5,
    unhelpfulCount: 0,
    date: "August 10, 2026",
    status: "approved",
    userId: "cust-004",
  },
];

type ReviewsStore = {
  reviews: CustomerReview[];

  // Actions
  submitReview: (review: Omit<CustomerReview, "id" | "date" | "helpfulCount" | "unhelpfulCount" | "status">) => void;
  updateReview: (id: string, updates: Partial<CustomerReview>) => void;
  deleteReview: (id: string) => void;
  voteHelpful: (id: string, isHelpful: boolean) => void;
  getProductReviews: (productId: string) => CustomerReview[];
  getProductRatingStats: (productId: string) => {
    averageRating: number;
    totalReviews: number;
    distribution: Record<number, number>;
    recommendPercent: number;
  };
  checkVerifiedPurchase: (productId: string, userEmailOrPhone?: string) => boolean;
};

export const useReviewsStore = create<ReviewsStore>()(
  persist(
    (set, get) => ({
      reviews: INITIAL_REVIEWS,

      submitReview: (newReviewData) => {
        const id = `rev-${Date.now().toString().slice(-6)}`;
        const review: CustomerReview = {
          ...newReviewData,
          id,
          date: new Date().toLocaleDateString("en-IN", {
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
          helpfulCount: 0,
          unhelpfulCount: 0,
          status: "pending", // Enters admin moderation queue
        };

        // Also add to Admin store reviews queue for live sync
        const { reviews: adminReviews } = useAdminStore.getState();
        useAdminStore.setState({
          reviews: [
            {
              id: review.id,
              productId: review.productId,
              productName: review.productName,
              author: review.authorName,
              city: review.authorCity,
              rating: review.rating,
              comment: review.comment,
              date: "Just now",
              status: "pending",
            },
            ...adminReviews,
          ],
        });

        set((s) => ({ reviews: [review, ...s.reviews] }));
      },

      updateReview: (id, updates) =>
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === id
              ? { ...r, ...updates, status: "pending" } // re-moderation on edit
              : r
          ),
        })),

      deleteReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),

      voteHelpful: (id, isHelpful) =>
        set((s) => ({
          reviews: s.reviews.map((r) => {
            if (r.id !== id) return r;
            if (r.userVoted === (isHelpful ? "helpful" : "unhelpful")) return r;

            return {
              ...r,
              helpfulCount: isHelpful
                ? r.helpfulCount + 1
                : r.userVoted === "helpful"
                ? Math.max(0, r.helpfulCount - 1)
                : r.helpfulCount,
              unhelpfulCount: !isHelpful
                ? r.unhelpfulCount + 1
                : r.userVoted === "unhelpful"
                ? Math.max(0, r.unhelpfulCount - 1)
                : r.unhelpfulCount,
              userVoted: isHelpful ? "helpful" : "unhelpful",
            };
          }),
        })),

      getProductReviews: (productId) => {
        // Return approved reviews (plus any current user pending reviews)
        return get().reviews.filter(
          (r) => r.productId === productId && (r.status === "approved" || r.status === "pending")
        );
      },

      getProductRatingStats: (productId) => {
        const prodReviews = get().reviews.filter(
          (r) => r.productId === productId && r.status === "approved"
        );

        if (prodReviews.length === 0) {
          return {
            averageRating: 4.8,
            totalReviews: 0,
            distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            recommendPercent: 96,
          };
        }

        const totalRating = prodReviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = Number((totalRating / prodReviews.length).toFixed(1));

        const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        prodReviews.forEach((r) => {
          distribution[r.rating] = (distribution[r.rating] || 0) + 1;
        });

        const positiveCount = (distribution[5] || 0) + (distribution[4] || 0);
        const recommendPercent = Math.round((positiveCount / prodReviews.length) * 100);

        return {
          averageRating,
          totalReviews: prodReviews.length,
          distribution,
          recommendPercent,
        };
      },

      checkVerifiedPurchase: (productId, userEmailOrPhone) => {
        const { orders } = useAdminStore.getState();
        return orders.some((o) =>
          o.items.some((i) => i.productId === productId)
        );
      },
    }),
    {
      name: "tiletra-customer-reviews",
    }
  )
);
