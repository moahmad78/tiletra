"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Landmark,
  Building,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getVendorProfile, getVendorDashboardStats } from "@/lib/actions/vendor";
import { getVendorPayoutSummary } from "@/lib/actions/payouts";
import { formatPrice } from "@/lib/formatters";

export default function VendorPayoutsPage() {
  const { vendor } = useVendorAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [payoutSummary, setPayoutSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (vendor?.id) {
      Promise.all([
        getVendorProfile(vendor.id),
        getVendorDashboardStats(vendor.id),
        getVendorPayoutSummary(vendor.id),
      ]).then(([p, s, ps]) => {
        setProfile(p);
        setStats(s);
        setPayoutSummary(ps);
        setLoading(false);
      });
    }
  }, [vendor?.id]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Payouts & Bank Settlement
          </h1>
          <p className="text-xs text-gray-500">
            Automated scheduled weekly payouts, bank account configuration, and sales reconciliation
          </p>
        </div>

        <Link
          href="/vendor/settings"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors self-start sm:self-auto"
        >
          <Landmark size={14} /> Update Bank Details
        </Link>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Ready for Next Weekly Payout
          </p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">
            {formatPrice(payoutSummary?.readyForPayoutAmount ?? 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <Calendar size={12} className="text-emerald-600" /> {payoutSummary?.unsettledSplitsCount ?? 0} delivered orders ready
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            In-Progress Deliveries (Est.)
          </p>
          <h3 className="text-2xl font-black text-blue-600 mt-1">
            {formatPrice(payoutSummary?.inProgressEstimatedPayout ?? 0)}
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            {payoutSummary?.inProgressCount ?? 0} active orders pending delivery
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Lifetime Settled Payouts
          </p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">
            {formatPrice(payoutSummary?.lifetimePaidOut ?? stats?.totalRevenue ?? 0)}
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">
            Platform Commission: {vendor?.commissionRate ?? 15}%
          </p>
        </div>
      </div>

      {/* Bank Account Overview Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Landmark size={20} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[#052a51]">
                Registered Settlement Bank Account
              </h3>
              <p className="text-xs text-gray-500">
                Weekly payouts are transferred directly to this verified account
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              profile?.bankAccountNumber
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {profile?.bankAccountNumber ? "Active for Payouts" : "Bank Details Required"}
          </span>
        </div>

        {profile?.bankAccountNumber ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 text-xs">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Account Holder</p>
              <p className="font-bold text-gray-900 mt-0.5">{profile.bankAccountHolder || "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Bank Name</p>
              <p className="font-bold text-gray-900 mt-0.5">{profile.bankName || "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Account Number</p>
              <p className="font-mono font-bold text-gray-900 mt-0.5">
                •••• •••• {profile.bankAccountNumber.slice(-4)}
              </p>
            </div>
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">IFSC / UPI</p>
              <p className="font-mono font-bold text-gray-900 mt-0.5">
                {profile.bankIfscCode || profile.bankUpiId || "—"}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 text-xs text-amber-900">
              <AlertCircle size={18} className="text-amber-600 shrink-0" />
              <span>
                You have not added your bank account details yet. Please add your bank details so Super Admin can transfer your payout earnings.
              </span>
            </div>
            <Link
              href="/vendor/settings"
              className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              Add Bank Account
            </Link>
          </div>
        )}
      </div>

      {/* Historical Payouts Ledger Table */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-4">
        <h3 className="text-base font-black text-gray-900">Payout Settlement History</h3>

        {!payoutSummary?.pastPayouts || payoutSummary.pastPayouts.length === 0 ? (
          <div className="py-8 text-center text-xs text-gray-400">
            No past payout batches yet. Settlements will appear here once weekly cycles execute.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                  <th className="py-2.5">Batch ID</th>
                  <th className="py-2.5">Settlement Period</th>
                  <th className="py-2.5">Orders Included</th>
                  <th className="py-2.5">Amount Transferred</th>
                  <th className="py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payoutSummary.pastPayouts.map((payout: any) => (
                  <tr key={payout.id} className="text-gray-800">
                    <td className="py-3 font-mono font-bold text-[#052a51]">
                      #{payout.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(payout.periodStart).toLocaleDateString("en-IN")} — {new Date(payout.periodEnd).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 font-semibold">{payout.splits?.length || 0} Splits</td>
                    <td className="py-3 font-black text-emerald-600">{formatPrice(payout.amount)}</td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase ${
                          payout.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : payout.status === "held"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
