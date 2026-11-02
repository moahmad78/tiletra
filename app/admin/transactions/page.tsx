"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  ArrowUpRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Banknote,
  DollarSign,
  TrendingUp,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Filter,
} from "lucide-react";
import {
  getAdminTransactions,
  processAdminRefund,
  markCodPaymentCollected,
} from "@/lib/actions/transactions";
import { toast } from "sonner";

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminTransactions({
        status: statusFilter,
        method: methodFilter,
        search,
        page,
        limit: 30,
      });
      if (res.success) {
        setData(res);
      } else {
        toast.error(res.error || "Failed to load transactions");
      }
    } catch {
      toast.error("Error connecting to transactions ledger");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, search, page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleRefund = async (orderId: string, currentTotal: number) => {
    const reason = prompt(
      `Enter reason for refunding ₹${currentTotal.toLocaleString("en-IN")} for Order #${orderId}:`,
      "Customer requested refund"
    );
    if (!reason) return;

    try {
      setProcessingId(orderId);
      const res = await processAdminRefund({ orderId, reason });
      if (res.success) {
        toast.success(res.message);
        fetchTransactions();
      } else {
        toast.error(res.error);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCollectCod = async (orderId: string) => {
    if (!confirm(`Confirm that cash has been physically received for COD Order #${orderId}?`)) {
      return;
    }
    try {
      setProcessingId(orderId);
      const res = await markCodPaymentCollected({ orderId });
      if (res.success) {
        toast.success(res.message);
        fetchTransactions();
      } else {
        toast.error(res.error);
      }
    } finally {
      setProcessingId(null);
    }
  };

  const stats = data?.stats || {
    totalGross: 0,
    onlineGross: 0,
    codGross: 0,
    commissionEarned: 0,
    refundedTotal: 0,
    pendingTotal: 0,
    transactionsCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-[#052a51]">Payments & Transactions</h1>
            <span className="text-[11px] font-bold bg-[#F26522]/10 text-[#F26522] px-2.5 py-0.5 rounded-full">
              Module 3
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Real-time financial ledger, gateway reconciliation, commissions & refund management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#052a51] bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Gross GMV</span>
            <div className="w-8 h-8 rounded-lg bg-[#052a51]/10 flex items-center justify-center text-[#052a51]">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#052a51] mt-2">
            ₹{stats.totalGross.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-semibold">
            Across {stats.transactionsCount} recorded orders
          </div>
        </div>

        {/* Online vs COD */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gateway vs COD</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CreditCard size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-emerald-600 mt-2">
            ₹{stats.onlineGross.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-semibold">
            COD Total: ₹{stats.codGross.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Platform Commission Cut */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Platform Take (Cut)</span>
            <div className="w-8 h-8 rounded-lg bg-[#F26522]/10 flex items-center justify-center text-[#F26522]">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-[#F26522] mt-2">
            ₹{stats.commissionEarned.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            Settled Net Commissions
          </div>
        </div>

        {/* Refunded & Pending */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Refunds & Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <RotateCcw size={16} />
            </div>
          </div>
          <div className="text-xl font-black text-amber-600 mt-2">
            ₹{stats.pendingTotal.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-red-500 font-bold mt-1">
            Total Refunded: ₹{stats.refundedTotal.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search Order ID, Customer, Phone, Razorpay ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-[#052a51] focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold bg-gray-50 border border-gray-200 text-[#052a51] rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>

          {/* Payment Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs font-bold bg-gray-50 border border-gray-200 text-[#052a51] rounded-xl px-3 py-2 cursor-pointer focus:outline-hidden"
          >
            <option value="all">All Methods</option>
            <option value="Online">Online Gateway</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#F26522]" />
            <p className="text-xs font-bold text-gray-500">Loading ledger data...</p>
          </div>
        ) : !data?.orders || data.orders.length === 0 ? (
          <div className="p-16 text-center">
            <Banknote size={36} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-bold text-[#052a51]">No transactions found</h3>
            <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Order / TXN ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Method & Ref</th>
                  <th className="py-3 px-4 text-right">Gross Total</th>
                  <th className="py-3 px-4 text-right">Commission Cut</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-center">Fulfillment</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.orders.map((o: any) => {
                  const comm = o.splits?.reduce((acc: number, s: any) => acc + (s.commissionAmount || 0), 0) || 0;
                  const isProcessing = processingId === o.id;

                  return (
                    <tr key={o.id} className="hover:bg-gray-50/50 transition">
                      {/* Order ID */}
                      <td className="py-3 px-4 font-mono font-bold text-[#052a51]">
                        <Link href={`/admin/orders/${o.id}`} className="hover:text-[#F26522] flex items-center gap-1">
                          #{o.id}
                          <ExternalLink size={11} className="text-gray-400" />
                        </Link>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-800">{o.customerName}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{o.customerPhone}</div>
                      </td>

                      {/* Method & Ref */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.paymentMethod === "COD"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {o.paymentMethod}
                        </span>
                        {o.razorpayPaymentId && (
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[130px]" title={o.razorpayPaymentId}>
                            {o.razorpayPaymentId}
                          </div>
                        )}
                      </td>

                      {/* Gross Amount */}
                      <td className="py-3 px-4 text-right font-black text-[#052a51]">
                        ₹{Number(o.total || 0).toLocaleString("en-IN")}
                      </td>

                      {/* Platform Commission Cut */}
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {comm > 0 ? `+₹${comm.toLocaleString("en-IN")}` : "—"}
                      </td>

                      {/* Payment Status Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            o.paymentStatus === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : o.paymentStatus === "Refunded"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {o.paymentStatus === "Paid" && <CheckCircle2 size={10} />}
                          {o.paymentStatus === "Refunded" && <RotateCcw size={10} />}
                          {o.paymentStatus === "Pending" && <Clock size={10} />}
                          {o.paymentStatus}
                        </span>
                      </td>

                      {/* Fulfillment Status */}
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-bold text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded-md">
                          {o.orderStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Mark COD Collected */}
                          {o.paymentMethod === "COD" && o.paymentStatus !== "Paid" && o.paymentStatus !== "Refunded" && (
                            <button
                              onClick={() => handleCollectCod(o.id)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                              title="Mark cash collected"
                            >
                              Collect Cash
                            </button>
                          )}

                          {/* Refund Trigger */}
                          {o.paymentStatus === "Paid" && (
                            <button
                              onClick={() => handleRefund(o.id, o.total)}
                              disabled={isProcessing}
                              className="px-2 py-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition cursor-pointer"
                              title="Trigger refund"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
