"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  RotateCcw,
  Truck,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const settings = useAdminStore((s) => s.settings);
  const updateSettings = useAdminStore((s) => s.updateSettings);
  const resetToDefaults = useAdminStore((s) => s.resetToDefaults);

  const [storeName, setStoreName] = useState(settings.storeName);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [email, setEmail] = useState(settings.email);
  const [address, setAddress] = useState(settings.address);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(settings.freeDeliveryThreshold);
  const [standardDeliveryFee, setStandardDeliveryFee] = useState(settings.standardDeliveryFee);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold);
  const [codEnabled, setCodEnabled] = useState(settings.codEnabled ?? true);
  const [codMaxLimit, setCodMaxLimit] = useState(settings.codMaxLimit ?? 25000);
  const [codBlockedPincodes, setCodBlockedPincodes] = useState(
    (settings.codBlockedPincodes || []).join(", ")
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const blockedPincodesArray = codBlockedPincodes
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    updateSettings({
      storeName,
      contactPhone,
      whatsappNumber,
      email,
      address,
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
      standardDeliveryFee: Number(standardDeliveryFee),
      lowStockThreshold: Number(lowStockThreshold),
      codEnabled,
      codMaxLimit: Number(codMaxLimit),
      codBlockedPincodes: blockedPincodesArray,
    });
    toast.success("Store settings updated successfully!");
  };

  const handleResetData = () => {
    if (
      window.confirm(
        "Are you sure you want to reset demo products, orders, and content to original seed data?"
      )
    ) {
      resetToDefaults();
      toast.success("Store data restored to defaults!");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Store Settings & Config</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure contact details, delivery charges, and system thresholds
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 text-xs font-bold rounded-xl transition-colors shadow-2xs w-fit"
        >
          <RotateCcw size={13} />
          <span>Reset Sample Seed Data</span>
        </button>
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

        {/* ── Section 2: Delivery & Shipping Rules ── */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <Truck size={18} className="text-[#F26522]" />
            <h3 className="text-base font-black text-[#052a51]">Shipping & Delivery Rules</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Free Delivery Threshold (₹)
              </label>
              <input
                type="number"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={0}
              />
              <p className="text-[10px] text-gray-400 mt-1">Orders above this qualify for ₹0 shipping.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Standard Shipping Fee (₹)
              </label>
              <input
                type="number"
                value={standardDeliveryFee}
                onChange={(e) => setStandardDeliveryFee(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={0}
              />
              <p className="text-[10px] text-gray-400 mt-1">Flat freight charge if below threshold.</p>
            </div>

            <div>
              <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                Low Stock Threshold (Boxes)
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                min={1}
              />
              <p className="text-[10px] text-gray-400 mt-1">Triggers warning alert on dashboard.</p>
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
                step={1000}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Orders above ₹{Number(codMaxLimit).toLocaleString("en-IN")} will require online payment to protect against bulk freight refusals.
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Save size={16} />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
