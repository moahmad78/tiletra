"use client";

import { useState, useEffect } from "react";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getVendorProducts } from "@/lib/actions/vendor";
import type { Product } from "@/lib/data/products";
import { Boxes, AlertTriangle, CheckCircle2, Search } from "lucide-react";

export default function VendorInventoryPage() {
  const { vendor } = useVendorAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (vendor?.id) {
      getVendorProducts(vendor.id).then(setProducts);
    }
  }, [vendor?.id]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-gray-500">
            Monitor real-time stock levels across all variants
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter items by name..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.map((p) => {
            const totalStock = p.variants.reduce((acc, v) => acc + v.stockBoxes, 0);
            const isLowStock = totalStock < 20;

            return (
              <div key={p.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{p.name}</h3>
                  <p className="text-xs text-gray-500">
                    {p.variants.length} variant(s) listed • Category: {p.categoryName}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                      isLowStock
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {isLowStock ? <AlertTriangle size={13} /> : <CheckCircle2 size={13} />}
                    {totalStock} {p.unitOfSale || "box(es)"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
