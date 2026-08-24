"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Truck,
  Phone,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { getStoreSettings, updateStoreSettings } from "@/lib/actions/settings";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [storeName, setStoreName] = useState("Intrihub");
  const [gstNumber, setGstNumber] = useState("29AABCT1234F1Z8");
  const [contactPhone, setContactPhone] = useState("+91 78709 35277");
  const [whatsappNumber, setWhatsappNumber] = useState("+91 78709 35277");
  const [email, setEmail] = useState("info@intrihub.com");
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

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const s: any = await getStoreSettings();
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
        }
      } catch (err) {
        console.error("Error loading store settings:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
    });
    setSaving(false);

    if (res.success) {
      toast.success("Store settings, GST & delivery charges updated successfully!");
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
                placeholder="e.g. 29AABCT1234F1Z8"
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
                <p className="text-[11px] text-gray-600">Phone: +91 92649 20211</p>
              </div>

              {/* Gulshan */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-[#052a51] text-white text-[9px] font-black uppercase tracking-wider">
                  Chief Operating Officer
                </span>
                <p className="font-black text-[#052a51] text-sm">Gulshan</p>
                <p className="text-[11px] text-blue-800 font-bold">Operations & Logistics</p>
                <p className="text-[11px] text-gray-600">Email: gulshan@intrihub.com</p>
                <p className="text-[11px] text-gray-600">Phone: +91 91980 35803</p>
              </div>

              {/* Vishal Poddar */}
              <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl text-xs space-y-1">
                <span className="px-1.5 py-0.5 rounded bg-purple-700 text-white text-[9px] font-black uppercase tracking-wider">
                  Chief Product Officer
                </span>
                <p className="font-black text-[#052a51] text-sm">Vishal Poddar</p>
                <p className="text-[11px] text-purple-800 font-bold">Product & Merchandising</p>
                <p className="text-[11px] text-gray-600">Email: vishal@intrihub.com</p>
                <p className="text-[11px] text-gray-600">Phone: +91 78709 35277</p>
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
                placeholder="e.g. 560099, 560088"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#052a51] focus:outline-none focus:border-[#F26522]"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Pincodes where delivery partners do not support cash collection.
              </p>
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
