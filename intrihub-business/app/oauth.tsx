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

    async function handleAuth(tokenAccess: string, tokenRefresh: string, rawUser: string) {
      if (processedRef.current) return;
      processedRef.current = true;

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

        // Verify vendor credentials via business Google auth verification
        try {
          const bizRes = await loginWithGoogle({
            accessToken: tokenAccess,
            profile: {
              email: userObj.email,
              name: userObj.name,
              avatar: userObj.avatar,
            },
          });

          if (bizRes.success && bizRes.user) {
            if (isMounted) {
              setUser(bizRes.user);
              if (bizRes.user.role === "admin" || bizRes.user.role === "superadmin") {
                router.replace("/(admin)/dashboard" as any);
              } else {
                router.replace("/(vendor)/dashboard" as any);
              }
            }
            return;
          } else if (!bizRes.success) {
            await clearStoredTokens();
            if (isMounted) {
              router.replace({
                pathname: "/(auth)/login",
                params: {
                  error:
                    bizRes.error ||
                    "This Google account is not registered as an approved vendor partner on Intrihub Business.",
                },
              } as any);
            }
            return;
          }
        } catch (bizErr: any) {
          const errData = bizErr?.response?.data;
          if (errData?.reason === "NOT_FOUND" || errData?.reason === "UNAPPROVED" || errData?.error) {
            await clearStoredTokens();
            if (isMounted) {
              router.replace({
                pathname: "/(auth)/login",
                params: {
                  error:
                    errData?.error ||
                    "This Google account is not registered as an approved vendor partner on Intrihub Business.",
                },
              } as any);
            }
            return;
          }
        }

        // Fallback: check profile endpoint
        try {
          const meRes = await apiClient.get("/api/mobile/auth/me", {
            headers: { Authorization: `Bearer ${tokenAccess}` },
          });
          if (meRes.data?.success && meRes.data?.user) {
            const role = meRes.data.user.role;
            if (role === "vendor" || role === "admin" || role === "superadmin") {
              if (isMounted) {
                setUser(meRes.data.user);
                if (role === "admin" || role === "superadmin") {
                  router.replace("/(admin)/dashboard" as any);
                } else {
                  router.replace("/(vendor)/dashboard" as any);
                }
              }
              return;
            }
          }
        } catch {}

        // User role routing based on parsed token user
        if (userObj.role === "vendor") {
          if (isMounted) {
            setUser(userObj);
            router.replace("/(vendor)/dashboard" as any);
          }
        } else if (userObj.role === "admin" || userObj.role === "superadmin") {
          if (isMounted) {
            setUser(userObj);
            router.replace("/(admin)/dashboard" as any);
          }
        } else {
          // Unapproved customer role attempting to sign into vendor console
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
        console.error("[OAuth Interceptor] Processing error:", err);
        await clearStoredTokens();
        if (isMounted) {
          router.replace({
            pathname: "/(auth)/login",
            params: { error: "Authentication session failed. Please sign in again." },
          } as any);
        }
      }
    }

    // 1. Check direct route params from Expo Router
    if (params.accessToken && params.refreshToken && params.user) {
      handleAuth(params.accessToken, params.refreshToken, params.user);
      return;
    }

    // 2. Check initial linking URL in case router mounted without query params populated
    Linking.getInitialURL().then((url) => {
      if (!url || !isMounted || processedRef.current) return;
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

      // If params are missing or expired after 1.5s, return safely to login screen
      const fallbackTimer = setTimeout(() => {
        if (isMounted && !processedRef.current) {
          router.replace("/(auth)/login" as any);
        }
      }, 1500);

      return () => clearTimeout(fallbackTimer);
    });

    return () => {
      isMounted = false;
    };
  }, [params.accessToken, params.refreshToken, params.user]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadgeBox}>
        <Image
          source={require("../assets/intri-icon.png")}
          style={styles.brandIconImage}
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
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  brandIconImage: {
    width: 44,
    height: 44,
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
