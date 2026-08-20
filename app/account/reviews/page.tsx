"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  ArrowLeft,
  Trash2,
  Edit,
  ShieldCheck,
  Plus,
  MessageSquare,
} from "lucide-react";
import { useReviewsStore, type CustomerReview } from "@/lib/reviews-store";
import { toast } from "sonner";

export default function MyReviewsPage() {
  const reviews = useReviewsStore((s) => s.reviews);
  const deleteReview = useReviewsStore((s) => s.deleteReview);
  const updateReview = useReviewsStore((s) => s.updateReview);

  const [editingReview, setEditingReview] = useState<CustomerReview | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete your review for ${name}?`)) {
      deleteReview(id);
      toast.success("Review deleted.");
    }
  };

  const handleStartEdit = (r: CustomerReview) => {
    setEditingReview(r);
    setEditText(r.comment);
    setEditRating(r.rating);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview) return;

    updateReview(editingReview.id, {
      comment: editText.trim(),
      rating: editRating,
    });

    toast.success("Review updated! It will go through quick re-moderation.");
    setEditingReview(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="md:hidden p-2 rounded-xl bg-white border border-gray-200 text-[#052a51] hover:bg-gray-50 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">My Reviews</h1>
            <p className="text-xs text-gray-500">Manage and edit your product ratings</p>
          </div>
        </div>

        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Plus size={14} />
          <span>Review Past Orders</span>
        </Link>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center border border-gray-200/90 shadow-2xs text-gray-400">
            <MessageSquare size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-[#052a51]">You haven't written any reviews yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Delivered tiles can be reviewed from your orders page!
            </p>
            <Link
              href="/account/orders"
              className="mt-4 inline-block px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#0a3e74]"
            >
              Go to My Orders
            </Link>
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-3xl p-6 border border-gray-200/90 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h3 className="font-black text-[#052a51] text-base">{r.productName}</h3>
                  <p className="text-xs text-gray-400">Submitted on {r.date}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      r.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : r.status === "pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {r.status === "approved" ? "Live on Store" : "Pending Approval"}
                  </span>

                  <div className="flex items-center gap-0.5 text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    <span className="text-xs font-black text-[#052a51] ml-1">{r.rating}.0</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed font-medium">"{r.comment}"</p>

              {/* Photos */}
              {r.images && r.images.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {r.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shrink-0"
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <div className="text-gray-400 text-[11px]">
                  👍 {r.helpfulCount} helpful votes
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(r)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-[#052a51] font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(r.id, r.productName)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete review"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <h3 className="font-black text-[#052a51] text-base mb-1">Edit Your Review</h3>
            <p className="text-xs text-gray-500 mb-4">{editingReview.productName}</p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Rating</label>
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setEditRating(s)}
                      className="p-1 focus:outline-none cursor-pointer"
                    >
                      <Star
                        size={22}
                        className={s <= editRating ? "fill-amber-500 text-amber-500" : "text-gray-300"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Review</label>
                <textarea
                  rows={4}
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Save & Resubmit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
