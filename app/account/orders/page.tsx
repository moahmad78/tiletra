"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Truck, ArrowLeft, Star, Loader2, ShoppingBag, LogIn, FileText, Download } from "lucide-react";
import { useAuthStore, useAuthHydrated } from "@/lib/auth-store";
import { getCustomerOrders } from "@/lib/actions/orders";
import { useSocket } from "@/lib/socket";
import WriteReviewModal from "@/components/reviews/WriteReviewModal";
import OrderTrackingModal from "@/components/orders/OrderTrackingModal";
import OrderInvoiceModal from "@/components/orders/OrderInvoiceModal";
import { toast } from "sonner";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function OrdersPage() {
  const { user, openLoginModal } = useAuthStore();
  const hydrated = useAuthHydrated(); // true once localStorage rehydration is done
  const [orders, setOrders] = useState<any[]>([]);
  // Start in loading state — show skeleton until we know hydration status
  const [loading, setLoading] = useState(true);
  const [reviewProduct, setReviewProduct] = useState<{ id: string; name: string } | null>(null);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<any>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any>(null);

  const cleanPhone = user?.phone ? user.phone.replace(/\D/g, "") : "";
  const userRoom = user?.id ? `user:${user.id}` : cleanPhone ? `phone:${cleanPhone}` : null;

  // ── Live Status Updates ──
  useSocket(userRoom, {
    "order-status-updated": (data: any) => {
      console.log("⚡ [CUSTOMER ORDER UPDATE RECEIVED]:", data);
      toast.info(`📦 Order #${data.orderId} is now ${data.orderStatus}!`, {
        description: data.trackingNumber ? `Tracking: ${data.trackingNumber}` : undefined,
      });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.orderId
            ? {
                ...o,
                orderStatus: data.orderStatus,
                trackingNumber: data.trackingNumber || o.trackingNumber,
                courierName: data.courierName || o.courierName,
                estimatedDelivery: data.estimatedDelivery || o.estimatedDelivery,
              }
            : o
        )
      );
    },
  });

  useEffect(() => {
    // ── CRITICAL: wait for Zustand localStorage hydration before touching user ──
    if (!hydrated) return;

    async function load() {
      try {
        setLoading(true);
        const hasRealPhone = user?.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_");
        const hasValidDbId = user?.id && !user.id.startsWith("usr-");
        if (hasValidDbId || hasRealPhone || user?.email) {
          const userOrders = await getCustomerOrders({
            userId: hasValidDbId ? user.id : undefined,
            phone: hasRealPhone ? user.phone : undefined,
            email: user?.email,
          });
          setOrders(userOrders);
        } else {
          // User is confirmed not logged in or brand new without orders — show empty state
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching user orders:", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [hydrated, user?.id, user?.phone, user?.email]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-[#2F7A4F] bg-green-50 border-green-200";
      case "Dispatched":
      case "Out for Delivery":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "Processing":
      case "Confirmed":
        return "text-amber-600 bg-amber-50 border-amber-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/account"
            className="md:hidden p-2 rounded-xl bg-white border border-gray-200 text-[#052a51] hover:bg-gray-50 transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">My Orders</h1>
            <p className="text-xs text-gray-500">Track shipments, deliveries, and download invoices</p>
          </div>
        </div>

        <Link
          href="/shop"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] hover:bg-[#0a3e74] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <span>Explore Catalog</span>
        </Link>
      </div>

      {loading || !hydrated ? (
        // Skeleton — shown during hydration AND during fetch
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading your orders…</p>
        </div>
      ) : !user ? (
        // Not logged in — clear prompt
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4">
          <div className="w-14 h-14 bg-[#052a51]/5 rounded-full flex items-center justify-center mx-auto text-[#052a51]">
            <LogIn size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#052a51]">Login to view your orders</h3>
            <p className="text-xs text-gray-400 mt-1">Your order history is linked to your account.</p>
          </div>
          <button
            onClick={() => openLoginModal()}
            className="inline-block px-5 py-2.5 bg-[#F26522] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#d95a1e]"
          >
            Login / Sign Up
          </button>
        </div>
      ) : orders.length === 0 ? (
        // Logged in but no orders yet
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-4">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#052a51]">No orders yet</h3>
            <p className="text-xs text-gray-400 mt-1">Explore our catalog and place your first order!</p>
          </div>
          <Link
            href="/shop"
            className="inline-block px-5 py-2.5 bg-[#F26522] text-white text-xs font-bold rounded-xl shadow-md hover:bg-[#d95a1e]"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 md:p-7 shadow-2xs border border-gray-200/90 space-y-5"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Order ID:</span>
                    <span className="text-sm font-black text-[#052a51]">#{order.id}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                      order.orderStatus
                    )}`}
                  >
                    {order.orderStatus}
                  </span>
                  <span className="text-sm font-black text-[#052a51]">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                        <Image
                          src={item.image || "/placeholders/product.svg"}
                          alt={item.productName}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#052a51] line-clamp-1">{item.productName}</h3>
                        <p className="text-xs text-gray-500">{item.variantDetails}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Qty: {item.boxQuantity || item.quantity || 1} · {formatPrice(item.pricePerBox || item.price || 0)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setReviewProduct({ id: item.productId, name: item.productName })
                      }
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#052a51]/5 hover:bg-[#F26522] hover:text-white text-[#052a51] text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                    >
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span>Review</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* ── Order Action Buttons & Tracking info (Side by Side) ── */}
              <div className="p-4 bg-gray-50 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Truck size={16} className="text-[#F26522] shrink-0" />
                  <span>
                    Estimated Delivery: <strong className="text-[#052a51]">{order.estimatedDelivery || "3–5 Business Days"}</strong>
                  </span>
                </div>

                {/* Two Clear Buttons: Track Order & Download Bill */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedTrackingOrder(order)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-orange-50 text-[#F26522] border border-orange-200 font-bold text-xs transition-all shadow-2xs active:scale-95 cursor-pointer"
                  >
                    <Truck size={14} />
                    <span>Track Order</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceOrder(order)}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#052a51] hover:bg-[#041f3d] text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download Bill</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewProduct && (
        <WriteReviewModal
          productId={reviewProduct.id}
          productName={reviewProduct.name}
          isOpen={Boolean(reviewProduct)}
          onClose={() => setReviewProduct(null)}
        />
      )}

      {/* Live Order Tracking Modal */}
      {selectedTrackingOrder && (
        <OrderTrackingModal
          order={selectedTrackingOrder}
          isOpen={Boolean(selectedTrackingOrder)}
          onClose={() => setSelectedTrackingOrder(null)}
        />
      )}

      {/* Official Tax Invoice / Bill Modal */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
}
