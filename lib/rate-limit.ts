/**
 * Intrihub Rate Limiting & Brute-Force Lockout Engine
 * In-memory sliding window rate limiter with automated memory cleanup
 */

type RateLimitRecord = {
  timestamps: number[];
};

type LockoutRecord = {
  failedAttempts: number;
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
      if (record.lockoutUntil && record.lockoutUntil < now) {
        lockoutStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (typeof (cleanupTimer as any)?.unref === "function") (cleanupTimer as any).unref();
}

/**
 * Checks if an action is within allowed rate limits
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

/**
 * Checks if a key is currently locked out due to repeated failed attempts
 */
export function isLockedOut(key: string): { locked: boolean; lockoutUntil?: number } {
  const record = lockoutStore.get(key);
  if (!record) return { locked: false };

  const now = Date.now();
  if (record.lockoutUntil && record.lockoutUntil > now) {
    return { locked: true, lockoutUntil: record.lockoutUntil };
  }

  if (record.lockoutUntil && record.lockoutUntil <= now) {
    lockoutStore.delete(key);
  }

  return { locked: false };
}

/**
 * Records a failed attempt for brute-force protection
 */
export function recordFailedAttempt(
  key: string,
  maxAttempts: number,
  lockoutDurationMs: number
): { locked: boolean; remainingAttempts: number; lockoutUntil?: number } {
  const now = Date.now();
  let record = lockoutStore.get(key);

  if (!record) {
    record = { failedAttempts: 0 };
    lockoutStore.set(key, record);
  }

  record.failedAttempts += 1;

  if (record.failedAttempts >= maxAttempts) {
    record.lockoutUntil = now + lockoutDurationMs;
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutUntil: record.lockoutUntil,
    };
  }

  return {
    locked: false,
    remainingAttempts: maxAttempts - record.failedAttempts,
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

const VENDOR_LOCKOUT_MAX_ATTEMPTS = 3;
const VENDOR_LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Checks if an IP is locked out from vendor login attempts
 */
export function checkVendorLoginLockout(ip: string): {
  locked: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
} {
  const key = `vendor_login_ip:${ip || "unknown"}`;
  const status = isLockedOut(key);

  if (status.locked && status.lockoutUntil) {
    const remainingSeconds = Math.max(1, Math.ceil((status.lockoutUntil - Date.now()) / 1000));
    return {
      locked: true,
      lockoutUntil: status.lockoutUntil,
      retryAfterSeconds: remainingSeconds,
    };
  }

  return { locked: false };
}

/**
 * Records a failed vendor login attempt for an IP
 */
export function recordVendorLoginFailure(ip: string): {
  locked: boolean;
  remainingAttempts: number;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
} {
  const key = `vendor_login_ip:${ip || "unknown"}`;
  const result = recordFailedAttempt(
    key,
    VENDOR_LOCKOUT_MAX_ATTEMPTS,
    VENDOR_LOCKOUT_DURATION_MS
  );

  if (result.locked && result.lockoutUntil) {
    const remainingSeconds = Math.max(1, Math.ceil((result.lockoutUntil - Date.now()) / 1000));
    return {
      locked: true,
      remainingAttempts: 0,
      lockoutUntil: result.lockoutUntil,
      retryAfterSeconds: remainingSeconds,
    };
  }

  return {
    locked: false,
    remainingAttempts: result.remainingAttempts,
  };
}

/**
 * Resets failed vendor login attempts for an IP on successful login
 */
export function resetVendorLoginLockout(ip: string): void {
  const key = `vendor_login_ip:${ip || "unknown"}`;
  resetFailedAttempts(key);
}

