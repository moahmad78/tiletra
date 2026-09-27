"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  MessageSquare,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { ProcessRefundModal } from "./HelpDeskActionModals";

export default function HelpDeskQueueOverview({
  onSelectOrder,
  onSelectCustomerPhone,
}: {
  onSelectOrder: (order: any) => void;
  onSelectCustomerPhone: (phone: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"returns" | "complaints" | "orders">("returns");
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendingReturnsCount: 0,
    openComplaintsCount: 0,
    totalOrdersToday: 0,
  });

  const [returnStatusFilter, setReturnStatusFilter] = useState("ALL");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("ALL");
  const [selectedReturnForRefund, setSelectedReturnForRefund] = useState<any>(null);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [overviewRes, returnsRes, complaintsRes] = await Promise.all([
        fetch("/api/help/overview"),
        fetch(`/api/help/returns?status=${returnStatusFilter}`),
        fetch(`/api/help/complaints?status=${complaintStatusFilter}`),
      ]);

      const [overviewData, returnsData, complaintsData] = await Promise.all([
        overviewRes.json(),
        returnsRes.json(),
        complaintsRes.json(),
      ]);

      if (overviewData.success) {
        setStats(overviewData.stats);
        setOrders(overviewData.recentOrders || []);
      }
      if (returnsData.success) {
        setReturns(returnsData.returns || []);
      }
      if (complaintsData.success) {
        setComplaints(complaintsData.complaints || []);
      }
    } catch (err) {
      console.error("Failed to load queue overview data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, [returnStatusFilter, complaintStatusFilter]);

  const handleUpdateReturnStatus = async (returnId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/help/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: returnId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOverviewData();
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleUpdateComplaintStatus = async (complaintId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/help/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: complaintId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOverviewData();
      }
    } catch (err) {
      console.error("Failed to update complaint", err);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setActiveTab("returns")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "returns"
              ? "bg-orange-50/80 border-[#F26522] ring-2 ring-orange-200"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Pending Returns & Exchanges</span>
            <RotateCcw className="w-4 h-4 text-[#F26522]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {stats.pendingReturnsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting staff action & pickup</p>
        </div>

        <div
          onClick={() => setActiveTab("complaints")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "complaints"
              ? "bg-blue-50/80 border-[#052A51] ring-2 ring-blue-200"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Open Complaint Tickets</span>
            <MessageSquare className="w-4 h-4 text-[#052A51]" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {stats.openComplaintsCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Active issues needing follow-up</p>
        </div>

        <div
          onClick={() => setActiveTab("orders")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            activeTab === "orders"
              ? "bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-200"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Orders Today</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalOrdersToday}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Placed across store today</p>
        </div>
      </div>

      {/* ── Tabs & Filter Controls ── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("returns")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "returns"
                ? "bg-[#052A51] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Returns & Exchanges ({returns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("complaints")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "complaints"
                ? "bg-[#052A51] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Complaint Notes ({complaints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-[#052A51] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Recent Orders ({orders.length})</span>
          </button>
        </div>

        {/* Filter Dropdown */}
        {activeTab === "returns" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Filter Status:</span>
            <select
              value={returnStatusFilter}
              onChange={(e) => setReturnStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Return Statuses</option>
              <option value="Requested">Requested (New)</option>
              <option value="Approved">Approved</option>
              <option value="Pickup Scheduled">Pickup Scheduled</option>
              <option value="Received">Received</option>
              <option value="Refunded">Refunded</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        )}

        {activeTab === "complaints" && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold">Filter Status:</span>
            <select
              value={complaintStatusFilter}
              onChange={(e) => setComplaintStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Complaint Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        )}
      </div>

      {/* ── Tab Content Lists ── */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#052A51]" />
          <p className="font-bold">Loading records...</p>
        </div>
      ) : activeTab === "returns" ? (
        /* ================= RETURNS LIST ================= */
        <div className="space-y-3">
          {returns.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold">No return or exchange requests matching this filter.</p>
            </div>
          ) : (
            returns.map((ret) => (
              <div
                key={ret.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#F26522] transition-all shadow-2xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#052A51] text-white rounded">
                      {ret.type || "RETURN"}
                    </span>
                    <button
                      onClick={() => onSelectOrder(ret.order || { id: ret.orderId })}
                      className="text-xs font-black text-slate-900 hover:text-[#052A51] hover:underline cursor-pointer"
                    >
                      Order #{ret.orderId.slice(-8).toUpperCase()}
                    </button>
                    <span className="text-xs text-slate-500">
                      • {ret.order?.customerName || "Customer"} (
                      <span
                        onClick={() => onSelectCustomerPhone(ret.order?.customerPhone)}
                        className="text-[#052A51] font-semibold hover:underline cursor-pointer"
                      >
                        {ret.order?.customerPhone}
                      </span>
                      )
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        ret.status === "Refunded"
                          ? "bg-emerald-100 text-emerald-800"
                          : ret.status === "Approved"
                          ? "bg-blue-100 text-blue-800"
                          : ret.status === "Rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {ret.status}
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      ₹{ret.order?.total?.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-slate-800">Reason: {ret.reason}</p>
                  {ret.notes && <p className="text-slate-600 italic">“{ret.notes}”</p>}
                  {ret.exchangeVariant && (
                    <p className="text-blue-800 font-semibold">
                      Replacement: {ret.exchangeVariant}
                    </p>
                  )}
                </div>

                {/* Quick Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Update:</span>
                    {["Approved", "Pickup Scheduled", "Received", "Rejected"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateReturnStatus(ret.id, st)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                          ret.status === st
                            ? "bg-[#052A51] text-white border-[#052A51]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  {ret.status !== "Refunded" && ret.type === "return" && (
                    <button
                      onClick={() => setSelectedReturnForRefund(ret)}
                      className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Process Refund</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "complaints" ? (
        /* ================= COMPLAINTS LIST ================= */
        <div className="space-y-3">
          {complaints.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold">No complaints matching this filter.</p>
            </div>
          ) : (
            complaints.map((comp) => (
              <div
                key={comp.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#052A51] transition-all shadow-2xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        comp.priority === "Urgent"
                          ? "bg-red-600 text-white"
                          : comp.priority === "High"
                          ? "bg-orange-500 text-white"
                          : "bg-[#052A51] text-white"
                      }`}
                    >
                      {comp.priority}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{comp.category || "General"}</span>
                    {comp.orderId && (
                      <button
                        onClick={() => onSelectOrder(comp.order || { id: comp.orderId })}
                        className="text-xs font-bold text-[#052A51] hover:underline cursor-pointer"
                      >
                        (Order #{comp.orderId.slice(-8).toUpperCase()})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {["Open", "In Progress", "Resolved"].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateComplaintStatus(comp.id, st)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                          comp.status === st
                            ? st === "Resolved"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : "bg-[#052A51] text-white border-[#052A51]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {comp.note}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Customer: {comp.customerName || "Customer"} (
                    <span
                      onClick={() => onSelectCustomerPhone(comp.customerPhone)}
                      className="text-slate-600 font-semibold hover:underline cursor-pointer"
                    >
                      {comp.customerPhone}
                    </span>
                    )
                  </span>
                  <span>
                    Logged by {comp.createdBy || "Staff"} •{" "}
                    {new Date(comp.createdAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* ================= RECENT ORDERS LIST ================= */
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#052A51] transition-all shadow-2xs hover:shadow-md cursor-pointer group flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 group-hover:text-[#052A51] transition-colors">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                      order.orderStatus === "Delivered"
                        ? "bg-emerald-100 text-emerald-800"
                        : order.orderStatus === "Shipped"
                        ? "bg-blue-100 text-blue-800"
                        : order.orderStatus === "Confirmed"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.orderStatus}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {order.customerName || "Customer"} • {order.customerPhone} •{" "}
                  {order.items?.length || 0} items
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">
                    ₹{order.total?.toLocaleString("en-IN")}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedReturnForRefund && (
        <ProcessRefundModal
          order={selectedReturnForRefund.order || { id: selectedReturnForRefund.orderId }}
          returnRequest={selectedReturnForRefund}
          onClose={() => setSelectedReturnForRefund(null)}
          onSuccess={() => {
            fetchOverviewData();
          }}
        />
      )}
    </div>
  );
}
