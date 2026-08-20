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
} from "lucide-react";
import { toast } from "sonner";
import { getVendorDetailAnalytics } from "@/lib/actions/admin-vendor";
import { formatPrice } from "@/lib/formatters";

export default function VendorDetailDashboardPage() {
  const params = useParams();
  const vendorId = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trends" | "products" | "orders" | "payouts">("trends");

  useEffect(() => {
    if (!vendorId) return;

    async function loadData() {
      try {
        setLoading(true);
        const result = await getVendorDetailAnalytics(vendorId);
        setData(result);
      } catch (e) {
        console.error("Error loading vendor analytics:", e);
        toast.error("Failed to load vendor details");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [vendorId]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F26522] mx-auto" />
        <p className="text-xs text-gray-500 font-medium">Loading vendor analytics...</p>
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

  const { vendor, stats, productStats, dayWiseTrends, products, splits, payouts } = data;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/vendors"
            className="p-2 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 transition-colors shadow-2xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#052a51]">{vendor.businessName}</h1>
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
              Category: <strong className="text-gray-700">{vendor.category || "General"}</strong> · Commission:{" "}
              <strong className="text-[#052a51]">{vendor.commissionRate}%</strong> · Onboarding:{" "}
              <span className="font-semibold text-gray-600">
                {vendor.onboardingPath === "self_apply" ? "Self-Applied (Path A)" : "Admin Created (Path B)"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/91${vendor.contactPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            Contact Vendor (WhatsApp)
          </a>
        </div>
      </div>

      {/* 4 Financial & Order Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Orders</span>
            <ShoppingBag size={18} className="text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-gray-900">{stats.totalOrders}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Vendor split orders</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Revenue</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-emerald-600">{formatPrice(stats.totalGrossRevenue)}</h3>
          <p className="text-[11px] text-emerald-700/80 font-medium mt-0.5">All customer item sales</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Commission</span>
            <Percent size={18} className="text-[#F26522]" />
          </div>
          <h3 className="text-2xl font-black text-[#052a51]">{formatPrice(stats.totalCommissionEarned)}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{vendor.commissionRate}% platform fee retained</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Vendor Net Payout</span>
            <CreditCard size={18} className="text-purple-500" />
          </div>
          <h3 className="text-2xl font-black text-purple-700">{formatPrice(stats.totalVendorEarnings)}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Net vendor payable balance</p>
        </div>
      </div>

      {/* Catalog Status Distribution */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
        <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider mb-3">Product Catalog Status</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-xs font-bold text-emerald-800">🟢 Live on Store</span>
            <p className="text-xl font-black text-emerald-700 mt-1">{productStats.live}</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-xs font-bold text-amber-800">🟡 Under Review</span>
            <p className="text-xl font-black text-amber-700 mt-1">{productStats.underReview}</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
            <span className="text-xs font-bold text-rose-800">🔴 Rejected</span>
            <p className="text-xl font-black text-rose-700 mt-1">{productStats.rejected}</p>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center">
            <span className="text-xs font-bold text-gray-700">⚪ Paused by Vendor</span>
            <p className="text-xl font-black text-gray-800 mt-1">{productStats.paused}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
          {[
            { key: "trends", label: "Day-Wise Revenue Trends" },
            { key: "products", label: `Catalog (${products.length})` },
            { key: "orders", label: `Recent Orders (${splits.length})` },
            { key: "payouts", label: `Payout History (${payouts.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-[#052a51] text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Day-Wise Breakdown */}
        {activeTab === "trends" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Day-by-Day Orders & Commission Split
            </h4>
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

        {/* Tab 2: Catalog Products */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {products.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No products uploaded by this vendor yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p: any) => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col justify-between">
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

        {/* Tab 3: Recent Orders */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            {splits.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No orders fulfilled by this vendor yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item Subtotal</th>
                      <th className="py-2.5 px-3">Fulfillment</th>
                      <th className="py-2.5 px-3 text-right">Vendor Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {splits.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-mono font-bold text-[#052a51]">{s.orderId}</td>
                        <td className="py-3 px-3 text-gray-600">{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{formatPrice(s.subtotal)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            {s.fulfillmentStatus || "Processing"}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700 text-right">
                          {formatPrice(s.vendorPayoutAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payout History */}
        {activeTab === "payouts" && (
          <div className="space-y-3">
            {payouts.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No payouts disbursed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Payout ID</th>
                      <th className="py-2.5 px-3">Initiated Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {payouts.map((p: any) => (
                      <tr key={p.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-mono text-gray-700">{p.id}</td>
                        <td className="py-3 px-3 text-gray-600">{new Date(p.initiatedAt).toLocaleDateString()}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700">{formatPrice(p.amount)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {p.status}
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
      </div>
    </div>
  );
}
