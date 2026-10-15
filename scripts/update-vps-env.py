import re
import os
import subprocess
import secrets

def get_local_env_val(key):
    if not os.path.exists(".env"):
        return None
    with open(".env", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith(f"{key}="):
                val = line[len(key)+1:].strip()
                if (val.startswith('"') and val.endswith('"')) or (val.startswith("'") and val.endswith("'")):
                    val = val[1:-1]
                return val
    return None

google_client_id = get_local_env_val("GOOGLE_CLIENT_ID") or ""
google_client_secret = get_local_env_val("GOOGLE_CLIENT_SECRET") or ""
smtp_host = get_local_env_val("SMTP_HOST") or get_local_env_val("EMAIL_SERVER_HOST") or "smtp.titan.email"
smtp_port = get_local_env_val("SMTP_PORT") or get_local_env_val("EMAIL_SERVER_PORT") or "465"
smtp_user = get_local_env_val("SMTP_USER") or get_local_env_val("EMAIL_SERVER_USER") or "info@intrihub.com"
smtp_pass = get_local_env_val("SMTP_PASS") or get_local_env_val("SMTP_PASSWORD") or get_local_env_val("EMAIL_SERVER_PASSWORD") or ""
email_from = get_local_env_val("EMAIL_FROM") or "IntriHub <info@intrihub.com>"

# Generate strong secret if not locally provided
nextauth_secret = get_local_env_val("NEXTAUTH_SECRET") or secrets.token_hex(32)

python_remote_script = f"""
import os

env_path = '/var/www/intrihub/.env'
if not os.path.exists(env_path):
    print('Error: .env not found')
    exit(1)

with open(env_path, 'r') as f:
    lines = f.readlines()

env_dict = {{}}
for line in lines:
    line_s = line.strip()
    if line_s and not line_s.startswith('#') and '=' in line_s:
        k, v = line_s.split('=', 1)
        env_dict[k.strip()] = v.strip()

required_vars = {{
    'NEXTAUTH_URL': '"https://www.intrihub.com"',
    'NEXTAUTH_SECRET': '"{nextauth_secret}"',
    'JWT_SECRET': '"{nextauth_secret}"',
    'ADMIN_SESSION_SECRET': '"{nextauth_secret}"',
    'VENDOR_SESSION_SECRET': '"{nextauth_secret}"',
    'CPO_SESSION_SECRET': '"{nextauth_secret}"',
    'ADMIN_ALLOWED_EMAIL': '"admin@intrihub.com"',
    'GOOGLE_CLIENT_ID': '"{google_client_id}"',
    'GOOGLE_CLIENT_SECRET': '"{google_client_secret}"',
    'SMTP_HOST': '"{smtp_host}"',
    'SMTP_PORT': '"{smtp_port}"',
    'SMTP_USER': '"{smtp_user}"',
    'SMTP_PASS': '"{smtp_pass}"',
    'EMAIL_FROM': '"{email_from}"',
}}

added_or_updated = 0
for k, v in required_vars.items():
    if k not in env_dict or not env_dict[k]:
        env_dict[k] = v
        added_or_updated += 1

new_lines = []
for k, v in env_dict.items():
    new_lines.append(f"{{k}}={{v}}\\n")

with open(env_path, 'w') as f:
    f.writelines(new_lines)

print(f"SUCCESS: Configured {{added_or_updated}} environment keys in /var/www/intrihub/.env")
"""

import base64
b64_script = base64.b64encode(python_remote_script.encode('utf-8')).decode('ascii')
cmd = f'ssh -o StrictHostKeyChecking=no root@50.6.200.135 "python3 -c \\"import base64; exec(base64.b64decode(\'{b64_script}\').decode(\'utf-8\'))\\""'

res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print("STDOUT:", res.stdout.strip())
if res.stderr:
    print("STDERR:", res.stderr.strip())
