"use client";

import { useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Printer,
  CheckCircle,
  Truck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Save,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Package,
} from "lucide-react";
import { useAdminStore, type OrderStatus } from "@/lib/admin-store";
import { useNotificationsStore } from "@/lib/notifications-store";
import InvoiceModal from "@/components/admin/InvoiceModal";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

const STEPS: OrderStatus[] = [
  "Processing",
  "Confirmed",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orders = useAdminStore((s) => s.orders);
  const updateOrderStatus = useAdminStore((s) => s.updateOrderStatus);
  const updateOrderTracking = useAdminStore((s) => s.updateOrderTracking);
  const updateOrderNotes = useAdminStore((s) => s.updateOrderNotes);

  const order = orders.find((o) => o.id === id);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [courier, setCourier] = useState(order?.courierName || "Delhivery Freight");
  const [tracking, setTracking] = useState(order?.trackingNumber || "");
  const [notes, setNotes] = useState(order?.internalNotes || "");

  if (!order) {
    return (
      <div className="bg-white p-12 rounded-3xl text-center border border-gray-200">
        <p className="text-lg font-bold text-[#052a51]">Order Not Found</p>
        <Link href="/admin/orders" className="mt-4 inline-block text-xs font-bold text-[#F26522]">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIdx = STEPS.indexOf(order.orderStatus);

  const handleStatusClick = (status: OrderStatus) => {
    updateOrderStatus(order.id, status);

    // Also dispatch in-app notification to customer
    const { addNotification } = useNotificationsStore.getState();
    addNotification({
      type: "order_status",
      title: `Order ${order.id} is now ${status}!`,
      body:
        status === "Delivered"
          ? `Your tile shipment for ${order.id} has been delivered successfully. Please inspect the boxes and write a quick review!`
          : status === "Dispatched"
          ? `Your tile shipment for ${order.id} is on the way via ${order.courierName || "freight"}.`
          : `Status for order ${order.id} updated to ${status}.`,
      link: "/account/orders",
    });

    toast.success(`Order marked as ${status}`);
  };

  const handleSaveTracking = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderTracking(order.id, courier, tracking);
    toast.success("Courier & tracking updated!");
  };

  const handleSaveNotes = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrderNotes(order.id, notes);
    toast.success("Internal notes saved!");
  };

  // WhatsApp click to chat URL
  const cleanPhone = order.customerPhone.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${order.customerName}, regarding your Tiletra order ${order.id}...`
  )}`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-[#052a51]">Order {order.id}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#F26522]/10 text-[#F26522]">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <MessageSquare size={14} />
            <span>WhatsApp Customer</span>
          </a>

          <button
            onClick={() => setInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
          >
            <Printer size={14} />
            <span>Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* ── Visual Fulfillment Stepper ── */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#052a51]">Shipment Lifecycle Status</h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
          {STEPS.map((s, idx) => {
            const isCompleted = idx <= currentStepIdx;
            const isCurrent = s === order.orderStatus;

            return (
              <button
                key={s}
                onClick={() => handleStatusClick(s)}
                className={`p-3 rounded-xl border text-left transition-all active:scale-95 ${
                  isCurrent
                    ? "bg-[#052a51] text-white border-[#052a51] shadow-sm"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">
                    Step {idx + 1}
                  </span>
                  {isCompleted && <CheckCircle size={14} className={isCurrent ? "text-[#F26522]" : "text-emerald-600"} />}
                </div>
                <p className="text-xs font-black">{s}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Order Items & Address Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
          <h3 className="text-base font-black text-[#052a51]">Order Items ({order.items.length})</h3>

          <div className="divide-y divide-gray-100">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                    <Image src={item.image} alt={item.productName} fill className="object-cover" sizes="64px" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#052a51]">{item.productName}</h4>
                    <p className="text-xs text-gray-500">{item.variantDetails}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.boxQuantity} box(es) × {formatPrice(item.pricePerBox)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-[#052a51]">{formatPrice(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Math */}
          <div className="border-t-2 border-gray-100 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span className="font-bold">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charges</span>
              <span className="font-bold">
                {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-[#052a51] pt-2 border-t border-gray-100">
              <span>Total Paid</span>
              <span className="text-[#F26522]">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Customer & Address Details */}
        <div className="space-y-6">
          {/* Customer Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-[#052a51] uppercase tracking-wider">
              Customer Info
            </h3>

            <div className="space-y-2.5 text-xs text-gray-600">
              <p className="font-bold text-[#052a51] text-sm">{order.customerName}</p>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#F26522] shrink-0" />
                <a href={`tel:${cleanPhone}`} className="hover:underline text-[#052a51] font-bold">
                  {order.customerPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#F26522] shrink-0" />
                <a href={`mailto:${order.customerEmail}`} className="hover:underline truncate">
                  {order.customerEmail}
                </a>
              </div>
            </div>

            <hr className="border-gray-100" />

            <div className="space-y-1.5 text-xs text-gray-600">
              <span className="font-bold text-[#052a51] flex items-center gap-1.5">
                <MapPin size={14} className="text-[#F26522]" /> Delivery Address
              </span>
              <p className="leading-relaxed pl-5">
                {order.shippingAddress.line1}
                {order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.pincode}
              </p>
            </div>
          </div>

          {/* Payment Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#052a51] uppercase tracking-wider">
                Payment Record
              </h3>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                order.paymentMethod === "COD"
                  ? "bg-amber-100 text-amber-900"
                  : "bg-blue-100 text-blue-900"
              }`}>
                {order.paymentMethod === "COD" ? "Cash on Delivery" : "Online Payment"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-500">Mode:</span>
              <span className="font-bold text-[#052a51]">{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status:</span>
              <span className={`font-black px-2 py-0.5 rounded ${
                order.paymentStatus === "Paid"
                  ? "text-emerald-700 bg-emerald-50"
                  : "text-amber-700 bg-amber-50"
              }`}>
                {order.paymentStatus === "Paid" ? "Paid / Collected" : "Pending Collection"}
              </span>
            </div>
            {order.paymentId && (
              <div className="flex justify-between">
                <span className="text-gray-500">Transaction/Ref ID:</span>
                <span className="font-mono text-[10px] text-gray-600">{order.paymentId}</span>
              </div>
            )}

            {/* COD Cash Collection Action */}
            {order.paymentMethod === "COD" && (
              <div className="pt-3 border-t border-gray-100">
                {order.paymentStatus !== "Paid" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const { markPaymentCollected } = useAdminStore.getState();
                      markPaymentCollected(order.id);
                      toast.success(`Payment of ${formatPrice(order.total)} marked as collected in cash!`);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                  >
                    <CheckCircle size={14} />
                    <span>Mark Cash Collected ({formatPrice(order.total)})</span>
                  </button>
                ) : (
                  <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-center font-bold text-[11px] flex items-center justify-center gap-1.5">
                    <CheckCircle size={14} className="text-emerald-600" />
                    <span>Cash collected & confirmed by delivery partner</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Courier & Tracking + Internal Notes ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Courier Info */}
        <form onSubmit={handleSaveTracking} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Truck size={18} className="text-[#F26522]" />
            <h3 className="text-sm font-bold text-[#052a51]">Courier Partner & Tracking</h3>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              Courier Partner
            </label>
            <input
              type="text"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              placeholder="e.g. Delhivery Freight, SafeXpress"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
              Tracking / AWB Number
            </label>
            <input
              type="text"
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              placeholder="e.g. DEL-984729104"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors mt-2"
          >
            Update Tracking Info
          </button>
        </form>

        {/* Internal Notes */}
        <form onSubmit={handleSaveNotes} className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3">
          <h3 className="text-sm font-bold text-[#052a51]">Internal Admin Notes (Private)</h3>

          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Warehouse notes, delivery instructions, breakage checks..."
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
          />

          <button
            type="submit"
            className="w-full py-2 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Save Internal Note
          </button>
        </form>
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        order={order}
        isOpen={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
      />
    </div>
  );
}
