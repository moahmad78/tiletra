'use client';

/**
 * Permanently disabled: Marquee title animation causes Google Search &
 * Google Analytics to record truncated/broken page titles (e.g. "terials Marketplace | IntriHub").
 */
export function useScrollingTitle(_intervalMs = 450) {
  // No-op: preserves clean, static document.title for SEO & Analytics
}
