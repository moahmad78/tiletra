"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdminVendors,
  approveVendor,
  rejectVendor,
  suspendVendor,
  reactivateVendor,
  updateVendorCommission,
  createVendorManually,
  deleteVendor,
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
  PlusCircle,
  BarChart3,
  ExternalLink,
  Lock,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  ChevronRight,
  Building,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { generateNotificationMessage, buildWhatsAppShareUrl } from "@/lib/notifications/whatsapp-templates";

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

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "suspended" | "rejected">("all");

  // Selected vendor inspection modal
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [commissionInput, setCommissionInput] = useState<number>(15.0);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Vendor Confirmation State
  const [vendorToDelete, setVendorToDelete] = useState<any | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Manual Add Vendor (Path B) Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendorForm, setNewVendorForm] = useState({
    businessName: "",
    ownerName: "",
    contactEmail: "",
    contactPhone: "",
    category: CATEGORIES[0],
    businessAddress: "",
    gstNumber: "",
    description: "",
    commissionRate: 15.0,
    customPassword: "",
  });

  // Success Credentials Dialog
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    username: string;
    phone: string;
    password: string;
    businessName: string;
    commissionRate: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    setDeleteLoading(true);
    const res = await deleteVendor(vendorToDelete.id);
    setDeleteLoading(false);
    if (res.success) {
      toast.success(res.message);
      setVendorToDelete(null);
      setSelectedVendor(null);
      loadVendors();
    } else {
      toast.error(res.error || "Failed to delete vendor");
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

  const handleCreateManualVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorForm.businessName.trim() || !newVendorForm.contactPhone.trim() || !newVendorForm.contactEmail.trim()) {
      toast.error("Please fill required fields");
      return;
    }

    setActionLoading(true);
    const res = await createVendorManually({
      businessName: newVendorForm.businessName,
      ownerName: newVendorForm.ownerName || newVendorForm.businessName,
      contactEmail: newVendorForm.contactEmail,
      contactPhone: newVendorForm.contactPhone,
      category: newVendorForm.category,
      businessAddress: newVendorForm.businessAddress,
      gstNumber: newVendorForm.gstNumber,
      description: newVendorForm.description,
      commissionRate: newVendorForm.commissionRate,
      customPassword: newVendorForm.customPassword || undefined,
    });
    setActionLoading(false);

    if (res.success && res.credentials) {
      toast.success(res.message);
      setShowAddModal(false);
      setGeneratedCredentials(res.credentials);
      setNewVendorForm({
        businessName: "",
        ownerName: "",
        contactEmail: "",
        contactPhone: "",
        category: CATEGORIES[0],
        businessAddress: "",
        gstNumber: "",
        description: "",
        commissionRate: 15.0,
        customPassword: "",
      });
      loadVendors();
    } else {
      toast.error(res.error || "Failed to create vendor");
    }
  };

  const handleCopyCredentials = () => {
    if (!generatedCredentials) return;
    const text = generateNotificationMessage("vendor", {
      businessName: generatedCredentials.businessName,
      username: generatedCredentials.username,
      password: generatedCredentials.password,
      commissionRate: generatedCredentials.commissionRate,
      phone: generatedCredentials.phone,
    });
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Branded welcome message copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
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
          <h1 className="text-xl md:text-2xl font-black text-[#052a51] tracking-tight">
            Vendor & Shop Management
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Super Admin control over multi-vendor onboarding, approvals, commissions, and individual analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/vendor-applications"
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5"
          >
            <Clock size={14} className="text-amber-700" /> Review Inquiries (Path A)
          </Link>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-[#052a51] hover:bg-[#0a3e74] text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <PlusCircle size={15} className="text-[#F26522]" /> Add Vendor Manually (Path B)
          </button>
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
                ? "bg-[#052a51] text-white shadow-xs"
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
            placeholder="Search by shop name, owner, phone, email, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-gray-900 focus:bg-white focus:border-[#052a51] focus:outline-hidden"
          />
        </div>

        {/* Vendor Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading vendors...</div>
        ) : filteredVendors.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">No vendors found matching filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Vendor / Shop</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Commission</th>
                  <th className="py-3 px-3">Bank Details (Masked)</th>
                  <th className="py-3 px-3">Catalog</th>
                  <th className="py-3 px-3">Status</th>
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
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#052a51] font-black text-sm flex items-center justify-center shrink-0 border border-blue-100">
                            {v.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 max-w-[220px]">
                            <Link
                              href={`/admin/vendors/${v.id}`}
                              className="font-bold text-gray-900 hover:text-[#052a51] hover:underline truncate block"
                            >
                              {v.businessName}
                            </Link>
                            <p className="text-[10px] text-gray-400 truncate">
                              Owner: {v.owner?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-3">
                        <p className="font-medium text-gray-800">+91 {v.contactPhone}</p>
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
                          <span className="font-bold text-[#052a51]">{v.commissionRate}%</span>
                        </div>
                      </td>

                      {/* Bank Details (Masked) */}
                      <td className="py-3.5 px-3">
                        {v.bankAccountNumber ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-gray-900">
                              •••• •••• {v.bankAccountNumber.slice(-4)}
                            </span>
                            <p className="text-[10px] text-gray-400">{v.bankName || "Bank Added"}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Not Added
                          </span>
                        )}
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
                          <Link
                            href={`/admin/vendors/${v.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#052a51] text-xs font-bold transition-colors flex items-center gap-1"
                            title="View detailed dashboard & analytics"
                          >
                            <BarChart3 size={13} /> Dashboard
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedVendor(v);
                              setCommissionInput(v.commissionRate || 15.0);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-colors"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => setVendorToDelete(v)}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            title="Delete Vendor"
                          >
                            <Trash2 size={14} />
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

      {/* ── ADD VENDOR MANUALLY MODAL (Path B) ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#052a51] flex items-center justify-center font-bold">
                  <PlusCircle size={20} className="text-[#F26522]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#052a51]">Add Vendor Manually (Path B)</h3>
                  <p className="text-xs text-gray-500">Directly onboard a partner shop without waiting for application</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualVendor} className="space-y-4 py-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Business / Shop Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Pipes & Sanitary"
                    value={newVendorForm.businessName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Anand Poddar"
                    value={newVendorForm.ownerName}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, ownerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Mobile Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="10-digit number"
                    value={newVendorForm.contactPhone}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contactPhone: e.target.value.replace(/\D/g, "") })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vendor@intrihub.com"
                    value={newVendorForm.contactEmail}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Shop Category
                  </label>
                  <select
                    value={newVendorForm.category}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
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
                    Platform Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={newVendorForm.commissionRate}
                    onChange={(e) => setNewVendorForm({ ...newVendorForm, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Password (Leave empty to auto-generate)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated e.g. Vendor#9142"
                  value={newVendorForm.customPassword}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, customPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Shop Address & Premises
                </label>
                <textarea
                  rows={2}
                  placeholder="Street address, landmark, Bangalore"
                  value={newVendorForm.businessAddress}
                  onChange={(e) => setNewVendorForm({ ...newVendorForm, businessAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-[#052a51] hover:bg-[#0a3e74] text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-[#F26522]" />}
                  <span>Create Vendor & Generate Login</span>
                </button>
              </div>
            </form>
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
              Share these credentials with <strong>{generatedCredentials.businessName}</strong>.
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
                href={buildWhatsAppShareUrl(generatedCredentials.phone, "vendor", {
                  businessName: generatedCredentials.businessName,
                  username: generatedCredentials.username,
                  password: generatedCredentials.password,
                  commissionRate: generatedCredentials.commissionRate,
                  phone: generatedCredentials.phone,
                })}
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

      {/* Vendor Review & Inspection Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Vendor Details & Controls
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
                    +91 {selectedVendor.contactPhone}
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
                    className="w-32 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 focus:bg-white focus:border-[#052a51] focus:outline-hidden"
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
            <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/vendors/${selectedVendor.id}`}
                  className="px-4 py-2 bg-blue-50 text-[#052a51] rounded-xl text-xs font-bold hover:bg-blue-100 flex items-center gap-1"
                >
                  <BarChart3 size={14} /> Analytics Dashboard
                </Link>
                <button
                  onClick={() => {
                    const v = selectedVendor;
                    setSelectedVendor(null);
                    setVendorToDelete(v);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={13} /> Delete Vendor
                </button>
              </div>

              <div className="flex items-center gap-2">
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
                      {actionLoading ? "Approving..." : "Approve & Activate"}
                    </button>
                  </>
                )}

                {selectedVendor.status === "approved" && (
                  <>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateCommission(selectedVendor.id, commissionInput)}
                      className="px-4 py-2 rounded-xl bg-[#052a51] hover:bg-[#0a3e74] text-white font-bold text-xs transition-colors"
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
                    Reactivate Vendor
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE VENDOR CONFIRMATION MODAL ── */}
      {vendorToDelete && (
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
                Are you sure you want to permanently delete <strong>{vendorToDelete.businessName}</strong>?
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                <li>Vendor profile & settings will be deleted.</li>
                <li>Linked login user account (+91 {vendorToDelete.contactPhone}) will be removed.</li>
                <li>All {vendorToDelete._count?.products || 0} product listings will be removed from marketplace.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setVendorToDelete(null)}
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
    </div>
  );
}
