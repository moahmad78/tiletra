import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";

/**
 * Custom Catch-All Route for IntriHub Business
 * Silently intercepts unmatched routes and redirects safely to the appropriate
 * screen, preventing raw query params or session tokens from ever rendering
 * as plain text on screen.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user?.role === "vendor") {
        router.replace("/(vendor)/dashboard" as any);
      } else if (user?.role === "admin" || user?.role === "superadmin") {
        router.replace("/(admin)/dashboard" as any);
      } else {
        router.replace("/(auth)/login" as any);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color="#FC8019" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#052A51",
    justifyContent: "center",
    alignItems: "center",
  },
});
