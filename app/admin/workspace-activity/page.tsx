"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getActiveWorkspaceStatus,
  getAdminWorkspaceAuditLogs,
  getActiveImpersonationSessions,
  forceEndWorkspaceSession,
  endWorkspaceSession,
} from "@/lib/vendor-workspace-auth";
import {
  ShieldAlert,
  Clock,
  Activity,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  LogOut,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Users,
  ListFilter,
  CheckCircle2,
  XCircle,
  Store,
} from "lucide-react";
import { toast } from "sonner";

type LogEntry = {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: any;
  after?: any;
  createdAt: string;
  ip?: string | null;
  admin?: { id: string; name?: string | null; email: string } | null;
  vendor?: { id: string; businessName: string; slug: string } | null;
};

type ActiveSession = {
  id: string;
  adminId: string;
  adminName?: string;
  adminEmail: string;
  vendorId: string;
  vendorName: string;
  vendorPhone?: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  lastActiveAt: string;
  ip?: string;
  isIdle: boolean;
};

export default function WorkspaceActivityPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [forcingEnd, setForcingEnd] = useState<string | null>(null);

  // Filter state
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"logs" | "sessions">("sessions");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [logsData, sessionsData] = await Promise.all([
        getAdminWorkspaceAuditLogs({
          action: actionFilter || undefined,
          startDate: dateFrom || undefined,
          endDate: dateTo || undefined,
          limit: 100,
        }),
        getActiveImpersonationSessions(),
      ]);
      setLogs((logsData as unknown) as LogEntry[]);
      setSessions(sessionsData as ActiveSession[]);
    } catch (e) {
      console.error("Error loading workspace activity:", e);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, dateFrom, dateTo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleForceEnd = async (sessionId: string, adminName: string, vendorName: string) => {
    if (!confirm(`Force-end workspace session?\n\nAdmin: ${adminName}\nVendor: ${vendorName}\n\nThis will immediately terminate their session.`)) return;

    setForcingEnd(sessionId);
    try {
      const res = await forceEndWorkspaceSession(sessionId);
      if (res.success) {
        toast.success(`Session for ${adminName} / ${vendorName} force-terminated.`);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        toast.error(res.error || "Failed to force-end session");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to force-end session");
    } finally {
      setForcingEnd(null);
    }
  };

  const formatTime = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoStr;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATED")) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (action.includes("UPDATED") || action.includes("CHANGED")) return "bg-blue-100 text-blue-800 border-blue-200";
    if (action.includes("DELETED")) return "bg-rose-100 text-rose-800 border-rose-200";
    if (action.includes("SESSION_STARTED")) return "bg-orange-100 text-orange-800 border-orange-200";
    if (action.includes("SESSION_ENDED")) return "bg-gray-100 text-gray-700 border-gray-200";
    if (action.includes("BLOCKED")) return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <Activity size={18} />
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Workspace Activity & Sessions
            </h1>
          </div>
          <p className="text-xs text-gray-500 ml-10.5">
            Audit log of all vendor workspace actions and active/historical impersonation sessions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold text-xs shadow-xs transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "sessions"
              ? "bg-white text-orange-700 shadow-xs border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <Users size={13} />
            Active Sessions
            {sessions.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black">
                {sessions.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === "logs"
              ? "bg-white text-[#052a51] shadow-xs border border-gray-200"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <span className="flex items-center gap-2">
            <Activity size={13} />
            Audit Log
            {logs.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-700 text-[10px] font-black">
                {logs.length}
              </span>
            )}
          </span>
        </button>
      </div>

      {/* ACTIVE SESSIONS TAB */}
      {activeTab === "sessions" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="font-black text-gray-900">Active Workspace Sessions</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Live admin-vendor impersonation sessions. Super Admin can force-end any session.
              </p>
            </div>
            {sessions.length > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold border border-orange-200 animate-pulse">
                {sessions.length} active
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">No Active Workspace Sessions</p>
              <p className="text-xs text-gray-400 mt-1">All workspace sessions are currently idle or expired.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sessions.map((s) => (
                <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.isIdle ? "bg-amber-100 text-amber-700" : "bg-orange-100 text-orange-700"}`}>
                      <ShieldAlert size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-black text-gray-900 truncate">
                          {s.adminName || s.adminEmail}
                        </p>
                        <span className="text-xs text-gray-400">→</span>
                        <p className="text-sm font-bold text-[#052a51] truncate">
                          {s.vendorName}
                        </p>
                        {s.isIdle && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">
                            Idle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        Reason: <span className="font-semibold text-gray-700">{s.reason}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> Started {formatTime(s.startedAt)}
                        </span>
                        <span>Expires {formatTime(s.expiresAt)}</span>
                        {s.ip && <span>IP: {s.ip}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleForceEnd(s.id, s.adminName || s.adminEmail, s.vendorName)}
                    disabled={forcingEnd === s.id}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs border border-rose-200 transition-all disabled:opacity-60"
                  >
                    {forcingEnd === s.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <LogOut size={13} />
                    )}
                    Force End
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === "logs" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ListFilter size={14} />
              {showFilters ? "Hide Filters" : "Show Filters"}
              {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Action contains</label>
                  <input
                    type="text"
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    placeholder="e.g. ITEM_CREATED"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium bg-gray-50 focus:bg-white focus:border-[#052a51] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">From date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium bg-gray-50 focus:bg-white focus:border-[#052a51] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">To date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium bg-gray-50 focus:bg-white focus:border-[#052a51] outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Log Table */}
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-black text-gray-900">Workspace Audit Log</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Every state-changing action performed in a vendor workspace, with before/after diff.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : logs.length === 0 ? (
              <div className="py-16 text-center">
                <Activity size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-700">No Audit Logs Found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {actionFilter || dateFrom || dateTo
                    ? "No logs match your filter criteria."
                    : "Admin workspace actions will appear here once the workspace feature is used."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                        Action
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                        Admin
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                        Vendor
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                        Entity
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                        Time
                      </th>
                      <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider text-[10px]">
                        Diff
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((log) => {
                      const isExpanded = expandedLogId === log.id;
                      const hasDiff = log.before || log.after;

                      return (
                        <>
                          <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${getActionColor(
                                  log.action
                                )}`}
                              >
                                {log.action.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-gray-800 truncate max-w-[120px]">
                                {log.admin?.name || log.admin?.email || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-[#052a51] truncate max-w-[120px]">
                                {log.vendor?.businessName || "—"}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-600">
                                {log.entity}
                                {log.entityId && (
                                  <span className="text-gray-400 font-mono ml-1">
                                    #{log.entityId.slice(-6)}
                                  </span>
                                )}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-gray-500 whitespace-nowrap">{formatTime(log.createdAt)}</p>
                            </td>
                            <td className="px-4 py-3">
                              {hasDiff ? (
                                <button
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="text-[#052a51] hover:underline font-bold flex items-center gap-1"
                                >
                                  View
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                              ) : (
                                <span className="text-gray-300">—</span>
                              )}
                            </td>
                          </tr>
                          {isExpanded && hasDiff && (
                            <tr key={`${log.id}-expanded`} className="bg-gray-50/80">
                              <td colSpan={6} className="px-6 py-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] font-mono">
                                  {log.before && (
                                    <div>
                                      <p className="font-bold text-rose-700 mb-1.5 font-sans uppercase text-[10px] tracking-wider">
                                        Before
                                      </p>
                                      <pre className="bg-rose-50 border border-rose-200 rounded-xl p-3 overflow-x-auto text-rose-800 max-h-48">
                                        {JSON.stringify(log.before, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                  {log.after && (
                                    <div>
                                      <p className="font-bold text-emerald-700 mb-1.5 font-sans uppercase text-[10px] tracking-wider">
                                        After
                                      </p>
                                      <pre className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 overflow-x-auto text-emerald-800 max-h-48">
                                        {JSON.stringify(log.after, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
