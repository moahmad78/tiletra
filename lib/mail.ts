import nodemailer from "nodemailer";
import { renderOtpEmailHtml } from "@/lib/email-templates";

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
 * Dispatches mail errors to Sentry if available in runtime/global context.
 * Never leaks passwords or credentials.
 */
export function captureMailError(
  error: unknown,
  context: {
    event: "startup_verify" | "send_failure" | "unconfigured";
    host?: string;
    port?: number;
    user?: string;
    to?: string;
    subject?: string;
    errorDetails?: string;
  }
) {
  try {
    const errorObj = error instanceof Error ? error : new Error(String(error || "Unknown Mail Error"));

    // 1. Check globalThis.Sentry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const globalSentry = (globalThis as any).Sentry;
    if (globalSentry && typeof globalSentry.captureException === "function") {
      globalSentry.captureException(errorObj, {
        tags: { service: "smtp", event: context.event },
        extra: {
          host: context.host,
          port: context.port,
          user: context.user,
          recipient: context.to,
          subject: context.subject,
          details: context.errorDetails,
        },
      });
      return;
    }

    // 2. Check dynamic require in Node environment
    if (typeof require !== "undefined") {
      try {
        // Safely resolve without triggering bundler missing package trace
        const sentryPkgName = "@sentry/nextjs";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const req = typeof eval === "function" ? eval("require") : null;
        const sentry = req ? req(sentryPkgName) : null;
        if (sentry && typeof sentry.captureException === "function") {
          sentry.captureException(errorObj, {
            tags: { service: "smtp", event: context.event },
            extra: {
              host: context.host,
              port: context.port,
              user: context.user,
              recipient: context.to,
              subject: context.subject,
              details: context.errorDetails,
            },
          });
          return;
        }
      } catch {
        // Sentry package not installed
      }
    }
  } catch (sentryErr) {
    // Fail silently so error logging never breaks mail workflow
    console.warn("[email] Sentry capture exception failed:", (sentryErr as Error)?.message);
  }
}

export interface SmtpCandidate {
  host: string;
  port: number;
}

/**
 * Builds an ordered, deduplicated list of SMTP endpoints to attempt,
 * covering implicit TLS (465), STARTTLS (587), and alternate GoDaddy/Titan relays.
 */
export function getSmtpCandidates(primaryHost: string, primaryPort: number): SmtpCandidate[] {
  const cleanHost = primaryHost.trim();
  const normalizedPort = Number.isFinite(primaryPort) && primaryPort > 0 ? primaryPort : 465;
  const altPort = normalizedPort === 465 ? 587 : 465;

  const raw: SmtpCandidate[] = [
    { host: cleanHost, port: normalizedPort },
    { host: cleanHost, port: altPort },
  ];

  if (cleanHost.includes("titan")) {
    raw.push(
      { host: "smtpout.secureserver.net", port: 465 },
      { host: "smtpout.secureserver.net", port: 587 },
      { host: "smtpout.asia.secureserver.net", port: 465 },
      { host: "smtpout.europe.secureserver.net", port: 587 }
    );
  } else {
    raw.push(
      { host: "smtpout.secureserver.net", port: 465 },
      { host: "smtpout.secureserver.net", port: 587 },
      { host: "smtpout.asia.secureserver.net", port: 465 },
      { host: "smtpout.europe.secureserver.net", port: 587 },
      { host: "smtp.titan.email", port: 465 },
      { host: "smtp.titan.email", port: 587 }
    );
  }

  const seen = new Set<string>();
  return raw.filter((candidate) => {
    const key = `${candidate.host.toLowerCase()}:${candidate.port}`;
    if (!candidate.host || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getSmtpAuthGroup(host: string): string {
  const lower = host.toLowerCase();
  if (lower.endsWith("secureserver.net")) return "secureserver.net";
  if (lower.endsWith("titan.email")) return "titan.email";
  return lower;
}

function isSmtpAuthError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; responseCode?: number; message?: string; response?: string };
  if (e.code === "EAUTH" || e.responseCode === 535) return true;
  const text = `${e.message || ""} ${e.response || ""}`;
  return /\b535\b|invalid login|authentication failed/i.test(text);
}

/**
 * Creates and returns configured Nodemailer SMTP transporter.
 */
export function getMailTransporter(overrideHost?: string, overridePort?: number) {
  const defaultHost = "smtpout.secureserver.net";
  const host = overrideHost || getSanitizedEnv("SMTP_HOST", getSanitizedEnv("EMAIL_SERVER_HOST", defaultHost));
  const portStr = overridePort ? String(overridePort) : getSanitizedEnv("SMTP_PORT", getSanitizedEnv("EMAIL_SERVER_PORT", "465"));
  const port = parseInt(portStr, 10) || 465;
  const user = getSanitizedEnv("SMTP_USER", getSanitizedEnv("EMAIL_SERVER_USER", "info@intrihub.com"));
  const pass = getSanitizedEnv(
    "SMTP_PASS",
    getSanitizedEnv("SMTP_PASSWORD", getSanitizedEnv("EMAIL_SERVER_PASSWORD"))
  );
  const isSecure = overridePort !== undefined ? overridePort === 465 : port === 465 || process.env.SMTP_SECURE === "true";

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: isSecure,
      requireTLS: !isSecure && port === 587,
      auth: {
        user,
        pass,
      },
      tls: {
        minVersion: "TLSv1.2",
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      dnsTimeout: 5000,
    }),
    host,
    port,
    user,
    pass,
    configured: Boolean(host && user && pass),
  };
}

let verifyPromise: Promise<boolean> | null = null;

/**
 * Runs transporter.verify() at startup across primary and fallback SMTP endpoints.
 * Logs host, port, user and connection status without exposing secrets.
 */
export function verifyTransporterStartup(): Promise<boolean> {
  if (verifyPromise) return verifyPromise;

  const { host, port, user, configured } = getMailTransporter();
  if (!configured) {
    console.log(
      `[email] startup_verify: skipped (SMTP credentials incomplete: host=${host} user=${user} pass=${configured ? "configured" : "missing"})`
    );
    verifyPromise = Promise.resolve(false);
    return verifyPromise;
  }

  verifyPromise = (async () => {
    const candidates = getSmtpCandidates(host, port);
    const authFailedGroups = new Set<string>();
    let lastError: unknown = null;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const authGroup = getSmtpAuthGroup(candidate.host);
      if (authFailedGroups.has(authGroup)) continue;

      try {
        const { transporter } = getMailTransporter(candidate.host, candidate.port);
        const success = await transporter.verify();
        const label = i === 0 ? "success" : "fallback_success";
        console.log(
          `[email] startup_verify: ${label} host=${candidate.host}:${candidate.port} user=${user} ready=${Boolean(success)}`
        );
        return true;
      } catch (err) {
        lastError = err;
        const errorMsg = (err as { message?: string })?.message || "SMTP verification failed";
        if (isSmtpAuthError(err)) authFailedGroups.add(authGroup);
        console.warn(`[email] startup_verify: fail host=${candidate.host}:${candidate.port} user=${user} error=${errorMsg}`);
      }
    }

    const lastMsg = (lastError as { message?: string })?.message || "All SMTP candidates failed verification";
    captureMailError(lastError, {
      event: "startup_verify",
      host,
      port,
      user,
      errorDetails: lastMsg,
    });
    return false;
  })();

  return verifyPromise;
}

// Auto-trigger verify once when module is loaded in Node.js server runtime (skip build & test)
if (
  typeof window === "undefined" &&
  process.env.NODE_ENV !== "test" &&
  process.env.NEXT_PHASE !== "phase-production-build"
) {
  verifyTransporterStartup().catch(() => {});
}

/**
 * Universal SMTP Email Dispatcher with multi-port & relay auto-fallback
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
    const candidateHosts = getSmtpCandidates(primaryConfig.host, primaryConfig.port);
    const authFailedGroups = new Set<string>();
    let lastErrorReason = "";

    for (const candidate of candidateHosts) {
      const authGroup = getSmtpAuthGroup(candidate.host);
      if (authFailedGroups.has(authGroup)) continue;

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

        console.log(`[email] provider=smtp status=ok host=${candidate.host}:${candidate.port} messageId=${info?.messageId || "ok"}`);
        return { success: true, provider: "smtp", messageId: info?.messageId };
      } catch (smtpErr: unknown) {
        const err = smtpErr as { name?: string; message?: string } | null;
        lastErrorReason = `${err?.name || "SMTPError"}: ${err?.message || "Connection failed"}`;
        if (isSmtpAuthError(smtpErr)) authFailedGroups.add(authGroup);
        console.warn(`[email] provider=smtp host=${candidate.host}:${candidate.port} status=fail reason=${lastErrorReason}`);
      }
    }

    console.error(`[email] provider=smtp status=all_candidates_failed reason=${lastErrorReason}`);

    // Dispatches error to Sentry on send failure
    captureMailError(new Error(`[SMTP Send Failed] ${lastErrorReason}`), {
      event: "send_failure",
      host: primaryConfig.host,
      port: primaryConfig.port,
      user: primaryConfig.user,
      to: maskEmail(cleanTo),
      subject,
      errorDetails: lastErrorReason,
    });

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
  captureMailError(new Error(reason), {
    event: "unconfigured",
    to: maskEmail(cleanTo),
    subject,
    errorDetails: reason,
  });
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
  const emailHtml = renderOtpEmailHtml({
    otp,
    purpose,
    minutes,
  });

  return sendEmail({
    to,
    subject: `Your Intrihub Verification Code: ${otp}`,
    html: emailHtml,
  });
}
