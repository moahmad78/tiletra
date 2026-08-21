"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useVendorAuth } from "@/lib/vendor-auth";
import {
  getVendorProfile,
  updateVendorProfile,
  updateVendorBankDetails,
  updateVendorKycDocuments,
  updateVendorDeliverySettings,
  changeVendorPassword,
} from "@/lib/actions/vendor";
import {
  Store,
  Phone,
  Mail,
  MapPin,
  Building,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Landmark,
  QrCode,
  FileText,
  Upload,
  Image as ImageIcon,
  KeyRound,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  Trash2,
  Loader2,
  Check,
  Truck,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function VendorSettingsPage() {
  const { vendor, setVendor } = useVendorAuth();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "shop";

  const [activeTab, setActiveTab] = useState<"shop" | "kyc" | "bank" | "shipping" | "security">(
    (initialTab as any) || "shop"
  );

  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Shop Profile Data
  const [shopData, setShopData] = useState({
    businessName: "",
    contactEmail: "",
    contactPhone: "",
    businessAddress: "",
    category: "General",
    description: "",
    logo: "",
    shopPhotoUrl: "",
  });

  // Delivery & Shipping Data
  const [shippingData, setShippingData] = useState<{
    deliveryMethod: "self" | "platform";
    deliveryFeeEnabled: boolean;
    customDeliveryFee: string;
    freeDeliveryThreshold: string;
  }>({
    deliveryMethod: "self",
    deliveryFeeEnabled: true,
    customDeliveryFee: "",
    freeDeliveryThreshold: "",
  });

  // KYC Legal Documents Data
  const [kycData, setKycData] = useState({
    panNumber: "",
    panDocUrl: "",
    aadharNumber: "",
    aadharDocUrl: "",
    gstNumber: "",
    gstDocUrl: "",
    chequeDocUrl: "",
    tradeLicenseDocUrl: "",
    kycStatus: "pending",
    kycNotes: "",
  });

  // Bank Data
  const [bankData, setBankData] = useState({
    bankAccountHolder: "",
    bankName: "",
    bankAccountNumber: "",
    bankIfscCode: "",
    bankUpiId: "",
  });

  // Password Data
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (vendor?.id) {
      getVendorProfile(vendor.id).then((v: any) => {
        if (v) {
          setShopData({
            businessName: v.businessName || "",
            contactEmail: v.contactEmail || "",
            contactPhone: v.contactPhone || "",
            businessAddress: v.businessAddress || "",
            category: v.category || "General",
            description: v.description || "",
            logo: v.logo || "",
            shopPhotoUrl: v.shopPhotoUrl || "",
          });
          setShippingData({
            deliveryMethod: (v.deliveryMethod === "platform" ? "platform" : "self") as "self" | "platform",
            deliveryFeeEnabled: v.deliveryFeeEnabled !== false,
            customDeliveryFee: v.customDeliveryFee != null ? String(v.customDeliveryFee) : "",
            freeDeliveryThreshold: v.freeDeliveryThreshold != null ? String(v.freeDeliveryThreshold) : "",
          });
          setKycData({
            panNumber: v.panNumber || "",
            panDocUrl: v.panDocUrl || "",
            aadharNumber: v.aadharNumber || "",
            aadharDocUrl: v.aadharDocUrl || "",
            gstNumber: v.gstNumber || "",
            gstDocUrl: v.gstDocUrl || "",
            chequeDocUrl: v.chequeDocUrl || "",
            tradeLicenseDocUrl: v.tradeLicenseDocUrl || "",
            kycStatus: v.kycStatus || "pending",
            kycNotes: v.kycNotes || "",
          });
          setBankData({
            bankAccountHolder: v.bankAccountHolder || "",
            bankName: v.bankName || "",
            bankAccountNumber: v.bankAccountNumber || "",
            bankIfscCode: v.bankIfscCode || "",
            bankUpiId: v.bankUpiId || "",
          });
        }
      });
    }
  }, [vendor?.id]);

  // Generic File Upload Handler
  const handleFileUpload = async (file: File, targetField: string) => {
    try {
      setUploadingField(targetField);
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();

      if (data.success && data.url) {
        if (targetField === "shopPhotoUrl" || targetField === "logo") {
          setShopData((prev) => ({ ...prev, [targetField]: data.url }));
        } else {
          setKycData((prev) => ({ ...prev, [targetField]: data.url }));
        }
        toast.success("Document uploaded successfully!");
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      toast.error("Failed to upload file");
    } finally {
      setUploadingField(null);
    }
  };

  // 1. Submit Shop Profile
  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    setLoading(true);
    const res = await updateVendorProfile(vendor.id, shopData);
    setLoading(false);

    if (res.success && res.vendor) {
      toast.success("Shop information & storefront photo saved!");
      setVendor({
        ...vendor,
        businessName: res.vendor.businessName,
        contactEmail: res.vendor.contactEmail,
        contactPhone: res.vendor.contactPhone,
        category: (res.vendor as any).category,
      });
    } else {
      toast.error(res.error || "Failed to update shop details");
    }
  };

  // 2. Submit KYC Legal Documents
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    if (!kycData.panNumber && !kycData.panDocUrl) {
      toast.error("PAN Card number or document upload is required");
      return;
    }
    if (!kycData.aadharNumber && !kycData.aadharDocUrl) {
      toast.error("Aadhaar Card number or document upload is required");
      return;
    }

    setLoading(true);
    const res = await updateVendorKycDocuments(vendor.id, kycData);
    setLoading(false);

    if (res.success) {
      toast.success("KYC legal documents submitted for Super Admin verification!");
      setKycData((prev) => ({ ...prev, kycStatus: "submitted" }));
    } else {
      toast.error(res.error || "Failed to submit KYC documents");
    }
  };

  // 3. Submit Bank Details
  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    if (bankData.bankAccountNumber && bankData.bankAccountNumber.length < 6) {
      toast.error("Please enter a valid bank account number");
      return;
    }
    if (bankData.bankIfscCode && bankData.bankIfscCode.length < 5) {
      toast.error("Please enter a valid IFSC code (e.g. HDFC0001234)");
      return;
    }

    setLoading(true);
    const res = await updateVendorBankDetails(vendor.id, bankData);
    setLoading(false);

    if (res.success) {
      toast.success("Bank and payout details updated!");
    } else {
      toast.error(res.error || "Failed to update bank details");
    }
  };

  // 3b. Submit Delivery & Shipping Settings
  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.id) return;

    setLoading(true);
    const res = await updateVendorDeliverySettings(vendor.id, {
      deliveryMethod: shippingData.deliveryMethod,
      deliveryFeeEnabled: shippingData.deliveryFeeEnabled,
      customDeliveryFee: shippingData.customDeliveryFee !== "" ? Number(shippingData.customDeliveryFee) : null,
      freeDeliveryThreshold: shippingData.freeDeliveryThreshold !== "" ? Number(shippingData.freeDeliveryThreshold) : null,
    });
    setLoading(false);

    if (res.success) {
      toast.success("Delivery & shipping rules updated successfully!");
    } else {
      toast.error(res.error || "Failed to update delivery settings");
    }
  };

  // 4. Submit Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor?.ownerId) return;

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    const res = await changeVendorPassword(vendor.ownerId, passwordData.newPassword);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } else {
      toast.error(res.error || "Failed to change password");
    }
  };

  const isKycIncomplete = !kycData.panDocUrl || !kycData.aadharDocUrl;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          Shop Profile & Settings
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your verified storefront details, delivery freight rules, legal KYC documents, and bank payout settings.
        </p>
      </div>

      {/* Seller Header Overview Card */}
      <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {shopData.shopPhotoUrl || shopData.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shopData.shopPhotoUrl || shopData.logo}
              alt={shopData.businessName}
              className="w-16 h-16 rounded-2xl object-cover border border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center border border-emerald-200">
              {shopData.businessName ? shopData.businessName.charAt(0).toUpperCase() : "S"}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-gray-900">
                {shopData.businessName || "Your Shop Name"}
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {shopData.category || "General"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Seller Commission: <strong className="text-emerald-700">{vendor?.commissionRate}%</strong> · Contact: {shopData.contactPhone || vendor?.contactPhone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {kycData.kycStatus === "verified" ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
              <ShieldCheck size={15} /> KYC Verified
            </span>
          ) : kycData.kycStatus === "submitted" ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Clock size={15} /> KYC Under Review
            </span>
          ) : kycData.kycStatus === "rejected" ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <XCircle size={15} /> KYC Re-upload Required
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle size={15} /> KYC Incomplete (Compulsory)
            </span>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("shop")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "shop"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Store size={16} />
          <span>Shop Profile & Photos</span>
        </button>

        <button
          onClick={() => setActiveTab("shipping")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "shipping"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Truck size={16} />
          <span>Delivery & Shipping</span>
        </button>

        <button
          onClick={() => setActiveTab("kyc")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer relative ${
            activeTab === "kyc"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileText size={16} />
          <span>Legal KYC Documents</span>
          {isKycIncomplete && (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("bank")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "bank"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Landmark size={16} />
          <span>Bank & Payouts</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`px-5 py-3 text-xs sm:text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === "security"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <KeyRound size={16} />
          <span>Password & Security</span>
        </button>
      </div>

      {/* ── TAB 1: SHOP PROFILE & STOREFRONT PHOTOS ── */}
      {activeTab === "shop" && (
        <form onSubmit={handleShopSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-6">
          <div>
            <h2 className="text-lg font-black text-gray-900">Storefront & Contact Details</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              This information will be displayed to customers on your public shop profile.
            </p>
          </div>

          {/* Storefront Image Upload */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider">
              Storefront / Shopfront Image (Store Photo)
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {shopData.shopPhotoUrl ? (
                <div className="relative w-full sm:w-48 h-32 rounded-2xl overflow-hidden border border-gray-300 bg-white group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={shopData.shopPhotoUrl}
                    alt="Storefront Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setShopData((p) => ({ ...p, shopPhotoUrl: "" }))}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-red-600 text-white rounded-full transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <label className="w-full sm:w-48 h-32 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-white flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors p-3 text-center">
                  {uploadingField === "shopPhotoUrl" ? (
                    <Loader2 className="animate-spin text-emerald-600" size={24} />
                  ) : (
                    <>
                      <ImageIcon className="text-gray-400" size={24} />
                      <span className="text-xs font-bold text-gray-600">Upload Shop Photo</span>
                      <span className="text-[10px] text-gray-400">JPG, PNG up to 5MB</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingField !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "shopPhotoUrl");
                    }}
                  />
                </label>
              )}

              <div className="flex-1 text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-800">Why upload your store photo?</p>
                <p>
                  High-resolution photos of your physical store or showroom increase buyer trust by over 40% and qualify your shop for premium seller badge placement.
                </p>
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={shopData.shopPhotoUrl}
                  onChange={(e) => setShopData((p) => ({ ...p, shopPhotoUrl: e.target.value }))}
                  className="w-full mt-2 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono text-gray-700 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Business / Store Name *
              </label>
              <input
                type="text"
                required
                value={shopData.businessName}
                onChange={(e) => setShopData({ ...shopData, businessName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Primary Product Category
              </label>
              <select
                value={shopData.category}
                onChange={(e) => setShopData({ ...shopData, category: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              >
                <option value="General">General / Multi-Category</option>
                <option value="Electricals & Wires">Electricals & Wires</option>
                <option value="Plumbing & Fittings">Plumbing & Fittings</option>
                <option value="Tiles & Natural Stone">Tiles & Natural Stone</option>
                <option value="Hardware & Tools">Hardware & Tools</option>
                <option value="Sanitaryware & Bath">Sanitaryware & Bath</option>
                <option value="Plywood & Laminates">Plywood & Laminates</option>
                <option value="Paints & Waterproofing">Paints & Waterproofing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Email *
              </label>
              <input
                type="email"
                required
                value={shopData.contactEmail}
                onChange={(e) => setShopData({ ...shopData, contactEmail: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Contact Phone / WhatsApp *
              </label>
              <input
                type="tel"
                required
                value={shopData.contactPhone}
                onChange={(e) => setShopData({ ...shopData, contactPhone: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Physical Store / Warehouse Address
              </label>
              <textarea
                rows={2}
                value={shopData.businessAddress}
                onChange={(e) => setShopData({ ...shopData, businessAddress: e.target.value })}
                placeholder="Shop No., Street, Area, City, Pincode"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                About Your Store (Short Bio)
              </label>
              <textarea
                rows={3}
                value={shopData.description}
                onChange={(e) => setShopData({ ...shopData, description: e.target.value })}
                placeholder="Share your store experience, brands you carry, and specialty products..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>Save Shop Details</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB: DELIVERY & SHIPPING SETTINGS ── */}
      {activeTab === "shipping" && (
        <form onSubmit={handleShippingSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-emerald-600" />
                <h2 className="text-lg font-black text-gray-900">Shop Delivery & Freight Policy</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage whether your shop charges freight to buyers and configure custom delivery rates for your inventory.
              </p>
            </div>

            {/* Master Toggle */}
            <label className="inline-flex items-center gap-3 p-2.5 px-4 bg-gray-50 hover:bg-gray-100 rounded-2xl border border-gray-200 cursor-pointer transition-all self-start sm:self-auto">
              <span className="text-xs font-bold text-gray-800">Charge Delivery Fee</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={shippingData.deliveryFeeEnabled}
                  onChange={(e) => setShippingData((p) => ({ ...p, deliveryFeeEnabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </div>
            </label>
          </div>

          {/* Delivery Method Choice (Self vs Platform) */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Fulfillment & Delivery Model *
              </label>
              <p className="text-xs text-gray-500 mt-0.5">
                Choose how your shop fulfills customer orders received on the marketplace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Self-Delivery Card */}
              <div
                onClick={() => setShippingData((p) => ({ ...p, deliveryMethod: "self" }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  shippingData.deliveryMethod === "self"
                    ? "border-emerald-600 bg-emerald-50/40 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    🚚
                  </div>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={shippingData.deliveryMethod === "self"}
                    onChange={() => setShippingData((p) => ({ ...p, deliveryMethod: "self" }))}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-gray-900">Self-Delivery (Vendor Courier)</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    You manage your own logistics, local riders, or 3rd-party couriers. You update dispatch, tracking numbers, and confirm customer delivery yourself.
                  </p>
                  <span className="inline-block mt-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Direct Vendor Control
                  </span>
                </div>
              </div>

              {/* Platform Logistics Card */}
              <div
                onClick={() => setShippingData((p) => ({ ...p, deliveryMethod: "platform" }))}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative ${
                  shippingData.deliveryMethod === "platform"
                    ? "border-blue-600 bg-blue-50/40 shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    🏢
                  </div>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    checked={shippingData.deliveryMethod === "platform"}
                    onChange={() => setShippingData((p) => ({ ...p, deliveryMethod: "platform" }))}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
                <div className="mt-3">
                  <h3 className="text-sm font-bold text-gray-900">Platform Logistics (Centralized)</h3>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    Intrihub centralized logistics picks up goods directly from your warehouse/shop and handles doorstep delivery & COD cash collection.
                  </p>
                  <span className="inline-block mt-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Managed by Intrihub
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Preview Card */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-colors ${
            shippingData.deliveryFeeEnabled
              ? "bg-blue-50/60 border-blue-200/70 text-blue-900"
              : "bg-emerald-50/80 border-emerald-200/80 text-emerald-900"
          }`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              shippingData.deliveryFeeEnabled ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {shippingData.deliveryFeeEnabled ? "🚚" : "🎉"}
            </div>
            <div className="text-xs leading-relaxed">
              {shippingData.deliveryFeeEnabled ? (
                <>
                  <p className="font-bold text-sm">Standard Delivery Charges Enabled</p>
                  <p className="mt-0.5 text-blue-800/80">
                    Buyers ordering from your shop will be charged freight on orders below your free delivery threshold.
                    {shippingData.customDeliveryFee && ` Custom Rate: ₹${Number(shippingData.customDeliveryFee).toLocaleString("en-IN")}.`}
                    {shippingData.freeDeliveryThreshold && ` Free shipping from: ₹${Number(shippingData.freeDeliveryThreshold).toLocaleString("en-IN")}.`}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-sm text-emerald-800">100% Free Shipping Offered by Your Shop</p>
                  <p className="mt-0.5 text-emerald-700">
                    Customers ordering your products will receive <strong>₹0 delivery charge</strong>, boosting conversion rates and highlighting your catalog as Free Shipping eligible.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={!shippingData.deliveryFeeEnabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Custom Flat Delivery Fee (₹)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="e.g. 499 (or leave blank to use platform default ₹999)"
                value={shippingData.customDeliveryFee}
                onChange={(e) => setShippingData((p) => ({ ...p, customDeliveryFee: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Leave empty to automatically adopt the Intrihub standard delivery fee.
              </p>
            </div>

            <div className={!shippingData.deliveryFeeEnabled ? "opacity-50 pointer-events-none" : ""}>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Free Delivery Order Minimum (₹)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                placeholder="e.g. 10000 (or leave blank to use platform default ₹15,000)"
                value={shippingData.freeDeliveryThreshold}
                onChange={(e) => setShippingData((p) => ({ ...p, freeDeliveryThreshold: e.target.value }))}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Orders containing your items exceeding this total will not be charged freight.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex items-start gap-3">
            <Info size={18} className="text-gray-500 shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600 leading-relaxed space-y-1">
              <p className="font-bold text-gray-800">How Delivery Charges Work with Super Admin Rules:</p>
              <p>
                If Super Admin turns delivery charges OFF platform-wide, all orders automatically receive 100% Free Shipping. When platform freight is ON, your shop&apos;s custom rates and threshold will apply to buyer checkouts.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>Save Delivery Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 2: MANDATORY LEGAL KYC DOCUMENTS ── */}
      {activeTab === "kyc" && (
        <form onSubmit={handleKycSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Mandatory KYC & Legal Documents</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                  Required
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload clear scans or photos of your government IDs. Super Admin verifies these before payouts are disbursed.
              </p>
            </div>

            {kycData.kycStatus === "rejected" && kycData.kycNotes && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <strong>Admin Feedback:</strong> {kycData.kycNotes}
              </div>
            )}
          </div>

          {/* 1. PAN Card Upload */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900">1. Permanent Account Number (PAN Card) *</h4>
                <p className="text-xs text-gray-500">Proprietor or Company PAN Card</p>
              </div>
              {kycData.panDocUrl && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Document Uploaded
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  PAN Number (10 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={10}
                  placeholder="e.g. ABCDE1234F"
                  value={kycData.panNumber}
                  onChange={(e) => setKycData({ ...kycData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-gray-800 uppercase focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  PAN Card Document (Photo / PDF) *
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-dashed border-gray-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    {uploadingField === "panDocUrl" ? (
                      <Loader2 className="animate-spin text-emerald-600" size={14} />
                    ) : (
                      <Upload size={14} className="text-emerald-600" />
                    )}
                    <span>{kycData.panDocUrl ? "Replace PAN File" : "Upload PAN Card"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploadingField !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "panDocUrl");
                      }}
                    />
                  </label>

                  {kycData.panDocUrl && (
                    <a
                      href={kycData.panDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 rounded-xl"
                      title="View PAN Document"
                    >
                      <Eye size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Aadhaar Card Upload */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900">2. Aadhaar Card (Front / Back) *</h4>
                <p className="text-xs text-gray-500">Government Issued 12-Digit Identity</p>
              </div>
              {kycData.aadharDocUrl && (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={13} /> Document Uploaded
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Aadhaar Number (12 Digits) *
                </label>
                <input
                  type="text"
                  maxLength={14}
                  placeholder="e.g. 5432 1098 7654"
                  value={kycData.aadharNumber}
                  onChange={(e) => setKycData({ ...kycData, aadharNumber: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-gray-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Aadhaar Document Scan *
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-dashed border-gray-300 hover:border-emerald-500 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    {uploadingField === "aadharDocUrl" ? (
                      <Loader2 className="animate-spin text-emerald-600" size={14} />
                    ) : (
                      <Upload size={14} className="text-emerald-600" />
                    )}
                    <span>{kycData.aadharDocUrl ? "Replace Aadhaar File" : "Upload Aadhaar Card"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploadingField !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "aadharDocUrl");
                      }}
                    />
                  </label>

                  {kycData.aadharDocUrl && (
                    <a
                      href={kycData.aadharDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white border border-gray-200 text-gray-600 hover:text-emerald-600 rounded-xl"
                      title="View Aadhaar Document"
                    >
                      <Eye size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. GST Certificate & Bank Cheque (Optional / Business Verification) */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
            <div>
              <h4 className="text-sm font-black text-gray-900">3. GST Certificate & Cancelled Cheque</h4>
              <p className="text-xs text-gray-500">Required if claiming GST input credit or for current accounts</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  GST Certificate File
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    {uploadingField === "gstDocUrl" ? (
                      <Loader2 className="animate-spin text-emerald-600" size={14} />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{kycData.gstDocUrl ? "Replace GST File" : "Upload GST Certificate"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploadingField !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "gstDocUrl");
                      }}
                    />
                  </label>
                  {kycData.gstDocUrl && (
                    <a
                      href={kycData.gstDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                    >
                      <Eye size={16} />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Cancelled Cheque / Bank Passbook
                </label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 py-2.5 px-4 bg-white hover:bg-gray-50 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    {uploadingField === "chequeDocUrl" ? (
                      <Loader2 className="animate-spin text-emerald-600" size={14} />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span>{kycData.chequeDocUrl ? "Replace Cheque File" : "Upload Cheque Photo"}</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      disabled={uploadingField !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file, "chequeDocUrl");
                      }}
                    />
                  </label>
                  {kycData.chequeDocUrl && (
                    <a
                      href={kycData.chequeDocUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600"
                    >
                      <Eye size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <p className="text-[11px] text-gray-400">
              🔒 All legal documents are encrypted and accessible only to Super Admin auditors.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              <span>Submit KYC for Verification</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 3: BANK ACCOUNT & PAYOUTS ── */}
      {activeTab === "bank" && (
        <form onSubmit={handleBankSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-black text-[#052a51] flex items-center gap-2">
                <Landmark size={20} className="text-emerald-600" />
                Bank Account & Payout Details
              </h2>
              <p className="text-xs text-gray-500">
                Enter the bank account or UPI handle where your sales revenue will be settled.
              </p>
            </div>

            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
              bankData.bankAccountNumber
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {bankData.bankAccountNumber ? "Bank Details Active" : "Bank Details Pending"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Account Holder Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar or Balaji Electricals"
                value={bankData.bankAccountHolder}
                onChange={(e) => setBankData({ ...bankData, bankAccountHolder: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Bank / State Bank of India"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Bank Account Number
              </label>
              <input
                type="text"
                placeholder="e.g. 50100234567890"
                value={bankData.bankAccountNumber}
                onChange={(e) => setBankData({ ...bankData, bankAccountNumber: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC0001234"
                maxLength={11}
                value={bankData.bankIfscCode}
                onChange={(e) => setBankData({ ...bankData, bankIfscCode: e.target.value.toUpperCase() })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-gray-800 uppercase focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                UPI ID / VPA (Optional for instant payout settlement)
              </label>
              <input
                type="text"
                placeholder="e.g. yourshop@okaxis or yourphone@upi"
                value={bankData.bankUpiId}
                onChange={(e) => setBankData({ ...bankData, bankUpiId: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              <span>Save Bank Details</span>
            </button>
          </div>
        </form>
      )}

      {/* ── TAB 4: PASSWORD & SECURITY ── */}
      {activeTab === "security" && (
        <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/90 shadow-2xs space-y-6 max-w-xl">
          <div>
            <h2 className="text-lg font-black text-gray-900">Change Account Password</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Set a strong, unique password to secure your vendor dashboard login.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-[#052a51] hover:bg-[#0a3e74] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              <span>Update Password</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
