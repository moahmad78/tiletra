"use client";

import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, XCircle, ArrowRight, ShieldAlert } from "lucide-react";

export default function VendorKycBanner({ vendor }: { vendor: any }) {
  if (!vendor) return null;

  const hasPan = Boolean(vendor.panNumber || vendor.panDocUrl);
  const hasAadhar = Boolean(vendor.aadharNumber || vendor.aadharDocUrl);
  const isKycVerified = vendor.kycStatus === "verified";
  const isKycSubmitted = vendor.kycStatus === "submitted";
  const isKycRejected = vendor.kycStatus === "rejected";

  if (isKycVerified) {
    return null; // All good, no warning needed
  }

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* 1. Missing KYC / Incomplete Documents Warning */}
      {(!hasPan || !hasAadhar || vendor.kycStatus === "pending") && !isKycSubmitted && !isKycRejected && (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white">
                  Action Compulsory
                </span>
                <h4 className="text-sm font-black text-amber-950">
                  Submit Mandatory KYC Legal Documents (Aadhaar & PAN)
                </h4>
              </div>
              <p className="text-xs text-amber-900/85 mt-1 leading-relaxed max-w-2xl">
                To comply with India marketplace financial regulations and prevent payout holds on your shop, please upload your Aadhaar Card, PAN Card, and shop storefront photo.
              </p>
            </div>
          </div>

          <Link
            href="/vendor/settings?tab=kyc"
            className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>Upload Documents Now</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 2. KYC Submitted & Pending Admin Verification */}
      {isKycSubmitted && (
        <div className="bg-blue-50/90 border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <Clock size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white">
                  Under Verification
                </span>
                <h4 className="text-sm font-black text-[#052a51]">
                  KYC Documents Submitted for Review
                </h4>
              </div>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Your Aadhaar, PAN, and shop documents have been received and are currently being reviewed by Super Admin.
              </p>
            </div>
          </div>

          <Link
            href="/vendor/settings?tab=kyc"
            className="w-full sm:w-auto px-4 py-2 bg-white border border-blue-200 text-[#052a51] hover:bg-blue-50 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>View Submitted KYC</span>
          </Link>
        </div>
      )}

      {/* 3. KYC Rejected Warning */}
      {isKycRejected && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
              <XCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">
                  Re-upload Required
                </span>
                <h4 className="text-sm font-black text-rose-950">
                  KYC Verification Could Not Be Approved
                </h4>
              </div>
              <p className="text-xs text-rose-900/90 mt-1 leading-relaxed">
                {vendor.kycNotes
                  ? `Admin Note: ${vendor.kycNotes}`
                  : "Please re-upload clear photos/scans of your Aadhaar Card and PAN Card."}
              </p>
            </div>
          </div>

          <Link
            href="/vendor/settings?tab=kyc"
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>Re-upload Documents</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
