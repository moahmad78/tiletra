"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  getReviews,
  updateReviewStatus,
  deleteReview,
} from "@/lib/actions/reviews";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await getReviews();
      setReviews(data);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const filteredReviews = reviews.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  const handleStatus = async (id: string, status: "approved" | "rejected") => {
    const res = await updateReviewStatus(id, status);
    if (res.success) {
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      toast.success(`Review ${status === "approved" ? "approved for public site" : "rejected"}`);
    } else {
      toast.error(res.error || "Failed to update review status");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      const res = await deleteReview(id);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast.success("Review deleted");
      } else {
        toast.error(res.error || "Failed to delete review");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading reviews from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Review Moderation</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Approve verified buyer reviews stored in PostgreSQL before they appear on the public storefront
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                filter === f
                  ? "bg-white text-[#052a51] shadow-2xs"
                  : "text-gray-500 hover:text-[#052a51]"
              }`}
            >
              {f} ({reviews.filter((r) => f === "all" || r.status === f).length})
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center border border-gray-200 text-gray-400 text-sm">
            No reviews matching this filter.
          </div>
        ) : (
          filteredReviews.map((rev) => (
            <div
              key={rev.id}
              className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row items-start justify-between gap-4"
            >
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#052a51] text-sm">{rev.author}</span>
                  <span className="text-xs text-gray-400">· {rev.city || "Bangalore"}</span>
                  <span className="text-xs text-gray-400">· {rev.date}</span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ml-2 ${
                      rev.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : rev.status === "pending"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    {rev.status}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < rev.rating ? "fill-amber-500" : "text-gray-300"}
                    />
                  ))}
                  <span className="text-xs font-bold text-gray-600 ml-1">
                    for <strong className="text-[#052a51]">{rev.productName}</strong>
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                  "{rev.comment}"
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {rev.status !== "approved" && (
                  <button
                    onClick={() => handleStatus(rev.id, "approved")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle size={13} />
                    <span>Approve</span>
                  </button>
                )}

                {rev.status !== "rejected" && (
                  <button
                    onClick={() => handleStatus(rev.id, "rejected")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(rev.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Delete review"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
