"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerVendor } from "@/lib/actions/vendor";
import { useVendorAuth } from "@/lib/vendor-auth";
import { Store, ArrowRight, CheckCircle2, ShieldCheck, FileText, Phone, Mail, MapPin, Building } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Tiles & Natural Stone",
  "Electricals & Lighting",
  "Plumbing, Pipes & Fittings",
  "Sanitaryware & Bath Fittings",
  "Hardware & Fasteners",
  "Paints, Waterproofing & Adhesives",
  "Plywood, Laminates & Timber",
  "Doors, Windows & Glass",
  "Tools & Construction Equipment",
];

export default function VendorSignupPage() {
  const router = useRouter();
  const { setVendor } = useVendorAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    contactEmail: "",
    contactPhone: "",
    category: CATEGORIES[0],
    businessAddress: "",
    gstNumber: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName || !formData.contactPhone || !formData.contactEmail) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    const res = await registerVendor(formData);
    setLoading(false);

    if (res.success && res.vendor) {
      setSubmitted(true);
      setVendor({
        id: res.vendor.id,
        businessName: res.vendor.businessName,
        slug: res.vendor.slug,
        contactEmail: res.vendor.contactEmail,
        contactPhone: res.vendor.contactPhone,
        category: res.vendor.category || "General",
        status: "pending",
        commissionRate: res.vendor.commissionRate,
        ownerName: formData.ownerName || formData.businessName,
        ownerId: res.vendor.ownerId,
        lastLogin: new Date().toISOString(),
      });
      toast.success("Application submitted successfully!");
    } else {
      toast.error(res.error || "Failed to submit vendor application");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#031d38] via-[#052a51] to-[#0b3b6f] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-gray-900">Application Submitted!</h2>
          <p className="text-sm text-gray-600 mt-2">
            Thank you for applying to sell on Intrihub. Your shop application for{" "}
            <strong className="text-gray-900">{formData.businessName}</strong> has been received and is currently in the Super Admin review queue.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              ⏳ What happens next?
            </p>
            <p>1. Our platform administrator will review your shop details.</p>
            <p>2. Once approved, your products will immediately go live on the storefront.</p>
            <p>3. In the meantime, you can access your vendor panel to start preparing your catalog.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/vendor"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              Go to Vendor Dashboard <ArrowRight size={16} />
            </Link>
            <Link
              href="/vendor/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm transition-colors"
            >
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#031d38] via-[#052a51] to-[#0b3b6f] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-lg mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/intri-web-logo.png"
              alt="Intrihub"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-600 rounded text-white">
              Vendor Onboarding
            </span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Sell with Intrihub Marketplace
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Grow your building materials shop with thousands of active buyers
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Shop / Business Name *
                </label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    placeholder="e.g. Apex Hardware & Electricals"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Owner / Contact Person *
                </label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Contact Phone (10 Digits) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="e.g. 9845012345"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                    required
                  />
                </div>
              </div>

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
                    placeholder="e.g. apex.hardware@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Primary Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  GSTIN Number (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                    placeholder="e.g. 29AAAAA0000A1Z5"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 uppercase placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
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
                  placeholder="e.g. Shop #14, BTM Layout 2nd Stage, Bangalore 560076"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                About Your Business & Brands Carried
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Tell us about the brands you stock, your typical order turnaround time, etc."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base disabled:opacity-50"
            >
              {loading ? "Submitting Application..." : "Submit Seller Application"}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            Already registered as a seller?{" "}
            <Link
              href="/vendor/login"
              className="text-emerald-600 font-bold hover:underline"
            >
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
