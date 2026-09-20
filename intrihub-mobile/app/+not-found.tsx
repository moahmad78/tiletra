import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../src/constants/theme";

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect to home cleanly instead of displaying a 404 screen
    const timer = setTimeout(() => {
      router.replace("/(tabs)/home");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={COLORS.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
});
