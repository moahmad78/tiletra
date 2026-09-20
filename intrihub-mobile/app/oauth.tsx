import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { setStoredTokens } from "../src/api/client";
import { useAuthStore } from "../src/store/authStore";
import { COLORS } from "../src/constants/theme";

export default function OAuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    accessToken?: string;
    refreshToken?: string;
    user?: string;
  }>();
  const { setUser } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    async function processAuth() {
      const accessToken = params.accessToken;
      const refreshToken = params.refreshToken;
      const userRaw = params.user;

      if (accessToken && refreshToken && userRaw) {
        try {
          const userObj = JSON.parse(decodeURIComponent(userRaw));
          await setStoredTokens(accessToken, refreshToken);
          if (isMounted) {
            setUser(userObj);
            router.replace("/(tabs)/home");
          }
          return;
        } catch (err) {
          console.error("[OAuth] Error parsing user payload:", err);
        }
      }

      // Fallback: if already logged in or params missing, return smoothly to home
      const timeout = setTimeout(() => {
        if (isMounted) {
          router.replace("/(tabs)/home");
        }
      }, 300);

      return () => clearTimeout(timeout);
    }

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [params.accessToken, params.refreshToken, params.user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accentOrange} />
      <Text style={styles.title}>Signing into IntriHub...</Text>
      <Text style={styles.subtitle}>Setting up your session, please wait</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
