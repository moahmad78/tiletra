"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Package,
  Heart,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  FileText,
  Shield,
  RotateCcw,
  Truck,
  HelpCircle,
  MessageCircle,
  Star,
  Bell,
  LogOut,
  Sparkles,
  LogIn,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { user, isAuthenticated, logout, openLoginModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-[110px] md:pt-[168px] pb-6 md:pb-10 flex-1">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="w-20 h-20 rounded-full bg-[#052a51] text-white flex items-center justify-center text-2xl font-black shrink-0 shadow-md">
            {mounted && isAuthenticated && user?.name ? (
              user.name[0].toUpperCase()
            ) : (
              <User size={36} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-black text-[#052a51]">
                  {mounted && isAuthenticated && user ? user.name || "Customer" : "Guest Customer"}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {mounted && isAuthenticated && user
                    ? `Registered Phone: +91 ${user.phone}`
                    : "Login with your mobile number to view saved addresses and orders"}
                </p>
              </div>

              {mounted && isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 text-xs font-bold rounded-xl transition-colors self-center sm:self-auto"
                >
                  <LogOut size={13} />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => openLoginModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 self-center sm:self-auto"
                >
                  <LogIn size={14} />
                  <span>Login / Register</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[#F26522]" /> Bangalore, Karnataka
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#F26522]" /> Verified Buyer
              </span>
              {mounted && isAuthenticated && user?.addresses && (
                <span className="flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#F26522]" /> {user.addresses.length} Saved Address(es)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Menu Options */}
        <div className="space-y-3 mb-8">
          <Link
            href="/account/orders"
            className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-[#F26522] active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#052a51]/10 text-[#052a51] flex items-center justify-center group-hover:bg-[#F26522]/10 group-hover:text-[#F26522] transition-colors">
                <Package size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#052a51] text-sm sm:text-base group-hover:text-[#F26522] transition-colors">
                  My Orders & Tracking
                </h2>
                <p className="text-xs text-gray-500">Track shipments, view past tile orders & invoices</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          </Link>

          <Link
            href="/account/reviews"
            className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-[#F26522] active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#052a51] text-sm sm:text-base group-hover:text-[#F26522] transition-colors">
                  My Tile Reviews
                </h2>
                <p className="text-xs text-gray-500">View and edit your product ratings & photos</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          </Link>

          <Link
            href="/account/notifications"
            className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-[#F26522] active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#052a51] text-sm sm:text-base group-hover:text-[#F26522] transition-colors">
                  Notification Settings
                </h2>
                <p className="text-xs text-gray-500">Manage delivery alerts, price drops & promos</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          </Link>

          <Link
            href="/wishlist"
            className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-[#F26522] active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                <Heart size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#052a51] text-sm sm:text-base group-hover:text-[#F26522] transition-colors">
                  Saved Wishlist
                </h2>
                <p className="text-xs text-gray-500">{mounted ? wishlistCount : 0} saved tile designs</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          </Link>

          <Link
            href="/faq"
            className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-[#F26522] active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HelpCircle size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#052a51] text-sm sm:text-base group-hover:text-[#F26522] transition-colors">
                  Help & FAQs
                </h2>
                <p className="text-xs text-gray-500">Shipping, returns, and tile installation guidelines</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          </Link>

          <Link
            href="/contact"
            className="flex items-center justify-between p-4 sm:p-5 bg-white rounded-2xl border border-gray-100 shadow-2xs hover:border-[#F26522] active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Phone size={20} />
              </div>
              <div>
                <h2 className="font-bold text-[#052a51] text-sm sm:text-base group-hover:text-[#F26522] transition-colors">
                  Contact Support
                </h2>
                <p className="text-xs text-gray-500">Call +91 78709 35277 or email hello@tiletra.in</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-400 group-hover:text-[#F26522] transition-colors" />
          </Link>
        </div>

        {/* Essential Legal & Policies Section */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-xs border border-gray-100 mb-6">
          <h3 className="text-xs font-black text-[#052a51] uppercase tracking-[2px] mb-3">
            Policies & Information
          </h3>
          <div className="divide-y divide-gray-100">
            <Link
              href="/shipping-policy"
              className="flex items-center justify-between py-3 text-sm font-semibold text-[#052a51] hover:text-[#F26522] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Truck size={16} className="text-[#F26522]" /> Shipping & Delivery Policy
              </span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>

            <Link
              href="/returns-policy"
              className="flex items-center justify-between py-3 text-sm font-semibold text-[#052a51] hover:text-[#F26522] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <RotateCcw size={16} className="text-[#F26522]" /> Returns & Refund Policy
              </span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>

            <Link
              href="/terms"
              className="flex items-center justify-between py-3 text-sm font-semibold text-[#052a51] hover:text-[#F26522] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <FileText size={16} className="text-[#F26522]" /> Terms of Service
              </span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>

            <Link
              href="/privacy-policy"
              className="flex items-center justify-between py-3 text-sm font-semibold text-[#052a51] hover:text-[#F26522] transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <Shield size={16} className="text-[#F26522]" /> Privacy Policy
              </span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            Tiletra India · Bangalore, Karnataka · +91 78709 35277
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
