/**
 * IntriHub First-Party Image URL Helper (PRD FR-5)
 * Centralizes all image path resolution, responsive variant generation, and fallback handling.
 */

export const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || "/images").replace(/\/$/, "");
export const PLACEHOLDER_IMAGE = `${IMAGE_BASE_URL}/brand/placeholder.svg`;

export type ImageVariantSize = 400 | 750 | 800 | 1200 | 1400 | "master" | "thumbnail";

/**
 * Resolves any stored image key or path into a canonical first-party URL.
 * Supports auto-selecting optimized responsive width variants (400, 800, 1200, 750, 1400).
 */
export function imageUrl(
  pathOrKey: string | null | undefined,
  size?: ImageVariantSize
): string {
  if (!pathOrKey || typeof pathOrKey !== "string" || pathOrKey.trim() === "") {
    return PLACEHOLDER_IMAGE;
  }

  const clean = pathOrKey.trim();

  // If external Cloudinary URL is still passed in legacy data, convert to local path
  if (clean.includes("res.cloudinary.com")) {
    const match = clean.match(/\/intrihub\/(.+)$/);
    if (match && match[1]) {
      return imageUrl(match[1].split("?")[0], size);
    }
  }

  // If already an absolute data URI or external URL, return clean
  if (clean.startsWith("data:") || clean.startsWith("blob:") || clean.startsWith("http://") || clean.startsWith("https://")) {
    return clean;
  }

  // Normalize site-relative paths vs plain relative keys
  let normalizedPath = clean;
  if (normalizedPath.startsWith("/images/")) {
    normalizedPath = normalizedPath.slice("/images/".length);
  } else if (normalizedPath.startsWith("/")) {
    // If it's another local path like /placeholders/ or /logo/ or /uploads/
    return normalizedPath;
  }

  // Handle responsive variant sizing if requested
  if (size && size !== "master") {
    const lastDotIndex = normalizedPath.lastIndexOf(".");
    if (lastDotIndex > 0) {
      const base = normalizedPath.slice(0, lastDotIndex);
      const ext = normalizedPath.slice(lastDotIndex);

      // Check if not already suffixed with size
      if (!base.endsWith(`-${size}`)) {
        // Only append variant if it's a product or banner
        if (normalizedPath.startsWith("products/") || normalizedPath.startsWith("banners/")) {
          const variantWidth = typeof size === "number" ? size : size === "thumbnail" ? 400 : 800;
          return `${IMAGE_BASE_URL}/${base}-${variantWidth}.webp`;
        }
      }
    }
  }

  return `${IMAGE_BASE_URL}/${normalizedPath}`;
}

/**
 * Generates standard responsive srcset string for <img> tags (PRD FR-6)
 */
export function getImageSrcSet(pathOrKey: string | null | undefined): string | undefined {
  if (!pathOrKey || typeof pathOrKey !== "string") return undefined;
  if (!pathOrKey.includes("products/") && !pathOrKey.includes("prod-")) return undefined;

  const url400 = imageUrl(pathOrKey, 400);
  const url800 = imageUrl(pathOrKey, 800);
  const url1200 = imageUrl(pathOrKey, 1200);

  return `${url400} 400w, ${url800} 800w, ${url1200} 1200w`;
}

/**
 * Generates absolute canonical URL for OpenGraph, Twitter Cards and JSON-LD SEO (PRD FR-12)
 */
export function getAbsoluteImageUrl(pathOrKey: string | null | undefined): string {
  const relUrl = imageUrl(pathOrKey, "master");
  if (relUrl.startsWith("http://") || relUrl.startsWith("https://")) {
    return relUrl;
  }
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.intrihub.com").replace(/\/$/, "");
  return `${siteUrl}${relUrl.startsWith("/") ? "" : "/"}${relUrl}`;
}
