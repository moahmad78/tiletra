"use client";

import { X, Truck, Package, CheckCircle2, Clock, MapPin, Phone, ShieldCheck } from "lucide-react";

interface OrderTrackingModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
}

const ORDER_STEPS = [
  { key: "Processing", label: "Order Placed & Processing", desc: "We received your order and are packing it." },
  { key: "Confirmed", label: "Confirmed & Quality Checked", desc: "Tiles and materials verified for breakage & defects." },
  { key: "Dispatched", label: "Dispatched from Logistics Hub", desc: "Loaded onto transport vehicle with protective crates." },
  { key: "Out for Delivery", label: "Out for Direct Site Delivery", desc: "Driver is on the way to your delivery address." },
  { key: "Delivered", label: "Delivered Successfully", desc: "Materials safely unloaded at your site." },
];

export default function OrderTrackingModal({
  order,
  isOpen,
  onClose,
}: OrderTrackingModalProps) {
  if (!isOpen || !order) return null;

  const currentStatus = order.orderStatus || "Processing";
  const currentIndex = ORDER_STEPS.findIndex((s) => s.key.toLowerCase() === currentStatus.toLowerCase());
  const activeStepIdx = currentIndex !== -1 ? currentIndex : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center">
              <Truck size={18} />
            </div>
            <div>
              <h3 className="font-black text-[#052a51] text-sm">Live Shipment Tracker</h3>
              <p className="text-[11px] text-gray-400">Order ID: #{order.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status banner */}
          <div className="p-4 bg-gradient-to-br from-[#052a51] to-[#0a3869] rounded-2xl text-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#F26522] text-white">
                Status: {currentStatus}
              </span>
              <span className="text-xs text-white/80 font-bold">
                📅 {order.estimatedDelivery || "Within 60 Minutes"}
              </span>
            </div>
            <p className="text-sm font-bold pt-1">
              Estimated Delivery: {order.estimatedDelivery || "Within 60 Minutes"}
            </p>
            {order.trackingNumber && (
              <p className="text-xs text-white/70">
                Courier: <strong>{order.courierName || "Intrihub Direct Freight"}</strong> · Tracking: <strong>{order.trackingNumber}</strong>
              </p>
            )}
          </div>

          {/* Timeline Steps */}
          <div className="space-y-4 relative pl-2">
            {ORDER_STEPS.map((step, idx) => {
              const isCompleted = idx <= activeStepIdx;
              const isCurrent = idx === activeStepIdx;

              return (
                <div key={step.key} className="flex items-start gap-3.5 relative">
                  {/* Step Connector Line */}
                  {idx !== ORDER_STEPS.length - 1 && (
                    <div
                      className={`absolute left-[13px] top-[26px] bottom-[-16px] w-[2px] ${
                        idx < activeStepIdx ? "bg-emerald-500" : "bg-gray-200"
                      }`}
                    />
                  )}

                  {/* Icon Badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 font-bold text-xs ${
                      isCurrent
                        ? "bg-[#F26522] text-white ring-4 ring-orange-100"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 size={15} /> : idx + 1}
                  </div>

                  <div className="flex-1 pb-1">
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? "text-[#F26522]"
                          : isCompleted
                          ? "text-[#052a51]"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Site Destination */}
          {order.shippingAddress && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                Destination Site Address:
              </span>
              <p className="font-bold text-[#052a51]">{order.customerName}</p>
              <p className="text-gray-600">
                {typeof order.shippingAddress === "string"
                  ? order.shippingAddress
                  : `${order.shippingAddress.line1 || order.shippingAddress.street || ""}, ${
                      order.shippingAddress.city || "Bangalore"
                    } — ${order.shippingAddress.pincode || ""}`}
              </p>
              <p className="text-gray-500 pt-0.5">📞 Contact: {order.customerPhone}</p>
            </div>
          )}

          {/* Help button */}
          <div className="pt-2">
            <a
              href="https://wa.me/919198035803?text=Hi%20Gulshan,%20I%20want%20an%20update%20on%20my%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Contact Delivery Manager on WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
