/**
 * IntriHub Universal Location & Delivery Navigation Service
 * Provider-independent abstraction for Geocoding, Reverse Geocoding,
 * Road Distance calculation, and Delivery Routing.
 */

import { Coordinates, GeocodedAddress, RouteResult, LocationSource } from "./types";

const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY || process.env.NEXT_PUBLIC_LOCATIONIQ_API_KEY || "";
const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY || "";
const OSRM_ROUTING_BASE = process.env.OSRM_ROUTING_URL || "https://router.project-osrm.org";

export class LocationService {
  /**
   * Search / Autocomplete address suggestions
   */
  static async geocode(
    query: string,
    options?: { countryCode?: string; viewbox?: string; limit?: number }
  ): Promise<GeocodedAddress[]> {
    if (!query || query.trim().length < 2) return [];
    const cleanQuery = query.trim();
    const limit = options?.limit || 6;
    const countryCode = options?.countryCode || "in";

    // 1. Try LocationIQ Autocomplete if key is available
    if (LOCATIONIQ_API_KEY) {
      try {
        const url = `https://api.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(
          cleanQuery
        )}&countrycodes=${countryCode}&limit=${limit}&format=json&addressdetails=1`;

        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            return data.map((item: any) => this.normalizeLocationIqAddress(item, "SEARCH"));
          }
        }
      } catch (err) {
        console.warn("LocationIQ autocomplete failed, trying fallback:", err);
      }
    }

    // 2. Fallback: Photon OpenStreetMap search mirror (Fast, free, reliable in India)
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        cleanQuery
      )}&limit=${limit}&lang=en&lat=12.9716&lon=77.5946`; // biased towards India

      const res = await fetch(photonUrl, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        if (data.features && Array.isArray(data.features) && data.features.length > 0) {
          return data.features.map((feat: any) => {
            const props = feat.properties || {};
            const coords = feat.geometry?.coordinates || [77.5946, 12.9716];
            const name = props.name || "";
            const street = props.street || "";
            const area = props.district || props.suburb || props.locality || "";
            const city = props.city || props.county || "Bangalore";
            const state = props.state || "Karnataka";
            const postcode = props.postcode || "";
            const country = props.country || "India";

            const parts = [name, street, area, city, state, postcode].filter(Boolean);
            const formatted = parts.join(", ") || `${coords[1]}, ${coords[0]}`;

            return {
              formattedAddress: formatted,
              houseNumber: props.housenumber || "",
              street: street || name,
              area: area,
              city: city,
              state: state,
              country: country,
              postalCode: postcode,
              latitude: Number(coords[1]),
              longitude: Number(coords[0]),
              source: "SEARCH" as LocationSource,
              placeId: String(props.osm_id || Math.random()),
            };
          }).filter((item: any) => !countryCode || countryCode.toLowerCase() !== "in" || item.country.toLowerCase() === "india" || item.state.toLowerCase().includes("karnataka") || item.city.toLowerCase().includes("bangalore") || item.city.toLowerCase().includes("bengaluru"));
        }
      }
    } catch (err) {
      console.error("Photon search fallback failed:", err);
    }

    return [];
  }

  /**
   * Reverse Geocoding: Convert GPS / Map Pin Coordinates to human-readable address.
   * CRITICAL: Never fails to return coordinates even if external geocoding API errors out.
   */
  static async reverseGeocode(
    latitude: number,
    longitude: number,
    accuracy?: number,
    source: LocationSource = "GPS"
  ): Promise<GeocodedAddress> {
    const fallbackAddress: GeocodedAddress = {
      formattedAddress: `Location at (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      street: `Pin Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
      area: "Current Map Pin",
      city: "Bangalore",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      latitude,
      longitude,
      accuracy,
      source,
    };

    // 1. Try LocationIQ Reverse Geocoding if API key is present
    if (LOCATIONIQ_API_KEY) {
      try {
        const url = `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_API_KEY}&lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            return this.normalizeLocationIqAddress(data, source, accuracy);
          }
        }
      } catch (err) {
        console.warn("LocationIQ reverse geocode failed, using BigDataCloud fallback:", err);
      }
    }

    // 2. Fallback: BigDataCloud Free Client-Safe Reverse Geocoding API
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
      const res = await fetch(bdcUrl, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || data.principalSubdivision || "";
        const city = data.city || data.localityInfo?.administrative?.[2]?.name || "Bangalore";
        const state = data.principalSubdivision || "Karnataka";
        const postcode = data.postcode || "";
        const country = data.countryName || "India";

        const parts = [locality, city, state, postcode].filter(Boolean);
        const formatted = parts.join(", ") || fallbackAddress.formattedAddress;

        return {
          formattedAddress: formatted,
          street: locality || "Pin Location",
          area: locality,
          city: city,
          state: state,
          country: country,
          postalCode: postcode,
          latitude,
          longitude,
          accuracy,
          source,
        };
      }
    } catch (err) {
      console.warn("BigDataCloud reverse geocode failed:", err);
    }

    // 3. Coordinate Preservation Fallback
    return fallbackAddress;
  }

  /**
   * Calculate Driving Route, Road Distance, and Duration via OSRM
   */
  static async calculateRoute(
    origin: Coordinates,
    destination: Coordinates,
    profile: "driving" | "bike" | "truck" | "walking" = "driving"
  ): Promise<RouteResult> {
    const straightDist = this.calculateStraightLineDistance(origin, destination);

    try {
      const osrmProfile = profile === "walking" ? "foot" : "car";
      const url = `${OSRM_ROUTING_BASE}/route/v1/${osrmProfile}/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=polyline&steps=true`;

      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.ok) {
        const data = await res.json();
        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const distKm = Math.round((route.distance / 1000) * 10) / 10;
          const durMins = Math.ceil(route.duration / 60);

          const steps = (route.legs?.[0]?.steps || []).map((s: any) => ({
            instruction: s.maneuver?.type ? `${s.maneuver.type} onto ${s.name || "road"}` : s.name || "Proceed",
            distanceMeters: Math.round(s.distance),
            durationSeconds: Math.round(s.duration),
            name: s.name,
          }));

          return {
            distanceKm: distKm,
            durationMinutes: durMins,
            polyline: route.geometry,
            steps,
            provider: "OSRM",
            profile,
          };
        }
      }
    } catch (err) {
      console.warn("OSRM road calculation failed, falling back to estimated road model:", err);
    }

    // Estimated Road Fallback (1.35x road circuity factor over straight line)
    const estimatedRoadKm = Math.round(straightDist * 1.35 * 10) / 10;
    const estimatedDuration = Math.max(5, Math.ceil(estimatedRoadKm * 2.5)); // ~25 km/h urban speed

    return {
      distanceKm: estimatedRoadKm,
      durationMinutes: estimatedDuration,
      provider: "Estimated (Haversine)",
      profile,
    };
  }

  /**
   * Straight Line Haversine Distance (in Kilometers)
   */
  static calculateStraightLineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(coord2.latitude - coord1.latitude);
    const dLon = this.deg2rad(coord2.longitude - coord1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.latitude)) *
        Math.cos(this.deg2rad(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  /**
   * Generates Google Maps Turn-by-Turn Navigation URL using exact coordinates
   */
  static getGoogleMapsNavUrl(latitude: number, longitude: number, destinationLabel?: string): string {
    const labelParam = destinationLabel ? `&query_place_id=${encodeURIComponent(destinationLabel)}` : "";
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}${labelParam}`;
  }

  /**
   * Generates Apple Maps Turn-by-Turn Navigation URL using exact coordinates
   */
  static getAppleMapsNavUrl(latitude: number, longitude: number, destinationLabel?: string): string {
    const labelParam = destinationLabel ? `&q=${encodeURIComponent(destinationLabel)}` : "";
    return `maps://?daddr=${latitude},${longitude}${labelParam}`;
  }

  private static normalizeLocationIqAddress(item: any, source: LocationSource, accuracy?: number): GeocodedAddress {
    const addr = item.address || {};
    const houseNumber = addr.house_number || addr.building || "";
    const buildingName = addr.building || addr.residential || addr.complex || "";
    const road = addr.road || addr.street || addr.pedestrian || "";
    const area = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || "";
    const city = addr.city || addr.town || addr.municipality || "Bangalore";
    const district = addr.state_district || addr.county || "";
    const state = addr.state || "Karnataka";
    const country = addr.country || "India";
    const postalCode = addr.postcode || "";

    const parts = [
      houseNumber,
      buildingName,
      road,
      area,
      city,
      state,
      postalCode,
    ].filter(Boolean);

    const formatted = item.display_name || parts.join(", ");

    return {
      formattedAddress: formatted,
      houseNumber,
      buildingName,
      street: road || buildingName || "Main Road",
      area,
      city,
      district,
      state,
      country,
      postalCode,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      accuracy,
      source,
      placeId: String(item.place_id || item.osm_id || ""),
    };
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
