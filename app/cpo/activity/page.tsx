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
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Marketplace Activity &amp; Audit Trail</h1>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Immutable log of administrative, catalog, and vendor modifications with complete before/after diffs.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-200 shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#F26522]" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-200/90 rounded-2xl p-4 flex flex-wrap items-center gap-4 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <Store className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-gray-600">Vendor:</span>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#F26522]"
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
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-bold text-gray-600">Action:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#F26522]"
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

        <div className="ml-auto text-gray-500 font-mono text-xs">
          Logs Found: <strong className="text-gray-900 font-bold">{logs.length}</strong>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200/90 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#F26522]" />
            <span className="text-xs font-medium">Loading audit logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-xs">
            No audit logs recorded for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-blue-50 text-blue-700 border border-blue-200">
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {log.entity} {log.entityId && <span className="text-gray-400 font-mono text-[10px]">({log.entityId.slice(-6)})</span>}
                      </td>

                      <td className="py-3 px-4 text-gray-700">
                        {log.vendor?.businessName || "Platform"}
                      </td>

                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {log.actorRole}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1 text-gray-400 hover:text-gray-700 rounded-md"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
