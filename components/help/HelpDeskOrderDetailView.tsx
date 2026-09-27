"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  RotateCcw,
  RefreshCw,
  DollarSign,
  MessageSquarePlus,
  ShieldCheck,
  ChevronRight,
  Printer,
  ExternalLink,
} from "lucide-react";
import {
  RaiseReturnModal,
  RaiseExchangeModal,
  ProcessRefundModal,
  AddComplaintModal,
} from "./HelpDeskActionModals";

export default function HelpDeskOrderDetailView({
  order,
  onBack,
  onOrderUpdated,
}: {
  order: any;
  onBack: () => void;
  onOrderUpdated: () => void;
}) {
  const [activeModal, setActiveModal] = useState<"return" | "exchange" | "refund" | "complaint" | null>(null);
  const [selectedReturnForRefund, setSelectedReturnForRefund] = useState<any>(null);
  const [updatingReturnId, setUpdatingReturnId] = useState<string | null>(null);

  if (!order) return null;

  // Timeline computation
  const statusSteps = [
    { key: "Pending", label: "Ordered" },
    { key: "Confirmed", label: "Confirmed" },
    { key: "Processing", label: "Processing" },
    { key: "Shipped", label: "Shipped" },
    { key: "Delivered", label: "Delivered" },
  ];

  const currentStatusIndex = statusSteps.findIndex(
    (s) => s.key.toLowerCase() === (order.orderStatus || "").toLowerCase()
  );
  const isCancelled = (order.orderStatus || "").toLowerCase() === "cancelled";
  const isReturned = (order.orderStatus || "").toLowerCase() === "returned";

  // Financials & GST calculation
  const subtotal = order.subtotal || order.total || 0;
  const deliveryFee = order.deliveryFee || 0;
  const discount = order.discount || 0;
  const total = order.total || subtotal + deliveryFee - discount;
  const approxGst = Math.round((subtotal * 0.18) / 1.18); // 18% GST estimate
  const baseTaxable = subtotal - approxGst;

  const handleReturnStatusUpdate = async (returnId: string, newStatus: string) => {
    try {
      setUpdatingReturnId(returnId);
      const res = await fetch("/api/help/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: returnId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onOrderUpdated();
      }
    } catch (err) {
      console.error("Failed to update return status", err);
    } finally {
      setUpdatingReturnId(null);
    }
  };

  const handleComplaintStatusUpdate = async (complaintId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/help/complaints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: complaintId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        onOrderUpdated();
      }
    } catch (err) {
      console.error("Failed to update complaint status", err);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ── Top Bar Navigation ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">
                Order #{order.id.slice(-8).toUpperCase()}
              </h2>
              <span className="text-[10px] font-mono text-slate-400">({order.id})</span>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  order.orderStatus === "Delivered"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : order.orderStatus === "Shipped"
                    ? "bg-blue-100 text-blue-800 border border-blue-300"
                    : order.orderStatus === "Confirmed"
                    ? "bg-purple-100 text-purple-800 border border-purple-300"
                    : order.orderStatus === "Cancelled"
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })} at{" "}
              {new Date(order.createdAt).toLocaleTimeString("en-IN", { timeStyle: "short" })}
            </p>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModal("return")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-[#F26522] border border-orange-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Raise Return</span>
          </button>

          <button
            onClick={() => setActiveModal("exchange")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Raise Exchange</span>
          </button>

          <button
            onClick={() => {
              setSelectedReturnForRefund(null);
              setActiveModal("refund");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Process Refund</span>
          </button>

          <button
            onClick={() => setActiveModal("complaint")}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#052A51] hover:bg-[#031c38] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <MessageSquarePlus className="w-3.5 h-3.5" />
            <span>Add Complaint / Note</span>
          </button>
        </div>
      </div>

      {/* ── Visual Timeline Tracker ── */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
          Fulfillment Timeline
        </h4>

        {isCancelled ? (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>This order was Cancelled. No further delivery tracking.</span>
          </div>
        ) : isReturned ? (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 text-xs font-bold flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>This order has been Returned to the warehouse.</span>
          </div>
        ) : (
          <div className="relative flex items-center justify-between">
            <div className="absolute top-4 left-4 right-4 h-1 bg-slate-100 -z-0" />
            <div
              className="absolute top-4 left-4 h-1 bg-[#25D366] transition-all -z-0"
              style={{
                width: `${
                  currentStatusIndex >= 0
                    ? (currentStatusIndex / (statusSteps.length - 1)) * 100
                    : 0
                }%`,
              }}
            />

            {statusSteps.map((step, idx) => {
              const isPassed = currentStatusIndex >= idx;
              const isCurrent = currentStatusIndex === idx;
              return (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isPassed
                        ? "bg-[#25D366] text-white shadow-md ring-4 ring-emerald-50"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-bold ${
                      isCurrent
                        ? "text-[#052A51]"
                        : isPassed
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Two Column Details Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Itemized Products & Financial Breakdown */}
        <div className="lg:col-span-2 space-y-4">
          {/* Itemized Products */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#F26522]" />
                <span>Ordered Items ({order.items?.length || 0})</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Total Units: {order.items?.reduce((sum: number, it: any) => sum + (it.boxQuantity || 1), 0)} boxes
              </span>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
              {(order.items || []).map((item: any) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 bg-slate-50/40 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                      {item.image || item.product?.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image || item.product?.images?.[0]}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {item.variantDetails || "Standard"} • SKU: {item.variantId?.slice(0, 10) || "N/A"}
                      </p>
                      <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                        {item.boxQuantity} boxes × ₹{item.pricePerBox?.toLocaleString("en-IN")}/box
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">
                      ₹{item.totalPrice?.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      GST Included
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary & GST */}
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Value (approx):</span>
                <span className="font-semibold">₹{baseTaxable.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (CGST 9% + SGST 9% / IGST 18%):</span>
                <span className="font-semibold">₹{approxGst.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery & Handling:</span>
                <span className="font-semibold">{deliveryFee > 0 ? `₹${deliveryFee}` : "FREE"}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied:</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-[#052A51]">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {/* Active Return Requests on This Order */}
          {order.returnRequests && order.returnRequests.length > 0 && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-orange-200 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-orange-950 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#F26522]" />
                  <span>Return & Exchange Records ({order.returnRequests.length})</span>
                </h3>
              </div>

              <div className="space-y-3">
                {order.returnRequests.map((ret: any) => (
                  <div key={ret.id} className="p-3.5 bg-orange-50/50 border border-orange-200 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#052A51] text-white rounded">
                          {ret.type || "RETURN"}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Reason: {ret.reason}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-white border border-orange-300 text-orange-800">
                          Status: {ret.status}
                        </span>
                      </div>
                    </div>

                    {ret.notes && (
                      <p className="text-xs text-slate-600 italic">“{ret.notes}”</p>
                    )}

                    {ret.exchangeVariant && (
                      <div className="text-xs font-semibold text-blue-800 bg-blue-50 p-2 rounded-lg border border-blue-200">
                        Requested Exchange Item: <strong>{ret.exchangeVariant}</strong>
                        {ret.exchangeNotes && <p className="text-[11px] mt-0.5 text-blue-700">{ret.exchangeNotes}</p>}
                      </div>
                    )}

                    {/* Return Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-orange-100">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">Quick Status:</span>
                        {["Approved", "Pickup Scheduled", "Received", "Rejected"].map((st) => (
                          <button
                            key={st}
                            disabled={updatingReturnId === ret.id}
                            onClick={() => handleReturnStatusUpdate(ret.id, st)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                              ret.status === st
                                ? "bg-orange-600 text-white border-orange-600"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-orange-100"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {ret.status !== "Refunded" && ret.type === "return" && (
                        <button
                          onClick={() => {
                            setSelectedReturnForRefund(ret);
                            setActiveModal("refund");
                          }}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Refund ₹{ret.refundAmount || total}</span>
                        </button>
                      )}

                      {ret.status === "Refunded" && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Refund Completed (₹{ret.refundAmount || total})</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Complaint Notes on This Order */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#052A51]" />
                <span>Internal Complaints & Staff Notes ({order.complaints?.length || 0})</span>
              </h3>
              <button
                onClick={() => setActiveModal("complaint")}
                className="text-xs font-bold text-[#052A51] hover:underline cursor-pointer flex items-center gap-1"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>+ Add Note</span>
              </button>
            </div>

            {order.complaints && order.complaints.length > 0 ? (
              <div className="space-y-2.5">
                {order.complaints.map((comp: any) => (
                  <div key={comp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            comp.priority === "Urgent"
                              ? "bg-red-600 text-white"
                              : comp.priority === "High"
                              ? "bg-orange-500 text-white"
                              : "bg-slate-700 text-white"
                          }`}
                        >
                          {comp.priority}
                        </span>
                        <span className="font-bold text-slate-700">{comp.category || "General"}</span>
                        <span className="text-[10px] text-slate-400">
                          by {comp.createdBy || "Staff"} • {new Date(comp.createdAt).toLocaleDateString("en-IN")}
                        </span>
                      </div>

                      {/* Status Toggle */}
                      <div className="flex items-center gap-1">
                        {["Open", "In Progress", "Resolved"].map((st) => (
                          <button
                            key={st}
                            onClick={() => handleComplaintStatusUpdate(comp.id, st)}
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
                    <p className="text-slate-800 whitespace-pre-wrap">{comp.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No complaint notes recorded for this order yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Customer Info, Payment, and Delivery Details */}
        <div className="space-y-4">
          {/* Customer Profile Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Customer Information
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#052A51] text-white font-bold flex items-center justify-center text-sm">
                {(order.customerName || "C").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {order.customerName || "Customer"}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{order.customerPhone || "No Phone"}</span>
                </p>
                {order.customerEmail && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                    <Mail className="w-3 h-3" />
                    <span>{order.customerEmail}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              Payment Status
            </h4>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Payment Mode:</span>
              <span className="font-bold text-slate-800 uppercase">
                {order.paymentMethod || "COD"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Payment Status:</span>
              <span
                className={`font-black px-2 py-0.5 rounded text-[10px] uppercase ${
                  order.paymentStatus === "Paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {order.paymentStatus || "Pending"}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-slate-600">Total Charged:</span>
              <span className="font-black text-slate-900 text-sm">
                ₹{order.total?.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
              Delivery Destination
            </h4>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-slate-700 leading-relaxed">
                <p className="font-semibold text-slate-900">
                  {order.deliveryAddress || "Standard Delivery Address"}
                </p>
                {order.deliveryCity && (
                  <p>
                    {order.deliveryCity}
                    {order.deliveryState ? `, ${order.deliveryState}` : ""}
                    {order.deliveryPostalCode ? ` - ${order.deliveryPostalCode}` : ""}
                  </p>
                )}
                {order.deliveryInstructions && (
                  <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg mt-2 border border-amber-200">
                    <strong>Note:</strong> {order.deliveryInstructions}
                  </p>
                )}
              </div>
            </div>

            {order.deliveryPartner && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Delivery Partner</p>
                  <p className="font-bold text-slate-800">{order.deliveryPartner.name}</p>
                  <p className="text-[11px] text-slate-500">{order.deliveryPartner.phone}</p>
                </div>
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Modals ── */}
      {activeModal === "return" && (
        <RaiseReturnModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            onOrderUpdated();
          }}
        />
      )}

      {activeModal === "exchange" && (
        <RaiseExchangeModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            onOrderUpdated();
          }}
        />
      )}

      {activeModal === "refund" && (
        <ProcessRefundModal
          order={order}
          returnRequest={selectedReturnForRefund}
          onClose={() => {
            setActiveModal(null);
            setSelectedReturnForRefund(null);
          }}
          onSuccess={() => {
            onOrderUpdated();
          }}
        />
      )}

      {activeModal === "complaint" && (
        <AddComplaintModal
          order={order}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            onOrderUpdated();
          }}
        />
      )}
    </div>
  );
}
