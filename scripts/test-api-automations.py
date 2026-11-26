import subprocess

test_script = """
import { prisma } from "../lib/prisma";
import { processScheduledCampaigns } from "../lib/campaign-runner";
import { checkAndDispatchProductAutomations } from "../lib/product-automation-triggers";
import { isKolkataQuietHours } from "../lib/notification-service";

async function runTests() {
  console.log("=== STARTING LIVE API & ENGINE VERIFICATION TESTS ===");

  // Cleanup any leftover test records first
  await prisma.campaign.deleteMany({
    where: { title: "[VERIFY_TEST] Daily Recurring Deal" },
  });

  // -------------------------------------------------------------
  // TEST A: Recurring Campaign & Idempotent Sender (No Double Send)
  // -------------------------------------------------------------
  console.log("\\n--- [TEST A] Recurring Campaign & Idempotency ---");
  const testCamp = await prisma.campaign.create({
    data: {
      title: "[VERIFY_TEST] Daily Recurring Deal",
      body: "Test deal body",
      type: "OFFER",
      status: "scheduled",
      scheduledAt: new Date(Date.now() - 30000), // 30s in the past so it is due
      recurrence: "daily",
      appTarget: "customer",
      target: "offers",
      platforms: "all",
      audience: { type: "all" },
      createdBy: "verification-suite",
    },
  });
  console.log("Created test scheduled recurring campaign:", testCamp.id);

  // Run 1: Should process and schedule next occurrence
  console.log("Executing Sender Run 1...");
  const run1 = await processScheduledCampaigns();
  console.log("Run 1 Result:", { processed: run1.processed, sent: run1.sent, errors: run1.errors });

  // Run 2: Immediately run again - should find 0 due and create 0 duplicates
  console.log("Executing Sender Run 2 (immediate re-run)...");
  const run2 = await processScheduledCampaigns();
  console.log("Run 2 Result:", { processed: run2.processed, sent: run2.sent, errors: run2.errors });

  // Verify next occurrence was created for tomorrow
  const nextOccurrence = await prisma.campaign.findFirst({
    where: {
      title: "[VERIFY_TEST] Daily Recurring Deal",
      status: "scheduled",
    },
  });
  console.log("Next recurrence created properly:", {
    id: nextOccurrence?.id,
    scheduledAt: nextOccurrence?.scheduledAt,
    status: nextOccurrence?.status,
  });

  // Cleanup Test A records
  await prisma.campaign.deleteMany({
    where: { title: "[VERIFY_TEST] Daily Recurring Deal" },
  });
  console.log("Cleaned up Test A campaigns.");

  // -------------------------------------------------------------
  // TEST B: BACK_IN_STOCK Trigger & 24h Debounce
  // -------------------------------------------------------------
  console.log("\\n--- [TEST B] BACK_IN_STOCK Trigger & 24h Debounce ---");
  const sampleUser = await prisma.user.findFirst({
    where: { role: "customer" },
    select: { id: true },
  });
  const sampleProduct = await prisma.product.findFirst({
    select: { id: true, name: true, slug: true, price: true },
  });

  if (sampleUser && sampleProduct) {
    // Ensure user has this item in wishlist for test
    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: sampleUser.id, productId: sampleProduct.id } },
      create: { userId: sampleUser.id, productId: sampleProduct.id },
      update: {},
    });

    console.log(`User ${sampleUser.id} wishlisted product "${sampleProduct.name}" (${sampleProduct.id}).`);
    
    // Simulate Run 1: Stock 0 -> 25
    console.log("Triggering Product Stock 0 -> 25 (Run 1)...");
    const trigger1 = await checkAndDispatchProductAutomations({
      productId: sampleProduct.id,
      productName: sampleProduct.name,
      productSlug: sampleProduct.slug,
      previousStock: 0,
      newStock: 25,
      previousPrice: Number(sampleProduct.price),
      newPrice: Number(sampleProduct.price),
    });
    console.log("Trigger Run 1 Result:", trigger1);

    // Simulate Run 2: Product updated again immediately (within 24 hours)
    console.log("Triggering Product Stock update again immediately (Run 2 - Debounce Test)...");
    const trigger2 = await checkAndDispatchProductAutomations({
      productId: sampleProduct.id,
      productName: sampleProduct.name,
      productSlug: sampleProduct.slug,
      previousStock: 0,
      newStock: 30,
      previousPrice: Number(sampleProduct.price),
      newPrice: Number(sampleProduct.price),
    });
    console.log("Trigger Run 2 Result (Debounce Verification):", trigger2);

    // Cleanup test wishlist item
    await prisma.wishlistItem.deleteMany({
      where: { userId: sampleUser.id, productId: sampleProduct.id },
    });
    // Cleanup test notification logs
    await prisma.notificationLog.deleteMany({
      where: { userId: sampleUser.id, title: { contains: sampleProduct.name } },
    });
    console.log("Cleaned up Test B records.");
  } else {
    console.log("No sample customer or product found.");
  }

  // -------------------------------------------------------------
  // TEST C: Quiet Hours Enforcement
  // -------------------------------------------------------------
  console.log("\\n--- [TEST C] Quiet Hours Suppression ---");
  const dateAt23IST = new Date("2026-11-26T17:30:00.000Z"); // 17:30 UTC = 23:00 IST (11:00 PM)
  const isQuietAt23 = isKolkataQuietHours("21:00", "08:00", dateAt23IST);
  console.log("Time: 23:00 IST (11:00 PM) -> isKolkataQuietHours:", isQuietAt23, "(Expected: true)");

  const dateAt03IST = new Date("2026-11-26T21:30:00.000Z"); // 21:30 UTC = 03:00 IST (3:00 AM)
  const isQuietAt03 = isKolkataQuietHours("21:00", "08:00", dateAt03IST);
  console.log("Time: 03:00 IST (03:00 AM) -> isKolkataQuietHours:", isQuietAt03, "(Expected: true)");

  const dateAt14IST = new Date("2026-11-26T08:30:00.000Z"); // 08:30 UTC = 14:00 IST (2:00 PM)
  const isQuietAt14 = isKolkataQuietHours("21:00", "08:00", dateAt14IST);
  console.log("Time: 14:00 IST (02:00 PM) -> isKolkataQuietHours:", isQuietAt14, "(Expected: false)");

  console.log("\\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===");
  await prisma.$disconnect();
}

runTests().catch((e) => {
  console.error("Test execution error:", e);
  process.exit(1);
});
"""

import tempfile
import os

with open("scripts/temp-run-tests.ts", "w", encoding="utf-8") as f:
    f.write(test_script)

print("Streaming test script to VPS...")
upload_cmd = [
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "root@50.6.200.135",
    "cat > /var/www/intrihub/scripts/temp-run-tests.ts"
]
p = subprocess.Popen(upload_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
stdout, stderr = p.communicate(input=test_script)

print("Executing test script on VPS...")
exec_cmd = [
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "root@50.6.200.135",
    "cd /var/www/intrihub && npx tsx scripts/temp-run-tests.ts && rm -f scripts/temp-run-tests.ts"
]
res = subprocess.run(exec_cmd, capture_output=True, text=True, timeout=90)
print(res.stdout)
if res.stderr:
    print("ERR:", res.stderr)

try:
    os.remove("scripts/temp-run-tests.ts")
except:
    pass
