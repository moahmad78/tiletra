"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  updateVendorCommission,
} from "@/lib/actions/admin-vendor";
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Percent,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  Eye,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "suspended" | "rejected">("all");

  // Selected vendor modal state
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [commissionInput, setCommissionInput] = useState<number>(15.0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await getAdminVendors();
      setVendors(data);
    } catch (e) {
      console.error("Error loading vendors:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleApprove = async (vendorId: string, rate: number) => {
    setActionLoading(true);
    const res = await approveVendor(vendorId, rate);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      setSelectedVendor(null);
      loadVendors();
    } else {
      toast.error(res.error || "Failed to approve vendor");
    }
  };

  const handleReject = async (vendorId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a reason for rejecting the application");
      return;
    }
    setActionLoading(true);
    const res = await rejectVendor(vendorId, rejectionReason);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      setSelectedVendor(null);
      setRejectionReason("");
      loadVendors();
    } else {
      toast.error(res.error || "Failed to reject vendor");
    }
  };

  const handleSuspend = async (vendorId: string) => {
    if (window.confirm("Are you sure you want to suspend this vendor? All their product listings will be hidden from the public storefront.")) {
      setActionLoading(true);
      const res = await suspendVendor(vendorId);
      setActionLoading(false);
      if (res.success) {
        toast.success(res.message);
        setSelectedVendor(null);
        loadVendors();
      } else {
        toast.error(res.error || "Failed to suspend vendor");
      }
    }
  };

  const handleReactivate = async (vendorId: string) => {
    setActionLoading(true);
    const res = await reactivateVendor(vendorId);
    setActionLoading(false);
    if (res.success) {
      toast.success(res.message);
      setSelectedVendor(null);
      loadVendors();
    } else {
      toast.error(res.error || "Failed to reactivate vendor");
    }
  };

  const handleUpdateCommission = async (vendorId: string, rate: number) => {
    const res = await updateVendorCommission(vendorId, rate);
    if (res.success) {
      toast.success(res.message);
      loadVendors();
    } else {
      toast.error(res.error || "Failed to update commission");
    }
  };

  // Filter vendors
  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.contactPhone.includes(searchQuery) ||
      (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    return true;
  });

  const counts = {
    all: vendors.length,
    pending: vendors.filter((v) => v.status === "pending").length,
    approved: vendors.filter((v) => v.status === "approved").length,
    suspended: vendors.filter((v) => v.status === "suspended").length,
    rejected: vendors.filter((v) => v.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
            Vendor & Shop Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Super Admin control over multi-vendor onboarding, approvals, commissions, and suspensions
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Onboarded
          </p>
          <h3 className="text-2xl font-black text-gray-900 mt-1">{counts.all}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Registered shop accounts</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Pending Review
          </p>
          <h3 className="text-2xl font-black text-amber-600 mt-1">{counts.pending}</h3>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Needs Admin Action</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Active Approved
          </p>
          <h3 className="text-2xl font-black text-emerald-600 mt-1">{counts.approved}</h3>
          <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">Live selling</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-xs">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Suspended
          </p>
          <h3 className="text-2xl font-black text-rose-600 mt-1">{counts.suspended}</h3>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5">Listings auto-hidden</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-3xl p-4 md:p-6 border border-gray-200/80 shadow-xs space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === "all"
                ? "bg-gray-900 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            All Vendors ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === "pending"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Pending Approvals ({counts.pending})
          </button>

          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === "approved"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Approved ({counts.approved})
          </button>

          <button
            onClick={() => setStatusFilter("suspended")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === "suspended"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Suspended ({counts.suspended})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search vendor by shop name, email, phone, or category..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium focus:bg-white focus:border-[#F26522] focus:outline-hidden transition-all"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="animate-spin text-[#F26522]" size={28} />
            <p className="text-xs font-medium">Loading vendor directory...</p>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200">
            <Store size={40} className="mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No vendors found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No vendor matches "${searchQuery}"`
                : "No vendors in this category."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-bold border-y border-gray-200/80">
                <tr>
                  <th className="py-3 px-4">Shop & Business Details</th>
                  <th className="py-3 px-3">Contact & Phone</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Commission %</th>
                  <th className="py-3 px-3">Products</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVendors.map((v) => {
                  const isPending = v.status === "pending";
                  const isApproved = v.status === "approved";
                  const isSuspended = v.status === "suspended";

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Shop Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-800 font-black text-sm flex items-center justify-center shrink-0 border border-gray-200">
                            {v.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <p className="font-bold text-gray-900 truncate">{v.businessName}</p>
                            <p className="text-[10px] text-gray-400 truncate">
                              Owner: {v.owner?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-gray-800">{v.contactPhone}</p>
                        <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{v.contactEmail}</p>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[10px] font-bold">
                          {v.category || "General"}
                        </span>
                      </td>

                      {/* Commission */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900">{v.commissionRate}%</span>
                        </div>
                      </td>

                      {/* Products Count */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-gray-700">
                          {v._count?.products || 0} listings
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-3">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock size={11} /> Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck size={11} /> Approved
                          </span>
                        )}
                        {isSuspended && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertTriangle size={11} /> Suspended
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setCommissionInput(v.commissionRate || 15.0);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-[#052a51] hover:text-white text-gray-700 text-xs font-bold transition-colors"
                          >
                            Inspect & Review
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Review & Inspection Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Vendor Application Details
                </span>
                <h2 className="text-xl font-black text-gray-900 mt-0.5">
                  {selectedVendor.businessName}
                </h2>
                <p className="text-xs text-gray-500">Slug: /{selectedVendor.slug}</p>
              </div>
              <button
                onClick={() => setSelectedVendor(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl">
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Owner Name</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">
                    {selectedVendor.owner?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Category</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">
                    {selectedVendor.category || "General Building Materials"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Phone Number</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5">
                    {selectedVendor.contactPhone}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-semibold uppercase text-[10px]">Email Address</p>
                  <p className="font-bold text-gray-800 text-sm mt-0.5 truncate">
                    {selectedVendor.contactEmail}
                  </p>
                </div>
              </div>

              {selectedVendor.gstNumber && (
                <div className="flex items-center gap-2 text-gray-700">
                  <FileText size={16} className="text-gray-400 shrink-0" />
                  <span>GSTIN: <strong>{selectedVendor.gstNumber}</strong></span>
                </div>
              )}

              {selectedVendor.businessAddress && (
                <div className="flex items-start gap-2 text-gray-700">
                  <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <span>{selectedVendor.businessAddress}</span>
                </div>
              )}

              {selectedVendor.description && (
                <div className="p-3 rounded-xl bg-gray-50 text-gray-600 border border-gray-200">
                  <p className="font-semibold text-gray-800 mb-1">About the Shop:</p>
                  <p>{selectedVendor.description}</p>
                </div>
              )}

              {/* Commission Rate Setting */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Platform Commission Rate (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(Number(e.target.value))}
                    min={0}
                    max={50}
                    step={0.5}
                    className="w-32 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#F26522] focus:outline-hidden"
                  />
                  <span className="text-xs text-gray-500">
                    Platform takes {commissionInput}% on each order item sold by this vendor
                  </span>
                </div>
              </div>

              {/* Rejection Reason input (if pending) */}
              {selectedVendor.status === "pending" && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Rejection Feedback (if declining application)
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Incomplete business address or invalid contact info"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 focus:bg-white focus:border-rose-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedVendor(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                Close
              </button>

              {selectedVendor.status === "pending" && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedVendor.id)}
                    className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-colors"
                  >
                    Reject Application
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedVendor.id, commissionInput)}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all"
                  >
                    {actionLoading ? "Approving..." : "Approve & Activate Vendor"}
                  </button>
                </>
              )}

              {selectedVendor.status === "approved" && (
                <>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleUpdateCommission(selectedVendor.id, commissionInput)}
                    className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs transition-colors"
                  >
                    Save Commission %
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleSuspend(selectedVendor.id)}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors"
                  >
                    Suspend Vendor
                  </button>
                </>
              )}

              {selectedVendor.status === "suspended" && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleReactivate(selectedVendor.id)}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
                >
                  Reactivate Vendor & Listings
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
