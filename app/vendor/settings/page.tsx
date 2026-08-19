"use client";

import { useState, useEffect } from "react";
import { useVendorAuth } from "@/lib/vendor-auth";
import { getVendorProfile, updateVendorProfile } from "@/lib/actions/vendor";
import { Store, Phone, Mail, MapPin, Building, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function VendorSettingsPage() {
  const { vendor, setVendor } = useVendorAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    businessAddress: "",
    description: "",
  });

  useEffect(() => {
    if (vendor?.id) {
      getVendorProfile(vendor.id).then((v) => {
        if (v) {
          setFormData({
            businessName: v.businessName || "",
            contactEmail: v.contactEmail || "",
            contactPhone: v.contactPhone || "",
            businessAddress: v.businessAddress || "",
            description: v.description || "",
          });
        } else if (vendor) {
          setFormData({
            businessName: vendor.businessName || "",
            contactEmail: vendor.contactEmail || "",
            contactPhone: vendor.contactPhone || "",
            businessAddress: "",
            description: "",
          });
        }
      });
    }
  }, [vendor?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    setLoading(true);
    const res = await updateVendorProfile(vendor.id, formData);
    setLoading(false);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
          Shop Profile & Settings
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your business information and seller contact details
        </p>
      </div>

      {/* Seller Account Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs flex items-center justify-between">
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

        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
          <ShieldCheck size={14} /> {vendor?.status?.toUpperCase()}
        </span>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-xs space-y-5">
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
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
          >
            {loading ? "Saving Changes..." : "Save Profile Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
