/**
 * Intrihub Rate Limiting & Brute-Force Lockout Engine
 * In-memory sliding window rate limiter and security brute-force lockout protection
 */

type RateLimitRecord = {
  timestamps: number[];
};

type LockoutRecord = {
  failedAttempts: number;
  firstAttemptAt: number;
  lastAttemptAt: number;
  lockoutUntil?: number;
};

const rateLimitStore = new Map<string, RateLimitRecord>();
const lockoutStore = new Map<string, LockoutRecord>();

// Cleanup stale entries periodically
if (typeof setInterval !== "undefined") {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 3600000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
    for (const [key, record] of lockoutStore.entries()) {
      // If lockout duration is past or attempts window is past 1 hour, clean up
      if (record.lockoutUntil && record.lockoutUntil < now) {
        lockoutStore.delete(key);
      } else if (!record.lockoutUntil && now - record.lastAttemptAt > 3600000) {
        lockoutStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (typeof (cleanupTimer as any)?.unref === "function") (cleanupTimer as any).unref();
}

/**
 * Checks if an action is within allowed rate limits (sliding window)
 * @param key Unique identifier (e.g. "otp:user@example.com" or "apply:ip_address")
 * @param limit Maximum allowed requests in the time window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps to only those within the current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0] || now;
    const resetTime = oldestTimestamp + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetTime: now + windowMs,
  };
}

const DEFAULT_ATTEMPTS_WINDOW_MS = 15 * 60 * 1000; // 15 minutes window for failed attempts

/**
 * Checks if a key is currently locked out due to repeated failed attempts
 */
export function isLockedOut(key: string): {
  locked: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
} {
  const record = lockoutStore.get(key);
  if (!record) return { locked: false, remainingAttempts: 3 };

  const now = Date.now();

  // If lockout is currently active
  if (record.lockoutUntil && record.lockoutUntil > now) {
    const remainingSeconds = Math.max(1, Math.ceil((record.lockoutUntil - now) / 1000));
    return {
      locked: true,
      lockoutUntil: record.lockoutUntil,
      retryAfterSeconds: remainingSeconds,
      remainingAttempts: 0,
    };
  }

  // If previous lockout has expired, purge the record and reset
  if (record.lockoutUntil && record.lockoutUntil <= now) {
    lockoutStore.delete(key);
    return { locked: false, remainingAttempts: 3 };
  }

  // If failed attempts occurred outside the 15-minute window without locking, reset
  if (now - record.lastAttemptAt > DEFAULT_ATTEMPTS_WINDOW_MS) {
    lockoutStore.delete(key);
    return { locked: false, remainingAttempts: 3 };
  }

  return {
    locked: false,
    remainingAttempts: Math.max(0, 3 - record.failedAttempts),
  };
}

/**
 * Records a failed attempt for brute-force protection.
 * Only triggers lockout after EXACTLY maxAttempts failed attempts within windowMs.
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number = 3,
  lockoutDurationMs: number = 15 * 60 * 1000,
  windowMs: number = DEFAULT_ATTEMPTS_WINDOW_MS
): {
  locked: boolean;
  remainingAttempts: number;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  let record = lockoutStore.get(key);

  // If already locked and duration is still active
  if (record && record.lockoutUntil && record.lockoutUntil > now) {
    const remainingSeconds = Math.max(1, Math.ceil((record.lockoutUntil - now) / 1000));
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutUntil: record.lockoutUntil,
      retryAfterSeconds: remainingSeconds,
    };
  }

  // If previous lockout expired OR attempts window elapsed, start fresh from 0
  if (
    !record ||
    (record.lockoutUntil && record.lockoutUntil <= now) ||
    now - record.lastAttemptAt > windowMs
  ) {
    record = {
      failedAttempts: 0,
      firstAttemptAt: now,
      lastAttemptAt: now,
    };
    lockoutStore.set(key, record);
  }

  // Increment failed attempts
  record.failedAttempts += 1;
  record.lastAttemptAt = now;

  // Lockout ONLY when failed attempts reach or exceed maxAttempts (e.g. 3)
  if (record.failedAttempts >= maxAttempts) {
    record.lockoutUntil = now + lockoutDurationMs;
    const remainingSeconds = Math.max(1, Math.ceil(lockoutDurationMs / 1000));
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutUntil: record.lockoutUntil,
      retryAfterSeconds: remainingSeconds,
    };
  }

  const remaining = Math.max(0, maxAttempts - record.failedAttempts);
  return {
    locked: false,
    remainingAttempts: remaining,
  };
}

/**
 * Resets failed attempts after a successful operation
 */
export function resetFailedAttempts(key: string): void {
  lockoutStore.delete(key);
}

/**
 * Resets rate limit counters for a key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

// ─────────────────────────────────────────────────────────────────────────────
// PORTAL-SPECIFIC HELPERS (3 ATTEMPTS -> 15 MINUTES LOCKOUT)
// ─────────────────────────────────────────────────────────────────────────────

const PORTAL_LOCKOUT_MAX_ATTEMPTS = 3;
const PORTAL_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Admin Login Lockout Check
 */
export function checkAdminLoginLockout(ip: string): {
  locked: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
} {
  const key = `admin_login_ip:${ip || "unknown"}`;
  return isLockedOut(key);
}

/**
 * Record Admin Login Failure
 */
export function recordAdminLoginFailure(ip: string): {
  locked: boolean;
  remainingAttempts: number;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
} {
  const key = `admin_login_ip:${ip || "unknown"}`;
  return recordFailedAttempt(
    key,
    PORTAL_LOCKOUT_MAX_ATTEMPTS,
    PORTAL_LOCKOUT_DURATION_MS
  );
}

/**
 * Reset Admin Login Lockout
 */
export function resetAdminLoginLockout(ip: string): void {
  const key = `admin_login_ip:${ip || "unknown"}`;
  resetFailedAttempts(key);
}

/**
 * Vendor Login Lockout Check
 */
export function checkVendorLoginLockout(ip: string): {
  locked: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
} {
  const key = `vendor_login_ip:${ip || "unknown"}`;
  return isLockedOut(key);
}

/**
 * Record Vendor Login Failure
 */
export function recordVendorLoginFailure(ip: string): {
  locked: boolean;
  remainingAttempts: number;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
} {
  const key = `vendor_login_ip:${ip || "unknown"}`;
  return recordFailedAttempt(
    key,
    PORTAL_LOCKOUT_MAX_ATTEMPTS,
    PORTAL_LOCKOUT_DURATION_MS
  );
}

/**
 * Reset Vendor Login Lockout
 */
export function resetVendorLoginLockout(ip: string): void {
  const key = `vendor_login_ip:${ip || "unknown"}`;
  resetFailedAttempts(key);
}

/**
 * Mobile Business Auth Lockout Check
 */
export function checkMobileAuthLockout(ip: string): {
  locked: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
} {
  const key = `mobile_auth_ip:${ip || "unknown"}`;
  return isLockedOut(key);
}

/**
 * Record Mobile Business Auth Failure
 */
export function recordMobileAuthFailure(ip: string): {
  locked: boolean;
  remainingAttempts: number;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
} {
  const key = `mobile_auth_ip:${ip || "unknown"}`;
  return recordFailedAttempt(
    key,
    PORTAL_LOCKOUT_MAX_ATTEMPTS,
    PORTAL_LOCKOUT_DURATION_MS
  );
}

/**
 * Reset Mobile Business Auth Lockout
 */
export function resetMobileAuthLockout(ip: string): void {
  const key = `mobile_auth_ip:${ip || "unknown"}`;
  resetFailedAttempts(key);
}
