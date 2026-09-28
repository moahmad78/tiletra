"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MapPin,
  Check,
  Crosshair,
  Search,
  Layers,
  Plus,
  Minus,
  Navigation,
  Loader2,
} from "lucide-react";

export interface WebPickedLocation {
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  houseNumber: string;
  landmark: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  label?: string;
}

interface WebMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLocation: (location: WebPickedLocation) => void;
  initialLat?: number;
  initialLng?: number;
}

declare global {
  interface Window {
    google?: any;
    initWebMapPicker?: () => void;
  }
}

// Authentic Google Maps 4-Color Pin SVG
const GoogleMapsLogo: React.FC<{ size?: number }> = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path
      d="M24 4C14.06 4 6 12.06 6 22c0 7.7 5.02 14.23 12.06 16.71L24 44l5.94-5.29C36.98 36.23 42 29.7 42 22c0-9.94-8.06-18-18-18z"
      fill="#EA4335"
    />
    <path
      d="M24 4c-9.94 0-18 8.06-18 18 0 7.7 5.02 14.23 12.06 16.71L24 44V22H6.1c.14-1.39.46-2.73.95-4L24 4z"
      fill="#4285F4"
    />
    <path d="M24 4v18h17.9c-.14-1.39-.46-2.73-.95-4L24 4z" fill="#FBBC04" />
    <path d="M24 22v22l5.94-5.29C36.98 36.23 42 29.7 42 22H24z" fill="#34A853" />
    <circle cx="24" cy="22" r="7" fill="#ffffff" />
  </svg>
);

export default function WebMapPickerModal({
  isOpen,
  onClose,
  onConfirmLocation,
  initialLat = 12.9716,
  initialLng = 77.5946,
}: WebMapPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<"Home" | "Work" | "Site" | "Other">("Home");
  const [addressDetails, setAddressDetails] = useState<WebPickedLocation>({
    street: "",
    area: "",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "",
    houseNumber: "",
    landmark: "",
    formattedAddress: "Move map to select exact delivery point",
    latitude: initialLat,
    longitude: initialLng,
  });

  // ── Blinkit-Style Live Address Search State ──
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<
    Array<{ placeId: string; description: string; mainText: string; secondaryText: string }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Live address search typing with debouncing
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (!text.trim() || text.length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `/api/geo/autocomplete?input=${encodeURIComponent(text)}&lat=${coords.lat}&lng=${coords.lng}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.predictions)) {
          setPredictions(data.predictions);
          setShowPredictions(true);
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  // Handle clicking a place prediction
  const handleSelectPrediction = async (prediction: {
    placeId: string;
    mainText: string;
    description: string;
    latitude?: number;
    longitude?: number;
  }) => {
    setShowPredictions(false);
    setSearchQuery(prediction.mainText);
    try {
      setIsSearching(true);

      // If coordinates are already present (e.g. from OSM fallback)
      if (prediction.latitude && prediction.longitude) {
        const newCoords = { lat: prediction.latitude, lng: prediction.longitude };
        setCoords(newCoords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newCoords);
          mapInstanceRef.current.setZoom(17);
        }
        reverseGeocodeCoords(prediction.latitude, prediction.longitude);
        return;
      }

      // Fetch place details from API
      const res = await fetch(`/api/geo/place-details?placeId=${encodeURIComponent(prediction.placeId)}`);
      const data = await res.json();
      if (data.success && data.location) {
        const loc = data.location;
        const newCoords = { lat: loc.latitude, lng: loc.longitude };
        setCoords(newCoords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo(newCoords);
          mapInstanceRef.current.setZoom(17);
        }
        setAddressDetails({
          street: loc.street || "",
          area: loc.area || "",
          city: loc.city || "Bengaluru",
          state: loc.state || "Karnataka",
          pincode: loc.pincode || "",
          houseNumber: loc.houseNumber || "",
          landmark: loc.landmark || "",
          formattedAddress: loc.formattedAddress || `${loc.latitude}, ${loc.longitude}`,
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      }
    } catch (e) {
      console.error("Failed to fetch place details:", e);
    } finally {
      setIsSearching(false);
    }
  };

  // Fast reverse geocoding with HTTP + server memory cache
  const reverseGeocodeCoords = async (lat: number, lng: number) => {
    try {
      setIsReverseGeocoding(true);
      const res = await fetch(`/api/geo/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();

      if (data.success && data.address) {
        const addr = data.address;
        setAddressDetails({
          street: addr.street || "",
          area: addr.area || "",
          city: addr.city || "Bengaluru",
          state: addr.state || "Karnataka",
          pincode: addr.pincode || "",
          houseNumber: addr.houseNumber || "",
          landmark: addr.landmark || "",
          formattedAddress: addr.formattedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (err) {
      console.error("Web reverse geocode error:", err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Instant zero-wait GPS recenter with fast-coarse + fallback
  const recenterGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);

    const applyPos = (latitude: number, longitude: number) => {
      setCoords({ lat: latitude, lng: longitude });
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
        mapInstanceRef.current.setZoom(17);
      }
      reverseGeocodeCoords(latitude, longitude);
      setIsLocating(false);
      try {
        sessionStorage.setItem("last_web_coords", JSON.stringify({ lat: latitude, lng: longitude }));
      } catch {}
    };

    // Stage 1: Try fast cached / coarse position first (<300ms)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyPos(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        // Stage 2: Fallback to high accuracy if coarse fails
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applyPos(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: false, timeout: 2500, maximumAge: 300000 }
    );
  };

  // Map Controls
  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    const next = mapType === "roadmap" ? "hybrid" : "roadmap";
    mapInstanceRef.current.setMapTypeId(next);
    setMapType(next);
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 17) + 1);
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 17) - 1);
  };

  // Initialize Map and Places Search Autocomplete
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    // Check if we have cached coords from session
    try {
      const cached = sessionStorage.getItem("last_web_coords");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.lat && parsed.lng) {
          setCoords({ lat: parsed.lat, lng: parsed.lng });
        }
      }
    } catch {}

    const initMap = () => {
      if (!mapContainerRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: coords.lat, lng: coords.lng },
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: "greedy",
        mapTypeId: mapType,
      });

      mapInstanceRef.current = map;
      setIsLoadingMap(false);

      // Attach Google Places Autocomplete if search input exists
      if (searchInputRef.current && window.google.maps.places) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(
            searchInputRef.current,
            {
              componentRestrictions: { country: "in" },
              fields: ["geometry", "formatted_address", "name"],
            }
          );
          autocompleteRef.current = autocomplete;

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              setCoords({ lat, lng });
              map.panTo({ lat, lng });
              map.setZoom(17);
              reverseGeocodeCoords(lat, lng);
            }
          });
        } catch (e) {
          console.warn("Places autocomplete init notice:", e);
        }
      }

      // Reverse geocode when map center moves
      map.addListener("idle", () => {
        const center = map.getCenter();
        if (!center) return;
        const lat = center.lat();
        const lng = center.lng();
        setCoords({ lat, lng });

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          if (isMounted) reverseGeocodeCoords(lat, lng);
        }, 250);
      });

      // Quick auto-center on first open
      recenterGPS();
    };

    if (window.google?.maps) {
      initMap();
    } else {
      const apiKey =
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "AIzaSyBejehWWHi-GPuqK8V6v2F8sKt_P0ap_oc";
      const existingScript = document.getElementById("google-maps-script");

      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (isMounted) initMap();
        };
        document.head.appendChild(script);
      } else {
        const interval = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(interval);
            if (isMounted) initMap();
          }
        }, 150);
      }
    }

    return () => {
      isMounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="relative w-full max-w-2xl h-[92vh] max-h-[750px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header with Authentic Google Maps Branding */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-xs">
              <GoogleMapsLogo size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-[#052a51] tracking-tight">
                  Google Maps Location Picker
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Official Live
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                Drag map to pin your exact building gate, tower or site
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer"
            title="Close Map"
          >
            <X size={18} />
          </button>
        </div>

        {/* Map Viewport Area */}
        <div className="relative flex-1 w-full bg-[#E5E3DF] overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Floating Search Autocomplete Bar (Blinkit Style) */}
          <div ref={searchContainerRef} className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[420px] z-30">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl border border-gray-200/90 px-3.5 py-2.5 gap-2.5 transition-all focus-within:ring-2 focus-within:ring-[#F26522]/30 focus-within:border-[#F26522]">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (predictions.length > 0) setShowPredictions(true);
                }}
                placeholder="Search area, apartment, street or landmark..."
                className="w-full text-xs font-bold text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
              {isSearching && <Loader2 size={14} className="animate-spin text-[#F26522] shrink-0" />}
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setPredictions([]);
                    setShowPredictions(false);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              ) : null}
            </div>

            {/* Blinkit-Style Live Predictions Dropdown */}
            {showPredictions && (
              <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden divide-y divide-gray-100 max-h-[320px] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                {/* 1. Use Current Location Quick Action (Blinkit pattern) */}
                <button
                  type="button"
                  onClick={() => {
                    setShowPredictions(false);
                    recenterGPS();
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-orange-50/60 active:bg-orange-100/60 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#F26522] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Crosshair size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-[#F26522]">Use current location</p>
                    <p className="text-[10px] text-gray-400">Using GPS • High accuracy</p>
                  </div>
                </button>

                {/* 2. Predictions List */}
                {predictions.map((p) => (
                  <button
                    key={p.placeId}
                    type="button"
                    onClick={() => handleSelectPrediction(p)}
                    className="w-full px-4 py-3 flex items-start gap-3 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 group-hover:bg-[#052a51] group-hover:text-white flex items-center justify-center shrink-0 transition-colors mt-0.5">
                      <MapPin size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-[#052a51] truncate group-hover:text-[#F26522] transition-colors">
                        {p.mainText}
                      </p>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                        {p.secondaryText || p.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Type Switcher (Roadmap / Satellite) */}
          <div className="absolute top-3 right-3 z-30 hidden sm:block">
            <button
              type="button"
              onClick={toggleMapType}
              className="px-3 py-2 bg-white/95 hover:bg-white text-[#052a51] rounded-2xl shadow-lg border border-gray-200 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              title="Toggle Satellite View"
            >
              <Layers size={14} className="text-[#4285F4]" />
              <span>{mapType === "roadmap" ? "Satellite" : "Map"}</span>
            </button>
          </div>

          {/* Floating Custom Zoom Controls (+ / -) */}
          <div className="absolute right-3 top-16 z-30 flex flex-col rounded-2xl bg-white shadow-lg border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-50 border-b border-gray-100 cursor-pointer active:scale-90 transition-transform"
              title="Zoom In"
            >
              <Plus size={16} />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-9 h-9 flex items-center justify-center text-gray-700 hover:bg-gray-50 cursor-pointer active:scale-90 transition-transform"
              title="Zoom Out"
            >
              <Minus size={16} />
            </button>
          </div>

          {/* Loading Indicator */}
          {isLoadingMap && (
            <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-40">
              <Loader2 size={32} className="animate-spin text-[#052a51]" />
              <p className="text-xs font-extrabold text-gray-700">Loading Google Maps...</p>
            </div>
          )}

          {/* Center Pin Overlay (Fixed to exact center of map) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-30 flex flex-col items-center select-none">
            {/* Delivery Guide Pill */}
            <div className="px-3.5 py-1.5 bg-[#052a51] text-white text-[11px] font-extrabold rounded-full shadow-xl mb-1.5 whitespace-nowrap flex items-center gap-1.5 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Deliver Here</span>
              <span className="text-[10px] text-white/70 font-semibold">• Doorstep</span>
            </div>

            {/* Authentic Google 4-Color Pin */}
            <div className="relative drop-shadow-md">
              <svg width="44" height="44" viewBox="0 0 48 48">
                <path
                  d="M24 4C14.06 4 6 12.06 6 22c0 7.7 5.02 14.23 12.06 16.71L24 44l5.94-5.29C36.98 36.23 42 29.7 42 22c0-9.94-8.06-18-18-18z"
                  fill="#EA4335"
                />
                <path
                  d="M24 4c-9.94 0-18 8.06-18 18 0 7.7 5.02 14.23 12.06 16.71L24 44V22H6.1c.14-1.39.46-2.73.95-4L24 4z"
                  fill="#4285F4"
                />
                <path d="M24 4v18h17.9c-.14-1.39-.46-2.73-.95-4L24 4z" fill="#FBBC04" />
                <path d="M24 22v22l5.94-5.29C36.98 36.23 42 29.7 42 22H24z" fill="#34A853" />
                <circle cx="24" cy="22" r="7" fill="#ffffff" />
              </svg>
            </div>

            {/* Realistic Ground Shadow */}
            <div className="w-5 h-2 bg-black/35 rounded-full blur-[1.5px] mt-[-4px]" />
          </div>

          {/* Floating Recenter GPS Button */}
          <button
            type="button"
            onClick={recenterGPS}
            disabled={isLocating}
            className="absolute right-3.5 bottom-3.5 w-11 h-11 bg-white hover:bg-gray-50 text-[#052a51] rounded-2xl shadow-xl border border-gray-200 flex items-center justify-center transition-all cursor-pointer z-30 active:scale-95"
            title="Recenter to My GPS Location"
          >
            {isLocating ? (
              <Navigation size={18} className="animate-pulse text-[#4285F4]" />
            ) : (
              <Crosshair size={20} className="text-[#052a51]" />
            )}
          </button>

          {/* Authentic Google Bottom Watermark */}
          <div className="absolute left-3 bottom-2 z-20 pointer-events-none flex items-center gap-1.5 opacity-80">
            <span className="text-[11px] font-bold text-gray-700 tracking-tight bg-white/70 px-1.5 py-0.5 rounded-sm backdrop-blur-xs">
              Google Maps
            </span>
          </div>
        </div>

        {/* Bottom Location Confirmation Card (Human Centric) */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 z-10 shadow-lg">
          {/* Quick Label Selector (Home / Work / Site / Other) */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
              Tag Location:
            </span>
            {(["Home", "Work", "Site", "Other"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setSelectedLabel(l)}
                className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedLabel === l
                    ? "bg-[#052a51] text-white shadow-xs scale-102"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {l === "Home" && <span>🏠</span>}
                {l === "Work" && <span>💼</span>}
                {l === "Site" && <span>🏗️</span>}
                {l === "Other" && <span>🏢</span>}
                <span>{l}</span>
              </button>
            ))}
          </div>

          {/* Address Details Row */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 mt-0.5 text-[#F26522] shadow-xs">
              <MapPin size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-[#052a51] truncate">
                  {addressDetails.area || addressDetails.street || "Pinned Location"}
                </span>
                {isReverseGeocoding ? (
                  <span className="text-[10px] font-bold text-[#052a51] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    Detecting...
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check size={10} />
                    GPS Accurate
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                {addressDetails.formattedAddress}
              </p>
            </div>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={() => {
              onConfirmLocation({ ...addressDetails, label: selectedLabel });
              onClose();
            }}
            disabled={isReverseGeocoding}
            className="w-full h-12 bg-gradient-to-r from-[#052a51] to-[#0a3d74] hover:from-[#041f3d] hover:to-[#052a51] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Check size={18} className="text-white" />
            <span>Confirm Delivery Location & Enter Door Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
