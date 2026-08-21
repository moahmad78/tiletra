"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

function decodeBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    // Fallback simple atob
    return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
  }
}

/**
 * GoogleSessionHydrator
 *
 * After Google OAuth callback, the server redirects to:
 *   /?google_session=<base64url-encoded-user-json>
 *
 * This component (mounted in the root layout) reads that param,
 * hydrates the Zustand auth store, then strips the param from the URL.
 */
export default function GoogleSessionHydrator() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { googleSignIn, isAuthenticated } = useAuthStore();

  useEffect(() => {
    const session = searchParams.get("google_session");
    const authError = searchParams.get("auth_error");

    if (authError) {
      const messages: Record<string, string> = {
        state_mismatch: "Security check failed. Please try again.",
        no_code: "Google login was cancelled.",
        token_exchange_failed: "Failed to connect with Google. Please retry.",
        profile_fetch_failed: "Could not read your Google profile. Please retry.",
        no_email: "Your Google account has no email address.",
        server_error: "An unexpected error occurred. Please try again.",
      };
      toast.error(messages[authError] || "Google login failed. Please try again.");
      // Clean up the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      router.replace(url.pathname + (url.search || ""));
      return;
    }

    if (session) {
      try {
        const jsonStr = decodeBase64Url(session);
        const decoded = JSON.parse(jsonStr);

        // Explicit defense-in-depth: Clear old localStorage state before hydrating new user
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("intrihub-customer-auth");
            localStorage.removeItem("tiletra-customer-auth");
            sessionStorage.clear();
          } catch {}
        }

        googleSignIn({
          userId: decoded.userId,
          name: decoded.name || decoded.email?.split("@")[0] || "User",
          email: decoded.email || "",
          avatar: decoded.avatar || undefined,
          phone: decoded.phone,
          phoneVerified: decoded.phoneVerified,
          createdAt: decoded.createdAt,
        }).then(() => {
          toast.success(`Welcome, ${decoded.name?.split(" ")[0] || "back"}! 👋`);
        });
      } catch (e) {
        console.error("Failed to parse google_session:", e);
      }

      // Strip the param from URL without re-triggering navigation
      const url = new URL(window.location.href);
      url.searchParams.delete("google_session");
      router.replace(url.pathname + (url.search || ""));
    }
  }, [searchParams, googleSignIn, router]);

  return null;
}
