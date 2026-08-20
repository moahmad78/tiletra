"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Search,
  ArrowRight,
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  MinusSquare,
} from "lucide-react";
import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
  deleteOrdersBulk,
} from "@/lib/actions/orders";
import { useSocket } from "@/lib/socket";
import { useLiveSync, broadcastLiveEvent } from "@/lib/live-sync";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const STATUS_FILTERS = [
  "All",
  "Processing",
  "Confirmed",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Single order delete state
  const [orderToDelete, setOrderToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-select / Bulk delete state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Universal Live Sync Hook (Cross-tab broadcast + Tab Focus + 3.5s Auto-Poll) ──
  useLiveSync({
    eventTypes: ["order:new", "order:status-updated", "data:refresh"],
    onSync: loadOrders,
    pollIntervalMs: 3500,
    enableFocusRefresh: true,
  });

  // ── Real-Time Order Stream (Phase 5b PRD Socket fallback) ──
  useSocket("admin", {
    "new-order": (newOrderData: any) => {
      console.log("⚡ [ADMIN ORDERS: live new-order received]", newOrderData);
      loadOrders();
    },
    "order-status-updated": (updateData: any) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === updateData.orderId
            ? { ...o, orderStatus: updateData.orderStatus, estimatedDelivery: updateData.estimatedDelivery }
            : o
        )
      );
    },
  });

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);

    const matchesStatus =
      statusFilter === "All" || o.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Multi-select helpers
  const isAllSelected =
    filteredOrders.length > 0 &&
    filteredOrders.every((o) => selectedOrderIds.includes(o.id));

  const isSomeSelected =
    filteredOrders.some((o) => selectedOrderIds.includes(o.id)) && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      // Unselect all currently filtered orders
      const filteredIds = new Set(filteredOrders.map((o) => o.id));
      setSelectedOrderIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Select all currently filtered orders
      const filteredIds = filteredOrders.map((o) => o.id);
      setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
    );

    const res = await updateOrderStatus(orderId, newStatus);
    if (res.success) {
      // Instant cross-tab broadcast to all vendor & admin panels
      broadcastLiveEvent("order:status-updated", { orderId, orderStatus: newStatus });
      toast.success(`Order ${orderId} status set to ${newStatus}`);
    } else {
      toast.error(res.error || "Failed to update status");
      loadOrders();
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    const targetId = orderToDelete.id;

    setIsDeleting(true);
    // Optimistic UI drop
    setOrders((prev) => prev.filter((o) => o.id !== targetId));
    setSelectedOrderIds((prev) => prev.filter((id) => id !== targetId));

    try {
      const res = await deleteOrder(targetId);
      if (res.success) {
        toast.success(res.message || `Order #${targetId} deleted successfully`);
        broadcastLiveEvent("order:status-updated", { orderId: targetId, deleted: true });
        broadcastLiveEvent("data:refresh");
        setOrderToDelete(null);
      } else {
        toast.error(res.error || "Failed to delete order");
        loadOrders();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete order");
      loadOrders();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (selectedOrderIds.length === 0) return;

    const count = selectedOrderIds.length;
    const targetIds = [...selectedOrderIds];
    setIsBulkDeleting(true);

    // Optimistic UI drop
    setOrders((prev) => prev.filter((o) => !targetIds.includes(o.id)));
    setSelectedOrderIds([]);

    try {
      const res = await deleteOrdersBulk(targetIds);
      if (res.success) {
        toast.success(res.message || `Deleted ${count} order(s) permanently`);
        broadcastLiveEvent("order:status-updated", { deletedIds: targetIds });
        broadcastLiveEvent("data:refresh");
        setShowBulkDeleteModal(false);
      } else {
        toast.error(res.error || "Failed to delete selected orders");
        loadOrders();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to bulk delete orders");
      loadOrders();
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Dispatched":
      case "Out for Delivery":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Processing":
      case "Confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Cancelled":
      case "Returned":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading orders from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Order Management</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track customer orders, shipments, and payment fulfillments in PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
            {orders.filter((o) => o.orderStatus === "Delivered").length} Delivered
          </span>
          <span className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
            {orders.filter((o) => o.orderStatus === "Processing" || o.orderStatus === "Confirmed").length} Pending
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID, customer name, or phone..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          {/* Status Tabs Bar */}
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto py-1 scrollbar-none">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === s
                    ? "bg-[#052a51] text-white shadow-xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table & Bulk Action Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden relative">
        {/* Floating / Sticky Bulk Actions Bar */}
        {selectedOrderIds.length > 0 && (
          <div className="bg-[#052a51] text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#041f3d] animate-in slide-in-from-top-2 duration-150 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-[#F26522] text-white text-xs font-black">
                {selectedOrderIds.length} Selected
              </span>
              <p className="text-xs font-bold text-white/90 hidden sm:block">
                Marked orders ready for batch management
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderIds([])}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Deselect All
              </button>

              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Delete Marked ({selectedOrderIds.length})</span>
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = isSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded text-[#F26522] focus:ring-[#F26522] border-gray-300 cursor-pointer accent-[#F26522]"
                    title="Select / Deselect all"
                  />
                </th>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer & Location</th>
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Amount & Payment</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-sm">
                    No orders matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrderIds.includes(order.id);
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isSelected ? "bg-orange-50/60" : "hover:bg-gray-50/70"
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOrder(order.id)}
                          className="w-4 h-4 rounded text-[#F26522] focus:ring-[#F26522] border-gray-300 cursor-pointer accent-[#F26522]"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-black text-[#052a51] hover:text-[#F26522] text-sm"
                        >
                          {order.id}
                        </Link>
                        <p className="text-[10px] text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#052a51]">{order.customerName}</p>
                        <p className="text-[10px] text-gray-500">
                          {order.shippingAddress?.city || "Bangalore"}, {order.shippingAddress?.pincode || ""}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">{order.customerPhone}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-[#052a51]">
                          {order.items?.length || 0} tile design(s)
                        </p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]">
                          {order.items?.map((i: any) => `${i.productName} (${i.boxQuantity}bx)`).join(", ")}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-[#052a51] text-sm">
                          {formatPrice(order.total)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-extrabold rounded">
                            {order.paymentStatus}
                          </span>
                          <span className="text-[10px] text-gray-400">{order.paymentMethod}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={order.orderStatus}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none cursor-pointer ${getStatusBadge(
                            order.orderStatus
                          )}`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#052a51] text-white hover:bg-[#041f3d] text-xs font-bold rounded-xl shadow-2xs active:scale-95 transition-all"
                          >
                            <span>Manage</span>
                            <ArrowRight size={13} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setOrderToDelete(order)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl border border-red-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                            title="Delete Order Permanently"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-lg font-black text-[#052a51]">Delete Order Permanently?</h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete order{" "}
              <strong className="text-[#052a51] font-mono">#{orderToDelete.id}</strong> (Customer:{" "}
              {orderToDelete.customerName}, Total: {formatPrice(orderToDelete.total)})? This will remove all items and split records from the database.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={24} />
              </div>
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <h3 className="text-lg font-black text-[#052a51]">
              Delete {selectedOrderIds.length} Marked Orders?
            </h3>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Are you sure you want to permanently delete all{" "}
              <strong className="text-[#052a51] font-bold">{selectedOrderIds.length} marked orders</strong> from the database? This action cannot be undone and will clean up all associated order items.
            </p>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDelete}
                disabled={isBulkDeleting}
                className="px-5 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting {selectedOrderIds.length} Orders...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Confirm Delete ({selectedOrderIds.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
