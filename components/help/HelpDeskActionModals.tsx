"use client";

import React, { useState } from "react";
import {
  X,
  RotateCcw,
  RefreshCw,
  CreditCard,
  MessageSquarePlus,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign,
  Package,
} from "lucide-react";

// =========================================================================
// 1. RAISE RETURN MODAL
// =========================================================================
export function RaiseReturnModal({
  order,
  onClose,
  onSuccess,
}: {
  order: any;
  onClose: () => void;
  onSuccess: (returnReq: any) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: boolean }>({});
  const [itemQuantities, setItemQuantities] = useState<{ [itemId: string]: number }>({});
  const [reason, setReason] = useState("damaged");
  const [customReason, setCustomReason] = useState("");
  const [notes, setNotes] = useState("");
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [newPhotoInput, setNewPhotoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (itemId: string, defaultQty: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      if (next[itemId] && !itemQuantities[itemId]) {
        setItemQuantities((q) => ({ ...q, [itemId]: defaultQty }));
      }
      return next;
    });
  };

  const handleAddPhoto = () => {
    if (newPhotoInput.trim()) {
      setPhotoUrls((prev) => [...prev, newPhotoInput.trim()]);
      setNewPhotoInput("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setPhotoUrls((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const itemsToReturn = (order.items || [])
      .filter((it: any) => selectedItems[it.id])
      .map((it: any) => ({
        orderItemId: it.id,
        productName: it.productName,
        boxQuantity: itemQuantities[it.id] || it.boxQuantity,
        pricePerBox: it.pricePerBox,
        totalPrice: (itemQuantities[it.id] || it.boxQuantity) * it.pricePerBox,
      }));

    if (itemsToReturn.length === 0) {
      setError("Please select at least one item to return.");
      return;
    }

    try {
      setLoading(true);
      const finalReason = reason === "other" && customReason.trim() ? customReason.trim() : reason;
      const res = await fetch("/api/help/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          type: "return",
          items: itemsToReturn,
          reason: finalReason,
          photos: photoUrls,
          photoUrls: photoUrls,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.returnRequest);
        onClose();
      } else {
        setError(data.error || "Failed to raise return request");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#052A51] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#F26522] flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Raise Return Request</h3>
              <p className="text-[11px] text-white/70">Order #{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Items */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Select Item(s) for Return
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(order.items || []).map((item: any) => {
                const isChecked = !!selectedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id, item.boxQuantity)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? "bg-orange-50/60 border-[#F26522] shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-[#F26522] focus:ring-[#F26522] cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-500">
                          {item.variantDetails || "Standard"} • ₹{item.pricePerBox}/box
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-slate-800">₹{item.totalPrice}</span>
                      <p className="text-[10px] text-slate-500">Qty: {item.boxQuantity} boxes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason for Return */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              2. Reason for Return
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#052A51]"
            >
              <option value="damaged">Damaged in Transit / Broken Tiles</option>
              <option value="wrong_item">Wrong Item / Variant Delivered</option>
              <option value="quality_issue">Quality / Manufacturing Defect</option>
              <option value="not_needed">Customer Surplus / Not Needed</option>
              <option value="defective">Color / Shade Mismatch</option>
              <option value="other">Other Reason</option>
            </select>
            {reason === "other" && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify reason..."
                className="mt-2 w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#052A51]"
              />
            )}
          </div>

          {/* Photos / Proof Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              3. Proof / Damage Photos (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newPhotoInput}
                onChange={(e) => setNewPhotoInput(e.target.value)}
                placeholder="Paste Image URL or upload below..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddPhoto}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
              >
                Add URL
              </button>
            </div>
            <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-slate-300 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600">Upload Photo from Device</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {photoUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {photoUrls.map((url, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="Proof" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrls((p) => p.filter((_, i) => i !== idx))}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Internal Staff Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              4. Staff / Customer Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer called reporting 3 broken boxes upon delivery unboxing..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#052A51]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{loading ? "Submitting..." : "Generate Return Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// 2. RAISE EXCHANGE MODAL
// =========================================================================
export function RaiseExchangeModal({
  order,
  onClose,
  onSuccess,
}: {
  order: any;
  onClose: () => void;
  onSuccess: (returnReq: any) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: boolean }>({});
  const [reason, setReason] = useState("Color / Shade Mismatch");
  const [exchangeVariant, setExchangeVariant] = useState("");
  const [exchangeNotes, setExchangeNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = (itemId: string) => {
    setSelectedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const itemsToExchange = (order.items || [])
      .filter((it: any) => selectedItems[it.id])
      .map((it: any) => ({
        orderItemId: it.id,
        productName: it.productName,
        boxQuantity: it.boxQuantity,
        pricePerBox: it.pricePerBox,
        totalPrice: it.totalPrice,
      }));

    if (itemsToExchange.length === 0) {
      setError("Please select at least one item to exchange.");
      return;
    }

    if (!exchangeVariant.trim()) {
      setError("Please specify the requested replacement item or variant details.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/help/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          userId: order.userId,
          type: "exchange",
          items: itemsToExchange,
          reason,
          exchangeVariant: exchangeVariant.trim(),
          exchangeNotes: exchangeNotes.trim(),
          notes: `Exchange for: ${exchangeVariant.trim()}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.returnRequest);
        onClose();
      } else {
        setError(data.error || "Failed to raise exchange request");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#052A51] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Raise Exchange Request</h3>
              <p className="text-[11px] text-white/70">Order #{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Items */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2">
              1. Select Item(s) to be Exchanged
            </label>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {(order.items || []).map((item: any) => {
                const isChecked = !!selectedItems[item.id];
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isChecked
                        ? "bg-blue-50/60 border-blue-500 shadow-2xs"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-500">
                          Current: {item.variantDetails || "Standard"} • Qty: {item.boxQuantity}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-800">₹{item.totalPrice}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reason for Exchange */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              2. Exchange Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#052A51]"
            >
              <option value="Color / Shade Mismatch">Color / Shade Mismatch</option>
              <option value="Size / Dimension Change">Size / Dimension Change</option>
              <option value="Finish Preference (Glossy vs Matte)">Finish Preference (Glossy vs Matte)</option>
              <option value="Damaged - Need Exact Replacement">Damaged - Need Exact Replacement</option>
              <option value="Other Variant">Other Variant</option>
            </select>
          </div>

          {/* Replacement Item / Variant Details */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              3. Desired Replacement Product / Variant Details
            </label>
            <input
              type="text"
              value={exchangeVariant}
              onChange={(e) => setExchangeVariant(e.target.value)}
              placeholder="e.g. Royal Statuario 600x1200 Glossy (White base) - 5 boxes"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#052A51]"
              required
            />
          </div>

          {/* Dispatch Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              4. Warehouse / Dispatch Instructions
            </label>
            <textarea
              value={exchangeNotes}
              onChange={(e) => setExchangeNotes(e.target.value)}
              placeholder="e.g. Pickup existing boxes from site first, then deliver replacement batch from Bangalore depot."
              rows={2}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#052A51]"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{loading ? "Submitting..." : "Generate Exchange Ticket"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// 3. PROCESS REFUND MODAL
// =========================================================================
export function ProcessRefundModal({
  order,
  returnRequest,
  onClose,
  onSuccess,
}: {
  order: any;
  returnRequest?: any;
  onClose: () => void;
  onSuccess: (updated: any) => void;
}) {
  const defaultAmount = returnRequest?.refundAmount || order?.total || 0;
  const [refundAmount, setRefundAmount] = useState<number | string>(defaultAmount);
  const [refundMethod, setRefundMethod] = useState("original_payment");
  const [refundNotes, setRefundNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amountNum = parseFloat(String(refundAmount));
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid refund amount greater than ₹0.");
      return;
    }

    try {
      setLoading(true);
      // If there's an active return request, update it; otherwise create/log
      let returnId = returnRequest?.id;

      if (!returnId) {
        // Create return record first if processing direct refund on order
        const createRes = await fetch("/api/help/returns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            userId: order.userId,
            reason: "Direct Support Refund",
            type: "return",
            notes: `Direct refund processed for ₹${amountNum}`,
          }),
        });
        const createData = await createRes.json();
        returnId = createData.returnRequest?.id;
      }

      if (!returnId) {
        throw new Error("Unable to create return reference for refund.");
      }

      const res = await fetch("/api/help/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: returnId,
          status: "Refunded",
          refundAmount: amountNum,
          refundMethod,
          refundNotes: refundNotes.trim() || `Processed via ${refundMethod} by support staff`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.returnRequest);
        onClose();
      } else {
        setError(data.error || "Failed to process refund");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-800 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Process Customer Refund</h3>
              <p className="text-[11px] text-white/70">Order #{order.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Order Summary banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-500 text-[10px]">Customer</p>
              <p className="font-bold text-slate-800">{order.customerName || "Customer"}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[10px]">Order Value</p>
              <p className="font-black text-slate-900">₹{order.total?.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Refund Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                max={order.total || 9999999}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>
            <div className="flex gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setRefundAmount(order.total)}
                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                100% Full Refund (₹{order.total})
              </button>
              <span className="text-[10px] text-slate-300">•</span>
              <button
                type="button"
                onClick={() => setRefundAmount(Math.round((order.total || 0) * 0.5))}
                className="text-[10px] font-bold text-slate-600 hover:underline cursor-pointer"
              >
                50% Partial (₹{Math.round((order.total || 0) * 0.5)})
              </button>
            </div>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Refund Method
            </label>
            <select
              value={refundMethod}
              onChange={(e) => setRefundMethod(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-600"
            >
              <option value="original_payment">Original Payment Method (Razorpay / UPI / Card)</option>
              <option value="wallet_credit">Intrihub Store / Wallet Credit</option>
              <option value="bank_transfer">Direct IMPS / NEFT Bank Transfer</option>
              <option value="cash">Cash / Delivery Partner Collection Adjustment</option>
            </select>
          </div>

          {/* Refund Notes / Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Internal Transaction Notes / Reference ID
            </label>
            <input
              type="text"
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder="e.g. Razorpay refund RRN_948192 / customer bank verified"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? "Processing..." : `Approve & Record ₹${refundAmount} Refund`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// 4. ADD COMPLAINT / INTERNAL NOTE MODAL
// =========================================================================
export function AddComplaintModal({
  order,
  customer,
  onClose,
  onSuccess,
}: {
  order?: any;
  customer?: any;
  onClose: () => void;
  onSuccess: (complaint: any) => void;
}) {
  const [note, setNote] = useState("");
  const [category, setCategory] = useState("Delivery");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Please enter the complaint or note details.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/help/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order?.id || null,
          customerPhone: order?.customerPhone || customer?.phone || null,
          customerName: order?.customerName || customer?.name || null,
          userId: order?.userId || customer?.id || null,
          note: note.trim(),
          category,
          priority,
          status,
          createdBy: "Support Desk Agent",
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.complaint);
        onClose();
      } else {
        setError(data.error || "Failed to log complaint");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#052A51] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-[#F26522] flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Log Complaint / Support Note</h3>
              <p className="text-[11px] text-white/70">
                {order ? `Order #${order.id.slice(-8).toUpperCase()}` : customer?.name || "Customer Ticket"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#052A51]"
              >
                <option value="Delivery">Delivery / Delay</option>
                <option value="Product Quality">Product Quality / Damage</option>
                <option value="Payment">Payment / Invoice</option>
                <option value="Return">Return / Exchange</option>
                <option value="General">General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#052A51]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Red Alert)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">Status</label>
            <div className="flex gap-2">
              {["Open", "In Progress", "Resolved"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    status === st
                      ? "bg-[#052A51] text-white border-[#052A51]"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Complaint / Support Description
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Record exact customer issue, site context, or action required by team..."
              rows={4}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-[#052A51]"
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#052A51] hover:bg-[#031c38] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{loading ? "Saving..." : "Save Note / Ticket"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
