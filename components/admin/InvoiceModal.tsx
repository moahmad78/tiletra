"use client";

import React from "react";
import { X, Printer, Package } from "lucide-react";
import type { AdminOrder } from "@/lib/admin-store";

function formatPrice(n: number) {
  return "₹" + (n || 0).toLocaleString("en-IN");
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
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      window.print();
    }
  };

  const invoiceNumber = `INV-${(order.id || "").replace("IH-", "").replace("TL-", "").replace("ord_", "").toUpperCase()}`;
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const subtotal = Number(order.subtotal || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const discount = Number(order.discount || 0);
  const total = Number(order.total || subtotal + deliveryFee - discount);

  // Inclusive GST Calculation (18% standard building materials slab)
  const taxableValue = Math.round((subtotal / 1.18) * 100) / 100;
  const totalGst = Math.round((subtotal - taxableValue) * 100) / 100;
  const cgst = Math.round((totalGst / 2) * 100) / 100;
  const sgst = cgst;

  return (
    <div className="invoice-print-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-xs">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            background: #ffffff !important;
            color: #052a51 !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: visible !important;
          }

          /* Hide all non-modal page elements across admin panel */
          header, footer, nav, aside, .no-print, [role="navigation"], [role="banner"], [role="complementary"] {
            display: none !important;
          }

          .invoice-print-backdrop {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
            inset: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border: none !important;
          }

          .invoice-print-card {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .invoice-print-body {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .invoice-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          table.invoice-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          table.invoice-table thead {
            display: table-header-group !important;
          }

          table.invoice-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <div className="invoice-print-card bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 no-print">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-[#F26522]" />
            <h3 className="font-black text-[#052a51] text-sm">Tax Invoice: #{order.id}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl hover:bg-[#041f3d] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div className="invoice-print-body flex-1 overflow-y-auto p-6 sm:p-10 text-[#052a51]">
          {/* Brand Header */}
          <div className="invoice-avoid-break flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-gray-100">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/intri-web-logo.png"
                alt="Intrihub"
                className="h-9 w-auto object-contain mb-2.5"
              />
              <p className="text-xs font-black text-[#052a51]">
                Intrihub Supply Solutions Private Limited
              </p>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-sm mt-0.5">
                Central Supply & Logistics Hub, Begur, Bengaluru, Karnataka 560114<br />
                <strong className="text-[#052a51] block mt-0.5">GSTIN: 29AABCT1234F1Z8</strong>
                Email: support@intrihub.com · Phone: +91 92649 20211
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#F26522] bg-orange-50 px-3 py-1 rounded-md border border-orange-200/60 inline-block">
                TAX INVOICE
              </span>
              <p className="text-sm font-black text-[#052a51] mt-2">Invoice No: {invoiceNumber}</p>
              <p className="text-xs text-gray-500 mt-0.5">Order ID: #{order.id}</p>
              <p className="text-xs text-gray-500 mt-0.5">Date: {orderDate}</p>
              <p className="text-xs font-bold text-emerald-700 mt-1">
                Payment: {order.paymentStatus || "Paid"} ({order.paymentMethod || "Online"})
              </p>
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="invoice-avoid-break grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 border-b border-gray-100 text-xs">
            <div>
              <span className="font-black text-gray-400 uppercase tracking-wider block mb-1">
                Billed / Shipped To:
              </span>
              <p className="text-sm font-bold text-[#052a51]">{order.customerName}</p>
              <p className="text-gray-600 mt-0.5">📞 {order.customerPhone}</p>
              {order.customerEmail && <p className="text-gray-600">✉️ {order.customerEmail}</p>}
              <p className="text-gray-600 mt-1 leading-relaxed">
                📍 {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state || "Karnataka"} — {order.shippingAddress.pincode}
              </p>
            </div>

            <div>
              <span className="font-black text-gray-400 uppercase tracking-wider block mb-1">
                Fulfillment & Logistics:
              </span>
              <div className="space-y-1 text-gray-600">
                <p>
                  Payment Status: <strong className="text-emerald-700 font-bold">{order.paymentStatus}</strong>
                </p>
                <p>Payment Mode: {order.paymentMethod} {order.paymentId ? `(${order.paymentId})` : ""}</p>
                <p>Order Status: <strong className="text-[#052a51]">{order.orderStatus}</strong></p>
                {order.trackingNumber && (
                  <p>
                    Courier: {order.courierName || "Intrihub Logistics"} · Tracking #{order.trackingNumber}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-6">
            <table className="invoice-table w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5">#</th>
                  <th className="py-2.5">Item & Description</th>
                  <th className="py-2.5 text-center">Qty</th>
                  <th className="py-2.5 text-right">Unit Rate</th>
                  <th className="py-2.5 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {order.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-3 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="py-3 pr-2">
                      <p className="font-bold text-[#052a51]">{item.productName}</p>
                      {item.variantDetails && (
                        <p className="text-[11px] text-gray-400">{item.variantDetails}</p>
                      )}
                    </td>
                    <td className="py-3 text-center font-bold">{item.boxQuantity}</td>
                    <td className="py-3 text-right text-gray-600">{formatPrice(item.pricePerBox)}</td>
                    <td className="py-3 text-right font-black text-[#052a51]">
                      {formatPrice(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Math & GST Breakdown */}
          <div className="invoice-avoid-break border-t-2 border-gray-200 pt-4 flex flex-col items-end text-xs space-y-1.5">
            <div className="flex justify-between w-72 text-gray-600">
              <span>Taxable Value (Excl. GST):</span>
              <span className="font-semibold">{formatPrice(taxableValue)}</span>
            </div>
            <div className="flex justify-between w-72 text-gray-600">
              <span>CGST (9%):</span>
              <span className="font-semibold">{formatPrice(cgst)}</span>
            </div>
            <div className="flex justify-between w-72 text-gray-600">
              <span>SGST (9%):</span>
              <span className="font-semibold">{formatPrice(sgst)}</span>
            </div>
            <div className="flex justify-between w-72 text-gray-600 pt-1 border-t border-gray-100">
              <span>Subtotal (Incl. GST):</span>
              <span className="font-bold text-[#052a51]">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between w-72 text-gray-600">
              <span>Delivery Charges:</span>
              <span className="font-bold">
                {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between w-72 text-emerald-700">
                <span>Coupon Discount:</span>
                <span className="font-bold">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between w-72 text-base font-black text-[#052a51] pt-2 border-t-2 border-gray-200">
              <span>Grand Total:</span>
              <span className="text-[#F26522]">{formatPrice(order.total)}</span>
            </div>
            <p className="text-[10px] text-gray-400 pt-1 text-right">
              Amount in words: Indian Rupees Only (GST Included).
            </p>
          </div>

          {/* Footer Note */}
          <div className="invoice-avoid-break mt-8 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-1">
            <p className="font-bold text-gray-500">
              Thank you for choosing Intrihub — Everything for Every Space!
            </p>
            <p>
              This is a computer-generated tax invoice and requires no physical signature. For inquiries or logistics coordination, call +91 92649 20211.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
