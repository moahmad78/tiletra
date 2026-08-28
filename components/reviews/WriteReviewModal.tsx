"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Star,
  Upload,
  X,
  ShieldCheck,
  CheckCircle,
  Camera,
  Sparkles,
} from "lucide-react";
import { useReviewsStore } from "@/lib/reviews-store";
import { toast } from "sonner";

interface WriteReviewModalProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  defaultRating?: number;
}

export default function WriteReviewModal({
  productId,
  productName,
  isOpen,
  onClose,
  defaultRating = 5,
}: WriteReviewModalProps) {
  const { submitReview, checkVerifiedPurchase } = useReviewsStore();

  const [rating, setRating] = useState(defaultRating);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorCity, setAuthorCity] = useState("Bangalore");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isVerified = checkVerifiedPurchase(productId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 installation photos.");
      return;
    }

    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      newUrls.push(URL.createObjectURL(files[i]));
    }
    setImages([...images, ...newUrls]);
  };

  const handleRemoveImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  // Sample installation room shots for quick test
  const samplePhotoPresets = [
    "/placeholders/product.svg",
    "/placeholders/product.svg",
    "/placeholders/product.svg",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Please write a few words about your tile experience.");
      return;
    }
    if (!authorName.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      submitReview({
        productId,
        productName,
        authorName: authorName.trim(),
        authorCity: authorCity.trim() || "India",
        rating,
        title: title.trim(),
        comment: comment.trim(),
        images: images.length > 0 ? images : undefined,
        verifiedPurchase: isVerified,
      });

      setIsSubmitting(false);
      toast.success(
        "Thank you! Your review has been submitted for moderation and will appear on the site soon."
      );
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Top Title */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div>
            <h3 className="font-black text-[#052a51] text-lg">Write a Tile Review</h3>
            <p className="text-xs text-gray-500 line-clamp-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
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
                  className="p-1 text-amber-500 transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star
                    size={28}
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
              placeholder="e.g. Stunning Italian marble finish in living room!"
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
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell homeowners about tile quality, shine/matte finish, cutting, transit safety, and installation results..."
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Photo Upload (Installed Tile Shots) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider flex items-center gap-1.5">
                <Camera size={14} className="text-[#F26522]" />
                <span>Upload Installed Photos (Optional, max 5)</span>
              </label>
              <span className="text-[10px] text-gray-400">{images.length} / 5</span>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-1">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group shadow-2xs"
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="border-2 border-dashed border-gray-300 hover:border-[#F26522] rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-[#F26522]/5 transition-colors text-center p-1">
                  <Upload size={16} className="text-gray-400" />
                  <span className="text-[9px] font-bold text-gray-500 mt-1">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Quick Demo Photo Presets */}
            {images.length === 0 && (
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-gray-400">Quick sample photos:</span>
                {samplePhotoPresets.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImages([...images, p])}
                    className="relative w-6 h-6 rounded-md overflow-hidden border border-gray-200 hover:scale-110 transition-transform shrink-0"
                    title="Click to insert demo installed room photo"
                  >
                    <Image src={p} alt="" fill className="object-cover" sizes="24px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Author Details */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                Your Name *
              </label>
              <input
                type="text"
                placeholder="e.g. IntriHub"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                City / Location
              </label>
              <input
                type="text"
                value={authorCity}
                onChange={(e) => setAuthorCity(e.target.value)}
                placeholder="e.g. Bangalore"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {/* Verified purchase status banner */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center gap-2 text-xs text-emerald-800">
            <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
            <span className="text-[11px] font-semibold leading-tight">
              {isVerified
                ? "Verified Purchase: We found your previous order for this tile!"
                : "Your review will include standard buyer verification checks."}
            </span>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Submitting Review..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
