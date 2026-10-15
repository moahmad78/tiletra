import os
import sys
import json
import argparse
import subprocess

def load_env(env_path="/var/www/intrihub/.env"):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k = k.strip()
                    v = v.strip().strip('"').strip("'")
                    env_vars[k] = v
    return env_vars

def mask_email(email: str) -> str:
    if not email or "@" not in email:
        return "***"
    parts = email.split("@")
    name = parts[0]
    domain = parts[1]
    masked = name[0] + "***" + name[-1] if len(name) > 2 else name[0] + "***"
    return f"{masked}@{domain}"

def main():
    parser = argparse.ArgumentParser(description="Test Titan Mail SMTP OTP dispatch")
    parser.add_argument("--to", help="Recipient email address", default="mohammadmail92@gmail.com")
    parser.add_argument("--user", help="Titan Mail user email", default=None)
    parser.add_argument("--password", help="Titan Mail password", default=None)
    parser.add_argument("--from_email", help="Sender from header", default=None)
    parser.add_argument("--port", help="SMTP Port", type=int, default=None)
    args, unknown = parser.parse_known_args()

    # Support positional syntax as fallback
    to_email = args.to
    if len(unknown) > 0 and not to_email:
        to_email = unknown[0]

    env_vars = load_env()
    user_email = args.user or env_vars.get("SMTP_USER") or env_vars.get("EMAIL_SERVER_USER", "info@intrihub.com")
    password = args.password or env_vars.get("SMTP_PASS") or env_vars.get("SMTP_PASSWORD") or env_vars.get("EMAIL_SERVER_PASSWORD", "")
    from_email = args.from_email or env_vars.get("EMAIL_FROM", f"IntriHub <{user_email}>")
    host = env_vars.get("SMTP_HOST") or env_vars.get("EMAIL_SERVER_HOST", "smtp.titan.email")
    port = args.port or int(env_vars.get("SMTP_PORT") or env_vars.get("EMAIL_SERVER_PORT", "465"))
    is_secure = port == 465

    print(f"[*] Configuration: Host={host}:{port} SSL={is_secure} User={mask_email(user_email)} To={mask_email(to_email)}")

    if not password or password == "your-titan-email-password":
        print("[-] ERROR: SMTP_PASS / EMAIL_SERVER_PASSWORD is missing or set to placeholder in .env!")
        sys.exit(1)

    node_script = f"""
const nodemailer = require('/var/www/intrihub/node_modules/nodemailer');

async function sendTest() {{
    console.log('[*] Initializing Nodemailer transport (port {port}, secure={str(is_secure).lower()})...');
    const transporter = nodemailer.createTransport({{
        host: {json.dumps(host)},
        port: {port},
        secure: {str(is_secure).lower()},
        auth: {{
            user: {json.dumps(user_email)},
            pass: {json.dumps(password)}
        }},
        tls: {{
            rejectUnauthorized: false
        }},
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000
    }});

    try {{
        console.log('[*] Verifying Titan Mail credentials with SMTP server...');
        await transporter.verify();
        console.log('[+] SUCCESS: Titan Mail SMTP connection & credentials verified!');

        const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log('[*] Dispatching test OTP email to: {to_email}');

        const info = await transporter.sendMail({{
            from: {json.dumps(from_email)},
            to: {json.dumps(to_email)},
            subject: 'Your IntriHub Login Verification Code: ' + testOtp,
            html: `
                <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
                    <div style="text-align:center;margin-bottom:20px;">
                        <img src="https://www.intrihub.com/logo/intri-web-logo.png" alt="Intrihub" height="38" style="display:block;margin:0 auto;" />
                    </div>
                    <div style="background:#ffffff;border-radius:10px;padding:24px;text-align:center;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                        <h2 style="font-size:18px;font-weight:700;color:#1e293b;margin:0 0 10px;">Login Verification Code</h2>
                        <p style="color:#64748b;font-size:14px;margin:0 0 20px;">Use the 6-digit code below to securely sign into your Intrihub account.</p>
                        <div style="background:#f1f5f9;border-radius:8px;padding:14px;margin:0 0 20px;display:inline-block;letter-spacing:8px;font-size:32px;font-weight:900;color:#052a51;font-family:monospace;">
                            ` + testOtp + `
                        </div>
                        <p style="color:#94a3b8;font-size:12px;margin:0;">⏱ This code will expire in <strong>10 minutes</strong>.<br />Sent via Titan Mail SMTP (port 465 SSL).</p>
                    </div>
                    <div style="margin-top:20px;text-align:center;color:#94a3b8;font-size:11px;">
                        IntriHub • Every Material. Every Space. • www.intrihub.com
                    </div>
                </div>
            `
        }});

        console.log('[+] SUCCESS: Email dispatched successfully!');
        console.log('[+] Message ID:', info.messageId);
        console.log('[+] Server Response:', info.response);
        process.exit(0);
    }} catch (err) {{
        console.error('[-] ERROR: SMTP Dispatch Failed!');
        console.error('[-] Message:', err.message);
        if (err.code) console.error('[-] Code:', err.code);
        if (err.command) console.error('[-] Command:', err.command);
        if (err.response) console.error('[-] Response:', err.response);
        process.exit(1);
    }}
}}

sendTest();
"""
    cmd = ["node", "-e", node_script]
    res = subprocess.run(cmd)
    sys.exit(res.returncode)

if __name__ == "__main__":
    main()
