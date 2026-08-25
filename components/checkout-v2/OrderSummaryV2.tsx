"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShoppingBag,
  Tag,
  Truck,
  ShieldCheck,
  Percent,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { type CartItem } from "@/lib/cart-store";
import { toast } from "sonner";

interface OrderSummaryV2Props {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  deliveryType: string;
  totalWeightKg: number;
  couponCode: string;
  discountAmount: number;
  onApplyCoupon: (code: string) => Promise<boolean>;
  onRemoveCoupon: () => void;
  grandTotal: number;
}

export default function OrderSummaryV2({
  items,
  subtotal,
  deliveryFee,
  deliveryType,
  totalWeightKg,
  couponCode,
  discountAmount,
  onApplyCoupon,
  onRemoveCoupon,
  grandTotal,
}: OrderSummaryV2Props) {
  const [couponInput, setCouponInput] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [showItems, setShowItems] = useState(true);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;

    setIsApplying(true);
    const success = await onApplyCoupon(couponInput.trim());
    setIsApplying(false);
    if (success) {
      setCouponInput("");
    }
  };

  // Calculate estimated total MRP from variants to show total savings
  const totalMrp = items.reduce((sum, item) => {
    const mrp = (item.variant as any)?.mrp || item.variant.pricePerBox * 1.25;
    return sum + mrp * item.quantity;
  }, 0);

  const productSavings = Math.max(0, Math.round(totalMrp - subtotal));

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-5 sm:p-6 space-y-5 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="text-base font-black text-[#052a51] flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#F26522]" />
          Order Summary ({items.length} item{items.length > 1 ? "s" : ""})
        </h3>
        <button
          type="button"
          onClick={() => setShowItems(!showItems)}
          className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 cursor-pointer"
        >
          <span>{showItems ? "Hide Items" : "View Items"}</span>
          {showItems ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Cart Items List */}
      {showItems && (
        <div className="max-h-60 overflow-y-auto space-y-3 pr-1 divide-y divide-gray-100">
          {items.map((item) => {
            const variant = item.variant;
            const product = item.product;
            const unitLabel =
              (product as any)?.unitOfSale ||
              (product.categorySlug?.includes("paint")
                ? "litre"
                : product.categorySlug?.includes("tile")
                ? "box"
                : "unit");

            return (
              <div key={variant.id} className="pt-3 first:pt-0 flex items-start gap-3">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                  <Image
                    src={variant.image || product.images?.[0] || "/logo/intri-web-logo.png"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#052a51] truncate">{product.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {variant.attributeValue || variant.color || "Standard Variant"} • {item.quantity} {unitLabel}{item.quantity > 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-[#052a51]">
                      ₹{(variant.pricePerBox * item.quantity).toLocaleString("en-IN")}
                    </span>
                    {(variant as any)?.mrp && (variant as any).mrp > variant.pricePerBox && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{((variant as any).mrp * item.quantity).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coupon Code Box */}
      <div className="pt-2 border-t border-gray-100">
        {couponCode ? (
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-emerald-600 text-white rounded-lg">
                <Tag size={12} />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-900 uppercase tracking-wider">{couponCode}</p>
                <p className="text-[10px] text-emerald-700 font-bold">
                  ₹{discountAmount.toLocaleString("en-IN")} coupon discount applied
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="p-1 text-emerald-700 hover:text-rose-600 transition-colors cursor-pointer"
              title="Remove Coupon"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleApply} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter Coupon Code"
                className="w-full h-10 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] uppercase placeholder:normal-case focus:outline-none focus:border-[#F26522] focus:bg-white"
              />
              <Tag size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <button
              type="submit"
              disabled={!couponInput.trim() || isApplying}
              className="px-4 h-10 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isApplying ? "Applying..." : "Apply"}
            </button>
          </form>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>Cart Subtotal</span>
          <span className="font-bold text-[#052a51]">₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {productSavings > 0 && (
          <div className="flex items-center justify-between text-[#2F7A4F]">
            <span>Product Discount</span>
            <span className="font-bold">-₹{productSavings.toLocaleString("en-IN")}</span>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-[#2F7A4F]">
            <span>Coupon Discount</span>
            <span className="font-bold">-₹{discountAmount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span>Delivery Charge</span>
            <span className="text-[10px] text-gray-400">({totalWeightKg.toFixed(1)} kg)</span>
          </div>
          <span className="font-bold text-[#052a51]">
            {deliveryFee === 0 ? (
              <span className="text-[#2F7A4F]">FREE</span>
            ) : (
              `₹${deliveryFee}`
            )}
          </span>
        </div>

        {deliveryFee === 0 && (
          <p className="text-[10px] text-[#2F7A4F] font-semibold text-right">
            ✓ Free Delivery Unlocked
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
          <span>Estimated GST (Included)</span>
          <span>18% GST Applicable</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="pt-3 border-t-2 border-[#052a51]/10 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Payable</p>
          <p className="text-xl font-black text-[#052a51]">₹{grandTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="text-right">
          {(productSavings > 0 || discountAmount > 0) && (
            <span className="text-[11px] font-black text-[#2F7A4F] bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
              You Save ₹{(productSavings + discountAmount).toLocaleString("en-IN")}
            </span>
          )}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center gap-3 text-[11px] text-gray-500 font-medium">
        <div className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-[#2F7A4F]" />
          <span>100% Genuine</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Truck size={13} className="text-[#052a51]" />
          <span>Direct Dispatch</span>
        </div>
      </div>
    </div>
  );
}
