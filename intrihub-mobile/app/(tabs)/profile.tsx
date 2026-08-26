import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  Switch,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  User,
  MapPin,
  Heart,
  Bell,
  PhoneCall,
  MessageCircle,
  FileText,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Building,
} from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";
import { getProfile } from "../../src/api/auth";
import { AddressModal } from "../../src/components/AddressModal";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [orderPushEnabled, setOrderPushEnabled] = useState(true);

  // Sync latest user profile on mount if logged in
  useEffect(() => {
    if (isAuthenticated) {
      getProfile().then((res) => {
        if (res.success && res.user) {
          setUser(res.user);
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const handleSupportCall = () => {
    Linking.openURL("tel:9264920211");
  };

  const handleSupportWhatsApp = () => {
    Linking.openURL("https://wa.me/919264920211?text=Hello%20Intrihub%20Support");
  };

  const handlePrivacyPolicy = () => {
    router.push("/privacy" as any);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Account</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        {isAuthenticated && user ? (
          <View style={[styles.userCard, SHADOWS.sm]}>
            {user.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.avatarImage} contentFit="cover" />
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email ? user.email.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || "Intrihub Customer"}</Text>
              {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
              {user.phone && !user.phone.startsWith("google_") && !user.phone.startsWith("email_") ? (
                <Text style={styles.userPhone}>+91 {user.phone}</Text>
              ) : null}
            </View>
          </View>
        ) : (
          <View style={[styles.guestCard, SHADOWS.sm]}>
            <Text style={styles.guestTitle}>Sign In for the Best Experience</Text>
            <Text style={styles.guestSub}>
              Manage orders, save delivery addresses, and receive fast updates
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginBtnText}>Sign In / Register</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Section: Account Actions */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>ACCOUNT & PREFERENCES</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push("/wishlist" as any)}
          >
            <View style={styles.menuLeft}>
              <Heart size={20} color={COLORS.accentOrange} />
              <Text style={styles.menuLabel}>My Wishlist</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              if (isAuthenticated) {
                setAddressModalVisible(true);
              } else {
                router.push("/(auth)/login");
              }
            }}
          >
            <View style={styles.menuLeft}>
              <MapPin size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Saved Delivery Addresses</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Bell size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={orderPushEnabled}
              onValueChange={setOrderPushEnabled}
              trackColor={{ false: COLORS.surfaceTertiary, true: COLORS.primary }}
              thumbColor={COLORS.surface}
            />
          </View>
        </View>

        {/* Section: Help & Support */}
        <View style={styles.menuGroup}>
          <Text style={styles.groupTitle}>HELP & CUSTOMER SUPPORT</Text>

          <TouchableOpacity style={styles.menuItem} onPress={handleSupportWhatsApp}>
            <View style={styles.menuLeft}>
              <MessageCircle size={20} color={COLORS.accentGreen} />
              <Text style={styles.menuLabel}>Chat on WhatsApp</Text>
            </View>
            <Text style={styles.supportHint}>+91 78709 35277</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleSupportCall}>
            <View style={styles.menuLeft}>
              <PhoneCall size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Call Helpline</Text>
            </View>
            <Text style={styles.supportHint}>10 AM - 7 PM</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <View style={styles.menuLeft}>
              <ShieldCheck size={20} color={COLORS.primary} />
              <Text style={styles.menuLabel}>Privacy Policy & Terms</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {isAuthenticated && (
          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <LogOut size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}

        <View style={styles.appInfo}>
          <Text style={styles.versionText}>Intrihub Mobile v1.0.0 (Android)</Text>
          <Text style={styles.copyrightText}>© 2026 Intrihub Technologies Private Limited</Text>
        </View>
      </ScrollView>

      {/* Address Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  scroll: {
    flex: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  avatarInitial: {
    color: COLORS.textWhite,
    fontSize: 22,
    fontWeight: "800",
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  guestCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  guestSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  loginBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: "800",
  },
  menuGroup: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 12,
  },
  supportHint: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xl,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
  },
  appInfo: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  copyrightText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
