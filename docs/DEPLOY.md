# IntriHub VPS Production Deployment & Operations Runbook

This runbook documents the automated push-to-deploy workflow, emergency manual deployment, fast rollback procedures, SSH key rotation, and safety rules for **https://www.intrihub.com**.

---

## 1. Architecture & Pipeline Overview

- **Host:** Bluehost Ubuntu VPS (`50.6.200.135`)
- **App Working Directory:** `/var/www/intrihub`
- **Reverse Proxy:** Nginx (Proxying port `80`/`443` to `127.0.0.1:3000` for Next.js and `127.0.0.1:4000` for Socket.IO)
- **Process Manager:** PM2 (Apps: `intrihub` for Next.js, `intrihub-socket` for real-time WebSocket server)
- **CI/CD Automation:** GitHub Actions (`.github/workflows/deploy.yml`)
- **VPS Deployment Engine:** `scripts/deploy-app.sh`

### Key Safety Mechanisms
1. **CI Verification First:** Every push to `main` executes `npx tsc --noEmit` and `npm run build` on GitHub Actions runners (16 GB RAM, 4 vCPUs) before anything touches the live server.
2. **Scheduled Deploy Window:** Regular deploys execute during off-peak hours at **03:00 AM IST** (`21:30 UTC` cron).
3. **Emergency Manual Deploy:** High-priority hotfixes can be triggered immediately via GitHub Actions `workflow_dispatch`.
4. **Low CPU Priority (`nice -n 19`):** Builds on the 1-vCPU VPS run with priority `19` to prevent CPU starvation and keep live customer traffic and socket connections responsive.
5. **Instant Rollback (Zero Rebuild):** The deployment script preserves `.next.prev`. If post-restart health checks fail, the previous `.next` directory is restored instantly (~3 seconds) without needing a rebuild.
6. **Smart Socket Reload:** `intrihub-socket` is only restarted if files under `socket-server/` were modified in the commit.
7. **Isolated Migrations:** `npx prisma migrate deploy` is NEVER run automatically; it requires explicit authorization via GitHub Actions `workflow_dispatch` with input `CONFIRM`.

---

## 2. Required GitHub Repository Secrets

Configure these secrets in your repository settings (**Settings > Secrets and variables > Actions**):

| Secret Name | Description | Example / Recommended Value |
| :--- | :--- | :--- |
| `VPS_HOST` | Production VPS IP address or hostname | `50.6.200.135` |
| `VPS_USER` | Dedicated deploy user on the VPS | `deploy` (or `root` until migration is complete) |
| `VPS_SSH_KEY` | Private OpenSSH Key for the deploy user | `-----BEGIN OPENSSH PRIVATE KEY----- ...` |
| `VPS_PORT` | SSH Port configured in `/etc/ssh/sshd_config` | `22` |

> [!CAUTION]
> Never commit private keys, passwords, or `.env` files into the Git repository.

---

## 3. How to Deploy

### Option A: Standard Scheduled Deployment (Automated)
1. Push code changes or merge Pull Requests into the `main` branch.
2. GitHub Actions CI will run typechecks and test the build in isolation.
3. Once CI passes, changes will automatically deploy to production during the daily **03:00 IST** maintenance window.

### Option B: Emergency / Immediate Manual Deployment
1. Go to **Actions** in your GitHub repository.
2. Select **CI and VPS Production Deploy** from the left sidebar.
3. Click **Run workflow**.
4. Leave **Deploy to VPS Production immediately?** set to `true`.
5. Select target branch (`main`) and click **Run workflow**.
6. The action will run CI checks and immediately execute `scripts/deploy-app.sh` on the VPS.

---

## 4. How to Run Database Migrations

Database schema migrations are separated from code deployments to prevent unexpected table locks or downtime during live hours:

1. Go to **Actions > CI and VPS Production Deploy > Run workflow**.
2. Check **Run Prisma migration (npx prisma migrate deploy)?** to `true`.
3. In the **migration_confirmation** field, type `CONFIRM` in all caps.
4. Click **Run workflow**.
5. The `migrate` job will execute on the VPS, apply pending Prisma migrations, and output full migration logs.

---

## 5. How to Roll Back

### Automatic Rollback
If `scripts/deploy-app.sh` detects a build failure or if the post-restart health check fails to return `HTTP 200` within 30 seconds, the script automatically:
1. Checks out the previous Git commit.
2. Restores `.next.prev` back to `.next` (instant swap).
3. Restarts PM2 services.
4. Exits with an error, notifying GitHub Actions of the failed deployment.

### Manual Emergency Rollback via SSH
If a logic bug slipped through and you need to roll back to a specific commit manually:

```bash
# 1. SSH into the VPS
ssh deploy@50.6.200.135

# 2. Navigate to app directory
cd /var/www/intrihub

# 3. Check out the desired stable commit SHA
git checkout <STABLE_COMMIT_SHA>

# 4. If the rollback is to the immediately preceding build, restore the preserved build:
if [ -d ".next.prev" ]; then
  rm -rf .next && cp -r .next.prev .next
else
  # Otherwise rebuild with low CPU priority
  nice -n 19 npm run build
fi

# 5. Restart PM2 processes
pm2 restart intrihub --update-env

# 6. Verify health
curl -I http://127.0.0.1:3000
```

---

## 6. How to Rotate the Deploy SSH Key

Rotate SSH keys periodically or immediately if credentials are ever compromised:

1. **Generate a new Ed25519 key pair locally:**
   ```bash
   ssh-keygen -t ed25519 -C "intrihub-deploy-key" -f ./intrihub_deploy_key
   ```
2. **Add the public key to the VPS:**
   ```bash
   # Append ./intrihub_deploy_key.pub to /home/deploy/.ssh/authorized_keys
   ssh deploy@50.6.200.135 "mkdir -p ~/.ssh && chmod 700 ~/.ssh"
   cat ./intrihub_deploy_key.pub | ssh deploy@50.6.200.135 "cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
   ```
3. **Update GitHub Secret:**
   - Go to GitHub Repository **Settings > Secrets > Actions**.
   - Update `VPS_SSH_KEY` with the exact text of `./intrihub_deploy_key`.
4. **Remove old key:**
   - Test deployment via GitHub Actions.
   - Once verified, remove the old public key from `/home/deploy/.ssh/authorized_keys` on the VPS.
   - Delete `./intrihub_deploy_key` from your local machine.

---

## 7. Storage Preservation & Safety Rules

> [!IMPORTANT]
> **CRITICAL DIRECTORY SAFETY RULES:**
> 1. **NEVER run `git clean` or `git reset --hard` blindly.**
> 2. `public/uploads/` and `public/images/uploads/` contain all live vendor shop photos, KYC documents, and catalog images. They are currently stored on the local VPS disk.
> 3. `logs/` contains critical PM2 and access logs.
> 4. `deploy-app.sh` is designed to be purely additive and never deletes user-uploaded media.

---

## 8. Proposed Step 4 Plan: Moving PM2 and `/var/www/intrihub` to Non-Root `deploy` User

*Pending User Approval before execution on production server.*

### Current State
- PM2 daemon runs as `root` (`systemd` service: `pm2-root.service`).
- `/var/www/intrihub` is owned by `root:root`.
- Non-root users cannot access `/root/.pm2/` RPC sockets, preventing non-root reloads.

### Proposed Execution Plan
1. **Create `deploy` user with standard shell:**
   ```bash
   adduser --disabled-password --gecos "Intrihub Deployer" deploy
   usermod -aG sudo deploy
   ```
2. **Grant restricted sudoers rule for PM2 (without full root access):**
   ```bash
   echo "deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart nginx, /usr/bin/systemctl reload nginx" > /etc/sudoers.d/deploy-intrihub
   chmod 440 /etc/sudoers.d/deploy-intrihub
   ```
3. **Set permissions on application folder:**
   ```bash
   chown -R deploy:deploy /var/www/intrihub
   chmod 600 /var/www/intrihub/.env
   ```
4. **Migrate PM2 Daemon from Root to Deploy:**
   ```bash
   # Enable systemd user session persistence
   loginctl enable-linger deploy

   # Stop and clear root PM2 daemon
   pm2 stop all
   pm2 delete all
   pm2 unstartup systemd
   pm2 save -f

   # Start PM2 under deploy user
   sudo -u deploy -H bash -c "cd /var/www/intrihub && pm2 start ecosystem.config.js"
   sudo -u deploy -H bash -c "pm2 save"

   # Setup deploy PM2 systemd startup hook
   env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u deploy --hp /home/deploy
   systemctl enable pm2-deploy
   ```
5. **Install Deploy User SSH Key:**
   ```bash
   mkdir -p /home/deploy/.ssh
   chmod 700 /home/deploy/.ssh
   # Copy public key to /home/deploy/.ssh/authorized_keys
   chmod 600 /home/deploy/.ssh/authorized_keys
   chown -R deploy:deploy /home/deploy/.ssh
   ```
6. **Verification & Fallback Plan:**
   - Test `sudo -u deploy -H bash -c "pm2 status"` (should display `intrihub` and `intrihub-socket` online).
   - Test health check `curl -I http://127.0.0.1:3000`.
   - If any issue arises, root can immediately re-adopt the processes via `pm2 start /var/www/intrihub/ecosystem.config.js`.

