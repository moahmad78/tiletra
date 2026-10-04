"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getCpoDashboardStats, getCpoActivityLogs } from "@/lib/actions/cpo";
import { getActiveCpoWorkspaceStatus } from "@/lib/cpo/auth";
import {
  Store,
  Package,
  Layers,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Briefcase,
  History,
  PlusCircle,
  ExternalLink,
} from "lucide-react";

export default function CpoDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCpoDashboardStats(),
      getCpoActivityLogs({ limit: 8 }),
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
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/60 via-slate-900 to-indigo-950/60 p-6 rounded-2xl border border-purple-800/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Executive Product Operations
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            CPO Marketplace Command Center
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Oversee all marketplace vendors, manage unified catalogs, configure pricing & categories, and act on behalf of vendors with full audit transparency.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/cpo/vendors"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition-all hover:scale-[1.02]"
          >
            <Store className="w-4 h-4" />
            <span>Manage Vendors</span>
          </Link>
          <Link
            href="/cpo/catalog"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      {/* Active Workspace Card (if active) */}
      {workspace?.active && (
        <div className="bg-purple-950/40 border border-purple-500/50 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-white">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-purple-300 font-medium">Currently Impersonating Vendor</div>
              <div className="text-sm font-bold text-white">{workspace.vendorName}</div>
              <div className="text-xs text-slate-400 font-mono">ID: {workspace.vendorId}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cpo/catalog"
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30"
            >
              Add Items for this Vendor
            </Link>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Vendors</span>
            <Store className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : stats?.totalVendors || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">{stats?.activeVendors || 0} Active</span>
            <span>•</span>
            <span className="text-amber-400 font-medium">{stats?.pausedVendors || 0} Paused</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Vendor Products</span>
            <Package className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : stats?.totalProducts || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <span className="text-emerald-400 font-medium">{stats?.activeProducts || 0} Live in Store</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : stats?.pendingProducts || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <span className="text-amber-400">Items requiring approval</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Low Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">
            {loading ? "..." : stats?.lowStockVariants || 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            <span className="text-red-400">&lt; 15 units remaining</span>
          </div>
        </div>
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link
          href="/cpo/vendors"
          className="group p-5 bg-gradient-to-br from-slate-900 to-purple-950/30 rounded-xl border border-slate-800 hover:border-purple-600 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Store className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm group-hover:text-purple-300 transition-colors flex items-center justify-between">
            <span>Vendor Partner Management</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Onboard new suppliers, adjust commission rates, audit documentation, and open operational workspaces.
          </p>
        </Link>

        <Link
          href="/cpo/catalog"
          className="group p-5 bg-gradient-to-br from-slate-900 to-indigo-950/30 rounded-xl border border-slate-800 hover:border-indigo-600 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm group-hover:text-indigo-300 transition-colors flex items-center justify-between">
            <span>Cross-Vendor Catalog</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Search all marketplace products, batch upload items via CSV, bulk edit pricing, and curate inventory.
          </p>
        </Link>

        <Link
          href="/cpo/activity"
          className="group p-5 bg-gradient-to-br from-slate-900 to-slate-800/40 rounded-xl border border-slate-800 hover:border-slate-600 transition-all shadow-sm"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <History className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-white text-sm group-hover:text-slate-200 transition-colors flex items-center justify-between">
            <span>Audit Trail &amp; Activity</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Review immutable before/after logs of all changes made across vendor stores by CPO and Admins.
          </p>
        </Link>
      </div>

      {/* Recent Activity Log Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Recent Operations Audit Log</h2>
          </div>
          <Link
            href="/cpo/activity"
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            View all logs &rarr;
          </Link>
        </div>

        {recentLogs.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-8">
            No activity logs recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                <div>
                  <div className="text-slate-200 font-medium">
                    <span className="text-purple-400 font-semibold uppercase tracking-wider text-[11px] mr-2">
                      [{log.actorRole || "CPO"}]
                    </span>
                    {log.action} on <span className="text-white font-semibold">{log.entity}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                    Vendor: {log.vendorName} • Performed by: {log.actor}
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0 font-mono">
                  {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
