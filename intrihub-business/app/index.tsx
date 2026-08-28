import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../src/store/authStore";
import { COLORS } from "../src/constants/theme";

export default function IndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/(auth)/login" as any);
      return;
    }

    if (role === "vendor") {
      router.replace("/(vendor)/dashboard" as any);
    } else if (role === "admin" || role === "superadmin") {
      router.replace("/(admin)/dashboard" as any);
    } else {
      router.replace("/(auth)/blocked" as any);
    }
  }, [isAuthenticated, isLoading, role]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accentOrange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
