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
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-black text-[#052a51] flex items-center gap-2">
          <Truck size={18} className="text-[#F26522]" />
          Delivery & Logistics Method
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Calculated automatically based on your order value, total shipment weight, and vehicle capacity.
        </p>
      </div>

      {/* Selected Vehicle Card */}
      <div className="p-5 sm:p-6 bg-gradient-to-br from-white to-orange-50/30 rounded-3xl border-2 border-[#052a51] shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#052a51] text-white rounded-2xl shrink-0 shadow-2xs">
              {isFreeDelivery ? (
                <Sparkles size={24} className="text-amber-300" />
              ) : isBikeDelivery ? (
                <Bike size={24} className="text-orange-300" />
              ) : (
                <Truck size={24} className="text-orange-300" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-black text-[#052a51]">
                  {isFreeDelivery
                    ? "Express Free Dispatch"
                    : isBikeDelivery
                    ? "Two-Wheeler Express Courier"
                    : "Heavy Logistics 4-Wheeler Truck"}
                </h4>
                <span className="text-[10px] font-black uppercase text-[#2F7A4F] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                  Active Slab
                </span>
              </div>
              <p className="text-xs text-gray-600 font-medium mt-0.5 flex items-center gap-1.5">
                <Clock size={13} className="text-[#F26522]" />
                <span>Estimated Delivery: 2–4 Business Days across Bangalore & Hub Areas</span>
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
        <div className="p-3.5 bg-white rounded-2xl border border-gray-200/80 text-xs space-y-1.5">
          <div className="flex items-center justify-between text-gray-600">
            <span>Total Shipment Weight:</span>
            <span className="font-bold text-[#052a51]">{totalWeightKg.toFixed(1)} kg ({items.length} item{items.length > 1 ? "s" : ""})</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>Vehicle Slab Rule:</span>
            <span className="font-bold text-[#052a51]">
              {isFreeDelivery
                ? `Order Value (₹${subtotal.toLocaleString("en-IN")}) ≥ ₹${freeThreshold.toLocaleString("en-IN")}`
                : totalWeightKg <= weightThreshold
                ? `Weight (${totalWeightKg.toFixed(1)} kg) ≤ ${weightThreshold} kg (Bike)`
                : `Weight (${totalWeightKg.toFixed(1)} kg) > ${weightThreshold} kg (4-Wheeler)`}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 font-bold">
            <span className="text-[#052a51]">Applicable Delivery Fee:</span>
            <span className={isFreeDelivery ? "text-[#2F7A4F]" : "text-[#F26522]"}>
              {isFreeDelivery ? "₹0 (FREE DELIVERY APPLIED)" : `₹${calculatedFee}`}
            </span>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <PackageCheck size={14} className="text-[#2F7A4F]" />
            <span>Fragile-Safe Packaging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#2F7A4F]" />
            <span>Transit Insurance Included</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-[#2F7A4F]" />
            <span>Live SMS/OTP Tracking</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBackToAddress}
          className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Address</span>
        </button>

        <button
          type="button"
          onClick={onProceedToPayment}
          className="px-7 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <span>Proceed to Payment</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
