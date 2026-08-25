"use client";

import React from "react";
import {
  Truck,
  Bike,
  PackageCheck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useCartStore } from "@/lib/cart-store";

interface DeliveryStepProps {
  storeSettings: {
    freeDeliveryThreshold: number;
    bikeDeliveryRate: number;
    fourWheelerDeliveryRate: number;
    weightThresholdKg: number;
    standardDeliveryFee: number;
  };
  onProceedToPayment: () => void;
  onBackToAddress: () => void;
}

export default function DeliveryStep({
  storeSettings,
  onProceedToPayment,
  onBackToAddress,
}: DeliveryStepProps) {
  const { items, getSubtotal } = useCartStore();

  const subtotal = getSubtotal();
  const freeThreshold = storeSettings?.freeDeliveryThreshold ?? 15000;
  const weightThreshold = storeSettings?.weightThresholdKg ?? 20;
  const bikeRate = storeSettings?.bikeDeliveryRate ?? 99;
  const fourWheelerRate = storeSettings?.fourWheelerDeliveryRate ?? 349;

  // Calculate cart total weight
  let totalWeightKg = 0;
  items.forEach((item) => {
    const qty = Number(item.quantity) || 1;
    const itemWeight = (item.variant as any)?.weightKg || (item.variant?.sqftPerBox ? item.variant.sqftPerBox * 2 : 1.5);
    totalWeightKg += itemWeight * qty;
  });

  const isFreeDelivery = subtotal >= freeThreshold;
  const isBikeDelivery = !isFreeDelivery && totalWeightKg <= weightThreshold;
  const calculatedFee = isFreeDelivery ? 0 : isBikeDelivery ? bikeRate : fourWheelerRate;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h3 className="text-base sm:text-lg font-black text-[#052a51] flex items-center gap-2">
          <Truck size={18} className="text-[#F26522]" />
          Delivery & Logistics Method
        </h3>
      </div>

      {/* Selected Vehicle Card */}
      <div className="p-4 sm:p-6 bg-gradient-to-br from-white to-orange-50/20 rounded-2xl sm:rounded-3xl border-2 border-[#052a51] shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-[#052a51] text-white rounded-xl sm:rounded-2xl shrink-0 shadow-2xs">
              {isFreeDelivery ? (
                <Sparkles size={20} className="text-amber-300" />
              ) : isBikeDelivery ? (
                <Bike size={20} className="text-orange-300" />
              ) : (
                <Truck size={20} className="text-orange-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm sm:text-base font-black text-[#052a51]">
                  {isFreeDelivery
                    ? "Free Delivery"
                    : isBikeDelivery
                    ? "Express Bike Courier"
                    : "4-Wheeler Logistics"}
                </h4>
                <span className="text-[9px] font-black uppercase text-[#2F7A4F] bg-green-50 px-1.5 py-0.2 rounded-full border border-green-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                <Clock size={12} className="text-[#F26522]" />
                <span>Est. Delivery: 2–4 Days</span>
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-base sm:text-lg font-black text-[#052a51]">
              {isFreeDelivery ? (
                <span className="text-[#2F7A4F]">FREE</span>
              ) : (
                `₹${calculatedFee}`
              )}
            </p>
            {isFreeDelivery && (
              <p className="text-[10px] text-gray-400 line-through">
                ₹{totalWeightKg <= weightThreshold ? bikeRate : fourWheelerRate}
              </p>
            )}
          </div>
        </div>

        {/* Calculation Logic Info Box */}
        <div className="p-3 bg-white rounded-xl border border-gray-200/80 text-xs space-y-1">
          <div className="flex items-center justify-between text-gray-600">
            <span>Shipment Weight:</span>
            <span className="font-bold text-[#052a51]">
              {totalWeightKg.toFixed(1)} kg ({items.length} item{items.length > 1 ? "s" : ""})
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 font-bold">
            <span className="text-[#052a51]">Delivery Fee:</span>
            <span className={isFreeDelivery ? "text-[#2F7A4F]" : "text-[#F26522]"}>
              {isFreeDelivery ? "FREE" : `₹${calculatedFee}`}
            </span>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="flex items-center gap-3 sm:gap-6 pt-1 text-[11px] font-medium text-gray-600 flex-wrap">
          <div className="flex items-center gap-1">
            <PackageCheck size={13} className="text-[#2F7A4F]" />
            <span>Safe Packaging</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-[#2F7A4F]" />
            <span>Transit Insurance</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-[#2F7A4F]" />
            <span>Live Tracking</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onBackToAddress}
          className="px-3.5 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={onProceedToPayment}
          className="px-6 py-2.5 sm:px-7 sm:py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
        >
          <span>Proceed to Pay</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
