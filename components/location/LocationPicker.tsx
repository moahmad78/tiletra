"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Search,
  Check,
  Building,
  Home,
  Briefcase,
  HardHat,
  Compass,
  RotateCw,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { type CustomerAddress, useAuthStore } from "@/lib/auth-store";
import { interpretAccuracy, GeocodedAddress, LocationSource } from "@/lib/location/types";
import { toast } from "sonner";

interface LocationPickerProps {
  onAddressSelected: (address: CustomerAddress) => void;
  onCancel?: () => void;
}

export default function LocationPicker({ onAddressSelected, onCancel }: LocationPickerProps) {
  const { addAddress, user, updateUserPhone } = useAuthStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [detectingGps, setDetectingGps] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: 12.9716, // Bengaluru
    lng: 77.5946,
  });
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [source, setSource] = useState<LocationSource>("GPS");
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form Fields
  const [name, setName] = useState(user?.name && !user.name.startsWith("User ") ? user.name : "");
  const [phone, setPhone] = useState(
    user?.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_")
      ? user.phone.replace(/\D/g, "").slice(-10)
      : ""
  );
  const [houseNumber, setHouseNumber] = useState("");
  const [buildingName, setBuildingName] = useState("");
  const [floor, setFloor] = useState("");
  const [street, setStreet] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("560001");
  const [city, setCity] = useState("Bangalore");
  const [state, setState] = useState("Karnataka");
  const [landmark, setLandmark] = useState("");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [label, setLabel] = useState<"Home" | "Work" | "Site" | "Other">("Home");

  const accuracyInfo = interpretAccuracy(accuracy);

  // ── Reverse Geocode Function (Triggered ONLY on dragend or GPS detection) ──
  const performReverseGeocode = useCallback(async (lat: number, lng: number, acc?: number | null, src: LocationSource = "MAP_PIN") => {
    setIsReverseGeocoding(true);
    try {
      const res = await fetch("/api/location/reverse-geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng, accuracy: acc, source: src }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.address) {
          const a: GeocodedAddress = data.address;
          if (a.houseNumber && !houseNumber) setHouseNumber(a.houseNumber);
          if (a.buildingName && !buildingName) setBuildingName(a.buildingName);
          if (a.street) setStreet(a.street);
          if (a.area) setArea(a.area);
          if (a.city) setCity(a.city);
          if (a.state) setState(a.state);
          if (a.postalCode) setPincode(a.postalCode);
        }
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [houseNumber, buildingName]);

  // ── Initialize MapLibre Map ──
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      try {
        const maplibreModule: any = await import("maplibre-gl");
        const maplibregl = maplibreModule.default || maplibreModule;
        import("maplibre-gl/dist/maplibre-gl.css" as any);

        if (!mapContainerRef.current || !isMounted) return;

        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/bright",
          center: [coords.lng, coords.lat],
          zoom: 15,
          attributionControl: false,
        });

        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        // Custom Draggable Pin
        const pinEl = document.createElement("div");
        pinEl.innerHTML = `
          <div style="cursor: grab; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transform: translateY(-50%);">
            <div style="background: #F26522; color: white; border-radius: 9999px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(242,101,34,0.4);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <div style="width: 8px; height: 8px; background: #052a51; border-radius: 50%; margin-top: -3px; border: 1.5px solid white;"></div>
          </div>
        `;

        const marker = new maplibregl.Marker({ element: pinEl, draggable: true })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);

        // ── Dragend Handler: Only reverse-geocodes after drag stops ──
        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          setCoords({ lat: lngLat.lat, lng: lngLat.lng });
          setSource("MAP_PIN");
          performReverseGeocode(lngLat.lat, lngLat.lng, null, "MAP_PIN");
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      } catch (err) {
        console.error("Map initialization failed:", err);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── GPS Auto-detect handler (Browser Geolocation API) ──
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy: acc } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(acc);
        setSource("GPS");

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
          markerRef.current.setLngLat([longitude, latitude]);
        }

        performReverseGeocode(latitude, longitude, acc, "GPS");
        setDetectingGps(false);
        toast.success("Location detected via GPS!");
      },
      (err) => {
        setDetectingGps(false);
        console.warn("GPS error:", err);
        toast.error("Location permission denied. Search address or drag the map pin.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // ── Debounced Search Autocomplete ──
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch("/api/location/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setSearchResults(data.results || []);
          }
        }
      } catch (err) {
        console.warn("Search geocode failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (result: GeocodedAddress) => {
    setCoords({ lat: result.latitude, lng: result.longitude });
    setSource("SEARCH");
    setAccuracy(null);
    setSearchQuery("");
    setSearchResults([]);

    if (result.street) setStreet(result.street);
    if (result.area) setArea(result.area);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    if (result.postalCode) setPincode(result.postalCode);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo({ center: [result.longitude, result.latitude], zoom: 16 });
      markerRef.current.setLngLat([result.longitude, result.latitude]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter recipient name");
      return;
    }
    if (phone.replace(/\D/g, "").length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (!pincode.trim() || pincode.length < 5) {
      toast.error("Please enter a valid postal pincode");
      return;
    }
    if (!street.trim()) {
      toast.error("Please enter Street / Road address");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formattedLine1 = [houseNumber, buildingName, street].filter(Boolean).join(", ");
    const formattedLine2 = area || "";
    const fullFormatted = [houseNumber, buildingName, street, area, city, pincode].filter(Boolean).join(", ");

    const newAddrData = {
      name: name.trim(),
      phone: cleanPhone,
      pincode: pincode.trim(),
      line1: formattedLine1,
      line2: formattedLine2,
      houseNumber: houseNumber.trim() || undefined,
      buildingName: buildingName.trim() || undefined,
      floor: floor.trim() || undefined,
      street: street.trim(),
      area: area.trim() || undefined,
      city: city.trim() || "Bangalore",
      district: undefined,
      state: state.trim() || "Karnataka",
      country: "India",
      landmark: landmark.trim() || undefined,
      label,
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy: accuracy || undefined,
      source: source,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      formattedAddress: fullFormatted,
      isDefault: true,
    };

    const savedInStore = addAddress(newAddrData);

    // Save to Database if user is authenticated
    if (user?.id) {
      fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          label,
          fullName: name.trim(),
          phone: cleanPhone,
          houseNumber: houseNumber.trim() || null,
          buildingName: buildingName.trim() || null,
          floor: floor.trim() || null,
          street: street.trim(),
          area: area.trim() || null,
          landmark: landmark.trim() || null,
          city: city.trim() || "Bangalore",
          state: state.trim() || "Karnataka",
          pincode: pincode.trim(),
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: accuracy || null,
          source: source,
          deliveryInstructions: deliveryInstructions.trim() || null,
          isDefault: true,
        }),
      }).catch((err) => console.warn("Failed to persist address to DB:", err));
    }

    // Auto-sync phone if not yet set
    const userHasRealPhone =
      user?.phone &&
      !user.phone.startsWith("google_") &&
      !user.phone.startsWith("email_") &&
      user.phone.replace(/\D/g, "").length === 10;

    if (!userHasRealPhone) {
      updateUserPhone(cleanPhone).catch(() => {});
    }

    toast.success("Delivery address confirmed!");
    onAddressSelected(savedInStore);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* ── TOP: INTERACTIVE MAP PICKER STRIP ── */}
      <div className="relative w-full h-56 sm:h-72 bg-gray-100 border-b border-gray-200">
        {/* Search Header Overlay */}
        <div className="absolute top-3 left-3 right-3 z-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search building, street, or landmark..."
              className="w-full pl-9 pr-8 py-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
            <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            {isSearching && (
              <Loader2 size={14} className="absolute right-3 top-3 text-[#F26522] animate-spin" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto z-30 divide-y divide-gray-100">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectSearchResult(res)}
                  className="w-full text-left px-3 py-2 hover:bg-orange-50 transition-colors flex items-start gap-2 text-xs text-gray-700 cursor-pointer"
                >
                  <MapPin size={13} className="text-[#F26522] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-900 leading-tight">{res.street || res.area || "Location"}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{res.formattedAddress}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Bottom Floating Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="pointer-events-auto px-2.5 py-1 rounded-full bg-white/95 shadow-md border border-gray-200 flex items-center gap-1.5 text-[10px] font-bold text-gray-700">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accuracyInfo.badgeColor }} />
            <span>{accuracyInfo.label}</span>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={detectingGps}
            className="pointer-events-auto px-3 py-1.5 rounded-xl bg-[#052a51] text-white shadow-lg flex items-center gap-1.5 text-xs font-bold hover:bg-[#041f3d] active:scale-95 transition-all cursor-pointer"
          >
            {detectingGps ? <RotateCw size={13} className="animate-spin" /> : <Navigation size={13} />}
            <span>{detectingGps ? "Detecting..." : "Use Current GPS"}</span>
          </button>
        </div>
      </div>

      {/* ── BOTTOM: DETAILED FORM ── */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-4">
        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Recipient Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IntriHub"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Mobile Phone (10 digits) *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">+91</span>
              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
            </div>
          </div>
        </div>

        {/* Address Label Selector */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1.5">Save Address As</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: "Home", icon: Home },
              { key: "Work", icon: Briefcase },
              { key: "Site", icon: HardHat },
              { key: "Other", icon: Compass },
            ].map(({ key, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setLabel(key as any)}
                className={`py-2 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  label === key
                    ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon size={13} />
                <span>{key}</span>
              </button>
            ))}
          </div>
        </div>

        {/* House / Flat & Building Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">House / Flat / Shop No.</label>
            <input
              type="text"
              value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)}
              placeholder="e.g. Flat 304, 3rd Floor"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Building / Apartment Name</label>
            <input
              type="text"
              value={buildingName}
              onChange={(e) => setBuildingName(e.target.value)}
              placeholder="e.g. Sobha Royal Pavilion"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
        </div>

        {/* Street & Area */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Street / Main Road *</label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="e.g. Sarjapur Main Road"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Area / Locality</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Hadosiddapura, Carmelaram"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
        </div>

        {/* Landmark & PIN Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Landmark</label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Behind Wipro SEZ"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">PIN Code *</label>
            <input
              type="text"
              required
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
              placeholder="560035"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            />
          </div>
        </div>

        {/* Delivery Instructions */}
        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">Delivery Instructions (Optional)</label>
          <input
            type="text"
            value={deliveryInstructions}
            onChange={(e) => setDeliveryInstructions(e.target.value)}
            placeholder="e.g. Leave at security, call on arrival"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
          />
        </div>

        {/* Form Actions */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-7 py-3 bg-[#F26522] hover:bg-[#d95314] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <Check size={16} strokeWidth={3} />
            <span>Save & Deliver Here</span>
          </button>
        </div>
      </form>
    </div>
  );
}
