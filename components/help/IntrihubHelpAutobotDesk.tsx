"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  MessageSquare,
  LayoutDashboard,
  Settings,
  Plus,
  Send,
  FileText,
  Headphones,
  Sparkles,
  User,
  Phone,
  Search,
  RefreshCw,
  X,
  Loader2,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  Zap,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
  LogOut,
  Building2,
  Key,
  RotateCcw,
  Upload,
  Download,
  Trash2,
  Paperclip,
  Image as ImageIcon,
  FileUp,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  Calendar,
  MapPin,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/autobot/supabase";
import { INTRIHUB_DEFAULT_PROMPT } from "@/lib/autobot/profile";

type OrderItemRecord = {
  id: string;
  productName: string;
  categorySlug: string;
  image: string | null;
  variantDetails: string | null;
  boxQuantity: number;
  pricePerBox: number;
  totalPrice: number;
};

type OrderRecord = {
  id: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  estimatedDelivery: string;
  createdAt: string;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: OrderItemRecord[];
};

type OrderSummary = {
  totalOrders: number;
  lifetimeSpend: number;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
};

type Chat = {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  chat_mode: "human" | "ai";
  last_message_at: string;
};

type Message = {
  id: string;
  chat_id: string;
  sender: "customer" | "human_agent" | "ai";
  message_type: "text" | "image" | "document";
  body: string | null;
  created_at: string;
};

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

type DocumentItem = {
  fileName: string;
  chunkCount: number;
  createdAt: string;
};

function getAvatarBgColor(identifier: string): string {
  const colors = [
    "bg-[#052A51] text-white",
    "bg-[#F26522] text-white",
    "bg-[#10B981] text-white",
    "bg-[#6366F1] text-white",
    "bg-[#0284C7] text-white",
    "bg-[#D97706] text-white",
    "bg-[#8B5CF6] text-white",
    "bg-[#EC4899] text-white",
    "bg-[#0D9488] text-white",
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(nameOrPhone: string): string {
  if (!nameOrPhone) return "IH";
  if (/^\+?\d+$/.test(nameOrPhone.trim())) {
    const digits = nameOrPhone.replace(/\D/g, "");
    return digits.length >= 2 ? digits.slice(-2) : digits || "IH";
  }
  const parts = nameOrPhone.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrPhone.slice(0, 2).toUpperCase();
}

function CustomerAvatar({
  name,
  phone,
  avatarUrl,
  size = "md",
  showOnline = true,
}: {
  name?: string | null;
  phone?: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
}) {
  const identifier = name || phone || "Customer";
  const initials = getInitials(identifier);
  const colorClass = getAvatarBgColor(phone || name || "Intrihub");

  const sizeClasses = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-16 h-16 text-lg",
  };

  const dotSizes = {
    sm: "w-2 h-2 -bottom-0.5 -right-0.5 border",
    md: "w-2.5 h-2.5 bottom-0 right-0 border-2",
    lg: "w-3 h-3 bottom-0 right-0 border-2",
    xl: "w-3.5 h-3.5 bottom-0.5 right-0.5 border-2",
  };

  return (
    <div className="relative shrink-0">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name || phone || "Avatar"}
          className={`${sizeClasses[size]} rounded-2xl object-cover border border-slate-200 shadow-2xs`}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${colorClass} rounded-2xl flex items-center justify-center font-extrabold tracking-wider shadow-2xs`}
        >
          {initials}
        </div>
      )}
      {showOnline && (
        <span
          className={`absolute ${dotSizes[size]} bg-[#25D366] border-white rounded-full`}
          title="Online on WhatsApp"
        />
      )}
    </div>
  );
}

interface IntrihubHelpAutobotDeskProps {
  onLogout: () => void;
}

export default function IntrihubHelpAutobotDesk({ onLogout }: IntrihubHelpAutobotDeskProps) {
  const [activeTab, setActiveTab] = useState<"inbox" | "dashboard" | "settings">("inbox");

  // Inbox State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Media Attachment States
  const [selectedMediaFile, setSelectedMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaCaption, setMediaCaption] = useState("");
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const mediaFileInputRef = useRef<HTMLInputElement>(null);

  // Customer CRM & Order History States
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderSummary, setOrderSummary] = useState<OrderSummary | null>(null);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(true);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // New Chat Modal States
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newInitialMessage, setNewInitialMessage] = useState("");
  const [newMode, setNewMode] = useState<"human" | "ai">("human");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);

  // Dashboard Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Settings State
  const [businessName, setBusinessName] = useState("Intrihub");
  const [geminiKey, setGeminiKey] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(INTRIHUB_DEFAULT_PROMPT);
  const [defaultMode, setDefaultMode] = useState<"ai" | "human">("ai");
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchChats = async (showLoading = true) => {
    if (showLoading) setIsLoadingChats(true);
    try {
      const res = await fetch("/api/chats");
      if (res.ok) {
        const data = await res.json();
        if (data.chats) {
          setChats(data.chats);
        }
      }
    } catch (err) {
      console.error("Error fetching chats:", err);
    } finally {
      if (showLoading) setIsLoadingChats(false);
    }
  };

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setBusinessName(data.profile.business_name || "Intrihub");
          setGeminiKey(data.profile.gemini_api_key || "");
          if (data.profile.global_system_prompt) {
            setSystemPrompt(data.profile.global_system_prompt);
          }
          if (data.profile.default_mode) {
            setDefaultMode(data.profile.default_mode);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents/list");
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const res = await fetch(`/api/messages?chatId=${chatId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchCustomerOrders = async (phoneOrQuery?: string, isExplicitQuery = false) => {
    const target = phoneOrQuery || (activeChat ? activeChat.customer_phone : "");
    if (!target && !orderSearchQuery) {
      setOrders([]);
      setOrderSummary(null);
      return;
    }

    setIsLoadingOrders(true);
    try {
      const url = isExplicitQuery
        ? `/api/customer/orders?query=${encodeURIComponent(target)}`
        : `/api/customer/orders?phone=${encodeURIComponent(target)}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setOrderSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleInsertOrderToChat = (order: OrderRecord) => {
    const itemsSummary = order.items
      .map((it) => `${it.boxQuantity}x ${it.productName}${it.variantDetails ? ` (${it.variantDetails})` : ""}`)
      .join(", ");

    const text = `Hi ${order.customerName || "there"}! Regarding your IntriHub order #${order.id} (${itemsSummary} • Total ₹${order.total.toLocaleString("en-IN")}): The order status is currently "${order.orderStatus.toUpperCase()}" with payment status "${order.paymentStatus}". Delivery ETA: ${order.estimatedDelivery}. Let me know if you need any further help!`;

    setInputText(text);
    if (activeChat?.chat_mode !== "human") {
      handleToggleMode("human");
    }
  };

  const handleCopyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedOrderId(id);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  useEffect(() => {
    fetchChats(true);
    fetchStats();
    fetchSettings();
    fetchDocuments();

    // Subscribe to new/updated chats
    const chatSubscription = supabase
      .channel("public:chats_main")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, (payload) => {
        const newChat = payload.new as Chat;
        if (!newChat || !newChat.id) return;
        setChats((prev) => {
          const exists = prev.find((c) => c.id === newChat.id);
          if (exists) {
            const updated = prev.map((c) => (c.id === newChat.id ? newChat : c));
            return updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          } else {
            return [newChat, ...prev].sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
          }
        });

        if (activeChat && newChat.id === activeChat.id) {
          setActiveChat(newChat);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
    };
  }, [activeChat]);

  // Polling fallback to ensure new chats and incoming messages update seamlessly
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats(false);
      if (activeChat?.id) {
        fetchMessages(activeChat.id);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeChat?.id]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChat) return;

    fetchMessages(activeChat.id);

    const messageSubscription = supabase
      .channel(`public:messages_main:${activeChat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChat.id}` },
        (payload) => {
          const newMessage = payload.new as Message;
          if (!newMessage || !newMessage.id) return;
          setMessages((prev) => {
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [activeChat?.id]);

  // Auto-fetch Customer Order History when active chat changes
  useEffect(() => {
    if (activeChat?.customer_phone) {
      setOrderSearchQuery("");
      fetchCustomerOrders(activeChat.customer_phone, false);
    } else {
      setOrders([]);
      setOrderSummary(null);
    }
  }, [activeChat?.customer_phone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.customer_phone.toLowerCase().includes(q) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(q))
    );
  }, [chats, searchQuery]);

  const handleToggleMode = async (newModeToggle: "human" | "ai") => {
    if (!activeChat) return;
    const prevMode = activeChat.chat_mode;

    // Optimistic UI Update
    const updatedChat = { ...activeChat, chat_mode: newModeToggle };
    setActiveChat(updatedChat);
    setChats((prev) =>
      prev.map((c) => (c.id === activeChat.id ? { ...c, chat_mode: newModeToggle } : c))
    );

    try {
      const res = await fetch("/api/chats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChat.id,
          chat_mode: newModeToggle,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save chat mode to server.");
      }

      const data = await res.json();
      if (data.chat) {
        setActiveChat(data.chat);
        setChats((prev) =>
          prev.map((c) => (c.id === data.chat.id ? data.chat : c))
        );
      }
    } catch (err) {
      console.error("Toggle mode error:", err);
      // Revert if error
      setActiveChat({ ...activeChat, chat_mode: prevMode });
      setChats((prev) =>
        prev.map((c) => (c.id === activeChat.id ? { ...c, chat_mode: prevMode } : c))
      );
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeChat) return;
    if (activeChat.chat_mode !== "human") return;

    const textToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    const optimisticMessage: Message = {
      id: `temp_${Date.now()}`,
      chat_id: activeChat.id,
      sender: "human_agent",
      message_type: "text",
      body: textToSend,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeChat.id,
          customerPhone: activeChat.customer_phone,
          messageText: textToSend,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send message via API");
      }
    } catch (error: any) {
      console.error("Send error:", error);
      alert(`Message notice: ${error?.message || "Saved to local dashboard."}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setSelectedMediaFile(selected);
    if (selected.type.startsWith("image/")) {
      setMediaPreviewUrl(URL.createObjectURL(selected));
    } else {
      setMediaPreviewUrl(null);
    }
    setMediaCaption(selected.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "));
    e.target.value = "";
  };

  const handleSendMedia = async (
    fileToSend?: File,
    captionToSend?: string,
    presetUrl?: string,
    presetType?: "image" | "document",
    presetFileName?: string
  ) => {
    if (!activeChat) return;
    const targetFile = fileToSend || selectedMediaFile;
    if (!targetFile && !presetUrl) return;

    setIsSendingMedia(true);
    const caption = captionToSend !== undefined ? captionToSend : mediaCaption;

    const isImage = targetFile ? targetFile.type.startsWith("image/") : presetType === "image";
    const tempUrl = targetFile ? URL.createObjectURL(targetFile) : presetUrl || "";

    const optimisticMessage: Message = {
      id: `temp_media_${Date.now()}`,
      chat_id: activeChat.id,
      sender: "human_agent",
      message_type: isImage ? "image" : "document",
      body: tempUrl,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const formData = new FormData();
      if (targetFile) formData.append("file", targetFile);
      if (presetUrl) formData.append("mediaUrl", presetUrl);
      if (presetType) formData.append("mediaType", presetType);
      if (presetFileName) formData.append("fileName", presetFileName);
      formData.append("chatId", activeChat.id);
      formData.append("customerPhone", activeChat.customer_phone);
      if (caption) formData.append("caption", caption);

      const res = await fetch("/api/messages/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send media via WhatsApp API");
      }

      setSelectedMediaFile(null);
      setMediaPreviewUrl(null);
      setMediaCaption("");
      fetchMessages(activeChat.id);
    } catch (err: any) {
      console.error("Media send error:", err);
      alert(`Media sending status: ${err?.message || "Failed to dispatch media."}`);
    } finally {
      setIsSendingMedia(false);
    }
  };

  const handleSendOfficialCatalogPdf = () => {
    if (!activeChat) return;
    handleSendMedia(
      undefined,
      "IntriHub Official Tile, Sanitaryware & Building Materials Catalog 2026",
      "https://www.intrihub.com/INTRIHUB_KNOWLEDGE_BASE.txt",
      "document",
      "IntriHub_Product_Catalog_2026.pdf"
    );
  };

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhone.trim()) {
      setNewChatError("Please enter a valid phone number.");
      return;
    }

    try {
      setIsCreatingChat(true);
      setNewChatError(null);

      const res = await fetch("/api/chats/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newPhone.trim(),
          name: newName.trim() || null,
          initialMessage: newInitialMessage.trim() || null,
          mode: newMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create new conversation.");
      }

      const createdChat: Chat = data.chat;
      setChats((prev) => {
        const existing = prev.find((c) => c.id === createdChat.id);
        if (existing) return prev.map((c) => (c.id === createdChat.id ? createdChat : c));
        return [createdChat, ...prev];
      });

      setActiveChat(createdChat);
      setActiveTab("inbox");
      setIsNewChatOpen(false);
      setNewPhone("");
      setNewName("");
      setNewInitialMessage("");
      setNewMode("human");
    } catch (err: any) {
      setNewChatError(err.message || "Failed to start new WhatsApp chat.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    setSettingsMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          gemini_api_key: geminiKey,
          global_system_prompt: systemPrompt,
          default_mode: defaultMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsMsg({ type: "success", text: "Customer Desk Guidelines saved successfully!" });
      } else {
        setSettingsMsg({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch {
      setSettingsMsg({ type: "error", text: "Failed to connect to server." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleUploadOfficialCatalog = async () => {
    setIsUploading(true);
    setSettingsMsg(null);
    try {
      const kbRes = await fetch("/INTRIHUB_KNOWLEDGE_BASE.txt");
      if (!kbRes.ok) throw new Error("Could not load knowledge base file");
      const blob = await kbRes.blob();
      const kbFile = new File([blob], "INTRIHUB_OFFICIAL_CATALOG_GUIDE.txt", { type: "text/plain" });

      const formData = new FormData();
      formData.append("file", kbFile);
      formData.append("gemini_api_key", geminiKey);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsMsg({
          type: "success",
          text: `Successfully indexed Official Intrihub Catalog (${data.chunksInserted || 0} knowledge items)!`,
        });
        fetchDocuments();
        fetchStats();
      } else {
        setSettingsMsg({ type: "error", text: data.error || "Failed to index knowledge base." });
      }
    } catch (err: any) {
      setSettingsMsg({ type: "error", text: err.message || "Failed to index catalog." });
    } finally {
      setIsUploading(false);
    }
  };

  const totalProcessed = stats ? stats.aiMessages + stats.humanMessages + stats.customerMessages : 0;
  const aiPercentage = totalProcessed > 0 && stats ? Math.round((stats.aiMessages / totalProcessed) * 100) : 0;
  const humanPercentage = totalProcessed > 0 && stats ? Math.round((stats.humanMessages / totalProcessed) * 100) : 0;
  const customerPercentage = totalProcessed > 0 && stats ? Math.round((stats.customerMessages / totalProcessed) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo/intri-web-logo.png" alt="Intrihub" className="h-8 w-auto object-contain" />
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-[#1E9E6B]">
            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>WhatsApp Live Desk (+91 70901 20211)</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "inbox"
                ? "bg-[#F26522] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Live Inbox</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "dashboard"
                ? "bg-[#052A51] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview & Stats</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "settings"
                ? "bg-[#052A51] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Desk Settings</span>
          </button>
        </div>

        {/* Actions & Logout */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="hidden md:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>New Message</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
            title="Logout from Customer Desk"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Tab Views */}
      <main className="flex-1 flex overflow-hidden">
        {/* TAB 1: LIVE INBOX */}
        {activeTab === "inbox" && (
          <div className="flex-1 flex h-[calc(100vh-5rem)] overflow-hidden">
            {/* Left Chat List */}
            <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#F26522]" />
                    Conversations
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setIsNewChatOpen(true)}
                      className="p-1.5 bg-orange-50 hover:bg-[#F26522] text-[#F26522] hover:text-white rounded-lg transition-colors border border-orange-200 shadow-2xs"
                      title="Type Number & Send Message"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => fetchChats(true)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Refresh Chats"
                    >
                      <RefreshCw className={`h-4 w-4 ${isLoadingChats ? "animate-spin" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search phone or name..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#F26522] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredChats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 border ${
                      activeChat?.id === chat.id
                        ? "bg-orange-50/80 border-[#F26522] shadow-xs"
                        : "hover:bg-slate-50 border-transparent bg-slate-50/40"
                    }`}
                  >
                    <CustomerAvatar name={chat.customer_name} phone={chat.customer_phone} size="md" />

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-bold text-sm text-[#052A51] truncate">
                          {chat.customer_name || chat.customer_phone}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {new Date(chat.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center w-full mt-0.5">
                        <span className="text-xs text-slate-500 font-mono truncate">{chat.customer_phone}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                            chat.chat_mode === "ai"
                              ? "bg-orange-100 text-[#F26522] border border-orange-200"
                              : "bg-emerald-100 text-[#1E9E6B] border border-emerald-200"
                          }`}
                        >
                          {chat.chat_mode === "ai" ? "INSTANT" : "DIRECT"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}

                {!isLoadingChats && filteredChats.length === 0 && (
                  <div className="text-center py-12 px-4 text-slate-400 text-xs space-y-3">
                    <p>No active WhatsApp conversations found.</p>
                    <button
                      onClick={() => setIsNewChatOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#F26522] hover:bg-orange-50 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Start Conversation
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Chat Panel */}
            <div className="flex-1 flex flex-col bg-[#f8fafc] relative overflow-hidden">
              {activeChat ? (
                <>
                  <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shrink-0">
                    <div className="flex items-center gap-3">
                      <CustomerAvatar
                        name={activeChat.customer_name}
                        phone={activeChat.customer_phone}
                        size="lg"
                        showOnline={true}
                      />
                      <div>
                        <h3 className="font-bold text-[#052A51] text-sm">
                          {activeChat.customer_name || "WhatsApp Customer"}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                          <Phone className="w-3 h-3 text-[#1E9E6B]" /> {activeChat.customer_phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                          isOrderPanelOpen
                            ? "bg-[#052A51] text-white border-[#052A51] shadow-2xs"
                            : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200"
                        }`}
                        title="Toggle Customer Orders & Purchase History"
                      >
                        <Package className="w-3.5 h-3.5 text-[#F26522]" />
                        <span>Order History {orders.length > 0 ? `(${orders.length})` : ""}</span>
                      </button>

                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => handleToggleMode("human")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeChat.chat_mode === "human"
                              ? "bg-[#1E9E6B] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          Direct Agent
                        </button>
                        <button
                          onClick={() => handleToggleMode("ai")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            activeChat.chat_mode === "ai"
                              ? "bg-[#F26522] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> Instant Desk
                        </button>
                      </div>
                    </div>
                  </header>

                  {/* Quick Media & Catalog Dispatch Bar */}
                  <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto text-xs shrink-0">
                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider shrink-0 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#F26522]" /> Quick Dispatch:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSendOfficialCatalogPdf}
                        disabled={isSendingMedia}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-orange-50 text-[#F26522] border border-orange-200 rounded-lg font-bold shadow-2xs transition-colors shrink-0 disabled:opacity-50"
                        title="Send Official IntriHub Catalog to WhatsApp customer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#F26522]" />
                        <span>Send Catalog PDF</span>
                      </button>
                      <button
                        onClick={() => mediaFileInputRef.current?.click()}
                        disabled={isSendingMedia}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold shadow-2xs transition-colors shrink-0 disabled:opacity-50"
                        title="Attach sample tile image or custom document"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                        <span>Attach PDF / Image</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {messages.map((msg, index) => {
                      const isCustomer = msg.sender === "customer";
                      const isAi = msg.sender === "ai";
                      const isOptimistic = msg.id.startsWith("temp_");

                      return (
                        <div key={msg.id || index} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                          <div className={`flex flex-col gap-1 max-w-[80%] md:max-w-[70%] ${isCustomer ? "items-start" : "items-end"}`}>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1">
                              {isAi ? "Intrihub Support Executive" : isCustomer ? "Customer" : "You (Support Agent)"}
                            </span>

                            <div
                              className={`p-3.5 rounded-2xl shadow-2xs border ${
                                isCustomer
                                  ? "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                                  : isAi
                                  ? "bg-[#052A51] border-[#052A51] text-white rounded-tr-none"
                                  : "bg-[#F26522] border-[#F26522] text-white rounded-tr-none"
                              } ${isOptimistic ? "opacity-60" : ""}`}
                            >
                              {msg.message_type === "image" && msg.body && (
                                <div className="mb-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                                  <img src={msg.body} alt="Media" className="max-w-xs max-h-64 object-cover" />
                                </div>
                              )}
                              {msg.message_type === "document" && msg.body && (
                                <a
                                  href={msg.body}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2.5 p-2.5 bg-slate-100 rounded-lg border border-slate-200 hover:border-[#F26522] transition-colors mb-2 text-slate-800"
                                >
                                  <FileText className="w-6 h-6 text-[#F26522]" />
                                  <div className="text-xs">
                                    <p className="font-bold">Catalog / Document attached</p>
                                    <p className="text-[#F26522] font-semibold">Click to view & download</p>
                                  </div>
                                </a>
                              )}
                              {msg.body && !msg.body.startsWith("http") && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>}
                            </div>

                            <span className="text-[10px] text-slate-400 px-1">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              {isOptimistic && " • Sending..."}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
                    {/* Hidden Native File Input */}
                    <input
                      type="file"
                      ref={mediaFileInputRef}
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      className="hidden"
                      onChange={handleMediaFileSelected}
                    />

                    {/* Floating Selected Media Attachment Bar */}
                    {selectedMediaFile && (
                      <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {mediaPreviewUrl ? (
                            <img src={mediaPreviewUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-orange-200 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white border border-orange-200 flex items-center justify-center shrink-0 text-[#F26522]">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#052A51] truncate">{selectedMediaFile.name}</p>
                            <p className="text-[11px] text-slate-500">{(selectedMediaFile.size / 1024).toFixed(1)} KB • Ready to send to WhatsApp</p>
                            <input
                              type="text"
                              value={mediaCaption}
                              onChange={(e) => setMediaCaption(e.target.value)}
                              placeholder="Add optional caption..."
                              className="w-full mt-1.5 px-2.5 py-1 bg-white border border-orange-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-[#F26522]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMediaFile(null);
                              setMediaPreviewUrl(null);
                              setMediaCaption("");
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-orange-100 transition-colors"
                            title="Remove attachment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendMedia()}
                            disabled={isSendingMedia}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50"
                          >
                            {isSendingMedia ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                <span>Send to WhatsApp</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeChat.chat_mode === "human" ? (
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-[#F26522] focus-within:bg-white transition-colors">
                        <button
                          type="button"
                          onClick={() => mediaFileInputRef.current?.click()}
                          className="p-2 text-slate-500 hover:text-[#F26522] hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                          title="Attach PDF Catalog or Product Photo"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                          placeholder="Type a message to WhatsApp customer as Intrihub Support..."
                          className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm px-2"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={isSending || !inputText.trim()}
                          className="p-2.5 bg-[#F26522] hover:bg-[#d95a1e] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-2xs shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3.5 bg-orange-50/70 border border-orange-200 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white border border-orange-200 text-[#F26522]">
                            <Headphones className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#052A51]">Intrihub Support Executive Desk Active</p>
                            <p className="text-[11px] text-slate-500">Providing instant, accurate answers using verified Intrihub catalog data.</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleMode("human")}
                          className="text-xs px-3.5 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold transition-colors shrink-0 shadow-2xs"
                        >
                          Reply Directly
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-[#f8fafc] p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center mb-4 text-[#F26522]">
                    <Headphones className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-[#052A51]">Select or Start a WhatsApp Conversation</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mb-5">
                    Click on any customer from the left list or click below to type a new WhatsApp phone number.
                  </p>
                  <button
                    onClick={() => setIsNewChatOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Type New Number & Send Message
                  </button>
                </div>
              )}
            </div>

            {/* Right Customer Orders & CRM Intelligence Panel */}
            {isOrderPanelOpen && activeChat && (
              <aside className="w-80 lg:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden z-20">
                {/* CRM Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#052A51] text-white">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#052A51] uppercase tracking-wider">Customer Orders & CRM</h3>
                        <p className="text-[11px] text-slate-500 font-mono">{activeChat.customer_phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsOrderPanelOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Close Orders Panel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customer Lifetime Spend & KPI summary */}
                  {orderSummary && (
                    <div className="grid grid-cols-2 gap-2 p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
                        <span className="text-sm font-extrabold text-[#052A51]">{orderSummary.totalOrders} Placed</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime Value</span>
                        <span className="text-sm font-extrabold text-[#1E9E6B]">₹{orderSummary.lifetimeSpend.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  )}

                  {/* Live Search by Order ID or Phone Number */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      fetchCustomerOrders(orderSearchQuery.trim(), true);
                    }}
                    className="relative"
                  >
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search Order ID (#IH-...) or phone..."
                      className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-14 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F26522] transition-colors"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1 px-2 py-0.5 bg-[#052A51] hover:bg-[#F26522] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Find
                    </button>
                  </form>
                </div>

                {/* Orders List Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#f8fafc]">
                  {isLoadingOrders ? (
                    <div className="py-12 text-center text-slate-400 space-y-2 text-xs">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F26522]" />
                      <p>Loading purchase history...</p>
                    </div>
                  ) : orders.length > 0 ? (
                    orders.map((order) => {
                      const isDelivered = order.orderStatus.toLowerCase() === "delivered";
                      const isCancelled = order.orderStatus.toLowerCase() === "cancelled";
                      const isProcessing = order.orderStatus.toLowerCase() === "processing" || order.orderStatus.toLowerCase() === "confirmed";

                      return (
                        <div
                          key={order.id}
                          className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs hover:shadow-xs transition-shadow space-y-3"
                        >
                          {/* Order Top Line */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-extrabold text-[#052A51]">
                                #{order.id.slice(-8).toUpperCase()}
                              </span>
                              <button
                                onClick={() => handleCopyOrderId(order.id)}
                                className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors cursor-pointer"
                                title="Copy Full Order ID"
                              >
                                {copiedOrderId === order.id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isDelivered
                                  ? "bg-emerald-100 text-[#1E9E6B] border border-emerald-200"
                                  : isCancelled
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : isProcessing
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "bg-orange-100 text-[#F26522] border border-orange-200"
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </div>

                          {/* Amount & Payment Method */}
                          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-1 text-slate-500">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-extrabold text-[#052A51] text-sm">₹{order.total.toLocaleString("en-IN")}</span>
                              <span className="text-[10px] text-slate-500 block">{order.paymentStatus} ({order.paymentMethod})</span>
                            </div>
                          </div>

                          {/* Products in this order */}
                          <div className="space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                              Items Ordered ({order.items.length})
                            </span>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-2 text-xs bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                  {item.image ? (
                                    <img src={item.image} alt={item.productName} className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0" />
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                      <Package className="w-4 h-4" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 truncate text-[11px]">{item.productName}</p>
                                    <p className="text-[10px] text-slate-500 truncate">
                                      {item.boxQuantity} box(es) • ₹{item.totalPrice.toLocaleString("en-IN")}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Delivery Snapshot */}
                          <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{order.deliveryAddress}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Truck className="w-3 h-3 text-[#F26522] shrink-0" />
                              <span>ETA: {order.estimatedDelivery}</span>
                            </div>
                          </div>

                          {/* Quick Action: Insert in WhatsApp Message */}
                          <button
                            type="button"
                            onClick={() => handleInsertOrderToChat(order)}
                            className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-[#F26522] text-[#F26522] hover:text-white font-bold text-xs transition-colors border border-orange-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Send Order Status in Chat</span>
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2 text-xs">
                      <Package className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">No Orders Found</p>
                      <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                        No previous orders found for this phone number. Try searching an Order ID above.
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* TAB 2: OVERVIEW & STATS */}
        {activeTab === "dashboard" && (
          <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto space-y-8 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#052A51]">Support Desk Analytics</h2>
                <p className="text-xs text-slate-500 mt-1">Live customer inquiries, resolution metrics and response performance</p>
              </div>
              <button
                onClick={fetchStats}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all shadow-2xs"
                title="Refresh Analytics"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Customer Inquiries</span>
                <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.totalChats || 0}</p>
                <p className="mt-1 text-xs text-slate-500">Active customer threads</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Today</span>
                <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.activeChats || 0}</p>
                <p className="mt-1 text-xs text-slate-500">Inquiries in last 24h</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Instant Resolution</span>
                <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.aiResolutionRate || "0%"}</p>
                <p className="mt-1 text-xs text-slate-500">Auto-resolved inquiries</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Catalog Knowledge</span>
                <p className="mt-4 text-3xl font-extrabold text-[#052A51]">{stats?.totalKnowledgeChunks || 0}</p>
                <p className="mt-1 text-xs text-slate-500">Indexed catalog items</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-bold text-[#052A51]">Inquiry Traffic & Distribution</h3>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
                <div style={{ width: `${aiPercentage}%` }} className="bg-[#F26522] h-full" title={`Instant Desk: ${aiPercentage}%`} />
                <div style={{ width: `${humanPercentage}%` }} className="bg-[#052A51] h-full" title={`Direct Agent: ${humanPercentage}%`} />
                <div style={{ width: `${customerPercentage}%` }} className="bg-[#25D366] h-full" title={`Customer: ${customerPercentage}%`} />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F26522]" /> Instant Support Desk</span>
                  <p className="mt-1 text-lg font-extrabold text-[#052A51]">{stats?.aiMessages || 0}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#052A51]" /> Direct Support Agent</span>
                  <p className="mt-1 text-lg font-extrabold text-[#052A51]">{stats?.humanMessages || 0}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#25D366]" /> Customer Inbound</span>
                  <p className="mt-1 text-lg font-extrabold text-[#052A51]">{stats?.customerMessages || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: DESK SETTINGS & GUIDELINES */}
        {activeTab === "settings" && (
          <div className="flex-1 p-6 md:p-8 max-w-6xl mx-auto space-y-8 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-extrabold text-[#052A51]">Customer Desk Settings & Guidelines</h2>
                <p className="text-xs text-slate-500 mt-1">Configure AI executive persona, brand rules, and index Intrihub catalog</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50"
              >
                {isSavingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>Save Settings</span>
              </button>
            </div>

            {settingsMsg && (
              <div className={`p-4 rounded-xl text-xs font-bold border ${settingsMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-[#1E9E6B]" : "bg-red-50 border-red-200 text-red-600"}`}>
                {settingsMsg.text}
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                    <Key className="h-5 w-5 text-amber-500" />
                    Google Gemini API Key
                  </h3>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-mono text-slate-900 focus:border-[#F26522] focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">Powers Gemini 2.5 Flash instant catalog lookup.</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-[#1E9E6B]" />
                    Customer Support Master Guidelines
                  </h3>
                  <textarea
                    rows={10}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-xs font-mono leading-relaxed text-slate-800 focus:bg-white focus:border-[#F26522] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-6 shadow-2xs space-y-3">
                  <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#F26522]" />
                    Official Intrihub Catalog Knowledge Base
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Includes tiles, sanitaryware, 60-min Bengaluru delivery, 100% free damage replacement, and GST ITC invoices.
                  </p>
                  <button
                    onClick={handleUploadOfficialCatalog}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Auto-Index Catalog Knowledge</span>
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-[#052A51]" />
                    Indexed Knowledge Documents ({documents.length})
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {documents.map((doc) => (
                      <div key={doc.fileName} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-[#052A51]">{doc.fileName}</p>
                          <p className="text-slate-400 font-mono">{doc.chunkCount} indexed vector chunks</p>
                        </div>
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* NEW CHAT MODAL DIALOG */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F26522]">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#052A51]">Start New WhatsApp Chat</h3>
                  <p className="text-xs text-slate-500">Send direct quotation or initiate support</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewChatOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {newChatError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {newChatError}
              </div>
            )}

            <form onSubmit={handleCreateNewChat} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Customer Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:border-[#F26522] focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Customer Name / Organization (Optional)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar (Builder)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#F26522] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Initial Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMode("human")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newMode === "human"
                        ? "bg-[#1E9E6B] border-[#1E9E6B] text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Direct Agent
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewMode("ai")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      newMode === "ai"
                        ? "bg-[#F26522] border-[#F26522] text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Instant Desk
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  First Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  placeholder="Namaste sir! Intrihub se mai aapke construction requirement ke liye contact kar raha hoon..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#F26522] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !newPhone.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50"
                >
                  {isCreatingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Start WhatsApp Chat</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
