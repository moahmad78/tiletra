import subprocess
import tarfile
import io
import os

SSH_HOST = "root@50.6.200.135"
REMOTE_DIR = "/var/www/intrihub"

files_to_sync = [
    "app/api/auth/google/route.ts",
    "app/api/auth/callback/google/route.ts",
    "app/api/auth/[...nextauth]/route.ts",
    "app/api/auth/login/route.ts",
    "app/api/auth/logout/route.ts",
    "app/api/auth/me/route.ts",
    "app/api/auth/session/route.ts",
    "app/api/auth/signup/route.ts",
    "lib/auth-helpers.ts",
    "lib/server-auth.ts",
    "lib/actions/web-portal-auth.ts",
    "lib/actions/email-otp.ts",
]

existing_files = [f for f in files_to_sync if os.path.exists(f)]
print(f"Creating archive with {len(existing_files)} files...")

tar_buffer = io.BytesIO()
with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
    for f in existing_files:
        tar.add(f, arcname=f)

tar_data = tar_buffer.getvalue()
print(f"Streaming {len(tar_data)} bytes to {SSH_HOST}:{REMOTE_DIR}...")

untar_cmd = [
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=10",
    SSH_HOST,
    f"tar -xzf - -C {REMOTE_DIR}"
]
proc = subprocess.Popen(untar_cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
stdout, stderr = proc.communicate(input=tar_data)
if proc.returncode != 0:
    print("Failed to stream tar:", stderr.decode("utf-8", errors="replace"))
    exit(1)

print("Files extracted successfully on VPS!")

print("\n=== Rebuilding Next.js with 4GB heap & restarting PM2 on VPS ===")
remote_cmd = f"cd {REMOTE_DIR} && npx prisma generate && NODE_OPTIONS='--max-old-space-size=4096' npm run build && pm2 restart intrihub --update-env"

res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=10",
    SSH_HOST,
    remote_cmd
], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=600)

print("Return code:", res.returncode)
if res.stdout:
    print("STDOUT (last 1000 chars):\n", res.stdout[-1000:])
if res.stderr:
    print("STDERR (last 1000 chars):\n", res.stderr[-1000:])

if res.returncode != 0:
    print("Build or restart failed!")
    exit(1)

print("\n=== Verifying PM2 and Server Health ===")
verify_cmd = "pm2 status intrihub && curl -I -s -A 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' -H 'Host: www.intrihub.com' -H 'X-Forwarded-Proto: https' http://localhost:3000/api/auth/google"
res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    SSH_HOST,
    verify_cmd
], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=30)
print(res.stdout)
