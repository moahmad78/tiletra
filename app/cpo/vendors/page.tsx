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
  Eye,
  Lock,
  Phone,
  Mail,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Loader2,
  Shield,
  FileText,
  ExternalLink,
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

  const handleSelectWorkspace = async (vendor: any) => {
    try {
      const res = await selectCpoVendor({
        vendorId: vendor.id,
        reason: "CPO Operational Review & Catalog Management",
      });
      if (res.success) {
        toast.success(`Active workspace opened for ${vendor.businessName}`);
        setActiveWorkspaceId(vendor.id);
        router.refresh();
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace Vendors</h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, onboard, manage commission rates, and launch dedicated workspaces for suppliers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by vendor name, shop name, ID, phone, or GST..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["all", "approved", "pending", "paused", "suspended"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-purple-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs">Loading marketplace vendors...</span>
          </div>
        ) : vendors.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No vendors found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Vendor &amp; Store</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Products</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {vendors.map((v) => {
                  const isActiveWorkspace = activeWorkspaceId === v.id;
                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isActiveWorkspace ? "bg-purple-950/20" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{v.businessName}</span>
                          {isActiveWorkspace && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500 text-white font-mono uppercase font-bold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          ID: {v.id}
                        </div>
                        {v.internalNotes && (
                          <div className="text-[10px] text-amber-300 italic mt-0.5 max-w-xs truncate">
                            Note: {v.internalNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {v.category || "General"}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-purple-300">
                        {v.commissionRate}%
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {v._count?.products || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            v.status === "approved"
                              ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                              : v.status === "paused"
                              ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                              : v.status === "suspended"
                              ? "bg-red-950/80 text-red-400 border border-red-800"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{v.contactPhone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[140px]">{v.contactEmail}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSelectWorkspace(v)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                              isActiveWorkspace
                                ? "bg-purple-600 text-white"
                                : "bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60"
                            }`}
                            title="Open Vendor Workspace"
                          >
                            <Briefcase className="w-3 h-3" />
                            <span>{isActiveWorkspace ? "Active" : "Workspace"}</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(v)}
                            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Settings"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {v.slug && (
                            <Link
                              href={`/shop/vendor/${v.slug}`}
                              target="_blank"
                              className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="View Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
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

      {/* Edit Vendor Settings Modal */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Vendor Configuration</h3>
                <p className="text-xs text-slate-400">{editingVendor.businessName} (ID: {editingVendor.id.slice(-6)})</p>
              </div>
              <button
                onClick={() => setEditingVendor(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Primary Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Platform Commission Rate (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={editCommission}
                    onChange={(e) => setEditCommission(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Store Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="approved">Approved &amp; Active</option>
                  <option value="paused">Paused (Catalog hidden from search)</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending Application</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Internal CPO Operational Notes</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Private internal observations, priority category supplier notes, SLA commitments..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {/* Security policy notice */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>
                  Financial settlements, bank accounts, and credentials are locked (403 Forbidden for CPO) and can only be altered by Super Admin.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingVendor(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{savingSettings ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
              <div>
                <h3 className="text-base font-bold text-white">Onboard New Supplier</h3>
                <p className="text-xs text-slate-400">Direct supplier setup for IntriHub catalog</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Business / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={newVendor.businessName}
                    onChange={(e) => setNewVendor({ ...newVendor, businessName: e.target.value })}
                    placeholder="e.g. Royal Ceramica Supplies"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Owner Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={newVendor.ownerName}
                    onChange={(e) => setNewVendor({ ...newVendor, ownerName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newVendor.contactEmail}
                    onChange={(e) => setNewVendor({ ...newVendor, contactEmail: e.target.value })}
                    placeholder="supplier@example.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Phone Number (10 digits) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={newVendor.contactPhone}
                    onChange={(e) => setNewVendor({ ...newVendor, contactPhone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Primary Category</label>
                  <select
                    value={newVendor.category}
                    onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Initial Commission (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={newVendor.commissionRate}
                    onChange={(e) => setNewVendor({ ...newVendor, commissionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Business Address</label>
                <input
                  type="text"
                  value={newVendor.businessAddress}
                  onChange={(e) => setNewVendor({ ...newVendor, businessAddress: e.target.value })}
                  placeholder="Plot No. 42, Industrial Area, Bangalore"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">GST Number (Optional)</label>
                <input
                  type="text"
                  value={newVendor.gstNumber}
                  onChange={(e) => setNewVendor({ ...newVendor, gstNumber: e.target.value.toUpperCase() })}
                  placeholder="29AAAAA0000A1Z5"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 uppercase font-mono"
                />
              </div>

              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingVendor}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingVendor && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{creatingVendor ? "Creating Vendor..." : "Create Vendor"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
