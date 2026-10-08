"use client";

import React, { useState, useRef, useEffect } from "react";
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
  Sparkles,
  Loader2,
  Navigation,
  Search,
  X,
  Clock,
  Calendar,
  Zap,
} from "lucide-react";
import { type CustomerAddress, useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";
import WebMapPickerModal, { WebPickedLocation } from "@/components/maps/WebMapPickerModal";
import { getAvailableDeliverySchedule, type DeliveryDayOption } from "@/lib/delivery-slots";

interface AddressStepProps {
  selectedAddress: CustomerAddress | null;
  onSelectAddress: (address: CustomerAddress) => void;
  onProceedToDelivery: () => void;
  scheduledDelivery?: {
    isScheduled: boolean;
    scheduledFor: string | null;
    slotId: string | null;
    deliverySlot: string | null;
  };
  onScheduleChange?: (schedule: {
    isScheduled: boolean;
    scheduledFor: string | null;
    slotId: string | null;
    deliverySlot: string | null;
  }) => void;
}

export default function AddressStep({
  selectedAddress,
  onSelectAddress,
  onProceedToDelivery,
  scheduledDelivery,
  onScheduleChange,
}: AddressStepProps) {
  const { user, addAddress, deleteAddress, setDefaultAddress, updateUserPhone } = useAuthStore();
  const userAddresses = user?.addresses || [];
  const [isAddingNew, setIsAddingNew] = useState(userAddresses.length === 0);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedNotice, setDetectedNotice] = useState<string | null>(null);
  const [showWebMapModal, setShowWebMapModal] = useState(false);

  // Delivery Time Scheduling State
  const [scheduleDays, setScheduleDays] = useState<DeliveryDayOption[]>(() => getAvailableDeliverySchedule());

  useEffect(() => {
    let isMounted = true;
    fetch("/api/delivery-slots")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.slots) && data.slots.length > 0) {
          setScheduleDays(getAvailableDeliverySchedule(undefined, data.slots));
        }
      })
      .catch((err) => console.error("Error fetching delivery slots:", err));
    return () => {
      isMounted = false;
    };
  }, []);
  const [deliveryMode, setDeliveryMode] = useState<"asap" | "schedule">(() =>
    scheduledDelivery?.isScheduled ? "schedule" : "asap"
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(() => scheduledDelivery?.slotId || null);

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
  const [coordLat, setCoordLat] = useState<number | null>(null);
  const [coordLng, setCoordLng] = useState<number | null>(null);
  const [coordAcc, setCoordAcc] = useState<number | null>(null);
  const [coordSource, setCoordSource] = useState<string>("MANUAL");

  // ── Blinkit-Style Address Autocomplete Search ──
  const [addressSearch, setAddressSearch] = useState("");
  const [addressPredictions, setAddressPredictions] = useState<
    Array<{ placeId: string; description: string; mainText: string; secondaryText: string }>
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddressSearchChange = (text: string) => {
    setAddressSearch(text);
    if (!text.trim() || text.length < 2) {
      setAddressPredictions([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchingAddress(true);
        const res = await fetch(`/api/geo/autocomplete?input=${encodeURIComponent(text)}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.predictions)) {
          setAddressPredictions(data.predictions);
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 250);
  };

  const handleSelectSearchedAddress = async (prediction: { placeId: string; mainText: string; description: string }) => {
    setAddressPredictions([]);
    setAddressSearch(prediction.mainText);
    try {
      setIsSearchingAddress(true);
      const res = await fetch(`/api/geo/place-details?placeId=${encodeURIComponent(prediction.placeId)}`);
      const data = await res.json();
      if (data.success && data.location) {
        const loc = data.location;
        if (loc.houseNumber) setHouseNumber(loc.houseNumber);
        if (loc.street) setLine1(loc.street);
        else if (loc.formattedAddress) setLine1(loc.formattedAddress.split(",")[0] || "");
        if (loc.area) setLine2(loc.area);
        if (loc.city) setCity(loc.city);
        if (loc.state) setState(loc.state);
        if (loc.pincode) setPincode(loc.pincode);
        if (loc.landmark) setLandmark(loc.landmark);
        if (loc.lat && loc.lng) {
          setCoordLat(Number(loc.lat));
          setCoordLng(Number(loc.lng));
          setCoordSource("SEARCH");
        }
        setDetectedNotice(`Selected: ${loc.formattedAddress}`);
        setIsAddingNew(true);
        toast.success("Address details auto-filled from search!");
      }
    } catch (err) {
      console.error("Place details error:", err);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // ── INSTANT ZERO-WAIT ADDRESS DETECTION (FAST BROWSER GPS + GOOGLE MAPS) ──
  const handleDetectLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    setDetectedNotice(null);

    const applyCoords = async (latitude: number, longitude: number, accuracy?: number) => {
      try {
        setCoordLat(latitude);
        setCoordLng(longitude);
        if (accuracy !== undefined) setCoordAcc(accuracy);
        setCoordSource("GPS");

        const res = await fetch(`/api/geo/reverse-geocode?lat=${latitude}&lng=${longitude}`);
        const data = await res.json();

        if (data.success && data.address) {
          const addr = data.address;
          if (addr.houseNumber) setHouseNumber(addr.houseNumber);
          if (addr.street) setLine1(addr.street);
          else if (addr.formattedAddress) setLine1(addr.formattedAddress.split(",")[0] || "");
          if (addr.area) setLine2(addr.area);
          if (addr.city) setCity(addr.city);
          if (addr.state) setState(addr.state);
          if (addr.pincode) setPincode(addr.pincode);
          if (addr.landmark) setLandmark(addr.landmark);

          setDetectedNotice("GPS address auto-detected! Verify and add flat/floor details if needed.");
          setIsAddingNew(true);
          toast.success("Current address detected via Google Maps!");
          try {
            sessionStorage.setItem("last_coords", JSON.stringify({ lat: latitude, lng: longitude }));
          } catch {}
          return true;
        } else {
          toast.error("Could not fetch address details for this location.");
        }
      } catch (err) {
        console.error("Detect location error:", err);
        toast.error("Failed to detect location. Please enter manually.");
      } finally {
        setIsDetectingLocation(false);
      }
      return false;
    };

    // Stage 1: Ultra-fast coarse / cached position (<300ms)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => {
        // Stage 2: Fallback to high accuracy if coarse fails
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          },
          (err) => {
            console.warn("Geolocation fallback notice:", err);
            setIsDetectingLocation(false);
            if (err.code === err.PERMISSION_DENIED) {
              toast.error("Location permission denied. Please allow location access in your browser.");
            } else {
              toast.error("Could not fetch GPS coordinates. Please select on map.");
            }
          },
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 300000 }
    );
  };

  const handleMapLocationConfirmed = (loc: WebPickedLocation) => {
    if (loc.label && ["Home", "Work", "Site", "Other"].includes(loc.label)) {
      setLabel(loc.label as any);
    }
    if (loc.houseNumber) setHouseNumber(loc.houseNumber);
    if (loc.street) setLine1(loc.street);
    else if (loc.formattedAddress) setLine1(loc.formattedAddress.split(",")[0] || "");
    if (loc.area) setLine2(loc.area);
    if (loc.city) setCity(loc.city);
    if (loc.state) setState(loc.state);
    if (loc.pincode) setPincode(loc.pincode);
    if (loc.landmark) setLandmark(loc.landmark);
    if (loc.latitude && loc.longitude) {
      setCoordLat(loc.latitude);
      setCoordLng(loc.longitude);
      setCoordSource("MAP_PIN");
    }
    setDetectedNotice(`Location pinned: ${loc.formattedAddress}`);
    setIsAddingNew(true);
    toast.success("Delivery point selected from map!");
  };

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
        latitude: coordLat !== null ? coordLat : undefined,
        longitude: coordLng !== null ? coordLng : undefined,
        accuracy: coordAcc !== null ? coordAcc : undefined,
        source: coordSource || "MANUAL",
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
              onClick={() => {
                setDetectedNotice(null);
                setIsAddingNew(true);
              }}
              className="text-xs font-bold text-[#F26522] hover:text-[#d95a1e] flex items-center gap-1 cursor-pointer"
            >
              <Plus size={14} />
              Add New Address
            </button>
          </div>

          {/* Location Actions: 1-Click GPS or Interactive Draggable Map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
              className="p-3.5 sm:p-4 rounded-2xl bg-[#052a51] hover:bg-[#041f3d] text-white flex items-center justify-between shadow-xs transition-all cursor-pointer group active:scale-[0.99] border border-[#052a51]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <MapPin size={18} className="text-[#F26522]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black">Use Current Location</span>
                    <span className="text-[9px] font-black uppercase bg-[#F26522] text-white px-1.5 py-0.5 rounded-full">
                      1-Click
                    </span>
                  </div>
                  <p className="text-[11px] text-white/75 mt-0.5">
                    {isDetectingLocation ? "Detecting GPS..." : "Auto-detect via device GPS"}
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setShowWebMapModal(true)}
              className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-gray-50 text-[#052a51] flex items-center justify-between shadow-xs transition-all cursor-pointer group active:scale-[0.99] border-2 border-gray-200 hover:border-[#052a51]/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#052a51]/5 flex items-center justify-center text-[#052a51] shrink-0">
                  <Sparkles size={18} className="text-[#052a51]" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-black text-[#052a51]">Choose on Map</span>
                    <span className="text-[9px] font-black uppercase bg-blue-100 text-[#052a51] px-1.5 py-0.5 rounded-full border border-blue-200 font-bold">
                      Drag Pin
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Pin exact gate / delivery site
                  </p>
                </div>
              </div>
              <ArrowRight size={16} className="text-gray-400 group-hover:text-[#052a51] group-hover:translate-x-1 transition-all shrink-0" />
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

          {/* ── Optional Delivery Time Section Directly Below Location Selector ── */}
          <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-gray-50/90 border border-gray-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#052a51] text-white flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-[#052a51]">Delivery Time</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Get immediate dispatch or schedule for a specific 2-hour window
                  </p>
                </div>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("asap");
                    setSelectedSlotId(null);
                    onScheduleChange?.({
                      isScheduled: false,
                      scheduledFor: null,
                      slotId: null,
                      deliverySlot: null,
                    });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    deliveryMode === "asap"
                      ? "bg-[#052a51] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Zap size={13} className={deliveryMode === "asap" ? "text-amber-400" : "text-gray-400"} />
                  <span>Deliver ASAP</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDeliveryMode("schedule");
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    deliveryMode === "schedule"
                      ? "bg-[#052a51] text-white shadow-xs"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Calendar size={13} className={deliveryMode === "schedule" ? "text-white" : "text-gray-400"} />
                  <span>Schedule for later</span>
                </button>
              </div>
            </div>

            {deliveryMode === "asap" ? (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Standard immediate dispatch: Materials are processed and dispatched within 60–90 minutes.
                </span>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {/* 7-Day Day Chips */}
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Select Delivery Day (Next 7 Days)
                  </p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {scheduleDays.map((day, idx) => {
                      const isSelected = selectedDayIndex === idx;
                      return (
                        <button
                          key={day.dateString}
                          type="button"
                          onClick={() => {
                            setSelectedDayIndex(idx);
                            const slotObj = day.slots.find((s) => s.slot.id === selectedSlotId);
                            if (!slotObj || !slotObj.available) {
                              setSelectedSlotId(null);
                              onScheduleChange?.({
                                isScheduled: true,
                                scheduledFor: null,
                                slotId: null,
                                deliverySlot: null,
                              });
                            } else {
                              onScheduleChange?.({
                                isScheduled: true,
                                scheduledFor: slotObj.scheduledForUtcIso,
                                slotId: slotObj.slot.id,
                                deliverySlot: slotObj.formattedFullSlot,
                              });
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-left border transition-all cursor-pointer shrink-0 ${
                            isSelected
                              ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <p className={`text-[11px] font-black leading-tight ${isSelected ? "text-amber-400" : "text-gray-900"}`}>
                            {day.dayLabel}
                          </p>
                          <p className={`text-[10px] font-semibold leading-tight mt-0.5 ${isSelected ? "text-white/80" : "text-gray-500"}`}>
                            {day.dateLabel}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-Hour Slot Pills */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Select 2-Hour Window (IST)
                    </p>
                    <span className="text-[10px] text-gray-400 font-medium">
                      Min 2h advance lead time
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {scheduleDays[selectedDayIndex]?.slots.map((s) => {
                      const isSelected = selectedSlotId === s.slot.id;
                      const isAvailable = s.available;

                      return (
                        <button
                          key={s.slot.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => {
                            if (!isAvailable) return;
                            setSelectedSlotId(s.slot.id);
                            onScheduleChange?.({
                              isScheduled: true,
                              scheduledFor: s.scheduledForUtcIso,
                              slotId: s.slot.id,
                              deliverySlot: s.formattedFullSlot,
                            });
                          }}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            !isAvailable
                              ? "bg-gray-100/70 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed line-through"
                              : isSelected
                              ? "bg-purple-700 text-white border-purple-700 shadow-xs font-bold"
                              : "bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-pointer font-medium"
                          }`}
                          title={!isAvailable ? "Slot unavailable (requires at least 2h lead time)" : s.slot.label}
                        >
                          <p className="text-xs font-bold leading-tight">{s.slot.label}</p>
                          <p className={`text-[10px] mt-0.5 leading-tight ${isSelected ? "text-purple-200" : isAvailable ? "text-gray-500" : "text-gray-400"}`}>
                            {!isAvailable ? "Unavailable" : isSelected ? "Selected" : "2h Slot"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Confirmation Banner */}
                {selectedSlotId && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between text-xs text-purple-900">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-md">
                        Scheduled
                      </span>
                      <span className="font-bold">
                        {scheduleDays[selectedDayIndex]?.slots.find((s) => s.slot.id === selectedSlotId)?.formattedFullSlot}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSlotId(null);
                        onScheduleChange?.({
                          isScheduled: true,
                          scheduledFor: null,
                          slotId: null,
                          deliverySlot: null,
                        });
                      }}
                      className="text-[11px] font-bold text-purple-700 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedAddress && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  if (deliveryMode === "schedule" && !selectedSlotId) {
                    toast.error("Please pick an available 2-hour delivery slot or switch to Deliver ASAP");
                    return;
                  }
                  onProceedToDelivery();
                }}
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

          {/* 1-Click GPS & Drag on Map Bar inside Form */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#052a51]/5 to-[#F26522]/5 border border-[#052a51]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#052a51] text-white flex items-center justify-center shrink-0">
                {isDetectingLocation ? (
                  <Loader2 size={16} className="animate-spin text-white" />
                ) : (
                  <MapPin size={16} className="text-[#F26522]" />
                )}
              </div>
              <div>
                <p className="text-xs font-black text-[#052a51]">Auto-Fill from Location / Map</p>
                <p className="text-[11px] text-gray-500">Detect GPS or drag pin on Google Map</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="px-3 py-1.5 bg-[#052a51] hover:bg-[#041f3d] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs active:scale-95"
              >
                <Sparkles size={12} className="text-amber-300" />
                <span>{isDetectingLocation ? "Detecting..." : "Auto GPS"}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowWebMapModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#052a51] border border-gray-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <MapPin size={12} className="text-[#F26522]" />
                <span>Drag on Map</span>
              </button>
            </div>
          </div>

          {detectedNotice && (
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs font-semibold text-green-800 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" />
              <span>{detectedNotice}</span>
            </div>
          )}

          <form onSubmit={handleSaveAddress} className="space-y-4">
            {/* Blinkit-Style Quick Address Autocomplete Search */}
            <div className="relative">
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                <Search size={13} className="text-[#F26522]" />
                <span>Search Area, Society, Apartment (Blinkit Auto-Fill)</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  value={addressSearch}
                  onChange={(e) => handleAddressSearchChange(e.target.value)}
                  placeholder="Search apartment, society, landmark (e.g. Indiranagar, HSR Layout)..."
                  className="w-full h-11 pl-10 pr-9 bg-white border border-gray-300 rounded-xl text-xs font-medium text-[#052a51] placeholder:text-gray-400 focus:outline-none focus:border-[#F26522] focus:ring-2 focus:ring-[#F26522]/15 shadow-xs"
                />
                {isSearchingAddress ? (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-[#F26522]" size={14} />
                  </div>
                ) : addressSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAddressSearch("");
                      setAddressPredictions([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>

              {/* Dropdown Predictions */}
              {addressPredictions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
                  {addressPredictions.map((pred) => (
                    <button
                      key={pred.placeId}
                      type="button"
                      onClick={() => handleSelectSearchedAddress(pred)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-orange-50/70 transition-colors flex items-start gap-2.5 group cursor-pointer"
                    >
                      <MapPin size={15} className="text-[#F26522] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#052a51] truncate">{pred.mainText}</p>
                        <p className="text-[11px] text-gray-500 truncate">{pred.secondaryText || pred.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                    placeholder="Enter full name"
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
                    placeholder="Enter 10-digit mobile number"
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
                  placeholder="Enter house, flat or shop number"
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
                  placeholder="Enter building name and street address"
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
                  placeholder="Enter area, sector or locality"
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
                  placeholder="Enter nearby landmark"
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
                  placeholder="Enter city name"
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
                  placeholder="Enter state name"
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
                  placeholder="Enter 6-digit postal pincode"
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
                placeholder="Enter special delivery instructions"
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

      {/* Interactive Google Map Picker Modal */}
      <WebMapPickerModal
        isOpen={showWebMapModal}
        onClose={() => setShowWebMapModal(false)}
        onConfirmLocation={handleMapLocationConfirmed}
      />
    </div>
  );
}
