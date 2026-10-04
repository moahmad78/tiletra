"use client";

import { useState, useEffect } from "react";
import { getVendorAdminActivity } from "@/lib/vendor-workspace-auth";
import { ShieldCheck, Clock, Activity, FileCheck, Layers, ShoppingBag, Settings, ChevronDown, ChevronUp } from "lucide-react";

export default function AdminActivitySection({ vendorId }: { vendorId: string }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) return;
    let mounted = true;
    getVendorAdminActivity(vendorId, 10)
      .then((data) => {
        if (mounted) setLogs(data);
      })
      .catch((err) => console.error("Error loading vendor admin activity:", err))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [vendorId]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs">
        <p className="text-xs text-gray-400">Loading admin activity logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">IntriHub Admin Activity</h3>
            <p className="text-xs text-gray-500">
              No administrative intervention has been recorded on your store yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getActionBadge = (action: string) => {
    if (action.includes("ITEM_CREATED") || action.includes("CREATE")) {
      return {
        label: "Item Added",
        color: "bg-emerald-50 text-emerald-800 border-emerald-200",
        icon: Layers,
      };
    }
    if (action.includes("ITEM_UPDATED") || action.includes("EDIT")) {
      return {
        label: "Item Edited",
        color: "bg-blue-50 text-blue-800 border-blue-200",
        icon: FileCheck,
      };
    }
    if (action.includes("ORDER")) {
      return {
        label: "Order Updated",
        color: "bg-purple-50 text-purple-800 border-purple-200",
        icon: ShoppingBag,
      };
    }
    if (action.includes("DELIVERY") || action.includes("SLOTS")) {
      return {
        label: "Slots Configured",
        color: "bg-amber-50 text-amber-800 border-amber-200",
        icon: Settings,
      };
    }
    return {
      label: action.replace(/_/g, " "),
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Activity,
    };
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#052a51] flex items-center justify-center border border-blue-100">
            <ShieldCheck size={20} className="text-[#052a51]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900">IntriHub Team Activity</h3>
            <p className="text-xs text-gray-500">
              Verified record of catalog, merchandising, and onboarding actions performed on your store by IntriHub administrators and Product Officers.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full shrink-0">
          Transparency Log
        </span>
      </div>

      {/* Activity Timeline List */}
      <div className="divide-y divide-gray-100">
        {logs.map((log) => {
          const badge = getActionBadge(log.action);
          const Icon = badge.icon;
          const isExpanded = expandedLogId === log.id;

          return (
            <div key={log.id} className="py-3 first:pt-0 last:pb-0 text-xs">
              <div
                className="flex items-center justify-between gap-3 cursor-pointer hover:bg-gray-50/60 p-2 rounded-xl transition-colors"
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border shrink-0 ${badge.color}`}
                  >
                    <Icon size={12} />
                    {badge.label}
                  </span>
                  <div className="truncate">
                    <p className="font-bold text-gray-800 truncate">
                      {log.after?.name ? `Product: "${log.after.name}"` : `${log.entity} modified`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      Performed by: <span className="font-semibold text-gray-600">{log.performedBy}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400 font-mono">
                    {formatTimestamp(log.createdAt)}
                  </span>
                  {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                </div>
              </div>

              {/* Collapsible Details */}
              {isExpanded && (log.before || log.after) && (
                <div className="mt-2 p-3 rounded-2xl bg-gray-50 border border-gray-200/60 text-[11px] font-mono space-y-1">
                  {log.before && (
                    <div>
                      <span className="text-rose-700 font-bold">Previous state:</span>
                      <pre className="text-gray-600 whitespace-pre-wrap overflow-x-auto text-[10px] mt-0.5">
                        {JSON.stringify(log.before, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.after && (
                    <div className={log.before ? "pt-2 border-t border-gray-200" : ""}>
                      <span className="text-emerald-700 font-bold">Updated state:</span>
                      <pre className="text-gray-600 whitespace-pre-wrap overflow-x-auto text-[10px] mt-0.5">
                        {JSON.stringify(log.after, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
