import subprocess
import sys

SSH_HOST = "root@50.6.200.135"

deploy_script = """
set -e
cd /var/www/intrihub

echo "=== STEP 4: BASELINE EXISTING MIGRATIONS VIA PRISMA RESOLVE ==="
npx prisma migrate resolve --applied 20261126113200_consolidate_device_tokens || true
npx prisma migrate resolve --applied 20261126114100_phase1_campaign_extensions || true
npx prisma migrate resolve --applied 20261126121700_phase2_product_automations || true

echo "=== STEP 5: PRISMA MIGRATE DEPLOY ==="
npx prisma migrate deploy

echo "=== STEP 6: PRISMA MIGRATE STATUS ==="
npx prisma migrate status

echo "=== STEP 7: NEXT.JS BUILD ==="
if [ -d ".next" ]; then
  rm -rf .next.prev
  cp -r .next .next.prev
fi

export NODE_OPTIONS="--max-old-space-size=2560"
npm run build

echo "=== STEP 8: PM2 RELOAD ==="
pm2 reload intrihub
pm2 status intrihub

echo "=== STEP 9: HEALTH CHECKS ==="
sleep 3
curl -s -o /dev/null -w "SITE HTTP STATUS: %{http_code}\\n" http://127.0.0.1:3000/
curl -s -w "APP-CONFIG HTTP STATUS: %{http_code}\\n" http://127.0.0.1:3000/api/mobile/app-config
"""

print("Continuing VPS Deployment Script on root@50.6.200.135...")
res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    SSH_HOST,
    deploy_script
], capture_output=True, text=True, timeout=600)

print("STDOUT:\n", res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)

if res.returncode != 0:
    print(f"Deployment failed with exit code {res.returncode}")
    sys.exit(res.returncode)
else:
    print("Deployment completed successfully!")
