"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageSquare,
  Mail,
  Search,
  Filter,
  Bot,
  Sparkles,
  Send,
  CheckCheck,
  Clock,
  User,
  ShieldCheck,
  FileText,
  Tag,
  AlertTriangle,
  RefreshCw,
  Plus,
  ChevronDown,
  Globe,
  ExternalLink,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sliders,
  Layers,
  Paperclip,
  Check,
  Copy,
  Info,
  BookOpen,
  ArrowRight,
  Eye,
  Radio,
  Share2,
} from "lucide-react";
import {
  ConnectConversationData,
  ConnectMessageData,
  ConnectCustomerData,
  ConnectTicketData,
  ConnectAiSuggestionResult,
  ConnectTemplateData,
  AiTone,
  ConnectKnowledgeItem,
} from "@/lib/connect/types";
import { DEFAULT_TEMPLATES, renderTemplateText } from "@/lib/connect/template-engine";
import { APPROVED_INTRIHUB_KNOWLEDGE } from "@/lib/connect/knowledge-data";

export default function IntriHubConnectPage() {
  // Navigation & Active View State
  const [activeTab, setActiveTab] = useState<"inbox" | "knowledge" | "templates" | "analytics">("inbox");
  const [channelFilter, setChannelFilter] = useState<"ALL" | "WHATSAPP" | "EMAIL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "PENDING" | "RESOLVED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Data States
  const [conversations, setConversations] = useState<ConnectConversationData[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConnectConversationData | null>(null);
  const [messages, setMessages] = useState<ConnectMessageData[]>([]);
  const [customer, setCustomer] = useState<ConnectCustomerData | null>(null);
  const [tickets, setTickets] = useState<ConnectTicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Translation & Language States
  const [showOriginals, setShowOriginals] = useState<Record<string, boolean>>({});
  const [agentTranslateTarget, setAgentTranslateTarget] = useState<string>("Hindi");
  const [agentDraftText, setAgentDraftText] = useState("");
  const [translatedDraft, setTranslatedDraft] = useState<string | null>(null);
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);

  // AI Suggestion States
  const [aiSuggestion, setAiSuggestion] = useState<ConnectAiSuggestionResult | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiTone, setAiTone] = useState<AiTone>("Professional");
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Templates & Notes Modal State
  const [templates, setTemplates] = useState<ConnectTemplateData[]>(DEFAULT_TEMPLATES);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [notesList, setNotesList] = useState<string[]>([
    "Customer requested bulk pricing for 100 pipes. Confirm warehouse delivery slot before closing.",
    "@Amit please review contractor GST ITC eligibility for this account.",
  ]);

  // New Ticket Form State
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicketSubject, setNewTicketSubject] = useState("");
  const [newTicketCategory, setNewTicketCategory] = useState("Product");
  const [newTicketPriority, setNewTicketPriority] = useState<"NORMAL" | "HIGH" | "URGENT">("NORMAL");

  // Website Scanner Simulation State
  const [scanResult, setScanResult] = useState<{ pages: number; status: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // 1. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (channelFilter !== "ALL") params.append("channel", channelFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const res = await fetch(`/api/connect/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (!selectedConvId && data.conversations.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    } finally {
      setLoading(false);
    }
  }, [channelFilter, statusFilter, searchQuery, selectedConvId]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // 2. Fetch Messages for Selected Conversation
  const fetchConversationDetails = useCallback(async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/connect/conversations/${convId}/messages`);
      const data = await res.json();
      if (data.success) {
        setSelectedConversation(data.conversation);
        setMessages(data.messages || []);
        setCustomer(data.customer || null);
        setTickets(data.tickets || []);

        // Automatically trigger AI reply suggestion for the latest inbound message
        const lastInbound = [...(data.messages || [])]
          .reverse()
          .find((m: ConnectMessageData) => m.direction === "INBOUND");

        if (lastInbound) {
          fetchAiSuggestion(lastInbound.body, convId, data.customer?.name, data.customer?.id);
        } else {
          setAiSuggestion(null);
        }
      }
    } catch (err) {
      console.error("Error loading conversation:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedConvId) {
      fetchConversationDetails(selectedConvId);
    }
  }, [selectedConvId, fetchConversationDetails]);

  // 3. Fetch AI Reply Suggestion (3-Layer Guardrails)
  const fetchAiSuggestion = async (
    msgText: string,
    convId?: string,
    custName?: string,
    custId?: string
  ) => {
    try {
      setLoadingAi(true);
      const res = await fetch("/api/connect/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerMessage: msgText,
          conversationId: convId || selectedConvId,
          customerName: custName || customer?.name,
          customerId: custId || customer?.id,
          tone: aiTone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiSuggestion(data.suggestion);
      }
    } catch (err) {
      console.error("AI suggest error:", err);
    } finally {
      setLoadingAi(false);
    }
  };

  // 4. Send Message (Agent to Customer)
  const handleSendMessage = async () => {
    if (!selectedConvId || !agentDraftText.trim()) return;

    try {
      const messageBody = translatedDraft || agentDraftText;
      const res = await fetch(`/api/connect/conversations/${selectedConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: messageBody,
          sender: "Amit (Support Lead)",
          channel: selectedConversation?.channel || "WHATSAPP",
          translatedBody: translatedDraft ? agentDraftText : undefined,
          detectedLanguage: translatedDraft ? agentTranslateTarget : "English",
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setAgentDraftText("");
        setTranslatedDraft(null);
        // Refresh conversation preview
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // 5. Decoupled Translation for Agent Draft
  const handleTranslateDraft = async () => {
    if (!agentDraftText.trim()) return;
    try {
      setIsTranslatingDraft(true);
      const res = await fetch("/api/connect/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: agentDraftText,
          toLanguage: agentTranslateTarget,
        }),
      });
      const data = await res.json();
      if (data.success && data.translation) {
        setTranslatedDraft(data.translation.translatedText);
      }
    } catch (err) {
      console.error("Draft translation error:", err);
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  // 6. Use Template
  const handleSelectTemplate = (template: ConnectTemplateData) => {
    const rendered = renderTemplateText(template.textContent, {
      customer_name: customer?.name || "Valued Customer",
      order_id: "IH-10291",
      product_name: "20mm PVC Conduit Pipes",
      delivery_address: customer?.city ? `${customer.city}, Karnataka` : "Bangalore",
    });
    setAgentDraftText(rendered);
    setShowTemplateModal(false);
  };

  // 7. Create Support Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !customer || !newTicketSubject.trim()) return;

    try {
      const res = await fetch("/api/connect/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          conversationId: selectedConvId,
          subject: newTicketSubject,
          category: newTicketCategory,
          priority: newTicketPriority,
        }),
      });
      const data = await res.json();
      if (data.success && data.ticket) {
        setTickets((prev) => [data.ticket, ...prev]);
        setShowNewTicketModal(false);
        setNewTicketSubject("");
      }
    } catch (err) {
      console.error("Failed to create ticket:", err);
    }
  };

  // 8. Add Internal Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setNotesList((prev) => [newNoteText.trim(), ...prev]);
    setNewNoteText("");
  };

  // 9. Website Scanner simulation
  const handleScanWebsite = async () => {
    setIsScanning(true);
    setTimeout(() => {
      setScanResult({
        pages: 184,
        status: "Scanned & Verified: 184 Pages, Products, Delivery Policies & FAQs ready for approval.",
      });
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#071321] text-slate-100 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="h-16 bg-[#0a192f] border-b border-cyan-900/40 px-4 md:px-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <HeadphonesIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">IntriHub Connect</h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-400">Unified Communication & AI Customer Support OS</p>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-[#051323] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "inbox"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Unified Inbox
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "knowledge"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Knowledge Base
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "templates"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Templates & Replies
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "analytics"
                ? "bg-cyan-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Analytics & SLA
          </button>
        </div>

        {/* Channels & Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              WhatsApp Business API
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Gmail & Outlook
            </span>
          </div>

          <button
            onClick={() => fetchConversations()}
            title="Refresh feeds"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "inbox" && (
          <div className="w-full flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* COLUMN 1: Unified Conversation List (320px - 360px on Desktop) */}
            <section className="w-full lg:w-84 xl:w-96 border-r border-slate-800/80 bg-[#091728] flex flex-col shrink-0">
              {/* Search & Channel Filters */}
              <div className="p-3 border-b border-slate-800/80 space-y-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages, order #, phone... (Ctrl+K)"
                    className="w-full pl-9 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Channel Switcher */}
                <div className="flex rounded-lg bg-slate-900/90 p-1 border border-slate-800">
                  <button
                    onClick={() => setChannelFilter("ALL")}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all ${
                      channelFilter === "ALL" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setChannelFilter("WHATSAPP")}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                      channelFilter === "WHATSAPP" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => setChannelFilter("EMAIL")}
                    className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-all flex items-center justify-center gap-1 ${
                      channelFilter === "EMAIL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Mail className="h-3 w-3" />
                    Email
                  </button>
                </div>

                {/* Status Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
                  {(["ALL", "OPEN", "PENDING", "RESOLVED"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors ${
                        statusFilter === st
                          ? "bg-slate-700 text-cyan-300 font-semibold border border-cyan-500/30"
                          : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      {st === "ALL" ? "All Status" : st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conversation Feed */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    {loading ? "Loading conversations..." : "No matching conversations found."}
                  </div>
                ) : (
                  conversations.map((conv) => {
                    const isSelected = selectedConvId === conv.id;
                    const isWhatsApp = conv.channel === "WHATSAPP";
                    return (
                      <div
                        key={conv.id}
                        onClick={() => setSelectedConvId(conv.id)}
                        className={`p-3.5 cursor-pointer transition-colors relative flex gap-3 ${
                          isSelected
                            ? "bg-[#0f243d] border-l-4 border-cyan-400"
                            : "hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Avatar / Channel Icon */}
                        <div className="relative shrink-0">
                          <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                            {conv.customer?.name ? conv.customer.name.slice(0, 2).toUpperCase() : "IH"}
                          </div>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full flex items-center justify-center text-[9px] text-white shadow ${
                              isWhatsApp ? "bg-emerald-600" : "bg-blue-600"
                            }`}
                          >
                            {isWhatsApp ? "🔵" : "✉"}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-xs text-slate-100 truncate">
                              {conv.customer?.name || "Customer"}
                            </span>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-400 line-clamp-1 truncate mb-1.5">
                            {conv.lastMessagePreview || conv.subject || "No message preview"}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                conv.priority === "URGENT"
                                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                  : conv.priority === "HIGH"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              {conv.priority}
                            </span>
                            {conv.customer?.tags?.[0] && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 text-[10px]">
                                {conv.customer.tags[0]}
                              </span>
                            )}
                            {conv.openTicketsCount ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-300 text-[10px]">
                                {conv.openTicketsCount} Ticket
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* COLUMN 2: Message Thread & AI Suggested Reply Workspace (Flexible Width) */}
            <section className="flex-1 flex flex-col bg-[#071321] min-w-0 border-r border-slate-800/80">
              {/* Conversation Top Header */}
              {selectedConversation && (
                <div className="h-16 px-4 md:px-6 bg-[#0a1829] border-b border-slate-800/80 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center font-bold text-cyan-300 text-sm">
                      {selectedConversation.customer?.name?.slice(0, 2).toUpperCase() || "CU"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-slate-100">
                          {selectedConversation.customer?.name || "Customer"}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            selectedConversation.channel === "WHATSAPP"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {selectedConversation.channel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {selectedConversation.customer?.phone || selectedConversation.customer?.email || "No contact info"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 hidden sm:inline">Assigned:</span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 font-medium">
                      {selectedConversation.assignedTo || "Amit (Support Lead)"}
                    </span>
                  </div>
                </div>
              )}

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-12">
                    No messages in this conversation yet.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isInbound = msg.direction === "INBOUND";
                    const isOriginal = showOriginals[msg.id] ?? false;
                    const displayBody = isOriginal
                      ? msg.originalBody || msg.body
                      : msg.translatedBody || msg.body;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isInbound ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-xl rounded-2xl p-4 shadow-sm ${
                            isInbound
                              ? "bg-[#0e2137] border border-slate-700/60 text-slate-100 rounded-tl-sm"
                              : "bg-gradient-to-r from-cyan-700 to-blue-700 text-white rounded-tr-sm"
                          }`}
                        >
                          {/* Inbound Header: Language Detection & Translation Switcher */}
                          {isInbound && (
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/40 text-[11px]">
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-medium border border-cyan-800/40">
                                Detected: {msg.detectedLanguage || "Hindi"}
                              </span>
                              {msg.originalBody && msg.translatedBody && (
                                <button
                                  onClick={() =>
                                    setShowOriginals((prev) => ({
                                      ...prev,
                                      [msg.id]: !isOriginal,
                                    }))
                                  }
                                  className="text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
                                >
                                  <Globe className="h-3 w-3" />
                                  {isOriginal ? "Show English Translation" : "Show Original"}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Message Content */}
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{displayBody}</div>

                          {/* Footer Info */}
                          <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-slate-400">
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {!isInbound && <CheckCheck className="h-3.5 w-3.5 text-cyan-300" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* AI SUGGESTED REPLY CARD (The Core PRD Feature) */}
                <div className="mt-6 border border-cyan-500/30 rounded-2xl bg-gradient-to-b from-[#09223e] to-[#08182b] p-4 md:p-5 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  {/* Header: AI Badge, Confidence & Tone Selector */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-cyan-800/40">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40">
                        <Sparkles className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white uppercase tracking-wider">
                            AI Suggested Reply
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Human Approval Required
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Confidence Pill */}
                      {aiSuggestion && (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                            aiSuggestion.isConfident
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-red-500/20 text-red-400 border border-red-500/40"
                          }`}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          AI Confidence: {aiSuggestion.confidence}%
                        </span>
                      )}

                      {/* Tone Switcher */}
                      <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-[11px]">
                        {(["Professional", "Friendly", "Short", "Hinglish"] as AiTone[]).map((t) => (
                          <button
                            key={t}
                            onClick={() => {
                              setAiTone(t);
                              const lastInbound = [...messages]
                                .reverse()
                                .find((m) => m.direction === "INBOUND");
                              if (lastInbound) {
                                fetchAiSuggestion(lastInbound.body, selectedConvId || undefined, customer?.name, customer?.id);
                              }
                            }}
                            className={`px-2 py-0.5 rounded transition-colors ${
                              aiTone === t ? "bg-cyan-600 text-white font-medium" : "text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggestion Body */}
                  {loadingAi ? (
                    <div className="py-6 flex items-center justify-center gap-2 text-cyan-400 text-xs">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Searching approved IntriHub knowledge & live stock database...
                    </div>
                  ) : aiSuggestion ? (
                    <div className="space-y-3">
                      {/* Guardrail Policy Banner */}
                      <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300 flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span>{aiSuggestion.guardrailNotes || "Verified strictly against approved IntriHub sources. Zero external hallucination."}</span>
                      </div>

                      {/* Draft Box */}
                      <div className="bg-[#051426] border border-cyan-800/50 rounded-xl p-3.5 text-sm text-cyan-50 font-medium leading-relaxed shadow-inner">
                        "{aiSuggestion.suggestedReply}"
                      </div>

                      {/* Source Citation & Recommended Next Action */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 text-[11px]">Approved Sources:</span>
                          {aiSuggestion.sources.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => setShowSourceModal(true)}
                              className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 text-[10px] font-medium hover:bg-cyan-900 transition-colors flex items-center gap-1"
                            >
                              <BookOpen className="h-2.5 w-2.5" />
                              {src.sourceTitle} {src.version ? `(${src.version})` : ""}
                            </button>
                          ))}
                        </div>

                        {aiSuggestion.recommendedAction && (
                          <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1 bg-amber-950/30 px-2.5 py-1 rounded-md border border-amber-800/30">
                            <Info className="h-3 w-3 text-amber-400" />
                            Next Action: {aiSuggestion.recommendedAction}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: [Use Reply] [Edit] [Translate] [Regenerate] */}
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            setAgentDraftText(aiSuggestion.suggestedReply);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow transition-colors flex items-center gap-1.5"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Use Reply
                        </button>
                        <button
                          onClick={() => {
                            setAgentDraftText(aiSuggestion.suggestedReply);
                            const composer = document.getElementById("agent-composer-input");
                            composer?.focus();
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            setAgentDraftText(aiSuggestion.suggestedReply);
                            await handleTranslateDraft();
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-medium text-xs border border-cyan-800/50 transition-colors flex items-center gap-1.5"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Translate ({agentTranslateTarget})
                        </button>
                        <button
                          onClick={() => {
                            const lastInbound = [...messages].reverse().find((m) => m.direction === "INBOUND");
                            if (lastInbound) {
                              fetchAiSuggestion(lastInbound.body, selectedConvId || undefined, customer?.name, customer?.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-500 text-xs py-2">
                      No inbound message to generate suggestion for.
                    </div>
                  )}
                </div>
              </div>

              {/* COMPOSER (Bottom) */}
              <div className="p-4 bg-[#0a1829] border-t border-slate-800/80 shrink-0 space-y-2.5">
                {/* Translation Preview Bar (if agent clicked translate) */}
                {translatedDraft && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-800/50 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-cyan-400 uppercase text-[10px] tracking-wide block">
                        Customer Native Preview ({agentTranslateTarget}):
                      </span>
                      <p className="text-slate-100 font-medium mt-0.5">{translatedDraft}</p>
                    </div>
                    <button
                      onClick={() => setTranslatedDraft(null)}
                      className="text-slate-400 hover:text-white text-[11px] underline ml-3 shrink-0"
                    >
                      Revert
                    </button>
                  </div>
                )}

                {/* Textarea */}
                <div className="relative">
                  <textarea
                    id="agent-composer-input"
                    rows={3}
                    value={agentDraftText}
                    onChange={(e) => setAgentDraftText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type your response to the customer... (Ctrl + Enter to send)"
                    className="w-full p-3 bg-[#061220] border border-slate-700/80 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Translate Button with Language Picker */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                      <button
                        onClick={handleTranslateDraft}
                        disabled={isTranslatingDraft || !agentDraftText.trim()}
                        className="px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-slate-800 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {isTranslatingDraft ? "Translating..." : "Translate"}
                      </button>
                      <select
                        value={agentTranslateTarget}
                        onChange={(e) => setAgentTranslateTarget(e.target.value)}
                        className="bg-transparent text-[11px] text-slate-300 pr-2 py-1 focus:outline-none cursor-pointer border-l border-slate-800"
                      >
                        <option value="Hindi" className="bg-slate-900">Hindi</option>
                        <option value="Kannada" className="bg-slate-900">Kannada</option>
                        <option value="Tamil" className="bg-slate-900">Tamil</option>
                        <option value="Telugu" className="bg-slate-900">Telugu</option>
                        <option value="English" className="bg-slate-900">English</option>
                      </select>
                    </div>

                    {/* Template Picker Button */}
                    <button
                      onClick={() => setShowTemplateModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-cyan-400" />
                      Templates
                    </button>

                    {/* AI Suggest Button */}
                    <button
                      onClick={() => {
                        const lastInbound = [...messages].reverse().find((m) => m.direction === "INBOUND");
                        if (lastInbound) {
                          fetchAiSuggestion(lastInbound.body, selectedConvId || undefined, customer?.name, customer?.id);
                        }
                      }}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/40 text-xs text-cyan-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Suggest
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!agentDraftText.trim()}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Send {selectedConversation?.channel === "WHATSAPP" ? "WhatsApp" : "Email"}</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </section>

            {/* COLUMN 3: Customer 360 & Live Context (320px - 380px on Desktop) */}
            <section className="w-full lg:w-80 xl:w-92 bg-[#091728] border-l border-slate-800/80 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4">
              {customer ? (
                <>
                  {/* Customer Profile Card */}
                  <div className="bg-[#0b1c30] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Customer 360
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        Verified
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-700 to-blue-600 flex items-center justify-center font-bold text-white text-base shadow">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{customer.name}</h4>
                        {customer.company && (
                          <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {customer.company}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {customer.city || "Bangalore"}, {customer.state || "Karnataka"}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {customer.tags.map((tg, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-cyan-300 border border-slate-700"
                        >
                          {tg}
                        </span>
                      ))}
                    </div>

                    {/* Spend Metrics */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-center">
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Total Orders</span>
                        <span className="text-sm font-bold text-white">{customer.totalOrders}</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Lifetime Spend</span>
                        <span className="text-sm font-bold text-emerald-400">
                          ₹{customer.totalSpend.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Order Card (PRD Section 23, 72) */}
                  <div className="bg-[#0b1c30] border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        Live Order #IH-10291
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        Confirmed
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5 text-slate-300 pt-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Items:</span>
                        <span className="font-semibold text-white">20mm PVC Pipe × 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Payment:</span>
                        <span className="text-emerald-400 font-medium">Razorpay (Paid)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Destination:</span>
                        <span>Bangalore Site (560068)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dispatch Slot:</span>
                        <span className="text-cyan-300">Today, 24-48h ETA</span>
                      </div>
                    </div>
                  </div>

                  {/* Open Tickets & SLA (PRD Section 29, 31) */}
                  <div className="bg-[#0b1c30] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        Support Tickets ({tickets.length})
                      </h4>
                      <button
                        onClick={() => setShowNewTicketModal(true)}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> New
                      </button>
                    </div>

                    {tickets.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No active tickets.</p>
                    ) : (
                      tickets.map((tck) => (
                        <div
                          key={tck.id}
                          className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white text-[11px]">{tck.ticketNumber}</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400">
                              {tck.status}
                            </span>
                          </div>
                          <p className="text-slate-300 font-medium line-clamp-1">{tck.subject}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                            <span className="flex items-center gap-1 text-red-400 font-semibold">
                              <Clock className="h-3 w-3" /> SLA: 6h left
                            </span>
                            <span>{tck.category}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Internal Notes (PRD Section 26, 28) */}
                  <div className="bg-[#0b1c30] border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                        Internal Notes (Private)
                      </h4>
                      <span className="text-[10px] text-amber-400/80 font-medium">Customer Never Sees</span>
                    </div>

                    <div className="space-y-2">
                      {notesList.map((note, idx) => (
                        <div
                          key={idx}
                          className="bg-[#071321] p-2.5 rounded-lg border border-slate-800/80 text-xs text-slate-300 leading-relaxed"
                        >
                          {note}
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddNote} className="flex gap-1.5">
                      <input
                        type="text"
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Add note with @mention..."
                        className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
                      >
                        Add
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 text-xs py-12">
                  Select a conversation to inspect Customer 360 profile.
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: Knowledge Base Management */}
        {activeTab === "knowledge" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-bold text-white">IntriHub Approved Knowledge Base</h2>
                <p className="text-xs text-slate-400 mt-1">
                  PRD v1.0 Architectural Restriction: AI strictly retrieves from approved documents below. General internet search is prohibited.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleScanWebsite}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow flex items-center gap-2"
                >
                  <Globe className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
                  {isScanning ? "Scanning intrihub.com..." : "Scan Website (intrihub.com)"}
                </button>
              </div>
            </div>

            {/* Scan Simulation Banner */}
            {scanResult && (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-200">Website Scan Complete:</span>
                    <p className="mt-0.5">{scanResult.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => alert("All 184 scanned items are verified and approved as IntriHub AI Knowledge.")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                >
                  Approve Knowledge
                </button>
              </div>
            )}

            {/* Knowledge Document Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {APPROVED_INTRIHUB_KNOWLEDGE.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-[#0a1829] border border-slate-800 rounded-2xl p-5 space-y-3 hover:border-cyan-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {doc.category}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Version {doc.version}</span>
                      <span className="text-emerald-400 font-semibold">✓ {doc.status}</span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white">{doc.title}</h3>
                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{doc.content}</p>

                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block mb-1">Key Verified Claims:</span>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
                      {doc.highlights.slice(0, 2).map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2">
                    <span>Approved by: {doc.approvedBy}</span>
                    <span>Updated: {doc.approvedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Templates & Canned Replies */}
        {activeTab === "templates" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div>
                <h2 className="text-xl font-bold text-white">HTML & Multi-Channel Templates</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Canned replies and automated dynamic variable templates ({"{{customer_name}}"}, {"{{order_id}}"}).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="bg-[#0a1829] border border-slate-800 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">
                      {tmpl.category}
                    </span>
                    <span className="text-[11px] text-slate-400">Channel: {tmpl.channel}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{tmpl.name}</h3>
                  {tmpl.subject && (
                    <p className="text-xs text-cyan-400 font-medium">Subject: {tmpl.subject}</p>
                  )}

                  <div className="bg-[#051323] p-3 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-wrap">
                    {tmpl.textContent}
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tmpl.variables.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-400 font-mono">
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Executive Analytics & SLA */}
        {activeTab === "analytics" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
            <div className="border-b border-slate-800 pb-5">
              <h2 className="text-xl font-bold text-white">IntriHub Communication & AI Analytics</h2>
              <p className="text-xs text-slate-400 mt-1">
                Real-time metrics on incoming channels, ticket SLA performance, and AI suggestion acceptance.
              </p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0a1829] border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400">Today's Conversations</span>
                <p className="text-2xl font-bold text-white mt-1">1,284</p>
                <div className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                  <span>824 WhatsApp</span> • <span>460 Email</span>
                </div>
              </div>

              <div className="bg-[#0a1829] border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400">Open Tickets</span>
                <p className="text-2xl font-bold text-amber-400 mt-1">48</p>
                <div className="text-[11px] text-slate-400 mt-2">
                  <span>21 Pending</span> • <span className="text-red-400 font-bold">5 SLA at Risk</span>
                </div>
              </div>

              <div className="bg-[#0a1829] border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400">AI Suggestion Acceptance</span>
                <p className="text-2xl font-bold text-cyan-400 mt-1">77.4%</p>
                <div className="text-[11px] text-slate-400 mt-2">
                  1,426 Accepted • 328 Edited
                </div>
              </div>

              <div className="bg-[#0a1829] border border-slate-800 rounded-2xl p-5">
                <span className="text-xs text-slate-400">First Response SLA</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">94.2%</p>
                <div className="text-[11px] text-slate-400 mt-2">
                  Avg First Response: 4.2 mins
                </div>
              </div>
            </div>

            {/* PRD Section 59 Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0a1829] border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">AI Suggestion Performance (Total: 1,842)</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400 font-medium">Accepted (Sent directly)</span>
                      <span className="font-bold text-white">1,426 (77.4%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "77.4%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-cyan-400 font-medium">Edited by Agent</span>
                      <span className="font-bold text-white">328 (17.8%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full" style={{ width: "17.8%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400 font-medium">Rejected</span>
                      <span className="font-bold text-white">88 (4.8%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: "4.8%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0a1829] border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white">Top Customer Inquiry Categories</h3>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-200">1. Product Availability & PVC Pipes</span>
                    <span className="font-bold text-cyan-400">482 inquiries</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-200">2. Delivery ETA & Site Offloading</span>
                    <span className="font-bold text-cyan-400">356 inquiries</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-200">3. Contractor Bulk Quotations</span>
                    <span className="font-bold text-cyan-400">218 inquiries</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-200">4. Payment & GST Invoices</span>
                    <span className="font-bold text-cyan-400">124 inquiries</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-900">
                    <span className="text-slate-200">5. Returns & Defect Verification</span>
                    <span className="font-bold text-cyan-400">88 inquiries</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* TEMPLATE PICKER MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1829] border border-cyan-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Select Canned Template</h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{tmpl.name}</span>
                    <span className="text-[10px] text-cyan-400">{tmpl.category}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{tmpl.textContent}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOURCE CITATION DETAIL MODAL */}
      {showSourceModal && aiSuggestion && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a1829] border border-cyan-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-cyan-400" />
                Approved IntriHub Sources Used
              </h3>
              <button
                onClick={() => setShowSourceModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {aiSuggestion.sources.map((src, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#051323] border border-cyan-900/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-cyan-300">{src.sourceTitle}</span>
                    <span className="text-[10px] font-mono bg-cyan-950 px-2 py-0.5 rounded text-cyan-400">
                      {src.version || "Approved"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{src.snippet}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW TICKET MODAL */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTicket}
            className="bg-[#0a1829] border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Support Ticket</h3>
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Subject</label>
              <input
                type="text"
                required
                value={newTicketSubject}
                onChange={(e) => setNewTicketSubject(e.target.value)}
                placeholder="e.g. Bulk PVC Pipe Quotation"
                className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Category</label>
                <select
                  value={newTicketCategory}
                  onChange={(e) => setNewTicketCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Product">Product</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Payment">Payment</option>
                  <option value="Vendor">Vendor</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority</label>
                <select
                  value={newTicketPriority}
                  onChange={(e) => setNewTicketPriority(e.target.value as "NORMAL" | "HIGH" | "URGENT")}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="NORMAL">Normal (24h SLA)</option>
                  <option value="HIGH">High (12h SLA)</option>
                  <option value="URGENT">Urgent (4h SLA)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewTicketModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs text-white font-bold"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function HeadphonesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );
}
