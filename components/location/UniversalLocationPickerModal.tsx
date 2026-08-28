"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Navigation,
  Search,
  X,
  Check,
  AlertCircle,
  Loader2,
  Home,
  Briefcase,
  HardHat,
  Compass,
} from "lucide-react";
import { interpretAccuracy, GeocodedAddress, LocationSource } from "@/lib/location/types";
import { toast } from "sonner";

interface UniversalLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (address: GeocodedAddress) => void;
  initialAddress?: Partial<GeocodedAddress> | null;
}

export default function UniversalLocationPickerModal({
  isOpen,
  onClose,
  onSelectAddress,
  initialAddress,
}: UniversalLocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialAddress?.latitude || 12.9716, // Default: Bengaluru
    lng: initialAddress?.longitude || 77.5946,
  });
  const [accuracy, setAccuracy] = useState<number | null>(initialAddress?.accuracy || null);
  const [source, setSource] = useState<LocationSource>(initialAddress?.source || "GPS");

  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Address details state
  const [formattedAddress, setFormattedAddress] = useState(initialAddress?.formattedAddress || "");
  const [houseNumber, setHouseNumber] = useState(initialAddress?.houseNumber || "");
  const [buildingName, setBuildingName] = useState(initialAddress?.buildingName || "");
  const [floor, setFloor] = useState(initialAddress?.floor || "");
  const [street, setStreet] = useState(initialAddress?.street || "");
  const [area, setArea] = useState(initialAddress?.area || "");
  const [landmark, setLandmark] = useState(initialAddress?.landmark || "");
  const [city, setCity] = useState(initialAddress?.city || "Bangalore");
  const [state, setState] = useState(initialAddress?.state || "Karnataka");
  const [postalCode, setPostalCode] = useState(initialAddress?.postalCode || "560001");
  const [deliveryInstructions, setDeliveryInstructions] = useState(initialAddress?.deliveryInstructions || "");
  const [addressLabel, setAddressLabel] = useState<string>("Home");

  const accuracyInfo = interpretAccuracy(accuracy);

  // ── Reverse Geocode Function (Only on dragend or initial GPS) ──
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
          const a = data.address;
          setFormattedAddress(a.formattedAddress || "");
          if (a.houseNumber && !houseNumber) setHouseNumber(a.houseNumber);
          if (a.buildingName && !buildingName) setBuildingName(a.buildingName);
          if (a.street) setStreet(a.street);
          if (a.area) setArea(a.area);
          if (a.city) setCity(a.city);
          if (a.state) setState(a.state);
          if (a.postalCode) setPostalCode(a.postalCode);
        }
      }
    } catch (err) {
      console.warn("Reverse geocode failed:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [houseNumber, buildingName]);

  // ── Initialize MapLibre GL Map ──
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      try {
        const maplibreModule: any = await import("maplibre-gl");
        const maplibregl = maplibreModule.default || maplibreModule;
        import("maplibre-gl/dist/maplibre-gl.css" as any);

        if (!mapContainerRef.current || !isMounted) return;

        // Create Map
        const map = new maplibregl.Map({
          container: mapContainerRef.current,
          style: "https://tiles.openfreemap.org/styles/bright",
          center: [coords.lng, coords.lat],
          zoom: 15,
          attributionControl: false,
        });

        // Add Navigation Controls
        map.addControl(new maplibregl.NavigationControl({ showCompass: true }), "top-right");

        // Create Custom Draggable Pin Element
        const pinEl = document.createElement("div");
        pinEl.className = "intrihub-delivery-pin";
        pinEl.innerHTML = `
          <div style="cursor: grab; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); transform: translateY(-50%);">
            <div style="background: #F26522; color: white; border-radius: 9999px; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(242,101,34,0.4);">
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

        // ── CRITICAL: Trigger reverse geocode ONLY on dragend (never during dragging) ──
        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          const newLat = lngLat.lat;
          const newLng = lngLat.lng;
          setCoords({ lat: newLat, lng: newLng });
          setSource("MAP_PIN");
          performReverseGeocode(newLat, newLng, null, "MAP_PIN");
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;

        // Perform initial reverse geocode if address empty
        if (!formattedAddress) {
          performReverseGeocode(coords.lat, coords.lng, accuracy, source);
        }
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
  }, [isOpen]);

  // ── Handle "Use Current Location" (Browser GPS) ──
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude, accuracy: acc } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        setAccuracy(acc);
        setSource("GPS");

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
          markerRef.current.setLngLat([longitude, latitude]);
        }

        performReverseGeocode(latitude, longitude, acc, "GPS");
        toast.success("Current location detected");
      },
      (error) => {
        setIsLocating(false);
        console.warn("Geolocation error:", error);
        toast.error("Location permission denied. Please search address or drag the map pin.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── Debounced Search Handler ──
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

  // ── Handle Selecting Search Result ──
  const handleSelectSearchResult = (result: GeocodedAddress) => {
    setCoords({ lat: result.latitude, lng: result.longitude });
    setSource("SEARCH");
    setAccuracy(null);
    setSearchQuery("");
    setSearchResults([]);

    if (result.formattedAddress) setFormattedAddress(result.formattedAddress);
    if (result.street) setStreet(result.street);
    if (result.area) setArea(result.area);
    if (result.city) setCity(result.city);
    if (result.state) setState(result.state);
    if (result.postalCode) setPostalCode(result.postalCode);

    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo({ center: [result.longitude, result.latitude], zoom: 16 });
      markerRef.current.setLngLat([result.longitude, result.latitude]);
    }
  };

  // ── Handle Confirm & Save ──
  const handleConfirmAddress = () => {
    if (!street && !formattedAddress) {
      toast.error("Please enter a street or area name");
      return;
    }

    const finalAddress: GeocodedAddress = {
      formattedAddress: formattedAddress || [houseNumber, buildingName, street, area, city, postalCode].filter(Boolean).join(", "),
      houseNumber: houseNumber || undefined,
      buildingName: buildingName || undefined,
      floor: floor || undefined,
      street: street || formattedAddress,
      area: area || undefined,
      landmark: landmark || undefined,
      city: city || "Bangalore",
      state: state || "Karnataka",
      country: "India",
      postalCode: postalCode || "560001",
      latitude: coords.lat,
      longitude: coords.lng,
      accuracy: accuracy || undefined,
      source: source,
      deliveryInstructions: deliveryInstructions || undefined,
    };

    onSelectAddress(finalAddress);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* ── LEFT PANEL: INTERACTIVE MAP & SEARCH ── */}
        <div className="relative w-full md:w-1/2 h-64 md:h-[620px] bg-gray-100 flex flex-col shrink-0">
          {/* Search Header Overlay */}
          <div className="absolute top-3 left-3 right-12 z-10">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search apartment, street, landmark..."
                className="w-full pl-9 pr-8 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
              <Search size={14} className="absolute left-3 top-3.5 text-gray-400" />
              {isSearching && (
                <Loader2 size={14} className="absolute right-3 top-3.5 text-[#F26522] animate-spin" />
              )}
            </div>

            {/* Autocomplete Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 max-h-52 overflow-y-auto z-30 divide-y divide-gray-100">
                {searchResults.map((res, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-orange-50 transition-colors flex items-start gap-2.5 text-xs text-gray-700 cursor-pointer"
                  >
                    <MapPin size={14} className="text-[#F26522] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">{res.street || res.area || "Location"}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1">{res.formattedAddress}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map Controls Floating Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
            {/* GPS Accuracy Pill */}
            <div className="pointer-events-auto px-2.5 py-1 rounded-full bg-white/95 shadow-md border border-gray-200 flex items-center gap-1.5 text-[10px] font-bold text-gray-700">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: accuracyInfo.badgeColor }} />
              <span>{accuracyInfo.label}</span>
            </div>

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="pointer-events-auto px-3.5 py-2 rounded-2xl bg-[#052a51] text-white shadow-lg flex items-center gap-1.5 text-xs font-bold hover:bg-[#041f3d] active:scale-95 transition-all cursor-pointer"
            >
              {isLocating ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
              <span>Use GPS</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: DETAILED ADDRESS FORM ── */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 overflow-y-auto flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-[#F26522] flex items-center justify-center font-black text-xs">
                📍
              </span>
              <div>
                <h3 className="text-sm font-black text-[#052a51]">Confirm Delivery Location</h3>
                <p className="text-[11px] text-gray-500">Drag map pin to fine-tune exact doorstep coordinates</p>
              </div>
            </div>

            {/* Coordinates Display Pill */}
            <div className="mb-3 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200/70 flex items-center justify-between text-xs">
              <span className="text-[11px] text-gray-500 font-medium">GPS Coordinates:</span>
              <span className="font-mono font-bold text-gray-800 text-[11px]">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              {/* Address Label Chips */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1.5">Save as</label>
                <div className="flex gap-2">
                  {[
                    { key: "Home", icon: Home },
                    { key: "Work", icon: Briefcase },
                    { key: "Site", icon: HardHat },
                    { key: "Other", icon: Compass },
                  ].map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAddressLabel(key)}
                      className={`flex-1 py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        addressLabel === key
                          ? "bg-[#052a51] text-white border-[#052a51] shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon size={12} />
                      <span>{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* House/Flat & Building Name */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">House / Flat No. *</label>
                  <input
                    type="text"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="e.g. Flat 402, 4th Floor"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Building / Apartment</label>
                  <input
                    type="text"
                    value={buildingName}
                    onChange={(e) => setBuildingName(e.target.value)}
                    placeholder="e.g. Prestige Greenwoods"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                </div>
              </div>

              {/* Street & Area */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Street / Road *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. 14th Main Road, 5th Sector"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>

              {/* Landmark & PIN Code */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">Nearby Landmark</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Opposite Metro Pillar 124"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-600 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 560102"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Delivery Instructions (Optional)</label>
                <input
                  type="text"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Call at security gate, lift available"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={handleConfirmAddress}
              className="w-full py-3 bg-[#F26522] text-white rounded-2xl font-black text-xs hover:bg-[#d95314] active:scale-98 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check size={16} strokeWidth={3} />
              <span>Confirm & Deliver to This Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
