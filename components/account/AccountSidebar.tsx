"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  User,
  Package,
  Heart,
  ChevronRight,
  Sparkles,
  Camera,
  LogOut,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { useAuthStore, useAuthStatus } from "@/lib/auth-store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { toast } from "sonner";

export default function AccountSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "profile";
  const [mounted, setMounted] = useState(false);
  const authStatus = useAuthStatus();
  const { user, isAuthenticated, logout, openLoginModal, updateProfile } = useAuthStore();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be smaller than 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const res = await updateProfile({ avatar: base64 });
        if (res.success) {
          toast.success("Profile photo updated!");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const savedAddresses = user?.addresses || [];

  const isOrdersPage = pathname === "/account/orders";
  const isReviewsPage = pathname === "/account/reviews";
  const isNotificationsPage = pathname === "/account/notifications";
  const isAccountRoot = pathname === "/account";

  return (
    <aside className="space-y-4 sticky top-[160px]">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* User Greeting Card */}
      <div className="bg-white rounded-2xl p-4 border border-gray-200/90 shadow-2xs flex items-center gap-3.5">
        {!mounted || authStatus === "loading" ? (
          <div className="flex items-center gap-3.5 w-full animate-pulse">
            <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="w-12 h-3 bg-gray-200 rounded" />
              <div className="w-28 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-3 bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <>
            <div className="relative shrink-0">
              {isAuthenticated && user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={user.name || "Customer"}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#052a51]/20 shadow-xs"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-[#052a51] text-white flex items-center justify-center text-xl font-black shadow-xs">
                  {isAuthenticated && user?.name ? (
                    user.name[0].toUpperCase()
                  ) : (
                    <User size={24} />
                  )}
                </div>
              )}
              {isAuthenticated && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
                  title="Change Avatar"
                >
                  <Camera size={12} />
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-[11px] text-gray-400 font-semibold uppercase">Hello,</span>
              <h2 className="text-base font-black text-[#052a51] truncate">
                {isAuthenticated && user ? user.name || "Customer" : "Guest Customer"}
              </h2>
              <p className="text-xs text-gray-500 font-medium truncate">
                {isAuthenticated && user
                  ? (user.phone && !user.phone.startsWith("google_") ? `+91 ${user.phone}` : user.email || "Customer")
                  : "Not logged in"}
              </p>
            </div>
            {!isAuthenticated && (
              <button
                onClick={() => openLoginModal()}
                className="px-3 py-1.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                Log In
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigation Menu (Flipkart Sidebar Structure) */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden divide-y divide-gray-100">
        {/* MY ORDERS */}
        <div className="p-3">
          <Link
            href="/account/orders"
            className={`flex items-center justify-between p-2.5 rounded-xl transition-colors group ${
              isOrdersPage
                ? "bg-[#052a51] text-white shadow-2xs"
                : "hover:bg-gray-50 text-[#052a51]"
            }`}
          >
            <div className="flex items-center gap-3">
              <Package
                size={18}
                className={isOrdersPage ? "text-[#F26522]" : "text-[#052a51] group-hover:text-[#F26522] transition-colors"}
              />
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isOrdersPage ? "text-white" : "text-[#052a51] group-hover:text-[#F26522] transition-colors"
                }`}
              >
                My Orders
              </span>
            </div>
            <ChevronRight
              size={16}
              className={isOrdersPage ? "text-white" : "text-gray-400 group-hover:translate-x-0.5 transition-transform"}
            />
          </Link>
        </div>

        {/* ACCOUNT SETTINGS */}
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
            <User size={14} className="text-[#F26522]" />
            <span>Account Settings</span>
          </div>

          <Link
            href="/account?tab=profile"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isAccountRoot && currentTab === "profile"
                ? "bg-[#052a51] text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>Profile Information</span>
            <ChevronRight
              size={14}
              className={isAccountRoot && currentTab === "profile" ? "text-white" : "text-gray-400"}
            />
          </Link>

          <Link
            href="/account?tab=addresses"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isAccountRoot && currentTab === "addresses"
                ? "bg-[#052a51] text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>Manage Addresses ({savedAddresses.length})</span>
            <ChevronRight
              size={14}
              className={isAccountRoot && currentTab === "addresses" ? "text-white" : "text-gray-400"}
            />
          </Link>

          <Link
            href="/account?tab=gst"
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isAccountRoot && currentTab === "gst"
                ? "bg-[#052a51] text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span>PAN & GST Information</span>
            <ChevronRight
              size={14}
              className={isAccountRoot && currentTab === "gst" ? "text-white" : "text-gray-400"}
            />
          </Link>
        </div>

        {/* MY STUFF */}
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-2.5 py-1.5 text-[11px] font-black text-gray-400 uppercase tracking-wider">
            <Sparkles size={14} className="text-[#F26522]" />
            <span>My Stuff</span>
          </div>

          <Link
            href="/wishlist"
            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors group"
          >
            <span className="group-hover:text-[#F26522] transition-colors">My Wishlist</span>
            <span className="text-[10px] font-black bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
              {mounted ? wishlistCount : 0}
            </span>
          </Link>

          <Link
            href="/account/reviews"
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors group ${
              isReviewsPage
                ? "bg-[#052a51] text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className={isReviewsPage ? "text-white font-black" : "group-hover:text-[#F26522] transition-colors"}>
              My Reviews & Ratings
            </span>
            <ChevronRight size={14} className={isReviewsPage ? "text-white" : "text-gray-400"} />
          </Link>

          <Link
            href="/account/notifications"
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors group ${
              isNotificationsPage
                ? "bg-[#052a51] text-white shadow-2xs"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className={isNotificationsPage ? "text-white font-black" : "group-hover:text-[#F26522] transition-colors"}>
              Notifications
            </span>
            <ChevronRight size={14} className={isNotificationsPage ? "text-white" : "text-gray-400"} />
          </Link>
        </div>

        {/* LOGOUT BUTTON */}
        <div className="p-3">
          {mounted && isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-black bg-[#F26522] hover:bg-[#d95a1e] text-white shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <LogIn size={15} />
              <span>Log In to Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Helpline Widget */}
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200/80 shadow-2xs space-y-2">
        <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
          <MessageCircle size={16} className="text-[#25D366]" />
          <span>Dedicated Expert Helpline</span>
        </div>
        <p className="text-[11px] text-emerald-800 leading-relaxed">
          Need sample boxes, installation advice, or tile quantity calculations?
        </p>
        <a
          href="https://wa.me/919198035803?text=Hi%20Gulshan,%20I%20need%20assistance%20with%20my%20Intrihub%20account"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#25D366] hover:underline"
        >
          Chat with Gulshan Ali →
        </a>
      </div>
    </aside>
  );
}
