"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getCpoVendors,
  updateCpoVendorSettings,
  createCpoVendor,
} from "@/lib/actions/cpo";
import { selectCpoVendor, getActiveCpoWorkspaceStatus } from "@/lib/cpo/auth";
import {
  Store,
  Search,
  PlusCircle,
  Briefcase,
  Edit,
  Phone,
  Mail,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Loader2,
  FileText,
  Package,
  ExternalLink,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

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

export default function CpoVendorsPage() {
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  // Edit Settings Modal State
  const [editingVendor, setEditingVendor] = useState<any | null>(null);
  const [editCategory, setEditCategory] = useState("");
  const [editCommission, setEditCommission] = useState(15.0);
  const [editStatus, setEditStatus] = useState("approved");
  const [editNotes, setEditNotes] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Add Vendor Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVendor, setNewVendor] = useState({
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
  const [creatingVendor, setCreatingVendor] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, ws] = await Promise.all([
        getCpoVendors({ search: searchQuery, status: statusFilter }),
        getActiveCpoWorkspaceStatus(),
      ]);
      setVendors(list);
      if (ws.active && ws.vendorId) {
        setActiveWorkspaceId(ws.vendorId);
      } else {
        setActiveWorkspaceId(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleSelectWorkspace = async (v: any) => {
    try {
      const res = await selectCpoVendor({
        vendorId: v.id,
        reason: `CPO Vendor Catalog Management`,
      });

      if (res.success) {
        toast.success(`Active workspace opened for ${v.businessName}`);
        setActiveWorkspaceId(v.id);
        router.push(`/cpo/catalog?vendorId=${v.id}`);
      } else {
        toast.error(res.error || "Failed to start workspace");
      }
    } catch {
      toast.error("Failed to start workspace");
    }
  };

  const handleOpenEdit = (v: any) => {
    setEditingVendor(v);
    setEditCategory(v.category || CATEGORIES[0]);
    setEditCommission(v.commissionRate || 15.0);
    setEditStatus(v.status || "approved");
    setEditNotes(v.internalNotes || "");
  };

  const handleSaveSettings = async () => {
    if (!editingVendor) return;
    setSavingSettings(true);
    try {
      const res = await updateCpoVendorSettings({
        vendorId: editingVendor.id,
        category: editCategory,
        commissionRate: Number(editCommission),
        status: editStatus,
        internalNotes: editNotes,
      });

      if (res.success) {
        toast.success(res.message);
        setEditingVendor(null);
        loadData();
      } else {
        toast.error(res.error || "Failed to update settings");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingVendor(true);
    try {
      const res = await createCpoVendor(newVendor);
      if (res.success) {
        toast.success(`Vendor "${newVendor.businessName}" created successfully!`);
        setShowAddModal(false);
        setNewVendor({
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
        loadData();
      } else {
        toast.error(res.error || "Failed to create vendor");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to create vendor");
    } finally {
      setCreatingVendor(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace Vendors &amp; Stores</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Select any vendor to manage their product catalog, upload new items with all options, or generate tax invoices.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Add New Vendor</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor name, shop name, phone, or GST..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#F26522] focus:bg-white transition-all font-medium"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["all", "approved", "pending", "paused", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#052a51] text-white shadow-xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#F26522]" />
            <span className="text-xs font-medium">Loading marketplace vendors...</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            No vendors found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Vendor &amp; Store</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Commission</th>
                  <th className="py-3.5 px-4">Products</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vendors.map((v) => {
                  const isActiveWorkspace = v.id === activeWorkspaceId;
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isActiveWorkspace ? "bg-[#052a51]/5" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 text-sm">{v.businessName}</span>
                          {isActiveWorkspace && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#F26522] text-white">
                              Active
                            </span>
                          )}
                          {(!v.latitude || !v.longitude) && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-1" title="Vendor missing latitude or longitude coordinates">
                              <MapPin className="w-2.5 h-2.5 text-amber-600" />
                              Location Missing
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                          ID: {v.id} {v.gstNumber && `• GST: ${v.gstNumber}`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-medium text-[11px]">
                          {v.category || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-gray-900 font-mono">
                        {v.commissionRate ?? 15}%
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
                          <Package className="w-3.5 h-3.5 text-gray-500" />
                          {v._count?.products ?? 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {v.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Approved
                          </span>
                        ) : v.status === "pending" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 capitalize">
                            <AlertTriangle className="w-3 h-3" /> {v.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-gray-700 font-medium flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {v.contactPhone || "N/A"}
                        </div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[180px] flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {v.contactEmail}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Manage Items / Workspace */}
                          <button
                            onClick={() => handleSelectWorkspace(v)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer ${
                              isActiveWorkspace
                                ? "bg-[#F26522] text-white shadow-xs"
                                : "bg-[#052a51] hover:bg-[#04203e] text-white"
                            }`}
                            title="Manage products for this vendor"
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>{isActiveWorkspace ? "Managing" : "Items"}</span>
                          </button>

                          {/* Add Item direct link */}
                          <Link
                            href={`/cpo/catalog/new?vendorId=${v.id}`}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-xs transition-colors"
                            title="Add new item with all options"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>+ Item</span>
                          </Link>

                          {/* Invoice direct link */}
                          <Link
                            href={`/cpo/invoices?vendorId=${v.id}`}
                            className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 inline-flex items-center gap-1 transition-colors"
                            title="Generate Tax Invoice"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Bill</span>
                          </Link>

                          {/* Edit Settings */}
                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Edit commission & status"
                          >
                            <Edit className="w-3.5 h-3.5" />
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

      {/* Edit Settings Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">Edit Vendor Settings</h3>
                <p className="text-xs text-gray-500 font-medium">{editingVendor.businessName}</p>
              </div>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Assigned Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Marketplace Commission (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="50"
                  value={editCommission}
                  onChange={(e) => setEditCommission(parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                >
                  <option value="approved">Approved</option>
                  <option value="pending">Pending Review</option>
                  <option value="paused">Paused</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Internal Notes</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Private notes on performance, supplier agreements..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                onClick={() => setEditingVendor(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-5 py-2 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-gray-900">Add New Marketplace Vendor</h3>
                <p className="text-xs text-gray-500 font-medium">Onboard a supplier to manage their items.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Business / Store Name *</label>
                <input
                  type="text"
                  required
                  value={newVendor.businessName}
                  onChange={(e) => setNewVendor({ ...newVendor, businessName: e.target.value })}
                  placeholder="e.g. Apex Tile Studio"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Owner / Contact Name</label>
                  <input
                    type="text"
                    value={newVendor.ownerName}
                    onChange={(e) => setNewVendor({ ...newVendor, ownerName: e.target.value })}
                    placeholder="Owner name"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category *</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Email *</label>
                  <input
                    type="email"
                    required
                    value={newVendor.contactEmail}
                    onChange={(e) => setNewVendor({ ...newVendor, contactEmail: e.target.value })}
                    placeholder="vendor@company.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newVendor.contactPhone}
                    onChange={(e) => setNewVendor({ ...newVendor, contactPhone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">GST Number</label>
                  <input
                    type="text"
                    value={newVendor.gstNumber}
                    onChange={(e) => setNewVendor({ ...newVendor, gstNumber: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="50"
                    value={newVendor.commissionRate}
                    onChange={(e) => setNewVendor({ ...newVendor, commissionRate: parseFloat(e.target.value) || 15 })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Warehouse / Shop Address</label>
                <textarea
                  value={newVendor.businessAddress}
                  onChange={(e) => setNewVendor({ ...newVendor, businessAddress: e.target.value })}
                  rows={2}
                  placeholder="Full physical address..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-900 focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingVendor}
                  className="px-5 py-2 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {creatingVendor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Vendor</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
