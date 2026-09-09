/**
 * Intrihub Centralized Security Logger & Anomaly Detection System
 * Standardized structured logging for:
 * 1. Authentication attempts (success, failure, lockout)
 * 2. API errors & unauthorized / IDOR access attempts
 * 3. Unusual traffic patterns & automated vulnerability probing
 *
 * Persists high-severity security events to the AuditLog database table.
 */

import { prisma } from "@/lib/prisma";

// Sliding window tracker for anomalous traffic detection (in-memory)
interface TrafficWindow {
  authFailures: number[];
  authErrors: number[];
  lastAlert: number;
}

const trafficMonitor = new Map<string, TrafficWindow>();
const WINDOW_DURATION_MS = 5 * 60 * 1000; // 5-minute sliding window
const ANOMALY_THRESHOLD_AUTH_FAIL = 5; // 5 failed auths in 5 mins -> anomaly
const ANOMALY_THRESHOLD_AUTH_ERROR = 10; // 10 unauthorized requests in 5 mins -> anomaly
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15-minute cooldown between repeated alerts for same IP

function maskIdentifier(val: string): string {
  if (!val) return "***";
  if (val.includes("@")) {
    const [name, domain] = val.split("@");
    if (!domain) return "***";
    const maskedName = name.length <= 2 ? name[0] + "***" : name.slice(0, 2) + "***" + name.slice(-1);
    return `${maskedName}@${domain}`;
  }
  const clean = val.replace(/\D/g, "");
  if (clean.length >= 10) {
    return clean.slice(0, 2) + "******" + clean.slice(-2);
  }
  return "***";
}

async function persistSecurityAuditLog(data: {
  action: string;
  userId?: string | null;
  ipAddress?: string | null;
  details: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: data.action,
        entity: "SecurityEvent",
        userId: data.userId || null,
        ipAddress: data.ipAddress || null,
        details: {
          timestamp: new Date().toISOString(),
          ...data.details,
        },
      },
    });
  } catch (err) {
    // Non-blocking fallback if DB is momentarily unreachable
    console.error("[SEC-ERROR] Failed to persist security audit log to DB:", err);
  }
}

class SecurityLogger {
  /**
   * Log an authentication attempt (login, OTP verification, token refresh)
   */
  async logAuthAttempt(options: {
    type: "login" | "otp" | "token_refresh" | "password_change";
    status: "success" | "failure" | "lockout";
    identifier: string;
    role?: string;
    ip?: string;
    userAgent?: string;
    reason?: string;
    userId?: string;
  }) {
    const timestamp = new Date().toISOString();
    const masked = maskIdentifier(options.identifier);
    const ip = options.ip || "unknown";

    if (options.status === "success") {
      console.log(
        `[SEC-AUDIT] [AUTH_SUCCESS] type=${options.type} identifier=${masked} role=${options.role || "user"} ip=${ip} time=${timestamp}`
      );
    } else if (options.status === "failure") {
      console.warn(
        `[SEC-WARN] [AUTH_FAILURE] type=${options.type} identifier=${masked} ip=${ip} reason="${options.reason || "Invalid credentials"}" time=${timestamp}`
      );
      await this.checkTrafficAnomaly(ip, "auth_fail", masked);
    } else if (options.status === "lockout") {
      console.error(
        `[SEC-ALERT] [AUTH_LOCKOUT] identifier=${masked} ip=${ip} reason="Brute force threshold exceeded" time=${timestamp}`
      );
      await persistSecurityAuditLog({
        action: "AUTH_LOCKOUT",
        userId: options.userId,
        ipAddress: ip,
        details: {
          identifier: masked,
          type: options.type,
          userAgent: options.userAgent,
          reason: options.reason || "Account temporarily locked due to excessive failed attempts",
        },
      });
    }
  }

  /**
   * Log unauthorized or forbidden access attempts (IDOR, missing session, wrong role)
   */
  async logUnauthorizedAccess(options: {
    path: string;
    method?: string;
    ip?: string;
    userId?: string;
    role?: string;
    reason?: string;
  }) {
    const timestamp = new Date().toISOString();
    const ip = options.ip || "unknown";

    console.warn(
      `[SEC-ALERT] [UNAUTHORIZED_ACCESS] path=${options.path} method=${options.method || "UNKNOWN"} userId=${options.userId || "none"} ip=${ip} reason="${options.reason || "Unauthorized"}" time=${timestamp}`
    );

    await this.checkTrafficAnomaly(ip, "auth_error", options.path);

    // Persist serious access control rejections
    if (options.reason?.includes("IDOR") || options.reason?.includes("privileges required")) {
      await persistSecurityAuditLog({
        action: "IDOR_OR_PRIVILEGE_VIOLATION",
        userId: options.userId,
        ipAddress: ip,
        details: {
          path: options.path,
          method: options.method,
          reason: options.reason,
        },
      });
    }
  }

  /**
   * Log API errors (500 internal server errors, unhandled exceptions)
   */
  logApiError(options: {
    path: string;
    statusCode: number;
    error: Error | string;
    ip?: string;
    userId?: string;
  }) {
    const timestamp = new Date().toISOString();
    const errMsg = typeof options.error === "string" ? options.error : options.error.message;

    console.error(
      `[SEC-ERROR] [API_ERROR] status=${options.statusCode} path=${options.path} ip=${options.ip || "unknown"} error="${errMsg}" time=${timestamp}`
    );
  }

  /**
   * Anomaly detection: evaluates sliding window request volume for suspicious traffic patterns
   */
  async checkTrafficAnomaly(ip: string, eventType: "auth_fail" | "auth_error", detail?: string) {
    if (!ip || ip === "unknown" || ip === "127.0.0.1" || ip === "localhost") return;

    const now = Date.now();
    let record = trafficMonitor.get(ip);
    if (!record) {
      record = { authFailures: [], authErrors: [], lastAlert: 0 };
      trafficMonitor.set(ip, record);
    }

    // Prune events older than sliding window
    record.authFailures = record.authFailures.filter((t) => now - t < WINDOW_DURATION_MS);
    record.authErrors = record.authErrors.filter((t) => now - t < WINDOW_DURATION_MS);

    if (eventType === "auth_fail") {
      record.authFailures.push(now);
    } else {
      record.authErrors.push(now);
    }

    const isFailureBurst = record.authFailures.length >= ANOMALY_THRESHOLD_AUTH_FAIL;
    const isErrorBurst = record.authErrors.length >= ANOMALY_THRESHOLD_AUTH_ERROR;

    if ((isFailureBurst || isErrorBurst) && now - record.lastAlert > ALERT_COOLDOWN_MS) {
      record.lastAlert = now;
      const pattern = isFailureBurst
        ? `Credential stuffing burst (${record.authFailures.length} failed auths in 5m)`
        : `API scanning / fuzzing probe (${record.authErrors.length} unauthorized requests in 5m)`;

      console.error(
        `[SEC-ALERT] [ANOMALOUS_TRAFFIC_DETECTED] ip=${ip} pattern="${pattern}" detail="${detail || ""}" time=${new Date().toISOString()}`
      );

      await persistSecurityAuditLog({
        action: "SUSPICIOUS_TRAFFIC_BURST",
        ipAddress: ip,
        details: {
          pattern,
          authFailuresInWindow: record.authFailures.length,
          authErrorsInWindow: record.authErrors.length,
          recentDetail: detail,
        },
      });
    }
  }
}

export const securityLogger = new SecurityLogger();
