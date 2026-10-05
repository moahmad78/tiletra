"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCpoDashboardStats, getCpoActivityLogs } from "@/lib/actions/cpo";
import { getActiveCpoWorkspaceStatus } from "@/lib/cpo/auth";
import {
  Store,
  Package,
  FileText,
  PlusCircle,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Boxes,
  Loader2,
} from "lucide-react";

export default function CpoDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCpoDashboardStats(),
      getCpoActivityLogs({ limit: 6 }),
      getActiveCpoWorkspaceStatus(),
    ])
      .then(([statsRes, logsRes, wsRes]) => {
        setStats(statsRes);
        setRecentLogs(logsRes);
        setWorkspace(wsRes);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#F26522] uppercase tracking-wider mb-1.5">
            <ShieldCheck className="w-4 h-4" />
            Executive Product Operations
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            CPO Vendor &amp; Catalog Management
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl font-medium">
            Select any marketplace vendor to add and edit their items with full product variant options, or generate official sequential tax invoices.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Link
            href="/cpo/catalog/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F26522] hover:bg-[#d95517] text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Add New Product</span>
          </Link>
          <Link
            href="/cpo/invoices"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#052a51] hover:bg-[#04203e] text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
          >
            <FileText className="w-4 h-4" />
            <span>Tax Invoices</span>
          </Link>
        </div>
      </div>

      {/* Active Workspace Banner Card (if active) */}
      {workspace?.active && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-[#F26522] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-amber-900 font-bold uppercase tracking-wider">
                Currently Working on Behalf of:
              </div>
              <div className="text-base font-black text-gray-900">{workspace.vendorName}</div>
              <div className="text-xs text-gray-500 font-mono">Vendor ID: {workspace.vendorId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href={`/cpo/catalog/new?vendorId=${workspace.vendorId}`}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-[#F26522] text-white hover:bg-[#d95517] shadow-xs transition-colors"
            >
              + Add Item for this Vendor
            </Link>
            <Link
              href={`/cpo/catalog?vendorId=${workspace.vendorId}`}
              className="text-xs font-bold px-4 py-2 rounded-xl bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-xs transition-colors"
            >
              View Vendor Catalog
            </Link>
          </div>
        </div>
      )}

      {/* 4 Core Management Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendors Card */}
        <Link
          href="/cpo/vendors"
          className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#052a51]/30 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#052a51]/10 text-[#052a51] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <div className="text-sm font-black text-gray-900 flex items-center justify-between">
            <span>Marketplace Vendors</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#F26522] group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Search, select and manage all approved seller accounts and their catalog access.
          </p>
          <div className="mt-3 text-xs font-bold text-[#052a51]">
            {loading ? "..." : `${stats?.totalVendors || 0} Total Vendors`}
          </div>
        </Link>

        {/* Catalog Items Card */}
        <Link
          href="/cpo/catalog"
          className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#052a51]/30 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <div className="text-sm font-black text-gray-900 flex items-center justify-between">
            <span>Product Catalog</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Filter by vendor, update prices, adjust stock, edit specs and manage listings.
          </p>
          <div className="mt-3 text-xs font-bold text-emerald-600">
            {loading ? "..." : `${stats?.totalProducts || 0} Products Listed`}
          </div>
        </Link>

        {/* Add Product Card */}
        <Link
          href="/cpo/catalog/new"
          className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#F26522]/30 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F26522] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div className="text-sm font-black text-gray-900 flex items-center justify-between">
            <span>Add Item (All Options)</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#F26522] group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Full vendor upload form with multiple variants (Size/Finish/Color), images &amp; attributes.
          </p>
          <div className="mt-3 text-xs font-bold text-[#F26522]">
            Comprehensive Form →
          </div>
        </Link>

        {/* Tax Invoice Generator Card */}
        <Link
          href="/cpo/invoices"
          className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs hover:border-[#052a51]/30 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-sm font-black text-gray-900 flex items-center justify-between">
            <span>Tax Invoice Generator</span>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Generate manual or online order bills with auto sequential numbers and A4 PDF printing.
          </p>
          <div className="mt-3 text-xs font-bold text-blue-700">
            A4 Print Ready →
          </div>
        </Link>
      </div>

      {/* Overview Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Vendors</div>
          <div className="text-2xl font-black text-gray-900 mt-1">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.activeVendors || 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Products</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.activeProducts || 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending Approvals</div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.pendingProducts || 0}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Low Stock Alerts</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : stats?.lowStockVariants || 0}
          </div>
        </div>
      </div>
    </div>
  );
}
