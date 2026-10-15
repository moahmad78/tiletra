import subprocess
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

def run_cmd(cmd):
    return subprocess.run(
        ["ssh", "-o", "StrictHostKeyChecking=no", "-o", "BatchMode=yes", "root@50.6.200.135", cmd],
        capture_output=True,
        encoding="utf-8",
        errors="replace",
        timeout=15
    )

# 1. PM2 Status
res_pm2 = run_cmd("pm2 status intrihub")
print("=== PM2 Status ===")
print(res_pm2.stdout)

# 2. Local HTTP check
res_http = run_cmd('curl -I -s -H "User-Agent: Mozilla/5.0 IntriHubHealth" http://localhost:3000/')
print("=== Localhost HTTP Response ===")
print(res_http.stdout)

# 3. Test Auth Endpoint
res_auth = run_cmd('curl -s -X POST -H "Content-Type: application/json" -H "User-Agent: Mozilla/5.0 IntriHubHealth" -d \'{"email":"nonexistent_test@intrihub.com","password":"test"}\' http://localhost:3000/api/auth/login')
print("=== Auth Login Endpoint Test ===")
print(res_auth.stdout)

# 4. Check that no sentry/supabase packages remain in node_modules
res_check = run_cmd('cd /var/www/intrihub && npm ls @sentry/nextjs @supabase/supabase-js @vercel/blob 2>&1 || true')
print("=== Unused Dependency Verification ===")
print(res_check.stdout)
