"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  Send,
  RotateCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Store,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<"send" | "logs">("send");

  // Send Form State
  const [target, setTarget] = useState<"user" | "vendor" | "all_users" | "all_vendors">("all_users");
  const [userId, setUserId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [type, setType] = useState("PROMO_OFFER");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [sending, setSending] = useState(false);

  // Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: "25",
      });
      if (statusFilter) params.append("status", statusFilter);
      if (searchFilter) params.append("recipient", searchFilter);

      const res = await fetch(`/api/admin/notifications/logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch {
      toast.error("Failed to load notification logs");
    } finally {
      setLogsLoading(false);
    }
  }, [page, statusFilter, searchFilter]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const handleSendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Please enter both title and message body");
      return;
    }
    if (target === "user" && !userId.trim()) {
      toast.error("User ID is required for single user target");
      return;
    }
    if (target === "vendor" && !vendorId.trim()) {
      toast.error("Vendor ID is required for single vendor target");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          userId: target === "user" ? userId.trim() : undefined,
          vendorId: target === "vendor" ? vendorId.trim() : undefined,
          type,
          title: title.trim(),
          body: body.trim(),
          deepLink: deepLink.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
          adminId: "super_admin",
        }),
      });

      const data = await res.json();
      if (data.success) {
        const count = data.result?.sentCount ?? 1;
        toast.success(`Push notification dispatched successfully to ${count} recipient(s)!`);
        setTitle("");
        setBody("");
        setDeepLink("");
        setImageUrl("");
        if (activeTab === "logs") {
          fetchLogs();
        }
      } else {
        toast.error(data.error || "Failed to dispatch notification");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error dispatching push notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bell className="w-7 h-7 text-primary" />
            Push Notification Dispatch & Logs
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dispatch manual order alerts, promotional announcements, and audit real-time push delivery logs.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setActiveTab("send")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "send"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-4 h-4" />
            Send Notification
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
              activeTab === "logs"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4" />
            Audit Logs {totalCount > 0 && `(${totalCount})`}
          </button>
        </div>
      </div>

      {activeTab === "send" ? (
        /* TAB 1: SEND NOTIFICATION */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Manual Push Dispatch Form
            </h2>

            <form onSubmit={handleSendPush} className="space-y-5">
              {/* Target Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Recipient Audience
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setTarget("all_users")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      target === "all_users"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-bold">All Customers</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget("all_vendors")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      target === "all_vendors"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Store className="w-5 h-5" />
                    <span className="text-xs font-bold">All Vendors</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget("user")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      target === "user"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-bold">Single Customer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTarget("vendor")}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      target === "vendor"
                        ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Store className="w-5 h-5" />
                    <span className="text-xs font-bold">Single Vendor</span>
                  </button>
                </div>
              </div>

              {/* Conditional ID inputs */}
              {target === "user" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Customer User ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. usr_clxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              {target === "vendor" && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Vendor Partner ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    placeholder="e.g. vnd_clxxxxxxxx"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              )}

              {/* Catalog Type */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Catalog Event Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none bg-white"
                >
                  <optgroup label="Customer App Types">
                    <option value="PROMO_OFFER">PROMO_OFFER (Deals & Discounts)</option>
                    <option value="CART_ABANDONED">CART_ABANDONED (Cart Reminder)</option>
                    <option value="NEW_ARRIVALS">NEW_ARRIVALS (New Catalog Items)</option>
                    <option value="ORDER_PLACED">ORDER_PLACED (Order Confirmation)</option>
                    <option value="ORDER_OUT_FOR_DELIVERY">ORDER_OUT_FOR_DELIVERY (Live Tracking)</option>
                    <option value="ACCOUNT_UPDATE">ACCOUNT_UPDATE (Service Notice)</option>
                  </optgroup>
                  <optgroup label="Vendor Partner App Types">
                    <option value="ORDER_NEW">ORDER_NEW (Loud Siren High Alert)</option>
                    <option value="ORDER_REMINDER">ORDER_ACCEPT_REMINDER (Accept SLA Warning)</option>
                    <option value="VENDOR_OFFER">VENDOR_OFFER (Commission/Festival Offer)</option>
                    <option value="PAYOUT_SETTLED">PAYOUT_SETTLED (Bank Payout Success)</option>
                    <option value="ITEM_APPROVED">ITEM_APPROVED (Catalog Approval)</option>
                  </optgroup>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. ⚡ Flash Sale: 20% Off Ceramic Tiles Today!"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Notification Body *
                </label>
                <textarea
                  required
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="e.g. Premium Vitrified Glazed Tiles at warehouse prices. Fast 60-min delivery across Bangalore."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Deep Link & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Deep Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={deepLink}
                    onChange={(e) => setDeepLink(e.target.value)}
                    placeholder="e.g. /category/tiles or /vendor/orders"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Banner Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/95 transition-all disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Dispatching Push...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Dispatch Push Notification Now
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Preview Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Device Lock-Screen Preview
              </h3>
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center text-[10px] font-black">
                      IH
                    </div>
                    <span className="text-xs font-semibold text-slate-300">IntriHub</span>
                  </div>
                  <span className="text-[10px] text-slate-400">now</span>
                </div>
                <p className="text-sm font-bold text-white leading-tight">
                  {title.trim() || "Notification Title Preview"}
                </p>
                <p className="text-xs text-slate-300 line-clamp-3">
                  {body.trim() || "Your message body text will appear here on customer and vendor lock-screens."}
                </p>
                {imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden h-28 bg-slate-700/50">
                    <img src={imageUrl} alt="banner" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Dispatch Guardrails
              </div>
              <ul className="text-xs text-amber-800/90 space-y-1 list-disc list-inside">
                <li>Bypasses Quiet Hours (21:00 - 08:00 IST) for operational emergency testing.</li>
                <li>Automatically purges invalid tokens when Expo returns `DeviceNotRegistered`.</li>
                <li>Receipt check worker updates delivery status asynchronously.</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: AUDIT LOGS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Filter by recipient / token..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="skipped">Skipped</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <button
              onClick={() => fetchLogs()}
              disabled={logsLoading}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all self-end"
            >
              <RotateCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin" : ""}`} />
              Refresh Logs
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Title & Content</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Receipt / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading notification logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No notification logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const statusBadgeClass =
                      log.status === "sent" || log.status === "delivered"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : log.status === "skipped"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200";

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {log.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                          {log.recipient || log.userId || "-"}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-bold text-slate-800 truncate">{log.title}</div>
                          <div className="text-slate-500 truncate text-[11px]">{log.body}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-bold ${statusBadgeClass}`}
                          >
                            {log.status === "sent" || log.status === "delivered" ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : log.status === "skipped" ? (
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate">
                          {log.receiptStatus || log.skipReason || log.error || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold disabled:opacity-50 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-semibold disabled:opacity-50 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
