"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ChevronRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
  Landmark,
  Building,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  Truck,
  PackageCheck,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import {
  getVendorDetailAnalytics,
  approveVendor,
  suspendVendor,
  reactivateVendor,
  updateVendorCommission,
} from "@/lib/actions/admin-vendor";
import { formatPrice } from "@/lib/formatters";

export default function VendorDetailDashboardPage() {
  const params = useParams();
  const vendorId = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "trends">("overview");

  // Actions & Commission
  const [commissionInput, setCommissionInput] = useState<number>(15.0);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loadData = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const result = await getVendorDetailAnalytics(vendorId);
      setData(result);
      if (result?.vendor?.commissionRate) {
        setCommissionInput(result.vendor.commissionRate);
      }
    } catch (e) {
      console.error("Error loading vendor analytics:", e);
      toast.error("Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorId]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleUpdateCommission = async () => {
    if (commissionInput < 0 || commissionInput > 100) {
      toast.error("Commission rate must be between 0% and 100%");
      return;
    }
    setActionLoading(true);
    const res = await updateVendorCommission(vendorId, commissionInput);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to update commission");
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    const res = await approveVendor(vendorId, commissionInput);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to approve vendor");
    }
  };

  const handleSuspend = async () => {
    const reason = prompt("Enter reason for suspending this vendor account:");
    if (!reason) return;
    setActionLoading(true);
    const res = await suspendVendor(vendorId, reason);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to suspend vendor");
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    const res = await reactivateVendor(vendorId);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to reactivate vendor");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F26522] mx-auto" />
        <p className="text-xs text-gray-500 font-medium">Loading vendor details & analytics...</p>
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="py-20 text-center space-y-3">
        <Store className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="text-base font-bold text-gray-800">Vendor Not Found</h3>
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft size={14} /> Back to Vendors
        </Link>
      </div>
    );
  }

  const { vendor, stats, productStats, orderStats, dayWiseTrends, products, splits, payouts } = data;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/vendors"
            className="p-2.5 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 transition-colors shadow-2xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-[#052a51]">
                {vendor.businessName}
              </h1>
              {vendor.status === "approved" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck size={12} /> Active Vendor
                </span>
              )}
              {vendor.status === "pending" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Pending Review
                </span>
              )}
              {vendor.status === "suspended" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                  Suspended
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-0.5">
              Category: <strong className="text-gray-700">{vendor.category || "General"}</strong> • Phone:{" "}
              <strong className="text-gray-700">{vendor.contactPhone}</strong> • Email:{" "}
              <span className="text-gray-700">{vendor.contactEmail}</span>
            </p>
          </div>
        </div>

        {/* Quick Contact & Status Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://wa.me/91${vendor.contactPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Phone size={13} /> WhatsApp
          </a>

          {vendor.status === "pending" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleApprove}
              className="px-4 py-2 bg-[#052a51] hover:bg-[#073b70] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              Approve Vendor
            </button>
          )}

          {vendor.status === "approved" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSuspend}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Suspend Account
            </button>
          )}

          {vendor.status === "suspended" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleReactivate}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Reactivate Account
            </button>
          )}
        </div>
      </div>

      {/* Part B: Bank / Payout Details Card (Dedicated Super Admin Review Box) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center font-bold">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#052a51]">
                Vendor Bank / Payout Details
              </h2>
              <p className="text-xs text-gray-500">
                Full unmasked banking information entered by vendor for manual/automated payout processing
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
              vendor.bankAccountNumber
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {vendor.bankAccountNumber ? "Bank Account Added" : "No Bank Details Added Yet"}
          </span>
        </div>

        {vendor.bankAccountNumber ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Account Holder</p>
              <p className="font-bold text-gray-900 mt-0.5 text-xs">{vendor.bankAccountHolder || "—"}</p>
            </div>

            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Bank Name</p>
              <p className="font-bold text-gray-900 mt-0.5 text-xs">{vendor.bankName || "—"}</p>
            </div>

            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Full Account Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-gray-900 text-xs tracking-wider">
                  {vendor.bankAccountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vendor.bankAccountNumber, "Account Number")}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedField === "Account Number" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">IFSC Code / UPI ID</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-[#052a51] text-xs">
                  {vendor.bankIfscCode || vendor.bankUpiId || "—"}
                </span>
                {vendor.bankIfscCode && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vendor.bankIfscCode, "IFSC Code")}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                    title="Copy IFSC"
                  >
                    {copiedField === "IFSC Code" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              This vendor has not submitted their bank details yet. Remind them to fill their bank account details under <strong>/vendor/settings</strong> before initiating payouts.
            </span>
          </div>
        )}
      </div>

      {/* Part C: Consolidated Product & Order At-a-Glance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4.1 Product Stats Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-blue-600" /> Product Catalog Stats
            </h3>
            <span className="text-xs font-bold text-gray-500">
              Total Uploaded: <strong className="text-gray-900">{productStats.total}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800">Live & Active</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{productStats.live}</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-[11px] font-bold text-amber-800">Under Review</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{productStats.underReview}</p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <span className="text-[11px] font-bold text-rose-800">Rejected</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{productStats.rejected}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <span className="text-[11px] font-bold text-gray-700">Paused</span>
              <p className="text-xl font-black text-gray-800 mt-0.5">{productStats.paused}</p>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-300 text-center sm:col-span-2">
              <span className="text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1">
                <AlertTriangle size={12} className="text-amber-600" /> Low Stock Alert (&lt;15 boxes)
              </span>
              <p className="text-xl font-black text-amber-800 mt-0.5">{productStats.lowStockCount}</p>
            </div>
          </div>
        </div>

        {/* 4.2 Order Stats Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#F26522]" /> Order Fulfillment Stats
            </h3>
            <span className="text-xs font-bold text-gray-500">
              Total Orders: <strong className="text-gray-900">{orderStats.total}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center">
              <span className="text-[11px] font-bold text-blue-800">New / Processing</span>
              <p className="text-xl font-black text-blue-700 mt-0.5">{orderStats.processing}</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-[11px] font-bold text-amber-800">Dispatched</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{orderStats.dispatched}</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800">Delivered</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{orderStats.delivered}</p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <span className="text-[11px] font-bold text-rose-800">Cancelled / Ret</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{orderStats.cancelled}</p>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center sm:col-span-2">
              <span className="text-[11px] font-bold text-emerald-900">Net Vendor Earnings</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{formatPrice(stats.totalVendorEarnings)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rate Control Box */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-bold">
            <Sliders size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Platform Commission Rate
            </h4>
            <p className="text-[11px] text-gray-500">
              Current commission rate deducted on sales from this specific vendor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-28">
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={commissionInput}
              onChange={(e) => setCommissionInput(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 text-right pr-6 focus:bg-white focus:outline-hidden"
            />
            <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400">%</span>
          </div>

          <button
            type="button"
            disabled={actionLoading || commissionInput === vendor.commissionRate}
            onClick={handleUpdateCommission}
            className="px-4 py-2 bg-[#052a51] hover:bg-[#073b70] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            Update Rate
          </button>
        </div>
      </div>

      {/* Tabs: Scoped Orders Table, Catalog & Trends */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
          {[
            { key: "orders", label: `Orders (${splits.length})` },
            { key: "products", label: `Catalog (${products.length})` },
            { key: "trends", label: "Day-Wise Revenue Trends" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#052a51] text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Scoped Orders Table (PRD Section 4.2 & Section 2) */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Customer Orders Containing {vendor.businessName}&apos;s Items
            </h4>

            {splits.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                No orders fulfilled by this vendor yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item Subtotal</th>
                      <th className="py-2.5 px-3">Commission</th>
                      <th className="py-2.5 px-3">Vendor Share</th>
                      <th className="py-2.5 px-3 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {splits.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-mono font-bold text-[#052a51]">
                          <Link href={`/admin/orders/${s.orderId}`} className="hover:underline flex items-center gap-1">
                            #{s.orderId} <ExternalLink size={11} className="text-gray-400" />
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900">{s.customerName}</p>
                          <p className="text-[11px] text-gray-500">{s.customerCity} • {s.customerPhone}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {new Date(s.orderDate || s.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">{formatPrice(s.subtotal)}</td>
                        <td className="py-3 px-3 font-bold text-[#F26522]">
                          {formatPrice(s.commissionAmount)} ({s.commissionRate}%)
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          {formatPrice(s.vendorPayoutAmount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.fulfillmentStatus === "Delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : s.fulfillmentStatus === "Dispatched"
                                ? "bg-amber-100 text-amber-800"
                                : s.fulfillmentStatus === "Cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {s.fulfillmentStatus || "Processing"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Catalog Products */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <Layers size={32} className="mx-auto text-gray-300 mb-2" />
                No products uploaded by this vendor yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p: any) => (
                  <div key={p.id} className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                          {p.categoryName}
                        </span>
                        {p.approvalStatus === "approved" && p.status === "active" && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Live
                          </span>
                        )}
                        {p.approvalStatus === "pending" && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Under Review
                          </span>
                        )}
                        {p.approvalStatus === "rejected" && (
                          <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Rejected
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-gray-900 line-clamp-2">{p.name}</h5>
                      <p className="text-xs text-[#052a51] font-black mt-1">₹{p.pricePerSqft} / {p.unitOfSale || "box"}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">{p.variants?.length || 0} variants</span>
                      <Link
                        href={`/product/${p.slug}`}
                        target="_blank"
                        className="text-[#052a51] font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>View</span> <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Day-Wise Breakdown */}
        {activeTab === "trends" && (
          <div className="space-y-3">
            {dayWiseTrends.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No order history recorded for this vendor yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Orders</th>
                      <th className="py-2.5 px-3">Gross Sales</th>
                      <th className="py-2.5 px-3">Platform Commission</th>
                      <th className="py-2.5 px-3 text-right">Vendor Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dayWiseTrends.map((d: any) => (
                      <tr key={d.date} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-semibold text-gray-800">{d.date}</td>
                        <td className="py-3 px-3 font-bold text-[#052a51]">{d.orders} orders</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{formatPrice(d.revenue)}</td>
                        <td className="py-3 px-3 font-bold text-[#F26522]">{formatPrice(d.commission)}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700 text-right">{formatPrice(d.vendorPayout)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
