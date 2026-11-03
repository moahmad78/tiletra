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
  Send,
  Printer,
  RefreshCw,
  XCircle,
  Zap,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import {
  getPlatformDeliveryOrders,
  updatePlatformDeliveryStatus,
} from "@/lib/actions/vendor";
import {
  bookShiprocketShipmentAction,
  generateShiprocketAWBAction,
  scheduleShiprocketPickupAction,
  getShiprocketLabelAction,
  cancelShiprocketShipmentAction,
  getShiprocketRatesForSplitAction,
  syncShiprocketStatusAction,
} from "@/lib/actions/shiprocket";
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

  // Shiprocket Rates & Booking Modal
  const [rateModalSplit, setRateModalSplit] = useState<any | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [ratesData, setRatesData] = useState<any | null>(null);
  const [bookingCourierId, setBookingCourierId] = useState<number | null>(null);

  // Shiprocket Live Tracking Modal
  const [trackingModalSplit, setTrackingModalSplit] = useState<any | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingData, setTrackingData] = useState<any | null>(null);

  // Action busy states
  const [busyActionSplitId, setBusyActionSplitId] = useState<string | null>(null);

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

  // ── Shiprocket Actions ──

  const handleOpenRatesModal = async (split: any) => {
    setRateModalSplit(split);
    setLoadingRates(true);
    setRatesData(null);
    try {
      const rates = await getShiprocketRatesForSplitAction(split.id);
      if (rates.success) {
        setRatesData(rates);
      } else {
        toast.error(rates.error || "Could not check Shiprocket serviceability");
      }
    } catch (err: any) {
      toast.error("Failed to fetch Shiprocket rates");
    } finally {
      setLoadingRates(false);
    }
  };

  const handleBookShiprocket = async (splitId: string, courierId?: number) => {
    setBookingCourierId(courierId || 0);
    try {
      const res = await bookShiprocketShipmentAction(splitId, courierId);
      if (res.success) {
        toast.success(res.message);
        setRateModalSplit(null);
        loadDeliveries();
      } else {
        toast.error(res.error || "Failed to book Shiprocket shipment");
      }
    } catch (err: any) {
      toast.error("Booking failed");
    } finally {
      setBookingCourierId(null);
    }
  };

  const handleOpenTrackingModal = async (split: any) => {
    setTrackingModalSplit(split);
    setLoadingTracking(true);
    setTrackingData(null);
    try {
      const res = await fetch(`/api/shipping/track?splitId=${split.id}`);
      const data = await res.json();
      if (data.success) {
        setTrackingData(data);
      } else {
        toast.error(data.error || "Could not fetch tracking checkpoints");
      }
    } catch (err) {
      toast.error("Tracking lookup failed");
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleSchedulePickup = async (splitId: string) => {
    setBusyActionSplitId(splitId);
    try {
      const res = await scheduleShiprocketPickupAction(splitId);
      if (res.success) {
        toast.success(res.message);
        loadDeliveries();
      } else {
        toast.error(res.error || "Failed to schedule pickup");
      }
    } catch (err) {
      toast.error("Pickup scheduling failed");
    } finally {
      setBusyActionSplitId(null);
    }
  };

  const handlePrintLabel = async (splitId: string) => {
    setBusyActionSplitId(splitId);
    try {
      const res = await getShiprocketLabelAction(splitId);
      if (res.success && res.labelUrl) {
        window.open(res.labelUrl, "_blank");
      } else {
        toast.error(res.error || "Shipping label not available yet");
      }
    } catch (err) {
      toast.error("Label fetch failed");
    } finally {
      setBusyActionSplitId(null);
    }
  };

  const handleSyncStatus = async (splitId: string) => {
    setBusyActionSplitId(splitId);
    try {
      const res = await syncShiprocketStatusAction(splitId);
      if (res.success) {
        toast.success(`Synced! Status: ${res.currentStatus || res.fulfillmentStatus}`);
        loadDeliveries();
      } else {
        toast.error(res.error || "Status sync failed");
      }
    } catch (err) {
      toast.error("Sync failed");
    } finally {
      setBusyActionSplitId(null);
    }
  };

  const handleCancelShipment = async (splitId: string) => {
    if (!confirm("Are you sure you want to cancel this Shiprocket shipment?")) return;
    setBusyActionSplitId(splitId);
    try {
      const res = await cancelShiprocketShipmentAction(splitId);
      if (res.success) {
        toast.success(res.message || "Shipment cancelled");
        loadDeliveries();
      } else {
        toast.error(res.error || "Cancellation failed");
      }
    } catch (err) {
      toast.error("Cancellation failed");
    } finally {
      setBusyActionSplitId(null);
    }
  };

  const filteredDeliveries = deliveries.filter((item) => {
    const status = item.fulfillmentStatus?.toLowerCase();
    const provider = item.thirdPartyProvider?.toLowerCase();

    const matchesTab =
      tab === "all" ||
      (tab === "shiprocket" && provider === "shiprocket") ||
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
      item.parentOrder?.customerPhone?.includes(query) ||
      item.trackingNumber?.toLowerCase().includes(query);

    return matchesTab && matchesQuery;
  });

  // KPI Metrics
  const readyCount = deliveries.filter((d) => d.fulfillmentStatus?.toLowerCase() === "ready_for_pickup").length;
  const inTransitCount = deliveries.filter((d) => ["picked_up", "dispatched", "out_for_delivery"].includes(d.fulfillmentStatus?.toLowerCase())).length;
  const deliveredCount = deliveries.filter((d) => d.fulfillmentStatus?.toLowerCase() === "delivered").length;
  const shiprocketCount = deliveries.filter((d) => d.thirdPartyProvider?.toLowerCase() === "shiprocket").length;
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
                Manage hyperlocal riders (In-house, Borzo, Porter) and Pan-India courier shipping via Shiprocket.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Ready for Pickup</p>
          <p className="text-2xl font-black text-cyan-600 mt-1">{readyCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Packed by vendors</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">In Transit & Out</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{inTransitCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">On the road</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Delivered</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{deliveredCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Doorstep complete</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-200/80 bg-purple-50/20 shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Shiprocket Couriers</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{shiprocketCount}</p>
          <p className="text-[11px] text-purple-500 mt-0.5">Pan-India / Surface</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200/80 shadow-2xs col-span-2 lg:col-span-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Uncollected COD</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatPrice(pendingCodTotal)}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Cash awaiting reconciliation</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "All Orders" },
            { id: "ready", label: "Ready for Pickup", count: readyCount },
            { id: "transit", label: "In Transit", count: inTransitCount },
            { id: "shiprocket", label: "🚀 Shiprocket", count: shiprocketCount },
            { id: "delivered", label: "Delivered", count: deliveredCount },
            { id: "cod_pending", label: "COD Pending" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                tab === t.id
                  ? "bg-[#052a51] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    tab === t.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Order, Vendor, Phone, AWB..."
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
            const provider = split.thirdPartyProvider?.toLowerCase();
            const isShiprocket = provider === "shiprocket";
            const isBusy = busyActionSplitId === split.id;

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

                      {/* Provider Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isShiprocket
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : provider === "porter"
                            ? "bg-orange-100 text-orange-800 border border-orange-200"
                            : provider === "borzo"
                            ? "bg-green-100 text-green-800 border border-green-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}
                      >
                        {isShiprocket ? "🚀 Shiprocket" : provider === "porter" ? "🚚 Porter" : provider === "borzo" ? "🛵 Borzo" : "⚡ In-House"}
                      </span>

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

                      {split.trackingNumber && (
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                          AWB: {split.trackingNumber}
                        </span>
                      )}
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
                      <span>
                        Customer: <strong>{parent?.customerName}</strong> ({parent?.deliveryCity || (parent?.shippingAddress as any)?.city || "Bangalore"})
                      </span>
                      {split.totalWeightKg && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500 font-medium">Weight: {split.totalWeightKg}kg</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Financials & Action Buttons */}
                  <div className="flex items-center gap-3 flex-wrap justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Split Value</p>
                      <p className="text-sm font-black text-gray-900">{formatPrice(split.subtotal)}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold">
                        Payout: {formatPrice(split.vendorPayoutAmount || split.subtotal * 0.85)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Shiprocket Quick Action */}
                      {isShiprocket ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenTrackingModal(split)}
                            className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Live Courier Tracking Timeline"
                          >
                            <Send size={12} />
                            <span>Track</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handlePrintLabel(split.id)}
                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Print Shipping Label PDF"
                          >
                            <Printer size={12} />
                            <span>Label</span>
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSyncStatus(split.id)}
                            className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors cursor-pointer"
                            title="Sync tracking status from Shiprocket"
                          >
                            <RefreshCw size={13} className={isBusy ? "animate-spin" : ""} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenRatesModal(split)}
                          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Check live courier rates and book via Shiprocket"
                        >
                          <Zap size={12} />
                          <span>Book Shiprocket</span>
                        </button>
                      )}

                      {/* Standard Manage Transit Button */}
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
                        <span>Manage</span>
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
                      <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/60">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-gray-700 uppercase text-[10px]">Vendor Pickup Location</p>
                          <Building2 size={13} className="text-gray-400" />
                        </div>
                        <p className="text-gray-900 font-semibold">{split.vendor?.businessName}</p>
                        <p className="text-gray-600 text-[11px]">{split.vendor?.businessAddress || "Warehouse Address"}</p>
                        <p className="text-gray-500 text-[11px]">Phone: {split.vendor?.contactPhone}</p>
                      </div>

                      {/* Customer Delivery Address & GPS Navigation */}
                      <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-gray-200/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-700 uppercase text-[10px]">Customer Doorstep & Drop</p>
                            <MapPin size={13} className="text-gray-400" />
                          </div>
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
                          {parent?.deliveryInstructions && (
                            <p className="text-blue-700 text-[11px] bg-blue-50/60 p-1.5 rounded-lg border border-blue-100 mt-1">
                              ℹ️ Instructions: {parent?.deliveryInstructions}
                            </p>
                          )}
                          <p className="text-gray-500 text-[11px] mt-1">Phone: {parent?.deliveryPhone || parent?.customerPhone}</p>
                        </div>

                        {/* GPS Directions Link */}
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

                      {/* Transit & Carrier Info */}
                      <div className="space-y-2 bg-white p-3.5 rounded-xl border border-gray-200/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-700 uppercase text-[10px]">Carrier & Logistics Partner</p>
                            <Truck size={13} className="text-gray-400" />
                          </div>
                          <p className="text-gray-900 font-semibold mt-1">
                            {split.courierName || (isShiprocket ? "Shiprocket Partner" : "IntriHub Logistics")}
                          </p>
                          <p className="text-gray-600 font-mono text-[11px]">
                            AWB / Ref: {split.trackingNumber || split.thirdPartyRef || "Not assigned"}
                          </p>
                          {split.vehicleType && (
                            <p className="text-gray-500 text-[11px]">Vehicle: {split.vehicleType}</p>
                          )}
                        </div>

                        {/* Shiprocket Extra Actions */}
                        {isShiprocket && (
                          <div className="pt-2 border-t border-gray-100 flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleSchedulePickup(split.id)}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-bold border border-purple-200 cursor-pointer"
                            >
                              Request Pickup
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancelShipment(split.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[10px] font-bold border border-red-200 cursor-pointer"
                            >
                              Cancel Carrier
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items for this split */}
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

      {/* ── Manage Transit / Manual Status Modal ── */}
      {activeModalSplit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div>
              <h3 className="text-base font-black text-gray-900">
                Update Logistics Stage — #{activeModalSplit.orderId}
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
                  <option value="picked_up">🚚 Picked Up (In Transit)</option>
                  <option value="out_for_delivery">📍 Out for Delivery (Last-Mile)</option>
                  <option value="delivered">✅ Delivered to Customer Doorstep</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Courier Partner / Driver Name
                </label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  placeholder="e.g. Delhivery, Blue Dart, IntriHub Fleet"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  AWB Tracking Number / Barcode
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter consignment tracking number"
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
                      Check once ₹{Number(activeModalSplit.subtotal).toLocaleString("en-IN")} cash is collected.
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

      {/* ── Shiprocket Rates & Live Booking Modal ── */}
      {rateModalSplit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Shiprocket Courier Rate Comparison
                  </h3>
                  <p className="text-xs text-gray-500">
                    Order #{rateModalSplit.orderId} • Destination: {rateModalSplit.parentOrder?.deliveryPostalCode || "560001"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRateModalSplit(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            {loadingRates ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                <RefreshCw size={24} className="mx-auto text-purple-600 animate-spin" />
                <p>Querying Shiprocket courier network & rates...</p>
              </div>
            ) : !ratesData || !ratesData.couriers || ratesData.couriers.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <p className="font-semibold text-gray-700">No couriers available for this route</p>
                <p className="text-gray-400 mt-1">Check the delivery pincode and package weight.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-purple-900">Recommended Partner: </span>
                    <span className="text-purple-700">{ratesData.recommendedCourierName}</span>
                  </div>
                  <button
                    type="button"
                    disabled={bookingCourierId !== null}
                    onClick={() => handleBookShiprocket(rateModalSplit.id, ratesData.recommendedCourierId)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer text-xs"
                  >
                    {bookingCourierId === ratesData.recommendedCourierId ? "Booking..." : "Book Best Partner"}
                  </button>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    All Available Couriers ({ratesData.couriers.length})
                  </p>
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                    {ratesData.couriers.map((courier: any) => (
                      <div
                        key={courier.courier_company_id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-200/80 hover:border-purple-300 hover:bg-purple-50/20 transition-all text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{courier.courier_name}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-gray-100 text-gray-600">
                              {courier.call_courier_type || (courier.is_surface ? "Surface" : "Air")}
                            </span>
                          </p>
                          <p className="text-[11px] text-gray-500">
                            ETD: <strong className="text-gray-700">{courier.etd}</strong> • Rating: ⭐ {courier.rating}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-900">₹{courier.rate}</p>
                            <p className="text-[10px] text-gray-400">Est. Freight</p>
                          </div>
                          <button
                            type="button"
                            disabled={bookingCourierId !== null}
                            onClick={() => handleBookShiprocket(rateModalSplit.id, courier.courier_company_id)}
                            className="px-2.5 py-1.5 bg-gray-900 hover:bg-purple-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {bookingCourierId === courier.courier_company_id ? "Booking..." : "Select"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Shiprocket Live Tracking Modal ── */}
      {trackingModalSplit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Truck size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">
                    Live Consignment Tracking
                  </h3>
                  <p className="text-xs text-gray-500 font-mono">
                    AWB: {trackingModalSplit.trackingNumber || trackingModalSplit.thirdPartyRef || "N/A"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingModalSplit(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <XCircle size={20} />
              </button>
            </div>

            {loadingTracking ? (
              <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                <RefreshCw size={24} className="mx-auto text-purple-600 animate-spin" />
                <p>Connecting to courier tracking network...</p>
              </div>
            ) : !trackingData ? (
              <div className="py-8 text-center text-xs text-gray-500">
                <p>No active checkpoints found for this consignment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Banner */}
                <div className="p-3.5 bg-gradient-to-br from-[#052a51] to-[#1a3d6d] rounded-2xl text-white space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500 text-white">
                      {trackingData.currentStatus || "In Transit"}
                    </span>
                    <span className="text-xs text-white/80 font-bold">
                      {trackingData.etd ? `Est. Delivery: ${trackingData.etd}` : "In Progress"}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium pt-1">
                    Courier: <strong>{trackingData.courierName || trackingModalSplit.courierName || "Courier Partner"}</strong>
                  </p>
                  {(trackingData.origin || trackingData.destination) && (
                    <p className="text-[11px] text-white/70">
                      Route: {trackingData.origin} → {trackingData.destination}
                    </p>
                  )}
                </div>

                {/* Scans Timeline */}
                <div className="space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    Tracking Checkpoints ({trackingData.scans?.length || 0})
                  </p>

                  {(!trackingData.scans || trackingData.scans.length === 0) ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Package registered with courier. Awaiting initial hub scan.
                    </p>
                  ) : (
                    <div className="space-y-3 relative pl-3 border-l-2 border-purple-200">
                      {trackingData.scans.map((scan: any, i: number) => (
                        <div key={i} className="relative space-y-0.5 text-xs">
                          <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-purple-600 border-2 border-white" />
                          <p className="font-bold text-gray-900">{scan.activity}</p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <span>{scan.date}</span>
                            {scan.location && (
                              <>
                                <span>•</span>
                                <span>{scan.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
