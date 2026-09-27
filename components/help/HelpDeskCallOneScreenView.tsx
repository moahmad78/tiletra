"use client";

import React, { useState } from "react";
import {
  Phone,
  User,
  Copy,
  Check,
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  RefreshCw,
  CreditCard,
  MessageSquarePlus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldCheck,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  RaiseReturnModal,
  RaiseExchangeModal,
  ProcessRefundModal,
  AddComplaintModal,
} from "./HelpDeskActionModals";

export default function HelpDeskCallOneScreenView({
  order,
  allCustomerOrders = [],
  customerProfile,
  onSelectOrder,
  onOrderUpdated,
}: {
  order: any;
  allCustomerOrders?: any[];
  customerProfile?: any;
  onSelectOrder: (order: any) => void;
  onOrderUpdated: () => void;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<"return" | "exchange" | "refund" | "complaint" | null>(null);
  const [quickNoteLoading, setQuickNoteLoading] = useState(false);
  const [quickNoteSuccess, setQuickNoteSuccess] = useState<string | null>(null);
  const [showOtherOrders, setShowOtherOrders] = useState(false);

  if (!order) return null;

  // Copy helper with 2s visual confirmation
  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Instant Quick Complaint logger without leaving call screen
  const handleQuickComplaint = async (presetText: string, priority: string = "High") => {
    try {
      setQuickNoteLoading(true);
      const res = await fetch("/api/help/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          customerPhone: order.customerPhone,
          customerName: order.customerName,
          userId: order.userId,
          note: presetText,
          category: "Delivery",
          priority,
          status: "In Progress",
          createdBy: "Live Call Agent",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuickNoteSuccess(`Logged: "${presetText}"`);
        setTimeout(() => setQuickNoteSuccess(null), 3500);
        onOrderUpdated();
      }
    } catch (err) {
      console.error("Failed to log quick complaint", err);
    } finally {
      setQuickNoteLoading(false);
    }
  };

  // Tracking summary determination
  const status = (order.orderStatus || "Processing").toLowerCase();
  const isDelivered = status === "delivered";
  const isShipped = status === "shipped" || status === "out for delivery" || status === "dispatched";
  const isConfirmed = status === "confirmed" || status === "processing";
  const isCancelled = status === "cancelled";
  const isReturned = status === "returned";

  // Formatted tracking headline for phone agent to read aloud
  let trackingHeadline = "Order is currently being processed at warehouse.";
  let statusBadgeColor = "bg-amber-500 text-white";
  let statusIcon = <Clock className="w-5 h-5 shrink-0" />;

  if (isDelivered) {
    trackingHeadline = `Delivered on ${
      order.deliveredAt
        ? new Date(order.deliveredAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
        : new Date(order.updatedAt || order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
    }`;
    statusBadgeColor = "bg-emerald-600 text-white";
    statusIcon = <CheckCircle2 className="w-5 h-5 shrink-0" />;
  } else if (status === "out for delivery") {
    trackingHeadline = `🚚 Out for Delivery Today • Expected by 6:00 PM`;
    statusBadgeColor = "bg-blue-600 text-white";
    statusIcon = <Truck className="w-5 h-5 shrink-0" />;
  } else if (isShipped) {
    trackingHeadline = `📦 In Transit via ${order.courierName || order.deliveryPartner?.name || "Intrihub Logistics"}`;
    statusBadgeColor = "bg-blue-600 text-white";
    statusIcon = <Truck className="w-5 h-5 shrink-0" />;
  } else if (isCancelled) {
    trackingHeadline = `❌ Order was Cancelled.`;
    statusBadgeColor = "bg-red-600 text-white";
    statusIcon = <AlertCircle className="w-5 h-5 shrink-0" />;
  } else if (isReturned) {
    trackingHeadline = `🔄 Return / Exchange in progress.`;
    statusBadgeColor = "bg-purple-600 text-white";
    statusIcon = <RotateCcw className="w-5 h-5 shrink-0" />;
  }

  // Tracking link helper
  const courier = (order.courierName || "").toLowerCase();
  const trackingNumber = order.trackingNumber || "";
  let trackingUrl = null;
  if (trackingNumber) {
    if (courier.includes("delhivery")) {
      trackingUrl = `https://www.delhivery.com/track/package/${trackingNumber}`;
    } else if (courier.includes("bluedart")) {
      trackingUrl = `https://www.bluedart.com/tracking`;
    } else if (courier.includes("shadowfax")) {
      trackingUrl = `https://tracker.shadowfax.in/#/track?orderId=${trackingNumber}`;
    }
  }

  // Other orders from this customer
  const otherOrders = allCustomerOrders.filter((o) => o.id !== order.id);

  return (
    <div className="space-y-3 animate-in fade-in duration-150">
      {/* ========================================================================= */}
      {/* ── 1. INSTANT LIVE CALL STATUS BANNER (READ ALOUD TO CUSTOMER) ── */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-[#052A51] via-[#093d75] to-[#052A51] rounded-2xl p-4 sm:p-4.5 text-white shadow-md border border-white/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2.5 rounded-xl shadow-md ${statusBadgeColor}`}>
              {statusIcon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white/15 text-white">
                  Live Order Status
                </span>
                <span className="text-xs font-bold text-white/70">
                  Last updated: {new Date(order.updatedAt || order.createdAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight mt-0.5 truncate">
                {trackingHeadline}
              </h2>
            </div>
          </div>

          {/* Courier & Tracking Code Pill */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/15 shrink-0">
            <div>
              <p className="text-[10px] text-white/70 font-semibold uppercase">Courier / Partner</p>
              <p className="text-xs font-black text-white">
                {order.courierName || order.deliveryPartner?.name || "IntriHub Direct Fleet"}
              </p>
            </div>
            {trackingNumber ? (
              <div className="pl-3 border-l border-white/20 flex items-center gap-1.5">
                <div>
                  <p className="text-[10px] text-white/70 font-semibold uppercase">Tracking AWB</p>
                  <p className="text-xs font-mono font-bold text-[#F26522]">{trackingNumber}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(trackingNumber, "tracking")}
                  className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Copy Tracking AWB"
                >
                  {copiedField === "tracking" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {trackingUrl && (
                  <a
                    href={trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors"
                    title="Open Tracking Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            ) : (
              <div className="pl-3 border-l border-white/20 text-[11px] text-white/60 italic">
                Local Dispatch
              </div>
            )}
          </div>
        </div>

        {/* Quick Agent Audio Script Tip */}
        <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
          <p className="text-white/80">
            <span className="font-bold text-[#F26522]">Agent Call Script:</span> &ldquo;Sir/Ma&apos;am, your order #{order.id.slice(-8).toUpperCase()} is {order.orderStatus} {isDelivered ? "and was delivered successfully." : `and is scheduled for ${order.estimatedDelivery || "today"}.`}&rdquo;
          </p>
          <div className="flex items-center gap-2 text-[11px] text-white/70 font-mono">
            <span>Order ID: #{order.id.slice(-8).toUpperCase()}</span>
            <button
              onClick={() => handleCopy(order.id, "orderId")}
              className="p-1 hover:bg-white/20 rounded text-white cursor-pointer"
              title="Copy Full Order ID"
            >
              {copiedField === "orderId" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── 2. QUICK CALL ACTIONS & INSTANT PRESET COMPLAINTS (1-CLICK) ── */}
      {/* ========================================================================= */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 mr-1 flex items-center gap-1">
            <Zap className="w-3 h-3 text-[#F26522]" />
            <span>1-Click Log:</span>
          </span>

          <button
            disabled={quickNoteLoading}
            onClick={() => handleQuickComplaint("Customer calling regarding delivery delay — expedited request sent to courier", "High")}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            ⏳ Delivery Delay
          </button>

          <button
            disabled={quickNoteLoading}
            onClick={() => handleQuickComplaint("Customer reported broken/damaged tiles upon unboxing — photos requested", "Urgent")}
            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            ⚠️ Damaged Tiles
          </button>

          <button
            disabled={quickNoteLoading}
            onClick={() => handleQuickComplaint("Customer requested callback from dispatch manager regarding site delivery time", "Medium")}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            📞 Request Callback
          </button>

          <button
            disabled={quickNoteLoading}
            onClick={() => handleQuickComplaint("Customer confirmed delivery received in good condition", "Low")}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            ✅ Delivery Confirmed
          </button>
        </div>

        {quickNoteSuccess && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-in fade-in">
            {quickNoteSuccess}
          </span>
        )}

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveModal("return")}
            className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#F26522] border border-orange-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return</span>
          </button>

          <button
            onClick={() => setActiveModal("exchange")}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Exchange</span>
          </button>

          <button
            onClick={() => setActiveModal("refund")}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Refund</span>
          </button>

          <button
            onClick={() => setActiveModal("complaint")}
            className="px-3 py-1.5 bg-[#052A51] hover:bg-[#031c38] text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>+ Custom Note</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── 3. ONE-SCREEN CALL VIEW: 3 COMPACT TILES ── */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Tile 1: Customer & Delivery Destination */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Customer Details
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                Verified Buyer
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#052A51] text-white font-bold flex items-center justify-center text-sm shrink-0">
                {(order.customerName || "C").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 truncate">
                  {order.customerName || "Customer"}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <Phone className="w-3 h-3 text-[#25D366]" />
                  <span>{order.customerPhone}</span>
                  <button
                    onClick={() => handleCopy(order.customerPhone, "phone")}
                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Copy Phone Number"
                  >
                    {copiedField === "phone" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                <span>Site / Delivery Address</span>
                <button
                  onClick={() => handleCopy(order.deliveryAddress || "", "address")}
                  className="text-[#052A51] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {copiedField === "address" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-xs text-slate-800 leading-snug">
                {order.deliveryAddress || "Standard delivery location"}
                {order.deliveryCity ? `, ${order.deliveryCity}` : ""}
                {order.deliveryPostalCode ? ` - ${order.deliveryPostalCode}` : ""}
              </p>
              {order.deliveryInstructions && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded-lg mt-1 border border-amber-200">
                  <strong>Instructions:</strong> {order.deliveryInstructions}
                </p>
              )}
            </div>
          </div>

          {/* Customer History Counter */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Orders by Customer:</span>
            <span className="font-bold text-slate-900">
              {allCustomerOrders.length || 1} Total Orders
            </span>
          </div>
        </div>

        {/* Tile 2: Ordered Items Breakdown */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Ordered Items ({order.items?.length || 0})
              </span>
              <span className="text-xs font-bold text-slate-700">
                Total: ₹{order.total?.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(order.items || []).map((item: any) => (
                <div
                  key={item.id}
                  className="p-2 bg-slate-50 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                    <p className="text-[11px] text-slate-500">
                      {item.boxQuantity} boxes @ ₹{item.pricePerBox}/box
                    </p>
                  </div>
                  <span className="font-black text-slate-900 shrink-0">
                    ₹{item.totalPrice?.toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Snapshot */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Payment:</span>
            <span className="font-bold text-slate-800">
              {order.paymentMethod || "COD"} •{" "}
              <strong className={order.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"}>
                {order.paymentStatus || "Pending"}
              </strong>
            </span>
          </div>
        </div>

        {/* Tile 3: Active Return/Complaint Log on this Order */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Recent Notes & Tickets ({order.complaints?.length || 0})
              </span>
              <button
                onClick={() => setActiveModal("complaint")}
                className="text-[10px] font-bold text-[#052A51] hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.complaints && order.complaints.length > 0 ? (
                order.complaints.slice(0, 3).map((comp: any) => (
                  <div
                    key={comp.id}
                    className="p-2 bg-slate-50 rounded-xl text-xs space-y-0.5 border border-slate-100"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase px-1 rounded bg-[#052A51] text-white">
                        {comp.priority}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comp.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <p className="text-slate-800 text-[11px] leading-tight line-clamp-2">
                      {comp.note}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No complaints logged yet. Use quick buttons above to record call feedback.
                </p>
              )}
            </div>
          </div>

          {order.returnRequests && order.returnRequests.length > 0 && (
            <div className="pt-2 border-t border-slate-100 text-xs text-orange-800 font-bold flex items-center justify-between">
              <span>Return Status:</span>
              <span className="bg-orange-100 px-2 py-0.5 rounded text-[10px] uppercase">
                {order.returnRequests[0].status} ({order.returnRequests[0].type})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ── 4. MULTI-ORDER DRAWER (IF CUSTOMER HAS MULTIPLE ORDERS) ── */}
      {/* ========================================================================= */}
      {otherOrders.length > 0 && (
        <div className="bg-slate-100/80 p-3 rounded-2xl border border-slate-200">
          <button
            onClick={() => setShowOtherOrders((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            <span>
              📦 Customer Has {otherOrders.length} Other Order(s) on Record
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#052A51]">
              <span>{showOtherOrders ? "Hide other orders" : "View & Switch"}</span>
              {showOtherOrders ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showOtherOrders && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2.5 pt-2 border-t border-slate-200">
              {otherOrders.map((other) => (
                <div
                  key={other.id}
                  onClick={() => onSelectOrder(other)}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#052A51] transition-all cursor-pointer shadow-2xs flex items-center justify-between text-xs group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900 group-hover:text-[#052A51]">
                        #{other.id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          other.orderStatus === "Delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : other.orderStatus === "Shipped"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {other.orderStatus}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(other.createdAt).toLocaleDateString("en-IN")} • {other.items?.length || 0} items
                    </p>
                  </div>
                  <span className="font-black text-slate-900">₹{other.total?.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Active Action Modals ── */}
      {activeModal === "return" && (
        <RaiseReturnModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => onOrderUpdated()}
        />
      )}

      {activeModal === "exchange" && (
        <RaiseExchangeModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => onOrderUpdated()}
        />
      )}

      {activeModal === "refund" && (
        <ProcessRefundModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => onOrderUpdated()}
        />
      )}

      {activeModal === "complaint" && (
        <AddComplaintModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => onOrderUpdated()}
        />
      )}
    </div>
  );
}
