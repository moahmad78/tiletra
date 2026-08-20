"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import { changeVendorPassword } from "@/lib/actions/vendor";
import { Store, ArrowRight, ShieldCheck, Zap, Lock, Mail, KeyRound, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VendorLoginPage() {
  const router = useRouter();
  const { login, vendor } = useVendorAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Forced Password Change Modal state
  const [showForcedPasswordModal, setShowForcedPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdating, setPasswordUpdating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your registered email or phone");
      return;
    }

    setLoading(true);
    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      if (res.mustChangePassword) {
        setShowForcedPasswordModal(true);
      } else {
        toast.success("Welcome to your Vendor Panel!");
        router.push("/vendor");
      }
    } else {
      toast.error(res.error || "Failed to log in. Please check your credentials.");
    }
  };

  const handleForcedPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!vendor?.ownerId) {
      toast.error("Session error. Please try logging in again.");
      return;
    }

    setPasswordUpdating(true);
    const res = await changeVendorPassword(vendor.ownerId, newPassword);
    setPasswordUpdating(false);

    if (res.success) {
      toast.success("Password set successfully! Entering your dashboard...");
      setShowForcedPasswordModal(false);
      router.push("/vendor");
    } else {
      toast.error(res.error || "Failed to update password");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#031d38] via-[#052a51] to-[#0b3b6f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-lg mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/intri-web-logo.png"
              alt="Intrihub"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-[#052a51] rounded text-white">
              Vendor Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Seller & Shop Login
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-1">
            Manage your catalog, fulfill customer orders, and track payouts
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email or 10-Digit Mobile
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. balaji.electricals@intrihub.com or 9845012345"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#052a51] focus:outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#052a51] focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#052a51] hover:bg-[#0a3e74] active:scale-[0.99] text-white font-black py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  <span>Enter Vendor Panel</span>
                  <ArrowRight size={16} className="text-[#F26522]" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Want to sell on Intrihub?{" "}
            <Link
              href="/vendor/apply"
              className="text-[#F26522] font-bold hover:underline"
            >
              Apply as a New Seller (Path A)
            </Link>
          </div>
        </div>
      </div>

      {/* ── FORCED FIRST-LOGIN PASSWORD CHANGE DIALOG (Section 2.4) ── */}
      {showForcedPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
              <KeyRound size={28} />
            </div>

            <h3 className="text-xl font-black text-[#052a51]">Set Your Permanent Password</h3>
            <p className="text-xs text-gray-500 mt-1">
              For account security, please set your own private password before accessing your vendor panel.
            </p>

            <form onSubmit={handleForcedPasswordSubmit} className="mt-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:border-[#052a51] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={passwordUpdating}
                className="w-full py-3 bg-[#052a51] hover:bg-[#0a3e74] text-white rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all"
              >
                {passwordUpdating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Save & Enter Dashboard
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
