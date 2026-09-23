'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Scrolls document.title as a smooth marquee ticker using the page's title.
 * Operates purely on the client with zero state updates to prevent re-renders.
 */
export function useScrollingTitle(intervalMs = 220) {
  const pathname = usePathname();
  const originalTitleRef = useRef<string>('');

  useEffect(() => {
    // Ensure we run only in browser
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let index = 0;
    let text = '';

    const startMarquee = () => {
      // Clear any existing active interval
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      // Extract clean base title, removing any previous marquee artifacts
      let rawTitle = document.title.trim();
      if (rawTitle.includes('   •   ')) {
        rawTitle = rawTitle.split('   •   ')[0].trim();
      }

      let base = rawTitle || 'IntriHub — Build Better, We Deliver Faster';
      base = base.replace(/wholesale/gi, 'Best Rates');
      originalTitleRef.current = base;

      // Clean separator for smooth wrap-around loop
      text = base + '   •   ';
      index = 0;

      // Single lightweight interval callback: only string slicing and direct title assignment
      intervalId = setInterval(() => {
        index = (index + 1) % text.length;
        document.title = text.slice(index) + text.slice(0, index);
      }, intervalMs);
    };

    const stopMarquee = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    };

    // Small delay on route transition to let Next.js metadata settle
    const settleTimeout = setTimeout(startMarquee, 100);

    // Pause ticker when tab is backgrounded to prevent browser timer backlog jitter;
    // Resume smoothly when user refocuses the tab.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopMarquee();
      } else {
        startMarquee();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(settleTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopMarquee();
    };
  }, [intervalMs, pathname]);
}
