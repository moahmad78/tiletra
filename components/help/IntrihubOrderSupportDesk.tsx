"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  RotateCcw,
  RefreshCw,
  MessageSquare,
  Users,
  LayoutDashboard,
  Settings,
  LogOut,
  X,
  Phone,
  User,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Headphones,
  ShieldCheck,
  Plus,
  Sparkles,
  MapPin,
  Clock,
  ArrowLeft,
  FileText,
} from "lucide-react";
import HelpDeskOrderDetailView from "./HelpDeskOrderDetailView";
import HelpDeskCustomerDetailView from "./HelpDeskCustomerDetailView";
import HelpDeskQueueOverview from "./HelpDeskQueueOverview";
import { AddComplaintModal } from "./HelpDeskActionModals";

export default function IntrihubOrderSupportDesk({
  onLogout,
}: {
  onLogout?: () => void;
}) {
  // Navigation & Active View
  const [activeTab, setActiveTab] = useState<"search" | "queue" | "crm" | "settings">("search");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  // Search State & Autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    customers: any[];
    orders: any[];
    returns: any[];
    complaints: any[];
  }>({
    customers: [],
    orders: [],
    returns: [],
    complaints: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // CRM List State
  const [crmCustomers, setCrmCustomers] = useState<any[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);

  // Quick Action Modal
  const [showGlobalComplaintModal, setShowGlobalComplaintModal] = useState(false);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults({ customers: [], orders: [], returns: [], complaints: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/help/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults({
            customers: data.customers || [],
            orders: data.orders || [],
            returns: data.returns || [],
            complaints: data.complaints || [],
          });
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error("Search fetch failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load CRM Customers list when CRM tab is activated
  useEffect(() => {
    if (activeTab === "crm" && crmCustomers.length === 0) {
      const loadCrm = async () => {
        try {
          setCrmLoading(true);
          const res = await fetch("/api/customer/orders");
          const data = await res.json();
          if (data.success) {
            setCrmCustomers(data.customers || []);
          }
        } catch (err) {
          console.error("Failed to load CRM customers", err);
        } finally {
          setCrmLoading(false);
        }
      };
      loadCrm();
    }
  }, [activeTab, crmCustomers.length]);

  // Select Order Handler
  const handleSelectOrder = async (orderOrId: any) => {
    setShowSuggestions(false);
    setActiveTab("search");
    setSelectedCustomer(null);

    const orderId = typeof orderOrId === "string" ? orderOrId : orderOrId?.id;
    if (!orderId) return;

    try {
      // Fetch full order details
      const res = await fetch(`/api/help/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
      } else {
        setSelectedOrder(orderOrId);
      }
    } catch {
      setSelectedOrder(orderOrId);
    }
  };

  // Select Customer Handler
  const handleSelectCustomer = async (cust: any) => {
    setShowSuggestions(false);
    setActiveTab("search");
    setSelectedOrder(null);
    setSelectedCustomer(cust);

    // Fetch all orders for this customer phone
    const phone = cust.phone;
    if (phone) {
      try {
        const cleanPhone = phone.replace(/\D/g, "").slice(-10);
        const res = await fetch(`/api/help/search?q=${cleanPhone}`);
        const data = await res.json();
        if (data.success) {
          setCustomerOrders(data.orders || []);
          if (data.customers && data.customers.length > 0) {
            setSelectedCustomer(data.customers[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch customer orders", err);
      }
    }
  };

  // Handle Search Submit
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    // If there's an exact match in results, pick the top item
    if (searchResults.orders.length > 0) {
      handleSelectOrder(searchResults.orders[0]);
    } else if (searchResults.customers.length > 0) {
      handleSelectCustomer(searchResults.customers[0]);
    } else {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* ========================================================================= */}
      {/* ── TOP SUPPORT DESK HEADER & SEARCH OMNIBAR ── */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-[#052A51] border-b border-white/10 shadow-md text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Desk Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon-192.png"
                alt="Intrihub Logo"
                className="w-8 h-8 rounded-xl object-contain bg-white p-0.5 shadow-sm"
              />
              <div>
                <span className="text-sm font-black tracking-tight text-white block leading-none">
                  IntriHub
                </span>
                <span className="text-[10px] font-bold text-[#F26522] uppercase tracking-wider">
                  Support Desk
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-block px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[10px] font-bold border border-white/15">
              Order & Complaint Management
            </span>
          </div>

          {/* ── CENTRAL SEARCH OMNIBAR ── */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl min-w-[280px] relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                  }}
                  placeholder="Lookup by Mobile Number (e.g. 7090120211) or Order ID (#IH-xxxx)..."
                  className="w-full pl-10 pr-9 py-2 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-white/60 focus:placeholder:text-slate-400 text-xs font-semibold rounded-2xl border border-white/20 focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/30 focus:outline-none transition-all shadow-inner"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-3 p-0.5 text-white/60 hover:text-white focus:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : isSearching ? (
                  <RefreshCw className="w-3.5 h-3.5 text-white/60 animate-spin absolute right-3 pointer-events-none" />
                ) : null}
              </div>
            </form>

            {/* ── AUTOCOMPLETE DROPDOWN RESULTS ── */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 text-slate-900 max-h-[75vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Orders Matches */}
                {searchResults.orders.length > 0 && (
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-[#F26522]" />
                      <span>Matching Orders ({searchResults.orders.length})</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.orders.map((ord) => (
                        <div
                          key={ord.id}
                          onClick={() => handleSelectOrder(ord)}
                          className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-900 group-hover:text-[#052A51]">
                                Order #{ord.id.slice(-8).toUpperCase()}
                              </span>
                              <span
                                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                                  ord.orderStatus === "Delivered"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : ord.orderStatus === "Shipped"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {ord.orderStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {ord.customerName || "Customer"} • {ord.customerPhone} • {ord.items?.length || 0} items
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-slate-900">
                              ₹{ord.total?.toLocaleString("en-IN")}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {new Date(ord.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Customer Profiles Matches */}
                {searchResults.customers.length > 0 && (
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-[#052A51]" />
                      <span>Matching Customers ({searchResults.customers.length})</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.customers.map((cust, idx) => (
                        <div
                          key={cust.id || idx}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-[#052A51] text-white flex items-center justify-center text-xs font-bold shrink-0">
                              {(cust.name || "C").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 group-hover:text-[#052A51] truncate">
                                {cust.name || "Customer"}
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-[#25D366]" />
                                <span>{cust.phone}</span>
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                              {cust.totalOrders || cust.recentOrders?.length || 0} Orders
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Return Requests Matches */}
                {searchResults.returns.length > 0 && (
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1.5">
                      <RotateCcw className="w-3 h-3 text-[#F26522]" />
                      <span>Return / Exchange Records ({searchResults.returns.length})</span>
                    </p>
                    <div className="space-y-1">
                      {searchResults.returns.map((ret) => (
                        <div
                          key={ret.id}
                          onClick={() => handleSelectOrder(ret.order || { id: ret.orderId })}
                          className="p-2.5 rounded-xl hover:bg-orange-50/50 cursor-pointer flex items-center justify-between gap-2 transition-colors text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">
                              Order #{ret.orderId?.slice(-8).toUpperCase()} • Reason: {ret.reason}
                            </p>
                            <p className="text-[11px] text-slate-500">Status: {ret.status}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Matches Found */}
                {searchResults.orders.length === 0 &&
                  searchResults.customers.length === 0 &&
                  searchResults.returns.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-500">
                      <p className="font-bold">No exact orders or customer profiles found for &quot;{searchQuery}&quot;</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Try searching with a 10-digit mobile number or full Order ID.
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGlobalComplaintModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Complaint</span>
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Logout from Support Desk"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── DESK NAVIGATION BAR ── */}
        <div className="bg-[#04203d] border-t border-white/10 px-3 sm:px-6 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                setActiveTab("search");
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "search"
                  ? "bg-white text-[#052A51] shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Customer / Order Lookup</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("queue");
                setSelectedOrder(null);
                setSelectedCustomer(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "queue"
                  ? "bg-white text-[#052A51] shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#F26522]" />
              <span>Pending Returns & Complaints</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("crm");
                setSelectedOrder(null);
                setSelectedCustomer(null);
              }}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "crm"
                  ? "bg-white text-[#052A51] shadow-xs"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer CRM</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Postgres DB Connected</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* ── MAIN WORKSPACE CONTENT ── */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {/* ── TAB: SEARCH & LOOKUP ── */}
        {activeTab === "search" && (
          <div>
            {selectedOrder ? (
              /* Selected Order Detail View */
              <HelpDeskOrderDetailView
                order={selectedOrder}
                onBack={() => setSelectedOrder(null)}
                onOrderUpdated={() => handleSelectOrder(selectedOrder.id)}
              />
            ) : selectedCustomer ? (
              /* Selected Customer Detail View */
              <HelpDeskCustomerDetailView
                customer={selectedCustomer}
                orders={customerOrders}
                onSelectOrder={handleSelectOrder}
                onBack={() => setSelectedCustomer(null)}
                onRefresh={() => handleSelectCustomer(selectedCustomer)}
              />
            ) : (
              /* Default Landing View: Quick Search Cards & Welcome */
              <div className="space-y-6">
                {/* Hero Greeting & Quick Stats */}
                <div className="bg-gradient-to-br from-[#052A51] via-[#083564] to-[#041a33] text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#F26522]/20 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 max-w-2xl">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#F26522] rounded text-white shadow-xs">
                      Customer Support Central
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
                      Order & Complaint Management System
                    </h1>
                    <p className="text-xs sm:text-sm text-white/75 mt-1 leading-relaxed">
                      Instant customer lookup, order tracking, return & exchange ticket generation, and 1-click refund processing powered by live Neon Postgres database.
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5">
                      <button
                        onClick={() => searchInputRef.current?.focus()}
                        className="px-4 py-2 bg-white text-[#052A51] text-xs font-black rounded-xl hover:bg-slate-100 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-[#F26522]" />
                        <span>Search by Phone or Order ID</span>
                      </button>

                      <button
                        onClick={() => setActiveTab("queue")}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>View Pending Queue</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Queue Overview Widget embedded on search home */}
                <HelpDeskQueueOverview
                  onSelectOrder={handleSelectOrder}
                  onSelectCustomerPhone={(phone) => {
                    setSearchQuery(phone);
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* ── TAB: PENDING QUEUE OVERVIEW ── */}
        {activeTab === "queue" && (
          <HelpDeskQueueOverview
            onSelectOrder={handleSelectOrder}
            onSelectCustomerPhone={(phone) => {
              setSearchQuery(phone);
              setActiveTab("search");
            }}
          />
        )}

        {/* ── TAB: CUSTOMER CRM ── */}
        {activeTab === "crm" && (
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#052A51]" />
                  <span>Customer Directory</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select any customer to pull up their complete order history and profile.
                </p>
              </div>
            </div>

            {crmLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#052A51]" />
                <p className="font-bold">Loading CRM records...</p>
              </div>
            ) : crmCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold">No CRM customers registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {crmCustomers.map((cust) => (
                  <div
                    key={cust.id}
                    onClick={() => handleSelectCustomer(cust)}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-[#052A51] bg-slate-50/50 hover:bg-white transition-all shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#052A51] text-white font-black flex items-center justify-center text-sm shrink-0">
                        {(cust.name || "C").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-900 group-hover:text-[#052A51] truncate">
                          {cust.name || "Customer"}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#25D366]" />
                          <span>{cust.phone}</span>
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-3 pt-2.5 border-t border-slate-200/60 text-slate-600">
                      <span>{cust.totalOrders || 0} Orders</span>
                      <span className="font-bold text-slate-900">
                        ₹{cust.totalSpent?.toLocaleString("en-IN") || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Complaint Modal */}
      {showGlobalComplaintModal && (
        <AddComplaintModal
          onClose={() => setShowGlobalComplaintModal(false)}
          onSuccess={() => {
            setActiveTab("queue");
          }}
        />
      )}
    </div>
  );
}
