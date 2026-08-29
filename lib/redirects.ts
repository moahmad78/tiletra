import { prisma } from "@/lib/prisma";

interface CachedRedirect {
  toPath: string;
  statusCode: number;
  expiresAt: number;
}

// In-memory LRU-like cache to prevent DB overhead on every request
const redirectCache = new Map<string, CachedRedirect>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function normalizePath(p: string): string {
  if (!p) return "/";
  let clean = p.trim().toLowerCase();
  if (clean.length > 1 && clean.endsWith("/")) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Fast lookup for permanent 301 redirects
 */
export async function getRedirectForPath(path: string): Promise<{ toPath: string; statusCode: number } | null> {
  const normalized = normalizePath(path);
  const now = Date.now();

  const cached = redirectCache.get(normalized);
  if (cached && cached.expiresAt > now) {
    return { toPath: cached.toPath, statusCode: cached.statusCode };
  }

  try {
    const record = await prisma.redirect.findUnique({
      where: { fromPath: normalized },
    });

    if (record) {
      redirectCache.set(normalized, {
        toPath: record.toPath,
        statusCode: record.statusCode || 301,
        expiresAt: now + CACHE_TTL_MS,
      });
      return { toPath: record.toPath, statusCode: record.statusCode || 301 };
    }

    // Cache negative lookup for 1 minute to avoid DB hammering
    redirectCache.set(normalized, {
      toPath: "",
      statusCode: 0,
      expiresAt: now + 60 * 1000,
    });
    return null;
  } catch (error) {
    console.error("Error looking up redirect in DB:", error);
    return null;
  }
}

/**
 * Create or update a 301 redirect entry
 */
export async function createRedirect(fromPath: string, toPath: string, statusCode = 301) {
  const normFrom = normalizePath(fromPath);
  const normTo = normalizePath(toPath);

  try {
    const record = await prisma.redirect.upsert({
      where: { fromPath: normFrom },
      update: {
        toPath: normTo,
        statusCode,
      },
      create: {
        fromPath: normFrom,
        toPath: normTo,
        statusCode,
      },
    });

    redirectCache.set(normFrom, {
      toPath: normTo,
      statusCode,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return record;
  } catch (error) {
    console.error("Error creating redirect in DB:", error);
    return null;
  }
}

/**
 * Helper when hard-deleting a product to automatically generate a 301 redirect to its category
 */
export async function recordHardDeleteRedirect(product: { slug: string; categorySlug?: string | null }) {
  if (!product.slug) return;
  const fromPath = `/product/${product.slug}`;
  const toPath = product.categorySlug ? `/shop/${product.categorySlug}` : "/shop";
  return createRedirect(fromPath, toPath, 301);
}
