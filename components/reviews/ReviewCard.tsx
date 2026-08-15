"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  X,
  Maximize2,
} from "lucide-react";
import { useReviewsStore, type CustomerReview } from "@/lib/reviews-store";
import { toast } from "sonner";

export default function ReviewCard({ review }: { review: CustomerReview }) {
  const { voteHelpful } = useReviewsStore();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const handleVote = (isHelpful: boolean) => {
    voteHelpful(review.id, isHelpful);
    toast.success(isHelpful ? "Thank you for your feedback!" : "Feedback recorded.");
  };

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-3.5 hover:shadow-xs transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white font-black text-sm flex items-center justify-center shadow-xs">
            {review.authorName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-[#052a51] text-sm">{review.authorName}</h4>
              {review.verifiedPurchase && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  Verified Purchase
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">
              {review.authorCity} · {review.date}
            </p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60">
          <Star size={13} className="fill-amber-500 text-amber-500" />
          <span className="text-xs font-black text-[#052a51] ml-1">{review.rating}.0</span>
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-1.5">
        {review.title && (
          <h5 className="text-sm font-black text-[#052a51]">{review.title}</h5>
        )}
        <p className="text-xs text-gray-700 leading-relaxed font-medium">
          {review.comment}
        </p>
      </div>

      {/* Customer Installation Photos Gallery */}
      {review.images && review.images.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Customer Installed Photos ({review.images.length})
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {review.images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setLightboxImage(img)}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 group/img focus:outline-none"
              >
                <Image
                  src={img}
                  alt={`Installed photo ${idx + 1}`}
                  fill
                  className="object-cover group-hover/img:scale-110 transition-transform"
                  sizes="80px"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <Maximize2 size={14} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Helpful Vote Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span className="text-[11px]">Was this review helpful?</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleVote(true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              review.userVoted === "helpful"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            <ThumbsUp size={12} />
            <span>{review.helpfulCount > 0 ? review.helpfulCount : "Yes"}</span>
          </button>

          <button
            onClick={() => handleVote(false)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
              review.userVoted === "unhelpful"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            <ThumbsDown size={12} />
            <span>{review.unhelpfulCount > 0 ? review.unhelpfulCount : "No"}</span>
          </button>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] w-full rounded-2xl overflow-hidden shadow-2xl bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={lightboxImage}
                alt="Installed tile preview"
                fill
                className="object-contain"
                sizes="1000px"
              />
            </div>
            <div className="p-4 bg-gray-900 text-white text-xs flex justify-between items-center">
              <span>Installed by {review.authorName} ({review.authorCity})</span>
              <span className="text-[#F26522] font-bold">{review.productName}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
