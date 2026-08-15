"use client";

import { useState } from "react";
import {
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const reviews = useAdminStore((s) => s.reviews);
  const updateReviewStatus = useAdminStore((s) => s.updateReviewStatus);
  const deleteReview = useAdminStore((s) => s.deleteReview);

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const filteredReviews = reviews.filter((r) =>
    filter === "all" ? true : r.status === filter
  );

  const handleStatus = (id: string, status: "approved" | "rejected") => {
    updateReviewStatus(id, status);
    toast.success(`Review ${status === "approved" ? "approved for public site" : "rejected"}`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReview(id);
      toast.success("Review deleted");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Review Moderation</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Approve verified buyer reviews before they appear on the public storefront
          </p>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
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
                  <span className="text-xs text-gray-400">· {rev.city}</span>
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
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <CheckCircle size={13} />
                    <span>Approve</span>
                  </button>
                )}

                {rev.status !== "rejected" && (
                  <button
                    onClick={() => handleStatus(rev.id, "rejected")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(rev.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
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
