import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Image } from "expo-image";
import { setStoredTokens, clearStoredTokens, apiClient } from "../src/api/client";
import { loginWithGoogle } from "../src/api/auth";
import { useAuthStore } from "../src/store/authStore";
import { COLORS } from "../src/constants/theme";

// Global guard to ensure tokens are strictly processed once across the entire app
let isGlobalAuthProcessing = false;

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    user?: string;
    error?: string;
  }>();
  const { setUser } = useAuthStore();
  const processedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    console.log("[OAuth:Step 1/5] Initializing single app-wide deep-link listener in oauth.tsx");

    // 0. Listen for incoming deep link intents when app is running in background (SingleTask)
    const sub = Linking.addEventListener("url", (event) => {
      if (!event?.url || !isMounted || processedRef.current || isGlobalAuthProcessing) return;
      console.log("[OAuth:Step 2/5] Deep-link event received, hasTokens:", event.url.includes("accessToken="));
      if (event.url.includes("accessToken=") && event.url.includes("refreshToken=")) {
        const queryIndex = event.url.indexOf("?");
        if (queryIndex !== -1) {
          const qs = event.url.substring(queryIndex + 1);
          const sp = new URLSearchParams(qs);
          const a = sp.get("accessToken");
          const r = sp.get("refreshToken");
          const u = sp.get("user");
          if (a && r && u) {
            handleAuth(a, r, u);
          }
        }
      }
    });

    async function handleAuth(tokenAccess: string, tokenRefresh: string, rawUser: string) {
      if (processedRef.current || isGlobalAuthProcessing) return;
      processedRef.current = true;
      isGlobalAuthProcessing = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      console.log("[OAuth:Step 2/5] Received auth payload (hasAccessToken: true, hasRefreshToken: true)");

      try {
        WebBrowser.dismissAuthSession();
        WebBrowser.dismissBrowser();
      } catch {}

      try {
        let userObj: any = null;
        try {
          userObj = JSON.parse(decodeURIComponent(rawUser));
        } catch {
          userObj = JSON.parse(rawUser);
        }

        // Store tokens securely in SecureStore
        await setStoredTokens(tokenAccess, tokenRefresh);

        // Verify profile endpoint directly using the mobile access token
        console.log("[OAuth:Step 3/5] Verifying profile via /api/mobile/auth/me");
        try {
          const meRes = await apiClient.get("/api/mobile/auth/me", {
            headers: { Authorization: `Bearer ${tokenAccess}` },
          });
          console.log(`[OAuth:Step 4/5] Profile result: status=${meRes.status}, role=${meRes.data?.user?.role || "none"}`);
          if (meRes.data?.success && meRes.data?.user) {
            const role = meRes.data.user.role;
            if (role === "vendor" || role === "admin" || role === "superadmin") {
              if (isMounted) {
                setUser(meRes.data.user);
                const target = (role === "admin" || role === "superadmin") ? "/(admin)/dashboard" : "/(vendor)/dashboard";
                console.log(`[OAuth:Step 5/5] Routing to verified workspace: ${target}`);
                router.replace(target as any);
              }
              return;
            }
          }
        } catch (meErr: any) {
          console.warn("[OAuth:Step 3/5] Profile fetch notice, status:", meErr?.response?.status || "network");
        }

        // User role routing based on parsed token user
        if (userObj.role === "vendor") {
          console.log("[OAuth:Step 5/5] Routing vendor to dashboard");
          if (isMounted) {
            setUser(userObj);
            router.replace("/(vendor)/dashboard" as any);
          }
        } else if (userObj.role === "admin" || userObj.role === "superadmin") {
          console.log("[OAuth:Step 5/5] Routing admin to dashboard");
          if (isMounted) {
            setUser(userObj);
            router.replace("/(admin)/dashboard" as any);
          }
        } else {
          // Unapproved customer role attempting to sign into vendor console
          console.log("[OAuth:Step 5/5] Role rejection: user is customer, not approved vendor");
          await clearStoredTokens();
          if (isMounted) {
            router.replace({
              pathname: "/(auth)/login",
              params: {
                error:
                  "This Google account is not registered as an approved vendor partner on Intrihub Business.",
              },
            } as any);
          }
        }
      } catch (err: any) {
        console.error("[OAuth:Error] Processing error: code=" + (err?.response?.status || "unknown") + ", reason=" + (err?.message || "unknown"));
        await clearStoredTokens();
        if (isMounted) {
          router.replace({
            pathname: "/(auth)/login",
            params: { error: "Authentication session failed. Please sign in again." },
          } as any);
        }
      } finally {
        isGlobalAuthProcessing = false;
      }
    }

    // 1. Check direct route params from Expo Router
    if (params.accessToken && params.refreshToken && params.user) {
      console.log("[OAuth:Step 2/5] Received auth payload directly from Expo Router params");
      handleAuth(params.accessToken, params.refreshToken, params.user);
      return;
    }

    // 2. Check initial linking URL in case router mounted without query params populated
    Linking.getInitialURL().then((url) => {
      if (!url || !isMounted || processedRef.current || isGlobalAuthProcessing) return;
      console.log("[OAuth:Step 2/5] getInitialURL resolved, hasTokens:", url.includes("accessToken="));
      if (url.includes("accessToken=") && url.includes("refreshToken=") && url.includes("user=")) {
        const queryIndex = url.indexOf("?");
        if (queryIndex !== -1) {
          const qs = url.substring(queryIndex + 1);
          const sp = new URLSearchParams(qs);
          const a = sp.get("accessToken");
          const r = sp.get("refreshToken");
          const u = sp.get("user");
          if (a && r && u) {
            handleAuth(a, r, u);
            return;
          }
        }
      }

      // Safe fallback timer: only return to login if no URL/params arrived after ~6s
      fallbackTimer = setTimeout(() => {
        if (isMounted && !processedRef.current && !isGlobalAuthProcessing) {
          console.log("[OAuth:Fallback] 6s timer elapsed without auth payload. Returning to login.");
          router.replace("/(auth)/login" as any);
        }
      }, 6000);
    });

    return () => {
      isMounted = false;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      sub.remove();
    };
  }, [params.accessToken, params.refreshToken, params.user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadgeBox}>
        <Image
          source={require("../assets/intri-web-logo.png")}
          style={styles.brandWebLogo}
          contentFit="contain"
        />
      </View>
      <ActivityIndicator size="large" color={COLORS.accentOrange} style={styles.spinner} />
      <Text style={styles.title}>Securing Business Session...</Text>
      <Text style={styles.subtitle}>Verifying vendor access & workspace permissions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#052A51",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logoBadgeBox: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  brandWebLogo: {
    width: 150,
    height: 38,
  },
  spinner: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    maxWidth: 280,
    lineHeight: 18,
  },
});
