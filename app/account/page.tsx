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
  Plus,
  Trash2,
  CreditCard,
  Building2,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Store,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useAuthStore, useAuthStatus, type CustomerAddress } from "@/lib/auth-store";
import { toast } from "sonner";

type TabType = "profile" | "addresses" | "gst" | "payments";

function AccountPageContent() {
  const [mounted, setMounted] = useState(false);
  const authStatus = useAuthStatus();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab") as TabType | null;
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const {
    user,
    isAuthenticated,
    logout,
    openLoginModal,
    updateProfile,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
  } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>("profile");

  useEffect(() => {
    if (tabParam && ["profile", "addresses", "gst", "payments"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editGender, setEditGender] = useState<"Male" | "Female" | "Other">("Male");
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Address Management Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("Bangalore");
  const [addrState, setAddrState] = useState("Karnataka");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrLabel, setAddrLabel] = useState<"Home" | "Work" | "Other">("Home");

  // GST / Business Details State (Flipkart B2B pattern)
  const [gstNumber, setGstNumber] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [isSavingGst, setIsSavingGst] = useState(false);

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
      toast.error("Please enter your full name");
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
        toast.success("Profile details updated successfully!");
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

  const resetAddressForm = () => {
    setAddrName(user?.name || "");
    setAddrPhone(user?.phone || "");
    setAddrPincode("");
    setAddrLine1("");
    setAddrLine2("");
    setAddrCity("Bangalore");
    setAddrState("Karnataka");
    setAddrLandmark("");
    setAddrLabel("Home");
    setIsAddingAddress(false);
    setEditingAddressId(null);
  };

  const handleStartEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrPincode(addr.pincode);
    setAddrLine1(addr.line1);
    setAddrLine2(addr.line2 || "");
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrLandmark(addr.landmark || "");
    setAddrLabel(addr.label);
    setIsAddingAddress(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName.trim() || !addrPhone.trim() || !addrPincode.trim() || !addrLine1.trim()) {
      toast.error("Please fill in all required fields (Name, Phone, Pincode, Address).");
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, {
        name: addrName.trim(),
        phone: addrPhone.trim(),
        pincode: addrPincode.trim(),
        line1: addrLine1.trim(),
        line2: addrLine2.trim() || undefined,
        city: addrCity.trim(),
        state: addrState.trim(),
        landmark: addrLandmark.trim() || undefined,
        label: addrLabel,
      });
      toast.success("Address updated successfully!");
    } else {
      addAddress({
        name: addrName.trim(),
        phone: addrPhone.trim(),
        pincode: addrPincode.trim(),
        line1: addrLine1.trim(),
        line2: addrLine2.trim() || undefined,
        city: addrCity.trim(),
        state: addrState.trim(),
        landmark: addrLandmark.trim() || undefined,
        label: addrLabel,
        isDefault: (user?.addresses?.length || 0) === 0,
      });
      toast.success("New delivery address added!");
    }

    resetAddressForm();
  };

  const handleSaveGst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gstNumber.trim()) {
      toast.error("Please enter a valid GSTIN number.");
      return;
    }
    setIsSavingGst(true);
    setTimeout(() => {
      setIsSavingGst(false);
      toast.success("GST & Business credentials saved for B2B tax invoicing!");
    }, 600);
  };

  const savedAddresses = user?.addresses || [];

  return (
    <>
        {/* ══════════════════════════════════════════════════════════════
            MOBILE FLIPKART-STYLE ACCOUNT VIEW (Hidden on md & lg)
        ══════════════════════════════════════════════════════════════ */}
        <div className="block md:hidden space-y-4">
          {/* Top Flipkart Blue Profile Hero */}
          <div className="bg-gradient-to-r from-[#052a51] to-[#0a3e74] text-white rounded-3xl p-5 shadow-sm">
            {!mounted || authStatus === "loading" ? (
              <div className="flex items-center gap-3.5 animate-pulse">
                <div className="w-16 h-16 rounded-full bg-white/20 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-16 h-3 bg-white/20 rounded" />
                  <div className="w-32 h-5 bg-white/20 rounded" />
                  <div className="w-24 h-3 bg-white/20 rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3.5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {isAuthenticated && user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar}
                      alt={user.name || "Customer"}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center text-xl font-black border border-white/20 shadow-md">
                      {isAuthenticated && user?.name ? (
                        user.name[0].toUpperCase()
                      ) : (
                        <User size={28} />
                      )}
                    </div>
                  )}
                  {isAuthenticated && (
                    <button
                      onClick={() => {
                        setActiveTab("profile");
                        setIsEditingProfile(true);
                        fileInputRef.current?.click();
                      }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                      aria-label="Upload photo"
                    >
                      <Camera size={12} />
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-blue-200 font-semibold uppercase tracking-wider">Hello,</p>
                  <h1 className="text-lg font-black truncate leading-tight">
                    {isAuthenticated && user ? user.name || "Customer" : "Guest Customer"}
                  </h1>
                  <p className="text-xs text-blue-100/90 mt-0.5 truncate">
                    {isAuthenticated && user
                      ? (user.phone && !user.phone.startsWith("google_") ? `+91 ${user.phone}` : user.email || "Customer")
                      : "Log in for orders & fast checkout"}
                  </p>
                </div>

                {/* Login / Edit action */}
                {isAuthenticated ? (
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold text-white shrink-0 active:scale-95 transition-all flex items-center gap-1"
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                ) : (
                  <button
                    onClick={() => openLoginModal()}
                    className="px-3.5 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-xs active:scale-95 transition-all shrink-0"
                  >
                    Log In
                  </button>
                )}
              </div>
            )}

            {/* Quick Badges */}
            <div className="flex items-center gap-4 mt-3.5 pt-3 border-t border-white/15 text-[11px] text-blue-100 font-medium">
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-[#F26522]" /> Bangalore
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" /> Verified Account
              </span>
              <span className="flex items-center gap-1 ml-auto">
                <Truck size={12} className="text-[#F26522]" /> Direct Freight
              </span>
            </div>
          </div>

          {/* Flipkart 2x2 Feature Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/account/orders"
              className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center gap-3 active:scale-98 transition-transform group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#052a51] flex items-center justify-center shrink-0 group-hover:bg-[#F26522]/10 group-hover:text-[#F26522] transition-colors">
                <Package size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#052a51] group-hover:text-[#F26522] transition-colors">
                  Orders
                </p>
                <p className="text-[10px] text-gray-400 font-semibold truncate">Check status & track</p>
              </div>
            </Link>

            <Link
              href="/wishlist"
              className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center gap-3 active:scale-98 transition-transform group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <Heart size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#052a51] group-hover:text-[#F26522] transition-colors">
                  Wishlist
                </p>
                <p className="text-[10px] text-gray-400 font-semibold truncate">
                  {mounted ? wishlistCount : 0} saved items
                </p>
              </div>
            </Link>

            <Link
              href="/account/reviews"
              className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center gap-3 active:scale-98 transition-transform group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Star size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#052a51] group-hover:text-[#F26522] transition-colors">
                  Reviews
                </p>
                <p className="text-[10px] text-gray-400 font-semibold truncate">Ratings & photos</p>
              </div>
            </Link>

            <Link
              href="/account/notifications"
              className="bg-white p-3.5 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center gap-3 active:scale-98 transition-transform group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-[#052a51] group-hover:text-[#F26522] transition-colors">
                  Alerts
                </p>
                <p className="text-[10px] text-gray-400 font-semibold truncate">Offers & updates</p>
              </div>
            </Link>
          </div>

          {/* Account Settings List Card */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-2xs space-y-1">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">
              Account Settings
            </h3>

            <button
              onClick={() => {
                setActiveTab("profile");
                setIsEditingProfile(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <User size={18} className="text-[#052a51]" />
                <div>
                  <p className="text-xs font-bold text-[#052a51]">Edit Profile Information</p>
                  <p className="text-[10px] text-gray-400">Name, email, avatar</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>

            <button
              onClick={() => {
                setActiveTab("addresses");
                setIsAddingAddress(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-[#F26522]" />
                <div>
                  <p className="text-xs font-bold text-[#052a51]">Saved Addresses ({savedAddresses.length})</p>
                  <p className="text-[10px] text-gray-400">Manage delivery locations</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>

            <button
              onClick={() => setActiveTab("gst")}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-[#052a51]">PAN Card & GST Information</p>
                  <p className="text-[10px] text-gray-400">For B2B tax invoicing</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Sell on Intrihub / Become a Vendor Card */}
          <div className="bg-gradient-to-r from-blue-50/90 to-orange-50/90 rounded-3xl p-3 border border-blue-100 shadow-2xs">
            <Link
              href="/vendor/apply"
              className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/70 active:bg-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#052a51] text-white flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Store size={18} className="text-[#F26522]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[#052a51]">Become a Vendor / Sell on Intrihub</p>
                  <p className="text-[10px] text-gray-600">Grow your shop & reach thousands of customers</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>

          {/* Help & Support List */}
          <div className="bg-white rounded-3xl p-4 border border-gray-200/90 shadow-2xs space-y-1">
            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-wider px-2 py-1">
              Help & Policies
            </h3>

            <a
              href="https://wa.me/919198035803?text=Hi%20Gulshan,%20I%20need%20assistance%20with%20my%20Intrihub%20account"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle size={18} className="text-[#25D366]" />
                <div>
                  <p className="text-xs font-bold text-[#052a51]">WhatsApp Support (Gulshan Ali)</p>
                  <p className="text-[10px] text-gray-400">+91 91980 35803 · Instant response</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
            </a>

            <Link
              href="/faq"
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-amber-500" />
                <div>
                  <p className="text-xs font-bold text-[#052a51]">Frequently Asked Questions</p>
                  <p className="text-[10px] text-gray-400">Shipping, returns & installation</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/shipping-policy"
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Truck size={18} className="text-blue-500" />
                <p className="text-xs font-bold text-[#052a51]">Shipping & Delivery Policy</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>

            <Link
              href="/returns-policy"
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RotateCcw size={18} className="text-[#F26522]" />
                <p className="text-xs font-bold text-[#052a51]">Returns & Refund Policy</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          </div>

          {/* Logout button */}
          {mounted && isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-white rounded-2xl border border-red-200 text-red-600 font-black text-xs flex items-center justify-center gap-2 shadow-2xs active:scale-98 transition-all"
            >
              <LogOut size={15} />
              <span>Log Out of Intrihub</span>
            </button>
          )}
        </div>

      {/* ══════════════════════════════════════════════════════════════
          DESKTOP FLIPKART-STYLE RIGHT CONTENT AREA (Hidden on mobile)
      ══════════════════════════════════════════════════════════════ */}
      <section className="hidden md:block space-y-6">
            {/* Hidden File Input for Avatar Upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />

            {/* ────────────────────────────────────────────────────────────
                PANEL 1: PROFILE INFORMATION (Flipkart Personal Info)
            ──────────────────────────────────────────────────────────── */}
            {activeTab === "profile" && (
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/90 shadow-2xs space-y-8">
                {/* 1. Personal Information */}
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
                      <span>Personal Information</span>
                    </h2>
                    {mounted && isAuthenticated && (
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(!isEditingProfile)}
                        className="text-xs font-black text-[#F26522] hover:underline flex items-center gap-1"
                      >
                        <Edit2 size={13} />
                        <span>{isEditingProfile ? "Cancel" : "Edit"}</span>
                      </button>
                    )}
                  </div>

                  {isEditingProfile ? (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1.5">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter your name"
                            className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1.5">
                            Your Gender
                          </label>
                          <div className="flex items-center gap-4 h-11">
                            {(["Male", "Female", "Other"] as const).map((g) => (
                              <label key={g} className="flex items-center gap-2 text-xs font-bold text-[#052a51] cursor-pointer">
                                <input
                                  type="radio"
                                  name="gender"
                                  checked={editGender === g}
                                  onChange={() => setEditGender(g)}
                                  className="w-4 h-4 accent-[#F26522]"
                                />
                                <span>{g}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Photo selector */}
                      <div className="flex items-center gap-3 pt-2">
                        {editAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editAvatar}
                            alt="Avatar"
                            className="w-12 h-12 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-black">
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

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          className="px-6 h-11 bg-[#052a51] hover:bg-[#0b3b6d] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="px-5 h-11 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Full Name</span>
                        <p className="text-sm font-black text-[#052a51]">
                          {mounted && isAuthenticated && user ? user.name || "Customer" : "Not Set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-400 block mb-1">Your Gender</span>
                        <p className="text-sm font-black text-[#052a51]">{editGender}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Email Address */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-black text-[#052a51]">Email Address</h3>
                    {mounted && isAuthenticated && user?.email && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="max-w-md">
                    <input
                      type="email"
                      value={editEmail}
                      disabled={!isEditingProfile}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] disabled:opacity-75 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* 3. Mobile Number */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-black text-[#052a51]">Mobile Number</h3>
                    {mounted && isAuthenticated && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase">
                        <CheckCircle2 size={12} /> Verified
                      </span>
                    )}
                  </div>
                  <div className="max-w-md">
                    <input
                      type="text"
                      value={mounted && isAuthenticated && user ? `+91 ${user.phone}` : "+91 Not logged in"}
                      disabled
                      className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] opacity-75"
                    />
                  </div>
                </div>

                {/* 4. Flipkart-Style Account FAQs */}
                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                    Frequently Asked Questions
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="font-bold text-[#052a51]">What happens when I update my email address or mobile?</p>
                      <p className="text-gray-500 mt-0.5 leading-relaxed">
                        Your login credentials will be updated immediately. All future order confirmations, wooden crate freight dispatch alerts, and digital tax invoices will be sent to the updated details.
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-[#052a51]">What happens to my past orders and saved addresses?</p>
                      <p className="text-gray-500 mt-0.5 leading-relaxed">
                        All your previous order history, live tracking tokens, and saved delivery locations in Bangalore remain completely intact.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────
                PANEL 2: MANAGE ADDRESSES (Flipkart Saved Addresses)
            ──────────────────────────────────────────────────────────── */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-[#052a51]">Manage Delivery Addresses</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Saved locations for crate freight and rapid building supply dispatch</p>
                  </div>

                  {!isAddingAddress && (
                    <button
                      type="button"
                      onClick={() => {
                        resetAddressForm();
                        setIsAddingAddress(true);
                      }}
                      className="px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Plus size={14} />
                      <span>Add New Address</span>
                    </button>
                  )}
                </div>

                {/* Add / Edit Address Form */}
                {isAddingAddress && (
                  <form onSubmit={handleSaveAddress} className="p-5 bg-orange-50/50 rounded-2xl border-2 border-[#F26522]/30 space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black text-[#052a51] uppercase tracking-wider">
                        {editingAddressId ? "Edit Address" : "Add New Delivery Address"}
                      </h3>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                        <input
                          type="text"
                          required
                          value={addrName}
                          onChange={(e) => setAddrName(e.target.value)}
                          placeholder="Contact person"
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">10-Digit Mobile Number *</label>
                        <input
                          type="tel"
                          required
                          value={addrPhone}
                          onChange={(e) => setAddrPhone(e.target.value)}
                          placeholder="9876543210"
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Pincode *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={addrPincode}
                          onChange={(e) => setAddrPincode(e.target.value)}
                          placeholder="560034"
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                        <input
                          type="text"
                          required
                          value={addrCity}
                          onChange={(e) => setAddrCity(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">State *</label>
                        <input
                          type="text"
                          required
                          value={addrState}
                          onChange={(e) => setAddrState(e.target.value)}
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        Flat / House No., Building Name, Street *
                      </label>
                      <input
                        type="text"
                        required
                        value={addrLine1}
                        onChange={(e) => setAddrLine1(e.target.value)}
                        placeholder="e.g. #42, 3rd Cross, Koramangala 4th Block"
                        className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Area / Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={addrLandmark}
                          onChange={(e) => setAddrLandmark(e.target.value)}
                          placeholder="e.g. Near Sony World Signal"
                          className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">Address Type</label>
                        <div className="flex items-center gap-4 h-10">
                          {(["Home", "Work", "Other"] as const).map((lbl) => (
                            <label key={lbl} className="flex items-center gap-1.5 text-xs font-bold text-[#052a51] cursor-pointer">
                              <input
                                type="radio"
                                name="addr-label"
                                checked={addrLabel === lbl}
                                onChange={() => setAddrLabel(lbl)}
                                className="w-3.5 h-3.5 accent-[#F26522]"
                              />
                              <span>{lbl}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-6 h-10 bg-[#052a51] hover:bg-[#0b3b6d] text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                      >
                        Save Address
                      </button>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="px-5 h-10 border border-gray-200 hover:bg-white text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Saved Address Cards */}
                <div className="space-y-3.5">
                  {savedAddresses.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300 space-y-2">
                      <MapPin size={28} className="mx-auto text-gray-400" />
                      <p className="text-sm font-bold text-[#052a51]">No Saved Addresses Found</p>
                      <p className="text-xs text-gray-500">Add your Bangalore building site or residence for direct crate delivery</p>
                    </div>
                  ) : (
                    savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-5 rounded-2xl border border-gray-200/90 hover:border-[#F26522]/60 transition-all bg-white shadow-2xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                              {addr.label}
                            </span>
                            <h3 className="text-sm font-black text-[#052a51]">{addr.name}</h3>
                            <span className="text-xs font-bold text-gray-500">+91 {addr.phone}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                Default
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 leading-relaxed">
                            {addr.line1}
                            {addr.line2 ? `, ${addr.line2}` : ""}
                            {addr.landmark ? `, Landmark: ${addr.landmark}` : ""}, {addr.city} — {addr.pincode},{" "}
                            {addr.state}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => setDefaultAddress(addr.id)}
                              className="px-3 py-1.5 border border-gray-200 hover:border-gray-300 text-gray-600 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Make Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStartEditAddress(addr)}
                            className="p-1.5 text-gray-500 hover:text-[#F26522] rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            title="Edit Address"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteAddress(addr.id);
                              toast.success("Address removed");
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Address"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────────
                PANEL 3: PAN & GST INFORMATION (Flipkart B2B Billing)
            ──────────────────────────────────────────────────────────── */}
            {activeTab === "gst" && (
              <div className="bg-white rounded-3xl p-6 lg:p-8 border border-gray-200/90 shadow-2xs space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-black text-[#052a51] flex items-center gap-2">
                    <Building2 size={20} className="text-[#F26522]" />
                    <span>PAN & GST Information</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Add your business GSTIN to receive input tax credit (ITC) and official commercial invoices.
                  </p>
                </div>

                <form onSubmit={handleSaveGst} className="max-w-xl space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      Registered Business / Firm Name
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Sheikh Construction & Interiors Pvt Ltd"
                      className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      GSTIN Number (15 Digits) *
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="29AAAAA0000A1Z5"
                      className="w-full h-11 px-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#052a51] uppercase focus:bg-white focus:outline-none focus:border-[#F26522]"
                    />
                  </div>

                  <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-blue-900 leading-relaxed">
                    <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      GST invoices will be generated automatically upon crate freight checkout and emailed directly with 18% / 28% GST input credit breakdown.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingGst}
                    className="px-6 h-11 bg-[#052a51] hover:bg-[#0b3b6d] text-white text-xs font-black rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSavingGst ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    <span>Save Business Details</span>
                  </button>
                </form>
              </div>
            )}
      </section>
    </>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="w-full h-96 bg-white rounded-2xl animate-pulse" />}>
      <AccountPageContent />
    </Suspense>
  );
}
