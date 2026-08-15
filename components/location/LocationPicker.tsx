"use client";

import { useState } from "react";
import {
  MapPin,
  Navigation,
  Check,
  Building,
  Home,
  Briefcase,
  Layers,
  RotateCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { type CustomerAddress, useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

interface LocationPickerProps {
  onAddressSelected: (address: CustomerAddress) => void;
  onCancel?: () => void;
}

export default function LocationPicker({ onAddressSelected, onCancel }: LocationPickerProps) {
  const { addAddress, user } = useAuthStore();

  const [detectingGps, setDetectingGps] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>({
    lat: 12.9352,
    lng: 77.6245, // Default Bangalore coordinates
  });

  // Form Fields
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [pincode, setPincode] = useState("560034");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [landmark, setLandmark] = useState("");
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");

  // GPS Auto-detect handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });

        try {
          // Reverse geocoding via public OpenStreetMap API with graceful fallback
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            if (addr.postcode) setPincode(addr.postcode);
            if (addr.city || addr.town || addr.county) setCity(addr.city || addr.town || addr.county || "Bangalore");
            if (addr.state) setState(addr.state || "Karnataka");

            const road = addr.road || addr.suburb || addr.neighbourhood || "";
            if (road && !line1) {
              setLine1(road);
            }
            if (addr.suburb && !line2) {
              setLine2(addr.suburb);
            }
          }
        } catch {
          // Graceful fallback to default Bangalore details
          setCity("Bangalore");
          setState("Karnataka");
        }

        setDetectingGps(false);
        toast.success("Location detected successfully!");
      },
      (err) => {
        setDetectingGps(false);
        toast.error("Location permission denied. Please enter address manually.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter recipient name");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!pincode.trim() || pincode.length !== 6) {
      toast.error("Please enter a valid 6-digit postal pincode");
      return;
    }
    if (!line1.trim()) {
      toast.error("Please enter House/Flat No. and Street address");
      return;
    }

    const newAddr = addAddress({
      name: name.trim(),
      phone: phone.replace(/\D/g, ""),
      pincode: pincode.trim(),
      line1: line1.trim(),
      line2: line2.trim(),
      city: city.trim() || "Bangalore",
      state: state.trim() || "Karnataka",
      landmark: landmark.trim(),
      label,
      latitude: coords?.lat,
      longitude: coords?.lng,
      isDefault: true,
    });

    toast.success("Address saved!");
    onAddressSelected(newAddr);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-xs p-6 md:p-8">
      {/* Header & Quick GPS Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 mb-6">
        <div>
          <h3 className="text-xl font-black text-[#052a51]">Add Delivery Address</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-detect your location with GPS or type your full address
          </p>
        </div>

        {/* Use My Current Location GPS Button */}
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detectingGps}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F26522]/10 hover:bg-[#F26522]/20 text-[#F26522] text-xs font-bold transition-all border border-[#F26522]/30 active:scale-95 shrink-0"
        >
          {detectingGps ? (
            <RotateCw size={15} className="animate-spin" />
          ) : (
            <Navigation size={15} className="fill-[#F26522]" />
          )}
          <span>{detectingGps ? "Detecting GPS..." : "Use Current Location"}</span>
        </button>
      </div>

      {/* Interactive Map Pin Preview Strip */}
      {coords && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 relative">
          <div className="h-36 w-full bg-gradient-to-br from-blue-50 to-slate-100 relative flex items-center justify-center overflow-hidden">
            {/* Stylized Grid Lines */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#052a51_1px,transparent_1px),linear-gradient(to_bottom,#052a51_1px,transparent_1px)] bg-[size:24px_24px]" />

            {/* Central Animated Map Marker Pin */}
            <div className="relative z-10 flex flex-col items-center animate-bounce">
              <div className="w-10 h-10 rounded-full bg-[#F26522] text-white flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin size={22} className="fill-white" />
              </div>
              <div className="w-3 h-1.5 bg-black/30 rounded-full blur-[1px] mt-0.5" />
            </div>

            {/* Coordinates Badge */}
            <div className="absolute bottom-2 left-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-gray-200 text-[10px] font-bold text-[#052a51] flex items-center gap-1.5 shadow-2xs">
              <Sparkles size={12} className="text-[#F26522]" />
              <span>GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} ({city}, {pincode})</span>
            </div>
          </div>
        </div>
      )}

      {/* Address Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Address Type Chips */}
        <div>
          <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-2">
            Address Type
          </label>
          <div className="flex gap-2.5">
            {[
              { id: "Home", icon: Home },
              { id: "Work", icon: Briefcase },
              { id: "Other", icon: Building },
            ].map(({ id, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setLabel(id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                  label === id
                    ? "bg-[#052a51] text-white border-[#052a51] shadow-2xs"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Icon size={14} />
                <span>{id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 1: Name & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mohammad Ahmad"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
              10-Digit Mobile *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 9876543210"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        {/* Row 2: Flat / House No / Street */}
        <div>
          <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
            Flat, House No., Building, Apartment *
          </label>
          <input
            type="text"
            required
            value={line1}
            onChange={(e) => setLine1(e.target.value)}
            placeholder="e.g. Flat 402, Prestige Tower, 3rd Cross"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
        </div>

        {/* Row 3: Area / Sector / Street */}
        <div>
          <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
            Area, Street, Sector, Village
          </label>
          <input
            type="text"
            value={line2}
            onChange={(e) => setLine2(e.target.value)}
            placeholder="e.g. Koramangala 4th Block"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
          />
        </div>

        {/* Row 4: Landmark & Pincode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
              Landmark (Optional)
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near Sony World Signal"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
              Postal Pincode *
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 560034"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        {/* Row 5: City & State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
              City / Town
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#052a51] uppercase tracking-wider mb-1.5">
              State
            </label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#052a51] focus:bg-white focus:outline-none focus:border-[#F26522]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#F26522] hover:bg-[#d95a1e] text-white text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Check size={16} />
            <span>Save & Deliver Here</span>
          </button>
        </div>
      </form>
    </div>
  );
}
