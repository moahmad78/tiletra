"use client";

import React, { useState } from "react";
import {
  MapPin,
  Plus,
  CheckCircle2,
  Home,
  Briefcase,
  Building,
  HardHat,
  Trash2,
  ArrowRight,
  User,
  Phone,
  Check,
} from "lucide-react";
import { type CustomerAddress, useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

interface AddressStepProps {
  selectedAddress: CustomerAddress | null;
  onSelectAddress: (address: CustomerAddress) => void;
  onProceedToDelivery: () => void;
}

export default function AddressStep({
  selectedAddress,
  onSelectAddress,
  onProceedToDelivery,
}: AddressStepProps) {
  const { user, addAddress, deleteAddress, setDefaultAddress, updateUserPhone } = useAuthStore();
  const userAddresses = user?.addresses || [];
  const [isAddingNew, setIsAddingNew] = useState(userAddresses.length === 0);

  // Manual Form State
  const [label, setLabel] = useState<"Home" | "Work" | "Site" | "Other">("Home");
  const [name, setName] = useState(user?.name && !user.name.startsWith("User ") ? user.name : "");
  const [phone, setPhone] = useState(
    user?.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_")
      ? user.phone.replace(/\D/g, "").slice(-10)
      : ""
  );
  const [houseNumber, setHouseNumber] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [isDefault, setIsDefault] = useState(userAddresses.length === 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSetDefault = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDefaultAddress(id);
    toast.success("Default delivery address updated");
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteAddress(id);
    toast.success("Address removed");
  };

  const getLabelIcon = (labelStr: string) => {
    switch (labelStr) {
      case "Home":
        return <Home size={14} className="text-[#052a51]" />;
      case "Work":
        return <Briefcase size={14} className="text-[#052a51]" />;
      case "Site":
        return <HardHat size={14} className="text-[#052a51]" />;
      default:
        return <Building size={14} className="text-[#052a51]" />;
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const cleanPincode = pincode.replace(/\D/g, "").slice(0, 6);
    const cleanLine1 = line1.trim();

    if (!cleanName) {
      toast.error("Please enter recipient name");
      return;
    }
    if (cleanPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (cleanPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }
    if (!cleanLine1) {
      toast.error("Please enter street address / building name");
      return;
    }
    if (!city.trim()) {
      toast.error("Please enter city");
      return;
    }
    if (!state.trim()) {
      toast.error("Please enter state");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullLine1 = houseNumber.trim()
        ? `${houseNumber.trim()}, ${cleanLine1}`
        : cleanLine1;

      const newAddress = addAddress({
        name: cleanName,
        phone: cleanPhone,
        pincode: cleanPincode,
        line1: fullLine1,
        line2: line2.trim() || undefined,
        houseNumber: houseNumber.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        landmark: landmark.trim() || undefined,
        label,
        deliveryInstructions: deliveryInstructions.trim() || undefined,
        source: "MANUAL",
        isDefault: isDefault || userAddresses.length === 0,
      });

      // Sync phone to user profile if user has placeholder phone
      if (cleanPhone.length === 10) {
        updateUserPhone(cleanPhone).catch(() => {});
      }

      toast.success("Delivery address saved!");
      onSelectAddress(newAddress);
      setIsAddingNew(false);
      onProceedToDelivery();
    } catch (err) {
      console.error("Save address error:", err);
      toast.error("Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Saved Addresses Section */}
      {!isAddingNew && userAddresses.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#052a51] flex items-center gap-2">
              <MapPin size={18} className="text-[#F26522]" />
              Select Delivery Address
            </h3>
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              Add New Address
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {userAddresses.map((addr: CustomerAddress) => {
              const isSelected = selectedAddress?.id === addr.id;
              return (
                <div
                  key={addr.id}
                  onClick={() => onSelectAddress(addr)}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "border-[#052a51] bg-[#052a51]/5 shadow-xs"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-md bg-gray-100">{getLabelIcon(addr.label)}</span>
                        <span className="text-xs font-bold uppercase text-gray-700">{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] font-black uppercase text-[#2F7A4F] bg-green-50 px-1.5 py-0.5 rounded border border-green-200">
                            Default
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <CheckCircle2 size={18} className="text-[#052a51]" fill="#052a51" color="#fff" />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#052a51]">{addr.name}</p>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">
                        {addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                        {addr.landmark ? `, Near ${addr.landmark}` : ""}
                      </p>
                      <p className="text-xs font-bold text-gray-700 mt-0.5">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                      <p className="text-xs font-semibold text-gray-500 mt-1">Phone: +91 {addr.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={(e) => handleSetDefault(e, addr.id)}
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-800"
                      >
                        Set as Default
                      </button>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, addr.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="Delete Address"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedAddress && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onProceedToDelivery}
                className="w-full sm:w-auto px-7 py-3 bg-[#052a51] hover:bg-[#041f3d] text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <span>Deliver to this Address</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Address Entry Form */}
      {isAddingNew && (
        <div className="space-y-4 bg-white p-5 sm:p-6 rounded-3xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-base font-black text-[#052a51] flex items-center gap-2">
              <Plus size={18} className="text-[#F26522]" />
              Enter Delivery Address
            </h3>
            {userAddresses.length > 0 && (
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 underline cursor-pointer"
              >
                Cancel & Use Saved Address
              </button>
            )}
          </div>

          <form onSubmit={handleSaveAddress} className="space-y-4">
            {/* Address Type Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Address Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: "Home", icon: Home },
                  { key: "Work", icon: Briefcase },
                  { key: "Site", icon: HardHat },
                  { key: "Other", icon: Building },
                ].map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLabel(key as any)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      label === key
                        ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{key}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recipient Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Recipient Full Name *
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sahil Sheikh"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  10-Digit Mobile Number *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full h-11 pl-12 pr-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Flat / Building / Street */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  House / Flat / Shop No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402 / Shop 12"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Building / Apartment / Street Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kumari Elite, 24th Main Road"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Area & Landmark */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Area / Locality / Sector
                </label>
                <input
                  type="text"
                  placeholder="e.g. HSR Layout, Sector 2"
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Nearby Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Opp. BDA Complex / Near Shell Pump"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* City, State, Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Karnataka"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  6-Digit PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="e.g. 560102"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full h-11 px-3.5 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Delivery Instructions */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Delivery Instructions (For Driver / Unloading)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Call before entering gate, heavy tiles unloading site, use lift"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-300 focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none text-xs font-medium text-gray-900 bg-white resize-none"
              />
            </div>

            {/* Set as Default Checkbox */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#F26522] focus:ring-[#F26522]"
              />
              <span className="text-xs font-medium text-gray-700">
                Make this my default delivery address
              </span>
            </label>

            {/* Submit & Cancel */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              {userAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>Save & Deliver to this Address</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
