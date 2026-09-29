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
      if (types.includes("street_number")) houseNumber = component.long_name;
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
    };
  } catch (err) {
    console.error("Geocoding failed:", err);
    return null;
  }
}

/**
 * Server-side reverse geocoding using Google Geocoding API.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&region=in`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.[0]) return null;

    const result = data.results[0];

    let pincode: string | undefined;
    let city: string | undefined;
    let state: string | undefined;
    let street: string | undefined;
    let area: string | undefined;
    let houseNumber: string | undefined;
    let landmark: string | undefined;

    for (const component of result.address_components || []) {
      const types = component.types || [];
      if (types.includes("street_number")) houseNumber = component.long_name;
      if (types.includes("route")) street = component.long_name;
      if (types.includes("sublocality_level_1") || types.includes("neighborhood")) {
        area = component.long_name;
      } else if (types.includes("sublocality_level_2") && !area) {
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

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address,
      placeId: result.place_id,
      pincode,
      city: city || "Bengaluru",
      state: state || "Karnataka",
      street: street || "",
      area: area || "",
      houseNumber: houseNumber || "",
      landmark: landmark || "",
    };
  } catch (err) {
    console.error("Reverse geocoding failed:", err);
    return null;
  }
}
