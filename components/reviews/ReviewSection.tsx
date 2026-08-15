"use client";

import { useState } from "react";
import {
  Star,
  ShieldCheck,
  Camera,
  Edit3,
  Filter,
  ArrowUpDown,
  Sparkles,
} from "lucide-react";
import { useReviewsStore } from "@/lib/reviews-store";
import ReviewCard from "./ReviewCard";
import WriteReviewModal from "./WriteReviewModal";

interface ReviewSectionProps {
  productId: string;
  productName: string;
}

export default function ReviewSection({
  productId,
  productName,
}: ReviewSectionProps) {
  const { getProductReviews, getProductRatingStats } = useReviewsStore();

  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "photos">("all");
  const [sortBy, setSortBy] = useState<"recent" | "highest" | "lowest">("recent");

  const reviews = getProductReviews(productId);
  const stats = getProductRatingStats(productId);

  // Filter & sort logic
  let displayedReviews = reviews.filter((r) => {
    if (filterType === "photos") return r.images && r.images.length > 0;
    return true;
  });

  displayedReviews = [...displayedReviews].sort((a, b) => {
    if (sortBy === "highest") return b.rating - a.rating;
    if (sortBy === "lowest") return a.rating - b.rating;
    return 0; // default recent
  });

  return (
    <div className="space-y-8">
      {/* ── Top Summary & Rating Breakdown ── */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          {/* Left: Overall Score */}
          <div className="md:col-span-4 text-center md:text-left md:border-r md:border-gray-100 md:pr-8">
            <h3 className="text-4xl sm:text-5xl font-black text-[#052a51] tracking-tight">
              {stats.averageRating}
              <span className="text-xl text-gray-400 font-bold"> / 5</span>
            </h3>

            <div className="flex items-center justify-center md:justify-start gap-1 text-amber-500 my-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={18}
                  className={
                    i < Math.round(stats.averageRating)
                      ? "fill-amber-500 text-amber-500"
                      : "text-gray-300"
                  }
                />
              ))}
            </div>

            <p className="text-xs text-gray-500 font-medium">
              Based on <strong>{stats.totalReviews} verified reviews</strong>
            </p>
            <p className="text-xs font-bold text-emerald-700 mt-1">
              ✓ {stats.recommendPercent}% of buyers recommend this tile
            </p>

            <button
              onClick={() => setWriteModalOpen(true)}
              className="mt-5 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <Edit3 size={14} />
              <span>Write a Review</span>
            </button>
          </div>

          {/* Right: Rating Distribution Bars */}
          <div className="md:col-span-8 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.distribution[star] || 0;
              const percent =
                stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100)
                  : star === 5
                  ? 80
                  : star === 4
                  ? 20
                  : 0;

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
                  <span className="w-10 text-right text-gray-400 font-medium text-[11px] shrink-0">
                    {percent}%
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterType === "all"
                ? "bg-[#052a51] text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            onClick={() => setFilterType("photos")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterType === "photos"
                ? "bg-[#052a51] text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <Camera size={13} />
            <span>With Customer Photos</span>
          </button>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated (5★ first)</option>
            <option value="lowest">Lowest Rated (1★ first)</option>
          </select>
        </div>
      </div>

      {/* ── Reviews Cards List ── */}
      <div className="space-y-4">
        {displayedReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-gray-200 text-gray-400 text-sm">
            <p className="font-bold text-[#052a51]">No reviews matching this filter</p>
            <p className="text-xs text-gray-400 mt-1">Be the first to share installation photos!</p>
          </div>
        ) : (
          displayedReviews.map((rev) => <ReviewCard key={rev.id} review={rev} />)
        )}
      </div>

      {/* Write Review Modal */}
      <WriteReviewModal
        productId={productId}
        productName={productName}
        isOpen={writeModalOpen}
        onClose={() => setWriteModalOpen(false)}
      />
    </div>
  );
}
