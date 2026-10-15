import os
import tarfile
import io
import subprocess
import time

SSH_HOST = "root@50.6.200.135"
REMOTE_DIR = "/var/www/intrihub"

DEAD_FILES = [
    "sentry.client.config.ts",
    "sentry.edge.config.ts",
    "sentry.server.config.ts",
    "scripts/check-neon-env.ts",
    "components/help/IntrihubHelpAutobotDesk.tsx",
]

def run_ssh(cmd, timeout=120):
    ssh_cmd = [
        "ssh",
        "-o", "StrictHostKeyChecking=no",
        "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=10",
        SSH_HOST,
        cmd
    ]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=timeout)
    return res

print("=== Step 1: Deleting dead cloud/sentry files on VPS ===")
del_cmd = f"cd {REMOTE_DIR} && rm -f " + " ".join(DEAD_FILES)
res = run_ssh(del_cmd)
print("Delete status:", res.returncode)
if res.stdout:
    print(res.stdout)
if res.stderr:
    print(res.stderr)

print("\n=== Step 2: Creating tar archive of updated files ===")
git_status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
files_to_sync = []
for line in git_status.stdout.splitlines():
    p = line[3:].strip()
    if p.startswith('"') and p.endswith('"'):
        p = p[1:-1]
    if os.path.exists(p) and os.path.isfile(p):
        if not any(p.startswith(x) for x in ["intrihub-mobile", "intrihub-business", "scratch", "docs"]):
            files_to_sync.append(p)

print(f"Found {len(files_to_sync)} files to transfer.")

tar_buffer = io.BytesIO()
with tarfile.open(fileobj=tar_buffer, mode="w:gz") as tar:
    for f in files_to_sync:
        tar.add(f, arcname=f)

tar_data = tar_buffer.getvalue()
print(f"Compressed size: {len(tar_data)} bytes ({len(tar_data)/1024:.1f} KB)")

print("\n=== Step 3: Streaming tar to VPS ===")
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
print("Successfully extracted files on VPS!")

print("\n=== Step 4: Running npm install & prisma generate on VPS ===")
install_cmd = f"cd {REMOTE_DIR} && npm install && npx prisma generate"
res = run_ssh(install_cmd, timeout=300)
print("Install return code:", res.returncode)
if res.stdout:
    print(res.stdout[-500:])
if res.stderr:
    print(res.stderr[-500:])

print("\n=== Step 5: Running Next.js build on VPS ===")
build_cmd = f"cd {REMOTE_DIR} && npm run build"
res = run_ssh(build_cmd, timeout=600)
print("Build return code:", res.returncode)
if res.stdout:
    print("Build STDOUT (last 1000 chars):\n", res.stdout[-1000:])
if res.stderr:
    print("Build STDERR (last 1000 chars):\n", res.stderr[-1000:])

if res.returncode != 0:
    print("ERROR: Build failed on VPS.")
    exit(1)

print("\n=== Step 6: Restarting PM2 process ===")
restart_cmd = f"pm2 restart intrihub --update-env"
res = run_ssh(restart_cmd, timeout=60)
print(res.stdout)

print("\n=== Step 7: Verifying Server Health & PM2 Status ===")
time.sleep(3)
health_cmd = f"curl -I -s http://localhost:3000/ && pm2 status intrihub"
res = run_ssh(health_cmd, timeout=30)
print("Health Check Output:\n", res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)

print("\n=== Step 8: Recent PM2 logs ===")
logs_cmd = f"pm2 logs intrihub --lines 25 --nostream"
res = run_ssh(logs_cmd, timeout=30)
print("PM2 Logs:\n", res.stdout)
