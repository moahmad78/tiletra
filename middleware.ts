import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Domains to be permanently redirected to https://www.intrihub.com
const LEGACY_DOMAINS = new Set([
  "tiletra.com",
  "www.tiletra.com",
  "tiletra.in",
  "www.tiletra.in",
]);

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = hostHeader.split(",")[0].trim().toLowerCase().split(":")[0];

  // 1. Permanent 301 redirect for legacy Tiletra domains to Intrihub
  if (LEGACY_DOMAINS.has(host)) {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const destination = `https://www.intrihub.com${pathname}${search}`;

    return NextResponse.redirect(destination, {
      status: 301,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // 2. Canonical apex-to-www (intrihub.com -> www.intrihub.com) & HTTP->HTTPS enforcement
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isApexIntrihub = host === "intrihub.com";
  const isHttp = forwardedProto === "http";

  if (isApexIntrihub || (host === "www.intrihub.com" && isHttp)) {
    const pathname = request.nextUrl.pathname;
    const search = request.nextUrl.search;
    const destination = `https://www.intrihub.com${pathname}${search}`;

    return NextResponse.redirect(destination, {
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
     * - favicon.ico, sitemap.xml, robots.txt
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
