# IntriHub Production VPS Hardening & Anti-Crash Security Guide

This guide contains the step-by-step procedures to harden your Ubuntu/Debian production VPS running IntriHub (Next.js + Express Socket.io + PostgreSQL).

---

## 🔒 1. Ultimate Anti-Hack & Anti-Crash Security Steps

### A. SSH Hardening (Port Change & Key-Only Authentication)
Edit the SSH configuration file:
```bash
sudo nano /etc/ssh/sshd_config
```
Apply the following security settings:
```text
# Change default port 22 to a random high port (e.g. 54222)
Port 54222

# Disable root direct password login
PermitRootLogin prohibit-password

# Force SSH Key Authentication (disable passwords)
PasswordAuthentication no
PubkeyAuthentication yes

# Max failed authentication attempts before disconnect
MaxAuthTries 3

# Disable empty passwords
PermitEmptyPasswords no
```
*Test configuration and restart SSH:*
```bash
sudo sshd -t && sudo systemctl restart ssh
```
> [!IMPORTANT]
> Keep your existing terminal session open! Open a NEW terminal window and test logging in on the new port (`ssh -p 54222 user@your-server-ip`) before closing the current session.

---

### B. Fail2ban Setup (Automated Brute-Force IP Ban)
Install and configure Fail2ban:
```bash
sudo apt update && sudo apt install fail2ban -y
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
```
Add/edit the SSH and Nginx jails:
```ini
[DEFAULT]
bantime  = 1d          # Ban malicious IPs for 24 hours
findtime = 10m         # Window of 10 minutes
maxretry = 3           # Max 3 failed attempts before ban
banaction = ufw

[sshd]
enabled = true
port    = 54222        # Set to your customized SSH port
logpath = %(sshd_log)s
backend = systemd

[nginx-http-auth]
enabled = true
port    = http,https
logpath = /var/log/nginx/error.log

[nginx-botsearch]
enabled = true
port    = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
```
Restart and enable Fail2ban:
```bash
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
sudo fail2ban-client status sshd
```

---

### C. Cloudflare Shield (Hide Real VPS IP & WAF Protection)
1. **DNS Settings:**
   - In Cloudflare Dashboard, ensure all DNS A records (`@` and `www`) are set to **Proxied (Orange Cloud)**.
   - Attackers will see Cloudflare Anycast IPs (e.g., `104.21.x.x`) instead of your real server IP.
2. **SSL/TLS Mode:**
   - Set encryption mode to **Full (Strict)**.
3. **Cloudflare Security / WAF:**
   - Enable **Bot Fight Mode** under **Security > Bots**.
   - Create a WAF Rate Limiting rule under **Security > WAF > Rate Limiting Rules**:
     - Path: `/api/auth/*`
     - Action: Block/Managed Challenge if > 10 requests / 10 seconds.
4. **Restore Real Visitor IPs in Nginx:**
   Add Cloudflare trusted proxy IP ranges in Nginx so `$remote_addr` captures genuine visitor IPs (already supported via `x-forwarded-for` in IntriHub backend).

---

### D. Frontend Code Protection & Obfuscation
- In Next.js, full variable mangling and tree-shaking compression are handled natively by the SWC compiler.
- In `next.config.ts`, we have enforced:
  1. `productionBrowserSourceMaps: false` (guarantees raw TypeScript/JSX source code is never exposed in browser developer tools).
  2. `compiler: { removeConsole: ... }` (strips all internal debugging `console.log` statements from client bundles).
  3. Strict Content Security Policy (CSP) blocking unauthorized external scripts.

---

### E. Helmet.js & Anti-Crash Handlers (Socket Server)
- **Helmet.js:** Added to `socket-server/index.js` to enforce secure HTTP headers (XSS Filter, MIME Sniffing protection, Frameguard).
- **Anti-Crash Protectors:**
  ```javascript
  process.on('uncaughtException', (err) => {
    console.error('[FATAL UNCAUGHT EXCEPTION]:', err);
  });
  process.on('unhandledRejection', (reason, promise) => {
    console.error('[UNHANDLED REJECTION]:', reason);
  });
  ```
  Prevents unhandled promise rejections or isolated socket events from terminating the Node.js server.

---

### F. PM2 Cluster Mode ([ecosystem.config.js](file:///d:/Intrihub/ecosystem.config.js))
Run IntriHub web across all CPU cores for high availability:
```bash
# Start cluster
pm2 start ecosystem.config.js

# Save running processes to auto-start on system reboot
pm2 save
pm2 startup
```

---

## 🔒 2. General Security Checklist Summary

| Protection Layer | Component | Status / Location |
| :--- | :--- | :--- |
| **Per-IP Rate Limiting** | OTP & Auth Endpoints | Active in `app/api/auth/send-otp` & `app/api/mobile/auth/send-otp` (Max 5/hr/IP) |
| **Bot Protection** | Cloudflare Turnstile | Ready in `lib/turnstile.ts` + CSP allowed in `next.config.ts` |
| **Strict Email Validation** | Zod Schema + Disposable Blocker | Active in `lib/validations/schemas.ts` (Blocks fake/temp mail domains) |
| **Nginx Reverse Proxy** | Rate Limiting & SSL | Configured in `docs/nginx-intrihub.conf` |
| **Firewall (UFW)** | Ports 80, 443, Custom SSH | Internal ports 3000/4000 isolated to localhost |
| **Credentials Protection** | Secrets in `.env` | File permissions set to `chmod 600 .env` |
