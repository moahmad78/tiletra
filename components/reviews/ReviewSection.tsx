"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Star,
  Camera,
  Edit3,
  Loader2,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import ReviewCard, { ReviewCardItem } from "./ReviewCard";
import WriteReviewModal from "./WriteReviewModal";

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export default function ReviewSection({
  productId,
  productName,
}: ReviewSectionProps) {
  const { user } = useAuthStore();

  const [reviews, setReviews] = useState<ReviewCardItem[]>([]);
  const [stats, setStats] = useState({
    avgRating: 0,
    reviewCount: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  });
  const [loading, setLoading] = useState(true);
  const [isEligible, setIsEligible] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | undefined>(undefined);

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "media" | "5" | "4" | "3" | "2" | "1">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Fetch reviews from API
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/products/${productId}/reviews?sort=${sortBy}&limit=50`
      );
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, sortBy]);

  // Check buyer review eligibility
  const checkEligibility = useCallback(async () => {
    if (!user) {
      setIsEligible(false);
      return;
    }
    try {
      const res = await fetch(`/api/products/${productId}/reviews/eligibility`, {
        headers: {
          "x-user-id": user.id,
          "x-user-phone": user.phone || "",
        },
      });
      const data = await res.json();
      if (data.success && data.eligible && data.eligibleOrders.length > 0) {
        setIsEligible(true);
        setEligibleOrderId(data.eligibleOrders[0].id);
      } else {
        setIsEligible(false);
      }
    } catch (err) {
      console.error("Error checking review eligibility:", err);
      setIsEligible(false);
    }
  }, [productId, user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  // Client-side filtering
  const displayedReviews = reviews.filter((r) => {
    if (filterType === "media") {
      const hasMedia = (r.media && r.media.length > 0) || (r.images && r.images.length > 0);
      return hasMedia;
    }
    if (["5", "4", "3", "2", "1"].includes(filterType)) {
      return r.rating === parseInt(filterType, 10);
    }
    return true;
  });

  const totalCount = stats.reviewCount || reviews.length;
  const ratingValue = stats.avgRating || (totalCount > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 0);

  return (
    <div className="space-y-6 pt-4">
      {/* Section Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#052a51] tracking-tight">
            Customer Ratings & Reviews
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified buyer feedback and installation photos
          </p>
        </div>

        {isEligible && (
          <button
            onClick={() => setWriteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
          >
            <Edit3 size={15} />
            <span>Write a Review</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={30} />
          <p className="text-xs font-bold text-[#052a51]">Loading verified customer reviews...</p>
        </div>
      ) : totalCount === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200/80 shadow-2xs space-y-4">
          <div className="w-14 h-14 bg-[#052a51]/5 rounded-2xl flex items-center justify-center mx-auto text-[#052a51]">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#052a51]">No customer reviews yet</h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
              Have you purchased this product? Once your order is delivered, you can share your feedback and installation photos!
            </p>
          </div>
          {isEligible && (
            <button
              onClick={() => setWriteModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              <Edit3 size={14} />
              <span>Be the first to review</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── Top Summary & Rating Breakdown ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left: Overall Score */}
              <div className="md:col-span-4 text-center md:text-left md:border-r md:border-gray-100 md:pr-8">
                <h3 className="text-4xl sm:text-5xl font-black text-[#052a51] tracking-tight leading-none">
                  {ratingValue}
                  <span className="text-xl text-gray-400 font-bold"> / 5</span>
                </h3>

                <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500 my-2.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={
                        i < Math.round(Number(ratingValue))
                          ? "fill-amber-500 text-amber-500"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>

                <p className="text-xs text-gray-500 font-medium">
                  Based on <strong>{totalCount} verified {totalCount === 1 ? "review" : "reviews"}</strong>
                </p>
              </div>

              {/* Right: Rating Distribution Bars */}
              <div className="md:col-span-8 space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.distribution[star] || 0;
                  const percent = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                  return (
                    <div key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-bold text-[#052a51] shrink-0">{star} ★</span>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            star >= 4 ? "bg-[#F26522]" : "bg-amber-400"
                          }`}
                        />
                      </div>
                      <span className="w-12 text-right text-gray-400 font-medium text-[11px] shrink-0">
                        {count} ({percent}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Filter & Sort Toolbar ── */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === "all"
                    ? "bg-[#052a51] text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                onClick={() => setFilterType("media")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  filterType === "media"
                    ? "bg-[#052a51] text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Camera size={13} />
                <span>Photos & Videos</span>
              </button>
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  onClick={() => setFilterType(String(star) as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterType === String(star)
                      ? "bg-[#052a51] text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {star} ★
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-gray-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* ── Reviews Cards List ── */}
          <div className="space-y-4">
            {displayedReviews.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 text-gray-400 text-xs">
                No reviews match the selected filter.
              </div>
            ) : (
              displayedReviews.map((rev) => (
                <ReviewCard key={rev.id} review={rev} />
              ))
            )}
          </div>
        </>
      )}

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={productId}
        productName={productName}
        orderId={eligibleOrderId}
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
        onSuccess={() => {
          fetchReviews();
          checkEligibility();
        }}
      />
    </div>
  );
}
