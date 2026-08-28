/**
 * Universal Location & Navigation Types for IntriHub
 */

export type LocationSource = "GPS" | "MAP_PIN" | "SEARCH" | "MANUAL";

export type AccuracyLevel = "GOOD" | "ACCEPTABLE" | "APPROXIMATE" | "LOW_ACCURACY";

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // in meters
  source?: LocationSource;
  timestamp?: number;
}

export interface GeocodedAddress {
  formattedAddress: string;
  houseNumber?: string;
  buildingName?: string;
  floor?: string;
  street?: string;
  road?: string;
  neighborhood?: string;
  area?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: LocationSource;
  deliveryInstructions?: string;
  placeId?: string;
}

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  durationSeconds: number;
  name?: string;
}

export interface RouteResult {
  distanceKm: number;
  durationMinutes: number;
  polyline?: string;
  geometry?: any;
  steps?: RouteStep[];
  provider: string;
  profile: "driving" | "bike" | "truck" | "walking";
}

export interface LocationAccuracyInterpretation {
  level: AccuracyLevel;
  label: string;
  description: string;
  badgeColor: string;
  needsAdjustment: boolean;
}

export function interpretAccuracy(accuracyMeters?: number | null): LocationAccuracyInterpretation {
  if (accuracyMeters === undefined || accuracyMeters === null) {
    return {
      level: "APPROXIMATE",
      label: "Estimated Location",
      description: "Please confirm your pin position on the map.",
      badgeColor: "#F59E0B",
      needsAdjustment: false,
    };
  }

  if (accuracyMeters <= 15) {
    return {
      level: "GOOD",
      label: "Precise GPS (±15m)",
      description: "High accuracy building-level positioning.",
      badgeColor: "#10B981",
      needsAdjustment: false,
    };
  }

  if (accuracyMeters <= 50) {
    return {
      level: "ACCEPTABLE",
      label: "Street-Level GPS (±50m)",
      description: "Good accuracy. Adjust pin if needed.",
      badgeColor: "#3B82F6",
      needsAdjustment: false,
    };
  }

  if (accuracyMeters <= 100) {
    return {
      level: "APPROXIMATE",
      label: "Approximate (±100m)",
      description: "Please adjust the pin to your exact delivery location.",
      badgeColor: "#F59E0B",
      needsAdjustment: true,
    };
  }

  return {
    level: "LOW_ACCURACY",
    label: "Low GPS Accuracy (>100m)",
    description: "Your location accuracy is low. Please drag the pin to your exact gate/door.",
    badgeColor: "#EF4444",
    needsAdjustment: true,
  };
}
