import { prisma } from "../lib/prisma";
import { LocationService } from "../lib/location/location-service";
import { createOrder } from "../lib/actions/orders";

async function main() {
  console.log("==================================================================");
  console.log("📍 TESTING INTRIHUB UNIVERSAL LOCATION & DELIVERY SYSTEM");
  console.log("==================================================================");

  // 1. Test Geocoding & Autocomplete
  console.log("\n1️⃣ Testing Geocoding & Search Autocomplete...");
  const searchResults = await LocationService.geocode("HSR Layout Bengaluru", { limit: 3 });
  console.log(`Found ${searchResults.length} search results:`);
  searchResults.forEach((r, i) => {
    console.log(`   [${i + 1}] ${r.street || r.area || "Location"} -> ${r.latitude}, ${r.longitude} (${r.formattedAddress})`);
  });

  // 2. Test Reverse Geocoding (with coordinate preservation)
  console.log("\n2️⃣ Testing Reverse Geocoding (Bengaluru Coordinates: 12.9716, 77.5946)...");
  const reverseAddr = await LocationService.reverseGeocode(12.9716, 77.5946, 10, "GPS");
  console.log(`✅ Reverse Geocoded Address: ${reverseAddr.formattedAddress}`);
  console.log(`   City: ${reverseAddr.city}, State: ${reverseAddr.state}, PostalCode: ${reverseAddr.postalCode}`);
  console.log(`   Preserved Coordinates: ${reverseAddr.latitude}, ${reverseAddr.longitude}`);

  // 3. Test Routing & Road Distance via OSRM
  console.log("\n3️⃣ Testing Routing & Road Distance (HSR Layout to Koramangala)...");
  const origin = { latitude: 12.9141, longitude: 77.6411 }; // HSR
  const dest = { latitude: 12.9352, longitude: 77.6245 };   // Koramangala
  const route = await LocationService.calculateRoute(origin, dest, "driving");
  console.log(`✅ Road Distance: ${route.distanceKm} km (ETA: ${route.durationMinutes} mins) via ${route.provider}`);
  console.log(`   Turn-by-turn steps count: ${route.steps?.length || 0}`);

  // 4. Test Navigation URL generation
  console.log("\n4️⃣ Testing Navigation URL Generators...");
  const gMapsUrl = LocationService.getGoogleMapsNavUrl(12.9141, 77.6411, "Customer Gate");
  const appleMapsUrl = LocationService.getAppleMapsNavUrl(12.9141, 77.6411, "Customer Gate");
  console.log(`Google Maps Nav URL: ${gMapsUrl}`);
  console.log(`Apple Maps Nav URL: ${appleMapsUrl}`);

  // 5. Test Order Creation with Immutable Delivery Snapshot
  console.log("\n5️⃣ Testing Order Creation with Immutable Delivery Snapshot...");
  const sampleProduct = await prisma.product.findFirst({
    where: { inStock: true },
    include: { variants: true },
  });

  const testOrderId = `TEST-LOC-${Date.now()}`;
  const testLat = 12.9279;
  const testLng = 77.6271;
  const testAccuracy = 12.5;

  const orderResult = await createOrder({
    customerName: "Mo Ahmad (Delivery Test)",
    customerPhone: "9876543210",
    customerEmail: "mo@intrihub.com",
    paymentMethod: "COD",
    shippingAddress: {
      fullName: "Mo Ahmad",
      phone: "9876543210",
      houseNumber: "Flat 502, 5th Floor",
      buildingName: "Prestige Silver Oak",
      street: "14th Main Road, Sector 3",
      area: "HSR Layout",
      landmark: "Near BDA Complex Gate 2",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      pincode: "560102",
      postalCode: "560102",
      latitude: testLat,
      longitude: testLng,
      accuracy: testAccuracy,
      source: "GPS",
      deliveryInstructions: "Call at security gate, heavy tile boxes.",
    } as any,
    items: [
      {
        productId: sampleProduct?.id || "prod_sample",
        productName: sampleProduct?.name || "Sample Premium Floor Tile",
        variantId: sampleProduct?.variants?.[0]?.id || "default",
        variantDetails: "600x600mm • Glossy",
        boxQuantity: 5,
        pricePerBox: 1200,
        totalPrice: 6000,
      },
    ],
  });

  if (!orderResult.success || !orderResult.order) {
    throw new Error(`Order creation failed: ${orderResult.error}`);
  }

  console.log(`✅ Created Order #${orderResult.order.id}`);

  // 6. Verify Stored Immutable Snapshot
  const verifiedOrder: any = await prisma.order.findUnique({
    where: { id: orderResult.order.id },
  });

  if (!verifiedOrder) throw new Error("Could not find created order in database");

  console.log("\n6️⃣ Verifying Stored Immutable Snapshot in Database:");
  console.log(`   Delivery Name: ${verifiedOrder.deliveryName}`);
  console.log(`   Delivery Phone: ${verifiedOrder.deliveryPhone}`);
  console.log(`   Delivery House: ${verifiedOrder.deliveryHouseNumber}`);
  console.log(`   Delivery Building: ${verifiedOrder.deliveryBuildingName}`);
  console.log(`   Delivery Street: ${verifiedOrder.deliveryStreet}`);
  console.log(`   Delivery Area: ${verifiedOrder.deliveryArea}`);
  console.log(`   Delivery Landmark: ${verifiedOrder.deliveryLandmark}`);
  console.log(`   Delivery Latitude: ${verifiedOrder.deliveryLatitude} (Expected: ${testLat})`);
  console.log(`   Delivery Longitude: ${verifiedOrder.deliveryLongitude} (Expected: ${testLng})`);
  console.log(`   Delivery Accuracy: ${verifiedOrder.deliveryAccuracy}m`);
  console.log(`   Delivery Location Source: ${verifiedOrder.deliveryLocationSource}`);
  console.log(`   Delivery Instructions: ${verifiedOrder.deliveryInstructions}`);

  if (verifiedOrder.deliveryLatitude !== testLat || verifiedOrder.deliveryLongitude !== testLng) {
    throw new Error("❌ Coordinates mismatch between input and database snapshot!");
  }

  console.log("\n🎉 ALL LOCATION & DELIVERY SYSTEM TESTS PASSED SUCCESSFULLY!\n");
}

main()
  .catch((e) => {
    console.error("❌ Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
