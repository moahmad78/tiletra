import crypto from "crypto";

/**
 * Hash password securely using Node.js native crypto.scrypt
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verify password against stored hash (supports modern scrypt and legacy sha256)
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  // Format 1: Modern scrypt:salt:derivedKey
  if (storedHash.startsWith("scrypt:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const originalHash = parts[2];

    const derivedKey = crypto.scryptSync(password, salt, 64);
    const originalBuffer = Buffer.from(originalHash, "hex");

    if (derivedKey.length !== originalBuffer.length) return false;
    return crypto.timingSafeEqual(derivedKey, originalBuffer);
  }

  // Format 2: Legacy SHA-256
  const sha256Hash = crypto.createHash("sha256").update(password.trim()).digest("hex");
  const storedBuffer = Buffer.from(storedHash, "utf8");
  const candidateBuffer = Buffer.from(sha256Hash, "utf8");

  if (storedBuffer.length !== candidateBuffer.length) return false;
  return crypto.timingSafeEqual(storedBuffer, candidateBuffer);
}

/**
 * Enforce minimum password strength for vendors and admin users
 */
export function validatePasswordStrength(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasLetter || !hasNumberOrSpecial) {
    return { valid: false, error: "Password must include both letters and numbers/special characters" };
  }

  return { valid: true };
}
