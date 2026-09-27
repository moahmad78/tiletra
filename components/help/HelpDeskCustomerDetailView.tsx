"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  IndianRupee,
  Clock,
  Package,
  ChevronRight,
  MessageSquarePlus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AddComplaintModal } from "./HelpDeskActionModals";

export default function HelpDeskCustomerDetailView({
  customer,
  orders = [],
  onSelectOrder,
  onBack,
  onRefresh,
}: {
  customer: any;
  orders: any[];
  onSelectOrder: (order: any) => void;
  onBack: () => void;
  onRefresh: () => void;
}) {
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  if (!customer) return null;

  const totalSpent =
    customer.totalSpent ||
    orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = customer.totalOrders || orders.length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ── Top Header ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#052A51] to-[#0b3d75] text-white font-black text-lg flex items-center justify-center shadow-md">
              {(customer.name || "C").charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>{customer.name || "Customer Profile"}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Verified Buyer
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1 font-semibold text-slate-700">
                  <Phone className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>{customer.phone || "No phone"}</span>
                </span>
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowComplaintModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#052A51] hover:bg-[#031c38] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <MessageSquarePlus className="w-3.5 h-3.5" />
          <span>Add Customer Complaint / Note</span>
        </button>
      </div>

      {/* ── Key Metrics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Total Orders
          </p>
          <p className="text-lg font-black text-slate-900 mt-1">{totalOrders}</p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Lifetime Spend
          </p>
          <p className="text-lg font-black text-emerald-700 mt-1">
            ₹{totalSpent?.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Primary City
          </p>
          <p className="text-sm font-black text-slate-900 mt-1 truncate">
            {customer.addresses?.[0]?.city || customer.city || "Bangalore"}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Account Status
          </p>
          <p className="text-sm font-black text-emerald-600 mt-1">Active Customer</p>
        </div>
      </div>

      {/* ── Two Column Layout: Orders History & Addresses ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Order History List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#F26522]" />
              <span>Full Order History ({orders.length})</span>
            </h3>
            <span className="text-xs text-slate-400">Most recent first</span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold">No orders recorded for this customer yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-[#052A51] transition-all shadow-2xs hover:shadow-md cursor-pointer group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
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
                            : order.orderStatus === "Cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {order.orderStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-right">
                      <span className="text-sm font-black text-slate-900">
                        ₹{order.total?.toLocaleString("en-IN")}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Order items snippet */}
                  <div className="space-y-1 py-1.5 border-y border-slate-100 text-xs text-slate-600">
                    {(order.items || []).slice(0, 3).map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between truncate">
                        <span className="truncate">
                          • {it.productName} ({it.boxQuantity} boxes)
                        </span>
                        <span className="font-semibold shrink-0 ml-2">₹{it.totalPrice}</span>
                      </div>
                    ))}
                    {(order.items?.length || 0) > 3 && (
                      <p className="text-[11px] text-slate-400 italic">
                        +{order.items.length - 3} more items...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </span>
                    <span className="font-semibold text-slate-600">
                      Payment: {order.paymentMethod || "COD"} ({order.paymentStatus || "Pending"})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Saved Addresses */}
        <div className="space-y-3">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#052A51]" />
            <span>Saved Addresses ({customer.addresses?.length || 0})</span>
          </h3>

          <div className="space-y-2.5">
            {customer.addresses && customer.addresses.length > 0 ? (
              customer.addresses.map((addr: any, idx: number) => (
                <div
                  key={addr.id || idx}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">
                      {addr.label || (idx === 0 ? "Home / Default" : `Address #${idx + 1}`)}
                    </span>
                    {addr.isDefault && (
                      <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {addr.street || addr.deliveryAddress}
                    {addr.area ? `, ${addr.area}` : ""}
                    {addr.city ? `, ${addr.city}` : ""}
                    {addr.pincode || addr.postalCode ? ` - ${addr.pincode || addr.postalCode}` : ""}
                  </p>
                  {addr.deliveryInstructions && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg mt-1">
                      Note: {addr.deliveryInstructions}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-400">
                No explicitly saved addresses. Addresses will be loaded from previous orders.
              </div>
            )}
          </div>
        </div>
      </div>

      {showComplaintModal && (
        <AddComplaintModal
          customer={customer}
          onClose={() => setShowComplaintModal(false)}
          onSuccess={() => {
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
