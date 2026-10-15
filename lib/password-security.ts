import crypto from "crypto";
import bcrypt from "bcryptjs";

/**
 * Maximum allowed password length to prevent Long Password Denial of Service (DoS)
 * against cryptographic hashing algorithms (scrypt/bcrypt/argon2).
 */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Hash password securely using industry-standard bcrypt (cost factor 10).
 * Guards against unbounded input length.
 */
export function hashPassword(password: string): string {
  if (!password || typeof password !== "string") {
    throw new Error("Password must be a non-empty string");
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`Password exceeds maximum allowed length of ${MAX_PASSWORD_LENGTH} characters`);
  }

  return bcrypt.hashSync(password, 10);
}

/**
 * Verify password against stored hash (supports bcrypt, modern scrypt, and legacy sha256).
 * Rejects oversized passwords in O(1) time without performing expensive key derivation.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash || typeof password !== "string") return false;
  if (password.length > MAX_PASSWORD_LENGTH) return false;

  const cleanPass = password.trim();

  // Format 1: Bcrypt ($2a$, $2b$, $2y$)
  if (
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$")
  ) {
    try {
      if (bcrypt.compareSync(cleanPass, storedHash)) return true;
      if (cleanPass !== password && bcrypt.compareSync(password, storedHash)) return true;
      return false;
    } catch {
      return false;
    }
  }

  // Format 2: Modern scrypt:salt:derivedKey
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];

    let derivedKey = crypto.scryptSync(cleanPass, salt, 64);
    const originalBuffer = Buffer.from(originalHash, "hex");

    if (derivedKey.length === originalBuffer.length && crypto.timingSafeEqual(derivedKey, originalBuffer)) {
      return true;
    }
    if (cleanPass !== password) {
      derivedKey = crypto.scryptSync(password, salt, 64);
      if (derivedKey.length === originalBuffer.length && crypto.timingSafeEqual(derivedKey, originalBuffer)) {
        return true;
      }
    }
    return false;
  }

  // Format 3: Legacy SHA-256
  const sha256Hash = crypto.createHash("sha256").update(cleanPass).digest("hex");
  const storedBuffer = Buffer.from(storedHash, "utf8");
  const candidateBuffer = Buffer.from(sha256Hash, "utf8");

  if (storedBuffer.length !== candidateBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
}

/**
 * Enforce minimum and maximum password strength for vendors and admin users
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string" || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, error: `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters` };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLetter || !hasNumberOrSpecial) {
    return { valid: false, error: "Password must include both letters and numbers/special characters" };
  }

  return { valid: true };
}
