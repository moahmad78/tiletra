import { View, Text, StyleSheet, TouchableOpacity, Linking } from "react-native";
import { useRouter } from "expo-router";
import { ShieldAlert, ShoppingBag, LogOut, ExternalLink } from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function BlockedCustomerScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.replace("/(auth)/login" as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <ShieldAlert size={48} color={COLORS.accentAmber} />
        </View>

        <Text style={styles.title}>Vendor & Admin Portal Only</Text>
        
        <Text style={styles.message}>
          Hello <Text style={{ fontWeight: "700", color: COLORS.text }}>{user?.name || user?.email || "User"}</Text>, 
          your account is currently registered as a <Text style={{ fontWeight: "700", color: COLORS.accentOrange }}>Customer / Buyer</Text>.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            This application is restricted to verified IntriHub supply vendors and administrative staff for managing catalog inventory, warehouse dispatch, and sales analytics.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.customerAppBtn}
          onPress={() => Linking.openURL("https://www.intrihub.com")}
          activeOpacity={0.85}
        >
          <ShoppingBag size={18} color="#fff" />
          <Text style={styles.customerAppBtnText}>Open Intrihub Customer Store</Text>
          <ExternalLink size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={COLORS.error} />
          <Text style={styles.logoutBtnText}>Switch Account / Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    width: "100%",
    maxWidth: 420,
    ...SHADOWS.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  infoBox: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: "center",
  },
  customerAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    width: "100%",
    gap: 10,
    marginBottom: SPACING.md,
  },
  customerAppBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  logoutBtnText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "700",
  },
});
