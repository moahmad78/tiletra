/**
 * IntriHub — Geo-Fencing Utility Library
 *
 * Pure, dependency-free distance calculations.
 * No API calls, no side effects — runs synchronously in <1ms per pair.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates the straight-line ("as the crow flies") distance between two
 * geographic coordinates using the Haversine formula.
 *
 * @returns Distance in kilometres (always positive)
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Given a reference point and a list of candidates with lat/lng,
 * returns the candidate closest to the reference, or null if the list is empty.
 */
export function findNearest<T extends { latitude: number | null; longitude: number | null }>(
  refLat: number,
  refLng: number,
  candidates: T[]
): { candidate: T; distanceKm: number } | null {
  let best: { candidate: T; distanceKm: number } | null = null;

  for (const candidate of candidates) {
    if (candidate.latitude == null || candidate.longitude == null) continue;

    const dist = haversineDistanceKm(refLat, refLng, candidate.latitude, candidate.longitude);
    if (best === null || dist < best.distanceKm) {
      best = { candidate, distanceKm: dist };
    }
  }

  return best;
}

/**
 * Filters a list of candidates to only those within a given radius (km).
 */
export function filterWithinRadius<T extends { latitude: number | null; longitude: number | null }>(
  refLat: number,
  refLng: number,
  candidates: T[],
  radiusKm: number
): Array<{ candidate: T; distanceKm: number }> {
  return candidates
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => ({
      candidate: c,
      distanceKm: haversineDistanceKm(refLat, refLng, c.latitude!, c.longitude!),
    }))
    .filter(({ distanceKm }) => distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
