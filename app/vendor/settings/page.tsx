"use client";

import { useState, useEffect } from "react";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getVendorProfile, updateVendorProfile, updateVendorBankDetails } from "@/lib/actions/vendor";
import { Store, Phone, Mail, MapPin, Building, ShieldCheck, CheckCircle2, CreditCard, Landmark, QrCode } from "lucide-react";
import { toast } from "sonner";

export default function VendorSettingsPage() {
  const { vendor, setVendor } = useVendorAuth();
  const [profileLoading, setProfileLoading] = useState(false);
  const [bankLoading, setBankLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    businessAddress: "",
    description: "",
  });

  const [bankData, setBankData] = useState({
    bankAccountHolder: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankUpiId: "",
  });

  useEffect(() => {
    if (vendor?.id) {
      getVendorProfile(vendor.id).then((v: any) => {
        if (v) {
          setFormData({
            businessName: v.businessName || "",
            contactEmail: v.contactEmail || "",
            contactPhone: v.contactPhone || "",
            businessAddress: v.businessAddress || "",
            description: v.description || "",
          });
          setBankData({
            bankAccountHolder: v.bankAccountHolder || "",
            bankName: v.bankName || "",
            bankAccountNumber: v.bankAccountNumber || "",
            bankIfscCode: v.bankIfscCode || "",
            bankUpiId: v.bankUpiId || "",
          });
        }
      });
    }
  }, [vendor?.id]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    setProfileLoading(true);
    const res = await updateVendorProfile(vendor.id, formData);
    setProfileLoading(false);

    if (res.success && res.vendor) {
      toast.success("Shop profile updated successfully!");
      setVendor({
        ...vendor,
        businessName: res.vendor.businessName,
        contactEmail: res.vendor.contactEmail,
        contactPhone: res.vendor.contactPhone,
      });
    } else {
      toast.error(res.error || "Failed to update profile");
    }
  };

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    if (bankData.bankAccountNumber && bankData.bankAccountNumber.length < 6) {
      toast.error("Please enter a valid bank account number");
      return;
    }
    if (bankData.bankIfscCode && bankData.bankIfscCode.length < 5) {
      toast.error("Please enter a valid IFSC code (e.g. SBIN0001234)");
      return;
    }

    setBankLoading(true);
    const res = await updateVendorBankDetails(vendor.id, bankData);
    setBankLoading(false);

    if (res.success) {
      toast.success("Bank & payout details saved successfully!");
    } else {
      toast.error(res.error || "Failed to update bank details");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
          Shop Profile & Payout Settings
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your business contact details and bank account for automated payouts
        </p>
      </div>

      {/* Seller Account Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
            {formData.businessName ? formData.businessName.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {formData.businessName || "Your Shop Name"}
            </h3>
            <p className="text-xs text-gray-500">
              Platform Commission Rate: <strong className="text-emerald-700">{vendor?.commissionRate}%</strong>
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 self-start sm:self-auto">
          <ShieldCheck size={14} /> {vendor?.status?.toUpperCase()}
        </span>
      </div>

      {/* Part B: Bank Account & Payout Details Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-black text-[#052a51] flex items-center gap-2">
              <Landmark size={20} className="text-emerald-600" />
              Bank Account & Payout Details
            </h2>
            <p className="text-xs text-gray-500">
              Enter the bank account where you wish to receive weekly payout transfers from your sales.
            </p>
          </div>

          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
            bankData.bankAccountNumber
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {bankData.bankAccountNumber ? "Bank Details Active" : "Bank Details Pending"}
          </span>
        </div>

        <form onSubmit={handleBankSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={bankData.bankAccountHolder}
                onChange={(e) => setBankData({ ...bankData, bankAccountHolder: e.target.value })}
                placeholder="e.g. Ramesh Kumar or Sri Balaji Enterprises"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Name *
              </label>
              <input
                type="text"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                placeholder="e.g. State Bank of India / HDFC Bank"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Account Number *
              </label>
              <input
                type="text"
                value={bankData.bankAccountNumber}
                onChange={(e) => setBankData({ ...bankData, bankAccountNumber: e.target.value.replace(/\s+/g, "") })}
                placeholder="e.g. 50100456789012"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                IFSC Code *
              </label>
              <input
                type="text"
                value={bankData.bankIfscCode}
                onChange={(e) => setBankData({ ...bankData, bankIfscCode: e.target.value.toUpperCase().trim() })}
                placeholder="e.g. SBIN0001234 / HDFC0001234"
                maxLength={11}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              UPI ID (Optional Alternative Payout)
            </label>
            <div className="relative">
              <QrCode className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="text"
                value={bankData.bankUpiId}
                onChange={(e) => setBankData({ ...bankData, bankUpiId: e.target.value.toLowerCase().trim() })}
                placeholder="e.g. businessname@okaxis / 9845012345@upi"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={bankLoading}
              className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {bankLoading ? "Saving Bank Details..." : "Save Bank & Payout Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Shop Profile Form */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
        <h2 className="text-base sm:text-lg font-black text-[#052a51] flex items-center gap-2">
          <Store size={20} className="text-emerald-600" />
          Shop Contact & Business Info
        </h2>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Business / Shop Display Name *
          </label>
          <div className="relative">
            <Store className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Contact Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Contact Phone *
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                required
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Physical Shop / Warehouse Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              placeholder="e.g. Shop #14, Begur Main Road, Bangalore 560068"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            About Your Shop
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={profileLoading}
            className="px-8 py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 active:scale-95 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {profileLoading ? "Saving Profile..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
