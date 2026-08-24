"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAdminAuth } from "@/lib/admin-auth";
import { toast } from "sonner";

// 10 minutes inactivity limit in milliseconds
const INACTIVITY_LIMIT_MS = 10 * 60 * 1000;
const CHECK_INTERVAL_MS = 5 * 1000; // Check every 5 seconds
const STORAGE_KEY = "intrihub_admin_last_active";

export default function AdminInactivityGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, logout } = useAdminAuth();
  const lastThrottleRef = useRef<number>(0);
  const warnedRef = useRef<boolean>(false);

  // Update last active timestamp (throttled to once every 2 seconds)
  const recordActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastThrottleRef.current > 2000) {
      lastThrottleRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
      } catch {}
      warnedRef.current = false;
    }
  }, []);

  const handleAutoLogout = useCallback(() => {
    logout();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    toast.error("Session expired due to 10 minutes of inactivity. Please log in again.", {
      duration: 6000,
    });
    router.push("/admin/login");
  }, [logout, router]);

  useEffect(() => {
    // Only monitor when authenticated and inside the admin dashboard
    if (!isAuthenticated || pathname === "/admin/login") {
      return;
    }

    // Initialize last active timestamp if not already set
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }

    // Activity event listeners
    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "touchstart",
      "scroll",
      "click",
      "wheel",
    ];

    const onActivity = () => recordActivity();

    events.forEach((ev) => {
      window.addEventListener(ev, onActivity, { passive: true });
    });

    // Check inactivity periodically
    const interval = setInterval(() => {
      const lastActiveStr = localStorage.getItem(STORAGE_KEY);
      const lastActive = lastActiveStr ? parseInt(lastActiveStr, 10) : Date.now();
      const idleTime = Date.now() - lastActive;

      // 9-minute gentle warning (1 minute left)
      if (idleTime >= 9 * 60 * 1000 && idleTime < INACTIVITY_LIMIT_MS && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning("You have been inactive for 9 minutes. Your session will expire in 1 minute.", {
          duration: 4000,
        });
      }

      // 10 minutes reached -> Auto Logout
      if (idleTime >= INACTIVITY_LIMIT_MS) {
        handleAutoLogout();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      events.forEach((ev) => {
        window.removeEventListener(ev, onActivity);
      });
      clearInterval(interval);
    };
  }, [isAuthenticated, pathname, recordActivity, handleAutoLogout]);

  return null;
}
