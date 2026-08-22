"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Store,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Building,
  UploadCloud,
  X,
  FileCheck,
  Sparkles,
  Zap,
  TrendingUp,
  CreditCard,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { submitVendorApplication } from "@/lib/actions/vendor-application";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
  "General Building Supplies",
];

export default function VendorApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    phone: "",
    email: "",
    category: CATEGORIES[0],
    address: "",
    description: "",
    aadharDocUrl: "",
    panDocUrl: "",
    shopPhotoUrl: "",
  });

  const aadharInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);
  const shopPhotoInputRef = useRef<HTMLInputElement>(null);

  // File upload handler
  const handleFileUpload = async (file: File, field: "aadharDocUrl" | "panDocUrl" | "shopPhotoUrl") => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    try {
      setUploadingDoc(field);
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const json = await res.json();
      if (json.url) {
        setFormData((prev) => ({ ...prev, [field]: json.url }));
        toast.success(`${field === "aadharDocUrl" ? "Aadhar" : field === "panDocUrl" ? "PAN" : "Shop Photo"} uploaded!`);
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error(e?.message || "Failed to upload document");
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.businessName.trim() || !formData.ownerName.trim() || !formData.phone.trim() || !formData.email.trim()) {
      toast.error("Please fill all required fields");
      return;
    }

    if (formData.phone.replace(/\D/g, "").length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    const res = await submitVendorApplication(formData);
    setSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } else {
      toast.error(res.error || "Failed to submit application");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F1F3F6]">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4 pt-24 pb-16">
          <div className="w-full max-w-xl bg-white rounded-3xl p-8 sm:p-10 text-center shadow-xl border border-gray-100">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-emerald-50/50">
              <CheckCircle2 size={44} />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100/80 text-emerald-800 text-xs font-bold rounded-full mb-3">
              <Sparkles size={14} /> Inquiry Received
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#052a51] tracking-tight">
              Thanks! Our team will contact you soon.
            </h1>
            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              We received your application for <strong className="text-gray-900">{formData.businessName}</strong>. Our onboarding team is reviewing your details and documents and will reach out via call or WhatsApp on <strong className="text-gray-900">+91 {formData.phone}</strong>.
            </p>

            <div className="mt-8 p-5 bg-blue-50/60 rounded-2xl border border-blue-100/80 text-left space-y-3">
              <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider">What happens next?</h3>
              <div className="flex items-start gap-3 text-xs text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#052a51] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                <span>Verification of business documents & premises by our regional category manager.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#052a51] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                <span>Vendor portal credentials & temporary password sent via SMS & Email.</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#052a51] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                <span>Upload inventory products, set custom pricing, and start fulfilling orders!</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-[#052a51] hover:bg-[#083a70] text-white text-sm font-bold rounded-xl shadow-md transition-all active:scale-95 text-center"
              >
                Back to Homepage
              </Link>
              <Link
                href="/vendor/login"
                className="px-6 py-3 bg-white hover:bg-gray-50 text-[#052a51] text-sm font-bold rounded-xl border border-gray-200 shadow-xs transition-all active:scale-95 text-center"
              >
                Already have credentials? Log In
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F3F6]">
      <Header />

      <main className="flex-1 pt-[76px] sm:pt-[84px] md:pt-[168px] lg:pt-[175px] pb-16 px-4 sm:px-6 lg:px-8 max-w-[1340px] mx-auto w-full">
        {/* ══════════════════════════════════════════════════════════════
            DESKTOP TWO-COLUMN (md:grid-cols-12) / MOBILE STACKED
        ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* ── LEFT COLUMN: Hero & Benefit Cards (Narrower column ~40%) ── */}
          <div className="md:col-span-5 lg:col-span-5 space-y-4 md:sticky md:top-[160px]">
            <div className="bg-gradient-to-br from-[#031d38] via-[#052a51] to-[#0a3e74] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-[#0a3e74]/50 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-blue-200">
                <Zap size={13} className="text-[#F26522]" /> Quick-Commerce Marketplace
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  Grow Your Shop on <span className="text-[#F26522]">Intrihub</span>
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">
                  Join Bangalore&apos;s fastest growing construction & home interior quick-commerce network. List your inventory, get direct customer orders, and enjoy weekly automated payouts.
                </p>
              </div>

              {/* 3 Benefit Cards Stacked Vertically */}
              <div className="space-y-3 pt-2">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                  <div className="flex items-center gap-2.5 mb-1">
                    <TrendingUp className="text-[#F26522]" size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Massive Customer Reach</h4>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Direct orders from homeowners, architects & contractors in your city.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                  <div className="flex items-center gap-2.5 mb-1">
                    <CreditCard className="text-emerald-400" size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Weekly Assured Payouts</h4>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Transparent platform commissions with prompt weekly settlements.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
                  <div className="flex items-center gap-2.5 mb-1">
                    <ShieldCheck className="text-blue-300" size={18} />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">Full Inventory Control</h4>
                  </div>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Real-time stock management, price updates, and instant pause toggles.
                  </p>
                </div>
              </div>

              {/* Already registered quick link */}
              <div className="pt-3 flex items-center justify-between text-xs text-blue-200 border-t border-white/15">
                <span>Already an onboarded partner?</span>
                <Link
                  href="/vendor/login"
                  className="font-bold text-[#F26522] hover:text-white inline-flex items-center gap-1 transition-colors"
                >
                  <span>Vendor Login</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Vendor Application Form (~60%) ── */}
          <div className="md:col-span-7 lg:col-span-7">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-200/90 p-6 sm:p-8 lg:p-9">
              <div className="border-b border-gray-100 pb-4 mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#052a51]">Vendor Application Form</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Please provide your shop details and verification documents. Our team will review and contact you.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Business Info */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-2">
                    <Building size={16} className="text-[#F26522]" /> 1. Business & Owner Details
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Business / Shop Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sri Balaji Hardware & Electricals"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Owner Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Mobile Number (WhatsApp) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-400">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "") })}
                          className="w-full pl-12 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. shop@gmail.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Primary Shop Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Shop / Warehouse Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. #42, BTM 2nd Stage, Outer Ring Road, Bangalore - 560076"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Brief Description of Products / Brands
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Authorized dealer for Havells, Polycab, Finolex wires, switches, MCBs and architectural LED lights."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] focus:ring-2 focus:ring-[#052a51]/20 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-2">
                      <FileText size={16} className="text-[#F26522]" /> 2. Verification Documents & Shop Photo
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium">(Image / PDF &lt; 10MB)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* Aadhar Card Upload */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-center flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-0.5">Aadhar Card</p>
                        <p className="text-[10px] text-gray-500 mb-2.5">Owner ID proof</p>
                      </div>

                      {formData.aadharDocUrl ? (
                        <div className="relative p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 truncate">
                            <FileCheck size={15} className="text-emerald-600 shrink-0" /> Uploaded
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, aadharDocUrl: "" })}
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            ref={aadharInputRef}
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "aadharDocUrl");
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingDoc === "aadharDocUrl"}
                            onClick={() => aadharInputRef.current?.click()}
                            className="w-full py-2 px-2.5 bg-white hover:bg-gray-100 text-[#052a51] text-xs font-bold rounded-xl border border-gray-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            {uploadingDoc === "aadharDocUrl" ? (
                              <Loader2 size={13} className="animate-spin text-[#F26522]" />
                            ) : (
                              <UploadCloud size={13} className="text-[#F26522]" />
                            )}
                            <span>Upload Aadhar</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* PAN Card Upload */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-center flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-0.5">PAN Card</p>
                        <p className="text-[10px] text-gray-500 mb-2.5">Business / Owner PAN</p>
                      </div>

                      {formData.panDocUrl ? (
                        <div className="relative p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 truncate">
                            <FileCheck size={15} className="text-emerald-600 shrink-0" /> Uploaded
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, panDocUrl: "" })}
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            ref={panInputRef}
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "panDocUrl");
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingDoc === "panDocUrl"}
                            onClick={() => panInputRef.current?.click()}
                            className="w-full py-2 px-2.5 bg-white hover:bg-gray-100 text-[#052a51] text-xs font-bold rounded-xl border border-gray-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            {uploadingDoc === "panDocUrl" ? (
                              <Loader2 size={13} className="animate-spin text-[#F26522]" />
                            ) : (
                              <UploadCloud size={13} className="text-[#F26522]" />
                            )}
                            <span>Upload PAN</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Shop Front Photo Upload */}
                    <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-center flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-0.5">Shop Photo</p>
                        <p className="text-[10px] text-gray-500 mb-2.5">Storefront / premises</p>
                      </div>

                      {formData.shopPhotoUrl ? (
                        <div className="relative p-2 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 truncate">
                            <FileCheck size={15} className="text-emerald-600 shrink-0" /> Uploaded
                          </span>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, shopPhotoUrl: "" })}
                            className="p-1 text-gray-400 hover:text-red-500 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <input
                            type="file"
                            ref={shopPhotoInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], "shopPhotoUrl");
                            }}
                          />
                          <button
                            type="button"
                            disabled={uploadingDoc === "shopPhotoUrl"}
                            onClick={() => shopPhotoInputRef.current?.click()}
                            className="w-full py-2 px-2.5 bg-white hover:bg-gray-100 text-[#052a51] text-xs font-bold rounded-xl border border-gray-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                          >
                            {uploadingDoc === "shopPhotoUrl" ? (
                              <Loader2 size={13} className="animate-spin text-[#F26522]" />
                            ) : (
                              <UploadCloud size={13} className="text-[#F26522]" />
                            )}
                            <span>Upload Photo</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bot Honeypot Protection (Invisible to humans) */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
                  <label htmlFor="website_url_hp">Do not fill this field</label>
                  <input
                    type="text"
                    id="website_url_hp"
                    name="website_url_hp"
                    tabIndex={-1}
                    autoComplete="off"
                    value={(formData as any).website_url_hp || ""}
                    onChange={(e) => setFormData({ ...formData, website_url_hp: e.target.value } as any)}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-xs text-gray-500">
                    By applying, you agree to Intrihub&apos;s Partner Terms & Merchant Guidelines.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Submitting...
                      </>
                    ) : (
                      <>
                        <span>Submit Application</span> <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
