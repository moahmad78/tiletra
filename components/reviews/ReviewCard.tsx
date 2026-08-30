"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star,
  ShieldCheck,
  X,
  Maximize2,
  Play,
  Film,
} from "lucide-react";

export interface ReviewMediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  thumbnailUrl?: string | null;
}

export interface ReviewCardItem {
  id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  comment?: string | null;
  author: string;
  authorAvatar?: string | null;
  authorCity?: string;
  verifiedPurchase?: boolean;
  createdAt?: string | Date;
  date?: string;
  media?: ReviewMediaItem[];
  images?: string[];
}

export default function ReviewCard({ review }: { review: ReviewCardItem }) {
  const [activeMedia, setActiveMedia] = useState<ReviewMediaItem | null>(null);

  // Normalize media items (support media objects and legacy images strings)
  const mediaItems: ReviewMediaItem[] = review.media && review.media.length > 0
    ? review.media
    : review.images && review.images.length > 0
    ? review.images.map((url, idx) => ({ id: `img-${idx}`, type: "IMAGE" as const, url }))
    : [];

  const authorInitial = (review.author || "V")[0].toUpperCase();
  const reviewText = review.body || review.comment || "";
  const displayDate = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : review.date || "Verified Purchase";

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-3.5 hover:shadow-xs transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0">
            {authorInitial}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[#052a51] text-sm">{review.author}</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck size={12} className="text-emerald-600" />
                Verified Purchase
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {review.authorCity ? `${review.authorCity} · ` : ""}{displayDate}
            </p>
          </div>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60 shrink-0">
          <Star size={13} className="fill-amber-500 text-amber-500" />
          <span className="text-xs font-black text-[#052a51] ml-1">{review.rating}.0</span>
        </div>
      </div>

      {/* Review Content */}
      <div className="space-y-1.5">
        {review.title && (
          <h5 className="text-sm font-black text-[#052a51]">{review.title}</h5>
        )}
        {reviewText && (
          <p className="text-xs text-gray-700 leading-relaxed font-medium">
            {reviewText}
          </p>
        )}
      </div>

      {/* Media Gallery (Photos & Videos) */}
      {mediaItems.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Customer Media ({mediaItems.length})
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {mediaItems.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => setActiveMedia(item)}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shrink-0 group/img focus:outline-none cursor-pointer"
              >
                {item.type === "VIDEO" ? (
                  <div className="w-full h-full relative flex items-center justify-center bg-gray-950">
                    <Film size={20} className="text-gray-400" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/img:bg-black/60 transition-colors">
                      <div className="w-7 h-7 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-md">
                        <Play size={12} className="fill-white translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Image
                      src={item.url}
                      alt={`Customer photo ${idx + 1}`}
                      fill
                      className="object-cover group-hover/img:scale-110 transition-transform"
                      sizes="80px"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 size={14} />
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Media Lightbox / Video Player Modal */}
      {activeMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActiveMedia(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] w-full rounded-2xl overflow-hidden shadow-2xl bg-black flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveMedia(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="relative w-full aspect-[4/3] max-h-[70vh] flex items-center justify-center bg-black">
              {activeMedia.type === "VIDEO" ? (
                <video
                  src={activeMedia.url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <Image
                  src={activeMedia.url}
                  alt="Customer review photo"
                  fill
                  className="object-contain"
                  sizes="1000px"
                />
              )}
            </div>

            <div className="p-4 bg-gray-900 text-white text-xs flex justify-between items-center">
              <span>Shared by <strong>{review.author}</strong></span>
              <span className="text-[#F26522] font-bold">Verified Buyer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
