"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Send,
  FileText,
  Headphones,
  Sparkles,
  User,
  Phone,
  Search,
  RefreshCw,
  MessageSquare,
  Plus,
  X,
  Loader2,
  PhoneCall,
  UserCheck,
} from "lucide-react";

// Initialize Supabase Client for frontend real-time subscriptions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export default function ChatPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New Chat Modal States
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [newInitialMessage, setNewInitialMessage] = useState("");
  const [newMode, setNewMode] = useState<"human" | "ai">("human");
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);

  const fetchChats = async () => {
    setIsLoadingChats(true);
    const { data } = await supabase
      .from("chats")
      .select("*")
      .order("last_message_at", { ascending: false });
    if (data) setChats(data as Chat[]);
    setIsLoadingChats(false);
  };

  // 1. Initial Data Fetch & Realtime Subscriptions
  useEffect(() => {
    fetchChats();

    // Subscribe to new/updated chats
    const chatSubscription = supabase
      .channel("public:chats")
      .on("postgres_changes", { event: "*", schema: "public", table: "chats" }, (payload) => {
        const newChat = payload.new as Chat;

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

  // Fetch messages when active chat changes
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", activeChat.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };
    fetchMessages();

    // Subscribe to new messages for the active chat
    const messageSubscription = supabase
      .channel(`public:messages:${activeChat.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `chat_id=eq.${activeChat.id}` },
        (payload) => {
          const newMessage = payload.new as Message;
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
  }, [activeChat]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Filtered Chats
  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (c) =>
        c.customer_phone.toLowerCase().includes(q) ||
        (c.customer_name && c.customer_name.toLowerCase().includes(q))
    );
  }, [chats, searchQuery]);

  // 2. Mode Toggle
  const handleToggleMode = async (newModeToggle: "human" | "ai") => {
    if (!activeChat) return;
    setActiveChat({ ...activeChat, chat_mode: newModeToggle });

    const { error } = await supabase
      .from("chats")
      .update({ chat_mode: newModeToggle })
      .eq("id", activeChat.id);

    if (error) {
      console.error("Failed to toggle mode:", error);
      setActiveChat({ ...activeChat, chat_mode: activeChat.chat_mode });
    }
  };

  // 3. Sending Messages in Existing Chat
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

      if (data.warning) {
        console.warn("Meta WhatsApp API notice:", data.warning);
      }
    } catch (error: any) {
      console.error("Send error:", error);
      alert(`Message notice: ${error?.message || "Saved to local dashboard. Note: For Meta WhatsApp Test Sandbox, please ensure the recipient number is added to your Meta Developer allowed list, or the customer sent an inbound message first."}`);
    } finally {
      setIsSending(false);
    }
  };

  // 4. Create New Chat Handler
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

      // Update state and select the new chat
      setChats((prev) => {
        const existing = prev.find((c) => c.id === createdChat.id);
        if (existing) {
          return prev.map((c) => (c.id === createdChat.id ? createdChat : c));
        }
        return [createdChat, ...prev];
      });

      setActiveChat(createdChat);
      setIsNewChatOpen(false);
      setNewPhone("");
      setNewName("");
      setNewInitialMessage("");
      setNewMode("human");
    } catch (err: any) {
      console.error("Error creating new chat:", err);
      setNewChatError(err.message || "Failed to start new WhatsApp chat.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="flex h-full bg-[#f8fafc] font-sans text-slate-900 overflow-hidden relative">
      {/* Sidebar: Chat List */}
      <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#052A51] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#F26522]" />
              WhatsApp Conversations
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="p-1.5 bg-orange-50 hover:bg-[#F26522] text-[#F26522] hover:text-white rounded-lg transition-colors border border-orange-200 shadow-2xs"
                title="Start New Chat / Type Number"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={fetchChats}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Refresh chats"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingChats ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* New Chat Trigger Banner */}
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-[#F26522] to-[#d95a1e] hover:brightness-105 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Type Number & Send Message</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search customer phone or name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#F26522] focus:bg-white transition-colors placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full text-left p-3.5 rounded-xl transition-all duration-200 flex flex-col gap-1 border ${
                activeChat?.id === chat.id
                  ? "bg-orange-50/70 border-[#F26522] shadow-xs"
                  : "hover:bg-slate-50 border-transparent bg-slate-50/40"
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-bold text-sm text-[#052A51] truncate">
                  {chat.customer_name || chat.customer_phone}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {new Date(chat.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <div className="flex justify-between items-center w-full mt-0.5">
                <span className="text-xs text-slate-500 font-mono">{chat.customer_phone}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    chat.chat_mode === "ai"
                      ? "bg-orange-100 text-[#F26522] border border-orange-200"
                      : "bg-emerald-100 text-[#1E9E6B] border border-emerald-200"
                  }`}
                >
                  {chat.chat_mode === "ai" ? "INSTANT" : "DIRECT"}
                </span>
              </div>
            </button>
          ))}

          {!isLoadingChats && filteredChats.length === 0 && (
            <div className="text-center py-12 px-4 text-slate-400 text-xs space-y-3">
              <p>{searchQuery ? "No chats match your search query." : "No WhatsApp conversations yet."}</p>
              <button
                onClick={() => setIsNewChatOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-bold text-[#F26522] hover:bg-orange-50 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" /> Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-[#f8fafc] relative overflow-hidden">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100 font-bold text-[#F26522]">
                  {activeChat.customer_name ? activeChat.customer_name[0].toUpperCase() : <User className="w-5 h-5 text-slate-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-[#052A51] text-sm">
                    {activeChat.customer_name || "WhatsApp Customer"}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3 h-3 text-[#1E9E6B]" /> {activeChat.customer_phone}
                  </p>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, index) => {
                const isCustomer = msg.sender === "customer";
                const isAi = msg.sender === "ai";
                const isOptimistic = msg.id.startsWith("temp_");

                return (
                  <div key={msg.id || index} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                    <div className={`flex flex-col gap-1 max-w-[80%] md:max-w-[70%] ${isCustomer ? "items-start" : "items-end"}`}>
                      {/* Sender Badge */}
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-1">
                        {isAi ? "Intrihub Support Executive" : isCustomer ? "Customer" : "You (Support Agent)"}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl shadow-2xs border ${
                          isCustomer
                            ? "bg-white border-slate-200 text-slate-800 rounded-tl-none"
                            : isAi
                            ? "bg-[#052A51] border-[#052A51] text-white rounded-tr-none"
                            : "bg-[#F26522] border-[#F26522] text-white rounded-tr-none"
                        } ${isOptimistic ? "opacity-60" : ""}`}
                      >
                        {/* Media Rendering */}
                        {msg.message_type === "image" && msg.body && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.body} alt="Attached media" className="max-w-xs max-h-64 object-cover" />
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
                              <p className="font-bold">Document attached</p>
                              <p className="text-[#F26522] font-semibold">Click to view/download</p>
                            </div>
                          </a>
                        )}

                        {/* Text Content */}
                        {msg.body && (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {isOptimistic && " • Sending to WhatsApp..."}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              {activeChat.chat_mode === "human" ? (
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:border-[#F26522] focus-within:bg-white transition-colors">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type a message to WhatsApp customer as Intrihub Support..."
                    className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none text-sm px-3"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !inputText.trim()}
                    className="p-2.5 bg-[#F26522] hover:bg-[#d95a1e] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors shadow-2xs"
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
              Click on any customer from the left list or click below to type a new WhatsApp phone number and send an instant message.
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
                    className="w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 py-2.5 text-sm font-mono text-slate-900 focus:border-[#F26522] focus:outline-none focus:ring-1 focus:ring-[#F26522]"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Enter 10-digit Indian mobile number or international format</p>
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
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#F26522] focus:outline-none focus:ring-1 focus:ring-[#F26522]"
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
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs leading-relaxed text-slate-800 focus:border-[#F26522] focus:outline-none focus:ring-1 focus:ring-[#F26522]"
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
