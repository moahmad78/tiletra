"use client";

import React from "react";
import { X, Printer, Package } from "lucide-react";
import type { AdminOrder } from "@/lib/admin-store";

function formatPrice(n: number) {
  return "₹" + (n || 0).toLocaleString("en-IN");
}

function sanitizePhone(phone?: string | null): string {
  if (!phone) return "";
  const str = String(phone).trim();
  const lower = str.toLowerCase();
  if (
    lower.startsWith("email_") ||
    lower.startsWith("google_") ||
    lower.includes("email") ||
    lower.includes("@") ||
    /[a-zA-Z_]/.test(str)
  ) {
    return "";
  }
  const digits = str.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
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

  const orderId = (order as any).orderNumber || (order.id || "").replace("IH-", "").replace("TL-", "").replace("ord_", "").toUpperCase() || "ORD-0000";
  const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const customerName = (order as any).deliveryName || order.customerName || "Valued Customer";
  const rawPhone = (order as any).deliveryPhone || order.customerPhone;
  const cleanPhone = sanitizePhone(rawPhone);
  const phoneDisplay = cleanPhone ? `+91 ${cleanPhone}` : "Not Provided";

  const addrObj = typeof order.shippingAddress === "object" ? (order.shippingAddress as any) : null;
  const address =
    (order as any).deliveryAddress && (order as any).deliveryAddress.trim().length > 5
      ? (order as any).deliveryAddress.trim()
      : typeof order.shippingAddress === "string"
      ? order.shippingAddress
      : addrObj
      ? [
          addrObj.houseNumber || addrObj.flatNumber ? `House/Flat: ${addrObj.houseNumber || addrObj.flatNumber}` : "",
          addrObj.buildingName || addrObj.building ? `Building: ${addrObj.buildingName || addrObj.building}` : "",
          addrObj.line1 || addrObj.street || "",
          addrObj.line2 || addrObj.area || "",
          addrObj.landmark ? `Landmark: ${addrObj.landmark.replace(/^near\s+/i, "")}` : "",
          addrObj.city || "Bengaluru",
          `${addrObj.state || "Karnataka"} - ${addrObj.pincode || addrObj.postalCode || "560068"}`,
        ]
          .filter(Boolean)
          .join(", ")
      : "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068";

  const pMethod = String(order?.paymentMethod || "cod").toLowerCase();
  const paymentText = pMethod === "cod" ? "COD Payment" : "Online Payment";

  const subtotal = Number(order.subtotal || order.total || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total || subtotal + deliveryFee);

  return (
    <div className="invoice-print-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/60 backdrop-blur-xs">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          header, footer, nav, aside, .no-print, [role="navigation"], [role="banner"], [role="complementary"] {
            display: none !important;
          }

          .invoice-print-backdrop {
            position: static !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }

          .invoice-print-card {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }

          .invoice-print-body {
            position: static !important;
            display: block !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .invoice-avoid-break {
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
            <h3 className="font-black text-[#052a51] text-sm">Tax Invoice: #{orderId}</h3>
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
        <div className="invoice-print-body flex-1 overflow-y-auto p-6 sm:p-10 text-[#0f172a] bg-white relative">
          {/* Watermark Background */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/intri-web-logo.png"
            alt="Watermark"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-[0.05] pointer-events-none object-contain z-0"
          />

          <div className="relative z-10">
            {/* Header */}
            <div className="invoice-avoid-break flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-[#052a51]">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo/intri-web-logo.png"
                  alt="Intrihub Logo"
                  className="h-12 w-auto object-contain mb-2"
                />
                <div className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                  <div>GSTIN: <b>29AAAAA0000A1Z5</b></div>
                  <div>Mobile: <b>+91 9264920211</b></div>
                  <div>Email: <b>support@intrihub.com</b></div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <p className="text-lg font-black text-[#052a51]">OFFICIAL TAX INVOICE</p>
                <p className="text-xs font-bold text-gray-800 mt-1">Order #: {orderId}</p>
                <p className="text-xs text-gray-500 mt-0.5">Date: {orderDate}</p>
                <p className="text-xs font-bold text-gray-900 mt-1">Payment: <span>{paymentText}</span></p>
              </div>
            </div>

            {/* Billed To */}
            <div className="invoice-avoid-break py-5 border-b border-gray-100 text-xs">
              <span className="font-black text-[#052a51] uppercase tracking-wider block mb-1 border-b border-gray-100 pb-1">
                Billed & Delivered To:
              </span>
              <p className="text-sm font-extrabold text-[#0f172a] mt-1">{customerName}</p>
              <p className="text-blue-600 font-bold mt-0.5">Phone: {phoneDisplay}</p>
              <p className="text-gray-700 mt-1 leading-relaxed">
                <b>Delivery Address:</b> {address}
              </p>
            </div>

            {/* Line Items Table */}
            <div className="py-6">
              <table className="invoice-table w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-y-2 border-slate-300 text-[#052a51] font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-2 text-center w-10">#</th>
                    <th className="py-2.5 px-2">Product Description</th>
                    <th className="py-2.5 px-2 text-center w-24">Quantity</th>
                    <th className="py-2.5 px-2 text-right w-28">Unit Rate</th>
                    <th className="py-2.5 px-2 text-right w-28">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-2 text-gray-400 font-bold text-center">{idx + 1}</td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-[#0f172a]">{item.productName || "Material Product"}</p>
                        {item.variantDetails && (
                          <p className="text-[11px] text-gray-500 font-normal">{item.variantDetails}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-bold">{item.boxQuantity || (item as any).quantity || 1} Box</td>
                      <td className="py-3 px-2 text-right text-gray-600">{formatPrice(item.pricePerBox || (item as any).price || 0)}</td>
                      <td className="py-3 px-2 text-right font-black text-[#052a51]">
                        {formatPrice(item.totalPrice || (item.pricePerBox || 0) * (item.boxQuantity || 1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary & Signature */}
            <div className="invoice-avoid-break border-t-2 border-gray-200 pt-4 flex flex-row justify-between items-end text-xs">
              <div className="text-[11px] text-gray-500 leading-relaxed max-w-xs">
                <p className="font-bold text-gray-800 mb-0.5">Terms & Notes:</p>
                <p>• Computer-generated tax invoice verified by IntriHub.</p>
                <p>• Everything, Every Place • www.intrihub.com</p>
              </div>

              <div className="flex flex-col items-end space-y-3">
                <div className="w-64 bg-slate-50 border border-gray-200 rounded-lg p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery & Freight:</span>
                    <span>{deliveryFee === 0 ? "FREE" : formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-[#052a51] pt-2 border-t-2 border-dashed border-gray-300">
                    <span>Grand Total:</span>
                    <span className="text-[#052a51]">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Digital Signature */}
                <div className="text-center w-44">
                  <div className="border border-dashed border-slate-400 rounded-md p-2 bg-slate-50">
                    <p className="font-serif italic font-bold text-base text-[#052a51]">INTRIHUB</p>
                    <p className="text-[9px] font-extrabold text-emerald-600 uppercase mt-0.5">✔ Digitally Signed</p>
                  </div>
                  <p className="text-[10px] text-gray-600 font-semibold mt-1">Authorized Signatory</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="invoice-avoid-break mt-8 pt-4 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-0.5">
              <p>This is an official computer-generated tax invoice verified by IntriHub.</p>
              <p>Everything, Every Place • www.intrihub.com • Support: support@intrihub.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
