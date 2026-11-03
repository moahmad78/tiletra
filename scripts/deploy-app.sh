#!/usr/bin/env bash
# ==============================================================================
# IntriHub VPS Push-to-Deploy & Safe Rollback Engine
# Target: Production VPS (/var/www/intrihub)
#
# Rules:
# - Lightweight, idempotent, fast rollback via preserved .next build directory
# - Runs builds with low CPU priority (nice -n 19) to protect live VPS traffic
# - Web app runs in fork mode on 1 vCPU; uses pm2 restart (not zero-downtime)
# - Restarts intrihub-socket ONLY when files under socket-server/ changed
# - Never executes git clean; never touches public/uploads or logs/
# ==============================================================================

set -euo pipefail

APP_DIR="/var/www/intrihub"
TARGET_REF="${1:-origin/main}"
HEALTH_CHECK_URL="http://127.0.0.1:3000"
MAX_HEALTH_ATTEMPTS=10
HEALTH_SLEEP_SEC=3

# Color codes for readable terminal logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}===================================================================${NC}"
echo -e "${CYAN}        🚀 INTRIHUB VPS APPLICATION DEPLOYMENT ENGINE             ${NC}"
echo -e "${CYAN}===================================================================${NC}"

cd "$APP_DIR"

# 1. Capture current running commit
PREV_COMMIT=$(git rev-parse HEAD)
echo -e "${BLUE}▶ Current production commit:${NC} ${PREV_COMMIT}"

# 2. Fetch latest changes from remote
echo -e "\n${BLUE}▶ Fetching target ref:${NC} ${TARGET_REF}..."
git fetch origin main

# Resolve target SHA (if "main" is given, resolve "origin/main")
if [ "$TARGET_REF" = "main" ]; then
  TARGET_REF="origin/main"
fi

TARGET_SHA=$(git rev-parse "$TARGET_REF" 2>/dev/null || git rev-parse "origin/$TARGET_REF" 2>/dev/null || git rev-parse FETCH_HEAD)
echo -e "${BLUE}▶ Target commit:${NC} ${TARGET_SHA}"

if [ "$PREV_COMMIT" = "$TARGET_SHA" ] && [ "${FORCE_DEPLOY:-0}" != "1" ]; then
  echo -e "${GREEN}✓ Production is already at target commit ${TARGET_SHA}. Nothing to deploy.${NC}"
  exit 0
fi

# 3. Detect if socket-server/ changed between commits
SOCKET_DIFF_COUNT=$(git diff --name-only "$PREV_COMMIT" "$TARGET_SHA" -- socket-server 2>/dev/null | wc -l || echo 0)
if [ "$SOCKET_DIFF_COUNT" -gt 0 ]; then
  SHOULD_RESTART_SOCKET=1
  echo -e "${YELLOW}ℹ Changes detected in socket-server/ (${SOCKET_DIFF_COUNT} files). intrihub-socket will be restarted.${NC}"
else
  SHOULD_RESTART_SOCKET=0
  echo -e "${BLUE}ℹ No changes in socket-server/. intrihub-socket will NOT be restarted.${NC}"
fi

# 4. Check out target commit (preserves untracked uploads and logs)
echo -e "\n${BLUE}▶ Checking out commit:${NC} ${TARGET_SHA}..."
git checkout -B main "$TARGET_SHA"

# 5. Install dependencies cleanly and generate Prisma client
echo -e "\n${BLUE}▶ Installing dependencies (npm ci)...${NC}"
npm ci --prefer-offline --no-audit || npm install --prefer-offline --no-audit

echo -e "\n${BLUE}▶ Generating Prisma Client...${NC}"
npx prisma generate

# 6. Preserve current .next build for fast rollback (instant swap, zero rebuild on failure)
if [ -d ".next" ]; then
  echo -e "\n${BLUE}▶ Backing up existing .next build for instant rollback...${NC}"
  rm -rf .next.prev
  cp -r .next .next.prev
fi

# 7. Compile Next.js bundle with low CPU priority (nice -n 19)
echo -e "\n${BLUE}▶ Compiling Next.js bundle (nice -n 19 npm run build)...${NC}"
if ! nice -n 19 npm run build; then
  echo -e "\n${RED}❌ Build failed! Initiating fast rollback to previous commit...${NC}"
  git checkout "$PREV_COMMIT"
  if [ -d ".next.prev" ]; then
    rm -rf .next
    mv .next.prev .next
    echo -e "${YELLOW}✓ Restored previous .next build directory.${NC}"
  fi
  echo -e "${RED}Deployment aborted due to build error.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Next.js build succeeded.${NC}"

# Also install socket-server dependencies if socket files changed
if [ "$SHOULD_RESTART_SOCKET" -eq 1 ] && [ -d "socket-server" ]; then
  echo -e "\n${BLUE}▶ Updating socket-server dependencies...${NC}"
  (cd socket-server && npm install --prefer-offline --no-audit)
fi

# 8. Restart PM2 process (Fork mode restart on 1 vCPU)
echo -e "\n${BLUE}▶ Restarting intrihub web process in PM2...${NC}"
pm2 restart intrihub --update-env

if [ "$SHOULD_RESTART_SOCKET" -eq 1 ]; then
  echo -e "${BLUE}▶ Restarting intrihub-socket in PM2...${NC}"
  pm2 restart intrihub-socket --update-env
fi

# 9. Post-restart health check (curl, expect HTTP 200)
echo -e "\n${BLUE}▶ Running post-restart health check on ${HEALTH_CHECK_URL}...${NC}"
HEALTH_PASSED=0
for ((i=1; i<=MAX_HEALTH_ATTEMPTS; i++)); do
  sleep "$HEALTH_SLEEP_SEC"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" || echo "000")
  echo -e "Attempt ${i}/${MAX_HEALTH_ATTEMPTS}: HTTP ${HTTP_CODE}"
  if [ "$HTTP_CODE" = "200" ]; then
    HEALTH_PASSED=1
    break
  fi
done

# 10. Automatic rollback if health check fails
if [ "$HEALTH_PASSED" -ne 1 ]; then
  echo -e "\n${RED}❌ Health check failed after ${MAX_HEALTH_ATTEMPTS} attempts (HTTP ${HTTP_CODE})!${NC}"
  echo -e "${YELLOW}⚡ Initiating FAST rollback (re-linking previous .next directory without rebuilding)...${NC}"
  
  git checkout "$PREV_COMMIT"
  if [ -d ".next.prev" ]; then
    rm -rf .next
    mv .next.prev .next
    echo -e "${YELLOW}✓ Restored previous .next build directory.${NC}"
  fi
  
  pm2 restart intrihub --update-env
  if [ "$SHOULD_RESTART_SOCKET" -eq 1 ]; then
    pm2 restart intrihub-socket --update-env
  fi

  echo -e "${RED}❌ Deployment failed health check. System automatically rolled back to ${PREV_COMMIT}.${NC}"
  exit 1
fi

echo -e "\n${GREEN}===================================================================${NC}"
echo -e "${GREEN}   ✓ DEPLOYMENT SUCCEEDED & VERIFIED HEALTHY (HTTP 200)!          ${NC}"
echo -e "${GREEN}   Live Commit: ${TARGET_SHA}                                     ${NC}"
echo -e "${GREEN}===================================================================${NC}"
exit 0

