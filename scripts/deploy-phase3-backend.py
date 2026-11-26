import subprocess
import tarfile
import io
import sys

SSH_HOST = "root@50.6.200.135"
REMOTE_DIR = "/var/www/intrihub"

files_to_sync = [
    "app/api/mobile/campaigns/active-popup/route.ts",
]

print("Preparing tar package for Phase 3 backend endpoint...")
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

print("File extracted on VPS. Running build & PM2 restart...")

remote_commands = f"""
cd {REMOTE_DIR}
npm run build
pm2 restart intrihub --update-env
pm2 status intrihub
"""

res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=15",
    SSH_HOST,
    remote_commands
], capture_output=True, text=True, timeout=300)

print("Exit code:", res.returncode)
if res.stdout:
    print("\n--- Output ---")
    print(res.stdout[-600:])
if res.stderr:
    print("\n--- Errors ---")
    print(res.stderr[-400:])
