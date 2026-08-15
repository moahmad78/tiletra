"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  ArrowLeft,
  Truck,
  TrendingDown,
  Package,
  Tag,
  Star,
  Save,
  CheckCircle,
} from "lucide-react";
import { useNotificationsStore } from "@/lib/notifications-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function NotificationPreferencesPage() {
  const preferences = useNotificationsStore((s) => s.preferences);
  const updatePreferences = useNotificationsStore((s) => s.updatePreferences);

  const [orderUpdates, setOrderUpdates] = useState(preferences.orderUpdates);
  const [priceDrops, setPriceDrops] = useState(preferences.priceDrops);
  const [backInStock, setBackInStock] = useState(preferences.backInStock);
  const [promotions, setPromotions] = useState(preferences.promotions);
  const [reviewReminders, setReviewReminders] = useState(preferences.reviewReminders);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      orderUpdates,
      priceDrops,
      backInStock,
      promotions,
      reviewReminders,
    });
    toast.success("Notification preferences saved!");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Header />

      <main
        className="flex-1 max-w-[760px] w-full mx-auto px-4 sm:px-6 md:px-8 pt-[110px] md:pt-[168px] pb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/account"
            className="p-2 rounded-xl bg-white border border-gray-200 text-[#052a51] hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#052a51]">
              Notification Settings
            </h1>
            <p className="text-xs text-gray-500">
              Choose which updates and alerts you'd like to receive
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs divide-y divide-gray-100">
            {/* Order Updates */}
            <div className="py-4 first:pt-0 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#052a51]/5 text-[#052a51] flex items-center justify-center shrink-0 mt-0.5">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#052a51]">Order & Shipment Updates</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Real-time alerts for packing, dispatch, and delivery tracking
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={orderUpdates}
                onChange={(e) => setOrderUpdates(e.target.checked)}
                className="w-5 h-5 accent-[#F26522] rounded cursor-pointer"
              />
            </div>

            {/* Price Drops */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingDown size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#052a51]">Wishlist Price Drops</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Notify me when saved tiles get special seasonal discounts
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={priceDrops}
                onChange={(e) => setPriceDrops(e.target.checked)}
                className="w-5 h-5 accent-[#F26522] rounded cursor-pointer"
              />
            </div>

            {/* Back in Stock */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#052a51]">Back in Stock Alerts</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Instant alerts when popular out-of-stock tile designs are restocked
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={backInStock}
                onChange={(e) => setBackInStock(e.target.checked)}
                className="w-5 h-5 accent-[#F26522] rounded cursor-pointer"
              />
            </div>

            {/* Review Reminders */}
            <div className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Star size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#052a51]">Review Reminders</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Post-delivery invitations to share installation photos
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={reviewReminders}
                onChange={(e) => setReviewReminders(e.target.checked)}
                className="w-5 h-5 accent-[#F26522] rounded cursor-pointer"
              />
            </div>

            {/* Promotions */}
            <div className="py-4 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Tag size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#052a51]">Offers & Promotions</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Exclusive coupon codes and manufacturer clearance sales
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={promotions}
                onChange={(e) => setPromotions(e.target.checked)}
                className="w-5 h-5 accent-[#F26522] rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-2xl shadow-md active:scale-95 transition-all"
            >
              <Save size={15} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
