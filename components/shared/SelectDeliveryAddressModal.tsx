"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Mic,
  Crosshair,
  ChevronRight,
  PlusCircle,
  Home,
  Building2,
  MapPin,
  MoreVertical,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  HardHat,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useDeliveryAddressStore } from "@/lib/delivery-address-store";
import { useAuthStore, type CustomerAddress } from "@/lib/auth-store";
import WebMapPickerModal, { type WebPickedLocation } from "@/components/maps/WebMapPickerModal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Authentic Google Maps Pin SVG
export const GoogleMapsPinSvg = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path
      d="M24 4C14.06 4 6 12.06 6 22c0 7.7 5.02 14.23 12.06 16.71L24 44l5.94-5.29C36.98 36.23 42 29.7 42 22c0-9.94-8.06-18-18-18z"
      fill="#EA4335"
    />
    <path
      d="M24 4c-9.94 0-18 8.06-18 18 0 7.7 5.02 14.23 12.06 16.71L24 44V22H6.1c.14-1.39.46-2.73.95-4L24 4z"
      fill="#4285F4"
    />
    <path
      d="M24 4v18h17.9c-.14-1.39-.46-2.73-.95-4L24 4z"
      fill="#FBBC04"
    />
    <path
      d="M24 22v22l5.94-5.29C36.98 36.23 42 29.7 42 22H24z"
      fill="#34A853"
    />
    <circle cx="24" cy="22" r="7" fill="#ffffff" />
  </svg>
);

interface SelectDeliveryAddressModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onAddressSelect?: (address: CustomerAddress) => void;
  continueLabel?: string;
  onContinue?: (address: CustomerAddress) => void;
}

export default function SelectDeliveryAddressModal({
  isOpen: propIsOpen,
  onClose: propOnClose,
  onAddressSelect,
  continueLabel = "Continue to Order",
  onContinue,
}: SelectDeliveryAddressModalProps) {
  const router = useRouter();
  const storeIsOpen = useDeliveryAddressStore((s) => s.isAddressModalOpen);
  const storeClose = useDeliveryAddressStore((s) => s.closeAddressModal);
  const selectedAddress = useDeliveryAddressStore((s) => s.selectedAddress);
  const setSelectedAddress = useDeliveryAddressStore((s) => s.setSelectedAddress);
  const savedAddresses = useDeliveryAddressStore((s) => s.savedAddresses);
  const addSavedAddress = useDeliveryAddressStore((s) => s.addSavedAddress);
  const deleteSavedAddress = useDeliveryAddressStore((s) => s.deleteSavedAddress);

  const { user, addAddress: authAddAddress, deleteAddress: authDeleteAddress } = useAuthStore();

  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const handleClose = propOnClose || storeClose;

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<
    Array<{ placeId: string; description: string; mainText: string; secondaryText: string }>
  >([]);
  const [isListening, setIsListening] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Map Picker State
  const [showWebMapModal, setShowWebMapModal] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Form Mode State (Add/Edit Address)
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form Fields
  const [label, setLabel] = useState<"Home" | "Office" | "Other" | string>("Home");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : "");
  const [houseNumber, setHouseNumber] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");

  // Sync profile details when user changes
  useEffect(() => {
    if (user?.name) setFullName(user.name);
    if (user?.phone) setPhone(user.phone.replace(/\D/g, "").slice(-10));
  }, [user?.name, user?.phone]);

  // Fetch authenticated user's addresses from database
  const [dbAddresses, setDbAddresses] = useState<CustomerAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setDbAddresses([]);
      return;
    }
    let isCancelled = false;
    const fetchUserAddresses = async () => {
      try {
        setIsLoadingAddresses(true);
        const res = await fetch(`/api/addresses?userId=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (!isCancelled && data?.success && Array.isArray(data.addresses)) {
          const mapped: CustomerAddress[] = data.addresses.map((a: any) => ({
            id: a.id,
            name: user.name || "Customer",
            phone: user.phone || "",
            label: a.label || "Home",
            houseNumber: a.houseNumber || "",
            line1: a.street || a.line1 || "",
            line2: a.landmark || a.line2 || "",
            city: a.city || "Bengaluru",
            state: a.state || "Karnataka",
            pincode: a.pincode || "560114",
            latitude: a.latitude ? Number(a.latitude) : undefined,
            longitude: a.longitude ? Number(a.longitude) : undefined,
            isDefault: Boolean(a.isDefault),
          }));
          setDbAddresses(mapped);
        }
      } catch (err) {
        console.warn("Could not fetch user addresses:", err);
      } finally {
        if (!isCancelled) setIsLoadingAddresses(false);
      }
    };
    fetchUserAddresses();
    return () => {
      isCancelled = true;
    };
  }, [user?.id, isOpen]);

  // Strictly combine addresses belonging ONLY to this user (or guest session)
  const combinedAddresses = React.useMemo(() => {
    if (user?.id) {
      const authList = [...(user.addresses || [])];
      dbAddresses.forEach((da) => {
        if (!authList.some((a) => a.id === da.id)) {
          authList.push(da);
        }
      });
      // Purge any legacy sample/dummy addresses
      return authList.filter(
        (a) =>
          a &&
          !a.id?.includes("sample") &&
          a.phone !== "9264920211" &&
          !a.name?.includes("Sahil Sheikh")
      );
    }

    // Unauthenticated guest user: only return addresses saved in this local session
    return savedAddresses.filter(
      (a) =>
        a &&
        !a.id?.includes("sample") &&
        a.phone !== "9264920211" &&
        !a.name?.includes("Sahil Sheikh")
    );
  }, [user?.id, user?.addresses, dbAddresses, savedAddresses]);

  const currentSelectedId = selectedAddress?.id || combinedAddresses[0]?.id;

  // Sync address changes
  const handleSelect = (addr: CustomerAddress) => {
    setSelectedAddress(addr);
    onAddressSelect?.(addr);
  };

  // Autocomplete search typing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() || text.length < 2) {
      setPredictions([]);
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/geo/autocomplete?input=${encodeURIComponent(text)}`);
        const data = await res.json();
        if (data?.success && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
        }
      } catch (err) {
        console.warn("Autocomplete error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // Speech Recognition (Voice Search)
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.info("Voice search is supported in Chrome, Safari and Edge");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak your address or area name");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          handleSearchChange(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // 1-Click GPS Location Detection
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingLocation(true);
    toast.loading("Detecting your location via GPS...", { id: "gps-locate" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          const res = await fetch(`/api/geo/reverse-geocode?lat=${lat}&lng=${lng}`);
          const data = await res.json();
          toast.dismiss("gps-locate");

          const addrData = data?.success && data.address ? data.address : null;
          const displayArea = addrData?.area || addrData?.city || "Bengaluru";
          const displayCity = addrData?.city || "Bengaluru";
          const shortTitle = addrData?.shortAddress || `${displayArea}, ${displayCity}`;
          const fullLine1 = addrData?.line1 || (addrData?.area ? `${addrData.area}` : "Bengaluru");

          const detectedAddr: CustomerAddress = {
            id: `addr_gps_${Date.now()}`,
            name: fullName.trim() || user?.name || "Customer",
            phone: phone.trim() || (user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : ""),
            label: "Home",
            line1: fullLine1,
            line2: addrData?.street || addrData?.area || "",
            city: displayCity,
            state: addrData?.state || "Karnataka",
            pincode: addrData?.pincode || "560114",
            latitude: lat,
            longitude: lng,
            source: "GPS",
            isDefault: true,
          };
          addSavedAddress(detectedAddr);
          handleSelect(detectedAddr);
          if (user?.id) {
            authAddAddress?.(detectedAddr);
          }
          // Close popup immediately upon detection
          handleClose();

          toast.success(`📍 Location set: ${shortTitle}`, { duration: 4000 });
        } catch {
          toast.dismiss("gps-locate");
          const fallbackAddr: CustomerAddress = {
            id: `addr_gps_${Date.now()}`,
            name: fullName.trim() || user?.name || "Customer",
            phone: phone.trim() || (user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : ""),
            label: "Home",
            line1: "Bengaluru (Current Location)",
            line2: "",
            city: "Bengaluru",
            state: "Karnataka",
            pincode: "560114",
            latitude: lat,
            longitude: lng,
            source: "GPS",
            isDefault: true,
          };
          addSavedAddress(fallbackAddr);
          handleSelect(fallbackAddr);
          if (user?.id) {
            authAddAddress?.(fallbackAddr);
          }
          handleClose();
          toast.success(`📍 Location set: Bengaluru`, { duration: 4000 });
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (err) => {
        toast.dismiss("gps-locate");
        setIsDetectingLocation(false);
        toast.error("Location permission denied. Please allow GPS access.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Google Maps Pin Confirmation
  const handleConfirmMapLocation = (loc: WebPickedLocation) => {
    setShowWebMapModal(false);
    const mapAddr: CustomerAddress = {
      id: `addr_map_${Date.now()}`,
      name: fullName.trim() || user?.name || "Customer",
      phone: phone.trim() || (user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : ""),
      label: "Other",
      houseNumber: loc.houseNumber || "",
      line1: loc.street || loc.area || "Map Selected Location",
      line2: loc.landmark || "",
      city: loc.city || "Bengaluru",
      state: loc.state || "Karnataka",
      pincode: loc.pincode || "560114",
      latitude: loc.latitude,
      longitude: loc.longitude,
      source: "MAP_PIN",
      isDefault: true,
    };
    addSavedAddress(mapAddr);
    handleSelect(mapAddr);
    if (user?.id) {
      authAddAddress?.(mapAddr);
    }
    handleClose(); // Close delivery address modal
    toast.success(`📍 Location pinned: ${loc.area || loc.city || "Map Location"}`, { duration: 4000 });
  };

  // Save New Address Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseNumber.trim() && !street.trim() && !area.trim()) {
      toast.error("Please enter house number or street details");
      return;
    }
    const newAddr: CustomerAddress = {
      id: `addr_custom_${Date.now()}`,
      name: fullName.trim() || user?.name || "Customer",
      phone: phone.trim() || (user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : ""),
      label,
      houseNumber: houseNumber.trim(),
      line1: [houseNumber.trim(), street.trim()].filter(Boolean).join(", ") || area.trim(),
      line2: area.trim(),
      city: city.trim() || "Bengaluru",
      state: state.trim() || "Karnataka",
      pincode: pincode.trim() || "560114",
      isDefault: true,
    };
    addSavedAddress(newAddr);
    handleSelect(newAddr);
    if (user?.id) {
      authAddAddress?.(newAddr);
    }
    setIsAddingNew(false);
    toast.success("New address saved!");
  };

  // Continue to Order Click
  const handleContinue = () => {
    const chosen = selectedAddress || combinedAddresses[0];
    if (chosen) {
      handleSelect(chosen);
      if (onContinue) {
        onContinue(chosen);
      } else {
        handleClose();
      }
    } else {
      toast.info("Please select or add a delivery address");
    }
  };

  const getLabelIcon = (lbl: string) => {
    const l = lbl?.toLowerCase();
    if (l === "home") return <Home size={20} className="text-[#0066FF]" />;
    if (l === "office" || l === "work") return <Building2 size={20} className="text-slate-600" />;
    return <MapPin size={20} className="text-slate-600" />;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity p-0 sm:p-4">
        {/* Modal Card / Bottom Sheet */}
        <div
          className="w-full sm:max-w-[480px] md:max-w-[510px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
          onClick={() => setActiveMenuId(null)}
        >
          {/* Mobile Top Drag Indicator */}
          <div className="pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto" />
          </div>

          {/* Header */}
          <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-3 flex items-start justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              {isAddingNew && (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="p-1 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {isAddingNew ? "Add Delivery Address" : "Select Delivery Address"}
                </h2>
                <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5 font-medium">
                  {isAddingNew
                    ? "Fill in your delivery location details"
                    : "Choose where you want us to deliver your order"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors shrink-0"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            {isAddingNew ? (
              /* Add New Address Form */
              <form onSubmit={handleSaveForm} className="space-y-3.5">
                {/* Save As Chips */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Save Address As
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "Home", icon: Home, label: "Home" },
                      { key: "Office", icon: Building2, label: "Office" },
                      { key: "Site", icon: HardHat, label: "Site" },
                      { key: "Other", icon: MapPin, label: "Other" },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = label === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setLabel(item.key)}
                          className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? "bg-[#0066FF] text-white border-[#0066FF] shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Icon size={14} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Flat / House / Building */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Flat / House / Building *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Flat 402, 4th Floor, Sobha Daffodil"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                  />
                </div>

                {/* Street / Area */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Street / Road
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10th Main Road"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Area / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Begur / HSR"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* City & PIN Code */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code *</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="560114"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Recipient Name & Phone */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#0066FF] focus:ring-2 focus:ring-blue-100 text-sm text-slate-800 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-2xl text-sm font-bold transition-colors shadow-md shadow-blue-500/20"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            ) : (
              /* Address List View (Matches User Design Screenshot) */
              <>
                {/* 1. Search Bar */}
                <div className="relative">
                  <div className="flex items-center gap-3 px-4 py-3 bg-white border border-blue-200 focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-blue-100 rounded-2xl shadow-2xs transition-all">
                    <Search size={18} className="text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search area, street, landmark or pincode..."
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none"
                    />
                    {isSearching ? (
                      <Loader2 size={16} className="text-[#0066FF] animate-spin shrink-0" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setPredictions([]);
                        }}
                        className="text-slate-400 hover:text-slate-600 shrink-0"
                      >
                        <X size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleVoiceSearch}
                        title="Voice search"
                        className={`text-slate-400 hover:text-[#0066FF] transition-colors shrink-0 ${
                          isListening ? "text-rose-500 animate-pulse" : ""
                        }`}
                      >
                        <Mic size={18} />
                      </button>
                    )}
                  </div>

                  {/* Predictions Dropdown */}
                  {predictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 max-h-52 overflow-y-auto">
                      {predictions.map((p) => (
                        <div
                          key={p.placeId}
                          onClick={async () => {
                            setSearchQuery("");
                            setPredictions([]);
                            const newAddrId = `addr_search_${Date.now()}`;
                            const newAddr: CustomerAddress = {
                              id: newAddrId,
                              name: fullName.trim() || user?.name || "Customer",
                              phone: phone.trim() || (user?.phone ? user.phone.replace(/\D/g, "").slice(-10) : ""),
                              label: "Other",
                              line1: p.mainText,
                              line2: p.secondaryText,
                              city: "Bengaluru",
                              state: "Karnataka",
                              pincode: "560114",
                              source: "SEARCH",
                              isDefault: true,
                            };
                            addSavedAddress(newAddr);
                            handleSelect(newAddr);
                            if (user?.id) {
                              authAddAddress?.(newAddr);
                            }
                            handleClose();
                            toast.success(`📍 Location set: ${p.mainText}`, { duration: 4000 });

                            // Fetch place details in background to capture exact apartment coordinates & PIN code
                            if (p.placeId && !p.placeId.startsWith("osm_")) {
                              try {
                                const res = await fetch(`/api/geo/place-details?placeId=${encodeURIComponent(p.placeId)}`);
                                const data = await res.json();
                                if (data?.success && data.location) {
                                  const loc = data.location;
                                  const updated: CustomerAddress = {
                                    ...newAddr,
                                    line1: p.mainText,
                                    line2: loc.street || loc.area || p.secondaryText,
                                    city: loc.city || "Bengaluru",
                                    state: loc.state || "Karnataka",
                                    pincode: loc.pincode || "560114",
                                    latitude: loc.latitude,
                                    longitude: loc.longitude,
                                  };
                                  addSavedAddress(updated);
                                  handleSelect(updated);
                                  if (user?.id) {
                                    authAddAddress?.(updated);
                                  }
                                }
                              } catch (enrichErr) {
                                console.warn("Could not enrich place details:", enrichErr);
                              }
                            }
                          }}
                          className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors text-left"
                        >
                          <MapPin size={16} className="text-[#0066FF] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                              {p.mainText}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{p.secondaryText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Side-by-Side Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {/* Use Current Location */}
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isDetectingLocation}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-[#F0F7FF] hover:bg-blue-100/60 border border-[#BFDBFE] transition-all text-left group active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center text-[#0066FF] shrink-0">
                        <Crosshair
                          size={20}
                          className={isDetectingLocation ? "animate-spin" : ""}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate">
                          Use Current Location
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                          {isDetectingLocation ? "Detecting GPS..." : "Auto-detect your address"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-400 group-hover:text-[#0066FF] group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
                    />
                  </button>

                  {/* Choose on Google Maps */}
                  <button
                    type="button"
                    onClick={() => setShowWebMapModal(true)}
                    className="flex items-center justify-between p-3 sm:p-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-left group active:scale-[0.99] cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <GoogleMapsPinSvg size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight truncate">
                          Choose on Google Maps
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                          Pick exact location on map
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all shrink-0 ml-1"
                    />
                  </button>
                </div>

                {/* 3. Section Header: Saved Addresses */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 pt-1">
                    <h3 className="text-sm sm:text-[15px] font-bold text-slate-900">
                      Saved Addresses
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(true)}
                      className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#0066FF] hover:text-blue-700 transition-colors cursor-pointer"
                    >
                      <PlusCircle size={16} className="text-[#0066FF]" />
                      <span>Add New</span>
                    </button>
                  </div>

                  {/* 4. Saved Addresses Cards */}
                  <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-0.5">
                    {combinedAddresses.length === 0 ? (
                      <div className="py-7 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0066FF] flex items-center justify-center mx-auto mb-2">
                          <MapPin size={18} />
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-slate-800">No saved addresses</p>
                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                          Use Current Location above or tap Add New
                        </p>
                      </div>
                    ) : (
                      combinedAddresses.map((addr) => {
                        const isSelected = currentSelectedId === addr.id;
                        const isMenuOpen = activeMenuId === addr.id;

                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelect(addr)}
                            className={`p-3.5 rounded-2xl transition-all cursor-pointer flex items-start justify-between border relative ${
                              isSelected
                                ? "border-2 border-[#0066FF] bg-[#F0F7FF]/50 shadow-2xs"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              {/* Left Circular Icon Badge */}
                              <div
                                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected
                                    ? "bg-[#EFF6FF] border border-[#DBEAFE] text-[#0066FF]"
                                    : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {getLabelIcon(addr.label)}
                              </div>

                              {/* Middle Details */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-slate-900">
                                    {addr.label || "Home"}
                                  </span>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#0066FF] text-[10px] font-bold tracking-wide">
                                      Delivering Here
                                    </span>
                                  )}
                                </div>

                                {addr.name && (
                                  <p className="text-xs text-slate-600 font-medium mt-1 truncate">
                                    {addr.name}
                                    {addr.phone
                                      ? ` • +91 ${addr.phone.replace(/\D/g, "").slice(-10)}`
                                      : ""}
                                  </p>
                                )}

                                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                  {[
                                    addr.houseNumber,
                                    addr.line1,
                                    addr.line2,
                                    addr.city,
                                    addr.state,
                                    addr.pincode,
                                  ]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              </div>
                            </div>

                            {/* Right Radio Circle & Options */}
                            <div className="flex items-center gap-2.5 shrink-0 ml-3 self-center">
                              {/* Radio Circle */}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
                                  isSelected ? "border-[#0066FF]" : "border-slate-300"
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF]" />
                                )}
                              </div>

                              {/* 3-Dots Menu Trigger */}
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(isMenuOpen ? null : addr.id);
                                  }}
                                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {/* Dropdown Menu */}
                                {isMenuOpen && (
                                  <div
                                    className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-30 divide-y divide-slate-100"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        deleteSavedAddress(addr.id);
                                        if (user?.id) {
                                          authDeleteAddress?.(addr.id);
                                          fetch(`/api/addresses/${addr.id}`, { method: "DELETE" }).catch(() => {});
                                        }
                                        toast.success("Address removed");
                                      }}
                                      className="w-full px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                                    >
                                      <Trash2 size={13} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom Action Button */}
          {!isAddingNew && (
            <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-2 bg-white border-t border-slate-100">
              <button
                type="button"
                onClick={handleContinue}
                className="w-full h-13 sm:h-14 bg-[#0066FF] hover:bg-[#0052CC] active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <span>{continueLabel}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Google Maps Interactive Picker Modal */}
      {showWebMapModal && (
        <WebMapPickerModal
          isOpen={showWebMapModal}
          onClose={() => setShowWebMapModal(false)}
          onConfirmLocation={handleConfirmMapLocation}
          initialLat={selectedAddress?.latitude || 12.8797}
          initialLng={selectedAddress?.longitude || 77.6321}
        />
      )}
    </>
  );
}
