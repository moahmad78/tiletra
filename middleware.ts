import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Domains to be permanently redirected to https://www.intrihub.com
const LEGACY_DOMAINS = new Set([
  "tiletra.com",
  "www.tiletra.com",
  "tiletra.in",
  "www.tiletra.in",
]);

// Suspicious probing patterns common in automated web vulnerability scanners
const SUSPICIOUS_PROBE_REGEX =
  /\/(\.env|\.git|\.htaccess|\.aws|wp-login|phpmyadmin|xmlrpc\.php|telescope|actuator|eval-stdin|\.ds_store)/i;

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = hostHeader.split(",")[0].trim().toLowerCase().split(":")[0];
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // 1. Detect & block malicious vulnerability scanners probing sensitive files
  if (SUSPICIOUS_PROBE_REGEX.test(pathname)) {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    console.warn(
      `[SEC-ALERT] [SCANNER_BLOCKED] Malicious probe path="${pathname}" ip=${clientIp} host=${host}`
    );

    return new NextResponse("Access Denied", {
      status: 403,
      headers: {
        "Content-Type": "text/plain",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  // 2. Permanent 301 redirect for legacy Tiletra domains to Intrihub
  if (LEGACY_DOMAINS.has(host)) {
    const destination = `https://www.intrihub.com${pathname}${search}`;
    return NextResponse.redirect(destination, {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      },
    });
  }

  // 3. Universal HTTPS & Canonical Apex-to-WWW enforcement
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttp = forwardedProto === "http" || request.nextUrl.protocol === "http:";
  const isApexIntrihub = host === "intrihub.com";
  const isProduction = process.env.NODE_ENV === "production";

  if (isApexIntrihub) {
    // Redirect apex intrihub.com -> www.intrihub.com over HTTPS
    const destination = `https://www.intrihub.com${pathname}${search}`;
    return NextResponse.redirect(destination, {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      },
    });
  }

  // Universal HTTPS enforcement for any host in production (except local testing)
  if (isProduction && isHttp && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const destination = `https://${host}${pathname}${search}`;
    return NextResponse.redirect(destination, {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      },
    });
  }

  // 4. Catch-all: Redirect literal search_term_string templates (e.g. from historical Googlebot crawl) to canonical /shop
  if (
    search.includes("search_term_string") ||
    pathname.includes("search_term_string") ||
    search.includes("%7Bsearch_term_string%7D") ||
    pathname.includes("%7Bsearch_term_string%7D")
  ) {
    return NextResponse.redirect("https://www.intrihub.com/shop", {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 5. Redirect favicon.ico with query parameters to clean canonical /favicon.ico
  if (pathname === "/favicon.ico" && search) {
    return NextResponse.redirect("https://www.intrihub.com/favicon.ico", {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|sitemap.xml|robots.txt).*)",
  ],
};
