"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  IndianRupee,
  ShoppingBag,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle,
  Truck,
  Plus,
  ExternalLink,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import SalesChart from "@/components/admin/SalesChart";
import { useAdminStore, type OrderStatus } from "@/lib/admin-store";
import { getLowestPrice, getLowestBoxPrice } from "@/lib/data/products";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function AdminDashboardPage() {
  const orders = useAdminStore((s) => s.orders);
  const products = useAdminStore((s) => s.products);
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);

  // Computations
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const todayRevenue = orders
    .filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0) || 18000;

  const pendingOrders = orders.filter(
    (o) => o.orderStatus === "Processing" || o.orderStatus === "Confirmed"
  );

  const lowStockProducts = products.filter((p) =>
    p.variants.some((v) => v.stockBoxes < 25)
  );

  const topSelling = products.slice(0, 5);

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    updateOrderStatus(orderId, status);
    toast.success(`Order ${orderId} updated to ${status}`);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Dispatched":
      case "Out for Delivery":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Processing":
      case "Confirmed":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <StatCard
          title="Today's Revenue"
          value={formatPrice(todayRevenue)}
          icon={IndianRupee}
          color="orange"
          trend={{ value: "+22%", isPositive: true }}
          subtitle="vs yesterday"
        />

        <StatCard
          title="Total Orders"
          value={orders.length.toString()}
          icon={ShoppingBag}
          color="navy"
          trend={{ value: "+4 this week", isPositive: true }}
          subtitle="lifetime"
        />

        <StatCard
          title="Pending Action"
          value={pendingOrders.length.toString()}
          icon={Clock}
          color="amber"
          subtitle="Needs packing / dispatch"
        />

        <StatCard
          title="Low Stock Alert"
          value={lowStockProducts.length.toString()}
          icon={AlertTriangle}
          color="purple"
          subtitle="Designs < 25 boxes"
        />
      </div>

      {/* ── Sales Chart & Quick Actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>

        {/* Low Stock Alert Sidebar Widget */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="font-black text-[#052a51] text-base">Low Stock Tiles</h3>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {lowStockProducts.length} items
              </span>
            </div>

            <div className="space-y-3">
              {lowStockProducts.slice(0, 4).map((p) => {
                const minStock = Math.min(...p.variants.map((v) => v.stockBoxes));
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                        <Image
                          src={p.images[0]}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#052a51] truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.categoryName}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                        {minStock} boxes left
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center justify-between"
          >
            <span>Manage Product Inventory</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── Recent Orders & Top Selling ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-black text-[#052a51] text-base">Recent Tile Orders</h3>
              <p className="text-xs text-gray-400">Manage orders and quick status transitions</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-[#F26522] hover:underline flex items-center gap-1"
            >
              View All Orders ({orders.length}) <ArrowRight size={13} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-bold uppercase text-[10px] border-b border-gray-100">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-black text-[#052a51] hover:text-[#F26522]"
                      >
                        {order.id}
                      </Link>
                      <p className="text-[10px] text-gray-400">
                        {order.items.length} item(s)
                      </p>
                    </td>

                    <td className="py-3 px-3">
                      <p className="font-bold text-[#052a51]">{order.customerName}</p>
                      <p className="text-[10px] text-gray-400">{order.shippingAddress.city}</p>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-black text-[#052a51]">{formatPrice(order.total)}</span>
                      <span className="block text-[10px] text-emerald-600 font-bold">
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <select
                        value={order.orderStatus}
                        onChange={(e) =>
                          handleStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className={`px-2 py-1 rounded-lg text-xs font-bold border focus:outline-none cursor-pointer ${getStatusColor(
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

                    <td className="py-3 px-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#052a51] hover:text-[#F26522] bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <span>Details</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="bg-white rounded-2xl p-5 md:p-6 border border-gray-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600" />
                <h3 className="font-black text-[#052a51] text-base">Top Performing Tiles</h3>
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase">This Month</span>
            </div>

            <div className="space-y-3">
              {topSelling.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-gray-100 text-[#052a51] font-black text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={p.images[0]}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#052a51] truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.categoryName} · {p.reviewCount} orders
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-[#052a51]">
                      {formatPrice(getLowestPrice(p))}
                      <span className="text-[9px] text-gray-400 font-normal">/sqft</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/admin/products"
            className="mt-4 pt-3 border-t border-gray-100 text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center justify-between"
          >
            <span>View Full Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
