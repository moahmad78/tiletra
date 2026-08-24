"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, ShieldCheck, ArrowRight,
  CheckCircle2, RotateCw, ChevronLeft,
} from "lucide-react";
import { useAuthStore, useAuthHydrated, useAuthStatus } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";
import { toast } from "sonner";

type LoginTab = "choose" | "email";
type OtpStep = "input" | "otp";

export default function LoginModal() {
  const router = useRouter();
  const {
    isLoginModalOpen, closeLoginModal,
    sendEmailOtp, verifyEmailOtp,
    pendingIntent,
  } = useAuthStore();
  const { addItem } = useCartStore();

  // Tab / step state
  const [tab, setTab] = useState<LoginTab>("choose");
  const [step, setStep] = useState<OtpStep>("input");

  // Email flow
  const [email, setEmail] = useState("");

  // Shared OTP state (6 digits)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset on open/close
  useEffect(() => {
    if (!isLoginModalOpen) {
      setTab("choose");
      setStep("input");
      setEmail("");
      setOtp(["", "", "", "", "", ""]);
      setLoading(false);
      setTimer(60);
      setCanResend(false);
    }
  }, [isLoginModalOpen]);

  // Countdown timer
  useEffect(() => {
    if (step !== "otp") return;
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  const isHydrated = useAuthHydrated();
  const authStatus = useAuthStatus();

  if (!isHydrated || !isLoginModalOpen || authStatus === "loading") return null;

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const goBack = () => {
    if (step === "otp") {
      setStep("input");
      setOtp(["", "", "", "", "", ""]);
      setTimer(60);
      setCanResend(false);
    } else {
      setTab("choose");
    }
  };

  // ─── Post-login intent redirect ───────────────────────────────────────────

  const handlePostLogin = async () => {
    if (pendingIntent?.type === "checkout") {
      router.push("/checkout");
    } else if (pendingIntent?.type === "buy_now") {
      const { productId, variantId, quantity } = pendingIntent.data;
      try {
        const { getProductById } = await import("@/lib/actions/products");
        const prod = await getProductById(productId);
        if (prod) {
          const variant = prod.variants.find((v) => v.id === variantId) || prod.variants[0];
          addItem(prod, variant, quantity);
        }
      } catch (e) { console.error("buy_now intent error:", e); }
      router.push("/checkout");
    }
  };

  // ─── Google ───────────────────────────────────────────────────────────────

  const handleGoogleOAuth = () => {
    closeLoginModal();
    // Build intent param so the callback can redirect appropriately after login
    const intent = pendingIntent?.type || "";
    const params = intent ? `?intent=${encodeURIComponent(intent)}` : "";
    // Full page redirect to our OAuth initiate route
    window.location.href = `/api/auth/google${params}`;
  };

  // ─── Email OTP ────────────────────────────────────────────────────────────

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      toast.error("Enter a valid email address");
      return;
    }

    setLoading(true);
    const res = await sendEmailOtp(clean);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setStep("otp");
      setTimer(60);
      setCanResend(false);
      setTimeout(() => otpInputsRef.current[0]?.focus(), 100);
    } else {
      toast.error(res.message);
    }
  };

  // ─── OTP input handling (6 digits) ────────────────────────────────────────

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      // Paste handling
      const digits = val.replace(/\D/g, "").slice(0, 6).split("");
      const next = [...otp];
      digits.forEach((d, i) => { if (i < 6) next[i] = d; });
      setOtp(next);
      if (digits.length === 6) verifyCode(next.join(""));
      return;
    }

    const next = [...otp];
    next[index] = val.replace(/\D/g, "");
    setOtp(next);

    if (val && index < 5) otpInputsRef.current[index + 1]?.focus();
    if (index === 5 && val) {
      const full = next.join("");
      if (full.length === 6) verifyCode(full);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const verifyCode = async (codeArg?: string) => {
    const code = codeArg ?? otp.join("");
    if (code.length !== 6) { toast.error("Enter all 6 digits"); return; }

    setLoading(true);
    const res = await verifyEmailOtp(email.trim().toLowerCase(), code);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      await handlePostLogin();
    } else {
      toast.error(res.message);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimer(60);
    setOtp(["", "", "", "", "", ""]);

    const res = await sendEmailOtp(email.trim().toLowerCase());
    if (res.success) toast.success("New OTP sent to " + email);
  };

  // ─── UI ───────────────────────────────────────────────────────────────────

  const headerTitle =
    tab === "choose" ? "Login to Continue"
    : step === "input" ? "Enter Email Address"
    : "Enter Verification Code";

  const headerSubtitle =
    tab === "choose"
      ? "Choose how you'd like to continue. Your orders and saved addresses will be linked to your account."
      : step === "input"
        ? "We'll send a 6-digit code to your email inbox."
        : `Code sent to ${email}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={closeLoginModal}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Modal */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-[440px] bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl z-10 overflow-hidden border border-gray-100"
      >
        {/* Mobile drag handle */}
        <div className="md:hidden w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1" />

        {/* Close / Back */}
        {tab !== "choose" ? (
          <button
            onClick={goBack}
            aria-label="Go back"
            className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        ) : null}
        <button
          onClick={closeLoginModal}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#052a51] to-[#0a3869] text-white p-6 pt-7 md:pt-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-md bg-[#F26522] text-[10px] font-black uppercase tracking-wider">
              Intrihub
            </span>
            <span className="text-xs text-white/70 font-semibold flex items-center gap-1">
              <ShieldCheck size={14} className="text-[#F26522]" /> Secure Login
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{headerTitle}</h2>
          <p className="text-xs text-white/75 mt-1 leading-relaxed">{headerSubtitle}</p>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${step}`}
            initial={{ opacity: 0, x: tab === "choose" ? -10 : 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-6"
          >
            {/* ── CHOOSE TAB ── */}
            {tab === "choose" && (
              <div className="space-y-3.5">
                {/* Google */}
                <button
                  id="login-google-btn"
                  type="button"
                  onClick={handleGoogleOAuth}
                  className="relative w-full h-[52px] bg-white border-2 border-gray-200 hover:border-[#F26522] hover:bg-orange-50/40 rounded-2xl text-sm font-bold text-[#052a51] flex items-center justify-center gap-3 px-4 transition-all shadow-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className="font-bold text-[#052a51] text-[14px]">Continue with Google</span>
                  </div>
                  <span className="absolute right-3.5 text-[9.5px] font-black uppercase bg-[#F26522] text-white px-2 py-0.5 rounded-md shadow-xs tracking-wider">
                    Fastest
                  </span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200" />
                  <span className="flex-shrink mx-4 text-gray-400 text-[11px] font-bold uppercase tracking-wider">OR</span>
                  <div className="flex-grow border-t border-gray-200" />
                </div>

                {/* Email */}
                <button
                  id="login-email-btn"
                  type="button"
                  onClick={() => setTab("email")}
                  className="w-full h-[52px] bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-sm font-bold text-[#052a51] flex items-center gap-3 px-4 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#052a51]/10 flex items-center justify-center shrink-0">
                    <Mail size={16} className="text-[#052a51]" />
                  </div>
                  <span className="text-[14px]">Continue with Email OTP</span>
                  <ArrowRight size={16} className="ml-auto text-gray-400" />
                </button>

                <p className="text-[10px] text-gray-400 text-center leading-relaxed mt-4">
                  By continuing, you agree to Intrihub's{" "}
                  <a href="/terms" className="text-[#052a51] underline font-semibold">Terms</a>{" "}
                  and{" "}
                  <a href="/privacy-policy" className="text-[#052a51] underline font-semibold">Privacy Policy</a>.
                </p>
              </div>
            )}

            {/* ── EMAIL INPUT ── */}
            {tab === "email" && step === "input" && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    id="login-email-input"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-gray-200 focus:border-[#F26522] bg-gray-50 focus:bg-white text-base font-bold text-[#052a51] placeholder-gray-400 focus:outline-none transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!email.includes("@") || loading}
                  className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <RotateCw size={18} className="animate-spin" /> : (
                    <><Mail size={16} /><span>Send OTP to Email</span></>
                  )}
                </button>

                <p className="text-[11px] text-gray-400 text-center">
                  A 6-digit code will be emailed to you. Check your inbox (and spam).
                </p>
              </form>
            )}

            {/* ── OTP STEP (Email OTP verification) ── */}
            {step === "otp" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#052a51]">
                    OTP sent to {email}
                  </span>
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-xs font-bold text-[#F26522] hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* 6 OTP Inputs */}
                <div className="flex justify-between gap-2 my-2">
                  {[0, 1, 2, 3, 4, 5].map((idx) => (
                    <input
                      key={idx}
                      id={`otp-digit-${idx}`}
                      ref={(el) => { otpInputsRef.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[idx]}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className="w-11 h-12 text-center text-xl font-black text-[#052a51] bg-gray-50 border-2 border-gray-200 focus:border-[#F26522] focus:bg-white rounded-xl focus:outline-none transition-all shadow-xs"
                    />
                  ))}
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200/80 flex items-center gap-2 text-xs text-blue-900 font-semibold">
                  <Mail size={15} className="text-blue-600 shrink-0" />
                  <span>Check your inbox (or spam folder) for the 6-digit code.</span>
                </div>

                <button
                  type="button"
                  id="login-verify-btn"
                  onClick={() => verifyCode()}
                  disabled={otp.join("").length !== 6 || loading}
                  className="w-full h-12 bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <RotateCw size={18} className="animate-spin" />
                  ) : (
                    <><CheckCircle2 size={18} /><span>Verify & Continue</span></>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                  <span>Didn't receive the code?</span>
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="font-bold text-[#F26522] hover:underline"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-gray-400">Resend in {timer}s</span>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
