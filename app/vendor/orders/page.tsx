"use client";

import Link from "next/link";
import { ShoppingBag, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { useVendorAuth } from "@/lib/vendor-auth";

export default function VendorOrdersPage() {
  const { vendor } = useVendorAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Order Fulfillment & Splits
          </h1>
          <p className="text-xs text-gray-500">
            View orders containing your shop's line items and update dispatch status
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <ShoppingBag size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Order Splitting & Fulfillment Engine (Phase 8b)
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          In Phase 8b, customer checkout orders with items from multiple shops will automatically split into your dedicated <strong>VendorOrderSplit</strong> queue here. You will be able to mark your items as Dispatched, enter tracking numbers, and view customer shipping labels.
        </p>

        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-left text-xs text-gray-600 space-y-1.5">
          <p className="font-bold text-gray-800 flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" /> Vendor Isolation Guarantee:
          </p>
          <p>• You will only see line items belonging to <strong>{vendor?.businessName}</strong>.</p>
          <p>• Other vendors' products and earnings in the same customer cart remain 100% private.</p>
        </div>

        <div className="pt-2">
          <Link
            href="/vendor/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
          >
            Manage Your Product Catalog <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
