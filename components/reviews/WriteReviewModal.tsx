"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Star,
  Upload,
  X,
  ShieldCheck,
  Camera,
  Film,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  orderId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultRating?: number;
}

export default function WriteReviewModal({
  productId,
  productName,
  orderId: initialOrderId,
  isOpen,
  onClose,
  onSuccess,
  defaultRating = 5,
}: WriteReviewModalProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(defaultRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; isVideo: boolean }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 photos or videos.");
      return;
    }

    const newFiles: Array<{ file: File; preview: string; isVideo: boolean }> = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mime = file.type.toLowerCase();
      const isImage = mime.startsWith("image/");
      const isVideo = mime.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`Unsupported file: ${file.name}. Only JPG, PNG, WEBP, MP4, and MOV allowed.`);
        continue;
      }

      if (isImage && file.size > 8 * 1024 * 1024) {
        toast.error(`Image ${file.name} is larger than 8MB limit.`);
        continue;
      }

      if (isVideo && file.size > 50 * 1024 * 1024) {
        toast.error(`Video ${file.name} is larger than 50MB limit.`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newFiles.push({ file, preview, isVideo });
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles((prev) => {
      const item = prev[idx];
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to submit a review.");
      return;
    }

    if (!body.trim()) {
      toast.error("Please write a few words describing your experience.");
      return;
    }

    let targetOrderId = initialOrderId;

    setIsSubmitting(true);
    setUploadStatus("Verifying purchase...");

    try {
      // 1. If orderId not provided directly, look up eligible delivered order for this user & product
      if (!targetOrderId) {
        const eligRes = await fetch(`/api/products/${productId}/reviews/eligibility`, {
          headers: {
            "x-user-id": user.id,
            "x-user-phone": user.phone || "",
          },
        });
        const eligData = await eligRes.json();

        if (!eligData.success || !eligData.eligible || eligData.eligibleOrders.length === 0) {
          toast.error("You can only review products from delivered orders you've received.");
          setIsSubmitting(false);
          return;
        }

        targetOrderId = eligData.eligibleOrders[0].id;
      }

      // 2. Submit Review
      setUploadStatus("Publishing review...");
      const createRes = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
          "x-user-phone": user.phone || "",
        },
        body: JSON.stringify({
          productId,
          orderId: targetOrderId,
          rating,
          title: title.trim() || undefined,
          body: body.trim(),
        }),
      });

      const createData = await createRes.json();

      if (!createData.success || !createData.review) {
        toast.error(createData.error || "Failed to submit review.");
        setIsSubmitting(false);
        return;
      }

      const reviewId = createData.review.id;

      // 3. Upload Media if attached
      if (selectedFiles.length > 0) {
        setUploadStatus(`Uploading ${selectedFiles.length} media file(s)...`);
        const formData = new FormData();
        selectedFiles.forEach(({ file }) => {
          formData.append("files", file);
        });

        const mediaRes = await fetch(`/api/reviews/${reviewId}/media`, {
          method: "POST",
          headers: {
            "x-user-id": user.id,
          },
          body: formData,
        });

        const mediaData = await mediaRes.json();
        if (!mediaData.success) {
          toast.warning("Review published, but some media uploads had issues: " + (mediaData.error || ""));
        }
      }

      toast.success("Thank you! Your review has been published.");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Submit review error:", err);
      toast.error(err?.message || "An error occurred while submitting your review.");
    } finally {
      setIsSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-[#052a51] text-lg">Write a Review</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Star Selector */}
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-2">
              Overall Rating *
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star
                    size={30}
                    className={
                      star <= (hoverRating ?? rating)
                        ? "fill-amber-500 text-amber-500"
                        : "text-gray-300"
                    }
                  />
                </button>
              ))}
              <span className="text-xs font-black text-[#052a51] ml-2">
                {rating === 5
                  ? "5 / 5 — Excellent"
                  : rating === 4
                  ? "4 / 5 — Very Good"
                  : rating === 3
                  ? "3 / 5 — Average"
                  : rating === 2
                  ? "2 / 5 — Disappointed"
                  : "1 / 5 — Poor"}
              </span>
            </div>
          </div>

          {/* Review Headline */}
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Excellent tile finish & quick delivery!"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Review Details */}
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1">
              Your Review *
            </label>
            <textarea
              rows={4}
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share details about material quality, installation, finish, durability, and delivery experience..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Media Upload Dropzone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={14} className="text-[#F26522]" />
                <span>Photos & Videos (Optional, max 5)</span>
              </label>
              <span className="text-[10px] text-gray-400 font-bold">{selectedFiles.length} / 5</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {selectedFiles.map((item, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-900 group shadow-2xs"
                >
                  {item.isVideo ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white p-2">
                      <Film size={20} className="text-[#F26522]" />
                      <span className="text-[9px] text-gray-300 truncate w-full text-center mt-1">Video</span>
                    </div>
                  ) : (
                    <Image src={item.preview} alt="" fill className="object-cover" sizes="80px" />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}

              {selectedFiles.length < 5 && (
                <label className="border-2 border-dashed border-gray-300 hover:border-[#F26522] rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-[#F26522]/5 transition-colors text-center p-1">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-[9px] font-bold text-gray-500 mt-1">Add Media</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5">
              JPG, PNG, WEBP (up to 8MB) or MP4, MOV (up to 50MB, 60s max)
            </p>
          </div>

          {/* Verified purchase status banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span className="text-[11px] font-semibold leading-tight">
              Verified Purchase: This review is linked to your delivered order.
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>{uploadStatus || "Publishing..."}</span>
                </>
              ) : (
                <span>Submit & Publish Review</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
