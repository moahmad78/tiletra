"use client";

import { useState, useEffect } from "react";
import { getCpoActivityLogs, getCpoVendors } from "@/lib/actions/cpo";
import {
  History,
  Search,
  Filter,
  Store,
  Clock,
  Shield,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Globe,
} from "lucide-react";
import { toast } from "sonner";

export default function CpoActivityPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, vList] = await Promise.all([
        getCpoActivityLogs({
          vendorId: selectedVendor,
          action: selectedAction,
          limit: 100,
        }),
        getCpoVendors(),
      ]);
      setLogs(logsRes);
      setVendors(vList);
    } catch {
      toast.error("Failed to load activity logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedVendor, selectedAction]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Marketplace Activity &amp; Audit Trail</h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of administrative, catalog, and vendor modifications with complete before/after diffs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-400" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Vendor:</span>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.businessName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Actions</option>
            <option value="CPO_WORKSPACE_SESSION_STARTED">Workspace Session Started</option>
            <option value="CPO_VENDOR_SETTINGS_UPDATED">Vendor Settings Updated</option>
            <option value="CPO_VENDOR_CREATED">Vendor Created</option>
            <option value="ITEM_CREATED">Item Created</option>
            <option value="ITEM_UPDATED">Item Updated</option>
            <option value="ITEM_DELETED">Item Deleted</option>
            <option value="CPO_BULK_EDIT_SETSTATUS">Bulk Status Update</option>
            <option value="CPO_BULK_EDIT_ADJUSTPRICE">Bulk Price Adjustment</option>
          </select>
        </div>

        <div className="ml-auto text-slate-400 font-mono">
          Logs Found: <strong className="text-white">{logs.length}</strong>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            <span className="text-xs">Loading audit trail...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No audit records match your selected filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasDiff = Boolean(log.before || log.after);

              return (
                <div key={log.id} className="p-4 hover:bg-slate-800/30 transition-colors text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                        {log.actorRole || "CPO"}
                      </span>
                      <strong className="text-white font-semibold">{log.action}</strong>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-300">Entity: <strong className="text-white">{log.entity}</strong></span>
                      {log.entityId && (
                        <span className="text-slate-400 font-mono text-[11px]">
                          ({log.entityId.slice(-8)})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px] font-mono shrink-0">
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                      {hasDiff && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-sans text-xs ml-2"
                        >
                          <span>{isExpanded ? "Hide Diff" : "View Diff"}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-1.5 flex items-center gap-4 text-[11px] text-slate-400">
                    <div>
                      Target Store: <strong className="text-slate-200">{log.vendorName}</strong>
                    </div>
                    <div>
                      Operator: <span className="text-slate-300">{log.actor}</span>
                    </div>
                    {log.ip && (
                      <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
                        <Globe className="w-3 h-3" />
                        <span>{log.ip}</span>
                      </div>
                    )}
                  </div>

                  {/* Expandable Before / After Diff */}
                  {isExpanded && hasDiff && (
                    <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                      <div>
                        <div className="text-[10px] text-red-400 font-bold uppercase mb-1">Before State</div>
                        <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-40">
                          {log.before ? JSON.stringify(log.before, null, 2) : "null"}
                        </pre>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">After State</div>
                        <pre className="p-2 bg-slate-900 rounded border border-slate-800 text-slate-300 overflow-x-auto max-h-40">
                          {log.after ? JSON.stringify(log.after, null, 2) : "null"}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
