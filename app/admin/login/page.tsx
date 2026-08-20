"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState("sahil@intrihub.com");
  const [password, setPassword] = useState("sahil@7814");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setLoading(false);

      if (success) {
        toast.success("Welcome back, Sahil! Signed in to Intrihub Admin Portal.");
        router.push("/admin");
      } else {
        toast.error("Invalid credentials. Use sahil@intrihub.com / sahil@7814");
      }
    }, 300);
  };

  const handleQuickLogin = (role: "admin" | "staff") => {
    if (role === "admin") {
      setEmail("sahil@intrihub.com");
      setPassword("sahil@7814");
      login("sahil@intrihub.com", "sahil@7814");
      toast.success("Logged in as Sahil Sheikh (Founder & CEO)");
    } else {
      setEmail("staff@intrihub.com");
      setPassword("staff");
      login("staff@intrihub.com", "staff");
      toast.success("Logged in as Operations Staff");
    }
    router.push("/admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#052a51] via-[#031d38] to-[#02152b]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Top Accent Pill */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-white px-4 py-2 rounded-2xl shadow-xs mb-3 border border-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/intri-web-logo.png"
              alt="Intrihub"
              className="h-8 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-[#052a51]">Admin Management Portal</h1>
          <p className="text-xs text-gray-500 mt-1">
            Sign in to manage catalog, orders, vendors, customers & site content
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sahil@intrihub.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-[#F26522] text-white font-bold text-sm rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center mb-3">
            Quick Fill Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin("admin")}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <span className="text-[#F26522]">Founder & CEO</span>
              <span className="text-[10px] text-gray-400">sahil@intrihub.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin("staff")}
              className="p-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] transition-colors flex flex-col items-center gap-0.5 cursor-pointer"
            >
              <span>Staff Account</span>
              <span className="text-[10px] text-gray-400">staff@intrihub.com</span>
            </button>
          </div>
        </div>

        {/* Public Store Return */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-[#052a51] font-semibold transition-colors"
          >
            ← Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
