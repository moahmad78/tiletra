"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Truck, CheckCircle, ArrowLeft, ArrowRight, Clock, Star, Edit3 } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WriteReviewModal from "@/components/reviews/WriteReviewModal";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function OrdersPage() {
  const storeOrders = useAdminStore((s) => s.orders);
  const [reviewProduct, setReviewProduct] = useState<{ id: string; name: string } | null>(null);

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

  const displayOrders = storeOrders.map((o) => ({
    id: o.id,
    date: new Date(o.createdAt).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    status: o.orderStatus,
    statusColor: getStatusColor(o.orderStatus),
    estimatedDelivery: o.estimatedDelivery,
    total: o.total,
    items: o.items.map((i) => ({
      productId: i.productId,
      name: i.productName,
      variant: i.variantDetails,
      quantity: i.boxQuantity,
      price: i.pricePerBox,
      image: i.image,
    })),
  }));

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div
        className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-[110px] md:pt-[168px] pb-10 flex-1"
      >
        <div className="flex items-center gap-3 mb-6">
          <Link href="/account" className="p-2 rounded-xl bg-white border border-gray-200 text-[#052a51] hover:bg-gray-50 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-[#052a51]">My Orders</h1>
            <p className="text-xs text-gray-500">Track shipments and order status</p>
          </div>
        </div>

        <div className="space-y-5">
          {displayOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-5"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">Order ID:</span>
                    <span className="text-sm font-black text-[#052a51]">{order.id}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">Placed on {order.date}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${order.statusColor}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-black text-[#052a51]">{formatPrice(order.total)}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-[#052a51] line-clamp-1">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.variant}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Qty: {item.quantity} box(es) · {formatPrice(item.price)}/box
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setReviewProduct({ id: item.productId, name: item.name })
                      }
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#052a51]/5 hover:bg-[#F26522] hover:text-white text-[#052a51] text-xs font-bold rounded-xl transition-all shadow-2xs"
                    >
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span>Review Tile</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Order Footer & Tracking info */}
              <div className="p-4 bg-gray-50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-[#F26522]" />
                  <span>
                    Estimated Delivery: <strong className="text-[#052a51]">{order.estimatedDelivery}</strong>
                  </span>
                </div>
                <a
                  href="https://wa.me/917870935277"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#F26522] hover:underline"
                >
                  Need help with order? Contact Support →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Modal Trigger */}
      {reviewProduct && (
        <WriteReviewModal
          productId={reviewProduct.id}
          productName={reviewProduct.name}
          isOpen={Boolean(reviewProduct)}
          onClose={() => setReviewProduct(null)}
        />
      )}

      <Footer />
    </main>
  );
}
