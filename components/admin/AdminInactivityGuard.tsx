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
  const lastActiveTimeRef = useRef<number>(Date.now());
  const warnedRef = useRef<boolean>(false);

  const handleAutoLogout = useCallback(() => {
    logout();
    try {
      sessionStorage.removeItem(STORAGE_KEY);
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

    // Initialize last active timestamp from storage if valid and recent, else now
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && Date.now() - parsed < INACTIVITY_LIMIT_MS) {
          lastActiveTimeRef.current = parsed;
        } else {
          lastActiveTimeRef.current = Date.now();
          sessionStorage.setItem(STORAGE_KEY, lastActiveTimeRef.current.toString());
        }
      } else {
        lastActiveTimeRef.current = Date.now();
        sessionStorage.setItem(STORAGE_KEY, lastActiveTimeRef.current.toString());
      }
    } catch {
      lastActiveTimeRef.current = Date.now();
    }

    // Non-blocking in-memory activity tracking (zero storage writes on click/tap path)
    const onActivity = () => {
      lastActiveTimeRef.current = Date.now();
      warnedRef.current = false;
    };

    // Use only low-overhead pointerdown and keydown; never scroll, mousemove, or wheel
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity, { passive: true });

    // Background timer to check inactivity and lazily sync to storage
    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActiveTimeRef.current;

      // Lazy background persistence without blocking user interactions
      try {
        sessionStorage.setItem(STORAGE_KEY, lastActiveTimeRef.current.toString());
      } catch {}

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
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      clearInterval(interval);
    };
  }, [isAuthenticated, pathname, handleAutoLogout]);

  return null;
}
