"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, MapPin, Check, Crosshair, Sparkles, Loader2 } from "lucide-react";

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

export default function WebMapPickerModal({
  isOpen,
  onClose,
  onConfirmLocation,
  initialLat = 12.9716,
  initialLng = 77.5946,
}: WebMapPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [coords, setCoords] = useState({ lat: initialLat, lng: initialLng });
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
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

  const recenterGPS = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: latitude, lng: longitude });
          mapInstanceRef.current.setZoom(17);
        }
        reverseGeocodeCoords(latitude, longitude);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Initialize Map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initMap = () => {
      if (!mapContainerRef.current || !window.google?.maps) return;

      const map = new window.google.maps.Map(mapContainerRef.current, {
        center: { lat: coords.lat, lng: coords.lng },
        zoom: 17,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
      });

      mapInstanceRef.current = map;
      setIsLoadingMap(false);

      map.addListener("idle", () => {
        const center = map.getCenter();
        if (!center) return;
        const lat = center.lat();
        const lng = center.lng();
        setCoords({ lat, lng });

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          if (isMounted) reverseGeocodeCoords(lat, lng);
        }, 300);
      });

      // Attempt GPS auto-center on first open
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
        }, 200);
      }
    }

    return () => {
      isMounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="relative w-full max-w-2xl h-[90vh] max-h-[700px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-white z-10">
          <div>
            <h3 className="text-base font-black text-[#052a51] flex items-center gap-2">
              <MapPin size={18} className="text-[#F26522]" />
              Select Exact Delivery Point
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Drag map to pin your site, gate or entrance</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Map Viewport Area */}
        <div className="relative flex-1 w-full bg-gray-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Loading Indicator */}
          {isLoadingMap && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 z-20">
              <Loader2 size={32} className="animate-spin text-[#052a51]" />
              <p className="text-xs font-bold text-gray-600">Loading Google Maps...</p>
            </div>
          )}

          {/* Center Pin Overlay (Fixed to center of map) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-30 flex flex-col items-center select-none">
            <div className="px-3 py-1 bg-[#052a51] text-white text-[11px] font-black rounded-full shadow-lg mb-1 whitespace-nowrap animate-bounce flex items-center gap-1">
              <Sparkles size={11} className="text-[#F26522]" />
              <span>Deliver here</span>
            </div>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="#F26522" stroke="#ffffff" strokeWidth="1.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" fill="#ffffff" />
            </svg>
            <div className="w-3.5 h-1.5 bg-black/30 rounded-full mt-[-3px]" />
          </div>

          {/* Floating Recenter GPS Button */}
          <button
            type="button"
            onClick={recenterGPS}
            disabled={isLocating}
            className="absolute right-4 bottom-4 w-11 h-11 bg-white hover:bg-gray-50 text-[#052a51] rounded-2xl shadow-lg border border-gray-200 flex items-center justify-center transition-all cursor-pointer z-30 active:scale-95"
            title="Recenter to My GPS Location"
          >
            {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Crosshair size={20} />}
          </button>
        </div>

        {/* Bottom Location Confirmation Card */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-100 z-10 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F26522]/10 flex items-center justify-center shrink-0 mt-0.5 text-[#F26522]">
              <MapPin size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#052a51] truncate">
                  {addressDetails.area || addressDetails.street || "Pinned Location"}
                </span>
                {isReverseGeocoding ? (
                  <span className="text-[10px] font-bold text-[#052a51] bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Loader2 size={10} className="animate-spin" />
                    Detecting...
                  </span>
                ) : (
                  <span className="text-[10px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                    GPS Accurate
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                {addressDetails.formattedAddress}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onConfirmLocation(addressDetails);
              onClose();
            }}
            disabled={isReverseGeocoding}
            className="w-full h-12 bg-[#052a51] hover:bg-[#041f3d] text-white font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <Check size={16} />
            <span>Confirm Location & Enter Flat Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
