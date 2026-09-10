"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Trash2, AlertTriangle, CheckCircle2, ShieldAlert, ArrowLeft, Mail, Phone } from "lucide-react";

export default function DeleteAccountPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [accountType, setAccountType] = useState<"user" | "business">("user");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-[#052a51] mb-8 transition-colors"
        >
          <ArrowLeft size={16} /> Back to IntriHub Home
        </Link>

        <div className="bg-white rounded-3xl shadow-sm border border-neutral-200/80 p-6 sm:p-10 space-y-8">
          <div className="flex items-center gap-4 border-b border-neutral-100 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <Trash2 size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Request Account & Data Deletion
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                IntriHub User App &amp; Business App Data Management
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200/60 rounded-2xl flex items-start gap-3.5">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong className="font-bold">What happens when your account is deleted?</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-amber-800">
                <li>Your profile credentials, delivery addresses, and saved wishlists are permanently removed.</li>
                <li>Your device push notification tokens and session cookies will be revoked immediately.</li>
                <li>Business/Vendor accounts: Store profile, inventory listings, and team access will be closed.</li>
                <li>Completed financial transactions and tax invoices will be retained as legally mandated by Indian accounting regulations.</li>
              </ul>
            </div>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
              <h3 className="text-lg font-bold text-emerald-900">Request Successfully Received</h3>
              <p className="text-sm text-emerald-800 max-w-md mx-auto">
                We have registered your deletion request for <strong>{emailOrPhone}</strong>. Our security team will verify the request and complete the account purge within 48 to 72 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-xs font-semibold text-emerald-700 underline hover:text-emerald-900"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("user")}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold border text-center transition-all ${
                      accountType === "user"
                        ? "border-[#052a51] bg-[#052a51] text-white shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    Customer / User App
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType("business")}
                    className={`py-3 px-4 rounded-xl text-sm font-semibold border text-center transition-all ${
                      accountType === "business"
                        ? "border-[#052a51] bg-[#052a51] text-white shadow-sm"
                        : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    Vendor / Business App
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Registered Email Address or Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="e.g. user@example.com or +91 9876543210"
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#052a51] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Reason for Deletion (Optional)
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Help us understand how we can improve (optional)..."
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#052a51] focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShieldAlert size={18} />
                Submit Account & Data Deletion Request
              </button>
            </form>
          )}

          <div className="pt-6 border-t border-neutral-100 text-xs text-neutral-500 space-y-2">
            <h4 className="font-bold text-neutral-700 text-sm">Need direct assistance?</h4>
            <p className="flex items-center gap-2">
              <Mail size={14} className="text-[#052a51]" />
              Support Email: <a href="mailto:support@intrihub.com" className="text-[#052a51] font-semibold underline">support@intrihub.com</a>
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} className="text-[#052a51]" />
              Helpline: +91 91720 03004
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
