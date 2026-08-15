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
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  ExternalLink,
} from "lucide-react";
import {
  useNotificationsStore,
  type InAppNotification,
  type NotificationType,
} from "@/lib/notifications-store";

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

  const notifications = useNotificationsStore((s) => s.notifications);
  const unreadCount = useNotificationsStore((s) => s.getUnreadCount());
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationsStore((s) => s.deleteNotification);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayedNotifications = notifications.filter((n) =>
    filter === "unread" ? !n.read : true
  );

  const handleNotificationClick = (notif: InAppNotification) => {
    markAsRead(notif.id);
    setIsOpen(false);
    router.push(notif.link);
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
        {mounted && unreadCount > 0 && (
          <span className="absolute 0 top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
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
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-[#F26522]/10 text-[#F26522] text-[10px] font-black rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-gray-500 hover:text-[#F26522] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
                <Link
                  href="/account/notifications"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-[#052a51] rounded-lg hover:bg-gray-50"
                  title="Notification settings"
                >
                  <Settings size={14} />
                </Link>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

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
                Unread ({unreadCount})
              </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 py-1 space-y-1 scrollbar-thin">
              {displayedNotifications.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">
                  <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-bold text-[#052a51]">No notifications to display</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Order updates and promotional offers will show up here.
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
                Notification Preferences
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
