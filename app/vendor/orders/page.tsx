"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Truck,
  PackageCheck,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Phone,
  Calendar,
  ExternalLink,
  Search,
  Check,
} from "lucide-react";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getVendorOrders, updateVendorFulfillmentStatus } from "@/lib/actions/vendor";
import { useLiveSync, broadcastLiveEvent } from "@/lib/live-sync";
import { formatPrice } from "@/lib/formatters";
import { toast } from "sonner";

export default function VendorOrdersPage() {
  const { vendor } = useVendorAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Dispatch Tracking Modal State
  const [dispatchModalSplit, setDispatchModalSplit] = useState<any | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadOrders = async () => {
    if (!vendor?.id) return;
    try {
      const data = await getVendorOrders(vendor.id);
      setOrders(data);
    } catch (e) {
      console.error("Error loading vendor orders:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Universal Live Sync Hook (Cross-tab broadcast + Tab Focus + 3.5s Auto-Poll) ──
  useLiveSync({
    eventTypes: ["order:new", "order:status-updated", "data:refresh"],
    onSync: loadOrders,
    pollIntervalMs: 3500,
    enableFocusRefresh: true,
  });

  const handleStatusChange = async (
    splitId: string,
    newStatus: "Processing" | "Dispatched" | "Delivered" | "Cancelled",
    tracking?: string,
    courier?: string
  ) => {
    if (!vendor?.id) return;
    setUpdating(true);

    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === splitId ? { ...o, fulfillmentStatus: newStatus } : o))
    );

    const res = await updateVendorFulfillmentStatus(
      splitId,
      vendor.id,
      newStatus,
      tracking,
      courier
    );
    setUpdating(false);

    if (res.success) {
      // Instant cross-tab broadcast to all admin and customer tabs
      broadcastLiveEvent("order:status-updated", { splitId, fulfillmentStatus: newStatus });
      toast.success(res.message);
      setDispatchModalSplit(null);
      loadOrders();
    } else {
      toast.error(res.error || "Failed to update order status");
      loadOrders();
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" ||
      order.fulfillmentStatus.toLowerCase() === statusFilter.toLowerCase();
    const term = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !term ||
      order.orderId.toLowerCase().includes(term) ||
      order.parentOrder?.customerName?.toLowerCase().includes(term) ||
      order.parentOrder?.customerPhone?.includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Order Fulfillment & Splits
          </h1>
          <p className="text-xs text-gray-500">
            View orders containing your shop's items, dispatch crates, and track payouts
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
          <ShieldCheck size={14} />
          <span>Vendor-Isolated Queue: Only your items shown</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {["all", "processing", "dispatched", "delivered", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === s
                  ? "bg-[#052a51] text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID or Name..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center text-xs text-gray-400 font-medium">
          Loading your shop's orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-gray-200/80 text-center space-y-3">
          <ShoppingBag size={40} className="text-gray-300 mx-auto" />
          <h3 className="text-sm font-bold text-gray-800">No Orders Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            When customers purchase products uploaded by {vendor?.businessName || "your shop"}, their order line items will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((split) => {
            const isExpanded = expandedOrderId === split.id;
            const parent = split.parentOrder;

            return (
              <div
                key={split.id}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden transition-all hover:border-gray-300"
              >
                {/* Order Row Header */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-[#052a51]">
                        #{split.orderId}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                          split.fulfillmentStatus === "Delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : split.fulfillmentStatus === "Dispatched"
                            ? "bg-amber-100 text-amber-800"
                            : split.fulfillmentStatus === "Cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {split.fulfillmentStatus}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {new Date(split.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 font-medium">
                      Customer: <strong>{parent?.customerName || "Customer"}</strong> •{" "}
                      {(parent?.shippingAddress as any)?.city || "Bangalore"}
                    </p>
                  </div>

                  {/* Financials & Actions */}
                  <div className="flex items-center gap-4 flex-wrap justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Your Net Payout</p>
                      <p className="text-sm font-black text-emerald-600">
                        {formatPrice(split.vendorPayoutAmount)}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        Item Subtotal: {formatPrice(split.subtotal)} (-{split.commissionRate}%)
                      </p>
                    </div>

                    {/* Status Action Buttons */}
                    <div className="flex items-center gap-1.5">
                      {split.fulfillmentStatus === "Processing" && (
                        <button
                          type="button"
                          onClick={() => {
                            setDispatchModalSplit(split);
                            setCourierName(split.courierName || "Intrihub Logistics");
                            setTrackingNumber(split.trackingNumber || "");
                          }}
                          className="px-3 py-1.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Truck size={13} />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {split.fulfillmentStatus === "Dispatched" && (
                        <button
                          type="button"
                          disabled={updating}
                          onClick={() => handleStatusChange(split.id, "Delivered")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} strokeWidth={3} />
                          <span>Mark Delivered</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setExpandedOrderId(isExpanded ? null : split.id)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="bg-gray-50/70 border-t border-gray-100 p-4 sm:p-5 text-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Customer & Shipping */}
                      <div className="space-y-1.5">
                        <p className="font-bold text-gray-700 uppercase text-[10px]">
                          Delivery Address
                        </p>
                        <p className="text-gray-900 font-medium">
                          {(parent?.shippingAddress as any)?.street},{" "}
                          {(parent?.shippingAddress as any)?.landmark && `${(parent?.shippingAddress as any)?.landmark}, `}
                          {(parent?.shippingAddress as any)?.city},{" "}
                          {(parent?.shippingAddress as any)?.state} - {(parent?.shippingAddress as any)?.pincode}
                        </p>
                        <p className="text-gray-500 text-[11px]">
                          Phone: {parent?.customerPhone} • Email: {parent?.customerEmail}
                        </p>
                      </div>

                      {/* Fulfillment & Tracking */}
                      <div className="space-y-1.5">
                        <p className="font-bold text-gray-700 uppercase text-[10px]">
                          Courier & Tracking
                        </p>
                        <p className="text-gray-900 font-medium">
                          Courier: {split.courierName || "Standard Freight Driver"}
                        </p>
                        <p className="text-gray-500 font-mono text-[11px]">
                          Tracking / Crate ID: {split.trackingNumber || "Assigned on Dispatch"}
                        </p>
                      </div>
                    </div>

                    {/* Line Items */}
                    {parent?.items && parent.items.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="font-bold text-gray-700 uppercase text-[10px]">Order Items</p>
                        <div className="space-y-1.5">
                          {parent.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-gray-200/60"
                            >
                              <div className="flex items-center gap-2.5">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-10 h-10 rounded-lg object-cover bg-gray-100"
                                  />
                                )}
                                <div>
                                  <p className="font-bold text-gray-900">{item.productName}</p>
                                  <p className="text-[11px] text-gray-500">
                                    Qty: {item.boxQuantity} Boxes • {item.variantDetails || "Standard"}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-gray-900">
                                {formatPrice(item.totalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalSplit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div>
              <h3 className="text-base font-black text-[#052a51]">
                Mark Order #{dispatchModalSplit.orderId} as Dispatched
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter freight tracking or driver dispatch details
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Courier / Logistics Partner
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Intrihub Logistics / Self Delivery"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Tracking Number / Crate Barcode (Optional)
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. TRK-892348 or Driver Contact"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDispatchModalSplit(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={() =>
                  handleStatusChange(
                    dispatchModalSplit.id,
                    "Dispatched",
                    trackingNumber,
                    courierName
                  )
                }
                className="px-5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {updating ? "Saving..." : "Confirm Dispatch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
