import subprocess

script = """
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function check() {
  const storeSettings = await p.storeSettings.findFirst({
    select: { id: true, backInStockEnabled: true, priceDropEnabled: true, automationTemplates: true }
  });
  const campaign = await p.campaign.findFirst({
    select: { id: true, type: true, accentColor: true, ctaLabel: true, countdownEndsAt: true, recurrence: true, appTarget: true, popup: true, schemaVersion: true }
  });
  const festivalCount = await p.festivalEvent.count();
  const tokenFields = await p.deviceToken.findFirst({
    select: { id: true, token: true, appType: true, platform: true, appVersion: true, isActive: true }
  });

  console.log("DATABASE_EVIDENCE_SUCCESS:" + JSON.stringify({
    storeSettings,
    campaignSample: campaign,
    festivalEventsCount: festivalCount,
    deviceTokenSample: tokenFields
  }));
  await p.$disconnect();
}
check().catch(err => {
  console.error("QUERY_ERROR:", err.message);
  process.exit(1);
});
"""

res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "root@50.6.200.135",
    f"cd /var/www/intrihub && node -e '{script}'"
], capture_output=True, text=True, timeout=30)

print(res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
