#!/usr/bin/env bash
set -euo pipefail
CRON_SECRET="$(grep -E '^CRON_SECRET=' /var/www/intrihub/.env | head -n1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '\r')"
curl -fsS --max-time 55 -A "IntriHub-Cron/1.0" -H "Authorization: Bearer ${CRON_SECRET}" "http://127.0.0.1:3000/api/cron/campaign-sender"
echo ""
