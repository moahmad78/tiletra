"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import ConnectDashboard from "@/components/connect/ConnectDashboard";

const ALLOWED_EMAIL = "info@intrihub.com";

export default function HelpDeskPage() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authEmail, setAuthEmail] = useState(ALLOWED_EMAIL);
  const [authOtp, setAuthOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);

  // Check Initial Session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/help/auth/me");
        const data = await res.json();
        if (data.authenticated) {
          setIsAuthenticated(true);
        } else {
          // Check localStorage fallback
          const localAuth = localStorage.getItem("intrihub_help_auth");
          if (localAuth === ALLOWED_EMAIL) {
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkSession();
  }, []);

  // Handle Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);

    const clean = authEmail.trim().toLowerCase();
    if (clean !== ALLOWED_EMAIL) {
      setAuthError(`Access Denied: Only ${ALLOWED_EMAIL} is authorized. Other emails are prohibited.`);
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch("/api/help/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setAuthSuccessMsg(`6-digit OTP code has been sent to ${clean}. Please check your inbox.`);
      } else {
        setAuthError(data.error || "Failed to send OTP. Please try again.");
      }
    } catch {
      setAuthError("Network error while requesting verification code.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const clean = authEmail.trim().toLowerCase();
    if (clean !== ALLOWED_EMAIL) {
      setAuthError(`Access Denied: Only ${ALLOWED_EMAIL} is authorized.`);
      return;
    }

    try {
      setAuthLoading(true);
      const res = await fetch("/api/help/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean, otp: authOtp.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("intrihub_help_auth", ALLOWED_EMAIL);
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || "Invalid verification code.");
      }
    } catch {
      setAuthError("Network error during verification.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/help/auth/logout", { method: "POST" });
      localStorage.removeItem("intrihub_help_auth");
      setIsAuthenticated(false);
      setOtpSent(false);
      setAuthOtp("");
    } catch {
      setIsAuthenticated(false);
    }
  };

  // LOADING STATE
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#071321] flex items-center justify-center text-cyan-400 text-sm">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        Checking Help Desk Authorization...
      </div>
    );
  }

  // LOGIN SCREEN (Strictly restricted to info@intrihub.com)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#051426] flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-[#0a1b2e] border border-cyan-900/60 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 items-center justify-center shadow-lg shadow-cyan-500/25 mb-1">
              <Lock className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">IntriHub Help Desk</h1>
            <p className="text-xs text-slate-400">
              Customer Support & Communication OS • Secure Portal (<span className="text-cyan-400 font-mono">/help</span>)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-xs text-cyan-300 flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
            <span>
              Restricted Access: Only authorized support email (<strong>info@intrihub.com</strong>) is permitted. Other emails are blocked.
            </span>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-300 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{authSuccessMsg}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Authorized Support Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="info@intrihub.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#061220] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                {authEmail.trim().toLowerCase() !== ALLOWED_EMAIL && authEmail.length > 0 && (
                  <p className="text-[11px] text-red-400 mt-1.5">
                    ⚠ Only info@intrihub.com is allowed. Access will be rejected for this email.
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Sending Secure OTP...
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Enter 6-Digit Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setAuthOtp("");
                      setAuthError(null);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#061220] border border-slate-700 rounded-xl text-lg tracking-widest font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-center"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 text-center">
                  OTP sent to <strong>{authEmail}</strong> • Valid for 5 minutes
                </p>
              </div>

              <button
                type="submit"
                disabled={authLoading || authOtp.length !== 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify Code & Access Panel</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
            Protected by IntriHub Enterprise Identity • 256-Bit SSL Encrypted
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED DASHBOARD WORKSPACE (/help)
  return (
    <div className="min-h-screen bg-[#071321] flex flex-col">
      <ConnectDashboard
        portalContext="help"
        currentAgentEmail={ALLOWED_EMAIL}
        showLogout={true}
        onLogout={handleLogout}
      />
    </div>
  );
}
