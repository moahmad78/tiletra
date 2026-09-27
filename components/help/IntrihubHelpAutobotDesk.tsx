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
  Users,
  Radio,
  History,
  UserPlus,
  Edit3,
  AlertTriangle,
  Layers,
  CheckSquare,
  Square,
  Clock,
  Filter,
  CheckCircle,
  HelpCircle,
  Smartphone,
  DownloadCloud,
  Share2,
  ArrowLeft,
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
  created_at?: string;
  contact_role?: "vendor" | "customer" | "team";
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

// Broadcast Types
type BroadcastGroupItem = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  broadcastCount: number;
  lastBroadcast: {
    id: string;
    sentAt: string;
    totalRecipients: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    messageContent: string;
  } | null;
};

type BroadcastGroupMember = {
  id: string;
  groupId: string;
  phoneNumber: string;
  customerName: string | null;
  addedAt: string;
};

type BroadcastLogEntry = {
  id: string;
  broadcastLogId: string;
  phoneNumber: string;
  customerName: string | null;
  status: "sent" | "failed" | "skipped";
  errorMessage: string | null;
  sentAt: string;
};

type BroadcastLogRecord = {
  id: string;
  groupId: string;
  messageContent: string;
  mediaUrl: string | null;
  mediaType: string | null;
  templateName: string | null;
  sentAt: string;
  totalRecipients: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  sentBy: string;
  entries: BroadcastLogEntry[];
};

type BroadcastGroupDetail = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  members: BroadcastGroupMember[];
  logs: BroadcastLogRecord[];
};

type WhatsAppTemplate = {
  name: string;
  category: string;
  language: string;
  status: string;
  components?: any[];
};

type CustomerProfileData = {
  phone: string;
  displayPhone: string;
  name: string;
  rawName: string | null;
  city: string;
  notes: string | null;
  role?: "vendor" | "customer" | "team";
  firstContactedAt: string | null;
  lastActiveAt: string | null;
  chatMode: string;
  totalOrders: number;
  lifetimeSpend: number;
  orders: any[];
  broadcastGroups: Array<{
    groupId: string;
    groupName: string;
    description: string | null;
    addedAt: string;
  }>;
  availableGroups: Array<{
    id: string;
    name: string;
  }>;
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
    xl: "w-20 h-20 text-2xl font-black",
  };

  const dotSizes = {
    sm: "w-2 h-2 -bottom-0.5 -right-0.5 border",
    md: "w-2.5 h-2.5 bottom-0 right-0 border-2",
    lg: "w-3 h-3 bottom-0 right-0 border-2",
    xl: "w-4 h-4 bottom-1 right-1 border-2",
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
          className={`${sizeClasses[size]} ${colorClass} rounded-2xl flex items-center justify-center font-extrabold tracking-wider shadow-2xs select-none`}
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
  const [activeTab, setActiveTab] = useState<"inbox" | "groups" | "dashboard" | "settings">("inbox");

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

  // Customer Detailed Profile Panel States
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);
  const [profileEditName, setProfileEditName] = useState("");
  const [profileNotes, setProfileNotes] = useState("");
  const [profileEditRole, setProfileEditRole] = useState<"customer" | "vendor" | "team">("customer");
  const [contactRoleFilter, setContactRoleFilter] = useState<"all" | "customer" | "vendor" | "team" | "human" | "ai">("all");
  const [newContactRole, setNewContactRole] = useState<"customer" | "vendor" | "team">("customer");
  const [crmRoleFilter, setCrmRoleFilter] = useState<"all" | "customer" | "vendor" | "team">("all");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [selectedAddToGroupId, setSelectedAddToGroupId] = useState("");
  const [isAddingToGroup, setIsAddingToGroup] = useState(false);
  const [expandedProfileOrderId, setExpandedProfileOrderId] = useState<string | null>(null);

  // Broadcast Groups States
  const [groups, setGroups] = useState<BroadcastGroupItem[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<BroadcastGroupDetail | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupDetailTab, setGroupDetailTab] = useState<"members" | "history">("members");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  // Create Group Modal States
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [createGroupMemberMode, setCreateGroupMemberMode] = useState<"crm" | "paste">("crm");
  const [selectedCrmPhones, setSelectedCrmPhones] = useState<string[]>([]);
  const [pastedNumbers, setPastedNumbers] = useState("");
  const [crmMemberSearch, setCrmMemberSearch] = useState("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);

  // Add Members to Existing Group Modal States
  const [isAddMembersModalOpen, setIsAddMembersModalOpen] = useState(false);
  const [addMembersRawInput, setAddMembersRawInput] = useState("");
  const [addMembersCrmPhones, setAddMembersCrmPhones] = useState<string[]>([]);
  const [addMembersMode, setAddMembersMode] = useState<"paste" | "crm">("paste");
  const [isSubmittingMembers, setIsSubmittingMembers] = useState(false);

  // Broadcast Composer Modal States
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [broadcastTargetGroup, setBroadcastTargetGroup] = useState<BroadcastGroupDetail | BroadcastGroupItem | null>(null);
  const [broadcastMessageText, setBroadcastMessageText] = useState("");
  const [broadcastSelectedMedia, setBroadcastSelectedMedia] = useState<File | null>(null);
  const [broadcastMediaPreview, setBroadcastMediaPreview] = useState<string | null>(null);
  const [broadcastMediaCaption, setBroadcastMediaCaption] = useState("");
  const [broadcastTemplateName, setBroadcastTemplateName] = useState("hello_world");
  const [broadcastForceTemplate, setBroadcastForceTemplate] = useState(false);
  const [broadcastSafetyConfirmed, setBroadcastSafetyConfirmed] = useState(false);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastProgressText, setBroadcastProgressText] = useState("");
  const [broadcastResultSummary, setBroadcastResultSummary] = useState<{
    totalRecipients: number;
    successCount: number;
    failedCount: number;
    skippedCount: number;
    logId?: string;
    entries?: any[];
  } | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Templates Gallery States
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // PWA / App Download & Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(true);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIos(isIosDevice);

      if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
        setIsAppInstalled(true);
        setShowInstallBanner(false);
      }

      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
      };

      const handleAppInstalled = () => {
        setIsAppInstalled(true);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      window.addEventListener("appinstalled", handleAppInstalled);

      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
        window.removeEventListener("appinstalled", handleAppInstalled);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsAppInstalled(true);
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  // -------------------------------------------------------------
  // Data Fetchers
  // -------------------------------------------------------------
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

  const fetchCustomerProfile = async (phone: string) => {
    if (!phone) return;
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`/api/customer/profile?phone=${encodeURIComponent(phone)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          setCustomerProfile(data.profile);
          setProfileEditName(data.profile.rawName || "");
          setProfileNotes(data.profile.notes || "");
          setProfileEditRole(data.profile.role || "customer");
        }
      }
    } catch (err) {
      console.error("Error fetching customer profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleSaveProfile = async (explicitRole?: "customer" | "vendor" | "team") => {
    if (!customerProfile) return;
    setIsSavingProfile(true);
    setProfileSaveSuccess(false);
    const roleToSave = explicitRole || profileEditRole;
    try {
      const res = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customerProfile.phone,
          name: profileEditName.trim(),
          notes: profileNotes.trim(),
          role: roleToSave,
        }),
      });

      if (res.ok) {
        setProfileSaveSuccess(true);
        setIsEditingProfileName(false);
        setProfileEditRole(roleToSave);
        setCustomerProfile((prev) =>
          prev
            ? {
                ...prev,
                name: profileEditName.trim() || prev.displayPhone,
                rawName: profileEditName.trim() || null,
                notes: profileNotes.trim() || null,
                role: roleToSave,
              }
            : null
        );
        // Refresh chats list to reflect updated name and role
        fetchChats(false);
        if (activeChat) {
          setActiveChat((prev) =>
            prev
              ? {
                  ...prev,
                  customer_name: profileEditName.trim() || null,
                  contact_role: roleToSave,
                }
              : null
          );
        }
        setTimeout(() => setProfileSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Error saving customer profile:", err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddCustomerToGroup = async () => {
    if (!customerProfile || !selectedAddToGroupId) return;
    setIsAddingToGroup(true);
    try {
      const res = await fetch("/api/customer/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: customerProfile.phone,
          groupId: selectedAddToGroupId,
          customerName: customerProfile.name,
        }),
      });

      if (res.ok) {
        fetchCustomerProfile(customerProfile.phone);
        setSelectedAddToGroupId("");
      }
    } catch (err) {
      console.error("Error adding customer to group:", err);
    } finally {
      setIsAddingToGroup(false);
    }
  };

  // Broadcast Groups Fetchers
  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch("/api/broadcast/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (err) {
      console.error("Error fetching broadcast groups:", err);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const fetchGroupDetails = async (id: string) => {
    setIsLoadingGroupDetail(true);
    try {
      const res = await fetch(`/api/broadcast/groups/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedGroup(data.group || null);
      }
    } catch (err) {
      console.error("Error fetching group detail:", err);
    } finally {
      setIsLoadingGroupDetail(false);
    }
  };

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await fetch("/api/broadcast/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      setCreateGroupError("Please enter a valid group name.");
      return;
    }

    setIsSubmittingGroup(true);
    setCreateGroupError(null);

    try {
      let membersToAdd: { phone: string; name?: string }[] = [];

      if (createGroupMemberMode === "crm") {
        membersToAdd = selectedCrmPhones.map((ph) => {
          const matchingChat = chats.find((c) => c.customer_phone === ph);
          return {
            phone: ph,
            name: matchingChat?.customer_name || undefined,
          };
        });
      } else {
        const lines = pastedNumbers.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean);
        membersToAdd = lines.map((l) => ({ phone: l }));
      }

      const res = await fetch("/api/broadcast/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
          members: membersToAdd,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group.");

      setIsCreateGroupModalOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setSelectedCrmPhones([]);
      setPastedNumbers("");
      fetchGroups();
      if (data.group?.id) {
        fetchGroupDetails(data.group.id);
      }
    } catch (err: any) {
      setCreateGroupError(err.message || "Failed to create broadcast group.");
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  const handleAddMembersToGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;

    setIsSubmittingMembers(true);
    try {
      const payload: Record<string, any> = {};
      if (addMembersMode === "crm") {
        payload.members = addMembersCrmPhones.map((ph) => {
          const match = chats.find((c) => c.customer_phone === ph);
          return { phone: ph, name: match?.customer_name };
        });
      } else {
        payload.rawInput = addMembersRawInput;
      }

      const res = await fetch(`/api/broadcast/groups/${selectedGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add members.");

      setIsAddMembersModalOpen(false);
      setAddMembersRawInput("");
      setAddMembersCrmPhones([]);
      fetchGroupDetails(selectedGroup.id);
      fetchGroups();
    } catch (err: any) {
      alert(`Could not add members: ${err.message}`);
    } finally {
      setIsSubmittingMembers(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;
    if (!confirm("Are you sure you want to remove this member from the group?")) return;

    try {
      const res = await fetch(`/api/broadcast/groups/${selectedGroup.id}/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchGroupDetails(selectedGroup.id);
        fetchGroups();
      }
    } catch (err) {
      console.error("Error removing member:", err);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this broadcast group? All members and broadcast logs will be permanently deleted.")) return;

    try {
      const res = await fetch(`/api/broadcast/groups/${groupId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSelectedGroup(null);
        fetchGroups();
      }
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  const handleExecuteBroadcast = async () => {
    if (!broadcastTargetGroup) return;
    const recipientCount = (broadcastTargetGroup as any).memberCount || (broadcastTargetGroup as BroadcastGroupDetail).members?.length || 0;

    if (recipientCount > 20 && !broadcastSafetyConfirmed) {
      alert("Please confirm the safety check before launching broadcast to more than 20 recipients.");
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastProgressText("Preparing recipients & verifying 24-hour service windows...");

    try {
      let mediaUrl: string | null = null;
      let mediaType: "image" | "document" | null = null;
      let mediaFileName: string | null = null;

      // Handle file upload first if attached
      if (broadcastSelectedMedia) {
        setBroadcastProgressText("Uploading broadcast media attachment...");
        const fd = new FormData();
        fd.append("file", broadcastSelectedMedia);
        fd.append("chatId", "broadcast");
        fd.append("customerPhone", "broadcast");
        fd.append("caption", broadcastMediaCaption || broadcastMessageText);

        const uploadRes = await fetch("/api/messages/media", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.mediaUrl) {
          mediaUrl = uploadData.mediaUrl;
          mediaType = uploadData.mediaType;
          mediaFileName = uploadData.fileName || broadcastSelectedMedia.name;
        }
      }

      setBroadcastProgressText(`Dispatching throttled messages to ${recipientCount} recipients...`);

      const res = await fetch("/api/broadcast/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: broadcastTargetGroup.id,
          messageText: broadcastMessageText.trim() || undefined,
          mediaUrl,
          mediaType,
          mediaCaption: broadcastMediaCaption || undefined,
          mediaFileName,
          templateName: broadcastTemplateName,
          forceTemplateAll: broadcastForceTemplate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to execute broadcast.");

      setBroadcastResultSummary({
        totalRecipients: data.summary.totalRecipients,
        successCount: data.summary.successCount,
        failedCount: data.summary.failedCount,
        skippedCount: data.summary.skippedCount,
        logId: data.log?.id,
        entries: data.log?.entries || [],
      });

      // Clear composer states
      setBroadcastMessageText("");
      setBroadcastSelectedMedia(null);
      setBroadcastMediaPreview(null);
      setBroadcastMediaCaption("");
      setBroadcastSafetyConfirmed(false);
      setIsBroadcastModalOpen(false);

      // Refresh group logs
      if (selectedGroup && selectedGroup.id === broadcastTargetGroup.id) {
        fetchGroupDetails(selectedGroup.id);
      }
      fetchGroups();
    } catch (err: any) {
      alert(`Broadcast failed: ${err.message}`);
    } finally {
      setIsSendingBroadcast(false);
      setBroadcastProgressText("");
    }
  };

  const handleOpenBroadcastComposer = (group: BroadcastGroupDetail | BroadcastGroupItem) => {
    setBroadcastTargetGroup(group);
    setBroadcastMessageText("");
    setBroadcastSelectedMedia(null);
    setBroadcastMediaPreview(null);
    setBroadcastSafetyConfirmed(false);
    setBroadcastForceTemplate(false);
    setIsBroadcastModalOpen(true);
    fetchTemplates();
  };

  // Initial & Interval Subscriptions
  useEffect(() => {
    fetchChats(true);
    fetchStats();
    fetchSettings();
    fetchDocuments();
    fetchGroups();
    fetchTemplates();

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

  // Polling fallback
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats(false);
      if (activeChat?.id) {
        fetchMessages(activeChat.id);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [activeChat?.id]);

  useEffect(() => {
    if (!activeChat) return;

    fetchMessages(activeChat.id);
    fetchCustomerOrders(activeChat.customer_phone);

    const messageSubscription = supabase
      .channel(`public:messages_${activeChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${activeChat.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg && newMsg.chat_id === activeChat.id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, [activeChat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatRoleCounts = useMemo(() => {
    let all = chats.length;
    let customers = 0;
    let vendors = 0;
    let team = 0;
    let ai = 0;
    let human = 0;

    for (const c of chats) {
      const r = c.contact_role || "customer";
      if (r === "vendor") vendors++;
      else if (r === "team") team++;
      else customers++;

      if (c.chat_mode === "ai") ai++;
      else human++;
    }

    return { all, customers, vendors, team, ai, human };
  }, [chats]);

  const filteredChats = useMemo(() => {
    return chats.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPhone = c.customer_phone.toLowerCase().includes(q);
        const matchesName = c.customer_name && c.customer_name.toLowerCase().includes(q);
        if (!matchesPhone && !matchesName) return false;
      }

      const role = c.contact_role || "customer";
      if (contactRoleFilter === "customer" && role !== "customer") return false;
      if (contactRoleFilter === "vendor" && role !== "vendor") return false;
      if (contactRoleFilter === "team" && role !== "team") return false;
      if (contactRoleFilter === "human" && c.chat_mode !== "human") return false;
      if (contactRoleFilter === "ai" && c.chat_mode !== "ai") return false;

      return true;
    });
  }, [chats, searchQuery, contactRoleFilter]);

  const filteredGroups = useMemo(() => {
    if (!groupSearchQuery.trim()) return groups;
    const q = groupSearchQuery.toLowerCase();
    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.description && g.description.toLowerCase().includes(q))
    );
  }, [groups, groupSearchQuery]);

  const filteredMembers = useMemo(() => {
    if (!selectedGroup) return [];
    if (!memberSearchQuery.trim()) return selectedGroup.members;
    const q = memberSearchQuery.toLowerCase();
    return selectedGroup.members.filter(
      (m) =>
        m.phoneNumber.includes(q) ||
        (m.customerName && m.customerName.toLowerCase().includes(q))
    );
  }, [selectedGroup, memberSearchQuery]);

  const filteredCrmContacts = useMemo(() => {
    return chats.filter((c) => {
      if (crmMemberSearch.trim()) {
        const q = crmMemberSearch.toLowerCase();
        const matchesPhone = c.customer_phone.includes(q);
        const matchesName = c.customer_name && c.customer_name.toLowerCase().includes(q);
        if (!matchesPhone && !matchesName) return false;
      }

      const role = c.contact_role || "customer";
      if (crmRoleFilter === "customer" && role !== "customer") return false;
      if (crmRoleFilter === "vendor" && role !== "vendor") return false;
      if (crmRoleFilter === "team" && role !== "team") return false;

      return true;
    });
  }, [chats, crmMemberSearch, crmRoleFilter]);

  const handleToggleMode = async (newModeToggle: "human" | "ai") => {
    if (!activeChat) return;
    const prevMode = activeChat.chat_mode;

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

      if (!res.ok) throw new Error("Failed to save chat mode.");
      const data = await res.json();
      if (data.chat) {
        setActiveChat(data.chat);
        setChats((prev) => prev.map((c) => (c.id === data.chat.id ? data.chat : c)));
      }
    } catch (err) {
      console.error("Toggle mode error:", err);
      setActiveChat({ ...activeChat, chat_mode: prevMode });
      setChats((prev) => prev.map((c) => (c.id === activeChat.id ? { ...c, chat_mode: prevMode } : c)));
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
      if (!res.ok) throw new Error(data.error || "Failed to send message via API");
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
    const file = fileToSend || selectedMediaFile;
    const caption = captionToSend || mediaCaption;

    if (!file && !presetUrl) return;

    setIsSendingMedia(true);
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (presetUrl) formData.append("presetUrl", presetUrl);
      if (presetType) formData.append("presetType", presetType);
      if (presetFileName) formData.append("fileName", presetFileName);
      formData.append("chatId", activeChat.id);
      formData.append("customerPhone", activeChat.customer_phone);
      if (caption) formData.append("caption", caption);

      const res = await fetch("/api/messages/media", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send media via WhatsApp API");

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
          contactRole: newContactRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create new conversation.");

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
      setNewContactRole("customer");
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
        setSettingsMsg({ type: "success", text: "Desk settings updated successfully!" });
      } else {
        setSettingsMsg({ type: "error", text: data.error || "Failed to save settings." });
      }
    } catch (err: any) {
      setSettingsMsg({ type: "error", text: err.message || "Network error saving settings." });
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
      <header className="h-16 md:h-20 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo/intri-web-logo.png" alt="Intrihub" className="h-7 md:h-8 w-auto object-contain" />
          </Link>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-[#1E9E6B]">
            <span className="h-2 w-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>WhatsApp Live Desk (+91 70901 20211)</span>
          </div>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "inbox"
                ? "bg-[#F26522] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Live Inbox</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("groups");
              fetchGroups();
              fetchTemplates();
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "groups"
                ? "bg-[#052A51] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Broadcast Groups</span>
          </button>
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#052A51] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Desk Settings</span>
          </button>
        </div>

        {/* Actions & Install App */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Download / Install App Button */}
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#1E9E6B] border border-emerald-200 text-xs font-extrabold shadow-2xs transition-all cursor-pointer"
            title="Download & Install HelpDesk App on Phone / PC"
          >
            <DownloadCloud className="h-4 w-4 text-[#25D366]" />
            <span className="hidden xs:inline">{isAppInstalled ? "App Installed" : "Install App"}</span>
          </button>

          <button
            onClick={() => setIsNewChatOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Message</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200 cursor-pointer"
            title="Logout from Customer Desk"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Dismissible Install App Banner (Mobile & Desktop) */}
      {!isAppInstalled && showInstallBanner && (
        <div className="bg-gradient-to-r from-[#052A51] via-[#0b3d75] to-[#128C7E] text-white px-3 md:px-6 py-2.5 flex items-center justify-between shadow-xs text-xs z-20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <Smartphone className="w-4 h-4 text-[#25D366]" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs truncate">Install IntriHub HelpDesk App</p>
              <p className="text-[10px] text-slate-200 truncate">Run as a full-screen WhatsApp-style mobile app with instant alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-extrabold rounded-lg text-xs transition-colors shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              onClick={() => setShowInstallBanner(false)}
              className="p-1 text-white/70 hover:text-white rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {/* ========================================================================= */}
        {/* TAB 1: LIVE INBOX */}
        {/* ========================================================================= */}
        {activeTab === "inbox" && (
          <div className="flex-1 flex h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] pb-16 md:pb-0 overflow-hidden">
            {/* Left Chat List (Mobile & Desktop) */}
            <aside className={`w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0 ${activeChat ? "hidden md:flex" : "flex"}`}>
              <div className="p-4 border-b border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="font-extrabold text-base text-[#052A51] flex items-center gap-2">
                    <Headphones className="w-5 h-5 text-[#F26522]" />
                    <span>WhatsApp Inquiries</span>
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => fetchChats(true)}
                      className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Refresh conversations"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsNewChatOpen(true)}
                      className="p-2 bg-orange-50 text-[#F26522] hover:bg-orange-100 rounded-lg transition-colors cursor-pointer"
                      title="Type new phone number"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or mobile number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F26522] focus:bg-white transition-colors"
                  />
                </div>

                {/* 1-Click Quick Filter Bar (Role & Mode) */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                  <button
                    onClick={() => setContactRoleFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                      contactRoleFilter === "all"
                        ? "bg-[#052A51] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({chatRoleCounts.all})
                  </button>
                  <button
                    onClick={() => setContactRoleFilter("customer")}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                      contactRoleFilter === "customer"
                        ? "bg-[#1E9E6B] text-white"
                        : "bg-emerald-50 text-[#1E9E6B] border border-emerald-100 hover:bg-emerald-100"
                    }`}
                  >
                    <User className="w-3 h-3" />
                    <span>Customers ({chatRoleCounts.customers})</span>
                  </button>
                  <button
                    onClick={() => setContactRoleFilter("vendor")}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                      contactRoleFilter === "vendor"
                        ? "bg-purple-700 text-white"
                        : "bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100"
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>Vendors ({chatRoleCounts.vendors})</span>
                  </button>
                  <button
                    onClick={() => setContactRoleFilter("team")}
                    className={`px-2.5 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1 ${
                      contactRoleFilter === "team"
                        ? "bg-blue-700 text-white"
                        : "bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100"
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    <span>Team ({chatRoleCounts.team})</span>
                  </button>
                  <button
                    onClick={() => setContactRoleFilter("human")}
                    className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                      contactRoleFilter === "human"
                        ? "bg-[#1E9E6B] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title="Direct Agent Assigned"
                  >
                    Agent ({chatRoleCounts.human})
                  </button>
                  <button
                    onClick={() => setContactRoleFilter("ai")}
                    className={`px-2 py-1 rounded-lg font-bold shrink-0 transition-colors cursor-pointer ${
                      contactRoleFilter === "ai"
                        ? "bg-[#F26522] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                    title="AI Auto Responder"
                  >
                    AI ({chatRoleCounts.ai})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {isLoadingChats ? (
                  <div className="py-12 text-center text-slate-400 space-y-2 text-xs">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#F26522]" />
                    <p>Loading WhatsApp inquiries...</p>
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-3 text-xs p-4">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">No matching conversations found</p>
                    <p className="text-[11px] text-slate-400">
                      Try clearing the filter or sending a new message to a number.
                    </p>
                  </div>
                ) : (
                  filteredChats.map((chat) => {
                    const role = chat.contact_role || "customer";
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center gap-3 border cursor-pointer ${
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
                          <div className="flex justify-between items-center w-full mt-1 gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs text-slate-500 font-mono truncate">{chat.customer_phone}</span>
                              {role === "vendor" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 text-purple-800 border border-purple-200 shrink-0">
                                  Vendor
                                </span>
                              )}
                              {role === "team" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                                  Team
                                </span>
                              )}
                              {role === "customer" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                                  User
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                chat.chat_mode === "ai"
                                  ? "bg-orange-100 text-[#F26522] border border-orange-200"
                                  : "bg-emerald-100 text-[#1E9E6B] border border-emerald-200"
                              }`}
                            >
                              {chat.chat_mode === "ai" ? "AI" : "AGENT"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Middle Active Chat Stream (Full Screen on Mobile) */}
            <div className={`flex-1 flex flex-col bg-[#efeae2]/40 md:bg-[#f8fafc] overflow-hidden border-r border-slate-200 ${!activeChat ? "hidden md:flex" : "flex"}`}>
              {activeChat ? (
                <>
                  {/* Chat Header (Native WhatsApp Style) */}
                  <header className="h-16 px-3 md:px-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shrink-0 shadow-2xs">
                    <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
                      {/* Mobile Back Button to Chat List */}
                      <button
                        onClick={() => setActiveChat(null)}
                        className="md:hidden p-1.5 -ml-1 text-slate-700 hover:text-[#052A51] hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                        title="Back to Chats"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <button
                        onClick={() => {
                          fetchCustomerProfile(activeChat.customer_phone);
                          setIsProfilePanelOpen(true);
                        }}
                        className="flex items-center gap-2.5 md:gap-3 text-left hover:opacity-80 transition-opacity group cursor-pointer min-w-0"
                        title="Click to view full Customer WhatsApp Profile & Details"
                      >
                        <CustomerAvatar
                          name={activeChat.customer_name}
                          phone={activeChat.customer_phone}
                          size="md"
                          showOnline={true}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-[#052A51] text-xs md:text-sm group-hover:text-[#F26522] transition-colors truncate">
                              {activeChat.customer_name || "WhatsApp Customer"}
                            </h3>
                            <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#F26522] shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 truncate">
                            <span>{activeChat.customer_phone}</span>
                            <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                              Verified
                            </span>
                          </p>
                        </div>
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
                      {/* Direct Call Icon */}
                      <a
                        href={`tel:+${activeChat.customer_phone}`}
                        className="p-2 text-slate-600 hover:text-[#1E9E6B] hover:bg-emerald-50 rounded-xl transition-colors"
                        title="Call customer"
                      >
                        <Phone className="w-4 h-4" />
                      </a>

                      {/* Customer Profile Trigger Button */}
                      <button
                        onClick={() => {
                          fetchCustomerProfile(activeChat.customer_phone);
                          setIsProfilePanelOpen(true);
                        }}
                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        <span>Contact Info</span>
                      </button>

                      {/* Orders Panel Toggle */}
                      <button
                        onClick={() => setIsOrderPanelOpen(!isOrderPanelOpen)}
                        className={`inline-flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          isOrderPanelOpen
                            ? "bg-[#052A51] text-white border-[#052A51]"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                        title="Toggle Orders CRM drawer"
                      >
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden sm:inline">Orders</span>
                        {orders.length > 0 && (
                          <span className="bg-[#F26522] text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                            {orders.length}
                          </span>
                        )}
                      </button>

                      {/* Dual Mode Switcher Button */}
                      <div className="flex items-center bg-slate-100 p-0.5 md:p-1 rounded-xl border border-slate-200">
                        <button
                          onClick={() => handleToggleMode("human")}
                          className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
                            activeChat.chat_mode === "human"
                              ? "bg-[#1E9E6B] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <UserCheck className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="hidden sm:inline">Agent</span>
                        </button>
                        <button
                          onClick={() => handleToggleMode("ai")}
                          className={`flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[11px] md:text-xs font-bold transition-all cursor-pointer ${
                            activeChat.chat_mode === "ai"
                              ? "bg-[#F26522] text-white shadow-2xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" /> <span className="hidden sm:inline">AI</span>
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
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-orange-50 text-[#F26522] border border-orange-200 rounded-lg font-bold shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                        title="Send Official IntriHub Catalog to WhatsApp customer"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#F26522]" />
                        <span>Send Catalog PDF</span>
                      </button>
                      <button
                        onClick={() => mediaFileInputRef.current?.click()}
                        disabled={isSendingMedia}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-bold shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
                        title="Attach sample tile image or custom document"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                        <span>Attach PDF / Image</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
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

                  {/* Message Input Bar */}
                  <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-3">
                    <input
                      type="file"
                      ref={mediaFileInputRef}
                      accept="image/png,image/jpeg,image/webp,application/pdf"
                      className="hidden"
                      onChange={handleMediaFileSelected}
                    />

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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50 cursor-pointer"
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
                          className="p-2 text-slate-500 hover:text-[#F26522] hover:bg-slate-100 rounded-lg transition-colors shrink-0 cursor-pointer"
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
                          className="p-2.5 bg-[#F26522] hover:bg-[#d95a1e] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-2xs shrink-0 cursor-pointer"
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
                          className="text-xs px-3.5 py-1.5 rounded-lg bg-[#F26522] hover:bg-[#d95a1e] text-white font-bold transition-colors shrink-0 shadow-2xs cursor-pointer"
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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Type New Number & Send Message
                  </button>
                </div>
              )}
            </div>

            {/* Right Customer Orders & CRM Intelligence Panel */}
            {isOrderPanelOpen && activeChat && (
              <aside className="w-80 lg:w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden z-20">
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-extrabold text-[#052A51]">
                                #{order.id.slice(-8).toUpperCase()}
                              </span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(order.id);
                                  setCopiedOrderId(order.id);
                                  setTimeout(() => setCopiedOrderId(null), 2000);
                                }}
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

                          <div className="space-y-1.5">
                            {order.items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.image ? (
                                    <img src={item.image} alt={item.productName} className="w-7 h-7 rounded-lg object-cover border border-slate-200" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-[#F26522] flex items-center justify-center font-bold text-[10px]">IH</div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#052A51] truncate text-[11px]">{item.productName}</p>
                                    <p className="text-[10px] text-slate-400">{item.boxQuantity} Boxes • ₹{item.pricePerBox}/box</p>
                                  </div>
                                </div>
                                <span className="font-extrabold text-slate-700 text-xs shrink-0">₹{item.totalPrice.toLocaleString("en-IN")}</span>
                              </div>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const itemsSummary = order.items.map((it) => `${it.boxQuantity}x ${it.productName}`).join(", ");
                              const text = `Hi ${order.customerName || "there"}! Regarding your IntriHub order #${order.id} (${itemsSummary} • Total ₹${order.total.toLocaleString("en-IN")}): The status is "${order.orderStatus.toUpperCase()}". Delivery ETA: ${order.estimatedDelivery}. Let me know if you need any further help!`;
                              setInputText(text);
                              if (activeChat?.chat_mode !== "human") handleToggleMode("human");
                            }}
                            className="w-full py-1.5 bg-orange-50 hover:bg-orange-100 text-[#F26522] rounded-xl text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5 border border-orange-200 cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Insert Status into Chat
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-12 text-center text-slate-400 space-y-2 text-xs">
                      <Package className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="font-bold text-slate-600">No previous orders found</p>
                      <p className="text-[11px] text-slate-400">This number has not placed an e-commerce order on IntriHub yet.</p>
                    </div>
                  )}
                </div>
              </aside>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BROADCAST GROUPS & CAMPAIGNS */}
        {/* ========================================================================= */}
        {activeTab === "groups" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#f8fafc]">
            {!selectedGroup ? (
              <div className="max-w-6xl mx-auto space-y-6">
                {/* Broadcast Header & Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-[#052A51] flex items-center gap-2.5">
                      <Users className="h-7 w-7 text-[#F26522]" />
                      <span>WhatsApp Broadcast Groups</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Group customer numbers and broadcast promotions, price lists & PDF catalogs via Meta Cloud API.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => fetchTemplates()}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                      title="View pre-approved Meta message templates"
                    >
                      <Radio className="h-4 w-4 text-[#1E9E6B]" />
                      <span>Meta Templates</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsCreateGroupModalOpen(true);
                        setSelectedCrmPhones([]);
                        setPastedNumbers("");
                        setCreateGroupError(null);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Create Broadcast Group</span>
                    </button>
                  </div>
                </div>

                {/* Broadcast Groups Metrics Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Total Groups</span>
                    <p className="text-2xl font-extrabold text-[#052A51]">{groups.length}</p>
                    <span className="text-[10px] text-slate-500">Segmented WhatsApp lists</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Total Reachable Contacts</span>
                    <p className="text-2xl font-extrabold text-[#1E9E6B]">
                      {groups.reduce((acc, g) => acc + g.memberCount, 0)}
                    </p>
                    <span className="text-[10px] text-slate-500">Verified WhatsApp recipients</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Campaigns Dispatched</span>
                    <p className="text-2xl font-extrabold text-[#F26522]">
                      {groups.reduce((acc, g) => acc + g.broadcastCount, 0)}
                    </p>
                    <span className="text-[10px] text-slate-500">Total broadcast executions</span>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[11px] font-bold uppercase text-slate-400">24-Hour Session Gate</span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Template Fallback Active</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Meta policy compliant</span>
                  </div>
                </div>

                {/* Search Groups Filter */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search broadcast groups by name or description..."
                    value={groupSearchQuery}
                    onChange={(e) => setGroupSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F26522] shadow-2xs transition-colors"
                  />
                </div>

                {/* Groups Grid */}
                {isLoadingGroups ? (
                  <div className="py-16 text-center text-slate-400 space-y-2 text-xs">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#F26522]" />
                    <p>Loading broadcast groups...</p>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 space-y-4">
                    <Users className="w-12 h-12 mx-auto text-slate-300" />
                    <div>
                      <h3 className="text-base font-bold text-[#052A51]">No Broadcast Groups Found</h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Create your first broadcast group to send updates to contractors, builders, or tile buyers in one click.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCreateGroupModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all cursor-pointer"
                    >
                      <Plus className="h-4 w-4" /> Create Broadcast Group
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredGroups.map((group) => (
                      <div
                        key={group.id}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="h-10 w-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F26522] font-bold shadow-2xs shrink-0">
                                <Users className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-sm font-extrabold text-[#052A51] group-hover:text-[#F26522] transition-colors">
                                  {group.name}
                                </h3>
                                <p className="text-[11px] text-slate-400">
                                  Created {new Date(group.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-slate-100 text-[#052A51] border border-slate-200 shrink-0">
                              {group.memberCount} Members
                            </span>
                          </div>

                          {group.description && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {group.description}
                            </p>
                          )}

                          {group.lastBroadcast ? (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-[#052A51]">Last Broadcast:</span>
                                <span className="text-emerald-700">
                                  {group.lastBroadcast.successCount}/{group.lastBroadcast.totalRecipients} Delivered
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 truncate">
                                {new Date(group.lastBroadcast.sentAt).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                              </p>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-400">
                              No broadcasts sent yet
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => {
                              fetchGroupDetails(group.id);
                              setGroupDetailTab("members");
                            }}
                            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-[#052A51] rounded-xl text-xs font-bold transition-colors text-center cursor-pointer"
                          >
                            Manage Members
                          </button>
                          <button
                            onClick={() => handleOpenBroadcastComposer(group)}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                            title="Compose Broadcast"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Broadcast</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Group Detail Screen */
              <div className="max-w-5xl mx-auto space-y-6">
                {/* Back to list & Group title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedGroup(null)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#052A51] mb-1 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back to All Groups</span>
                    </button>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-extrabold text-[#052A51]">{selectedGroup.name}</h2>
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-[#F26522] border border-orange-200">
                        {selectedGroup.members.length} Members
                      </span>
                    </div>
                    {selectedGroup.description && (
                      <p className="text-xs text-slate-500">{selectedGroup.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setIsAddMembersModalOpen(true);
                        setAddMembersRawInput("");
                        setAddMembersCrmPhones([]);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <UserPlus className="h-4 w-4 text-[#052A51]" />
                      <span>Add Members</span>
                    </button>
                    <button
                      onClick={() => handleOpenBroadcastComposer(selectedGroup)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-xl text-xs font-bold shadow-md shadow-[#F26522]/20 transition-all cursor-pointer"
                    >
                      <Send className="h-4 w-4" />
                      <span>Send Broadcast</span>
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(selectedGroup.id)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete Group"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: Members vs Broadcast History */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setGroupDetailTab("members")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      groupDetailTab === "members"
                        ? "bg-[#052A51] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    <span>Members List ({selectedGroup.members.length})</span>
                  </button>
                  <button
                    onClick={() => setGroupDetailTab("history")}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      groupDetailTab === "history"
                        ? "bg-[#052A51] text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <History className="h-4 w-4" />
                    <span>Broadcast History ({selectedGroup.logs.length})</span>
                  </button>
                </div>

                {/* SUB-TAB 1: MEMBERS */}
                {groupDetailTab === "members" && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="relative max-w-sm flex-1">
                        <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search group members..."
                          value={memberSearchQuery}
                          onChange={(e) => setMemberSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#F26522] transition-colors"
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-bold">
                        {filteredMembers.length} contact{filteredMembers.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredMembers.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          No members matching search query
                        </div>
                      ) : (
                        filteredMembers.map((member) => (
                          <div key={member.id} className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors">
                            <div className="flex items-center gap-3">
                              <CustomerAvatar name={member.customerName} phone={member.phoneNumber} size="sm" showOnline={false} />
                              <div>
                                <p className="text-xs font-bold text-[#052A51]">
                                  {member.customerName || "WhatsApp Customer"}
                                </p>
                                <p className="text-[11px] text-slate-500 font-mono">
                                  +{member.phoneNumber}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                Added {new Date(member.addedAt).toLocaleDateString()}
                              </span>
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                title="Remove from group"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* SUB-TAB 2: BROADCAST HISTORY */}
                {groupDetailTab === "history" && (
                  <div className="space-y-4">
                    {selectedGroup.logs.length === 0 ? (
                      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                        <History className="w-10 h-10 mx-auto text-slate-300" />
                        <h3 className="text-sm font-bold text-[#052A51]">No Broadcast History Yet</h3>
                        <p className="text-xs text-slate-400">
                          Click "Send Broadcast" to launch your first message or catalog to this group.
                        </p>
                      </div>
                    ) : (
                      selectedGroup.logs.map((log) => {
                        const isExpanded = expandedLogId === log.id;
                        return (
                          <div key={log.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-orange-100 text-[#F26522]">
                                  <Radio className="h-4 w-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-[#052A51]">
                                    Broadcast Campaign
                                  </span>
                                  <p className="text-[11px] text-slate-400">
                                    {new Date(log.sentAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} • by {log.sentBy}
                                  </p>
                                </div>
                              </div>

                              {/* Badges */}
                              <div className="flex items-center gap-2 text-xs font-extrabold">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  ✅ {log.successCount} Sent
                                </span>
                                {log.skippedCount > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200" title="Skipped: Outside 24h Meta session window">
                                    ⚠️ {log.skippedCount} Skipped
                                  </span>
                                )}
                                {log.failedCount > 0 && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                    ❌ {log.failedCount} Failed
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Message Preview */}
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
                              {log.messageContent}
                            </div>

                            {/* Expand entries button */}
                            <div className="flex items-center justify-between pt-1 text-xs">
                              <span className="text-slate-400 text-[11px]">
                                Total Recipients: {log.totalRecipients}
                              </span>
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-[#F26522] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? "Hide Per-Number Status" : "View Per-Number Delivery Status"}
                                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              </button>
                            </div>

                            {/* Expanded Entries Breakdown */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 max-h-60 overflow-y-auto">
                                {log.entries.map((ent) => (
                                  <div key={ent.id} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[#052A51]">+{ent.phoneNumber}</span>
                                      {ent.customerName && <span className="text-slate-400">({ent.customerName})</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                          ent.status === "sent"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : ent.status === "skipped"
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {ent.status}
                                      </span>
                                      {ent.errorMessage && (
                                        <span className="text-[10px] text-red-500 max-w-xs truncate" title={ent.errorMessage}>
                                          {ent.errorMessage}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: OVERVIEW & STATS */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#f8fafc]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#052A51] flex items-center gap-2">
                  <LayoutDashboard className="h-6 w-6 text-[#F26522]" />
                  <span>Support Desk Intelligence</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time performance metrics and catalog vector analytics</p>
              </div>
              <button
                onClick={fetchStats}
                disabled={isLoadingStats}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingStats ? "animate-spin" : ""}`} />
                <span>Refresh Live KPIs</span>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Total Conversations</span>
                <p className="text-3xl font-extrabold text-[#052A51]">{stats?.totalChats || 0}</p>
                <p className="text-xs text-slate-500">All registered WhatsApp customers</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Active Inquiries</span>
                <p className="text-3xl font-extrabold text-[#F26522]">{stats?.activeChats || 0}</p>
                <p className="text-xs text-slate-500">Ongoing chat threads</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">AI Instant Resolution</span>
                <p className="text-3xl font-extrabold text-[#1E9E6B]">{stats?.aiResolutionRate || "100%"}</p>
                <p className="text-xs text-slate-500">Powered by Gemini 2.5 Flash RAG</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2">
                <span className="text-xs font-bold uppercase text-slate-400">Catalog Knowledge Chunks</span>
                <p className="text-3xl font-extrabold text-[#052A51]">{stats?.totalKnowledgeChunks || 0}</p>
                <p className="text-xs text-slate-500">Indexed vector embeddings</p>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-[#052A51]">Message Volume Distribution</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>AI Executive Responses</span>
                      <span>{stats?.aiMessages || 0} ({aiPercentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[#F26522] rounded-full transition-all duration-500" style={{ width: `${aiPercentage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Human Support Agent Messages</span>
                      <span>{stats?.humanMessages || 0} ({humanPercentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[#052A51] rounded-full transition-all duration-500" style={{ width: `${humanPercentage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Incoming WhatsApp Customer Inquiries</span>
                      <span>{stats?.customerMessages || 0} ({customerPercentage}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-[#1E9E6B] rounded-full transition-all duration-500" style={{ width: `${customerPercentage}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
                <h3 className="text-base font-bold text-[#052A51]">Recent Active Conversations</h3>
                <div className="divide-y divide-slate-100">
                  {stats?.recentChats && stats.recentChats.length > 0 ? (
                    stats.recentChats.map((c) => (
                      <div key={c.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar name={c.customer_name} phone={c.customer_phone} size="sm" showOnline={false} />
                          <div>
                            <p className="font-bold text-[#052A51]">{c.customer_name || c.customer_phone}</p>
                            <p className="text-slate-400 font-mono">{c.customer_phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.chat_mode === "ai" ? "bg-orange-100 text-[#F26522]" : "bg-emerald-100 text-[#1E9E6B]"}`}>
                            {c.chat_mode === "ai" ? "INSTANT" : "DIRECT"}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(c.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 py-4">No recent activity logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: SETTINGS & LIVE WABA CONNECTION */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#f8fafc]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#052A51] flex items-center gap-2">
                  <Settings className="h-6 w-6 text-[#052A51]" />
                  <span>Autobot Configuration & System Prompts</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Manage AI persona, system prompt instructions, and official catalog RAG</p>
              </div>
              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50 cursor-pointer"
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

            {/* Live WhatsApp Business (WABA) Connection Card */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/70 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#052A51] flex items-center gap-2">
                      Official WhatsApp Business Number (WABA) Setup
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Live Cloud API
                      </span>
                    </h3>
                    <p className="text-xs text-slate-600">
                      Connect your real number (<strong className="font-mono text-[#052A51]">+91 70901 20211</strong>) so any customer message opens directly in this dashboard with instant AI responses.
                    </p>
                  </div>
                </div>
              </div>

              {/* Webhook Connection Endpoints */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Meta Webhook Callback URL</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("https://www.intrihub.com/api/webhook");
                        setSettingsMsg({ type: "success", text: "Webhook URL copied to clipboard!" });
                        setTimeout(() => setSettingsMsg(null), 3000);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26522] hover:underline cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy URL
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#052A51] bg-slate-50 p-2 rounded-lg border border-slate-100 truncate select-all">
                    https://www.intrihub.com/api/webhook
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-slate-400">Webhook Verify Token</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("my_secret_agent_123");
                        setSettingsMsg({ type: "success", text: "Verify Token copied to clipboard!" });
                        setTimeout(() => setSettingsMsg(null), 3000);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F26522] hover:underline cursor-pointer"
                    >
                      <Copy className="h-3 w-3" /> Copy Token
                    </button>
                  </div>
                  <p className="font-mono text-xs font-bold text-[#052A51] bg-slate-50 p-2 rounded-lg border border-slate-100 truncate select-all">
                    my_secret_agent_123
                  </p>
                </div>
              </div>

              {/* Step-by-Step Onboarding Guide */}
              <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#052A51] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  How to link +91 70901 20211 to Meta Cloud API (4 Easy Steps):
                </h4>
                <ol className="list-decimal list-inside text-xs space-y-2 text-slate-700 leading-relaxed font-medium">
                  <li>
                    <strong className="text-slate-900">Remove from phone WhatsApp app:</strong> Phone WhatsApp settings ➔ Account ➔ Delete Account (so the number frees up for Cloud API).
                  </li>
                  <li>
                    <strong className="text-slate-900">Add to Meta Business Manager:</strong> Go to <a href="https://business.facebook.com" target="_blank" rel="noreferrer" className="text-[#F26522] font-bold hover:underline inline-flex items-center gap-0.5">business.facebook.com <ExternalLink className="h-3 w-3" /></a> ➔ WhatsApp Accounts ➔ WhatsApp Manager ➔ Phone Numbers ➔ <strong>"Add Phone Number"</strong>.
                  </li>
                  <li>
                    <strong className="text-slate-900">Enter Number & Verify OTP:</strong> Enter <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#052A51]">+91 70901 20211</code> and enter the 6-digit OTP received via SMS.
                  </li>
                  <li>
                    <strong className="text-slate-900">Get Permanent Token:</strong> In Meta Business Settings ➔ System Users ➔ Generate Token with <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">whatsapp_business_messaging</code> permission.
                  </li>
                </ol>
              </div>
            </div>

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
                    className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50 cursor-pointer"
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

      {/* ========================================================================= */}
      {/* SLIDE-IN DETAILED CUSTOMER PROFILE PANEL (WHATSAPP CONTACT INFO SCREEN) */}
      {/* ========================================================================= */}
      {isProfilePanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <aside className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-250">
            {/* Panel Top Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-extrabold text-[#052A51] flex items-center gap-2">
                <User className="h-4 w-4 text-[#F26522]" />
                <span>Customer WhatsApp Contact Info</span>
              </h3>
              <button
                onClick={() => setIsProfilePanelOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoadingProfile ? (
                <div className="py-20 text-center text-slate-400 space-y-2 text-xs">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#F26522]" />
                  <p>Loading WhatsApp profile details...</p>
                </div>
              ) : customerProfile ? (
                <>
                  {/* Avatar & Core Identity */}
                  <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
                    <CustomerAvatar
                      name={customerProfile.name}
                      phone={customerProfile.phone}
                      size="xl"
                      showOnline={true}
                    />

                    {/* Editable Name */}
                    <div className="w-full">
                      {isEditingProfileName ? (
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="text"
                            value={profileEditName}
                            onChange={(e) => setProfileEditName(e.target.value)}
                            placeholder="Enter customer name or company..."
                            className="text-center font-bold text-base text-[#052A51] px-3 py-1 bg-slate-50 border border-[#F26522] rounded-xl focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveProfile()}
                            disabled={isSavingProfile}
                            className="p-1.5 bg-[#F26522] text-white rounded-lg text-xs font-bold cursor-pointer"
                            title="Save Name"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingProfileName(false);
                              setProfileEditName(customerProfile.rawName || "");
                            }}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs cursor-pointer"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 group">
                          <h2 className="text-lg font-extrabold text-[#052A51]">
                            {customerProfile.name}
                          </h2>
                          <button
                            onClick={() => setIsEditingProfileName(true)}
                            className="p-1 text-slate-400 hover:text-[#F26522] rounded-md transition-colors cursor-pointer"
                            title="Edit customer display name"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {customerProfile.displayPhone}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(customerProfile.phone);
                            alert("Phone number copied to clipboard!");
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          title="Copy phone"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>

                      {/* 1-Click Role Switcher */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Contact Category
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 w-full">
                          <button
                            type="button"
                            onClick={() => handleSaveProfile("customer")}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                              (customerProfile.role || "customer") === "customer"
                                ? "bg-[#1E9E6B] border-[#1E9E6B] text-white shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <User className="w-3 h-3" />
                            <span>Customer</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveProfile("vendor")}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                              customerProfile.role === "vendor"
                                ? "bg-purple-700 border-purple-700 text-white shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <Building2 className="w-3 h-3" />
                            <span>Vendor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveProfile("team")}
                            className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 border ${
                              customerProfile.role === "team"
                                ? "bg-blue-700 border-blue-700 text-white shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <Users className="w-3 h-3" />
                            <span>Team</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline & First Contacted Timestamps */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-[#F26522]" /> First Contacted
                      </span>
                      <span className="text-xs font-bold text-[#052A51] mt-0.5 block">
                        {customerProfile.firstContactedAt
                          ? new Date(customerProfile.firstContactedAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })
                          : "Today"}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" /> Last Active
                      </span>
                      <span className="text-xs font-bold text-[#052A51] mt-0.5 block">
                        {customerProfile.lastActiveAt
                          ? new Date(customerProfile.lastActiveAt).toLocaleDateString([], { month: "short", day: "numeric" })
                          : "Active Now"}
                      </span>
                    </div>
                  </div>

                  {/* WhatsApp Cloud API Profile Field Notice */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-[#052A51] flex items-center gap-1.5 text-[11px] uppercase">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Meta WhatsApp Cloud API Metadata
                    </span>
                    <p className="text-slate-600 text-[11px]">
                      Display Name: <strong>{customerProfile.rawName || "Provided via incoming WhatsApp contact"}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      *Note: Meta Cloud API restricts direct access to private WhatsApp DP photos. Color-coded initials avatar is securely generated.
                    </p>
                  </div>

                  {/* Customer Purchase & CRM Summary */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      IntriHub Purchase History
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Orders</span>
                        <span className="text-base font-extrabold text-[#052A51]">{customerProfile.totalOrders} Placed</span>
                      </div>
                      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Lifetime Spend</span>
                        <span className="text-base font-extrabold text-[#1E9E6B]">₹{customerProfile.lifetimeSpend.toLocaleString("en-IN")}</span>
                      </div>
                    </div>

                    {/* Expandable Past Orders List */}
                    <div className="space-y-1.5 pt-1">
                      {customerProfile.orders && customerProfile.orders.length > 0 ? (
                        customerProfile.orders.map((ord: any) => {
                          const isExpanded = expandedProfileOrderId === ord.id;
                          return (
                            <div
                              key={ord.id}
                              className="bg-white rounded-xl border border-slate-200 p-3 text-xs shadow-2xs transition-all"
                            >
                              <div
                                onClick={() => setExpandedProfileOrderId(isExpanded ? null : ord.id)}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <span className="font-mono font-bold text-[#052A51]">
                                    #{ord.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-slate-400 ml-2">
                                    {new Date(ord.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-[#1E9E6B]">₹{ord.total?.toLocaleString("en-IN")}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800">
                                    {ord.orderStatus || "CONFIRMED"}
                                  </span>
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                                      isExpanded ? "rotate-90" : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Expanded Order Items */}
                              {isExpanded && ord.items && ord.items.length > 0 && (
                                <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1 text-[11px]">
                                  {ord.items.map((item: any) => (
                                    <div key={item.id} className="flex justify-between items-center text-slate-600">
                                      <span className="truncate max-w-[180px]">
                                        {item.productName} ({item.boxQuantity} boxes)
                                      </span>
                                      <span className="font-mono font-bold text-slate-800">
                                        ₹{item.totalPrice?.toLocaleString("en-IN")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400">
                          No orders yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Support Agent Private Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Agent Private Notes
                      </h4>
                      {profileSaveSuccess && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Saved
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      value={profileNotes}
                      onChange={(e) => setProfileNotes(e.target.value)}
                      placeholder="Add private customer tags, architect firm details, payment preferences, or site location notes..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-[#F26522] focus:outline-none"
                    />
                    <button
                      onClick={() => handleSaveProfile()}
                      disabled={isSavingProfile}
                      className="w-full py-2 bg-[#052A51] hover:bg-[#F26522] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      {isSavingProfile ? "Saving Notes..." : "Save Customer Notes"}
                    </button>
                  </div>

                  {/* Broadcast Groups Membership */}
                  <div className="space-y-3 pb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Broadcast Groups ({customerProfile.broadcastGroups.length})
                    </h4>

                    {customerProfile.broadcastGroups.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {customerProfile.broadcastGroups.map((bg) => (
                          <span
                            key={bg.groupId}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 text-[#F26522] border border-orange-200 text-xs font-bold"
                          >
                            <Users className="h-3 w-3" />
                            <span>{bg.groupName}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Not a member of any broadcast group yet.</p>
                    )}

                    {/* Quick Add to Group */}
                    {customerProfile.availableGroups.length > 0 && (
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={selectedAddToGroupId}
                          onChange={(e) => setSelectedAddToGroupId(e.target.value)}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#F26522]"
                        >
                          <option value="">Select a Broadcast Group...</option>
                          {customerProfile.availableGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddCustomerToGroup}
                          disabled={!selectedAddToGroupId || isAddingToGroup}
                          className="px-3.5 py-1.5 bg-[#1E9E6B] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {isAddingToGroup ? "Adding..." : "+ Add to Group"}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE BROADCAST GROUP */}
      {/* ========================================================================= */}
      {isCreateGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-[#F26522]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#052A51]">Create New Broadcast Group</h3>
                  <p className="text-xs text-slate-500">Create a named list of WhatsApp recipients for bulk campaigns</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateGroupModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createGroupError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600">
                {createGroupError}
              </div>
            )}

            <form onSubmit={handleCreateGroup} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. South Bangalore Builders & Architects"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#F26522] focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Group Description (Optional)
                </label>
                <input
                  type="text"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="e.g. Tile contractors receiving weekly wholesale price drops"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#F26522] focus:outline-none"
                />
              </div>

              {/* Choose Member Source Mode */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Add Initial Members
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateGroupMemberMode("crm")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      createGroupMemberMode === "crm"
                        ? "bg-[#052A51] border-[#052A51] text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Select from CRM & Inquiries ({chats.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateGroupMemberMode("paste")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      createGroupMemberMode === "paste"
                        ? "bg-[#052A51] border-[#052A51] text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Paste Phone Numbers
                  </button>
                </div>

                {createGroupMemberMode === "crm" ? (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Filter CRM contacts by name or phone..."
                          value={crmMemberSearch}
                          onChange={(e) => setCrmMemberSearch(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs"
                        />
                      </div>
                    </div>

                    {/* 1-Click Role Filter & Fast Batch Selectors */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCrmRoleFilter("all")}
                          className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            crmRoleFilter === "all" ? "bg-[#052A51] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          All
                        </button>
                        <button
                          type="button"
                          onClick={() => setCrmRoleFilter("customer")}
                          className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            crmRoleFilter === "customer" ? "bg-[#1E9E6B] text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Customers
                        </button>
                        <button
                          type="button"
                          onClick={() => setCrmRoleFilter("vendor")}
                          className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            crmRoleFilter === "vendor" ? "bg-purple-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Vendors
                        </button>
                        <button
                          type="button"
                          onClick={() => setCrmRoleFilter("team")}
                          className={`px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer ${
                            crmRoleFilter === "team" ? "bg-blue-700 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          Team
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const vendorPhones = chats.filter((c) => c.contact_role === "vendor").map((c) => c.customer_phone);
                            setSelectedCrmPhones((prev) => Array.from(new Set([...prev, ...vendorPhones])));
                          }}
                          className="px-2 py-0.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md font-extrabold cursor-pointer transition-colors"
                          title="Select all verified vendors & suppliers"
                        >
                          ⚡ All Vendors
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const custPhones = chats.filter((c) => (c.contact_role || "customer") === "customer").map((c) => c.customer_phone);
                            setSelectedCrmPhones((prev) => Array.from(new Set([...prev, ...custPhones])));
                          }}
                          className="px-2 py-0.5 bg-emerald-100 text-[#1E9E6B] hover:bg-emerald-200 rounded-md font-extrabold cursor-pointer transition-colors"
                          title="Select all direct buyers and customers"
                        >
                          ⚡ All Customers
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const teamPhones = chats.filter((c) => c.contact_role === "team").map((c) => c.customer_phone);
                            setSelectedCrmPhones((prev) => Array.from(new Set([...prev, ...teamPhones])));
                          }}
                          className="px-2 py-0.5 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md font-extrabold cursor-pointer transition-colors"
                          title="Select all internal team members"
                        >
                          ⚡ All Team
                        </button>
                        {selectedCrmPhones.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedCrmPhones([])}
                            className="text-red-500 hover:underline font-bold ml-1 cursor-pointer"
                          >
                            Clear ({selectedCrmPhones.length})
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100">
                      {filteredCrmContacts.map((c) => {
                        const isSelected = selectedCrmPhones.includes(c.customer_phone);
                        const role = c.contact_role || "customer";
                        return (
                          <label
                            key={c.id}
                            className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCrmPhones((prev) => [...prev, c.customer_phone]);
                                  } else {
                                    setSelectedCrmPhones((prev) => prev.filter((p) => p !== c.customer_phone));
                                  }
                                }}
                                className="rounded text-[#F26522] focus:ring-[#F26522]"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-[#052A51]">{c.customer_name || "Contact"}</p>
                                  {role === "vendor" && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 text-purple-800">
                                      Vendor
                                    </span>
                                  )}
                                  {role === "team" && (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-blue-100 text-blue-800">
                                      Team
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 font-mono">{c.customer_phone}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {new Date(c.last_message_at).toLocaleDateString()}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-2">
                    <textarea
                      rows={5}
                      value={pastedNumbers}
                      onChange={(e) => setPastedNumbers(e.target.value)}
                      placeholder="Paste mobile numbers separated by commas or on new lines:&#10;9876543210&#10;919876543210&#10;+91 98765 43210"
                      className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-mono text-slate-900 focus:border-[#F26522] focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                      *Numbers will be automatically sanitized into international format (+91).
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateGroupModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGroup || !newGroupName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD MEMBERS TO EXISTING GROUP */}
      {/* ========================================================================= */}
      {isAddMembersModalOpen && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[#052A51]">Add Members to {selectedGroup.name}</h3>
                <p className="text-xs text-slate-500">Paste phone numbers or pick from customer CRM</p>
              </div>
              <button
                onClick={() => setIsAddMembersModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddMembersToGroup} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAddMembersMode("paste")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    addMembersMode === "paste"
                      ? "bg-[#052A51] border-[#052A51] text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Paste Numbers
                </button>
                <button
                  type="button"
                  onClick={() => setAddMembersMode("crm")}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    addMembersMode === "crm"
                      ? "bg-[#052A51] border-[#052A51] text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Choose from CRM
                </button>
              </div>

              {addMembersMode === "paste" ? (
                <textarea
                  rows={5}
                  value={addMembersRawInput}
                  onChange={(e) => setAddMembersRawInput(e.target.value)}
                  placeholder="Paste phone numbers (one per line or comma-separated):&#10;9876543210&#10;919876543210"
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-mono text-slate-900 focus:border-[#F26522] focus:outline-none"
                  autoFocus
                />
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200 text-[11px]">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const vendorPhones = chats.filter((c) => c.contact_role === "vendor").map((c) => c.customer_phone);
                          setAddMembersCrmPhones((prev) => Array.from(new Set([...prev, ...vendorPhones])));
                        }}
                        className="px-2 py-0.5 bg-purple-100 text-purple-800 hover:bg-purple-200 rounded-md font-extrabold cursor-pointer transition-colors"
                      >
                        ⚡ All Vendors
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const custPhones = chats.filter((c) => (c.contact_role || "customer") === "customer").map((c) => c.customer_phone);
                          setAddMembersCrmPhones((prev) => Array.from(new Set([...prev, ...custPhones])));
                        }}
                        className="px-2 py-0.5 bg-emerald-100 text-[#1E9E6B] hover:bg-emerald-200 rounded-md font-extrabold cursor-pointer transition-colors"
                      >
                        ⚡ All Customers
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const teamPhones = chats.filter((c) => c.contact_role === "team").map((c) => c.customer_phone);
                          setAddMembersCrmPhones((prev) => Array.from(new Set([...prev, ...teamPhones])));
                        }}
                        className="px-2 py-0.5 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md font-extrabold cursor-pointer transition-colors"
                      >
                        ⚡ All Team
                      </button>
                    </div>
                    {addMembersCrmPhones.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setAddMembersCrmPhones([])}
                        className="text-red-500 hover:underline font-bold cursor-pointer"
                      >
                        Clear ({addMembersCrmPhones.length})
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-2 divide-y divide-slate-100">
                    {chats.map((c) => {
                      const isSelected = addMembersCrmPhones.includes(c.customer_phone);
                      const role = c.contact_role || "customer";
                      return (
                        <label key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer text-xs">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) setAddMembersCrmPhones((prev) => [...prev, c.customer_phone]);
                                else setAddMembersCrmPhones((prev) => prev.filter((p) => p !== c.customer_phone));
                              }}
                              className="rounded text-[#F26522]"
                            />
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#052A51]">{c.customer_name || c.customer_phone}</span>
                              {role === "vendor" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-purple-100 text-purple-800">
                                  Vendor
                                </span>
                              )}
                              {role === "team" && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold bg-blue-100 text-blue-800">
                                  Team
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{c.customer_phone}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddMembersModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMembers}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all cursor-pointer"
                >
                  {isSubmittingMembers ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  <span>Add to Group</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BROADCAST MESSAGE COMPOSER & CAMPAIGN LAUNCHER */}
      {/* ========================================================================= */}
      {isBroadcastModalOpen && broadcastTargetGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#052A51]">
                    Broadcast to {broadcastTargetGroup.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target Audience: <strong className="text-[#052A51]">{(broadcastTargetGroup as any).memberCount || (broadcastTargetGroup as BroadcastGroupDetail).members?.length || 0} Verified Recipients</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => !isSendingBroadcast && setIsBroadcastModalOpen(false)}
                disabled={isSendingBroadcast}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {/* 24-Hour Rule Explanation Banner */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <span>Meta 24-Hour Customer Window & Template Rule</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  WhatsApp allows free-form text to contacts who messaged within 24 hours. For all other contacts, Meta requires a pre-approved template message.
                </p>
              </div>

              {/* Message Textarea */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Broadcast Message Content
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessageText}
                  onChange={(e) => setBroadcastMessageText(e.target.value)}
                  placeholder="Type promotional update, bulk pricing announcement, or product launch message..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-900 focus:border-[#F26522] focus:outline-none"
                />
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Supports standard WhatsApp formatting (*bold*, _italic_)</span>
                  <span>{broadcastMessageText.length} characters</span>
                </div>
              </div>

              {/* Media Attachment Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Optional Media Attachment
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="broadcastMediaInput"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setBroadcastSelectedMedia(f);
                        if (f.type.startsWith("image/")) setBroadcastMediaPreview(URL.createObjectURL(f));
                        else setBroadcastMediaPreview(null);
                        setBroadcastMediaCaption(f.name.replace(/\.[^/.]+$/, ""));
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById("broadcastMediaInput")?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    <span>{broadcastSelectedMedia ? "Change Attachment" : "Attach PDF / Photo"}</span>
                  </button>
                  {broadcastSelectedMedia && (
                    <div className="flex items-center gap-2 text-xs text-slate-700 bg-orange-50 px-2.5 py-1 rounded-xl border border-orange-200 truncate">
                      <FileText className="h-3.5 w-3.5 text-[#F26522]" />
                      <span className="truncate max-w-[200px]">{broadcastSelectedMedia.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setBroadcastSelectedMedia(null);
                          setBroadcastMediaPreview(null);
                        }}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Fallback Template Selector */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fallback Meta Approved Template (for out-of-window contacts)
                </label>
                <select
                  value={broadcastTemplateName}
                  onChange={(e) => setBroadcastTemplateName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#F26522]"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.name} value={tpl.name}>
                      {tpl.name} ({tpl.category} • {tpl.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* High Volume Safety Check (if > 20 members) */}
              {((broadcastTargetGroup as any).memberCount || (broadcastTargetGroup as BroadcastGroupDetail).members?.length || 0) > 20 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={broadcastSafetyConfirmed}
                      onChange={(e) => setBroadcastSafetyConfirmed(e.target.checked)}
                      className="mt-0.5 rounded text-[#F26522] focus:ring-[#F26522]"
                    />
                    <span className="font-bold text-[#052A51]">
                      Safety Confirmation: I confirm dispatching this broadcast message to {((broadcastTargetGroup as any).memberCount || (broadcastTargetGroup as BroadcastGroupDetail).members?.length || 0)} recipients sequentially.
                    </span>
                  </label>
                </div>
              )}

              {/* Sending Progress Message */}
              {isSendingBroadcast && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-center space-y-2 text-xs">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#F26522]" />
                  <p className="font-bold text-[#052A51]">{broadcastProgressText || "Broadcasting..."}</p>
                  <p className="text-[10px] text-slate-400">Please do not close this window during dispatch.</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsBroadcastModalOpen(false)}
                disabled={isSendingBroadcast}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBroadcast}
                disabled={
                  isSendingBroadcast ||
                  (!broadcastMessageText.trim() && !broadcastSelectedMedia && !broadcastTemplateName) ||
                  (((broadcastTargetGroup as any).memberCount || (broadcastTargetGroup as BroadcastGroupDetail).members?.length || 0) > 20 && !broadcastSafetyConfirmed)
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSendingBroadcast ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    <span>Launch Broadcast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: BROADCAST RESULTS SUMMARY REPORT */}
      {/* ========================================================================= */}
      {broadcastResultSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-[#1E9E6B] flex items-center justify-center">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#052A51]">Broadcast Execution Completed</h3>
                  <p className="text-xs text-slate-500">Summary of message deliveries via Meta Cloud API</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastResultSummary(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block">Delivered</span>
                <span className="text-xl font-extrabold text-emerald-800">{broadcastResultSummary.successCount}</span>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-amber-600 block">Skipped (24h)</span>
                <span className="text-xl font-extrabold text-amber-800">{broadcastResultSummary.skippedCount}</span>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-red-600 block">Failed</span>
                <span className="text-xl font-extrabold text-red-800">{broadcastResultSummary.failedCount}</span>
              </div>
            </div>

            {broadcastResultSummary.entries && broadcastResultSummary.entries.length > 0 && (
              <div className="flex-1 overflow-y-auto max-h-52 border border-slate-200 rounded-xl p-2 divide-y divide-slate-100 text-xs">
                {broadcastResultSummary.entries.map((entry: any, i: number) => (
                  <div key={i} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#052A51]">+{entry.phoneNumber}</span>
                      {entry.customerName && <span className="text-slate-400">({entry.customerName})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          entry.status === "sent"
                            ? "bg-emerald-100 text-emerald-800"
                            : entry.status === "skipped"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {entry.status}
                      </span>
                      {entry.errorMessage && (
                        <span className="text-[10px] text-red-500 max-w-[150px] truncate" title={entry.errorMessage}>
                          {entry.errorMessage}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setBroadcastResultSummary(null)}
                className="px-5 py-2 bg-[#052A51] hover:bg-[#F26522] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: NEW 1-ON-1 CHAT DIALOG */}
      {/* ========================================================================= */}
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
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
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
                  Contact Type / Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewContactRole("customer")}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newContactRole === "customer"
                        ? "bg-[#1E9E6B] border-[#1E9E6B] text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>User / Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewContactRole("vendor")}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newContactRole === "vendor"
                        ? "bg-purple-700 border-purple-700 text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Vendor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewContactRole("team")}
                    className={`flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newContactRole === "team"
                        ? "bg-blue-700 border-blue-700 text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Team</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  *Categorizes number for instant 1-click bulk broadcast and filter.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Initial Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewMode("human")}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
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
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newMode === "ai"
                        ? "bg-[#F26522] border-[#F26522] text-white shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Instant AI
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Initial Message (Optional)
                </label>
                <textarea
                  rows={3}
                  value={newInitialMessage}
                  onChange={(e) => setNewInitialMessage(e.target.value)}
                  placeholder="Namaste! Intrihub desk se aapke sath quotation share kar rahe hain..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-[#F26522] focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingChat || !newPhone.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#F26522]/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCreatingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>Start Conversation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WHATSAPP MOBILE BOTTOM NAVIGATION BAR (md:hidden, when not in active chat) */}
      {/* ========================================================================= */}
      {!activeChat && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 flex items-center justify-around z-40 shadow-lg">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "inbox" ? "text-[#1E9E6B] font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="relative">
              <MessageSquare className="w-5 h-5" />
              {chats.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#25D366] text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {chats.length > 99 ? "99+" : chats.length}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">Chats</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("groups");
              fetchGroups();
              fetchTemplates();
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "groups" ? "text-[#052A51] font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Groups</span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "dashboard" ? "text-[#052A51] font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
              activeTab === "settings" ? "text-[#052A51] font-extrabold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Settings</span>
          </button>

          <button
            onClick={handleInstallClick}
            className="flex flex-col items-center justify-center flex-1 py-1 text-[#F26522] hover:text-[#d95a1e] font-extrabold"
          >
            <div className="relative">
              <DownloadCloud className="w-5 h-5 text-[#F26522] animate-bounce" />
              <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#25D366]" />
            </div>
            <span className="text-[10px] mt-0.5">Install App</span>
          </button>
        </nav>
      )}

      {/* ========================================================================= */}
      {/* PWA INSTALL / APP DOWNLOAD MODAL */}
      {/* ========================================================================= */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#052A51] via-[#0b3d75] to-[#128C7E] p-6 text-white text-center relative">
              <button
                onClick={() => setShowInstallModal(false)}
                className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                <img src="/logo/intri-web-logo.png" alt="IntriHub" className="h-8 w-auto brightness-0 invert" />
              </div>
              <h3 className="text-lg font-black tracking-tight">Download & Install IntriHub App</h3>
              <p className="text-xs text-slate-200 mt-1">Get the native WhatsApp experience on your Android or iPhone</p>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-4">
              {deferredPrompt ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 space-y-1.5">
                    <p className="font-bold flex items-center gap-1.5 text-[#1E9E6B]">
                      <CheckCircle2 className="w-4 h-4 text-[#25D366]" />
                      <span>Ready for 1-Click Installation</span>
                    </p>
                    <p className="text-slate-600">Install IntriHub HelpDesk directly to your home screen for full-screen WhatsApp workflow.</p>
                  </div>

                  <button
                    onClick={async () => {
                      if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === "accepted") {
                          setIsAppInstalled(true);
                          setShowInstallBanner(false);
                          setShowInstallModal(false);
                        }
                      }
                    }}
                    className="w-full py-3.5 bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#20bd5a] hover:to-[#0f7a6e] text-white font-black rounded-2xl shadow-lg shadow-emerald-500/20 text-sm flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <DownloadCloud className="w-5 h-5" />
                    <span>Install App on this Device</span>
                  </button>
                </div>
              ) : isIos ? (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700">Follow these 3 quick steps on Safari (iPhone/iPad):</p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">1</div>
                      <div>
                        <p className="font-bold text-slate-900">Tap the Share Button</p>
                        <p className="text-[11px] text-slate-500">Look for the share icon <Share2 className="w-3 h-3 inline text-blue-600" /> in Safari's bottom toolbar.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">2</div>
                      <div>
                        <p className="font-bold text-slate-900">Select &quot;Add to Home Screen&quot;</p>
                        <p className="text-[11px] text-slate-500">Scroll down in the share menu and tap <span className="font-bold text-slate-800">&quot;Add to Home Screen&quot;</span>.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">3</div>
                      <div>
                        <p className="font-bold text-slate-900">Tap &quot;Add&quot; in Top Right</p>
                        <p className="text-[11px] text-slate-500">Confirm the app name and tap Add. IntriHub will appear on your Home Screen.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700">Install via Chrome / Android browser menu:</p>
                  <div className="space-y-2.5 text-xs text-slate-700">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-[#F26522]/10 text-[#F26522] flex items-center justify-center font-black shrink-0">1</div>
                      <div>
                        <p className="font-bold text-slate-900">Open Browser Menu (⋮)</p>
                        <p className="text-[11px] text-slate-500">Tap the three vertical dots in the top right corner of Chrome.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-6 h-6 rounded-lg bg-[#F26522]/10 text-[#F26522] flex items-center justify-center font-black shrink-0">2</div>
                      <div>
                        <p className="font-bold text-slate-900">Tap &quot;Install app&quot; or &quot;Add to Home Screen&quot;</p>
                        <p className="text-[11px] text-slate-500">Select Install to add the IntriHub standalone app to your device.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Perks */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Full-screen UI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Instant Notifications</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>Fast WhatsApp Chat</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                  <span>1-Tap Launch</span>
                </div>
              </div>

              <button
                onClick={() => setShowInstallModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
