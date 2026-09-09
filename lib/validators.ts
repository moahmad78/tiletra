/**
 * Intrihub Core Validator Suite
 * Hardened against Regular Expression Denial of Service (ReDoS)
 * Enforces strict length bounds before regex evaluation to guarantee linear O(N) execution.
 */

// RFC 5321 specifies maximum email length as 254 characters
export const MAX_EMAIL_LENGTH = 254;

/**
 * Validates an email address with strict length bounding and linear time regex.
 */
export function validateEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== "string") return false;
  const clean = email.trim();
  if (clean.length < 3 || clean.length > MAX_EMAIL_LENGTH) return false;
  // Linear-time email validation pattern without nested quantifiers
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(clean);
}

/**
 * Validates an Indian 10-digit mobile phone number (starts with 6-9).
 * Accepts formatted strings like +91 98765 43210 or raw 10 digits.
 */
export function validatePhone(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  // Bound max raw length to prevent oversized inputs
  if (trimmed.length < 10 || trimmed.length > 20) return false;
  const clean = trimmed.replace(/\D/g, "").slice(-10);
  if (clean.length !== 10) return false;
  return /^[6-9]\d{9}$/.test(clean);
}

/**
 * Validates a 15-character Indian Goods and Services Tax Identification Number (GSTIN).
 * Format: 2 digits (state code) + 5 letters (PAN) + 4 digits + 1 letter + 1 char + 'Z' + 1 checksum char
 */
export function validateGSTIN(gstin: string | null | undefined): boolean {
  if (!gstin || typeof gstin !== "string") return false;
  const clean = gstin.trim().toUpperCase();
  if (clean.length !== 15) return false;
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(clean);
}

/**
 * Validates a 10-character Indian Permanent Account Number (PAN).
 * Format: 5 uppercase letters + 4 digits + 1 uppercase letter
 */
export function validatePAN(pan: string | null | undefined): boolean {
  if (!pan || typeof pan !== "string") return false;
  const clean = pan.trim().toUpperCase();
  if (clean.length !== 10) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(clean);
}

/**
 * Validates an 11-character Indian Financial System Code (IFSC).
 * Format: 4 letters (bank code) + '0' (reserved) + 6 alphanumeric characters (branch code)
 */
export function validateIFSC(ifsc: string | null | undefined): boolean {
  if (!ifsc || typeof ifsc !== "string") return false;
  const clean = ifsc.trim().toUpperCase();
  if (clean.length !== 11) return false;
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean);
}

/**
 * Validates a 6-digit Indian Postal Pincode (cannot begin with 0).
 */
export function validatePincode(pincode: string | null | undefined): boolean {
  if (!pincode || typeof pincode !== "string") return false;
  const clean = pincode.replace(/\D/g, "");
  if (clean.length !== 6) return false;
  return /^[1-9][0-9]{5}$/.test(clean);
}

/**
 * Validates a Unified Payments Interface (UPI) Virtual Payment Address (VPA).
 * Format: username@handle (bounded length to prevent ReDoS)
 */
export function validateUPI(vpa: string | null | undefined): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const clean = vpa.trim();
  if (clean.length < 3 || clean.length > 256) return false;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(clean);
}

/**
 * Safe slugification utility without nested or anchored quantifier backtracking.
 * Replaces risky `(^-|-$)+` with strictly linear boundary trimming.
 */
export function safeSlugify(text: string | null | undefined): string {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
