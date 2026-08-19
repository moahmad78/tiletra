"use client";

import Link from "next/link";
import { CreditCard, Calendar, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useVendorAuth } from "@/lib/vendor-auth";

export default function VendorPayoutsPage() {
  const { vendor } = useVendorAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Payouts & Earnings
          </h1>
          <p className="text-xs text-gray-500">
            Automated scheduled payouts, sales breakdown, and commission deductions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Pending Next Payout
          </p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">₹0</h3>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <Calendar size={12} className="text-emerald-600" /> Scheduled Weekly
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Platform Commission
          </p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{vendor?.commissionRate}%</h3>
          <p className="text-[11px] text-gray-500 mt-1">Deducted automatically per sale</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Lifetime Net Earnings
          </p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">₹0</h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Direct Bank Transfer</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-200/80 shadow-xs text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <CreditCard size={32} />
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          Automated Scheduled Payouts (Phase 8c)
        </h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Per confirmed marketplace architecture, payouts run on an automated schedule (weekly cron). Payouts reconcile completed customer deliveries minus your shop's {vendor?.commissionRate}% commission, deposited directly to your registered bank account.
        </p>
      </div>
    </div>
  );
}
