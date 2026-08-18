import { getStoreSettings, updateStoreSettings } from "../lib/actions/settings";

async function testSettingsCache() {
  console.log("--- 1. Fetching Initial Settings ---");
  const initial = await getStoreSettings();
  console.log("Initial Free Delivery Threshold:", initial?.freeDeliveryThreshold);
  console.log("Initial COD Max Limit:", initial?.codMaxLimit);

  console.log("\n--- 2. Updating Store Settings ---");
  const testThreshold = 18500;
  const testCodLimit = 30000;
  const updateRes = await updateStoreSettings({
    freeDeliveryThreshold: testThreshold,
    codMaxLimit: testCodLimit,
    codBlockedPincodes: ["560099", "560088", "110001"],
  });

  if (!updateRes.success) {
    throw new Error(`Update failed: ${updateRes.error}`);
  }
  console.log("Update action succeeded.");

  console.log("\n--- 3. Verifying Fresh Settings from getStoreSettings() ---");
  const fresh = await getStoreSettings();
  console.log("Fresh Free Delivery Threshold:", fresh?.freeDeliveryThreshold);
  console.log("Fresh COD Max Limit:", fresh?.codMaxLimit);
  console.log("Fresh Blocked Pincodes:", fresh?.codBlockedPincodes);

  if (fresh?.freeDeliveryThreshold !== testThreshold || fresh?.codMaxLimit !== testCodLimit) {
    throw new Error("Settings mismatch! Cache was not updated.");
  }

  console.log("\n--- 4. Restoring Default Settings ---");
  await updateStoreSettings({
    freeDeliveryThreshold: 15000,
    codMaxLimit: 25000,
    codBlockedPincodes: ["560099", "560088"],
  });
  console.log("Restored original defaults.");

  console.log("\nSETTINGS UPDATE AND REVALIDATION TEST PASSED! ✅");
}

testSettingsCache().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
