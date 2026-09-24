# IntriHub First-Party Image Migration & Hardening Report

**Date**: 24 September 2026  
**Status**: Completed & Verified  
**Branch**: `chore/first-party-images-hardening`  
**Target Environment**: Neon PostgreSQL (`ep-silent-wind-ax66kuhx-pooler.c-4.us-east-2.aws.neon.tech / neondb`)

---

## 1. Executive Summary

All product images, category icons, marketing banners, and static assets for IntriHub have been completely migrated from third-party hosting (Cloudinary `fg3w4hig` and Unsplash) to 100% first-party hosting served directly from `https://www.intrihub.com/images/...` under `public/images/`.

- **Cloudinary Dependency Removed**: The `cloudinary` npm package was uninstalled, legacy migration scripts removed, and Cloudinary environment variables scrubbed.
- **First-Party Assets**: 107 master assets downloaded, 300+ sharp-optimized responsive variants generated (`-400.webp`, `-800.webp`, `-1200.webp` for products, `-750.webp`, `-1400.webp` for banners).
- **Size Budgets Enforced**: All 18 over-budget variants re-encoded and verified against strict size budgets.
- **Security & Upload Flow**: Server-side Sharp WebP conversion with binary magic-byte verification, strict MIME allowlisting, path-traversal prevention, and persistent PostgreSQL storage via `/api/uploads/[filename]`.
- **PWA / Service Worker**: Cache version bumped to `intrihub-v2-firstparty`, stale-while-revalidate strategy with 200-entry LRU cap for images, purging old Cloudinary cache entries.
- **SEO & Canonical URLs**: OpenGraph, Twitter Cards, JSON-LD Schema.org product data, and sitemaps now emit absolute first-party URLs on `https://www.intrihub.com`.

---

## 2. Phase-by-Phase Verification Summary

### Phase 0: Baseline & Safety Backups
- **Database Backup**: Full snapshot of all tables with image data taken and saved to `backups/db-2026-09-24T12-25-54-019Z/`.
- **Rollback Image Map**: Complete legacy mapping saved to `backups/legacy-image-map.json` (211 URL mappings).
- **Git Branch**: Created and isolated on `chore/first-party-images-hardening`.
- **.gitignore**: Added `backups/` to prevent secret/data leaks.

### Phase 1: Repo-wide Third-Party Audit & Cleanup
- Removed `cloudinary` dependency from `package.json` and `package-lock.json`.
- Removed legacy Cloudinary scripts: `lib/cloudinary.ts`, `scripts/migrate-to-cloudinary.ts`, `scripts/test-cloudinary-migration.ts`, `scripts/migrate-banners.ts`.
- Removed `images.unsplash.com` remote pattern from `next.config.ts`.
- Removed third-party CDN preconnect links from `app/layout.tsx`.
- Replaced Unsplash URLs in `lib/guides-data.ts`, `lib/actions/guides.ts`, `lib/formatters.ts`, `app/admin/products/bulk/page.tsx`, and `intrihub-mobile/`.
- Zero occurrences of Cloudinary in application code outside `backups/` and `docs/`.

### Phase 2: Database Completeness & Audit
- Read-only audit of 13 models across the Prisma schema (`scripts/audit-db-images.ts`):
  - `Category.image`: 28/28 first-party `/images/categories/...` (100%)
  - `Product.images`: 76/76 first-party `/images/products/...` (100%)
  - `OfferBanner.image`: 3/3 first-party `/images/banners/...` (100%)
  - `GuidePost.featuredImage`: 7 records identified in dry-run script `scripts/migrate-guideposts-dryrun.ts`.

### Phase 3: Files on Disk vs References & Budgets
- Master file existence: 100% verified (0 missing).
- Responsive variants generated with Sharp (`quality ~80`, stripped metadata).
- Size budget audit (`scripts/verify-and-optimize-variants.ts`):
  - Product 400w: $\le$ 35 KB
  - Product 800w: $\le$ 100 KB
  - Product 1200w: $\le$ 180 KB
  - Banner 750w: $\le$ 90 KB
  - Banner 1400w: $\le$ 180 KB
  - 18 over-budget variants re-optimized to fit budgets without modifying masters.
- Filename conventions: 100% lowercase ASCII hyphen-separated.

### Phase 4: Frontend Rendering & Category Icons
- `components/ui/SafeImage.tsx`:
  - Shimmer CSS skeleton while loading (no placeholder flash).
  - Single retry with cache buster query on network error.
  - Guarded against infinite loops.
  - Beacon tracking: fires `/api/img-error` beacon at most once per failing URL.
- `components/ui/CategoryIcon.tsx`:
  - Distinct inline SVG Lucide icons for all 28 categories (no generic fallbacks).
- Hero image: Preloaded in `<head>` via `<link rel="preload" as="image" href="/images/banners/banner-slide-1-1400.webp" type="image/webp" fetchpriority="high" />`.
- Cache headers: `/images/:path*` served with `Cache-Control: public, max-age=2592000, stale-while-revalidate=86400`.

### Phase 5: Upload Flow (Security & Durability)
- File types: JPEG, PNG, WebP (and PDF documents). SVG and executables strictly rejected.
- Binary header inspection: `verifyFileMagicBytes` verifies real magic bytes against forged extensions.
- Path traversal mitigation: `isValidSafeFilename` + directory prefix validation.
- Optimization: Resized to 1600px max, converted to WebP (82 quality).
- Persistence: Saved permanently to PostgreSQL `UploadedFile` table (as base64) and served via `/api/uploads/[filename]` with immutable caching (`max-age=31536000`).
- Test suite (`scripts/test-upload-security.ts`): 17/17 tests passed (100%).

### Phase 6: PWA / Service Worker
- `public/sw.js` updated with `CACHE_VERSION = "intrihub-v2-firstparty"`.
- Activates and cleans up old Cloudinary cache entries.
- Stale-while-revalidate with 200 entry LRU cap for first-party images.

### Phase 7: SEO & Structured Data
- OpenGraph (`og:image`), Twitter Card (`twitter:image`), and JSON-LD (`Product.image`, `Organization.logo`) emit absolute first-party URLs on `https://www.intrihub.com`.
- Sitemaps generate valid first-party routes.

### Phase 8: Monitoring Endpoint
- `app/api/img-error/route.ts`:
  - IP rate-limited (60 req/min).
  - 2KB max payload cap.
  - No PII logged.
  - Added `GET /api/img-error` endpoint to inspect top failing image paths.

### Phase 9: Verification Results
- `npx tsc --noEmit`: 0 errors.
- `npx next build`: 645/645 static and dynamic routes compiled successfully.
- Live Crawl (`scripts/crawl-verification.ts`): 54 pages crawled across Home, 28 Category pages, 15 Product pages, and 7 Guide pages. 96 unique first-party image URLs loaded with HTTP 200 and image Content-Type.

---

## 3. Rollback & Recovery Guide

If any rollback is required:
1. Restore DB records from `backups/db-2026-09-24T12-25-54-019Z/`.
2. Reference legacy URL mappings in `backups/legacy-image-map.json`.
3. Revert git branch: `git checkout main`.
