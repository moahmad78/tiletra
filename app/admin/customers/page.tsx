"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  MessageSquare,
  Mail,
  Phone,
  MapPin,
  Loader2,
} from "lucide-react";
import { getCustomers } from "@/lib/actions/customers";

function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading customer CRM from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Customer Directory</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            View customer profiles, order history, and lifetime spend in PostgreSQL
          </p>
        </div>

        <span className="text-xs font-bold text-[#052a51] px-3 py-1.5 bg-gray-100 rounded-xl w-fit">
          {customers.length} Registered Customers
        </span>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone number, or city..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
          />
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCustomers.length === 0 ? (
          <div className="col-span-2 bg-white p-12 rounded-2xl text-center text-gray-400 border border-gray-200">
            No customers found matching your search.
          </div>
        ) : (
          filteredCustomers.map((cust) => {
            const cleanPhone = cust.phone.replace(/[^0-9]/g, "");
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
              `Hello ${cust.name}, greetings from Intrihub!`
            )}`;

            return (
              <div
                key={cust.id}
                className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-[#052a51] text-white font-black text-base flex items-center justify-center shadow-xs">
                        {cust.name?.[0] || "C"}
                      </div>
                      <div>
                        <h3 className="font-black text-[#052a51] text-base">{cust.name}</h3>
                        <p className="text-xs text-gray-400">
                          Joined {new Date(cust.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {cust.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Orders</span>
                      <p className="font-black text-[#052a51] text-sm mt-0.5">{cust.totalOrders} order(s)</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Lifetime Spend</span>
                      <p className="font-black text-[#F26522] text-sm mt-0.5">{formatPrice(cust.totalSpent)}</p>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone size={13} className="text-[#F26522]" />
                      <span className="font-semibold text-[#052a51]">{cust.phone}</span>
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-[#F26522]" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-[#F26522]" />
                      <span>{cust.city || "Bangalore"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions & WhatsApp button */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {cust.totalOrders} order(s) placed
                  </span>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageSquare size={13} />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
