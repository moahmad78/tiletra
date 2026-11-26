import subprocess

cmd = """
cd /var/www/intrihub
node -e '
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
async function run() {
  const s = await p.storeSettings.findFirst();
  console.log("DB_CHECK_RESULT:", JSON.stringify({
    backInStockEnabled: s?.backInStockEnabled,
    priceDropEnabled: s?.priceDropEnabled,
    hasAutomationTemplates: !!s?.automationTemplates
  }));
  await p.$disconnect();
}
run();
'
"""

res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "root@50.6.200.135",
    cmd
], capture_output=True, text=True, timeout=30)

print("STDOUT:", res.stdout.strip())
if res.stderr:
    print("STDERR:", res.stderr.strip())
