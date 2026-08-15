"use client";

import { useState } from "react";
import {
  Tag,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Percent,
  IndianRupee,
  X,
  Sparkles,
} from "lucide-react";
import { useAdminStore, type AdminCoupon } from "@/lib/admin-store";
import { toast } from "sonner";

export default function AdminCouponsPage() {
  const coupons = useAdminStore((s) => s.coupons);
  const addCoupon = useAdminStore((s) => s.addCoupon);
  const updateCoupon = useAdminStore((s) => s.updateCoupon);
  const deleteCoupon = useAdminStore((s) => s.deleteCoupon);
  const toggleCoupon = useAdminStore((s) => s.toggleCoupon);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<AdminCoupon | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState(10);
  const [minOrderValue, setMinOrderValue] = useState(10000);
  const [maxDiscountCap, setMaxDiscountCap] = useState(2500);
  const [usageLimit, setUsageLimit] = useState(100);
  const [validTill, setValidTill] = useState("2026-12-31");

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("percentage");
    setValue(10);
    setMinOrderValue(10000);
    setMaxDiscountCap(2500);
    setUsageLimit(100);
    setValidTill("2026-12-31");
    setModalOpen(true);
  };

  const handleOpenEdit = (cp: AdminCoupon) => {
    setEditingCoupon(cp);
    setCode(cp.code);
    setDiscountType(cp.discountType);
    setValue(cp.value);
    setMinOrderValue(cp.minOrderValue);
    setMaxDiscountCap(cp.maxDiscountCap || 0);
    setUsageLimit(cp.usageLimit || 100);
    setValidTill(cp.validTill);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    if (editingCoupon) {
      updateCoupon(editingCoupon.id, {
        code: code.trim().toUpperCase(),
        discountType,
        value: Number(value),
        minOrderValue: Number(minOrderValue),
        maxDiscountCap: discountType === "percentage" ? Number(maxDiscountCap) : undefined,
        usageLimit: Number(usageLimit),
        validTill,
      });
      toast.success(`Coupon ${code.toUpperCase()} updated!`);
    } else {
      const newCoupon: AdminCoupon = {
        id: `cp-${Date.now().toString().slice(-4)}`,
        code: code.trim().toUpperCase(),
        discountType,
        value: Number(value),
        minOrderValue: Number(minOrderValue),
        maxDiscountCap: discountType === "percentage" ? Number(maxDiscountCap) : undefined,
        usageLimit: Number(usageLimit),
        usedCount: 0,
        validFrom: new Date().toISOString().split("T")[0],
        validTill,
        isActive: true,
      };
      addCoupon(newCoupon);
      toast.success(`Coupon ${code.toUpperCase()} created!`);
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string, cpCode: string) => {
    if (window.confirm(`Delete coupon ${cpCode}?`)) {
      deleteCoupon(id);
      toast.success("Coupon removed");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-[#052a51]">Discount Coupons & Offers</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure promotional discount codes for customer checkout
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm w-fit"
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>Create New Coupon</span>
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {coupons.map((cp) => (
          <div
            key={cp.id}
            className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between space-y-4 transition-all ${
              cp.isActive ? "border-gray-200/80 hover:shadow-md" : "border-gray-200 opacity-60 bg-gray-50/50"
            }`}
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="font-mono text-base font-black px-3 py-1 bg-[#052a51] text-white rounded-xl tracking-wider shadow-xs">
                  {cp.code}
                </span>

                <button
                  onClick={() => toggleCoupon(cp.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold cursor-pointer ${
                    cp.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {cp.isActive ? "ACTIVE" : "PAUSED"}
                </button>
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-xl font-black text-[#F26522]">
                  {cp.discountType === "percentage" ? `${cp.value}% OFF` : `₹${cp.value} FLAT OFF`}
                </p>
                <p className="text-xs text-gray-500 font-medium">
                  Min order: <strong>₹{cp.minOrderValue.toLocaleString("en-IN")}</strong>
                  {cp.maxDiscountCap ? ` (Max cap: ₹${cp.maxDiscountCap})` : ""}
                </p>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs space-y-1 text-gray-500">
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span className="font-bold text-[#052a51]">
                    {cp.usedCount} / {cp.usageLimit || "∞"} used
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Valid Till:</span>
                  <span className="font-bold text-[#052a51]">{cp.validTill}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleOpenEdit(cp)}
                className="text-xs font-bold text-[#052a51] hover:text-[#F26522] flex items-center gap-1"
              >
                <Edit size={13} />
                <span>Edit</span>
              </button>

              <button
                onClick={() => handleDelete(cp.id, cp.code)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                title="Delete coupon"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
              <h3 className="font-black text-[#052a51] text-lg">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TILETRA15"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-black text-[#052a51] uppercase focus:outline-none focus:border-[#F26522]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Discount Type
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    required
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Min Order Value (₹)
                  </label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    min={0}
                  />
                </div>

                {discountType === "percentage" && (
                  <div>
                    <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      value={maxDiscountCap}
                      onChange={(e) => setMaxDiscountCap(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                      min={100}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Usage Limit (Max Uses)
                  </label>
                  <input
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                    min={1}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#052a51] uppercase tracking-wider block mb-1.5">
                    Valid Till Date
                  </label>
                  <input
                    type="date"
                    value={validTill}
                    onChange={(e) => setValidTill(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:outline-none focus:border-[#F26522]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-md"
                >
                  {editingCoupon ? "Save Changes" : "Publish Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
