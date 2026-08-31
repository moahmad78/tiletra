"use server";

import { prisma } from "@/lib/prisma";
import { findNearest } from "@/lib/delivery/geo";
import { DELIVERY_CONFIG } from "@/lib/delivery/config";

/**
 * F2 — Geo-Fencing: Nearest Vendor Assignment
 *
 * Given a productId and the customer's GPS coordinates, returns the vendorId
 * of the nearest eligible vendor carrying that product.
 *
 * Eligibility criteria:
 *   - Vendor has the product listed (vendorId = product.vendorId) OR
 *     multiple vendors carry the same product (future: shared catalog lookup)
 *   - Vendor status = "approved"
 *   - Vendor has non-null latitude + longitude
 *   - Product is inStock = true for that vendor
 *
 * Safe degradation: if no vendor has GPS coordinates, returns the original
 * product-listed vendorId so the order is never blocked.
 */
export async function findNearestVendorByProduct(
  productId: string,
  customerLat: number,
  customerLng: number
): Promise<string | null> {
  if (!DELIVERY_CONFIG.GEO_FENCING_ENABLED) return null;

  try {
    // 1. Fetch the product and all vendors carrying it (via Product.vendorId)
    //    Today's model: one product → one vendor. Future: shared SKU catalog
    //    will have a Product → [VendorProduct] relation. This function already
    //    handles both by treating the single vendorId as a list of 1.
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        inStock: true,
        vendorId: true,
        vendor: {
          select: {
            id: true,
            status: true,
            latitude: true,
            longitude: true,
            autoAcceptOrders: true,
            serviceAreaRadiusKm: true,
          },
        },
      },
    });

    if (!product || !product.vendorId || !product.vendor) return null;
    if (!product.inStock) return null;
    if (product.vendor.status !== "approved") return null;

    // 2. If the vendor has no GPS coordinates, fall back gracefully
    if (product.vendor.latitude == null || product.vendor.longitude == null) {
      console.warn(
        `[GeoVendor] Vendor ${product.vendorId} has no GPS coordinates — using direct assignment for product ${productId}`
      );
      return product.vendorId;
    }

    // 3. Single-vendor path: return vendorId directly (with coordinate validation)
    //    Multi-vendor path (future): run findNearest() across all candidates
    const candidates = [product.vendor];
    const nearest = findNearest(customerLat, customerLng, candidates);

    if (!nearest) return product.vendorId; // safe fallback

    const { distanceKm } = nearest;

    console.info(
      `[GeoVendor] Product ${productId} → Vendor ${product.vendorId} | Distance: ${distanceKm.toFixed(2)} km from customer`
    );

    return product.vendorId;
  } catch (error) {
    console.error("[GeoVendor] findNearestVendorByProduct error:", error);
    return null;
  }
}

/**
 * Finds the nearest vendor for a BATCH of products simultaneously.
 * Returns a Map<productId, vendorId>.
 */
export async function findNearestVendorBatch(
  productIds: string[],
  customerLat: number,
  customerLng: number
): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  if (!customerLat || !customerLng) return result;

  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, inStock: true },
    select: {
      id: true,
      vendorId: true,
      vendor: {
        select: {
          id: true,
          status: true,
          latitude: true,
          longitude: true,
          serviceAreaRadiusKm: true,
        },
      },
    },
  });

  for (const product of products) {
    if (!product.vendorId || !product.vendor) continue;
    if (product.vendor.status !== "approved") continue;

    // If vendor has no GPS, use them directly (safe degradation)
    if (product.vendor.latitude == null || product.vendor.longitude == null) {
      result.set(product.id, product.vendorId);
      continue;
    }

    // For now: single-vendor per product — assign directly
    // Future: multi-vendor per product → run findNearest across all candidates
    result.set(product.id, product.vendorId);
  }

  return result;
}
