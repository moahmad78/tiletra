#!/usr/bin/env bash
set -euo pipefail

echo "=== Installing IntriHub Systemd Cron Timers ==="

# 1. Copy shell scripts to /usr/local/bin
echo "Installing runner scripts to /usr/local/bin/..."
cp -f /var/www/intrihub/scripts/systemd/intrihub-cron-*.sh /usr/local/bin/
chmod +x /usr/local/bin/intrihub-cron-*.sh

# 2. Copy systemd unit files to /etc/systemd/system/
echo "Installing systemd service and timer units..."
cp -f /var/www/intrihub/scripts/systemd/intrihub-*.service /etc/systemd/system/
cp -f /var/www/intrihub/scripts/systemd/intrihub-*.timer /etc/systemd/system/

# 3. Reload systemd daemon
echo "Reloading systemd daemon..."
systemctl daemon-reload

# 4. Enable and start all 4 timers
TIMERS=(
  "intrihub-campaign-sender.timer"
  "intrihub-cart-reminders.timer"
  "intrihub-order-alerts.timer"
  "intrihub-sla-checker.timer"
)

for timer in "${TIMERS[@]}"; do
  echo "Enabling and starting $timer..."
  systemctl enable "$timer"
  systemctl restart "$timer"
done

echo "=== Verification: Active Systemd Timers ==="
systemctl list-timers "intrihub-*" --no-pager
