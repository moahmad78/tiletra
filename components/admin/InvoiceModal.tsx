"use client";

import { X, Printer, Download, CheckCircle, Package } from "lucide-react";
import type { AdminOrder } from "@/lib/admin-store";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function InvoiceModal({
  order,
  isOpen,
  onClose,
}: {
  order: AdminOrder;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Modal Controls */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[#F26522]" />
            <h3 className="font-black text-[#052a51] text-sm">Tax Invoice: {order.id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] active:scale-95 transition-all shadow-xs"
            >
              <Printer size={14} />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 text-[#052a51] print:p-0">
          {/* Brand Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-8 border-b-2 border-gray-100">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="Intrihub"
                className="h-9 w-auto object-contain mb-3"
              />
              <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-xs">
                Intrihub Supply Solutions Private Limited<br />
                Begur, Classic Paradise Layout, Bangalore, Karnataka 560114<br />
                GSTIN: 29AABCT1234F1Z8 | support@intrihub.com
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs font-black uppercase tracking-widest text-[#F26522] bg-[#F26522]/10 px-2.5 py-1 rounded-md">
                ORIGINAL TAX INVOICE
              </span>
              <p className="text-sm font-black text-[#052a51] mt-2">Invoice #: INV-{order.id.replace("TL-", "")}</p>
              <p className="text-xs text-gray-500">Order ID: {order.id}</p>
              <p className="text-xs text-gray-500">
                Date: {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
              </p>
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-gray-100 text-xs">
            <div>
              <span className="font-black text-gray-400 uppercase tracking-wider block mb-1">
                Billed / Shipped To:
              </span>
              <p className="text-sm font-bold text-[#052a51]">{order.customerName}</p>
              <p className="text-gray-600 mt-0.5">{order.customerPhone}</p>
              <p className="text-gray-600">{order.customerEmail}</p>
              <p className="text-gray-600 mt-1">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.pincode}
              </p>
            </div>

            <div>
              <span className="font-black text-gray-400 uppercase tracking-wider block mb-1">
                Payment & Fulfillment Details:
              </span>
              <div className="space-y-1 text-gray-600">
                <p>
                  Payment Status: <strong className="text-emerald-700 font-bold">{order.paymentStatus}</strong>
                </p>
                <p>Payment Mode: {order.paymentMethod} {order.paymentId ? `(${order.paymentId})` : ""}</p>
                <p>Order Status: <strong>{order.orderStatus}</strong></p>
                {order.trackingNumber && (
                  <p>
                    Courier: {order.courierName} · Tracking #{order.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Item & Description</th>
                  <th className="py-2.5 text-center">Qty (Boxes)</th>
                  <th className="py-2.5 text-right">Rate / Box</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3">
                      <p className="font-bold text-[#052a51]">{item.productName}</p>
                      <p className="text-[11px] text-gray-400">{item.variantDetails}</p>
                    </td>
                    <td className="py-3 text-center font-bold">{item.boxQuantity}</td>
                    <td className="py-3 text-right">{formatPrice(item.pricePerBox)}</td>
                    <td className="py-3 text-right font-black text-[#052a51]">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Math */}
          <div className="border-t-2 border-gray-200 pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex justify-between w-64 text-gray-600">
              <span>Subtotal:</span>
              <span className="font-bold">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between w-64 text-gray-600">
              <span>Delivery Charges:</span>
              <span className="font-bold">
                {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between w-64 text-emerald-700">
                <span>Coupon Discount:</span>
                <span className="font-bold">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-sm font-black text-[#052a51] pt-2 border-t border-gray-200">
              <span>Grand Total:</span>
              <span className="text-base text-[#F26522]">{formatPrice(order.total)}</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1">Includes applicable GST & transit insurance.</p>
          </div>

          {/* Footer Note */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center text-[10px] text-gray-400">
            Thank you for choosing Intrihub for your space! For queries or delivery coordination, call +91 92649 20211.
          </div>
        </div>
      </div>
    </div>
  );
}
