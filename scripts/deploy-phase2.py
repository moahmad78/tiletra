import subprocess
import tarfile
import io
import sys

SSH_HOST = "root@50.6.200.135"
REMOTE_DIR = "/var/www/intrihub"

files_to_sync = [
    "prisma/schema.prisma",
    "prisma/migrations/20261126_phase2_product_automations.sql",
    "scripts/apply-phase2-migration.ts",
    "lib/notifications/catalog.ts",
    "lib/notifications/service.ts",
    "lib/product-automation-triggers.ts",
    "lib/deep-link-validator.ts",
    "lib/app-update-notifier.ts",
    "lib/actions/products.ts",
    "lib/actions/vendor.ts",
    "app/api/mobile/admin/products/[id]/route.ts",
    "app/api/admin/automation-settings/route.ts",
    "app/api/admin/festivals/route.ts",
    "app/admin/campaigns/page.tsx",
]

print("Preparing tar package...")
tar_buffer = io.BytesIO()
with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
    for f in files_to_sync:
        tar.add(f, arcname=f)

tar_data = tar_buffer.getvalue()
print(f"Streaming {len(tar_data)} bytes to {SSH_HOST}:{REMOTE_DIR}...")

untar_cmd = [
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=15",
    SSH_HOST,
    f"tar -xzf - -C {REMOTE_DIR}"
]

proc = subprocess.Popen(untar_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
stdout, stderr = proc.communicate(input=tar_data)
if proc.returncode != 0:
    print("Failed to stream tar:", stderr.decode("utf-8", errors="replace"))
    sys.exit(1)

print("Files unpacked on VPS successfully.")

remote_commands = f"""
cd {REMOTE_DIR}
echo '=== 1. Applying Phase 2 Additive DB Migrations on VPS ==='
npx tsx scripts/apply-phase2-migration.ts

echo '=== 2. Regenerating Prisma Client ==='
npx prisma generate

echo '=== 3. Building Next.js Application ==='
npm run build

echo '=== 4. Restarting PM2 process ==='
pm2 restart intrihub --update-env

echo '=== 5. Verifying PM2 Status ==='
pm2 status intrihub
"""

print("Running remote migration, build, and restart...")
res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=15",
    SSH_HOST,
    remote_commands
], capture_output=True, text=True, timeout=360)

print("Exit code:", res.returncode)
if res.stdout:
    print("\n--- VPS Output ---")
    print(res.stdout[-1500:])
if res.stderr:
    print("\n--- VPS Errors / Warnings ---")
    print(res.stderr[-1000:])
