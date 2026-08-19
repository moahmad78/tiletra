"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVendorAuth, DEMO_VENDORS } from "@/lib/vendor-auth";
import { Store, ArrowRight, ShieldCheck, Zap, Lock, Mail } from "lucide-react";
import { toast } from "sonner";

export default function VendorLoginPage() {
  const router = useRouter();
  const { login, quickSwitchVendor } = useVendorAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      toast.success("Welcome to your Vendor Panel!");
      router.push("/vendor");
    } else {
      toast.error(res.error || "Failed to log in. Please check your credentials.");
    }
  };

  const handleDemoLogin = (demoId: string) => {
    quickSwitchVendor(demoId);
    toast.success("Logged in with test vendor account!");
    router.push("/vendor");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#031d38] via-[#052a51] to-[#0b3b6f] flex items-center justify-center p-4">
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
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-600 rounded text-white">
              Vendor Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Seller & Shop Login
          </h1>
          <p className="text-sm text-white/70 mt-1">
            Manage your shop products, inventory, and order fulfillments
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email or 10-Digit Phone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. balaji.electricals@intrihub.com"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password / OTP
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Enter Vendor Panel"}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
              ⚡ Instant 1-Click Demo Test Accounts
            </p>
            <div className="space-y-2">
              {DEMO_VENDORS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleDemoLogin(v.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left group"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-gray-800 truncate group-hover:text-emerald-700">
                      {v.businessName}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">{v.category}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    Login →
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center text-xs text-gray-500">
            Want to sell on Intrihub?{" "}
            <Link
              href="/vendor/signup"
              className="text-emerald-600 font-bold hover:underline"
            >
              Apply as a New Vendor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
