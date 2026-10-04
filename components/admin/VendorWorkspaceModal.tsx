"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startWorkspaceSession } from "@/lib/vendor-workspace-auth";
import { WORKSPACE_REASONS } from "@/lib/config/vendor-workspace-permissions";
import {
  ShieldAlert,
  Search,
  Lock,
  Store,
  KeyRound,
  AlertCircle,
  Clock,
  ChevronRight,
  X,
  Loader2,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export interface VendorOption {
  id: string;
  businessName: string;
  contactPhone?: string;
  contactEmail?: string;
  category?: string;
  status: string;
}

interface VendorWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendors: VendorOption[];
  preSelectedVendor?: VendorOption | null;
  directTo?: string; // e.g. "products/new"
}

export default function VendorWorkspaceModal({
  isOpen,
  onClose,
  vendors,
  preSelectedVendor,
  directTo,
}: VendorWorkspaceModalProps) {
  const router = useRouter();
  const [selectedVendorId, setSelectedVendorId] = useState<string>(preSelectedVendor?.id || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState<string>(WORKSPACE_REASONS[0].value);
  const [note, setNote] = useState("");
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  if (!isOpen) return null;

  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      v.businessName.toLowerCase().includes(q) ||
      v.id.toLowerCase().includes(q) ||
      (v.contactPhone && v.contactPhone.includes(q)) ||
      (v.category && v.category.toLowerCase().includes(q))
    );
  });

  const selectedVendor = vendors.find((v) => v.id === (selectedVendorId || preSelectedVendor?.id));

  const handleRequestOtp = async () => {
    try {
      setSendingOtp(true);
      const { validateAdminCredentialsAndSendOtp } = await import("@/lib/actions/admin-auth-2fa");
      const { STRICT_ADMIN_EMAIL } = await import("@/lib/admin-constants");
      // Request 2FA OTP for the admin session
      const res = await validateAdminCredentialsAndSendOtp({
        email: STRICT_ADMIN_EMAIL,
        password: password || undefined,
      });

      if (res.success || res.step === "otp_required") {
        setOtpRequested(true);
        toast.success(res.message || "2FA verification code sent to your registered admin email!");
      } else {
        toast.error(res.message || "Failed to send 2FA code");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to request 2FA OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetVendorId = selectedVendorId || preSelectedVendor?.id;
    if (!targetVendorId) {
      toast.error("Please select a target vendor to open their workspace.");
      return;
    }

    if (authMethod === "password" && !password) {
      toast.error("Please enter your admin password for step-up verification.");
      return;
    }

    if (authMethod === "otp" && (!otp || otp.length !== 6)) {
      toast.error("Please enter the 6-digit 2FA code.");
      return;
    }

    try {
      setLoading(true);
      const res = await startWorkspaceSession({
        vendorId: targetVendorId,
        reason,
        note: note.trim() || undefined,
        stepUpPassword: authMethod === "password" ? password : undefined,
        stepUpOtp: authMethod === "otp" ? otp : undefined,
      });

      if (res.success) {
        toast.success(`Vendor Workspace activated for ${res.vendor?.businessName}!`);
        onClose();

        // Redirect to vendor panel in workspace mode
        if (directTo === "products/new") {
          router.push("/vendor/products/new");
        } else {
          router.push("/vendor");
        }
        router.refresh();
      } else {
        toast.error(res.error || "Failed to start workspace session.");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#991b1b] to-[#c2410c] text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <ShieldAlert size={22} className="text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Open Vendor Workspace</h2>
              <p className="text-xs text-white/80 mt-0.5">
                Work inside a vendor account on their behalf with full audit logging.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStartSession} className="p-6 overflow-y-auto space-y-5 text-xs text-gray-700">
          {/* 1. Target Vendor Selection */}
          <div>
            <label className="block font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <Store size={14} className="text-amber-600" />
              Target Vendor Store
            </label>

            {preSelectedVendor ? (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="font-extrabold text-gray-900">{preSelectedVendor.businessName}</p>
                  <p className="text-[11px] text-gray-500 font-mono">ID: {preSelectedVendor.id}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {preSelectedVendor.category || "General"}
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by vendor name, ID, phone..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50 bg-gray-50/50">
                  {filteredVendors.length === 0 ? (
                    <p className="p-3 text-center text-gray-400">No matching vendors found</p>
                  ) : (
                    filteredVendors.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVendorId(v.id)}
                        className={`w-full p-2.5 text-left flex items-center justify-between hover:bg-amber-50 transition-colors ${
                          selectedVendorId === v.id ? "bg-amber-100/60 font-bold border-l-4 border-amber-600" : ""
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="text-xs text-gray-900 truncate">{v.businessName}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{v.id}</p>
                        </div>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200 shrink-0">
                          {v.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 2. Reason Selection */}
          <div>
            <label className="block font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
              <FileText size={14} className="text-amber-600" />
              Reason for Workspace Access
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {WORKSPACE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Internal Note / Ticket Reference (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Ticket #4928 - Vendor requested assistance uploading 20 new vitrified tile SKUs"
              rows={2}
              className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* 3. Step-Up Verification */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
                <Lock size={14} className="text-rose-600" />
                Step-Up Verification
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod("password")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    authMethod === "password" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Admin Password
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("otp")}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    authMethod === "otp" ? "bg-amber-600 text-white" : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  2FA Email OTP
                </button>
              </div>
            </div>

            {authMethod === "password" ? (
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your Super Admin password"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit OTP code"
                    maxLength={6}
                    className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-white font-mono tracking-widest text-center text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={sendingOtp}
                    className="px-3 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-black disabled:opacity-50 shrink-0"
                  >
                    {sendingOtp ? <Loader2 className="animate-spin" size={14} /> : otpRequested ? "Resend" : "Send OTP"}
                  </button>
                </div>
                {otpRequested && (
                  <p className="text-[10px] text-emerald-600 font-bold">
                    ✓ Security code sent to your registered admin email.
                  </p>
                )}
              </div>
            )}

            <div className="text-[10px] text-gray-500 space-y-0.5 pt-1 border-t border-gray-200">
              <p>• Session automatically expires after <strong>60 minutes</strong> (idle timeout: 20 min).</p>
              <p>• Sensitive banking, payout, and password updates are <strong>restricted</strong>.</p>
              <p>• All actions are permanently stamped in <strong>AdminAuditLog</strong>.</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedVendor}
              className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-[#991b1b] to-[#c2410c] hover:from-[#7f1d1d] hover:to-[#9a3412] text-white font-extrabold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Verifying & Launching...
                </>
              ) : (
                <>
                  <ShieldAlert size={16} />
                  Open Workspace Now
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
