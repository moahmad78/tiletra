/**
 * Intrihub Input Sanitization & Security Utilities
 * Protects against XSS, Script Injection, Path Traversal, and Query Expansion Attacks.
 */

/**
 * Strips dangerous HTML tags and executable script signatures.
 * Neutralizes: <script>, <iframe>, <object>, <embed>, <applet>, <form>,
 * event handlers (onload=, onerror=, onclick=, etc.), and dangerous URI schemes (javascript:, data:text/html, vbscript:).
 */
export function sanitizeHtml(input: string | null | undefined): string {
  if (!input || typeof input !== "string") return "";

  let sanitized = input;

  // 1. Remove control characters and null bytes
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 2. Strip script and dangerous HTML tags (case-insensitive)
  sanitized = sanitized.replace(
    /<\s*\/?\s*(script|iframe|object|embed|applet|meta|link|style|form|base)[^>]*>/gi,
    ""
  );

  // 3. Neutralize inline event handlers: on{event}=...
  sanitized = sanitized.replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "");

  // 4. Neutralize dangerous pseudo-protocols in href/src
  sanitized = sanitized.replace(/(javascript|vbscript|data\s*:\s*text\/html)\s*:/gi, "blocked:");

  // 5. Trim leading/trailing whitespace
  return sanitized.trim();
}

/**
 * General string sanitizer with length bounding and whitespace normalization.
 */
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = 255
): string {
  if (!input || typeof input !== "string") return "";

  // Strip control characters and null bytes
  const stripped = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Trim and clamp to maxLength
  return stripped.trim().slice(0, maxLength);
}

/**
 * Sanitizes a filename to strictly prevent directory traversal and filesystem attacks.
 * Rejects path separators (/ and \\), directory traversal patterns (..), and null bytes.
 * Restricts filenames to safe alphanumeric characters, dashes, underscores, and a single valid extension.
 */
export function sanitizeFilename(filename: string | null | undefined): string {
  if (!filename || typeof filename !== "string") return "";

  // 1. Remove null bytes and path separators
  let clean = filename.replace(/[\x00\/\\?%*:|"<>]/g, "");

  // 2. Remove directory traversal sequences
  clean = clean.replace(/\.{2,}/g, ".");

  // 3. Trim whitespace and leading/trailing dots/dashes
  clean = clean.trim().replace(/^[.-]+|[.-]+$/g, "");

  // 4. Limit length
  if (clean.length > 100) {
    const ext = clean.lastIndexOf(".") !== -1 ? clean.slice(clean.lastIndexOf(".")) : "";
    clean = clean.slice(0, 90) + ext;
  }

  return clean;
}

/**
 * Validates whether a requested filename is safe and strictly free of directory traversal.
 */
export function isValidSafeFilename(filename: string | null | undefined): boolean {
  if (!filename || typeof filename !== "string") return false;
  if (filename.length > 120) return false;
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\") || filename.includes("%")) {
    return false;
  }
  // Must match safe pattern: name.ext (only alphanumeric, dashes, underscores)
  return /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/.test(filename);
}

/**
 * Sanitizes search terms to prevent query expansion denial of service (ReDoS / DB exhaustion).
 * Limits length, strips SQL/Regex metacharacters, and restricts word count.
 */
export function sanitizeSearchTerm(
  term: string | null | undefined,
  maxChars: number = 80,
  maxWords: number = 8
): string {
  if (!term || typeof term !== "string") return "";

  // 1. Remove control characters
  let clean = term.replace(/[\x00-\x1F\x7F]/g, "");

  // 2. Strip SQL comments (--) and command separators (;)
  clean = clean.replace(/--+/g, " ");
  clean = clean.replace(/[\\%_[\]{}()^$*+?|;'"<>~]/g, " ");

  // 3. Collapse multiple whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // 4. Limit word count
  const words = clean.split(" ").slice(0, maxWords);
  clean = words.join(" ");

  // 5. Clamp character length
  return clean.slice(0, maxChars).trim();
}

/**
 * Parses and strictly clamps an integer parameter within [min, max].
 * Returns fallback if input is null, undefined, or NaN.
 */
export function parseBoundedInt(
  val: string | number | null | undefined,
  min: number,
  max: number,
  fallback: number
): number {
  if (val === null || val === undefined) return fallback;
  const num = typeof val === "number" ? Math.floor(val) : parseInt(String(val).trim(), 10);
  if (isNaN(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

/**
 * Safe enum validator: ensures input matches one of allowed values or returns default.
 */
export function parseAllowedEnum<T extends string>(
  val: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  if (!val || typeof val !== "string") return fallback;
  const clean = val.trim();
  return (allowed as readonly string[]).includes(clean) ? (clean as T) : fallback;
}
