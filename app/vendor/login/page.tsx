"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useVendorAuth } from "@/lib/vendor-auth";
import {
  checkVendorLoginMethod,
  sendVendorWebOtp,
  verifyVendorWebOtp,
  loginVendorWithPassword,
  type VendorWebLoginReason,
} from "@/lib/actions/web-portal-auth";
import {
  Store,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  KeyRound,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  Headphones,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import AuthSupportWidget from "@/components/auth/AuthSupportWidget";

export default function VendorLoginPage() {
  const router = useRouter();
  const { setVendor, isAuthenticated } = useVendorAuth();

  // If already authenticated, redirect to /vendor
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/vendor");
    }
  }, [isAuthenticated, router]);

  // Auth Steps: "email" | "otp" | "password" | "not_found" | "pending" | "rejected"
  const [step, setStep] = useState<"email" | "otp" | "password" | "not_found" | "pending" | "rejected">("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [vendorName, setVendorName] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number>(3);

  // Password state
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // OTP form state
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Lockout countdown timer
  useEffect(() => {
    let timer: any;
    if (isLockedOut && lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            setIsLockedOut(false);
            setErrorMessage("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLockedOut, lockoutTimer]);

  // Resend cooldown timer
  useEffect(() => {
    let timer: any;
    if (step === "otp" && resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, resendCooldown]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const formatLockoutTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ── Step 1: Submit Email for Dynamic Method Check ────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Please enter your registered vendor email address.");
      return;
    }

    setLoading(true);

    try {
      // 1. Check login method (OTP vs Password)
      const methodRes = await checkVendorLoginMethod(cleanEmail);

      if (!methodRes.success) {
        if (methodRes.locked) {
          setIsLockedOut(true);
          setLockoutTimer(methodRes.retryAfterSeconds || 900);
          setStep("email");
        } else {
          setIsLockedOut(false);
        }

        if (typeof methodRes.remainingAttempts === "number") {
          setRemainingAttempts(methodRes.remainingAttempts);
        }

        if (methodRes.reason === "NOT_FOUND") {
          if (methodRes.locked) {
            setStep("email");
          } else {
            setStep("not_found");
          }
        } else if (methodRes.reason === "PENDING_APPROVAL") {
          setVendorName(methodRes.vendorName || null);
          setStep("pending");
        } else if (methodRes.reason === "REJECTED") {
          setVendorName(methodRes.vendorName || null);
          setRejectionReason(methodRes.rejectionReason || null);
          setStep("rejected");
        } else {
          setErrorMessage(methodRes.message || "Unable to find vendor account");
          toast.error(methodRes.message || "Vendor lookup failed");
        }
        return;
      }

      setVendorName(methodRes.vendorName || null);

      // 2. If vendor configured for Password login:
      if (methodRes.loginMethod === "password") {
        setStep("password");
        setPassword("");
        return;
      }

      // 3. If vendor configured for OTP login:
      const otpRes = await sendVendorWebOtp(cleanEmail);
      if (otpRes.success) {
        toast.success(otpRes.message);
        setStep("otp");
        setResendCooldown(60);
      } else {
        if (otpRes.locked) {
          setIsLockedOut(true);
          setLockoutTimer(otpRes.retryAfterSeconds || 900);
          setStep("email");
        }
        setErrorMessage(otpRes.message);
        toast.error(otpRes.message);
      }
    } catch (err: any) {
      console.error("Vendor login error:", err);
      setErrorMessage("Failed to connect to authentication service. Please try again.");
      toast.error("Failed to connect to authentication service.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2A: Password Login Submission ───────────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!password) {
      setErrorMessage("Please enter your vendor account password.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await loginVendorWithPassword(email.trim().toLowerCase(), password);

      if (res.success && res.vendor) {
        toast.success("Welcome to your Vendor Panel!");
        setVendor(res.vendor);
        router.push("/vendor");
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
          setStep("email");
        } else {
          setIsLockedOut(false);
        }
        if (typeof res.remainingAttempts === "number") {
          setRemainingAttempts(res.remainingAttempts);
        }
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      console.error("Vendor password login error:", err);
      setErrorMessage("Authentication failed. Please check network connection.");
      toast.error("Authentication failed.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Step 2B: Handle OTP Input & Paste ─────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
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

  // ── Step 2B: Submit OTP ──────────────────────────────────────────────────
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
      const res = await verifyVendorWebOtp(email.trim().toLowerCase(), fullOtp);

      if (res.success && res.vendor) {
        toast.success("Welcome to your Vendor Panel!");
        setVendor(res.vendor);
        router.push("/vendor");
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
          setStep("email");
        } else {
          setIsLockedOut(false);
        }
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch (err: any) {
      console.error("Vendor OTP verify error:", err);
      setErrorMessage("Verification failed. Please check network connection.");
      toast.error("Verification failed.");
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || otpLoading || isLockedOut) return;
    setOtpLoading(true);
    setErrorMessage("");

    try {
      const res = await sendVendorWebOtp(email.trim().toLowerCase());

      if (res.success) {
        toast.success("A new 6-digit verification code has been sent!");
        setResendCooldown(60);
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        if (res.locked) {
          setIsLockedOut(true);
          setLockoutTimer(res.retryAfterSeconds || 900);
          setStep("email");
        }
        setErrorMessage(res.message);
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to resend verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#031d38] via-[#052a51] to-[#0b3b6f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            title="Return to Intrihub"
            className="inline-flex items-center gap-2.5 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-2xl shadow-xl mb-4 transition-all group border border-white/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/intri-web-logo.png"
              alt="Intrihub"
              width={140}
              height={36}
              className="h-8 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-[#052a51] rounded-md text-white shadow-xs">
              Vendor Portal
            </span>
          </Link>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Seller & Shop Login
          </h1>
          <p className="text-xs sm:text-sm text-blue-100/80 mt-1">
            Manage your catalog, fulfill customer orders, and track payouts
          </p>
        </div>

        {/* Login Box Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
          {/* Lockout Warning */}
          {isLockedOut && (
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 animate-in fade-in">
              <Clock size={18} className="shrink-0 text-amber-700 mt-0.5" />
              <div>
                <p className="font-extrabold text-amber-950">Security Lockout Active</p>
                <p className="mt-0.5 text-amber-800 leading-relaxed">
                  Too many failed attempts recorded (3/3). For account security, access from this network is locked.
                  {lockoutTimer > 0 ? (
                    <span className="block mt-1 font-bold text-amber-950">
                      ⏱ Retry allowed in {formatLockoutTime(lockoutTimer)}
                    </span>
                  ) : (
                    <span className="block mt-1">Please wait for 15 minutes before retrying.</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Error Alert Box */}
          {errorMessage && !isLockedOut && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span className="font-semibold">{errorMessage}</span>
            </div>
          )}

          {/* ── STATE 1: EMAIL REQUEST FORM ──────────────────────────────── */}
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="email"
                    value={email}
                    disabled={isLockedOut}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. vendor@intrihub.com"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#052a51] focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                    required
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 pl-1">
                  Enter your authorized vendor partner email to proceed.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || isLockedOut}
                className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-gray-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Vendor Account...</span>
                  </>
                ) : isLockedOut ? (
                  <>
                    <Clock size={16} />
                    <span>Locked ({formatLockoutTime(lockoutTimer)})</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STATE 2A: PASSWORD LOGIN FORM ────────────────────────────── */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Vendor Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setErrorMessage("");
                      setPassword("");
                    }}
                    className="text-xs text-[#F26522] hover:underline font-bold flex items-center gap-1"
                  >
                    <ArrowLeft size={12} />
                    Change Email
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Logging in as <strong className="text-gray-800">{vendorName || email}</strong>
                </p>

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={isLockedOut}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-[#052a51] focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading || !password || isLockedOut}
                className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-gray-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed group mt-2"
              >
                {passwordLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : isLockedOut ? (
                  <>
                    <Clock size={16} />
                    <span>Locked ({formatLockoutTime(lockoutTimer)})</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Sign In to Vendor Panel</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── STATE 2B: 6-DIGIT OTP VERIFICATION ───────────────────────── */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    6-Digit Login Code
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setErrorMessage("");
                    }}
                    className="text-xs text-[#F26522] hover:underline font-bold flex items-center gap-1"
                  >
                    <ArrowLeft size={12} />
                    Change Email
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-3">
                  Enter the security code sent to <strong className="text-gray-800">{email}</strong>
                </p>

                {/* 6 Digit Input Boxes */}
                <div className="flex justify-between gap-2 sm:gap-3 my-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl border transition-all ${
                        digit
                          ? "border-[#052a51] bg-white text-[#052a51] shadow-xs"
                          : "border-gray-200 bg-gray-50 text-gray-800"
                      } focus:outline-none focus:border-[#F26522] focus:bg-white focus:ring-2 focus:ring-[#F26522]/20`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otpDigits.some((d) => !d) || isLockedOut}
                className="w-full py-3.5 px-4 bg-[#052a51] hover:bg-[#031d38] disabled:bg-gray-300 text-white text-sm font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {otpLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    <span>Verify & Enter Vendor Panel</span>
                  </>
                )}
              </button>

              {/* Resend Action */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || otpLoading || isLockedOut}
                  className="text-xs font-bold text-gray-500 hover:text-[#052a51] disabled:text-gray-400 inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    size={13}
                    className={otpLoading ? "animate-spin" : ""}
                  />
                  {resendCooldown > 0
                    ? `Resend code in ${resendCooldown}s`
                    : "Didn't receive code? Resend OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ── STATE 3: NOT REGISTERED AS VENDOR SCREEN ─────────────────── */}
          {step === "not_found" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Store size={28} />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">Vendor Account Not Found</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  The email <strong className="text-gray-800">{email}</strong> is not registered as an approved vendor partner on Intrihub.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-bold text-amber-800">
                  <span>{remainingAttempts} attempt{remainingAttempts === 1 ? "" : "s"} remaining before 15-min lockout</span>
                </div>
              </div>

              <div className="pt-2 space-y-2.5">
                <Link
                  href="/vendor/apply"
                  className="w-full py-3 px-4 bg-[#F26522] hover:bg-[#d95315] text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Store size={15} />
                  <span>Apply as a Vendor Partner</span>
                  <ArrowRight size={14} />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setErrorMessage("");
                  }}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Try Another Email</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STATE 4: APPLICATION PENDING REVIEW SCREEN ──────────────── */}
          {step === "pending" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#052a51] flex items-center justify-center mx-auto">
                <Clock size={28} />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">Application Under Review</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  {vendorName ? <strong>{vendorName}</strong> : "Your store application"} is currently being reviewed by our merchant onboarding team.
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200/60 rounded-xl text-left text-xs text-blue-900 space-y-1">
                <p className="font-bold">Next Steps:</p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  We verify GSTIN, bank records, and warehouse location within 24–48 business hours. You will receive an approval email once activated.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setErrorMessage("");
                  }}
                  className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Login</span>
                </button>
              </div>
            </div>
          )}

          {/* ── STATE 5: APPLICATION REJECTED SCREEN ─────────────────────── */}
          {step === "rejected" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <XCircle size={28} />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">Application Not Approved</h3>
                <p className="text-xs text-gray-600 mt-1 max-w-xs mx-auto leading-relaxed">
                  Your vendor partner application could not be approved.
                </p>
              </div>

              {rejectionReason && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-left text-xs text-red-900">
                  <p className="font-bold text-red-950 mb-0.5">Admin Feedback:</p>
                  <p className="text-red-800 leading-relaxed">{rejectionReason}</p>
                </div>
              )}

              <div className="pt-2 space-y-2.5">
                <a
                  href="mailto:support@intrihub.com"
                  className="w-full py-2.5 px-4 bg-[#052a51] hover:bg-[#031d38] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Headphones size={15} />
                  <span>Contact Partner Support</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setErrorMessage("");
                  }}
                  className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Login</span>
                </button>
              </div>
            </div>
          )}

          {/* Registration Footer */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Not a registered vendor yet?{" "}
              <Link
                href="/vendor/apply"
                className="font-bold text-[#F26522] hover:underline"
              >
                Apply as a Vendor Partner →
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="flex items-center justify-center gap-4 mt-6 text-xs text-blue-200/60 font-medium">
          <div className="flex items-center gap-1">
            <ShieldCheck size={14} />
            <span>256-Bit TLS Encryption</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Zap size={14} />
            <span>Secure Authentication</span>
          </div>
        </div>
      </div>

      {/* Floating Support Button strictly on Vendor Login Screen */}
      <AuthSupportWidget portalType="vendor" />
    </div>
  );
}
