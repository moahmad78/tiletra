/**
 * Intrihub Runtime Environment & Secrets Security Validator
 * Validates that production deployments have properly configured secrets,
 * encrypted database connections, and no sensitive credentials leaked
 * to client-accessible NEXT_PUBLIC_* variables.
 */

const KNOWN_INSECURE_SECRETS = new Set([
  "intrihub-admin-secure-key-2026",
  "intrihub-vendor-secure-key-2026",
  "secret",
  "changeme",
  "123456",
  "password",
]);

// Allowable public environment variables
const ALLOWED_PUBLIC_KEYS = new Set([
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_RAZORPAY_KEY_ID",
  "NEXT_PUBLIC_GOOGLE_MAPS_KEY",
  "NEXT_PUBLIC_SOCKET_URL",
]);

export interface EnvValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Validates secrets hygiene and database connection encryption.
 */
export function validateProductionSecrets(): EnvValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  // 1. Audit NEXT_PUBLIC_* variables for accidental credential exposure
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_") && !ALLOWED_PUBLIC_KEYS.has(key)) {
      const upper = key.toUpperCase();
      if (
        upper.includes("SECRET") ||
        upper.includes("PASSWORD") ||
        upper.includes("DATABASE") ||
        upper.includes("PRIVATE") ||
        upper.includes("TOKEN")
      ) {
        errors.push(
          `Critical Security Violation: ${key} exposes sensitive credentials to frontend client bundles!`
        );
      }
    }
  }

  // 2. Validate cryptographic session secrets in production
  if (isProduction) {
    const adminSecret = process.env.ADMIN_SESSION_SECRET;
    if (!adminSecret) {
      warnings.push("ADMIN_SESSION_SECRET is not explicitly set; fallback secret in use.");
    } else if (KNOWN_INSECURE_SECRETS.has(adminSecret.toLowerCase().trim())) {
      errors.push("ADMIN_SESSION_SECRET is using an insecure or default placeholder value.");
    }

    const vendorSecret = process.env.VENDOR_SESSION_SECRET;
    if (!vendorSecret) {
      warnings.push("VENDOR_SESSION_SECRET is not explicitly set; fallback secret in use.");
    } else if (KNOWN_INSECURE_SECRETS.has(vendorSecret.toLowerCase().trim())) {
      errors.push("VENDOR_SESSION_SECRET is using an insecure or default placeholder value.");
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!jwtSecret) {
      warnings.push("JWT_SECRET / NEXTAUTH_SECRET is not set; mobile authentication security reduced.");
    } else if (KNOWN_INSECURE_SECRETS.has(jwtSecret.toLowerCase().trim())) {
      errors.push("JWT_SECRET is using an insecure or default placeholder value.");
    }
  }

  // 3. Validate Database SSL/TLS encryption
  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl) {
    const isLocalDb =
      dbUrl.includes("localhost") ||
      dbUrl.includes("127.0.0.1") ||
      dbUrl.includes("::1");

    if (isProduction && !isLocalDb) {
      const lowerUrl = dbUrl.toLowerCase();
      const hasSsl =
        lowerUrl.includes("sslmode=require") ||
        lowerUrl.includes("sslmode=verify-full") ||
        lowerUrl.includes("ssl=true") ||
        lowerUrl.includes("sslmode=prefer");

      if (!hasSsl) {
        errors.push(
          "DATABASE_URL in production must enforce SSL encryption (e.g. ?sslmode=require) to prevent plaintext interception over public networks."
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  };
}

/**
 * Returns a sanitized diagnostic status of the environment without leaking secret values.
 */
export function getSafeDeploymentStatus() {
  const isProduction = process.env.NODE_ENV === "production";
  const dbUrl = process.env.DATABASE_URL || "";

  return {
    environment: process.env.NODE_ENV || "development",
    isProduction,
    databaseSslConfigured:
      dbUrl.includes("sslmode=require") ||
      dbUrl.includes("sslmode=verify-full") ||
      dbUrl.includes("ssl=true"),
    adminAuthConfigured: Boolean(process.env.ADMIN_SESSION_SECRET),
    vendorAuthConfigured: Boolean(process.env.VENDOR_SESSION_SECRET),
    jwtConfigured: Boolean(process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET),
    emailProviderConfigured: Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    paymentConfigured: Boolean(process.env.RAZORPAY_KEY_SECRET),
    storageConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  };
}
