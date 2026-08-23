"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  ArrowLeft,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  ChevronRight,
  Loader2,
  ExternalLink,
  ShieldCheck,
  User,
  Landmark,
  Building,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  Truck,
  PackageCheck,
  Sliders,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getVendorDetailAnalytics,
  approveVendor,
  suspendVendor,
  reactivateVendor,
  updateVendorCommission,
  deleteVendor,
  verifyVendorKyc,
} from "@/lib/actions/admin-vendor";
import { toggleVendorAutoPublish } from "@/lib/actions/vendor";
import { formatPrice } from "@/lib/formatters";

export default function VendorDetailDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "products" | "trends">("overview");

  // Actions & Commission
  const [commissionInput, setCommissionInput] = useState<number>(15.0);
  const [actionLoading, setActionLoading] = useState(false);
  const [autoPublishLoading, setAutoPublishLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // KYC Inspection & Modal Preview
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [kycNoteInput, setKycNoteInput] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  // Delete vendor dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = async () => {
    if (!vendorId) return;
    try {
      setLoading(true);
      const result = await getVendorDetailAnalytics(vendorId);
      setData(result);
      if (result?.vendor?.commissionRate) {
        setCommissionInput(result.vendor.commissionRate);
      }
    } catch (e) {
      console.error("Error loading vendor analytics:", e);
      toast.error("Failed to load vendor details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [vendorId]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Copied ${fieldName} to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleToggleAutoPublish = async (enabled: boolean) => {
    try {
      setAutoPublishLoading(true);
      // Immediate optimistic update
      setData((prev: any) =>
        prev && prev.vendor
          ? {
              ...prev,
              vendor: { ...prev.vendor, autoPublishEnabled: enabled },
            }
          : prev
      );

      const res = await toggleVendorAutoPublish(vendorId, enabled);
      setAutoPublishLoading(false);
      if (res.success) {
        toast.success(
          enabled
            ? `⚡ Auto-Publish ENABLED for "${data?.vendor?.businessName}". New products will go live instantly.`
            : `🔒 Auto-Publish DISABLED for "${data?.vendor?.businessName}". Products require admin review.`
        );
        loadData();
      } else {
        toast.error(res.error || "Failed to update auto-publish setting");
        loadData();
      }
    } catch (e: any) {
      setAutoPublishLoading(false);
      toast.error(e.message || "Failed to update auto-publish setting");
      loadData();
    }
  };

  const handleUpdateCommission = async () => {
    if (commissionInput < 0 || commissionInput > 100) {
      toast.error("Commission rate must be between 0% and 100%");
      return;
    }
    setActionLoading(true);
    const res = await updateVendorCommission(vendorId, commissionInput);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to update commission");
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    const res = await approveVendor(vendorId, commissionInput);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to approve vendor");
    }
  };

  const handleSuspend = async () => {
    const reason = prompt("Enter reason for suspending this vendor account:");
    if (!reason) return;
    setActionLoading(true);
    const res = await suspendVendor(vendorId, reason);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to suspend vendor");
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    const res = await reactivateVendor(vendorId);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to reactivate vendor");
    }
  };

  const handleDeleteVendor = async () => {
    setDeleteLoading(true);
    const res = await deleteVendor(vendorId);
    setDeleteLoading(false);
    if (res.success) {
      toast.success(res.message);
      router.push("/admin/vendors");
    } else {
      toast.error(res.error || "Failed to delete vendor");
    }
  };

  const handleKycStatusChange = async (status: "verified" | "rejected" | "pending") => {
    setKycLoading(true);
    const res = await verifyVendorKyc(vendorId, {
      kycStatus: status,
      kycNotes: kycNoteInput,
    });
    setKycLoading(false);
    if (res.success) {
      toast.success(res.message);
      loadData();
    } else {
      toast.error(res.error || "Failed to update KYC status");
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#F26522] mx-auto" />
        <p className="text-xs text-gray-500 font-medium">Loading vendor details & analytics...</p>
      </div>
    );
  }

  if (!data || !data.vendor) {
    return (
      <div className="py-20 text-center space-y-3">
        <Store className="w-12 h-12 text-gray-300 mx-auto" />
        <h3 className="text-base font-bold text-gray-800">Vendor Not Found</h3>
        <Link
          href="/admin/vendors"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#052a51] text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft size={14} /> Back to Vendors
        </Link>
      </div>
    );
  }

  const { vendor, stats, productStats, orderStats, dayWiseTrends, products, splits, payouts } = data;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/vendors"
            className="p-2.5 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 text-gray-600 transition-colors shadow-2xs"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-[#052a51]">
                {vendor.businessName}
              </h1>
              {vendor.status === "approved" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck size={12} /> Active Vendor
                </span>
              )}
              {vendor.status === "pending" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Pending Review
                </span>
              )}
              {vendor.status === "suspended" && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-300">
                  Suspended
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-0.5">
              Category: <strong className="text-gray-700">{vendor.category || "General"}</strong> • Phone:{" "}
              <strong className="text-gray-700">{vendor.contactPhone}</strong> • Email:{" "}
              <span className="text-gray-700">{vendor.contactEmail}</span>
            </p>
          </div>
        </div>

        {/* Quick Contact & Status Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`https://wa.me/91${vendor.contactPhone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
          >
            <Phone size={13} /> WhatsApp
          </a>

          {vendor.status === "pending" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleApprove}
              className="px-4 py-2 bg-[#052a51] hover:bg-[#073b70] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              Approve Vendor
            </button>
          )}

          {vendor.status === "approved" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleSuspend}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Suspend Account
            </button>
          )}

          {vendor.status === "suspended" && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleReactivate}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              Reactivate Account
            </button>
          )}

          <button
            type="button"
            disabled={actionLoading}
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
            title="Delete Vendor Account"
          >
            <Trash2 size={13} /> Delete Vendor
          </button>
        </div>
      </div>

      {/* ── Super Admin Vendor Governance & Auto-Publish Card ── */}
      <div className="bg-gradient-to-br from-white via-[#052a51]/5 to-orange-50/40 rounded-3xl p-6 sm:p-7 border border-[#052a51]/15 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#052a51]/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck size={20} className="text-[#F26522]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-[#052a51]">
                  Vendor Publishing Privileges & Platform Governance
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#052a51] text-white">
                  Super Admin Only
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Control catalog approval bypass, platform fee commissions, and marketplace trust levels.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Auto-Publish Toggle Switch */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-[#052a51] tracking-wider">
                    Instant Auto-Publish
                  </span>
                  {vendor.autoPublishEnabled ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Active / Bypass ON
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                      Standard Review Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Skip approval queue — when enabled, this trusted vendor's new and edited products go live immediately on the storefront.
                </p>
              </div>

              {/* Custom Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(vendor.autoPublishEnabled)}
                disabled={autoPublishLoading}
                onClick={() => handleToggleAutoPublish(!vendor.autoPublishEnabled)}
                className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                  vendor.autoPublishEnabled ? "bg-emerald-600 shadow-sm" : "bg-gray-300"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    vendor.autoPublishEnabled ? "translate-x-7" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Policy: Immediate Database Evaluation</span>
              {autoPublishLoading && (
                <span className="flex items-center gap-1 text-[#F26522] font-bold">
                  <Loader2 size={12} className="animate-spin" /> Updating policy...
                </span>
              )}
            </div>
          </div>

          {/* 2. Commission Rate & Fee Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-xs font-black uppercase text-[#052a51] tracking-wider block">
                Platform Commission Fee (%)
              </span>
              <p className="text-xs text-gray-600 mt-1">
                Platform transaction fee automatically deducted from this vendor's order payout splits.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <div className="relative flex-1">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={commissionInput}
                  onChange={(e) => setCommissionInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                  %
                </span>
              </div>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleUpdateCommission}
                className="px-4 py-2 bg-[#052a51] hover:bg-[#073b70] text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-xs"
              >
                Save Rate
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Part B: Bank / Payout Details Card (Dedicated Super Admin Review Box) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center font-bold">
              <Landmark size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-[#052a51]">
                Vendor Bank / Payout Details
              </h2>
              <p className="text-xs text-gray-500">
                Full unmasked banking information entered by vendor for manual/automated payout processing
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto ${
              vendor.bankAccountNumber
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {vendor.bankAccountNumber ? "Bank Account Added" : "No Bank Details Added Yet"}
          </span>
        </div>

        {vendor.bankAccountNumber ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80">
            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Account Holder</p>
              <p className="font-bold text-gray-900 mt-0.5 text-xs">{vendor.bankAccountHolder || "—"}</p>
            </div>

            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Bank Name</p>
              <p className="font-bold text-gray-900 mt-0.5 text-xs">{vendor.bankName || "—"}</p>
            </div>

            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">Full Account Number</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-gray-900 text-xs tracking-wider">
                  {vendor.bankAccountNumber}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(vendor.bankAccountNumber, "Account Number")}
                  className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedField === "Account Number" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div>
              <p className="text-gray-400 font-bold uppercase text-[10px]">IFSC Code / UPI ID</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono font-bold text-[#052a51] text-xs">
                  {vendor.bankIfscCode || vendor.bankUpiId || "—"}
                </span>
                {vendor.bankIfscCode && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(vendor.bankIfscCode, "IFSC Code")}
                    className="p-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
                    title="Copy IFSC"
                  >
                    {copiedField === "IFSC Code" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              This vendor has not submitted their bank details yet. Remind them to fill their bank account details under <strong>/vendor/settings</strong> before initiating payouts.
            </span>
          </div>
        )}
      </div>

      {/* Part B2: Legal KYC Documents & Storefront Inspection Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200/80 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#052a51]">
                  Legal KYC Documents & Shopfront Verification
                </h2>
                {vendor.kycStatus === "verified" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <ShieldCheck size={12} /> KYC Verified
                  </span>
                ) : vendor.kycStatus === "submitted" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                    <Clock size={12} /> Submitted for Review
                  </span>
                ) : vendor.kycStatus === "rejected" ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                    <XCircle size={12} /> Rejected / Needs Re-upload
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle size={12} /> Incomplete
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Inspect government IDs (Aadhaar & PAN), shopfront photos, and GST filings to approve or reject vendor KYC.
              </p>
            </div>
          </div>
        </div>

        {/* KYC Document Thumbnails Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. PAN Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">PAN Card</p>
              <p className="text-xs font-mono font-bold text-gray-900 mt-1">
                {vendor.panNumber || "Number Not Provided"}
              </p>
            </div>
            {vendor.panDocUrl ? (
              <button
                type="button"
                onClick={() => setPreviewDoc({ url: vendor.panDocUrl, title: `PAN Card - ${vendor.businessName}` })}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink size={13} /> View PAN Document
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 italic">No document uploaded</span>
            )}
          </div>

          {/* 2. Aadhaar Card */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Aadhaar Card</p>
              <p className="text-xs font-mono font-bold text-gray-900 mt-1">
                {vendor.aadharNumber || "Number Not Provided"}
              </p>
            </div>
            {vendor.aadharDocUrl ? (
              <button
                type="button"
                onClick={() => setPreviewDoc({ url: vendor.aadharDocUrl, title: `Aadhaar Card - ${vendor.businessName}` })}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink size={13} /> View Aadhaar Document
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 italic">No document uploaded</span>
            )}
          </div>

          {/* 3. Shopfront / Store Photo */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">Storefront Photo</p>
              <p className="text-xs font-bold text-gray-900 mt-1 truncate">
                {vendor.businessAddress || "Physical Store Location"}
              </p>
            </div>
            {vendor.shopPhotoUrl ? (
              <button
                type="button"
                onClick={() => setPreviewDoc({ url: vendor.shopPhotoUrl, title: `Storefront Photo - ${vendor.businessName}` })}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink size={13} /> View Shop Photo
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 italic">No photo uploaded</span>
            )}
          </div>

          {/* 4. GST / Cheque */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-3">
            <div>
              <p className="text-[10px] font-black uppercase text-gray-400">GST / Bank Proof</p>
              <p className="text-xs font-mono font-bold text-gray-900 mt-1 truncate">
                {vendor.gstNumber || "GST Unregistered"}
              </p>
            </div>
            {vendor.gstDocUrl || vendor.chequeDocUrl ? (
              <button
                type="button"
                onClick={() => setPreviewDoc({ url: vendor.gstDocUrl || vendor.chequeDocUrl, title: `GST / Cheque Proof - ${vendor.businessName}` })}
                className="w-full py-2 px-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-emerald-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ExternalLink size={13} /> View Business Proof
              </button>
            ) : (
              <span className="text-[11px] text-gray-400 italic">No proof uploaded</span>
            )}
          </div>
        </div>

        {/* KYC Admin Actions & Feedback */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-600 mb-1">
              Admin Notes / Rejection Reason
            </label>
            <input
              type="text"
              placeholder="e.g. Aadhaar photo is blurry, please re-upload front and back scan."
              value={kycNoteInput}
              onChange={(e) => setKycNoteInput(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
            <button
              type="button"
              disabled={kycLoading}
              onClick={() => handleKycStatusChange("verified")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {kycLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={13} />}
              <span>Approve KYC</span>
            </button>

            <button
              type="button"
              disabled={kycLoading}
              onClick={() => handleKycStatusChange("rejected")}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {kycLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
              <span>Reject KYC</span>
            </button>
          </div>
        </div>
      </div>

      {/* Part C: Consolidated Product & Order At-a-Glance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4.1 Product Stats Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-blue-600" /> Product Catalog Stats
            </h3>
            <span className="text-xs font-bold text-gray-500">
              Total Uploaded: <strong className="text-gray-900">{productStats.total}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800">Live & Active</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{productStats.live}</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-[11px] font-bold text-amber-800">Under Review</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{productStats.underReview}</p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <span className="text-[11px] font-bold text-rose-800">Rejected</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{productStats.rejected}</p>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <span className="text-[11px] font-bold text-gray-700">Paused</span>
              <p className="text-xl font-black text-gray-800 mt-0.5">{productStats.paused}</p>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-300 text-center sm:col-span-2">
              <span className="text-[11px] font-bold text-amber-900 flex items-center justify-center gap-1">
                <AlertTriangle size={12} className="text-amber-600" /> Low Stock Alert (&lt;15 boxes)
              </span>
              <p className="text-xl font-black text-amber-800 mt-0.5">{productStats.lowStockCount}</p>
            </div>
          </div>
        </div>

        {/* 4.2 Order Stats Card */}
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#052a51] tracking-wider flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#F26522]" /> Order Fulfillment Stats
            </h3>
            <span className="text-xs font-bold text-gray-500">
              Total Orders: <strong className="text-gray-900">{orderStats.total}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-center">
              <span className="text-[11px] font-bold text-blue-800">New / Processing</span>
              <p className="text-xl font-black text-blue-700 mt-0.5">{orderStats.processing}</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
              <span className="text-[11px] font-bold text-amber-800">Dispatched</span>
              <p className="text-xl font-black text-amber-700 mt-0.5">{orderStats.dispatched}</p>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
              <span className="text-[11px] font-bold text-emerald-800">Delivered</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{orderStats.delivered}</p>
            </div>

            <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-center">
              <span className="text-[11px] font-bold text-rose-800">Cancelled / Ret</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{orderStats.cancelled}</p>
            </div>

            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-center sm:col-span-2">
              <span className="text-[11px] font-bold text-emerald-900">Net Vendor Earnings</span>
              <p className="text-xl font-black text-emerald-700 mt-0.5">{formatPrice(stats.totalVendorEarnings)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Commission Rate Control Box */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-bold">
            <Sliders size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Platform Commission Rate
            </h4>
            <p className="text-[11px] text-gray-500">
              Current commission rate deducted on sales from this specific vendor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-28">
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={commissionInput}
              onChange={(e) => setCommissionInput(parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 text-right pr-6 focus:bg-white focus:outline-hidden"
            />
            <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400">%</span>
          </div>

          <button
            type="button"
            disabled={actionLoading || commissionInput === vendor.commissionRate}
            onClick={handleUpdateCommission}
            className="px-4 py-2 bg-[#052a51] hover:bg-[#073b70] text-white rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            Update Rate
          </button>
        </div>
      </div>

      {/* Tabs: Scoped Orders Table, Catalog & Trends */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3 overflow-x-auto">
          {[
            { key: "orders", label: `Orders (${splits.length})` },
            { key: "products", label: `Catalog (${products.length})` },
            { key: "trends", label: "Day-Wise Revenue Trends" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? "bg-[#052a51] text-white shadow-2xs"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Scoped Orders Table (PRD Section 4.2 & Section 2) */}
        {activeTab === "orders" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Customer Orders Containing {vendor.businessName}&apos;s Items
            </h4>

            {splits.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                No orders fulfilled by this vendor yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Order ID</th>
                      <th className="py-2.5 px-3">Customer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Item Subtotal</th>
                      <th className="py-2.5 px-3">Commission</th>
                      <th className="py-2.5 px-3">Vendor Share</th>
                      <th className="py-2.5 px-3 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {splits.map((s: any) => (
                      <tr key={s.id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-mono font-bold text-[#052a51]">
                          <Link href={`/admin/orders/${s.orderId}`} className="hover:underline flex items-center gap-1">
                            #{s.orderId} <ExternalLink size={11} className="text-gray-400" />
                          </Link>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900">{s.customerName}</p>
                          <p className="text-[11px] text-gray-500">{s.customerCity} • {s.customerPhone}</p>
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {new Date(s.orderDate || s.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">{formatPrice(s.subtotal)}</td>
                        <td className="py-3 px-3 font-bold text-[#F26522]">
                          {formatPrice(s.commissionAmount)} ({s.commissionRate}%)
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-700">
                          {formatPrice(s.vendorPayoutAmount)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.fulfillmentStatus === "Delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : s.fulfillmentStatus === "Dispatched"
                                ? "bg-amber-100 text-amber-800"
                                : s.fulfillmentStatus === "Cancelled"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {s.fulfillmentStatus || "Processing"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Catalog Products */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                <Layers size={32} className="mx-auto text-gray-300 mb-2" />
                No products uploaded by this vendor yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {products.map((p: any) => (
                  <div key={p.id} className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-700">
                          {p.categoryName}
                        </span>
                        {p.approvalStatus === "approved" && p.status === "active" && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Live
                          </span>
                        )}
                        {p.approvalStatus === "pending" && (
                          <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Under Review
                          </span>
                        )}
                        {p.approvalStatus === "rejected" && (
                          <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            Rejected
                          </span>
                        )}
                      </div>
                      <h5 className="font-bold text-xs text-gray-900 line-clamp-2">{p.name}</h5>
                      <p className="text-xs text-[#052a51] font-black mt-1">₹{p.pricePerSqft} / {p.unitOfSale || "box"}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-gray-500">{p.variants?.length || 0} variants</span>
                      <Link
                        href={`/product/${p.slug}`}
                        target="_blank"
                        className="text-[#052a51] font-bold hover:underline flex items-center gap-0.5"
                      >
                        <span>View</span> <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Day-Wise Breakdown */}
        {activeTab === "trends" && (
          <div className="space-y-3">
            {dayWiseTrends.length === 0 ? (
              <p className="text-xs text-gray-400 py-8 text-center">No order history recorded for this vendor yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Orders</th>
                      <th className="py-2.5 px-3">Gross Sales</th>
                      <th className="py-2.5 px-3">Platform Commission</th>
                      <th className="py-2.5 px-3 text-right">Vendor Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {dayWiseTrends.map((d: any) => (
                      <tr key={d.date} className="hover:bg-gray-50/70">
                        <td className="py-3 px-3 font-semibold text-gray-800">{d.date}</td>
                        <td className="py-3 px-3 font-bold text-[#052a51]">{d.orders} orders</td>
                        <td className="py-3 px-3 font-bold text-gray-900">{formatPrice(d.revenue)}</td>
                        <td className="py-3 px-3 font-bold text-[#F26522]">{formatPrice(d.commission)}</td>
                        <td className="py-3 px-3 font-bold text-emerald-700 text-right">{formatPrice(d.vendorPayout)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── DELETE VENDOR CONFIRMATION MODAL ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#052a51]">Delete Vendor Account</h3>
                <p className="text-xs text-gray-500">Permanent destructive action</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs space-y-2 text-gray-700">
              <p>
                Are you sure you want to permanently delete <strong>{vendor.businessName}</strong>?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                <li>Vendor profile and payout settings will be permanently removed.</li>
                <li>Linked login credentials (+91 {vendor.contactPhone}) will be deleted.</li>
                <li>All {products.length} product listings and associated variants will be deleted from the marketplace.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteVendor}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5 transition-all"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Yes, Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Document Lightbox Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white max-w-3xl w-full rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-4 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                <FileText className="text-emerald-600" size={18} />
                <span>{previewDoc.title}</span>
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink size={12} /> Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-2xl bg-gray-50 border border-gray-200 p-2 flex items-center justify-center min-h-[300px]">
              {previewDoc.url.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.url}
                  className="w-full h-[500px] rounded-xl"
                  title="PDF Preview"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[500px] w-auto object-contain rounded-xl shadow-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
