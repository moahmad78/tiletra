import subprocess

SSH_HOST = "root@50.6.200.135"

backup_cmd = """
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="/var/backups/intrihub/intrihub_neon_backup_${TIMESTAMP}.sql.gz"

RAW_URL=$(grep '^DATABASE_URL=' /var/www/intrihub/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
# Strip schema query param for pg_dump compatibility
CLEAN_URL=$(echo "$RAW_URL" | sed 's/[?&]schema=[^&]*//g')

echo "Running pg_dump with cleaned connection URI..."
pg_dump "$CLEAN_URL" | gzip > "$BACKUP_FILE"

echo "Backup verified:"
ls -lh "$BACKUP_FILE"
"""

res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    SSH_HOST,
    backup_cmd
], capture_output=True, text=True, timeout=120)

print(res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)
