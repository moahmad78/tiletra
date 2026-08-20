"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Building,
  Eye,
  ExternalLink,
  Copy,
  Check,
  MessageCircle,
  Percent,
  Lock,
  PlusCircle,
  Loader2,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import {
  getVendorApplications,
  createVendorFromApplication,
  updateVendorApplication,
} from "@/lib/actions/vendor-application";

export default function AdminVendorApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Document Viewer Modal State
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null);

  // Conversion / Create Account Modal State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(15.0);
  const [customPassword, setCustomPassword] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Success Credentials Dialog
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    phone: string;
    password: string;
    businessName: string;
    commissionRate: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Rejection Modal State
  const [rejectingApp, setRejectingApp] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await getVendorApplications({
        status: statusFilter,
        search: searchQuery,
      });
      setApplications(data);
    } catch (e) {
      console.error("Error loading applications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadApplications();
  };

  const handleConvertAccount = async () => {
    if (!selectedApp) return;

    setActionLoading(true);
    const res = await createVendorFromApplication(selectedApp.id, {
      customPassword: customPassword.trim() || undefined,
      commissionRate,
      gstNumber: gstNumber.trim() || undefined,
    });
    setActionLoading(false);

    if (res.success && res.credentials) {
      toast.success(res.message);
      setGeneratedCredentials(res.credentials);
      setSelectedApp(null);
      loadApplications();
    } else {
      toast.error(res.error || "Failed to create vendor account");
    }
  };

  const handleMarkContacted = async (appId: string) => {
    const res = await updateVendorApplication(appId, { status: "contacted" });
    if (res.success) {
      toast.success("Application marked as contacted");
      loadApplications();
    } else {
      toast.error(res.error || "Failed to update status");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectingApp) return;

    setActionLoading(true);
    const res = await updateVendorApplication(rejectingApp.id, {
      status: "rejected",
      rejectionReason: rejectionReason.trim(),
      internalNotes: internalNotes.trim(),
    });
    setActionLoading(false);

    if (res.success) {
      toast.success("Application marked as rejected");
      setRejectingApp(null);
      setRejectionReason("");
      setInternalNotes("");
      loadApplications();
    } else {
      toast.error(res.error || "Failed to reject application");
    }
  };

  const handleCopyCredentials = () => {
    if (!generatedCredentials) return;
    const text = `*Intrihub Vendor Login Credentials*\nShop: ${generatedCredentials.businessName}\nPortal: https://intrihub.com/vendor/login\nUsername: ${generatedCredentials.username}\nPhone: ${generatedCredentials.phone}\nPassword: ${generatedCredentials.password}\nCommission: ${generatedCredentials.commissionRate}%`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Credentials copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#052a51] tracking-tight">Vendor Inquiries & Applications</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#052a51] text-xs font-black">
              {applications.length}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Review public applications (Path A), inspect Aadhar/PAN/Shop photos, and create vendor credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/vendors"
            className="px-4 py-2 bg-white hover:bg-gray-50 text-[#052a51] text-xs font-bold rounded-xl border border-gray-200 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Building size={14} /> Active Vendors
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { key: "all", label: "All Inquiries" },
            { key: "new_inquiry", label: "🟡 New Inquiry" },
            { key: "contacted", label: "🔵 Contacted" },
            { key: "converted", label: "🟢 Converted" },
            { key: "rejected", label: "🔴 Rejected" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.key
                  ? "bg-[#052a51] text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search by shop, owner, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#052a51] outline-none"
          />
        </form>
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#F26522] mx-auto mb-2" />
          <p className="text-xs text-gray-500 font-medium">Loading vendor applications...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No applications found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {statusFilter !== "all"
              ? `No inquiries matching the "${statusFilter}" status filter.`
              : "No vendor self-applications submitted yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl p-5 border border-gray-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              {/* Left Details */}
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-black text-[#052a51]">{app.businessName}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                    {app.category}
                  </span>

                  {/* Status Badge */}
                  {app.status === "new_inquiry" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <Clock size={12} /> New Inquiry
                    </span>
                  )}
                  {app.status === "contacted" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                      <Phone size={12} /> Contacted
                    </span>
                  )}
                  {app.status === "converted" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Converted (Live Vendor)
                    </span>
                  )}
                  {app.status === "rejected" && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-900 border border-red-300 flex items-center gap-1">
                      <XCircle size={12} /> Rejected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-400">Owner:</span>
                    <strong className="text-gray-800">{app.ownerName}</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={13} className="text-gray-400" />
                    <a href={`tel:${app.phone}`} className="text-[#052a51] hover:underline font-bold">
                      +91 {app.phone}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-gray-400" />
                    <a href={`mailto:${app.email}`} className="text-gray-700 hover:underline truncate">
                      {app.email}
                    </a>
                  </div>
                </div>

                {app.address && (
                  <p className="text-xs text-gray-500 flex items-start gap-1">
                    <MapPin size={13} className="text-gray-400 shrink-0 mt-0.5" />
                    <span>{app.address}</span>
                  </p>
                )}

                {app.description && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-normal italic">
                    &ldquo;{app.description}&rdquo;
                  </p>
                )}

                {/* Documents Preview Row */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Documents:</span>
                  {app.aadharDocUrl ? (
                    <button
                      onClick={() => setPreviewDoc({ title: `${app.businessName} - Aadhar Card`, url: app.aadharDocUrl })}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-[#052a51] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Aadhar Card
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No Aadhar</span>
                  )}

                  {app.panDocUrl ? (
                    <button
                      onClick={() => setPreviewDoc({ title: `${app.businessName} - PAN Card`, url: app.panDocUrl })}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-[#052a51] rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> PAN Card
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No PAN</span>
                  )}

                  {app.shopPhotoUrl ? (
                    <button
                      onClick={() => setPreviewDoc({ title: `${app.businessName} - Shop Photo`, url: app.shopPhotoUrl })}
                      className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye size={12} /> Shop Photo
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No Shop Photo</span>
                  )}
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                {/* External WhatsApp Contact */}
                <a
                  href={`https://wa.me/91${app.phone}?text=Hello%20${encodeURIComponent(app.ownerName)},%20we%20reviewed%20your%20vendor%20application%20for%20${encodeURIComponent(app.businessName)}%20on%20Intrihub.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all"
                >
                  <MessageCircle size={14} /> WhatsApp
                </a>

                {app.status === "new_inquiry" && (
                  <button
                    onClick={() => handleMarkContacted(app.id)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Mark Contacted
                  </button>
                )}

                {app.status !== "converted" && (
                  <button
                    onClick={() => {
                      setSelectedApp(app);
                      setCommissionRate(15.0);
                      setCustomPassword("");
                      setGstNumber("");
                    }}
                    className="px-4 py-2 bg-[#052a51] hover:bg-[#0a3e74] text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <PlusCircle size={14} className="text-[#F26522]" /> Create Vendor Account
                  </button>
                )}

                {app.status === "converted" && app.vendorId && (
                  <Link
                    href={`/admin/vendors/${app.vendorId}`}
                    className="px-4 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 transition-all"
                  >
                    <span>View Vendor Dashboard</span> <ChevronRight size={14} />
                  </Link>
                )}

                {app.status !== "rejected" && app.status !== "converted" && (
                  <button
                    onClick={() => setRejectingApp(app)}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-bold transition-all"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE VENDOR ACCOUNT MODAL ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#052a51] flex items-center justify-center font-bold">
                <Building size={20} className="text-[#F26522]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#052a51]">Create Vendor Account</h3>
                <p className="text-xs text-gray-500">Converts application into a live seller with credentials</p>
              </div>
            </div>

            <div className="space-y-4 py-2">
              <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
                <p>
                  <strong className="text-gray-800">Shop:</strong> {selectedApp.businessName}
                </p>
                <p>
                  <strong className="text-gray-800">Owner:</strong> {selectedApp.ownerName}
                </p>
                <p>
                  <strong className="text-gray-800">Contact:</strong> {selectedApp.email} | +91 {selectedApp.phone}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Platform Commission Rate (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 text-gray-400" size={15} />
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Platform fee deducted per vendor order split</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password (Leave empty to auto-generate)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={15} />
                  <input
                    type="text"
                    placeholder="Auto-generated e.g. Intri#8492"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">Vendor will be prompted to change password on first login</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  GST Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertAccount}
                disabled={actionLoading}
                className="px-6 py-2.5 bg-[#052a51] hover:bg-[#0a3e74] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-[#F26522]" />}
                <span>Generate Account & Credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── GENERATED CREDENTIALS MODAL ── */}
      {generatedCredentials && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>

            <h3 className="text-xl font-black text-[#052a51]">Vendor Account Created!</h3>
            <p className="text-xs text-gray-500 mt-1">
              Share these credentials with <strong>{generatedCredentials.businessName}</strong> via WhatsApp or Email.
            </p>

            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Portal URL:</span>
                <strong className="text-[#052a51] font-mono">intrihub.com/vendor/login</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Username / Email:</span>
                <strong className="text-gray-900 font-mono">{generatedCredentials.username}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Registered Phone:</span>
                <strong className="text-gray-900 font-mono">+91 {generatedCredentials.phone}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Initial Password:</span>
                <strong className="text-[#F26522] font-mono text-sm">{generatedCredentials.password}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-semibold">Commission Rate:</span>
                <strong className="text-emerald-700">{generatedCredentials.commissionRate}%</strong>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 py-3 bg-[#052a51] hover:bg-[#0a3e74] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                <span>{copied ? "Copied to Clipboard!" : "Copy Full Details"}</span>
              </button>
              <a
                href={`https://wa.me/91${generatedCredentials.phone}?text=${encodeURIComponent(
                  `*Welcome to Intrihub Marketplace!*\n\nYour vendor account for *${generatedCredentials.businessName}* has been approved and created.\n\n🔗 *Login Portal:* https://intrihub.com/vendor/login\n👤 *Username:* ${generatedCredentials.username}\n🔑 *Initial Password:* ${generatedCredentials.password}\n📊 *Commission Rate:* ${generatedCredentials.commissionRate}%\n\nYou will be prompted to set your own secure password upon first login.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                <MessageCircle size={16} /> Send via WhatsApp
              </a>
            </div>

            <button
              onClick={() => setGeneratedCredentials(null)}
              className="mt-4 text-xs font-bold text-gray-500 hover:text-gray-800"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* ── REJECT APPLICATION MODAL ── */}
      {rejectingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-black text-red-600 mb-2">Reject Vendor Application</h3>
            <p className="text-xs text-gray-600 mb-4">
              Mark inquiry for <strong>{rejectingApp.businessName}</strong> as rejected.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Rejection Reason / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Incomplete documents or shop premise could not be verified."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setRejectingApp(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={actionLoading}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-black text-[#052a51] truncate">{previewDoc.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-500 hover:text-gray-800"
                  title="Open in new tab"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto flex items-center justify-center bg-gray-100">
              {previewDoc.url.endsWith(".pdf") ? (
                <iframe src={previewDoc.url} className="w-full h-[60vh] rounded-xl border border-gray-300" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-md"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
