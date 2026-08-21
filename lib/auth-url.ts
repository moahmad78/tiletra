import { NextRequest } from "next/server";

export const ALLOWED_AUTH_HOSTS = new Set<string>([
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
    ALLOWED_AUTH_HOSTS.add(new URL(process.env.NEXT_PUBLIC_APP_URL).host.toLowerCase().split(":")[0]);
  } catch {}
}
if (process.env.BETTER_AUTH_URL) {
  try {
    ALLOWED_AUTH_HOSTS.add(new URL(process.env.BETTER_AUTH_URL).host.toLowerCase().split(":")[0]);
  } catch {}
}
if (process.env.RENDER_EXTERNAL_HOSTNAME) {
  try {
    ALLOWED_AUTH_HOSTS.add(process.env.RENDER_EXTERNAL_HOSTNAME.toLowerCase().split(":")[0]);
  } catch {}
}

/**
 * Derives the trusted base URL dynamically from the incoming request.
 * Strictly validates against an allowlist of permitted domains to prevent
 * open redirect vulnerabilities, restricted to intrihub.com and localhost.
 */
export function getAuthBaseUrl(request: NextRequest): string {
  // 1. Extract host from forwarded headers or host header or request URL
  // In Render / reverse proxy setups, x-forwarded-host represents the public custom domain
  const forwardedHost = request.headers.get("x-forwarded-host");
  const hostHeader = request.headers.get("host");
  let urlHost = "";
  try {
    urlHost = new URL(request.url).host;
  } catch {}

  // Take the first host if forwarded header contains a comma-separated list
  const candidateRaw = (forwardedHost || hostHeader || urlHost || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  const [hostWithoutPort, port] = candidateRaw.split(":");
  const isLocal = hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1";

  const isAllowed =
    ALLOWED_AUTH_HOSTS.has(candidateRaw) ||
    ALLOWED_AUTH_HOSTS.has(hostWithoutPort);

  if (hostWithoutPort && isAllowed) {
    if (isLocal) {
      const forwardedProto = request.headers.get("x-forwarded-proto");
      const proto = forwardedProto ? forwardedProto.split(",")[0].trim() : "http";
      const finalHost = port && port !== "80" && port !== "443" ? `${hostWithoutPort}:${port}` : hostWithoutPort;
      return `${proto}://${finalHost}`;
    }
    // Production public domain: strictly enforce https and no standard port suffix (:443)
    return `https://${hostWithoutPort}`;
  }

  // 2. Safe fallback when host is unknown or not allowlisted
  if (process.env.NODE_ENV === "production") {
    return "https://www.intrihub.com";
  }
  return "http://localhost:3000";
}

export function getOAuthSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    "intrihub-super-secure-oauth-secret-key-2026"
  );
}
