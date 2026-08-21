"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  Bell,
  LogOut,
  User,
  Plus,
  ShieldCheck,
  Search,
  ExternalLink,
  ShoppingBag,
  CheckCheck,
  ChevronRight,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/lib/socket";
import { useLiveSync } from "@/lib/live-sync";
import { toast } from "sonner";
import {
  getAdminNotifications,
  getUnreadAdminNotificationCount,
  markAdminNotificationAsRead,
  markAllAdminNotificationsAsRead,
} from "@/lib/actions/notifications";

export default function AdminHeader({
  onMobileMenuToggle,
}: {
  onMobileMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAdminAuth();

  const [userDropdown, setUserDropdown] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch real database notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([
        getAdminNotifications(10),
        getUnreadAdminNotificationCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (e) {
      console.error("Failed to load admin notifications:", e);
    }
  }, []);

  // ── Real-Time Socket.IO Listener for Admin Room (Phase 5b PRD) ──
  useSocket("admin", {
    "new-order": (data: any) => {
      console.log("⚡ [SOCKET EVENT: new-order]", data);
      toast.success(`🎉 New Order #${data.orderId || data.id}!`, {
        description: `${data.customerName} placed an order for ₹${(data.total || 0).toLocaleString("en-IN")}`,
        action: {
          label: "View Order",
          onClick: () => router.push(`/admin/orders/${data.orderId || data.id}`),
        },
      });

      // Update unread count & prepend notification instantly
      setUnreadCount((prev) => prev + 1);
      setNotifications((prev) => [
        {
          id: `socket-notif-${Date.now()}`,
          title: `New Order #${data.orderId || data.id}`,
          message: `${data.customerName} placed an order for ₹${(data.total || 0).toLocaleString("en-IN")}`,
          type: "order",
          isRead: false,
          link: `/admin/orders/${data.orderId || data.id}`,
          createdAt: new Date().toISOString(),
        },
        ...prev.slice(0, 9),
      ]);
    },
  });

  // ── Universal Live Sync Hook (Cross-tab broadcast + Tab Focus + 4s Auto-Poll) ──
  useLiveSync({
    eventTypes: ["order:new", "data:refresh"],
    onSync: fetchNotifications,
    pollIntervalMs: 4000,
    enableFocusRefresh: true,
  });

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAdminNotificationAsRead(notif.id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
    }
    setNotificationsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAdminNotificationsAsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // Compute breadcrumb title
  const getPageTitle = () => {
    if (pathname === "/admin") return "Dashboard Overview";
    if (pathname === "/admin/products") return "Product Catalog";
    if (pathname === "/admin/products/new") return "Add Product";
    if (pathname.includes("/admin/products/") && pathname.includes("/edit"))
      return "Edit Product";
    if (pathname === "/admin/products/bulk") return "Bulk CSV Import";
    if (pathname === "/admin/categories") return "Category Management";
    if (pathname === "/admin/orders") return "Order Management";
    if (pathname.startsWith("/admin/orders/")) return "Order Details";
    if (pathname === "/admin/customers") return "Customer Directory";
    if (pathname === "/admin/reviews") return "Review Moderation";
    if (pathname === "/admin/coupons") return "Discount Coupons";
    if (pathname === "/admin/content") return "Homepage CMS";
    if (pathname === "/admin/settings") return "Store Settings";
    return "Admin Portal";
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 md:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-black text-[#052a51] leading-tight">
            {getPageTitle()}
          </h1>
          <p className="text-[11px] text-gray-400 hidden sm:block">
            Intrihub Operations & Store Management
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* ── Notification Bell (Phase 5 PRD Section 4) ── */}
        <div className="relative">
          <button
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setUserDropdown(false);
            }}
            className="relative p-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 text-gray-600 hover:text-[#052a51] active:scale-95 transition-all"
            aria-label="Admin Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F26522] text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-200/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-[#052a51] uppercase tracking-wider">
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#F26522]/10 text-[#F26522] text-[10px] font-black">
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-[#F26522] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck size={13} />
                      <span>Mark all as read</span>
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-gray-400">
                      <ShoppingBag size={28} className="mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-bold">No notifications yet</p>
                      <p className="text-[10px] text-gray-400">New orders will alert here in real-time</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`w-full text-left p-3 rounded-2xl hover:bg-gray-50 transition-colors flex items-start gap-3 group relative ${
                          !notif.isRead ? "bg-orange-50/40" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            notif.type === "order"
                              ? "bg-[#052a51] text-white"
                              : "bg-[#F26522]/10 text-[#F26522]"
                          }`}
                        >
                          <ShoppingBag size={14} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p
                              className={`text-xs font-bold truncate ${
                                !notif.isRead ? "text-[#052a51]" : "text-gray-700"
                              }`}
                            >
                              {notif.title}
                            </p>
                            <span className="text-[10px] text-gray-400 shrink-0">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>

                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#F26522] shrink-0 mt-2" />
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Footer link to Orders */}
                <div className="pt-2 border-t border-gray-100 text-center">
                  <Link
                    href="/admin/orders"
                    onClick={() => setNotificationsOpen(false)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#052a51] hover:text-[#F26522] transition-colors py-1"
                  >
                    <span>View all orders</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setUserDropdown(!userDropdown);
              setNotificationsOpen(false);
            }}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-gray-50 active:scale-95 transition-all text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-[#052a51] text-white font-black text-xs flex items-center justify-center">
              {user?.name ? user.name[0] : "A"}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-bold text-[#052a51] leading-none">
                {user?.name || "Admin"}
              </p>
              <span className="text-[10px] text-gray-400 font-semibold uppercase">
                {user?.role || "Owner"}
              </span>
            </div>
          </button>

          {/* Dropdown Box */}
          {userDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-[#052a51]">{user?.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setUserDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#052a51]"
                >
                  <User size={14} />
                  <span>Store Settings</span>
                </Link>

                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#052a51]"
                >
                  <ExternalLink size={14} />
                  <span>View Public Store</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors mt-1 border-t border-gray-100"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
