import nodemailer from "nodemailer";

// Helper to sanitize environment variables
function getSanitizedEnv(key: string, fallback: string = ""): string {
  const val = process.env[key] || fallback;
  return val.replace(/['"]/g, "").trim();
}

// Helper to mask sensitive email info in logs
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***";
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

export function getFormattedFromEmail(): string {
  const envFrom = getSanitizedEnv(
    "EMAIL_FROM",
    getSanitizedEnv("SMTP_USER", getSanitizedEnv("EMAIL_SERVER_USER", "info@intrihub.com"))
  );
  if (!envFrom) {
    return "IntriHub <info@intrihub.com>";
  }
  if (envFrom.includes("<") && envFrom.includes(">")) {
    return envFrom;
  }
  return `IntriHub <${envFrom}>`;
}

/**
 * Creates and returns configured Nodemailer SMTP transporter for Titan Mail.
 */
export function getMailTransporter(overrideHost?: string, overridePort?: number) {
  const defaultHost = "smtpout.secureserver.net";
  const host = overrideHost || getSanitizedEnv("SMTP_HOST", getSanitizedEnv("EMAIL_SERVER_HOST", defaultHost));
  const portStr = overridePort ? String(overridePort) : getSanitizedEnv("SMTP_PORT", getSanitizedEnv("EMAIL_SERVER_PORT", "465"));
  const port = parseInt(portStr, 10);
  const user = getSanitizedEnv("SMTP_USER", getSanitizedEnv("EMAIL_SERVER_USER", "info@intrihub.com"));
  const pass = getSanitizedEnv(
    "SMTP_PASS",
    getSanitizedEnv("SMTP_PASSWORD", getSanitizedEnv("EMAIL_SERVER_PASSWORD"))
  );
  const isSecure = port === 465 || process.env.SMTP_SECURE === "true";

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    }),
    host,
    port,
    user,
    pass,
    configured: Boolean(host && user && pass),
  };
}

/**
 * Universal Titan Mail / GoDaddy SMTP Email Dispatcher with auto-fallback
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo = "support@intrihub.com",
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  const cleanTo = to.trim().toLowerCase();
  const fromAddress = getFormattedFromEmail();
  const plainTextBody = text || html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const primaryConfig = getMailTransporter();

  if (primaryConfig.configured) {
    // List candidate hosts to attempt: primary first, followed by known alternative
    const candidateHosts: Array<{ host: string; port: number }> = [
      { host: primaryConfig.host, port: primaryConfig.port },
    ];
    if (primaryConfig.host.includes("titan")) {
      candidateHosts.push({ host: "smtpout.secureserver.net", port: 465 });
    } else if (primaryConfig.host.includes("secureserver")) {
      candidateHosts.push({ host: "smtp.titan.email", port: 465 });
    }

    let lastErrorReason = "";

    for (const candidate of candidateHosts) {
      try {
        console.log(`[email] provider=smtp status=attempt host=${candidate.host}:${candidate.port} to=${maskEmail(cleanTo)}`);
        const { transporter } = getMailTransporter(candidate.host, candidate.port);

        const info = await transporter.sendMail({
          from: fromAddress,
          to: cleanTo,
          replyTo,
          subject,
          html,
          text: plainTextBody,
        });

        console.log(`[email] provider=smtp status=ok host=${candidate.host} messageId=${info?.messageId || "ok"}`);
        return { success: true, provider: "smtp", messageId: info?.messageId };
      } catch (smtpErr: unknown) {
        const err = smtpErr as { name?: string; message?: string } | null;
        lastErrorReason = `${err?.name || "SMTPError"}: ${err?.message || "Connection failed"}`;
        console.warn(`[email] provider=smtp host=${candidate.host} status=fail reason=${lastErrorReason}`);
      }
    }

    console.error(`[email] provider=smtp status=all_candidates_failed reason=${lastErrorReason}`);
    return { success: false, provider: "smtp", error: lastErrorReason };
  }

  // Development Mode Fallback
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `[email] provider=dev_fallback status=ok to=${maskEmail(cleanTo)} (Development mode: simulated delivery)`
    );
    return { success: true, provider: "dev_fallback" };
  }

  const reason = "SMTP credentials missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in environment variables.";
  console.error(`[email] provider=none status=fail reason=${reason}`);
  return {
    success: false,
    provider: "none",
    error: reason,
  };
}

/**
 * Backwards-compatible deliverEmail alias
 */
export const deliverEmail = sendEmail;

/**
 * Clean IntriHub Branded HTML OTP Mail Dispatcher
 */
export async function sendOTP({
  to,
  otp,
  purpose = "login",
  minutes = 10,
}: {
  to: string;
  otp: string;
  purpose?: string;
  minutes?: number;
}): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
  const emailHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:36px 24px;background:#f8fafc;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://www.intrihub.com" target="_blank" style="text-decoration:none;display:inline-block;">
          <img src="https://www.intrihub.com/logo/intri-web-logo.png" alt="Intrihub" width="160" height="42" style="display:block;margin:0 auto;height:42px;width:auto;max-width:180px;border:0;outline:none;text-decoration:none;" />
        </a>
        <p style="color:#64748b;font-size:13px;margin:10px 0 0;font-weight:500;">Every Material. Every Space.</p>
      </div>

      <div style="background:#ffffff;border-radius:14px;padding:32px 24px;text-align:center;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <h2 style="font-size:18px;font-weight:800;color:#1e293b;margin:0 0 8px;">Your Verification Code</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;line-height:1.5;">
          Use the 6-digit code below to securely authenticate your ${purpose} request.
        </p>

        <div style="background:#f1f5f9;border-radius:10px;padding:16px;margin:0 0 24px;display:inline-block;letter-spacing:10px;font-size:38px;font-weight:900;color:#052a51;font-family:monospace;">
          ${otp}
        </div>

        <p style="color:#94a3b8;font-size:12px;margin:0;line-height:1.5;">
          ⏱ This code will expire in <strong>${minutes} minutes</strong>.<br />For security, never share this code with anyone.
        </p>
      </div>

      <div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;text-align:center;">
        <p style="color:#64748b;font-size:11px;margin:0 0 6px;line-height:1.4;">
          IntriHub&apos;s only official website is <a href="https://www.intrihub.com" style="color:#052a51;font-weight:bold;text-decoration:none;">www.intrihub.com</a>. We are not affiliated with any other website using a similar name.
        </p>
        <p style="color:#94a3b8;font-size:11px;margin:0;line-height:1.4;">
          If you did not request this verification code, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Your Intrihub Verification Code: ${otp}`,
    html: emailHtml,
  });
}
