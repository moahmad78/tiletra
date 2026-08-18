"use client";

import { useState, useEffect, useRef } from "react";
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
  Camera,
  Edit2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

export default function AccountPage() {
  const [mounted, setMounted] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const { user, isAuthenticated, logout, openLoginModal, updateProfile } = useAuthStore();

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditEmail(user.email || "");
      setEditAvatar(user.avatar || null);
    }
  }, [user]);

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
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setEditAvatar(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    try {
      setIsSaving(true);
      const res = await updateProfile({
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        avatar: editAvatar,
      });

      if (res.success) {
        toast.success("Profile updated successfully!");
        setIsEditingProfile(false);
      } else {
        toast.error(res.message || "Failed to update profile");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#F3F4F5]">
      <Header />

      <div className="w-full max-w-[900px] mx-auto px-[20px] md:px-[24px] lg:px-[32px] pt-[110px] md:pt-[168px] pb-6 md:pb-10 flex-1">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-100 mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar with Upload Trigger */}
          <div className="relative group shrink-0">
            {mounted && isAuthenticated && user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={user.name || "Customer"}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#052a51]/20 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#052a51] text-white flex items-center justify-center text-2xl font-black shadow-md">
                {mounted && isAuthenticated && user?.name ? (
                  user.name[0].toUpperCase()
                ) : (
                  <User size={36} />
                )}
              </div>
            )}

            {mounted && isAuthenticated && (
              <button
                onClick={() => {
                  setIsEditingProfile(true);
                  fileInputRef.current?.click();
                }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-md hover:bg-[#d95a1e] active:scale-95 transition-all"
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                <Camera size={14} />
              </button>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black text-[#052a51]">
                    {mounted && isAuthenticated && user ? user.name || "Customer" : "Guest Customer"}
                  </h1>
                  {mounted && isAuthenticated && (
                    <button
                      onClick={() => setIsEditingProfile(!isEditingProfile)}
                      className="p-1.5 text-gray-400 hover:text-[#F26522] rounded-lg hover:bg-gray-50 transition-colors"
                      title="Edit Profile"
                      aria-label="Edit Profile"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-0.5">
                  {mounted && isAuthenticated && user
                    ? `Registered Phone: +91 ${user.phone}${user.email ? ` · ${user.email}` : ""}`
                    : "Login with your mobile number to view saved addresses and orders"}
                </p>
              </div>

              {mounted && isAuthenticated ? (
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-[#F26522] text-xs font-bold rounded-xl hover:bg-orange-100 transition-colors"
                  >
                    <Edit2 size={13} />
                    <span>{isEditingProfile ? "Close Edit" : "Edit Profile"}</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 text-xs font-bold rounded-xl transition-colors"
                  >
                    <LogOut size={13} />
                    <span>Logout</span>
                  </button>
                </div>
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

        {/* Inline Profile Edit Panel */}
        {mounted && isAuthenticated && isEditingProfile && (
          <div className="bg-white rounded-3xl p-6 md:p-7 shadow-xs border border-orange-200 mb-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
              <h2 className="text-base font-black text-[#052a51] flex items-center gap-2">
                <Edit2 size={18} className="text-[#F26522]" />
                <span>Edit Profile Details</span>
              </h2>
              <button
                onClick={() => setIsEditingProfile(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Full Display Name *
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                />
              </div>
            </div>

            {/* Profile Photo Controls */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {editAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editAvatar}
                    alt="Preview"
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-bold">
                    <User size={20} />
                  </div>
                )}
                <div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-[#F26522] hover:underline block"
                  >
                    Upload Custom Photo
                  </button>
                  {editAvatar && (
                    <button
                      type="button"
                      onClick={() => setEditAvatar(null)}
                      className="text-[11px] font-semibold text-red-500 hover:underline block mt-0.5"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#052a51] hover:bg-[#083a6f] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
                <p className="text-xs text-gray-500">Call +91 78709 35277 or email hello@intrihub.com</p>
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
            Intrihub India · Bangalore, Karnataka · +91 78709 35277
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
