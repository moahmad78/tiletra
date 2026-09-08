'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scrolls document.title as a marquee ticker using the page's existing
 * title as the base text. Does not affect the server-rendered <title>
 * used for SEO — this only runs after hydration on the client.
 */
export function useScrollingTitle(intervalMs = 300) {
  const pathname = usePathname();
  const originalTitleRef = useRef<string>('');

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;

    // Small delay on route change so Next.js metadata/title has settled
    timeoutId = setTimeout(() => {
      // Capture the page's real title (already set server-side for SEO)
      let base = document.title.trim();

      if (!base) {
        base = 'IntriHub — Best Rates, Direct to Site';
      }

      // Safety rule: replace any occurrence of 'Wholesale' with 'Best Rates'
      base = base.replace(/wholesale/gi, 'Best Rates');
      originalTitleRef.current = base;

      // Separator so the loop reads cleanly as it wraps around
      const text = base + '   •   ';
      let index = 0;

      const tick = () => {
        document.title = text.substring(index) + text.substring(0, index);
        index = (index + 1) % text.length;
      };

      tick();
      intervalId = setInterval(tick, intervalMs);
    }, 60);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      // Restore the real title on unmount (route change) so it doesn't leak
      // a mid-scroll fragment into the next page
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };
  }, [intervalMs, pathname]);
}
