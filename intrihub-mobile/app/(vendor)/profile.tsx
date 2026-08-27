import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Store,
  ShieldCheck,
  Phone,
  Mail,
  Truck,
  LogOut,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  ShoppingBag,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { useAuthStore } from "../../src/store/authStore";
import { fetchVendorDashboard } from "../../src/api/vendor";

export default function VendorProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const { data } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: fetchVendorDashboard,
  });

  const vendor = data?.vendor;

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out of your vendor account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login" as any);
        },
      },
    ]);
  };

  const handleSwitchToBuyer = () => {
    router.replace("/(tabs)/home" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendor Store Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.storeLogoBox}>
            <Store size={32} color={COLORS.primary} />
          </View>

          <View style={styles.profileInfoCol}>
            <View style={styles.nameBadgeRow}>
              <Text style={styles.storeName}>{vendor?.businessName || "My Vendor Store"}</Text>
              <ShieldCheck size={18} color={COLORS.accentGreen} />
            </View>

            <Text style={styles.ownerName}>Proprietor: {vendor?.ownerName || user?.name || "Partner"}</Text>

            <View style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>
                {vendor?.category || "Building Materials & Tiles"}
              </Text>
            </View>
          </View>
        </View>

        {/* Contact & Business Info */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Store Details</Text>

          <View style={styles.infoRow}>
            <Phone size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Contact Phone</Text>
            <Text style={styles.infoValue}>{vendor?.contactPhone || user?.phone || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Mail size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Contact Email</Text>
            <Text style={styles.infoValue}>{vendor?.contactEmail || user?.email || "N/A"}</Text>
          </View>

          <View style={styles.infoRow}>
            <Truck size={18} color={COLORS.textSecondary} />
            <Text style={styles.infoLabel}>Fulfillment Method</Text>
            <Text style={styles.infoValue}>
              {vendor?.deliveryMethod === "self" ? "Self Transporter" : "Platform Logistics"}
            </Text>
          </View>
        </View>

        {/* Navigation & Help Section */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Partner Tools</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleSwitchToBuyer}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <ShoppingBag size={18} color={COLORS.accentBlue} />
              <Text style={styles.menuItemLabel}>Switch to Customer Storefront</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL("https://www.intrihub.com/vendor")}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <ExternalLink size={18} color={COLORS.accentOrange} />
              <Text style={styles.menuItemLabel}>Open Web Vendor Portal</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL("mailto:support@intrihub.com")}
            activeOpacity={0.7}
          >
            <View style={styles.menuItemLeft}>
              <HelpCircle size={18} color={COLORS.accentGreen} />
              <Text style={styles.menuItemLabel}>Vendor Help & Support</Text>
            </View>
            <ChevronRight size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <LogOut size={18} color={COLORS.accentRed} />
          <Text style={styles.logoutBtnText}>Logout Vendor Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  storeLogoBox: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  profileInfoCol: {
    flex: 1,
  },
  nameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  ownerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  categoryPill: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 10,
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  menuItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fee2e2",
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    gap: 8,
    marginTop: 8,
  },
  logoutBtnText: {
    color: COLORS.accentRed,
    fontSize: 14,
    fontWeight: "800",
  },
});
