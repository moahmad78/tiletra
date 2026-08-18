"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "sonner";

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

    if (session && !isAuthenticated) {
      try {
        const decoded = JSON.parse(Buffer.from(session, "base64url").toString());
        googleSignIn({
          name: decoded.name || decoded.email?.split("@")[0] || "User",
          email: decoded.email || "",
          avatar: decoded.avatar || undefined,
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
  }, [searchParams, isAuthenticated, googleSignIn, router]);

  return null;
}
