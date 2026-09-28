import { create } from "zustand";
import * as Location from "expo-location";
import { GOOGLE_MAPS_API_KEY } from "../constants/config";

export interface DetectedLocation {
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

interface LocationStoreState {
  cachedLocation: DetectedLocation | null;
  coords: { latitude: number; longitude: number } | null;
  isDetecting: boolean;
  lastFetchedAt: number | null;
  prefetchLocation: () => Promise<DetectedLocation | null>;
  getQuickLocation: (forceRefresh?: boolean) => Promise<DetectedLocation | null>;
}

// In-flight promise to prevent duplicate concurrent geocode requests
let inFlightPromise: Promise<DetectedLocation | null> | null = null;

async function resolveAddressFromCoords(
  latitude: number,
  longitude: number
): Promise<DetectedLocation> {
  let detectedStreet = "";
  let detectedArea = "";
  let detectedCity = "Bengaluru";
  let detectedState = "Karnataka";
  let detectedPincode = "";
  let detectedHouse = "";
  let detectedLandmark = "";
  let formattedAddress = "";

  // 1. Google Maps Geocoding API
  let googleSuccess = false;
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}&region=in`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const data = await res.json();
      if (data.status === "OK" && data.results?.[0]) {
        formattedAddress = data.results[0].formatted_address || "";
        for (const comp of data.results[0].address_components || []) {
          const types = comp.types || [];
          if (types.includes("street_number")) detectedHouse = comp.long_name;
          if (types.includes("route")) detectedStreet = comp.long_name;
          if (types.includes("sublocality_level_1") || types.includes("neighborhood")) {
            detectedArea = comp.long_name;
          } else if (types.includes("sublocality_level_2") && !detectedArea) {
            detectedArea = comp.long_name;
          }
          if (types.includes("point_of_interest") || types.includes("establishment")) {
            detectedLandmark = comp.long_name;
          }
          if (types.includes("postal_code")) detectedPincode = comp.long_name;
          if (types.includes("locality")) {
            detectedCity = comp.long_name;
          } else if (
            !detectedCity &&
            (types.includes("administrative_area_level_2") || types.includes("postal_town"))
          ) {
            detectedCity = comp.long_name;
          }
          if (types.includes("administrative_area_level_1")) detectedState = comp.long_name;
        }
        googleSuccess = true;
      }
    } catch (gErr) {
      console.warn("[locationStore] Google geocode timeout/error, using fallback:", gErr);
    }
  }

  // 2. Native Expo reverse-geocode fallback if needed
  if (!googleSuccess || (!detectedStreet && !detectedArea)) {
    try {
      const [nativeAddr] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (nativeAddr) {
        detectedStreet = nativeAddr.street || nativeAddr.name || detectedStreet;
        detectedArea = nativeAddr.subregion || nativeAddr.district || detectedArea;
        if (nativeAddr.city) detectedCity = nativeAddr.city;
        if (nativeAddr.region) detectedState = nativeAddr.region;
        if (nativeAddr.postalCode) detectedPincode = nativeAddr.postalCode;
      }
    } catch (nErr) {
      console.warn("[locationStore] Native reverseGeocode notice:", nErr);
    }
  }

  if (!formattedAddress) {
    formattedAddress = [
      detectedHouse,
      detectedStreet,
      detectedArea,
      detectedCity,
      detectedPincode ? `PIN: ${detectedPincode}` : null,
    ]
      .filter(Boolean)
      .join(", ");
  }

  return {
    street: detectedStreet,
    area: detectedArea,
    city: detectedCity,
    state: detectedState,
    pincode: detectedPincode,
    houseNumber: detectedHouse,
    landmark: detectedLandmark,
    formattedAddress,
    latitude,
    longitude,
  };
}

export const useLocationStore = create<LocationStoreState>((set, get) => ({
  cachedLocation: null,
  coords: null,
  isDetecting: false,
  lastFetchedAt: null,

  /**
   * Called silently on app launch / splash screen.
   * Gets cached GPS position or high-speed position and resolves address into store.
   */
  prefetchLocation: async () => {
    if (inFlightPromise) {
      return inFlightPromise;
    }

    inFlightPromise = (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== "granted") {
          return null;
        }

        set({ isDetecting: true });

        // 1. Instant check from hardware location cache (< 10ms)
        let pos = await Location.getLastKnownPositionAsync({
          maxAge: 15 * 60 * 1000,
        });

        // 2. If no last known, get current position with fast timeout
        if (!pos) {
          pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
        }

        if (!pos?.coords) {
          set({ isDetecting: false });
          return null;
        }

        const { latitude, longitude } = pos.coords;
        set({ coords: { latitude, longitude } });

        const resolved = await resolveAddressFromCoords(latitude, longitude);

        set({
          cachedLocation: resolved,
          lastFetchedAt: Date.now(),
          isDetecting: false,
        });

        return resolved;
      } catch (err) {
        console.warn("[locationStore] prefetchLocation notice:", err);
        set({ isDetecting: false });
        return null;
      } finally {
        inFlightPromise = null;
      }
    })();

    return inFlightPromise;
  },

  /**
   * Called when user taps "Use Current Location".
   * Returns cached location IMMEDIATELY if fresh (< 10 mins).
   * Otherwise requests permission & resolves location fast using lastKnown position first.
   */
  getQuickLocation: async (forceRefresh = false) => {
    const state = get();

    // 1. If fresh cache exists and forceRefresh is false, return INSTANTLY (0ms)
    if (
      !forceRefresh &&
      state.cachedLocation &&
      state.lastFetchedAt &&
      Date.now() - state.lastFetchedAt < 10 * 60 * 1000
    ) {
      return state.cachedLocation;
    }

    // 2. If background prefetch is already running, wait for it
    if (inFlightPromise) {
      const awaited = await inFlightPromise;
      if (awaited) return awaited;
    }

    // 3. User initiated explicit fetch: request permission if not granted
    set({ isDetecting: true });
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        set({ isDetecting: false });
        return null;
      }

      // Fast-path: Check last known position first (instant response)
      let pos = await Location.getLastKnownPositionAsync({
        maxAge: 10 * 60 * 1000,
      });

      // If no cached position, get quick current position
      if (!pos) {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }

      if (!pos?.coords) {
        set({ isDetecting: false });
        return null;
      }

      const { latitude, longitude } = pos.coords;
      set({ coords: { latitude, longitude } });

      const resolved = await resolveAddressFromCoords(latitude, longitude);

      set({
        cachedLocation: resolved,
        lastFetchedAt: Date.now(),
        isDetecting: false,
      });

      return resolved;
    } catch (err) {
      console.warn("[locationStore] getQuickLocation error:", err);
      set({ isDetecting: false });
      return null;
    }
  },
}));
