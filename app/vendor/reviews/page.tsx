"use client";

import { MessageSquare, Star, ShieldCheck } from "lucide-react";
import { useVendorAuth } from "@/lib/vendor-auth";

export default function VendorReviewsPage() {
  const { vendor } = useVendorAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
          Customer Reviews & Ratings
        </h1>
        <p className="text-xs text-gray-500">
          Read verified customer feedback on your shop's products
        </p>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Star size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Reviews Moderation Stays with Platform Super Admin
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          To maintain high trust across all shops on Intrihub, customer reviews are verified and moderated by Super Admin. You have full read visibility into customer ratings on your catalog.
        </p>
      </div>
    </div>
  );
}
