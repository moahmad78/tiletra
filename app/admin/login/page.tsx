"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import {
  validateAdminCredentialsAndSendOtp,
  verifyAdmin2FaOtp,
} from "@/lib/actions/admin-auth-2fa";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const { setSession, isAuthenticated } = useAdminAuth();

  // If already authenticated, redirect to /admin
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    }
  }, [isAuthenticated, router]);

  // Auth Step: "credentials" (Step 1) | "otp" (Step 2)
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  // Step 1 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Step 2 state (OTP)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: any;
    if (step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Auto-focus first OTP input when switching to Step 2
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // ── Step 1: Submit Credentials & Request OTP ─────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter the admin password.");
      return;
    }

    setLoading(true);

    try {
      const res = await validateAdminCredentialsAndSendOtp({
        email: cleanEmail,
        password,
      });

      if (res.success) {
        toast.success(res.message);
        setStep("otp");
        setResendCooldown(60);
      } else {
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setErrorMessage("Failed to authenticate. Please check server logs.");
      toast.error("Failed to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Handle OTP Input & Paste ─────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle multi-character paste into a single box
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || "";
        }
        setOtpDigits(nextDigits);
        const focusIndex = Math.min(pasted.length, 5);
        inputRefs.current[focusIndex]?.focus();
        return;
      }
    }

    const clean = value.replace(/\D/g, "");
    const nextDigits = [...otpDigits];
    nextDigits[index] = clean;
    setOtpDigits(nextDigits);

    // Auto-advance to next box
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const nextDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        nextDigits[i] = pasted[i] || "";
      }
      setOtpDigits(nextDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // ── Step 2: Submit OTP ───────────────────────────────────────────────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the verification code.");
      toast.error("Please enter the complete 6-digit OTP.");
      return;
    }

    setOtpLoading(true);

    try {
      const res = await verifyAdmin2FaOtp({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      });

      if (res.success && res.user) {
        toast.success("Identity Verified! Welcome to Super Admin Portal.");
        setSession(res.user);
        router.push("/admin");
      } else {
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setErrorMessage("Verification failed. Please try again.");
      toast.error("Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpLoading) return;
    setOtpLoading(true);
    setErrorMessage("");

    try {
      const res = await validateAdminCredentialsAndSendOtp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success) {
        toast.success("A new 6-digit OTP code has been sent!");
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Failed to resend OTP code.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#052a51] via-[#031d38] to-[#02152b]">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/10 relative overflow-hidden">
        {/* Subtle orange ambient blur inside card */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#F26522]/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#052a51] to-[#0a4275] shadow-lg mb-4 text-white">
            <Lock size={26} className="text-[#F26522]" />
          </div>

          <div className="flex items-center justify-center gap-1.5 mb-1">
            <ShieldCheck size={18} className="text-[#F26522]" />
            <h1 className="text-xl sm:text-2xl font-black text-[#052a51]">
              {step === "credentials" ? "Admin Management Portal" : "Two-Factor Authentication"}
            </h1>
          </div>

          <p className="text-xs text-gray-500 max-w-xs mx-auto">
            {step === "credentials"
              ? "Strict 2FA Security Gated: Email + Password + OTP verification"
              : `Enter the 6-digit code sent to ${email || "your email"}`}
          </p>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* ── STEP 1: EMAIL & PASSWORD FORM ──────────────────────────────── */}
        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Authorized Admin Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522] focus:bg-white transition-all shadow-2xs"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-1">
                Authorized personnel only.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522] focus:bg-white transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#F26522] text-white font-bold text-sm rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Verify & Send 2FA Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ── STEP 2: 6-DIGIT OTP VERIFICATION FORM ──────────────────────── */
          <form onSubmit={handleOtpSubmit} className="space-y-5">
            <div className="bg-orange-50/80 border border-orange-200/60 rounded-2xl p-3.5 text-center">
              <span className="text-[11px] font-bold text-[#F26522] uppercase tracking-wider block mb-0.5">
                Security Code Sent
              </span>
              <p className="text-xs font-bold text-[#052a51]">{email}</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block text-center mb-3">
                Enter 6-Digit Verification Code
              </label>

              {/* 6 OTP Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black text-[#052a51] bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-[#F26522] focus:bg-white focus:outline-none transition-all shadow-2xs"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={otpLoading || otpDigits.join("").length !== 6}
              className="w-full h-12 bg-[#F26522] text-white font-bold text-sm rounded-xl hover:bg-[#d95a1e] active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {otpLoading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Verify OTP & Enter Admin</span>
                </>
              )}
            </button>

            {/* Resend & Back controls */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setErrorMessage("");
                }}
                className="text-gray-500 hover:text-[#052a51] font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || otpLoading}
                className="text-[#F26522] font-bold hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
              >
                {resendCooldown > 0
                  ? `Resend OTP in ${resendCooldown}s`
                  : "Resend Security Code"}
              </button>
            </div>
          </form>
        )}

        {/* Public Store Return */}
        <div className="mt-7 text-center">
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-[#052a51] font-semibold transition-colors"
          >
            ← Return to Intrihub Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
