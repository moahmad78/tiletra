import subprocess

SSH_HOST = "root@50.6.200.135"

setup_script = """
set -e

echo "=== 1. CREATING FESTIVAL WISHES CRON SCRIPT & SYSTEMD UNITS ==="
CRON_SECRET=$(grep '^CRON_SECRET=' /var/www/intrihub/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")

cat << 'EOF' > /usr/local/bin/intrihub-cron-festival-wishes.sh
#!/usr/bin/env bash
set -euo pipefail
CRON_SECRET=$(grep '^CRON_SECRET=' /var/www/intrihub/.env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
curl -fsS --max-time 60 -A "IntriHub-Cron/1.0" -H "Authorization: Bearer ${CRON_SECRET}" "http://127.0.0.1:3000/api/cron/festival-wishes"
echo ""
EOF
chmod 755 /usr/local/bin/intrihub-cron-festival-wishes.sh

cat << 'EOF' > /etc/systemd/system/intrihub-festival-wishes.service
[Unit]
Description=IntriHub Daily Festival Wishes Cron
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/intrihub-cron-festival-wishes.sh
StandardOutput=append:/var/log/intrihub-festival-wishes.log
StandardError=append:/var/log/intrihub-festival-wishes.log
EOF

cat << 'EOF' > /etc/systemd/system/intrihub-festival-wishes.timer
[Unit]
Description=Run IntriHub Festival Wishes Daily at 09:00 IST (03:30 UTC)

[Timer]
OnCalendar=*-*-* 03:30:00 UTC
RandomizedDelaySec=15
Persistent=true
Unit=intrihub-festival-wishes.service

[Install]
WantedBy=timers.target
EOF

echo "=== 2. SYSTEMD DAEMON-RELOAD & ENABLE ALL TIMERS ==="
systemctl daemon-reload

TIMERS=(
  "intrihub-campaign-sender.timer"
  "intrihub-cart-reminders.timer"
  "intrihub-order-alerts.timer"
  "intrihub-sla-checker.timer"
  "intrihub-app-update.timer"
  "intrihub-festival-wishes.timer"
)

for t in "${TIMERS[@]}"; do
  systemctl enable --now "$t"
done

echo "=== 3. SYSTEMD TIMERS LIST ==="
systemctl list-timers --all | grep -i intrihub

echo "=== 4. SYSTEMD TIMERS STATUS ==="
for t in "${TIMERS[@]}"; do
  echo "--- Status for $t ---"
  systemctl is-active "$t"
done

echo "=== 5. MANUAL CURL TO EACH CRON ENDPOINT WITH CRON_SECRET ==="
ENDPOINTS=(
  "http://127.0.0.1:3000/api/cron/campaign-sender"
  "http://127.0.0.1:3000/api/cron/cart-reminders"
  "http://127.0.0.1:3000/api/cron/order-alerts"
  "http://127.0.0.1:3000/api/cron/sla-checker"
  "http://127.0.0.1:3000/api/cron/app-update-reminder"
  "http://127.0.0.1:3000/api/cron/festival-wishes"
)

for ep in "${ENDPOINTS[@]}"; do
  echo "Testing endpoint: $ep"
  RESP=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -H "Authorization: Bearer ${CRON_SECRET}" -A "IntriHub-Cron/1.0" "$ep")
  STATUS=$(echo "$RESP" | grep "HTTP_STATUS:" | cut -d':' -f2)
  BODY=$(echo "$RESP" | grep -v "HTTP_STATUS:" | head -c 300)
  echo "HTTP: $STATUS | BODY: $BODY"
  echo ""
done
"""

res = subprocess.run([
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    SSH_HOST,
    setup_script
], capture_output=True, text=True, timeout=120)

print(res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)
