import subprocess

SSH_HOST = "root@50.6.200.135"

node_script = """
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const admins = await p.user.findMany({
    where: { role: { in: ['admin', 'cpo'] } },
    select: { id: true, email: true, role: true }
  });

  const adminIds = admins.map(a => a.id);
  const adminTokens = await p.deviceToken.findMany({
    where: { userId: { in: adminIds }, isActive: true }
  });

  console.log("=== ADMIN USERS & TOKENS ===");
  console.log("Admins found:", admins);
  console.log("Admin active device tokens:", adminTokens.map(t => ({
    id: t.id,
    userId: t.userId,
    appType: t.appType,
    token: t.token.substring(0, 15) + '...xxxx'
  })));

  if (adminTokens.length > 0) {
    const targetToken = adminTokens[0];
    console.log(`Sending test notification to Admin token (id: ${targetToken.id}, appType: ${targetToken.appType})...`);
    
    const pushPayload = {
      to: [targetToken.token],
      title: "Admin Test Alert 🔔",
      body: "This is a real test push notification dispatched to your admin device.",
      data: {
        type: "ADMIN_TEST",
        timestamp: new Date().toISOString()
      },
      priority: "high"
    };

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(pushPayload)
    });

    const data = await res.json();
    console.log("Expo Push Dispatch Result:", JSON.stringify(data));
  } else {
    console.log("No device token currently registered for admin users in DeviceToken.");
    const latestToken = await p.deviceToken.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    if (latestToken) {
      console.log(`Latest registered token in DB (User ${latestToken.userId}, appType: ${latestToken.appType}, platform: ${latestToken.platform}): ${latestToken.token.substring(0, 15)}...xxxx`);
    }
  }
}

main().then(() => p.$disconnect()).catch(err => {
  console.error(err);
  p.$disconnect();
  process.exit(1);
});
"""

p = subprocess.Popen([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    SSH_HOST,
    "cd /var/www/intrihub && node"
], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

stdout, stderr = p.communicate(input=node_script)
print(stdout)
if stderr:
    print("ERR:\n", stderr)
