import subprocess
import sys

SSH_HOST = "root@50.6.200.135"
REMOTE_DIR = "/var/www/intrihub"

deploy_commands = [
    f"cd {REMOTE_DIR}",
    "git pull origin main",
    "npx prisma generate",
    "npm run build",
    "pm2 restart intrihub --update-env",
    "pm2 save"
]

remote_cmd = " && ".join(deploy_commands)

print("=== Starting Live VPS Deployment ===")
print(f"Connecting to {SSH_HOST}...")

proc = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=15",
    SSH_HOST,
    remote_cmd
], capture_output=True, text=True, timeout=600)

print(f"Deploy Return Code: {proc.returncode}")
if proc.stdout:
    print("--- VPS Output ---")
    print(proc.stdout[-1500:])
if proc.stderr:
    print("--- VPS Errors / Notices ---")
    print(proc.stderr[-1000:])

if proc.returncode != 0:
    print("Deployment failed!")
    sys.exit(proc.returncode)

print("\n=== Live VPS Deployment Completed Successfully! ===")
