"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Truck,
  Phone,
  ShieldCheck,
  Loader2,
  Clock,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  Smartphone,
  DownloadCloud,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import {
  getStoreSettings,
  updateStoreSettings,
  getStoreDeliverySlotsConfig,
  updateStoreDeliverySlotsConfig,
} from "@/lib/actions/settings";
import {
  DEFAULT_APP_VERSION_SETTINGS,
  type AppVersionSettings,
  isValidSemver,
  compareSemver,
} from "@/lib/semver";
import {
  DEFAULT_DELIVERY_SLOTS,
  MASTER_DELIVERY_SLOTS,
  formatSlotLabel,
  type DeliverySlotDefinition,
} from "@/lib/delivery-slots";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("Intrihub");
  const [gstNumber, setGstNumber] = useState("29AABCT1234F1Z8");
  const [contactPhone, setContactPhone] = useState("+91 70901 20211");
  const [whatsappNumber, setWhatsappNumber] = useState("+91 70901 20211");
  const [email, setEmail] = useState("support@intrihub.com");
  const [address, setAddress] = useState("Intrihub Central Supply Hub, Begur, Bangalore, Karnataka - 560114");
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(15000);
  const [standardDeliveryFee, setStandardDeliveryFee] = useState(999);
  const [deliveryFeeEnabled, setDeliveryFeeEnabled] = useState(true);
  const [bikeDeliveryRate, setBikeDeliveryRate] = useState(99);
  const [fourWheelerDeliveryRate, setFourWheelerDeliveryRate] = useState(349);
  const [weightThresholdKg, setWeightThresholdKg] = useState(20);
  const [lowStockThreshold, setLowStockThreshold] = useState(25);
  const [codEnabled, setCodEnabled] = useState(true);
  const [codMaxLimit, setCodMaxLimit] = useState(25000);
  const [codBlockedPincodes, setCodBlockedPincodes] = useState("560099, 560088");

  // Mobile App Governance & Website Install Prompt
  const [appInstallPromptEnabled, setAppInstallPromptEnabled] = useState(true);
  const [versionConfig, setVersionConfig] = useState<AppVersionSettings>(DEFAULT_APP_VERSION_SETTINGS);

  // Delivery Slots Management State (Default Morning Starts at 10:00 AM)
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlotDefinition[]>(DEFAULT_DELIVERY_SLOTS);
  const [savingSlots, setSavingSlots] = useState(false);
  const [customStartHour, setCustomStartHour] = useState(10);
  const [customEndHour, setCustomEndHour] = useState(12);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [s, slotsConfig]: any = await Promise.all([
          getStoreSettings(),
          getStoreDeliverySlotsConfig(),
        ]);
        if (s) {
          setStoreName(s.storeName);
          setGstNumber(s.gstNumber || "29AABCT1234F1Z8");
          setContactPhone(s.contactPhone);
          setWhatsappNumber(s.whatsappNumber);
          setEmail(s.email);
          setAddress(s.address);
          setFreeDeliveryThreshold(s.freeDeliveryThreshold);
          setStandardDeliveryFee(s.standardDeliveryFee);
          setDeliveryFeeEnabled(s.deliveryFeeEnabled !== false);
          setBikeDeliveryRate(s.bikeDeliveryRate ?? 99);
          setFourWheelerDeliveryRate(s.fourWheelerDeliveryRate ?? 349);
          setWeightThresholdKg(s.weightThresholdKg ?? 20);
          setLowStockThreshold(s.lowStockThreshold);
          setCodEnabled(s.codEnabled);
          setCodMaxLimit(s.codMaxLimit);
          setCodBlockedPincodes((s.codBlockedPincodes || []).join(", "));
          setAppInstallPromptEnabled(s.appInstallPromptEnabled !== false);
          if (s.appVersionConfig) {
            setVersionConfig({
              customer: {
                android: { ...DEFAULT_APP_VERSION_SETTINGS.customer.android, ...(s.appVersionConfig.customer?.android || {}) },
                ios: { ...DEFAULT_APP_VERSION_SETTINGS.customer.ios, ...(s.appVersionConfig.customer?.ios || {}) },
              },
              business: {
                android: { ...DEFAULT_APP_VERSION_SETTINGS.business.android, ...(s.appVersionConfig.business?.android || {}) },
                ios: { ...DEFAULT_APP_VERSION_SETTINGS.business.ios, ...(s.appVersionConfig.business?.ios || {}) },
              },
            });
          }
        }
        if (slotsConfig?.activeSlots && slotsConfig.activeSlots.length > 0) {
          setDeliverySlots(slotsConfig.activeSlots);
        }
      } catch (err) {
        console.error("Error loading store settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleSlot = (preset: DeliverySlotDefinition) => {
    setDeliverySlots((prev) => {
      const exists = prev.some((s) => s.id === preset.id);
      if (exists) {
        if (prev.length <= 1) {
          toast.error("At least one delivery slot must remain active.");
          return prev;
        }
        return prev.filter((s) => s.id !== preset.id);
      } else {
        return [...prev, preset].sort((a, b) => a.startHour - b.startHour);
      }
    });
  };

  const handleAddCustomSlot = () => {
    if (customStartHour >= customEndHour) {
      toast.error("End hour must be later than start hour.");
      return;
    }
    const id = `${customStartHour < 10 ? "0" + customStartHour : customStartHour}-${customEndHour < 10 ? "0" + customEndHour : customEndHour}`;
    const exists = deliverySlots.some((s) => s.id === id);
    if (exists) {
      toast.error("This slot is already added.");
      return;
    }
    const newSlot: DeliverySlotDefinition = {
      id,
      startHour: customStartHour,
      endHour: customEndHour,
      label: formatSlotLabel(customStartHour, customEndHour),
    };
    setDeliverySlots((prev) => [...prev, newSlot].sort((a, b) => a.startHour - b.startHour));
    toast.success(`Added slot: ${newSlot.label}`);
  };

  const handleRemoveSlot = (id: string) => {
    if (deliverySlots.length <= 1) {
      toast.error("At least one delivery slot must remain active.");
      return;
    }
    setDeliverySlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetSlotsToDefault = () => {
    setDeliverySlots(DEFAULT_DELIVERY_SLOTS);
    toast.info("Reset to standard slots (Starting at 10:00 AM). Click Save Slots to apply.");
  };

  const handleSaveSlots = async () => {
    setSavingSlots(true);
    try {
      const res = await updateStoreDeliverySlotsConfig(deliverySlots);
      if (res.success) {
        toast.success("Delivery time slots saved successfully! Storefront and mobile app updated.");
      } else {
        toast.error(res.error || "Failed to update slots");
      }
    } catch {
      toast.error("Failed to update slots");
    } finally {
      setSavingSlots(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate version policies across Customer and Vendor apps
    const appsToValidate: Array<{ name: string; config: any }> = [
      { name: "Customer App (Android)", config: versionConfig.customer.android },
      { name: "Customer App (iOS)", config: versionConfig.customer.ios },
      { name: "Vendor App (Android)", config: versionConfig.business.android },
      { name: "Vendor App (iOS)", config: versionConfig.business.ios },
    ];

    for (const item of appsToValidate) {
      if (!isValidSemver(item.config.latestVersion)) {
        toast.error(`Invalid Latest Version "${item.config.latestVersion}" for ${item.name}. Format must be X.Y or X.Y.Z (e.g. 1.2.5).`);
        return;
      }
      if (!isValidSemver(item.config.minSupportedVersion)) {
        toast.error(`Invalid Min Supported Version "${item.config.minSupportedVersion}" for ${item.name}. Format must be X.Y or X.Y.Z (e.g. 1.2.0).`);
        return;
      }
      if (compareSemver(item.config.minSupportedVersion, item.config.latestVersion) > 0) {
        toast.error(`Min Supported Version (${item.config.minSupportedVersion}) cannot exceed Latest Version (${item.config.latestVersion}) for ${item.name}.`);
        return;
      }
      if (!item.config.storeUrl || !/^https?:\/\//i.test(item.config.storeUrl.trim())) {
        toast.error(`Invalid Store URL for ${item.name}. Must start with http:// or https://`);
        return;
      }
    }

    setSaving(true);
    const blockedPincodesArray = codBlockedPincodes
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const res = await updateStoreSettings({
      storeName,
      gstNumber,
      contactPhone,
      whatsappNumber,
      email,
      address,
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
      standardDeliveryFee: Number(standardDeliveryFee),
      deliveryFeeEnabled,
      bikeDeliveryRate: Number(bikeDeliveryRate),
      fourWheelerDeliveryRate: Number(fourWheelerDeliveryRate),
      weightThresholdKg: Number(weightThresholdKg),
      lowStockThreshold: Number(lowStockThreshold),
      codEnabled,
      codMaxLimit: Number(codMaxLimit),
      codBlockedPincodes: blockedPincodesArray,
      appInstallPromptEnabled,
      appVersionConfig: versionConfig,
    });
    setSaving(false);

    if (res.success) {
      toast.success("Store settings, version policies & install prompt updated successfully!");
    } else {
      toast.error(res.error || "Failed to update settings");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#F26522]" size={32} />
          <p className="text-sm font-bold text-[#052a51]">Loading store settings from Neon DB...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Store Settings & Config</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure contact details, delivery charges, and system thresholds in PostgreSQL
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ── Section 1: Store Contact & Identity ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Phone size={18} className="text-[#F26522]" />
            <h3 className="text-base font-black text-[#052a51]">Store Identity & Contact</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Brand / Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Support Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Primary Phone Number
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                WhatsApp Business Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Platform GST Number (GSTIN)
              </label>
              <input
                type="text"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value)}
                placeholder="Enter 15-character GSTIN"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] uppercase tracking-wider focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-[10px] text-gray-400 mt-1">Printed on official customer bills & tax invoices.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Warehouse / Office Address
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#F26522]"
              />
            </div>
          </div>

          {/* Executive & Department Support Desks */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-black text-[#052a51] uppercase tracking-wider">
              Executive Leadership & Direct Department Desks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Sahil Sheikh */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                  Founder, CEO & CTO
                </span>
                <p className="font-black text-[#052a51] text-sm">Sahil Sheikh</p>
                <p className="text-[11px] text-amber-800 font-bold">Tech & Platform Architecture</p>
                <p className="text-[11px] text-gray-600">Email: sahil@intrihub.com</p>
                <p className="text-[11px] text-gray-600">Phone: +91 70901 20211</p>
              </div>

              {/* Gulshan */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-[#052a51] text-white text-[9px] font-black uppercase tracking-wider">
                  Chief Operating Officer
                </span>
                <p className="font-black text-[#052a51] text-sm">Gulshan</p>
                <p className="text-[11px] text-blue-800 font-bold">Operations & Logistics</p>
                <p className="text-[11px] text-gray-600">Email: gulshan@intrihub.com</p>
                <p className="text-[11px] text-gray-600">Phone: +91 70901 20211</p>
              </div>

              {/* Vishal Poddar */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider">
                  Chief Product Officer
                </span>
                <p className="font-black text-[#052a51] text-sm">Vishal Poddar</p>
                <p className="text-[11px] text-purple-800 font-bold">Product & Merchandising</p>
                <p className="text-[11px] text-gray-600">Email: vishal@intrihub.com</p>
                <p className="text-[11px] text-gray-600">Phone: +91 70901 20211</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Delivery & Shipping Rules ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-[#F26522]" />
              <div>
                <h3 className="text-base font-black text-[#052a51]">Shipping & Delivery Charges Management</h3>
                <p className="text-xs text-gray-400">Control platform-wide freight fee collection and free shipping limits</p>
              </div>
            </div>

            {/* Master Toggle Switch */}
            <label className="inline-flex items-center gap-3 p-2 px-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200/80 cursor-pointer transition-all">
              <span className="text-xs font-bold text-[#052a51]">Charge Delivery Fee</span>
              <div className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  checked={deliveryFeeEnabled}
                  onChange={(e) => setDeliveryFeeEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F26522]"></div>
              </div>
            </label>
          </div>

          {/* Status Preview Card */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
            deliveryFeeEnabled
              ? "bg-blue-50/60 border-blue-200/70 text-blue-900"
              : "bg-emerald-50/80 border-emerald-200/80 text-emerald-900"
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs ${
              deliveryFeeEnabled ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {deliveryFeeEnabled ? "₹" : "FREE"}
            </div>
            <div className="text-xs leading-relaxed">
              {deliveryFeeEnabled ? (
                <>
                  <p className="font-bold text-sm">Delivery Charges are ACTIVE</p>
                  <p className="mt-0.5 text-blue-800/80">
                    Customers pay a standard fee of <strong>₹{Number(standardDeliveryFee).toLocaleString("en-IN")}</strong> on orders below <strong>₹{Number(freeDeliveryThreshold).toLocaleString("en-IN")}</strong>. Orders at or above this threshold qualify for Free Shipping.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-sm text-emerald-800">100% Free Delivery Active Platform-Wide</p>
                  <p className="mt-0.5 text-emerald-700">
                    Delivery charge collection is turned <strong>OFF</strong>. All customers will receive ₹0 delivery fee across all categories, irrespective of order total.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-1">
            <div className={!deliveryFeeEnabled ? "opacity-50 pointer-events-none" : ""}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block">
                  Standard Delivery Fee (₹)
                </label>
              </div>
              <input
                type="number"
                value={standardDeliveryFee}
                disabled={!deliveryFeeEnabled}
                onChange={(e) => setStandardDeliveryFee(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={0}
                step="any"
              />
              <div className="flex items-center gap-1.5 mt-2">
                {[499, 999, 1499].map((fee) => (
                  <button
                    key={fee}
                    type="button"
                    disabled={!deliveryFeeEnabled}
                    onClick={() => setStandardDeliveryFee(fee)}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ₹{fee}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Flat freight charge applied under threshold.</p>
            </div>

            <div className={!deliveryFeeEnabled ? "opacity-50 pointer-events-none" : ""}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block">
                  Free Delivery Threshold (₹)
                </label>
              </div>
              <input
                type="number"
                value={freeDeliveryThreshold}
                disabled={!deliveryFeeEnabled}
                onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={0}
                step="any"
              />
              <div className="flex items-center gap-1.5 mt-2">
                {[5000, 10000, 15000, 25000].map((th) => (
                  <button
                    key={th}
                    type="button"
                    disabled={!deliveryFeeEnabled}
                    onClick={() => setFreeDeliveryThreshold(th)}
                    className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-[10px] font-bold text-gray-700 transition-colors disabled:opacity-50"
                  >
                    ₹{(th / 1000)}k
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Cart totals reaching this amount get free shipping.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Low Stock Threshold (Units)
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={1}
              />
              <p className="text-[10px] text-gray-400 mt-2">Triggers low-inventory warning alerts on admin dashboard.</p>
            </div>
          </div>

          {/* ── Vehicle-Based Delivery Rates (Part C PRD) ── */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#052a51] uppercase tracking-wider">
                Vehicle-Based Weight Delivery Slabs (Bike vs 4-Wheeler / Truck)
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                Auto-Selected at Checkout
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  🛵 Bike Delivery Rate (₹)
                </label>
                <input
                  type="number"
                  value={bikeDeliveryRate}
                  onChange={(e) => setBikeDeliveryRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  min={0}
                  step="any"
                />
                <p className="text-[10px] text-gray-400 mt-1">For light orders under weight threshold.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  🚚 4-Wheeler / Truck Rate (₹)
                </label>
                <input
                  type="number"
                  value={fourWheelerDeliveryRate}
                  onChange={(e) => setFourWheelerDeliveryRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  min={0}
                  step="any"
                />
                <p className="text-[10px] text-gray-400 mt-1">For heavy orders exceeding weight threshold.</p>
              </div>

              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  ⚖️ Weight Cutoff Threshold (kg)
                </label>
                <input
                  type="number"
                  value={weightThresholdKg}
                  onChange={(e) => setWeightThresholdKg(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  min={1}
                  step="0.5"
                />
                <p className="text-[10px] text-gray-400 mt-1">Orders above this weight switch to 4-Wheeler.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2.5: Delivery Time Slots & Scheduling ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-[#F26522]" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#052a51]">Store Delivery Time Slots Configuration</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Morning Starts 10:00 AM
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure 2-hour delivery windows available for scheduled checkout on Web and Mobile Apps.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetSlotsToDefault}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Reset to 10:00 AM - 10:00 PM standard slots"
              >
                <RotateCcw size={13} />
                <span>Reset to Default</span>
              </button>

              <button
                type="button"
                disabled={savingSlots}
                onClick={handleSaveSlots}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#052a51] hover:bg-[#041f3d] text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {savingSlots ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                <span>Save Slots</span>
              </button>
            </div>
          </div>

          {/* Master 2-Hour Presets (Checkboxes) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
                Preset 2-Hour Slots (Click to Toggle Active on Storefront & App)
              </h4>
              <span className="text-[11px] font-semibold text-gray-500">
                {deliverySlots.length} active slot{deliverySlots.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {MASTER_DELIVERY_SLOTS.map((slot) => {
                const isActive = deliverySlots.some((s) => s.id === slot.id);
                const isEarlyMorning = slot.id === "08-10";

                return (
                  <div
                    key={slot.id}
                    onClick={() => toggleSlot(slot)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-2 select-none ${
                      isActive
                        ? "border-[#052a51] bg-[#052a51]/5 text-[#052a51]"
                        : "border-gray-200 bg-gray-50/60 text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`text-xs font-black ${isActive ? "text-[#052a51]" : "text-gray-500"}`}>
                        {slot.label}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {isEarlyMorning ? "Early morning (optional)" : "Standard daytime window"}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-all ${
                        isActive
                          ? "bg-[#052a51] border-[#052a51] text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isActive && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Slot Addition */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
            <h4 className="text-xs font-bold text-[#052a51] uppercase tracking-wider">
              Add Custom Delivery Window
            </h4>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  Start Hour (24-hr IST)
                </label>
                <select
                  value={customStartHour}
                  onChange={(e) => {
                    const start = Number(e.target.value);
                    setCustomStartHour(start);
                    if (start >= customEndHour) setCustomEndHour(Math.min(24, start + 2));
                  }}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={i}>
                      {i < 10 ? `0${i}` : i}:00 ({i === 0 ? "12 AM" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">
                  End Hour (24-hr IST)
                </label>
                <select
                  value={customEndHour}
                  onChange={(e) => setCustomEndHour(Number(e.target.value))}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none"
                >
                  {Array.from({ length: 25 }).map((_, i) => {
                    if (i <= customStartHour) return null;
                    return (
                      <option key={i} value={i}>
                        {i < 10 ? `0${i}` : i}:00 ({i === 24 ? "12 AM (Next Day)" : i < 12 ? `${i} AM` : i === 12 ? "12 PM" : `${i - 12} PM`})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex-1 min-w-[140px]">
                <p className="text-[11px] text-gray-500 mb-1 font-semibold">Slot Label Preview</p>
                <p className="text-xs font-black text-[#052a51] px-3 py-2 bg-white border border-gray-200 rounded-xl">
                  {formatSlotLabel(customStartHour, customEndHour)}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddCustomSlot}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Slot</span>
              </button>
            </div>
          </div>

          {/* Active Slots Summary */}
          <div className="pt-2">
            <p className="text-[11px] font-bold text-gray-500 mb-1.5">
              Current Active Delivery Slots Shown to Customers:
            </p>
            <div className="flex flex-wrap gap-2">
              {deliverySlots.map((slot) => (
                <span
                  key={slot.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-gray-200 text-xs font-bold text-[#052a51] shadow-2xs"
                >
                  <span>{slot.label}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.id)}
                    className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                    title="Remove slot"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Section 3: Cash on Delivery (COD) Rules & Guardrails ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#F26522]" />
              <h3 className="text-base font-black text-[#052a51]">Cash on Delivery (COD) Guardrails</h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-gray-600">Enable COD</span>
              <input
                type="checkbox"
                checked={codEnabled}
                onChange={(e) => setCodEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Maximum Order Value for COD (₹)
              </label>
              <input
                type="number"
                value={codMaxLimit}
                onChange={(e) => setCodMaxLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={1000}
                step="any"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Orders above ₹{Number(codMaxLimit).toLocaleString("en-IN")} will require online payment.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Restricted COD Pincodes (Comma-separated)
              </label>
              <input
                type="text"
                value={codBlockedPincodes}
                onChange={(e) => setCodBlockedPincodes(e.target.value)}
                placeholder="Enter serviceable pincodes separated by comma"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Pincodes where delivery partners do not support cash collection.
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 4: Website Smart App Install Prompt ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <DownloadCloud size={18} className="text-[#F26522]" />
              <div>
                <h3 className="text-base font-black text-[#052a51]">Smart App Install Prompt (Website Android)</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Controls the bottom floating prompt on mobile Android browsers. Opens app via intent link or Google Play.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-gray-600">Enable Prompt</span>
              <input
                type="checkbox"
                checked={appInstallPromptEnabled}
                onChange={(e) => setAppInstallPromptEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#F26522] rounded cursor-pointer"
              />
            </label>
          </div>
          <p className="text-[11px] text-gray-500">
            When enabled, mobile Android visitors without the app or PWA will see the prompt after a short delay or on second page view. Hides for 7 days when dismissed.
          </p>
        </div>

        {/* ── Section 5: Mobile App Version Policies (Customer & Vendor Apps) ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-6">
          <div className="pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-[#F26522]" />
              <div>
                <h3 className="text-base font-black text-[#052a51]">Mobile App Version Governance</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage live versions and enforce force update barriers on Google Play Store & Apple App Store.
                </p>
              </div>
            </div>
          </div>

          {/* Customer App Settings */}
          <div className="space-y-4 border border-blue-100 bg-blue-50/30 p-4.5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h4 className="text-sm font-black text-[#052a51]">Customer App (IntriHub)</h4>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                  com.intrihub.app
                </span>
              </div>
            </div>

            {/* Android Customer */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200/70">
              <h5 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖 Android (Google Play)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Latest Version (SemVer, e.g. 1.2.5)
                  </label>
                  <input
                    type="text"
                    value={versionConfig.customer.android.latestVersion}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          android: { ...prev.customer.android, latestVersion: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="1.2.5"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Triggers soft update popup if user version &lt; latest.</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Min Supported Version (Force Update Wall)
                  </label>
                  <input
                    type="text"
                    value={versionConfig.customer.android.minSupportedVersion}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          android: { ...prev.customer.android, minSupportedVersion: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="1.2.0"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Blocks app if user version &lt; min supported.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Play Store URL</label>
                  <input
                    type="text"
                    value={versionConfig.customer.android.storeUrl}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          android: { ...prev.customer.android, storeUrl: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Update Message</label>
                  <input
                    type="text"
                    value={versionConfig.customer.android.message || ""}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          android: { ...prev.customer.android, message: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="A fresh update of IntriHub is here..."
                  />
                </div>
              </div>
            </div>

            {/* iOS Customer */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200/70">
              <h5 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>🍎 iOS (Apple App Store)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Latest Version</label>
                  <input
                    type="text"
                    value={versionConfig.customer.ios.latestVersion}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          ios: { ...prev.customer.ios, latestVersion: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="1.2.5"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Min Supported Version</label>
                  <input
                    type="text"
                    value={versionConfig.customer.ios.minSupportedVersion}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          ios: { ...prev.customer.ios, minSupportedVersion: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="1.2.0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">App Store URL</label>
                  <input
                    type="text"
                    value={versionConfig.customer.ios.storeUrl}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          ios: { ...prev.customer.ios, storeUrl: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Update Message</label>
                  <input
                    type="text"
                    value={versionConfig.customer.ios.message || ""}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        customer: {
                          ...prev.customer,
                          ios: { ...prev.customer.ios, message: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vendor App Settings */}
          <div className="space-y-4 border border-amber-100 bg-amber-50/30 p-4.5 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <h4 className="text-sm font-black text-[#052a51]">Vendor App (Intrihub Business)</h4>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                  com.intrihub.business
                </span>
              </div>
            </div>

            {/* Android Vendor */}
            <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200/70">
              <h5 className="text-xs font-black text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖 Android (Google Play)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Latest Version</label>
                  <input
                    type="text"
                    value={versionConfig.business.android.latestVersion}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        business: {
                          ...prev.business,
                          android: { ...prev.business.android, latestVersion: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="1.0.13"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Min Supported Version</label>
                  <input
                    type="text"
                    value={versionConfig.business.android.minSupportedVersion}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        business: {
                          ...prev.business,
                          android: { ...prev.business.android, minSupportedVersion: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="1.0.10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Play Store URL</label>
                  <input
                    type="text"
                    value={versionConfig.business.android.storeUrl}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        business: {
                          ...prev.business,
                          android: { ...prev.business.android, storeUrl: e.target.value.trim() },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Update Message</label>
                  <input
                    type="text"
                    value={versionConfig.business.android.message || ""}
                    onChange={(e) =>
                      setVersionConfig((prev) => ({
                        ...prev,
                        business: {
                          ...prev.business,
                          android: { ...prev.business.android, message: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    placeholder="Update Intrihub Business for instant order chimes..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            <span>{saving ? "Saving to DB..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
