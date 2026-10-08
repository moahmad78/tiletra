"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BellRing,
  Plus,
  Send,
  UserCheck,
  PauseCircle,
  PlayCircle,
  Smartphone,
  Apple,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Copy,
  Trash2,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShoppingCart,
  Users,
} from "lucide-react";

interface CampaignItem {
  id: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  target: string;
  audience: any;
  platforms: string;
  sendMode: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "cancelled";
  scheduledAt?: string | null;
  sentAt?: string | null;
  createdBy?: string | null;
  stats?: {
    totalAudience: number;
    sent: number;
    skipped: number;
    failed: number;
    androidSent?: number;
    iosSent?: number;
    skipReasons?: Record<string, number>;
  } | null;
  createdAt: string;
  _count?: { logs: number };
}

interface StorePushSettings {
  offersPaused: boolean;
  cartRemindersPaused: boolean;
  maxPushPerDay: number;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export default function AdminCampaignsPage() {
  const [activeTab, setActiveTab] = useState<"campaigns" | "results">("campaigns");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [settings, setSettings] = useState<StorePushSettings>({
    offersPaused: false,
    cartRemindersPaused: false,
    maxPushPerDay: 2,
    quietHoursStart: "21:00",
    quietHoursEnd: "08:00",
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [showSendUserModal, setShowSendUserModal] = useState(false);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState<CampaignItem | null>(null);
  const [cartReminderResult, setCartReminderResult] = useState<any | null>(null);
  const [runningCartReminders, setRunningCartReminders] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formTarget, setFormTarget] = useState("offers");
  const [formPlatforms, setFormPlatforms] = useState<"all" | "android" | "ios">("all");
  const [formAudienceType, setFormAudienceType] = useState<string>("all");
  const [formAudienceDays, setFormAudienceDays] = useState<number>(30);
  const [formAudienceCity, setFormAudienceCity] = useState<string>("");
  const [formScheduledAt, setFormScheduledAt] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Audience Preview State
  const [audiencePreview, setAudiencePreview] = useState<{
    totalUsers: number;
    totalTokens: number;
    androidCount: number;
    iosCount: number;
  }>({ totalUsers: 0, totalTokens: 0, androidCount: 0, iosCount: 0 });
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Send to one user state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userMsgTitle, setUserMsgTitle] = useState("");
  const [userMsgBody, setUserMsgBody] = useState("");
  const [sendingUserMsg, setSendingUserMsg] = useState(false);
  const [userMsgSuccess, setUserMsgSuccess] = useState<string | null>(null);

  // Results Tab State
  const [resultsData, setResultsData] = useState<any | null>(null);
  const [loadingResults, setLoadingResults] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/campaigns");
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.campaigns || []);
        if (data.storeSettings) {
          setSettings(data.storeSettings);
        }
      } else {
        setError(data.error || "Failed to load campaigns");
      }
    } catch (err: any) {
      setError(err?.message || "Network error loading campaigns");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchResults = useCallback(async () => {
    try {
      setLoadingResults(true);
      const res = await fetch("/api/admin/campaigns/results");
      const data = await res.json();
      if (data.success) {
        setResultsData(data);
      }
    } catch (err) {
      console.error("Failed to load results:", err);
    } finally {
      setLoadingResults(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (activeTab === "results") {
      fetchResults();
    }
  }, [activeTab, fetchResults]);

  // Update audience preview when audience inputs change
  useEffect(() => {
    if (!showCreateModal) return;

    const timeout = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const payload = {
          audience: {
            type: formAudienceType,
            days: formAudienceDays,
            city: formAudienceCity,
          },
          platforms: formPlatforms,
        };
        const res = await fetch("/api/admin/campaigns/audience-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success && data.preview) {
          setAudiencePreview(data.preview);
        }
      } catch (err) {
        console.error("Audience preview failed:", err);
      } finally {
        setLoadingPreview(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [showCreateModal, formAudienceType, formAudienceDays, formAudienceCity, formPlatforms]);

  // Handle Pause Switch Toggle
  const handleTogglePause = async (target: "offers" | "cart_reminders") => {
    const nextVal = target === "offers" ? !settings.offersPaused : !settings.cartRemindersPaused;
    try {
      const res = await fetch("/api/admin/campaigns/pause-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, paused: nextVal }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          offersPaused: data.offersPaused,
          cartRemindersPaused: data.cartRemindersPaused,
        }));
      }
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    }
  };

  // Run Cart Reminders Now
  const handleRunCartRemindersNow = async () => {
    try {
      setRunningCartReminders(true);
      const res = await fetch("/api/admin/campaigns/run-cart-reminders", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setCartReminderResult(data);
      }
    } catch (err: any) {
      alert("Failed to run cart reminders: " + err?.message);
    } finally {
      setRunningCartReminders(false);
    }
  };

  // Open Create Modal
  const openCreateModal = (campaign?: CampaignItem) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormTitle(campaign.title);
      setFormBody(campaign.body);
      setFormImageUrl(campaign.imageUrl || "");
      setFormTarget(campaign.target || "offers");
      setFormPlatforms((campaign.platforms as any) || "all");
      setFormAudienceType(campaign.audience?.type || "all");
      setFormAudienceDays(campaign.audience?.days || 30);
      setFormAudienceCity(campaign.audience?.city || "");
      setFormScheduledAt(
        campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ""
      );
    } else {
      setEditingCampaign(null);
      setFormTitle("");
      setFormBody("");
      setFormImageUrl("");
      setFormTarget("offers");
      setFormPlatforms("all");
      setFormAudienceType("all");
      setFormAudienceDays(30);
      setFormAudienceCity("");
      setFormScheduledAt("");
    }
    setShowCreateModal(true);
  };

  // Save or Schedule Campaign
  const handleSaveCampaign = async (action: "draft" | "schedule" | "send_now") => {
    if (!formTitle.trim()) {
      alert("Title is required");
      return;
    }
    if (!formBody.trim()) {
      alert("Message body is required");
      return;
    }
    if (action === "schedule" && !formScheduledAt) {
      alert("Please select a scheduled date and time");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formTitle,
        body: formBody,
        imageUrl: formImageUrl || null,
        target: formTarget,
        platforms: formPlatforms,
        audience: {
          type: formAudienceType,
          days: formAudienceDays,
          city: formAudienceCity,
        },
        action,
        scheduledAt: formScheduledAt ? new Date(formScheduledAt).toISOString() : null,
      };

      const res = await fetch("/api/admin/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        fetchCampaigns();
        if (data.scheduledForQuietHours) {
          alert(
            "Notice: Because it is currently quiet hours (21:00 - 08:00 IST), this campaign has been safely scheduled to send at 08:00 IST tomorrow morning per Rule R-4."
          );
        }
      } else {
        alert(data.error || "Failed to save campaign");
      }
    } catch (err: any) {
      alert(err?.message || "Error saving campaign");
    } finally {
      setSubmitting(false);
    }
  };

  // Dispatch Send Now for an existing campaign
  const handleSendNowConfirm = async () => {
    if (!showConfirmSendModal) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/campaigns/${showConfirmSendModal.id}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setShowConfirmSendModal(null);
        fetchCampaigns();
        if (data.scheduledForQuietHours) {
          alert(
            "Notice: Inside quiet hours (21:00 - 08:00 IST). Campaign scheduled for 08:00 IST per Rule R-4."
          );
        } else {
          alert(`Campaign dispatched! Sent: ${data.stats?.sent || 0}, Skipped: ${data.stats?.skipped || 0}`);
        }
      } else {
        alert(data.error || "Failed to send campaign");
      }
    } catch (err: any) {
      alert(err?.message || "Dispatch error");
    } finally {
      setSubmitting(false);
    }
  };

  // Test Push Send to Admin
  const handleTestSend = async () => {
    if (!formTitle.trim() || !formBody.trim()) {
      alert("Please enter title and body first");
      return;
    }
    const phone = prompt("Enter phone number for test push delivery (or leave blank for any active token):");
    try {
      const res = await fetch("/api/admin/campaigns/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          body: formBody,
          imageUrl: formImageUrl || null,
          target: formTarget,
          platform: formPlatforms,
          recipientPhone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Test push notification dispatched successfully!");
      } else {
        alert("Test send skipped/failed: " + (data.skipReason || data.error));
      }
    } catch (err: any) {
      alert("Test send error: " + err?.message);
    }
  };

  // Search User for "Send to one user"
  const handleUserSearch = async (q: string) => {
    setUserSearchQuery(q);
    if (q.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/admin/campaigns/send-user?q=${encodeURIComponent(q.trim())}`);
      const data = await res.json();
      if (data.success) {
        setUserSearchResults(data.users || []);
      }
    } catch {}
  };

  // Send Direct Message to User (Rule R-14)
  const handleSendToUser = async () => {
    if (!selectedUser) return;
    if (!userMsgTitle.trim() || !userMsgBody.trim()) {
      alert("Title and message body are required");
      return;
    }
    try {
      setSendingUserMsg(true);
      setUserMsgSuccess(null);
      const res = await fetch("/api/admin/campaigns/send-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          title: userMsgTitle,
          body: userMsgBody,
          adminName: "SuperAdmin",
        }),
      });
      const data = await res.json();
      if (data.success && data.status === "sent") {
        setUserMsgSuccess("Push message sent directly to " + (selectedUser.name || selectedUser.phone) + "!");
        setUserMsgTitle("");
        setUserMsgBody("");
      } else {
        alert("Push skipped/failed: " + (data.skipReason || data.error || "No active tokens"));
      }
    } catch (err: any) {
      alert("Error: " + err?.message);
    } finally {
      setSendingUserMsg(false);
    }
  };

  // Cancel Scheduled Campaign
  const handleCancelCampaign = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this scheduled campaign?")) return;
    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      }
    } catch (err: any) {
      alert("Error cancelling campaign: " + err?.message);
    }
  };

  // Quiet Hours Warning Check
  const isScheduledInQuietHours = () => {
    if (!formScheduledAt) return false;
    const date = new Date(formScheduledAt);
    const kolkataHour = (date.getUTCHours() + 5.5) % 24;
    return kolkataHour >= 21 || kolkataHour < 8;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Push Campaigns & Cart Reminders</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-[#052a51]">
              PRD v1.1
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Automated abandoned-cart ladders, offer campaigns, cross-platform Android & iOS delivery.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunCartRemindersNow}
            disabled={runningCartReminders}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            <RotateCw className={`w-4 h-4 text-gray-500 ${runningCartReminders ? "animate-spin" : ""}`} />
            Run Cart Reminders Now
          </button>

          <button
            onClick={() => {
              setSelectedUser(null);
              setUserSearchQuery("");
              setUserSearchResults([]);
              setUserMsgTitle("");
              setUserMsgBody("");
              setUserMsgSuccess(null);
              setShowSendUserModal(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Send to One User
          </button>

          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#052a51] rounded-lg hover:bg-[#07386c] transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Top Global Pause Controls Card (Rule R-16) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Offers Pause Switch */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            settings.offersPaused
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-gray-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  settings.offersPaused ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-[#052a51]"
                }`}
              >
                {settings.offersPaused ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Offer Campaigns</h3>
                <p className="text-xs text-gray-500">
                  {settings.offersPaused
                    ? "PAUSED — All promotional push sends are skipped"
                    : "ACTIVE — Broadcast offers and scheduled campaigns sending normally"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTogglePause("offers")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                settings.offersPaused
                  ? "bg-amber-600 text-white border-transparent hover:bg-amber-700"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {settings.offersPaused ? "Resume Offers" : "Pause All Offers"}
            </button>
          </div>
        </div>

        {/* Cart Reminders Pause Switch */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            settings.cartRemindersPaused
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-gray-200 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  settings.cartRemindersPaused
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {settings.cartRemindersPaused ? (
                  <PauseCircle className="w-6 h-6" />
                ) : (
                  <ShoppingCart className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cart Reminders Ladder</h3>
                <p className="text-xs text-gray-500">
                  {settings.cartRemindersPaused
                    ? "PAUSED — Automatic abandoned cart reminders stopped"
                    : "ACTIVE — Automatic 1h / 24h / 72h reminders running"}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleTogglePause("cart_reminders")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                settings.cartRemindersPaused
                  ? "bg-amber-600 text-white border-transparent hover:bg-amber-700"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {settings.cartRemindersPaused ? "Resume Cart Reminders" : "Pause Cart Reminders"}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "campaigns"
                ? "border-[#052a51] text-[#052a51]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Campaigns ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "results"
                ? "border-[#052a51] text-[#052a51]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Analytics & Delivery Results (T10)
          </button>
        </nav>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchCampaigns}
            className="text-xs font-semibold underline hover:text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tab 1: Campaigns List */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center">
              <BellRing className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No campaigns created yet</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Create an offer campaign with deep links to drive engagement and bring customers back.
              </p>
              <button
                onClick={() => openCreateModal()}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#052a51] rounded-lg hover:bg-[#07386c]"
              >
                <Plus className="w-4 h-4" />
                Create First Campaign
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-6 py-3.5">Campaign</th>
                    <th className="px-6 py-3.5">Platform</th>
                    <th className="px-6 py-3.5">Target</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Delivery Results</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {campaigns.map((camp) => {
                    const stats = camp.stats;
                    return (
                      <tr key={camp.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">{camp.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">{camp.body}</div>
                          <div className="text-[11px] text-gray-400 mt-1">
                            {camp.scheduledAt
                              ? `Scheduled: ${new Date(camp.scheduledAt).toLocaleString("en-IN")}`
                              : `Created: ${new Date(camp.createdAt).toLocaleDateString("en-IN")}`}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                            {camp.platforms === "android" ? (
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                            ) : camp.platforms === "ios" ? (
                              <Apple className="w-3.5 h-3.5 text-gray-700" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {camp.platforms === "android"
                              ? "Android"
                              : camp.platforms === "ios"
                              ? "iPhone"
                              : "All Devices"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                            {camp.target}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              camp.status === "sent"
                                ? "bg-emerald-100 text-emerald-800"
                                : camp.status === "scheduled"
                                ? "bg-blue-100 text-blue-800"
                                : camp.status === "sending"
                                ? "bg-amber-100 text-amber-800"
                                : camp.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {camp.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          {stats ? (
                            <div className="text-xs space-y-0.5">
                              <div className="text-gray-900 font-medium">
                                Sent: <span className="text-emerald-600 font-semibold">{stats.sent}</span> /{" "}
                                {stats.totalAudience}
                              </div>
                              <div className="text-gray-500 text-[11px]">
                                Android: {stats.androidSent ?? stats.sent} • iOS: {stats.iosSent ?? 0}
                              </div>
                              {stats.skipped > 0 && (
                                <div className="text-amber-600 text-[11px]">
                                  Skipped: {stats.skipped} (cap/quiet)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right space-x-2">
                          {camp.status === "draft" && (
                            <button
                              onClick={() => setShowConfirmSendModal(camp)}
                              className="text-xs font-semibold text-[#052a51] hover:underline"
                            >
                              Send Now
                            </button>
                          )}

                          {camp.status === "scheduled" && (
                            <button
                              onClick={() => handleCancelCampaign(camp.id)}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => openCreateModal(camp)}
                            className="text-xs font-semibold text-gray-600 hover:underline"
                          >
                            {camp.status === "sent" ? "Duplicate" : "Edit"}
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

      {/* Tab 2: Results & Analytics (T10) */}
      {activeTab === "results" && (
        <div className="space-y-6">
          {loadingResults ? (
            <div className="p-12 text-center text-gray-500 bg-white rounded-xl border">
              <div className="w-8 h-8 border-3 border-[#052a51] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Aggregating delivery results & attribution metrics...
            </div>
          ) : resultsData ? (
            <>
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sent (30d)
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mt-2">
                    {resultsData.platformTotals?.all?.sent ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>Android: {resultsData.platformTotals?.android?.sent ?? 0}</span>
                    <span>•</span>
                    <span>iOS: {resultsData.platformTotals?.ios?.sent ?? 0}</span>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Opened (Taps)
                  </div>
                  <div className="text-2xl font-bold text-emerald-600 mt-2">
                    {resultsData.platformTotals?.all?.opened ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Open Rate:{" "}
                    {resultsData.platformTotals?.all?.sent > 0
                      ? (
                          (resultsData.platformTotals.all.opened /
                            resultsData.platformTotals.all.sent) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cart Reminders Sent
                  </div>
                  <div className="text-2xl font-bold text-[#052a51] mt-2">
                    {resultsData.cartReminders?.totalSent ?? 0}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Delivered via 1h, 24h & 72h ladder
                  </div>
                </div>

                <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-xs bg-emerald-50/50">
                  <div className="text-xs font-medium text-emerald-800 uppercase tracking-wider flex items-center justify-between">
                    <span>Orders Within 24h</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 mt-2">
                    {resultsData.cartReminders?.convertedOrders24h ?? 0}
                  </div>
                  <div className="text-xs text-emerald-600 font-medium mt-1">
                    {resultsData.cartReminders?.conversionRate ?? 0}% Conversion Rate
                  </div>
                </div>
              </div>

              {/* Daily Trend Table */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 font-semibold text-gray-900">
                  Daily Delivery Breakdown (Android vs iPhone)
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Total Sent</th>
                        <th className="px-6 py-3">Android Sent</th>
                        <th className="px-6 py-3">iOS Sent</th>
                        <th className="px-6 py-3">Opened</th>
                        <th className="px-6 py-3">Skipped</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(resultsData.dailyTrend || []).map((day: any) => (
                        <tr key={day.date} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3.5 font-medium text-gray-900">{day.date}</td>
                          <td className="px-6 py-3.5 font-semibold text-gray-800">{day.sent}</td>
                          <td className="px-6 py-3.5 text-gray-600">{day.androidSent}</td>
                          <td className="px-6 py-3.5 text-gray-600">{day.iosSent}</td>
                          <td className="px-6 py-3.5 text-emerald-600 font-medium">{day.opened}</td>
                          <td className="px-6 py-3.5 text-amber-600">{day.skipped}</td>
                        </tr>
                      ))}
                      {(!resultsData.dailyTrend || resultsData.dailyTrend.length === 0) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            No logs recorded in the last 30 days
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ── CREATE / EDIT CAMPAIGN MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 p-6 space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {editingCampaign && editingCampaign.status === "draft"
                    ? "Edit Campaign"
                    : editingCampaign
                    ? "Duplicate Campaign"
                    : "Create Push Campaign"}
                </h3>
                <p className="text-xs text-gray-500">
                  Compose push message, configure target audience, and select device platform.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title with Character Counter (Max 40) */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  <label>Title (Max 40 chars)</label>
                  <span
                    className={
                      formTitle.length > 40
                        ? "text-red-500 font-bold"
                        : "text-gray-400"
                    }
                  >
                    {formTitle.length}/40
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={40}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Navratri Special: Flat 20% Off Tiles"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#052a51]"
                />
              </div>

              {/* Body with Character Counter (Max 90) */}
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-1">
                  <label>Message Body (Max 90 chars)</label>
                  <span
                    className={
                      formBody.length > 90
                        ? "text-red-500 font-bold"
                        : "text-gray-400"
                    }
                  >
                    {formBody.length}/90
                  </span>
                </div>
                <textarea
                  rows={2}
                  maxLength={90}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="e.g. Upgrade your home floors with premium vitrified tiles at unbelievable factory prices."
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#052a51]"
                />
              </div>

              {/* Image URL & Deep Link Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://.../banner.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Deep Link Target
                  </label>
                  <select
                    value={formTarget}
                    onChange={(e) => setFormTarget(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="offers">offers (Home / Offers Screen)</option>
                    <option value="cart">cart (Customer Cart)</option>
                    <option value="category:floor-tiles">category:floor-tiles</option>
                    <option value="category:wall-tiles">category:wall-tiles</option>
                    <option value="category:adhesives">category:adhesives</option>
                  </select>
                </div>
              </div>

              {/* Platform Selector (Rule R-12) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Target Platform (Cross-Platform Rule R-12)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "all", label: "All Devices", icon: Users },
                    { id: "android", label: "Android Only", icon: Smartphone },
                    { id: "ios", label: "iPhone Only", icon: Apple },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFormPlatforms(p.id as any)}
                        className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                          formPlatforms === p.id
                            ? "bg-[#052a51] text-white border-[#052a51]"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Audience Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Audience Filter
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={formAudienceType}
                    onChange={(e) => setFormAudienceType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="all">All Registered Customers</option>
                    <option value="cart_has_items">Customers with Items in Cart</option>
                    <option value="no_orders_days">No Orders in Past N Days</option>
                    <option value="ordered_days">Ordered in Last N Days</option>
                    <option value="city">Customers by City</option>
                  </select>

                  {formAudienceType === "no_orders_days" && (
                    <input
                      type="number"
                      min={1}
                      value={formAudienceDays}
                      onChange={(e) => setFormAudienceDays(Number(e.target.value))}
                      placeholder="Days (e.g. 30)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}

                  {formAudienceType === "ordered_days" && (
                    <input
                      type="number"
                      min={1}
                      value={formAudienceDays}
                      onChange={(e) => setFormAudienceDays(Number(e.target.value))}
                      placeholder="Days (e.g. 7)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}

                  {formAudienceType === "city" && (
                    <input
                      type="text"
                      value={formAudienceCity}
                      onChange={(e) => setFormAudienceCity(e.target.value)}
                      placeholder="City name (e.g. Moradabad)"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  )}
                </div>
              </div>

              {/* Live Audience Preview Box (Section 4 T7) */}
              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-[#052a51]">Audience Live Preview:</div>
                  <div className="text-gray-600 mt-0.5">
                    {loadingPreview ? (
                      <span className="text-gray-400">Calculating reach...</span>
                    ) : (
                      <>
                        <span className="font-bold text-gray-900">{audiencePreview.totalUsers}</span> users
                        (
                        <span className="text-emerald-700 font-medium">
                          {audiencePreview.androidCount} Android
                        </span>
                        {" • "}
                        <span className="text-blue-700 font-medium">
                          {audiencePreview.iosCount} iPhone
                        </span>
                        )
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right text-[11px] text-gray-500">
                  {formPlatforms === "all" ? "Both FCM & APNs" : formPlatforms.toUpperCase()}
                </div>
              </div>

              {/* Schedule Date & Time Picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Schedule Delivery (Optional — leave blank to Send Now or Save Draft)
                </label>
                <input
                  type="datetime-local"
                  value={formScheduledAt}
                  onChange={(e) => setFormScheduledAt(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm"
                />
                {isScheduledInQuietHours() && (
                  <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Notice: Selected time falls into quiet hours (21:00 - 08:00 IST). Under Rule R-4,
                      this message will be dispatched at 08:00 IST.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleTestSend}
                className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Send Test Push
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleSaveCampaign("draft")}
                  className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Save Draft
                </button>

                {formScheduledAt ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveCampaign("schedule")}
                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {submitting ? "Scheduling..." : "Schedule Campaign"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSaveCampaign("send_now")}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#052a51] rounded-lg hover:bg-[#07386c]"
                  >
                    {submitting ? "Sending..." : "Send Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND NOW CONFIRMATION DIALOG ── */}
      {showConfirmSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Confirm Immediate Send</h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to send{" "}
              <span className="font-semibold text-gray-900">&quot;{showConfirmSendModal.title}&quot;</span> now?
            </p>

            <div className="p-3 bg-gray-50 rounded-lg text-xs space-y-1 text-gray-600">
              <div>
                Platform: <span className="font-semibold text-gray-900">{showConfirmSendModal.platforms}</span>
              </div>
              <div>
                Quiet Hours Guard:{" "}
                <span className="font-semibold text-emerald-600">Enforced (21:00 - 08:00 IST)</span>
              </div>
              <div>
                Frequency Cap: <span className="font-semibold text-emerald-600">Max 2 per day</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmSendModal(null)}
                className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSendNowConfirm}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#052a51] rounded-lg hover:bg-[#07386c]"
              >
                {submitting ? "Dispatching..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND TO ONE USER MODAL (RULE R-14) ── */}
      {showSendUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Send to One User (Support Message)</h3>
                <p className="text-xs text-gray-500">
                  Rule R-14: Bypasses daily cap and quiet hours for urgent support or order assistance.
                </p>
              </div>
              <button
                onClick={() => setShowSendUserModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {userMsgSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {userMsgSuccess}
              </div>
            )}

            {/* Search User */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Find User by Name, Phone, or Email
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Type name, 10-digit mobile, or email..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              {userSearchResults.length > 0 && !selectedUser && (
                <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y bg-white">
                  {userSearchResults.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="p-2.5 hover:bg-gray-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{u.name || "Customer"}</div>
                        <div className="text-gray-500">{u.phone || u.email}</div>
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {u.deviceTokens?.length || 0} device(s)
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="mt-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-900">{selectedUser.name || "Customer"}</span>
                    <span className="text-gray-500 ml-2">({selectedUser.phone || selectedUser.email})</span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>

            {/* Message Inputs */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message Title</label>
              <input
                type="text"
                maxLength={40}
                value={userMsgTitle}
                onChange={(e) => setUserMsgTitle(e.target.value)}
                placeholder="e.g. Update on your recent enquiry"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Message Body</label>
              <textarea
                rows={2}
                maxLength={90}
                value={userMsgBody}
                onChange={(e) => setUserMsgBody(e.target.value)}
                placeholder="e.g. We have reserved your requested tile boxes. Please check your cart."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSendUserModal(false)}
                className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg"
              >
                Close
              </button>
              <button
                disabled={sendingUserMsg || !selectedUser}
                onClick={handleSendToUser}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#052a51] rounded-lg hover:bg-[#07386c] disabled:opacity-50"
              >
                {sendingUserMsg ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RUN CART REMINDERS RESULT DIALOG ── */}
      {cartReminderResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-gray-900">Cart Reminders Execution Summary</h3>
              <button onClick={() => setCartReminderResult(null)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">Processed:</div>
                <div className="text-lg font-bold text-gray-900">{cartReminderResult.processed}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <div className="text-emerald-700 font-medium">Sent:</div>
                <div className="text-lg font-bold text-emerald-700">{cartReminderResult.sent}</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg">
                <div className="text-amber-700 font-medium">Skipped:</div>
                <div className="text-lg font-bold text-amber-700">{cartReminderResult.skipped}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">Stopped:</div>
                <div className="text-lg font-bold text-gray-900">{cartReminderResult.stopped}</div>
              </div>
            </div>

            {cartReminderResult.skipReasons && Object.keys(cartReminderResult.skipReasons).length > 0 && (
              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg space-y-1">
                <div className="font-semibold text-gray-700">Skip Reasons:</div>
                {Object.entries(cartReminderResult.skipReasons).map(([reason, count]) => (
                  <div key={reason} className="flex justify-between">
                    <span>{reason}:</span>
                    <span className="font-mono">{String(count)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-right">
              <button
                onClick={() => setCartReminderResult(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#052a51] rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
