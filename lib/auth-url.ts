import { NextRequest } from "next/server";

export const ALLOWED_AUTH_HOSTS = new Set<string>([
  "tiletra.com",
  "www.tiletra.com",
  "intrihub.com",
  "www.intrihub.com",
  "localhost:3000",
  "localhost",
  "127.0.0.1:3000",
  "127.0.0.1",
]);

// Include optional environment-configured hosts if present
if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    ALLOWED_AUTH_HOSTS.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host.toLowerCase());
  } catch {}
}
if (process.env.BETTER_AUTH_URL) {
  try {
    ALLOWED_AUTH_HOSTS.add(new URL(process.env.BETTER_AUTH_URL).host.toLowerCase());
  } catch {}
}
if (process.env.RENDER_EXTERNAL_HOSTNAME) {
  try {
    ALLOWED_AUTH_HOSTS.add(process.env.RENDER_EXTERNAL_HOSTNAME.toLowerCase());
  } catch {}
}

/**
 * Derives the trusted base URL dynamically from the incoming request.
 * Strictly validates against an allowlist of permitted domains to prevent
 * open redirect vulnerabilities while allowing tiletra.com, intrihub.com,
 * and localhost to authenticate seamlessly simultaneously.
 */
export function getAuthBaseUrl(request: NextRequest): string {
  // 1. Extract host from forwarded headers or host header or request URL
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  let urlHost = "";
  try {
    urlHost = new URL(request.url).host;
  } catch {}

  // Take the first host if forwarded header contains a comma-separated list
  const candidateHost = (forwardedHost || hostHeader || urlHost || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  // Check if candidate matches allowlist (or host without port matches allowlist)
  const hostWithoutPort = candidateHost.split(":")[0];
  const isAllowed = ALLOWED_AUTH_HOSTS.has(candidateHost) || ALLOWED_AUTH_HOSTS.has(hostWithoutPort);

  if (candidateHost && isAllowed) {
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const isLocal = candidateHost.startsWith("localhost") || candidateHost.startsWith("127.0.0.1");
    let proto = isLocal ? "http" : "https";
    if (forwardedProto) {
      proto = forwardedProto.split(",")[0].trim();
    }
    return `${proto}://${candidateHost}`;
  }

  // 2. Safe fallback when host is unknown or not allowlisted
  if (process.env.NODE_ENV === "production") {
    return "https://intrihub.com";
  }
  return "http://localhost:3000";
}

export function getOAuthSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "tiletra-super-secure-oauth-secret-key-2026"
  );
}
