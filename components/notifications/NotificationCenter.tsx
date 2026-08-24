"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Truck,
  Tag,
  Star,
  TrendingDown,
  Package,
  CheckCheck,
  Trash2,
  Settings,
  X,
  LogIn,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import {
  useNotificationsStore,
  type InAppNotification,
  type NotificationType,
} from "@/lib/notifications-store";
import { useAuthStore } from "@/lib/auth-store";

function formatRelativeTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "order_status":
    case "order_placed":
      return <Truck size={15} className="text-[#F26522]" />;
    case "promo":
      return <Tag size={15} className="text-purple-600" />;
    case "review_reminder":
      return <Star size={15} className="text-amber-500 fill-amber-500" />;
    case "price_drop":
      return <TrendingDown size={15} className="text-emerald-600" />;
    default:
      return <Package size={15} className="text-[#052a51]" />;
  }
}

export default function NotificationCenter() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [mounted, setMounted] = useState(false);

  const { user, isAuthenticated, openLoginModal } = useAuthStore();

  const currentUserId = useNotificationsStore((s) => s.currentUserId);
  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const isLoading = useNotificationsStore((s) => s.isLoading);
  const fetchForUser = useNotificationsStore((s) => s.fetchForUser);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationsStore((s) => s.deleteNotification);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch or reset notifications strictly based on current authenticated user ID
  useEffect(() => {
    if (mounted) {
      if (isAuthenticated && user?.id) {
        if (currentUserId !== user.id) {
          fetchForUser(user.id);
        }
      } else {
        if (currentUserId !== null) {
          useNotificationsStore.getState().reset();
        }
      }
    }
  }, [mounted, isAuthenticated, user?.id, currentUserId, fetchForUser]);

  // When logged out, unread count is strictly 0
  const effectiveUnreadCount = mounted && isAuthenticated && user ? unreadCount : 0;

  const displayedNotifications = (isAuthenticated && user ? notifications : []).filter(
    (n) => (filter === "unread" ? !n.read : true)
  );

  const handleNotificationClick = (notif: InAppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 active:scale-95 transition-all"
      >
        <Bell size={20} />
        {mounted && effectiveUnreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
            {effectiveUnreadCount > 9 ? "9+" : effectiveUnreadCount}
          </span>
        )}
      </button>

      {/* Slide-out / Dropdown Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[400px] bg-white rounded-3xl shadow-2xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-[#052a51] text-sm">Notifications</h3>
                {effectiveUnreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#F26522]/10 text-[#F26522] text-[10px] font-black rounded-full">
                    {effectiveUnreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs">
                {isAuthenticated && effectiveUnreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-gray-500 hover:text-[#F26522] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
                {isAuthenticated && (
                  <Link
                    href="/account/notifications"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-gray-400 hover:text-[#052a51] rounded-lg hover:bg-gray-50"
                    title="Notification settings"
                  >
                    <Settings size={14} />
                  </Link>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Content: Logged Out State */}
            {!isAuthenticated || !user ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#052a51]/5 text-[#052a51] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <Bell size={22} className="text-[#052a51]" />
                </div>
                <h4 className="font-black text-[#052a51] text-sm">Sign in for alerts</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-[260px] mx-auto leading-relaxed">
                  Log in to track your orders, receive delivery dispatches, and get exclusive offers.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openLoginModal();
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#052a51] hover:bg-[#F26522] text-white text-xs font-bold shadow-xs active:scale-95 transition-all"
                >
                  <LogIn size={14} />
                  <span>Log In / Register</span>
                </button>
              </div>
            ) : (
              /* Content: Logged In State */
              <>
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 py-2 border-b border-gray-100 text-[11px] font-bold">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filter === "all"
                        ? "bg-[#052a51] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    All ({notifications.length})
                  </button>
                  <button
                    onClick={() => setFilter("unread")}
                    className={`px-3 py-1 rounded-lg transition-colors ${
                      filter === "unread"
                        ? "bg-[#052a51] text-white"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    Unread ({effectiveUnreadCount})
                  </button>
                </div>

                {/* Notifications List */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 py-1 space-y-1 scrollbar-thin">
                  {isLoading ? (
                    <div className="py-10 text-center text-xs text-gray-400 flex flex-col items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#F26522] mb-2" />
                      <p>Loading your notifications...</p>
                    </div>
                  ) : displayedNotifications.length === 0 ? (
                    <div className="py-10 text-center text-xs text-gray-400">
                      <ShieldCheck size={26} className="mx-auto text-gray-300 mb-2" />
                      <p className="font-bold text-[#052a51]">No notifications yet</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 max-w-[260px] mx-auto">
                        When you place orders or receive delivery updates, they'll appear here.
                      </p>
                    </div>
                  ) : (
                    displayedNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl transition-colors cursor-pointer group flex items-start gap-3 relative ${
                          !n.read
                            ? "bg-[#F26522]/5 hover:bg-[#F26522]/10"
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-2xs">
                          {getNotificationIcon(n.type)}
                        </div>

                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs leading-tight line-clamp-1 ${
                                !n.read
                                  ? "font-black text-[#052a51]"
                                  : "font-bold text-gray-700"
                              }`}
                            >
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                              {formatRelativeTime(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-relaxed font-normal">
                            {n.body}
                          </p>
                        </div>

                        {/* Unread indicator dot & delete button */}
                        <div className="absolute right-2 top-3 flex items-center gap-1">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#F26522]" />
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(n.id);
                            }}
                            className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete notification"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Link */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                  <Link
                    href="/account/orders"
                    onClick={() => setIsOpen(false)}
                    className="font-bold text-[#F26522] hover:underline"
                  >
                    Track Live Orders →
                  </Link>
                  <Link
                    href="/account/notifications"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-[#052a51] font-semibold"
                  >
                    Preferences
                  </Link>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
