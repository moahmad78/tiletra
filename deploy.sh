#!/usr/bin/env bash
# ==============================================================================
# IntriHub VPS One-Click Production Deployment & Hardening Script
# Target: Ubuntu / Debian / Bluehost VPS
# Usage: 
#   chmod +x deploy.sh
#   ./deploy.sh
# ==============================================================================

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}===================================================================${NC}"
echo -e "${CYAN}        🚀 INTRIHUB VPS PRODUCTION DEPLOYMENT & HARDENING          ${NC}"
echo -e "${CYAN}===================================================================${NC}"

# 1. Check if running with sudo privileges
if [ "$EUID" -ne 0 ]; then
  SUDO="sudo"
  echo -e "${YELLOW}ℹ Running as non-root user. Using 'sudo' for system commands.${NC}"
else
  SUDO=""
  echo -e "${GREEN}✓ Running with root privileges.${NC}"
fi

# 2. Update packages and install essential security tools
echo -e "\n${BLUE}▶ Step 1: Installing Required System Packages (Nginx, UFW, Fail2ban)...${NC}"
$SUDO apt update -y
$SUDO apt install -y nginx ufw fail2ban certbot python3-certbot-nginx curl git

# 3. Check Node.js & PM2
echo -e "\n${BLUE}▶ Step 2: Checking Node.js and PM2 Installation...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${YELLOW}Node.js not found. Installing Node.js 20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt install -y nodejs
fi
echo -e "${GREEN}✓ Node.js version: $(node -v)${NC}"

if ! command -v pm2 &> /dev/null; then
  echo -e "${YELLOW}PM2 not found. Installing globally via npm...${NC}"
  $SUDO npm install -g pm2
fi
echo -e "${GREEN}✓ PM2 version: $(pm2 -v)${NC}"

# 4. Secure Environment Files
echo -e "\n${BLUE}▶ Step 3: Hardening Environment Permissions...${NC}"
if [ -f ".env" ]; then
  chmod 600 .env
  echo -e "${GREEN}✓ Set chmod 600 on .env (protected from unauthorized users).${NC}"
else
  echo -e "${YELLOW}⚠ Warning: .env file not found in current directory. Please create .env with your credentials!${NC}"
fi

# 5. Install Dependencies and Build Application
echo -e "\n${BLUE}▶ Step 4: Installing App Dependencies & Building Next.js Bundle...${NC}"
npm install --production=false
npx prisma generate
npm run build
echo -e "${GREEN}✓ Next.js production build succeeded.${NC}"

# Also install socket-server dependencies
if [ -d "socket-server" ]; then
  echo -e "${BLUE}▶ Installing Socket.IO Server dependencies...${NC}"
  (cd socket-server && npm install)
  echo -e "${GREEN}✓ Socket server dependencies installed.${NC}"
fi

# 6. Configure Nginx Reverse Proxy
echo -e "\n${BLUE}▶ Step 5: Configuring Nginx Reverse Proxy...${NC}"
if [ -f "docs/nginx-intrihub.conf" ]; then
  $SUDO cp docs/nginx-intrihub.conf /etc/nginx/sites-available/intrihub.conf
  $SUDO ln -sf /etc/nginx/sites-available/intrihub.conf /etc/nginx/sites-enabled/
  # Remove default nginx welcome page if active
  $SUDO rm -f /etc/nginx/sites-enabled/default
  
  # Validate Nginx syntax
  if $SUDO nginx -t; then
    $SUDO systemctl reload nginx
    echo -e "${GREEN}✓ Nginx configuration active and reloaded.${NC}"
  else
    echo -e "${RED}❌ Nginx syntax check failed. Please check /etc/nginx/sites-available/intrihub.conf${NC}"
  fi
fi

# 7. Configure UFW Firewall Safely
echo -e "\n${BLUE}▶ Step 6: Hardening UFW Firewall (Blocking Internal Ports)...${NC}"
# Detect current SSH port
SSH_PORT=$(grep -E "^Port " /etc/ssh/sshd_config 2>/dev/null | awk '{print $2}' || echo "22")
echo -e "${YELLOW}Detected active SSH Port: ${SSH_PORT}${NC}"

$SUDO ufw default deny incoming
$SUDO ufw default allow outgoing
$SUDO ufw allow "$SSH_PORT"/tcp comment 'SSH Port'
$SUDO ufw allow 80/tcp comment 'HTTP Nginx'
$SUDO ufw allow 443/tcp comment 'HTTPS Nginx'

# Ensure Next.js and Socket ports are NOT publicly exposed
$SUDO ufw deny 3000 comment 'Block Next.js direct port' || true
$SUDO ufw deny 4000 comment 'Block Socket.io direct port' || true

# Enable UFW without prompting
echo "y" | $SUDO ufw enable
$SUDO ufw status verbose
echo -e "${GREEN}✓ UFW Firewall hardened successfully.${NC}"

# 8. Start / Reload with PM2 Cluster Mode
echo -e "\n${BLUE}▶ Step 7: Starting / Reloading IntriHub with PM2 Cluster Mode...${NC}"
mkdir -p logs
pm2 startOrReload ecosystem.config.js --update-env
pm2 save

echo -e "\n${GREEN}===================================================================${NC}"
echo -e "${GREEN}   🎉 DEPLOYMENT COMPLETE! INTRIHUB IS RUNNING IN PRODUCTION      ${NC}"
echo -e "${GREEN}===================================================================${NC}"
echo -e "Check application status:  ${CYAN}pm2 status${NC}"
echo -e "Monitor live logs:         ${CYAN}pm2 logs${NC}"
echo -e "Generate SSL Certificate:  ${CYAN}sudo certbot --nginx -d intrihub.com -d www.intrihub.com${NC}"
echo -e "${GREEN}===================================================================${NC}"
