/**
 * P0-2: Backfill Address Coordinates Script
 * 
 * Safely resolves and updates missing coordinates for existing Address records.
 * Rules:
 * 1. Supports --dry-run (default is dry-run unless --execute is specified).
 * 2. Never overwrites existing non-null coordinates.
 * 3. Addresses that cannot be geocoded remain null (fallback to default listing order).
 * 4. Logs detailed counts: scanned, needs_backfill, resolved, updated, skipped.
 * 
 * Usage:
 *   npx tsx scripts/backfill-address-coordinates.ts --dry-run
 *   npx tsx scripts/backfill-address-coordinates.ts --execute
 */

import { prisma } from "../lib/prisma";

// Curated Bangalore / Karnataka pincode centroid map for fast, deterministic local geocoding
const PINCODE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "560001": { lat: 12.9784, lng: 77.6046 }, // MG Road / Tasker Town
  "560002": { lat: 12.9622, lng: 77.5857 }, // City Market
  "560003": { lat: 13.0035, lng: 77.5714 }, // Malleswaram
  "560004": { lat: 12.9438, lng: 77.5738 }, // Basavanagudi
  "560008": { lat: 12.9719, lng: 77.6206 }, // Halasuru
  "560011": { lat: 12.9254, lng: 77.5938 }, // Jayanagar
  "560025": { lat: 12.9667, lng: 77.6083 }, // Richmond Town
  "560027": { lat: 12.9566, lng: 77.5946 }, // Wilson Garden
  "560034": { lat: 12.9279, lng: 77.6271 }, // Koramangala
  "560038": { lat: 12.9784, lng: 77.6408 }, // Indiranagar
  "560068": { lat: 12.8997, lng: 77.6245 }, // Bommanahalli / Begur Road
  "560076": { lat: 12.8912, lng: 77.6001 }, // Bannerghatta Road / Hulimavu
  "560078": { lat: 12.9063, lng: 77.5857 }, // JP Nagar
  "560095": { lat: 12.9352, lng: 77.6245 }, // Koramangala 8th Block
  "560100": { lat: 12.8452, lng: 77.6602 }, // Electronic City Phase 1
  "560102": { lat: 12.9121, lng: 77.6446 }, // HSR Layout
  "560103": { lat: 12.9352, lng: 77.6946 }, // Bellandur / Outer Ring Road
  "560114": { lat: 12.8797, lng: 77.6321 }, // Begur / Hongasandra (IntriHub Central Supply Hub)
};

async function geocodeAddress(addr: {
  pincode?: string | null;
  postalCode?: string | null;
  city?: string | null;
  area?: string | null;
  street?: string | null;
}): Promise<{ lat: number; lng: number } | null> {
  const pin = (addr.pincode || addr.postalCode || "").trim().slice(0, 6);
  if (pin && PINCODE_COORDINATES[pin]) {
    return PINCODE_COORDINATES[pin];
  }

  // Fallback to Google Geocoding if API key is present
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const query = [addr.street, addr.area, addr.city, pin, "India"].filter(Boolean).join(", ");
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
        return {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng,
        };
      }
    } catch (e) {
      // Quiet fail to fallback
    }
  }

  return null;
}

export async function runBackfill(options: { dryRun?: boolean } = {}) {
  const isDryRun = options.dryRun !== false;

  console.log("==================================================");
  console.log(`🗺️  ADDRESS COORDINATES BACKFILL (${isDryRun ? "DRY RUN" : "EXECUTE MODE"})`);
  console.log("==================================================\n");

  const addresses = await prisma.address.findMany({
    select: {
      id: true,
      street: true,
      area: true,
      city: true,
      pincode: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      source: true,
    },
  });

  let totalScanned = addresses.length;
  let alreadyHasCoords = 0;
  let needsBackfill = 0;
  let resolved = 0;
  let unresolvable = 0;
  let updated = 0;

  for (const addr of addresses) {
    if (addr.latitude !== null && addr.longitude !== null) {
      alreadyHasCoords++;
      continue;
    }

    needsBackfill++;
    const coords = await geocodeAddress(addr);

    if (coords) {
      resolved++;
      if (!isDryRun) {
        await prisma.address.update({
          where: { id: addr.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
            accuracy: 500, // Centroid accuracy
            source: "GEOCODE_BACKFILL",
          },
        });
        updated++;
      }
    } else {
      unresolvable++;
    }
  }

  console.log("--------------------------------------------------");
  console.log("📊 BACKFILL SUMMARY REPORT:");
  console.log(`  Total scanned addresses:     ${totalScanned}`);
  console.log(`  Already had valid coords:    ${alreadyHasCoords}`);
  console.log(`  Missing coords:              ${needsBackfill}`);
  console.log(`  Successfully resolved:       ${resolved}`);
  console.log(`  Could not resolve (skipped): ${unresolvable}`);
  console.log(`  Records updated in DB:       ${isDryRun ? 0 : updated}`);
  console.log("--------------------------------------------------\n");

  return {
    isDryRun,
    totalScanned,
    alreadyHasCoords,
    needsBackfill,
    resolved,
    unresolvable,
    updated: isDryRun ? 0 : updated,
  };
}

if (require.main === module) {
  const isExecute = process.argv.includes("--execute");
  const isDryRun = !isExecute || process.argv.includes("--dry-run");

  runBackfill({ dryRun: isDryRun })
    .then(() => {
      console.log("✨ Backfill script finished cleanly.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Backfill script failed:", err);
      process.exit(1);
    });
}
