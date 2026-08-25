"use client";

import React, { useState } from "react";
import {
  MapPin,
  Plus,
  CheckCircle2,
  Home,
  Briefcase,
  Building,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { type CustomerAddress, useAuthStore } from "@/lib/auth-store";
import LocationPicker from "@/components/location/LocationPicker";
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
  const { user, deleteAddress, setDefaultAddress } = useAuthStore();
  const userAddresses = user?.addresses || [];
  const [isAddingNew, setIsAddingNew] = useState(userAddresses.length === 0);

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

  const getLabelIcon = (label: string) => {
    switch (label) {
      case "Home":
        return <Home size={14} className="text-[#052a51]" />;
      case "Work":
        return <Briefcase size={14} className="text-[#052a51]" />;
      default:
        return <Building size={14} className="text-[#052a51]" />;
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

      {/* Add New Address Form (LocationPicker) */}
      {isAddingNew && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-[#052a51] flex items-center gap-2">
              <Plus size={18} className="text-[#F26522]" />
              Add New Delivery Address
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

          <LocationPicker
            onAddressSelected={(newAddr) => {
              onSelectAddress(newAddr);
              setIsAddingNew(false);
              onProceedToDelivery();
            }}
            onCancel={userAddresses.length > 0 ? () => setIsAddingNew(false) : undefined}
          />
        </div>
      )}
    </div>
  );
}
