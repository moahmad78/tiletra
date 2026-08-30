"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  MessageSquare,
  Star,
  Eye,
  EyeOff,
  Trash2,
  Loader2,
  ShieldCheck,
  Film,
  Camera,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PUBLISHED" | "HIDDEN">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({ all: 0, published: 0, hidden: 0 });

  // Hide Modal State
  const [hideModalReview, setHideModalReview] = useState<any | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/reviews?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews || []);
        if (data.counts) {
          setCounts(data.counts);
        }
      } else {
        toast.error(data.error || "Failed to load reviews");
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Network error while fetching reviews");
    } finally {
      setLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleHideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hideModalReview) return;
    if (!hideReason.trim()) {
      toast.error("Please enter a reason for hiding this review.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews/${hideModalReview.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "HIDDEN",
          hiddenReason: hideReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review hidden from storefront.");
        setHideModalReview(null);
        setHideReason("");
        loadReviews();
      } else {
        toast.error(data.error || "Failed to hide review.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error updating review.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review restored and published to storefront!");
        loadReviews();
      } else {
        toast.error(data.error || "Failed to restore review.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error restoring review.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to permanently delete this review?")) {
      try {
        const res = await fetch(`/api/admin/reviews/${id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
          toast.success("Review permanently deleted.");
          loadReviews();
        } else {
          toast.error(data.error || "Failed to delete review.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Error deleting review.");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-[#052a51]">Product Reviews Moderation</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-published verified reviews. Audit customer feedback, inspect attached media, and moderate inappropriate content.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-white text-[#052a51] shadow-2xs"
                : "text-gray-500 hover:text-[#052a51]"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => setFilter("PUBLISHED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "PUBLISHED"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-gray-500 hover:text-emerald-700"
            }`}
          >
            Published ({counts.published})
          </button>
          <button
            onClick={() => setFilter("HIDDEN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "HIDDEN"
                ? "bg-red-600 text-white shadow-2xs"
                : "text-gray-500 hover:text-red-700"
            }`}
          >
            Hidden ({counts.hidden})
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-3">
        <Search size={18} className="text-gray-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by customer name, product title, phone, or keyword..."
          className="w-full text-xs font-semibold text-[#052a51] bg-transparent focus:outline-none placeholder:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-xs font-bold text-[#052a51]">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-gray-200 text-gray-400 text-sm">
          No reviews found matching this filter.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className={`bg-white p-5 md:p-6 rounded-2xl border shadow-2xs space-y-4 transition-all ${
                rev.status === "HIDDEN"
                  ? "border-red-200 bg-red-50/20"
                  : "border-gray-200/80"
              }`}
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-sm text-[#052a51]">
                      {rev.user?.name || "Customer"}
                    </span>
                    {rev.user?.phone && (
                      <span className="text-xs text-gray-400 font-mono">
                        · +91 {rev.user.phone.replace(/\D/g, "").slice(-10)}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      · {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        rev.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  {/* Product & Order Reference */}
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
                    <span>Product:</span>
                    <strong className="text-[#052a51]">{rev.product?.name || "Tile"}</strong>
                    {rev.orderId && (
                      <span className="text-gray-400">
                        (Order #{rev.orderId})
                      </span>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                  <Star size={14} className="fill-amber-500 text-amber-500" />
                  <span className="text-xs font-black text-amber-900">{rev.rating}.0</span>
                </div>
              </div>

              {/* Review Text Body */}
              <div className="space-y-1">
                {rev.title && (
                  <h4 className="text-xs font-bold text-[#052a51]">{rev.title}</h4>
                )}
                <p className="text-xs text-gray-700 leading-relaxed font-medium bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {rev.body || "No text provided."}
                </p>
              </div>

              {/* Hidden Reason Notice if Hidden */}
              {rev.status === "HIDDEN" && rev.hiddenReason && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Hidden Reason (Internal Audit):</strong> {rev.hiddenReason}
                  </div>
                </div>
              )}

              {/* Media Previews */}
              {rev.media && rev.media.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Attached Media ({rev.media.length})
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {rev.media.map((m: any) => (
                      <div
                        key={m.id}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shrink-0 group"
                      >
                        {m.type === "VIDEO" ? (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white">
                            <Film size={18} className="text-[#F26522]" />
                            <span className="text-[8px] mt-0.5 font-bold">Video</span>
                          </div>
                        ) : (
                          <Image src={m.url} alt="" fill className="object-cover" sizes="64px" />
                        )}
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div className="text-[11px] text-gray-400">
                  ID: <span className="font-mono">{rev.id}</span>
                </div>

                <div className="flex items-center gap-2">
                  {rev.status === "PUBLISHED" ? (
                    <button
                      onClick={() => {
                        setHideModalReview(rev);
                        setHideReason("");
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <EyeOff size={13} />
                      <span>Hide Review</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(rev.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Restore & Publish</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(rev.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Delete permanently"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hide Modal Dialog */}
      {hideModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-[#052a51] text-base">Hide Review</h3>
              <button
                onClick={() => setHideModalReview(null)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleHideSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#052a51] block mb-1">
                  Reason for Hiding *
                </label>
                <textarea
                  rows={3}
                  required
                  value={hideReason}
                  onChange={(e) => setHideReason(e.target.value)}
                  placeholder="e.g. Inappropriate language, spam, or contains personally identifiable information..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  This reason is recorded in the admin audit trail and is not shown to customers.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setHideModalReview(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <EyeOff size={13} />}
                  <span>Confirm Hide</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
