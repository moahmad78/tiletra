"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Zap,
  Clock,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  UserCheck,
  RefreshCw,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Headphones,
} from "lucide-react";

type DashboardStats = {
  totalChats: number;
  activeChats: number;
  aiResolutionRate: string;
  totalMessages: number;
  aiMessages: number;
  humanMessages: number;
  customerMessages: number;
  totalKnowledgeChunks: number;
  recentChats: Array<{
    id: string;
    customer_phone: string;
    customer_name: string | null;
    chat_mode: "human" | "ai";
    last_message_at: string;
  }>;
  businessName: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const totalProcessed = stats ? stats.aiMessages + stats.humanMessages + stats.customerMessages : 0;
  const aiPercentage = totalProcessed > 0 && stats ? Math.round((stats.aiMessages / totalProcessed) * 100) : 0;
  const humanPercentage = totalProcessed > 0 && stats ? Math.round((stats.humanMessages / totalProcessed) * 100) : 0;
  const customerPercentage = totalProcessed > 0 && stats ? Math.round((stats.customerMessages / totalProcessed) * 100) : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#F26522] uppercase tracking-widest mb-1.5">
            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
            Intrihub WhatsApp Live Support
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#052A51] flex items-center gap-3">
            <span>{stats?.businessName || "IntriHub"} Customer Desk</span>
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Live analytics and direct customer conversations for Intrihub tiles, sanitaryware, and building materials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-all shadow-2xs"
            title="Refresh Live Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#F26522]/20 transition-all"
          >
            <MessageSquare className="h-4 w-4" />
            Open WhatsApp Inbox
          </Link>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="flex items-center justify-center py-24 text-slate-500 gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#F26522]" />
          Loading Intrihub customer analytics...
        </div>
      ) : (
        <>
          {/* Metric Cards */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-[#F26522]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Customer Leads</span>
                <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-[#F26522]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.totalChats || 0}</p>
              <p className="mt-1 text-xs text-slate-500">WhatsApp customer inquiries</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-[#F26522]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Today</span>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-[#1E9E6B]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.activeChats || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Live sessions in last 24h</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-[#F26522]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Instant Resolution</span>
                <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                  <Headphones className="h-4 w-4 text-[#F26522]" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.aiResolutionRate || "0%"}</p>
              <p className="mt-1 text-xs text-slate-500">Instant answers provided</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs hover:border-[#F26522]/50 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Catalog Knowledge</span>
                <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-slate-700" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.totalKnowledgeChunks || 0}</p>
              <p className="mt-1 text-xs text-slate-500">Indexed catalog & policy items</p>
            </div>
          </div>

          {/* Middle Section: Breakdown & Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Message Traffic Breakdown */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#052A51]">Inquiry Traffic & Handling</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Distribution between Instant Customer Desk and Direct Support Agents</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                  {stats?.totalMessages || 0} Total Messages
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
                <div style={{ width: `${aiPercentage}%` }} className="bg-[#F26522] h-full" title={`Instant Desk: ${aiPercentage}%`} />
                <div style={{ width: `${humanPercentage}%` }} className="bg-[#052A51] h-full" title={`Direct Agent: ${humanPercentage}%`} />
                <div style={{ width: `${customerPercentage}%` }} className="bg-[#25D366] h-full" title={`Customer: ${customerPercentage}%`} />
              </div>

              {/* Breakdown details */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F26522]" />
                    Instant Support Desk
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-[#052A51]">{stats?.aiMessages || 0}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#052A51]" />
                    Direct Support Agent
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-[#052A51]">{stats?.humanMessages || 0}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#25D366]" />
                    Customer Inbound
                  </div>
                  <p className="mt-1 text-lg font-extrabold text-[#052A51]">{stats?.customerMessages || 0}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#F26522]" />
                  Desk Management
                </h3>
                <p className="text-xs text-slate-500 mt-1">Configure Intrihub catalog & support guidelines</p>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/settings"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#F26522] hover:bg-orange-50/40 text-sm font-semibold text-slate-700 hover:text-[#052A51] transition-all group"
                >
                  <span className="flex items-center gap-2.5">
                    <BookOpen className="h-4 w-4 text-[#F26522]" />
                    Upload Intrihub Catalog & FAQs
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#F26522] transition-colors" />
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#F26522] hover:bg-orange-50/40 text-sm font-semibold text-slate-700 hover:text-[#052A51] transition-all group"
                >
                  <span className="flex items-center gap-2.5">
                    <Headphones className="h-4 w-4 text-[#052A51]" />
                    Review Executive Guidelines
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#F26522] transition-colors" />
                </Link>

                <Link
                  href="/chat"
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#F26522] hover:bg-orange-50/40 text-sm font-semibold text-slate-700 hover:text-[#052A51] transition-all group"
                >
                  <span className="flex items-center gap-2.5">
                    <UserCheck className="h-4 w-4 text-[#1E9E6B]" />
                    Take Over as Support Agent
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-[#F26522] transition-colors" />
                </Link>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-[#1E9E6B] font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Strict Intrihub Product Focus Enabled</span>
              </div>
            </div>
          </div>

          {/* Recent Conversations Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#F26522]" />
                Recent WhatsApp Conversations
              </h3>
              <Link href="/chat" className="text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center gap-1">
                View All Live Chats <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {stats?.recentChats && stats.recentChats.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.recentChats.map((chat) => (
                  <div key={chat.id} className="py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-sm font-bold text-[#052A51]">
                        {chat.customer_name ? chat.customer_name[0].toUpperCase() : chat.customer_phone.slice(-2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#052A51]">
                          {chat.customer_name || chat.customer_phone}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">{chat.customer_phone}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold ${
                          chat.chat_mode === "ai"
                            ? "bg-orange-50 text-[#F26522] border border-orange-200"
                            : "bg-emerald-50 text-[#1E9E6B] border border-emerald-200"
                        }`}
                      >
                        {chat.chat_mode === "ai" ? "Instant Desk" : "Direct Agent"}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(chat.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-sm text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6">
                <MessageSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                No WhatsApp conversations yet. Customer inquiries from your WhatsApp Business number will appear here instantly.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
