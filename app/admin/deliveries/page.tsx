"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Truck,
  PackageCheck,
  MapPin,
  Phone,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Building2,
  Calendar,
  AlertCircle,
  Check,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import {
  getPlatformDeliveryOrders,
  updatePlatformDeliveryStatus,
} from "@/lib/actions/vendor";
import { useLiveSync, broadcastLiveEvent } from "@/lib/live-sync";
import { formatPrice } from "@/lib/formatters";
import { toast } from "sonner";

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Status Update / Courier Assign Modal
  const [activeModalSplit, setActiveModalSplit] = useState<any | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>("picked_up");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [updating, setUpdating] = useState(false);

  const loadDeliveries = async () => {
    try {
      const data = await getPlatformDeliveryOrders();
      setDeliveries(data);
    } catch (e) {
      console.error("Error loading platform deliveries:", e);
    } finally {
      setLoading(false);
    }
  };

  useLiveSync({
    eventTypes: ["order:new", "order:status-updated", "data:refresh"],
    onSync: loadDeliveries,
    pollIntervalMs: 3500,
    enableFocusRefresh: true,
  });

  const handleUpdateStatus = async () => {
    if (!activeModalSplit) return;
    setUpdating(true);

    const res = await updatePlatformDeliveryStatus(
      activeModalSplit.id,
      targetStatus,
      trackingNumber,
      courierName,
      paymentCollected
    );
    setUpdating(false);

    if (res.success) {
      broadcastLiveEvent("order:status-updated", {
        splitId: activeModalSplit.id,
        fulfillmentStatus: targetStatus,
      });
      toast.success(res.message);
      setActiveModalSplit(null);
      loadDeliveries();
    } else {
      toast.error(res.error || "Failed to update platform delivery status");
    }
  };

  const filteredDeliveries = deliveries.filter((item) => {
    const status = item.fulfillmentStatus?.toLowerCase();
    const matchesTab =
      tab === "all" ||
      (tab === "ready" && status === "ready_for_pickup") ||
      (tab === "transit" && (status === "picked_up" || status === "dispatched")) ||
      (tab === "out" && status === "out_for_delivery") ||
      (tab === "delivered" && status === "delivered") ||
      (tab === "cod_pending" && item.parentOrder?.paymentMethod === "COD" && !item.paymentCollected);

    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      item.orderId?.toLowerCase().includes(query) ||
      item.vendor?.businessName?.toLowerCase().includes(query) ||
      item.parentOrder?.customerName?.toLowerCase().includes(query) ||
      item.parentOrder?.customerPhone?.includes(query);

    return matchesTab && matchesQuery;
  });

  // KPI Metrics
  const readyCount = deliveries.filter((d) => d.fulfillmentStatus?.toLowerCase() === "ready_for_pickup").length;
  const inTransitCount = deliveries.filter((d) => ["picked_up", "dispatched", "out_for_delivery"].includes(d.fulfillmentStatus?.toLowerCase())).length;
  const deliveredCount = deliveries.filter((d) => d.fulfillmentStatus?.toLowerCase() === "delivered").length;
  const pendingCodTotal = deliveries
    .filter((d) => d.parentOrder?.paymentMethod === "COD" && !d.paymentCollected)
    .reduce((sum, d) => sum + (d.subtotal || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                Platform Logistics & Centralized Deliveries
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Central hub to manage pickup from vendors, transit tracking, doorstep delivery & COD cash reconciliation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Ready for Pickup</p>
          <p className="text-2xl font-black text-cyan-600 mt-1">{readyCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Packed by vendors</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">In Transit & Out</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{inTransitCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">With Intrihub drivers</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Delivered</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{deliveredCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Fulfillment complete</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Pending COD Collection</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{formatPrice(pendingCodTotal)}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Cash awaiting reconciliation</p>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "All Platform Orders" },
            { id: "ready", label: `Ready for Pickup (${readyCount})` },
            { id: "transit", label: `In Transit (${inTransitCount})` },
            { id: "out", label: "Out for Delivery" },
            { id: "delivered", label: "Delivered" },
            { id: "cod_pending", label: "COD Uncollected" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                tab === t.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order #, Vendor, Customer..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-gray-400">Loading platform deliveries...</div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-2xs">
          <Truck size={36} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700">No platform delivery orders found</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Orders placed from vendors who chose Platform Centralized Logistics will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDeliveries.map((split) => {
            const isExpanded = expandedId === split.id;
            const parent = split.parentOrder;
            const status = split.fulfillmentStatus?.toLowerCase();

            return (
              <div
                key={split.id}
                className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden transition-all hover:border-gray-300"
              >
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/orders/${split.orderId}`}
                        className="font-mono font-bold text-sm text-[#052a51] hover:underline flex items-center gap-1"
                      >
                        #{split.orderId}
                        <ExternalLink size={12} />
                      </Link>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                          status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : status === "picked_up" || status === "dispatched"
                            ? "bg-amber-100 text-amber-800"
                            : status === "out_for_delivery"
                            ? "bg-indigo-100 text-indigo-800"
                            : status === "ready_for_pickup"
                            ? "bg-cyan-100 text-cyan-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {split.fulfillmentStatus?.replace(/_/g, " ")}
                      </span>

                      {/* COD / Online Badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          parent?.paymentMethod === "COD"
                            ? split.paymentCollected
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {parent?.paymentMethod === "COD"
                          ? split.paymentCollected
                            ? "COD Cash Collected"
                            : "COD Cash Pending"
                          : "Prepaid Online"}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 flex items-center gap-2 flex-wrap">
                      <span>
                        Vendor:{" "}
                        <Link
                          href={`/admin/vendors/${split.vendorId}`}
                          className="font-bold text-gray-800 hover:underline"
                        >
                          {split.vendor?.businessName || "Vendor"}
                        </Link>
                      </span>
                      <span>•</span>
                      <span>Customer: <strong>{parent?.customerName}</strong> ({(parent?.shippingAddress as any)?.city || "Bangalore"})</span>
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="flex items-center gap-4 flex-wrap justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Split Value</p>
                      <p className="text-sm font-black text-gray-900">{formatPrice(split.subtotal)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        Payout: {formatPrice(split.vendorPayoutAmount || split.subtotal * 0.85)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModalSplit(split);
                          setTargetStatus(
                            status === "ready_for_pickup"
                              ? "picked_up"
                              : status === "picked_up"
                              ? "out_for_delivery"
                              : status === "out_for_delivery"
                              ? "delivered"
                              : status
                          );
                          setCourierName(split.courierName || "Intrihub Logistics Van");
                          setTrackingNumber(split.trackingNumber || "");
                          setPaymentCollected(split.paymentCollected);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Truck size={13} />
                        <span>Manage Transit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : split.id)}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Vendor Pickup Address */}
                      <div className="space-y-1 bg-white p-3 rounded-xl border border-gray-200/60">
                        <p className="font-bold text-gray-700 uppercase text-[10px]">Vendor Pickup Location</p>
                        <p className="text-gray-900 font-semibold">{split.vendor?.businessName}</p>
                        <p className="text-gray-600 text-[11px]">{split.vendor?.businessAddress || "Warehouse Address"}</p>
                        <p className="text-gray-500 text-[11px]">Phone: {split.vendor?.contactPhone}</p>
                      </div>

                      {/* Customer Delivery Address & GPS Navigation */}
                      <div className="space-y-1.5 bg-white p-3 rounded-xl border border-gray-200/60 flex flex-col justify-between">
                        <div>
                          <p className="font-bold text-gray-700 uppercase text-[10px]">Customer Doorstep & GPS</p>
                          <p className="text-gray-900 font-semibold">{parent?.deliveryName || parent?.customerName}</p>
                          <p className="text-gray-600 text-[11px]">
                            {parent?.deliveryAddress || [
                              parent?.deliveryHouseNumber,
                              parent?.deliveryBuildingName,
                              parent?.deliveryStreet || (parent?.shippingAddress as any)?.street,
                              parent?.deliveryArea,
                              parent?.deliveryCity || (parent?.shippingAddress as any)?.city,
                              parent?.deliveryPostalCode || (parent?.shippingAddress as any)?.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          {(!parent?.deliveryAddress && parent?.deliveryLandmark) && (
                            <p className="text-amber-700 text-[11px] font-semibold">
                              📍 Landmark: {parent?.deliveryLandmark}
                            </p>
                          )}
                          {parent?.deliveryInstructions && (
                            <p className="text-blue-700 text-[11px] bg-blue-50/60 p-1.5 rounded-lg border border-blue-100">
                              ℹ️ Instructions: {parent?.deliveryInstructions}
                            </p>
                          )}
                          <p className="text-gray-500 text-[11px]">Phone: {parent?.deliveryPhone || parent?.customerPhone}</p>
                        </div>

                        {/* Exact Coordinates Navigation CTA */}
                        {(() => {
                          const lat = parent?.deliveryLatitude || (parent?.shippingAddress as any)?.latitude;
                          const lng = parent?.deliveryLongitude || (parent?.shippingAddress as any)?.longitude;
                          if (!lat || !lng) return null;
                          return (
                            <div className="pt-2 mt-1 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] font-mono text-gray-500 font-bold">
                                {lat.toFixed(4)}, {lng.toFixed(4)}
                              </span>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F26522] hover:bg-[#d95314] text-white text-[11px] font-black rounded-lg shadow-2xs transition-colors"
                              >
                                <MapPin size={11} />
                                <span>Navigate GPS</span>
                              </a>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Transit & Fleet Info */}
                      <div className="space-y-1 bg-white p-3 rounded-xl border border-gray-200/60">
                        <p className="font-bold text-gray-700 uppercase text-[10px]">Assigned Driver / Fleet</p>
                        <p className="text-gray-900 font-semibold">{split.courierName || "Unassigned"}</p>
                        <p className="text-gray-600 font-mono text-[11px]">
                          Tracking / Crate ID: {split.trackingNumber || "N/A"}
                        </p>
                        <p className="text-gray-500 text-[11px]">
                          Delivered At: {split.deliveredAt ? new Date(split.deliveredAt).toLocaleString("en-IN") : "Pending"}
                        </p>
                      </div>
                    </div>

                    {/* Items to Transport */}
                    {parent?.items && parent.items.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-200/60">
                        <p className="font-bold text-gray-700 uppercase text-[10px]">Items for this Pickup</p>
                        <div className="space-y-1.5">
                          {parent.items.map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 bg-white rounded-xl border border-gray-200/60"
                            >
                              <div className="flex items-center gap-2.5">
                                {item.image && (
                                  <img
                                    src={item.image}
                                    alt={item.productName}
                                    className="w-9 h-9 rounded-lg object-cover bg-gray-100"
                                  />
                                )}
                                <div>
                                  <p className="font-bold text-gray-900 text-xs">{item.productName}</p>
                                  <p className="text-[11px] text-gray-500">
                                    Qty: {item.boxQuantity} Boxes • {item.variantDetails || "Standard"}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-gray-900 text-xs">
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

      {/* Manage Transit / Status Modal */}
      {activeModalSplit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Update Platform Logistics — #{activeModalSplit.orderId}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Vendor: <strong>{activeModalSplit.vendor?.businessName}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Logistics Stage / Status
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden font-semibold"
                >
                  <option value="ready_for_pickup">📦 Ready for Pickup (Packed at Vendor)</option>
                  <option value="picked_up">🚚 Picked Up (In Intrihub Fleet)</option>
                  <option value="out_for_delivery">📍 Out for Delivery (Last-Mile)</option>
                  <option value="delivered">✅ Delivered to Customer Doorstep</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Driver / Vehicle Name
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Intrihub Truck #4 / Ramesh (9876543210)"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  AWB Tracking Number / Crate Barcode
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. IHB-LOG-90234"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden font-mono"
                />
              </div>

              {activeModalSplit.parentOrder?.paymentMethod === "COD" && (
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentCollected}
                    onChange={(e) => setPaymentCollected(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-amber-900">COD Cash Collected from Customer</p>
                    <p className="text-[11px] text-amber-700">
                      Check once ₹{Number(activeModalSplit.subtotal).toLocaleString("en-IN")} cash is received by driver.
                    </p>
                  </div>
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalSplit(null)}
                className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleUpdateStatus}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {updating ? "Saving..." : "Save Delivery Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
