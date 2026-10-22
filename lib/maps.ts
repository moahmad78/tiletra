/**
 * IntriHub Google Maps Integration Utilities
 * Supports client-side Places autocomplete, geocoding, reverse geocoding, and distance matrix.
 */

export function getGoogleMapsApiKey(): string {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    ""
  );
}

export function getGoogleMapsScriptUrl(libraries: string[] = ["places"]): string {
  const apiKey = getGoogleMapsApiKey();
  const libParam = libraries.length > 0 ? `&libraries=${libraries.join(",")}` : "";
  return `https://maps.googleapis.com/maps/api/js?key=${apiKey}${libParam}&loading=async`;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
  pincode?: string;
  city?: string;
  state?: string;
  street?: string;
  area?: string;
  houseNumber?: string;
  landmark?: string;
  line1?: string;
  line2?: string;
  shortAddress?: string;
}

/**
 * Server-side forward geocoding using Google Geocoding API.
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || !address.trim()) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address.trim()
    )}&key=${apiKey}&region=in`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) return null;

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    let pincode: string | undefined;
    let city: string | undefined;
    let state: string | undefined;
    let street: string | undefined;
    let area: string | undefined;
    let houseNumber: string | undefined;

    for (const component of result.address_components || []) {
      const types = component.types || [];
      if (types.includes("street_number") || types.includes("premise")) houseNumber = component.long_name;
      if (types.includes("route")) street = component.long_name;
      if (types.includes("sublocality_level_1") || types.includes("sublocality") || types.includes("neighborhood")) {
        area = area ? `${area}, ${component.long_name}` : component.long_name;
      }
      if (types.includes("postal_code")) pincode = component.long_name;
      if (types.includes("locality")) city = component.long_name;
      if (types.includes("administrative_area_level_1")) state = component.long_name;
    }

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      pincode,
      city: city || "Bengaluru",
      state: state || "Karnataka",
      street,
      area,
      houseNumber,
      line1: [houseNumber, street, area].filter(Boolean).join(", ") || area || "Current Location",
      shortAddress: [area || street, city].filter(Boolean).join(", "),
    };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

/**
 * Server-side reverse geocoding using Google Geocoding API with high-res components & OSM fallback.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult | null> {
  const apiKey = getGoogleMapsApiKey();

  // 1. Google Maps Geocoding API
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=in`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && data.results?.[0]) {
          const result = data.results[0];

          let pincode: string | undefined;
          let city: string | undefined;
          let state: string | undefined;
          let street: string | undefined;
          let area: string | undefined;
          let neighborhood: string | undefined;
          let sublocality2: string | undefined;
          let houseNumber: string | undefined;
          let landmark: string | undefined;

          for (const component of result.address_components || []) {
            const types = component.types || [];
            if (types.includes("street_number") || types.includes("premise") || types.includes("subpremise")) {
              if (!houseNumber) houseNumber = component.long_name;
            }
            if (types.includes("route")) street = component.long_name;
            if (types.includes("sublocality_level_2")) sublocality2 = component.long_name;
            if (types.includes("neighborhood")) neighborhood = component.long_name;
            if (types.includes("sublocality_level_1")) {
              area = component.long_name;
            } else if (!area && types.includes("sublocality")) {
              area = component.long_name;
            }
            if (types.includes("point_of_interest") || types.includes("establishment")) {
              landmark = component.long_name;
            }
            if (types.includes("postal_code")) pincode = component.long_name;
            if (types.includes("locality")) {
              city = component.long_name;
            } else if (!city && (types.includes("administrative_area_level_2") || types.includes("postal_town"))) {
              city = component.long_name;
            }
            if (types.includes("administrative_area_level_1")) state = component.long_name;
          }

          const resolvedStreet = street || neighborhood || sublocality2 || "";
          const resolvedArea = area || sublocality2 || neighborhood || city || "Bengaluru";
          const resolvedCity = city || "Bengaluru";

          // Format line1 like Flipkart/Zepto: Locality / Area or Street, Area
          const line1Parts = [
            houseNumber,
            resolvedStreet && resolvedStreet !== resolvedArea ? resolvedStreet : null,
            resolvedArea,
          ].filter(Boolean);
          const line1 = line1Parts.join(", ") || resolvedArea;
          const shortAddress = [resolvedArea, resolvedCity].filter(Boolean).join(", ");

          return {
            latitude: lat,
            longitude: lng,
            formattedAddress: result.formatted_address,
            placeId: result.place_id,
            pincode: pincode || "560114",
            city: resolvedCity,
            state: state || "Karnataka",
            street: resolvedStreet,
            area: resolvedArea,
            houseNumber: houseNumber || "",
            landmark: landmark || "",
            line1,
            line2: resolvedArea !== line1 ? resolvedArea : resolvedCity,
            shortAddress,
          };
        }
      }
    } catch (err) {
      console.warn("Google reverse geocoding notice, attempting fallback:", err);
    }
  }

  // 2. OpenStreetMap Nominatim Fallback
  try {
    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: { "User-Agent": "Intrihub-Web/1.0 (info@intrihub.com)" },
      }
    );
    if (osmRes.ok) {
      const data = await osmRes.json();
      const addr = data.address || {};
      const area = addr.suburb || addr.neighbourhood || addr.residential || addr.quarter || addr.city_district || "";
      const street = addr.road || addr.footway || "";
      const city = addr.city || addr.town || addr.county || "Bengaluru";
      const state = addr.state || "Karnataka";
      const pincode = addr.postcode || "560114";
      const houseNumber = addr.house_number || "";

      const resolvedArea = area || street || city;
      const line1 = [houseNumber, street, resolvedArea].filter(Boolean).join(", ") || resolvedArea;
      const shortAddress = [resolvedArea, city].filter(Boolean).join(", ");

      return {
        latitude: lat,
        longitude: lng,
        formattedAddress: data.display_name || `${line1}, ${city}`,
        placeId: `osm_${data.place_id || Date.now()}`,
        pincode,
        city,
        state,
        street,
        area: resolvedArea,
        houseNumber,
        line1,
        line2: resolvedArea,
        shortAddress,
      };
    }
  } catch (osmErr) {
    console.warn("OSM reverse geocode notice:", osmErr);
  }

  return null;
}
