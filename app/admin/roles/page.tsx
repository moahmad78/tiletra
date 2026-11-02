"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Users,
  Smartphone,
  Lock,
  UserCheck,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  KeyRound,
  Shield,
  Laptop,
} from "lucide-react";
import {
  getTeamMembers,
  updateUserRole,
  getActiveSessionsAndDevices,
  revokeSessionToken,
} from "@/lib/actions/roles";
import { toast } from "sonner";

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState<"team" | "sessions" | "matrix">("team");
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any>(null);
  const [sessionsData, setSessionsData] = useState<any>(null);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [tRes, sRes] = await Promise.all([
        getTeamMembers(),
        getActiveSessionsAndDevices(),
      ]);
      if (tRes.success) setTeamData(tRes);
      if (sRes.success) setSessionsData(sRes);
    } catch {
      toast.error("Failed to load roles and session telemetry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (userId: string, newRole: any) => {
    try {
      setProcessingUserId(userId);
      const res = await updateUserRole({ userId, newRole });
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error);
      }
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRevokeSession = async (tokenId: string, type: "device" | "mobile") => {
    if (!confirm("Are you sure you want to revoke this active session/token?")) return;
    try {
      setRevokingTokenId(tokenId);
      const res = await revokeSessionToken(tokenId, type);
      if (res.success) {
        toast.success(res.message);
        loadData();
      } else {
        toast.error(res.error);
      }
    } finally {
      setRevokingTokenId(null);
    }
  };

  const counts = teamData?.counts || { admin: 0, staff: 0, cpo: 0, vendor: 0, customer: 0, total: 0 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-[#052a51]">Roles & Session Security</h1>
            <span className="text-[11px] font-bold bg-[#F26522]/10 text-[#F26522] px-2.5 py-0.5 rounded-full">
              Modules 6 & 15
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Role-Based Access Control (RBAC), team permissions, active mobile device tokens & session revocation
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#052a51] bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh Security State
        </button>
      </div>

      {/* Role Counts Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 text-center">
          <div className="text-xs font-bold text-gray-400 uppercase">Super Admins</div>
          <div className="text-xl font-black text-[#052a51] mt-1">{counts.admin}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 text-center">
          <div className="text-xs font-bold text-gray-400 uppercase">Operations Staff</div>
          <div className="text-xl font-black text-indigo-600 mt-1">{counts.staff}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 text-center">
          <div className="text-xs font-bold text-gray-400 uppercase">CPO Managers</div>
          <div className="text-xl font-black text-purple-600 mt-1">{counts.cpo}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 text-center">
          <div className="text-xs font-bold text-gray-400 uppercase">Vendors</div>
          <div className="text-xl font-black text-[#F26522] mt-1">{counts.vendor}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200/80 text-center col-span-2 sm:col-span-1">
          <div className="text-xs font-bold text-gray-400 uppercase">Active Devices</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{sessionsData?.totalSessions || 0}</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab("team")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "team"
              ? "bg-[#052a51] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Team & Admin Roles ({teamData?.team?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("sessions")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "sessions"
              ? "bg-[#052a51] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Active Sessions & Devices ({sessionsData?.totalSessions || 0})
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === "matrix"
              ? "bg-[#052a51] text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Permissions Matrix
        </button>
      </div>

      {/* TAB 1: Team & Roles */}
      {activeTab === "team" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#F26522]" />
              <p className="text-xs font-bold text-gray-500">Loading team roles...</p>
            </div>
          ) : !teamData?.team || teamData.team.length === 0 ? (
            <div className="p-16 text-center text-gray-500 text-xs font-bold">
              No privileged team members found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Member Name</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {teamData.team.map((user: any) => {
                    const isBusy = processingUserId === user.id;

                    return (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#052a51]">{user.name || "Team Member"}</div>
                          <div className="text-[10px] text-gray-400 font-mono">{user.id}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-800 font-semibold">{user.email || "—"}</div>
                          <div className="text-[11px] text-gray-500 font-mono">{user.phone}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              user.role === "admin"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : user.role === "cpo"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <select
                            value={user.role}
                            disabled={isBusy}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-[#052a51] cursor-pointer focus:outline-hidden disabled:opacity-50"
                          >
                            <option value="admin">Super Admin</option>
                            <option value="staff">Operations Staff</option>
                            <option value="cpo">CPO Manager</option>
                            <option value="customer">Demote to Customer</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Active Sessions & Device Telemetry (Module 15) */}
      {activeTab === "sessions" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="text-xs font-bold text-[#052a51]">
              Live Active Push Tokens & Device Sessions ({sessionsData?.sessions?.length || 0})
            </div>
            <span className="text-[11px] text-gray-500">
              Revoking a session immediately cancels mobile push routing for that device.
            </span>
          </div>

          {!sessionsData?.sessions || sessionsData.sessions.length === 0 ? (
            <div className="p-16 text-center text-gray-500 text-xs font-bold">
              No registered devices found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Token Snippet</th>
                    <th className="py-3 px-4">Last Telemetry Active</th>
                    <th className="py-3 px-4 text-right">Force Logout / Revoke</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sessionsData.sessions.map((sess: any) => {
                    const isRevoking = revokingTokenId === sess.id;

                    return (
                      <tr key={sess.id} className="hover:bg-gray-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#052a51]">
                            {sess.user?.name || sess.user?.phone || sess.userId || "Active Device"}
                          </div>
                          <div className="text-[10px] text-gray-400 capitalize">
                            Role: {sess.user?.role || "user"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-gray-700 capitalize bg-gray-100 px-2 py-0.5 rounded-md text-[10px]">
                            {sess.platform === "android" ? <Smartphone size={10} /> : <Laptop size={10} />}
                            {sess.platform || "android"}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                          {sess.tokenSnippet}
                        </td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(sess.updatedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleRevokeSession(sess.id, sess.type)}
                            disabled={isRevoking}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                          >
                            <Trash2 size={11} />
                            {isRevoking ? "Revoking..." : "Revoke Session"}
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
      )}

      {/* TAB 3: Permissions Matrix */}
      {activeTab === "matrix" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-6 space-y-4">
          <div>
            <h3 className="text-sm font-black text-[#052a51]">Role-Based Access Control (RBAC) Matrix</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Defines operational boundaries and read/write security per platform role
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl">
              <thead className="bg-[#052a51] text-white font-bold text-[11px]">
                <tr>
                  <th className="py-3 px-4">Feature / Module</th>
                  <th className="py-3 px-4 text-center">Super Admin</th>
                  <th className="py-3 px-4 text-center">Operations Staff</th>
                  <th className="py-3 px-4 text-center">CPO Partner</th>
                  <th className="py-3 px-4 text-center">Vendor</th>
                  <th className="py-3 px-4 text-center">Customer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-semibold">
                <tr>
                  <td className="py-3 px-4 text-gray-800">Financial Ledgers & Payouts</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-gray-400">View Only</td>
                  <td className="py-3 px-4 text-center text-gray-400">Own Only</td>
                  <td className="py-3 px-4 text-center text-gray-400">Own Splits</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-800">Order Dispatch & Rider Allocation</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-gray-400">Accept/Pack</td>
                  <td className="py-3 px-4 text-center text-gray-400">View Order</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-800">Product Approval & Catalog CMS</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-gray-400">Submit Items</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-800">Push Notifications & Broadcast Campaigns</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-gray-800">Store Settings & App Version Control</td>
                  <td className="py-3 px-4 text-center text-emerald-600 font-black">Full R/W</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                  <td className="py-3 px-4 text-center text-red-400">None</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
