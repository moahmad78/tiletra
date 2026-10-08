import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
  ActivityIndicator,
  AppState,
} from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellRing,
  ShoppingCart,
  Tag,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { apiClient } from "../src/api/client";
import { useAuthStore } from "../src/store/authStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSystemPermission, setHasSystemPermission] = useState(true);

  // Preference switches
  const [offersEnabled, setOffersEnabled] = useState(true);
  const [cartRemindersEnabled, setCartRemindersEnabled] = useState(true);

  // Check system OS permission
  const checkPermission = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setHasSystemPermission(status === "granted");
    } catch {
      setHasSystemPermission(false);
    }
  }, []);

  // Fetch user preferences from backend
  const fetchPreferences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any>("/api/mobile/notifications/preferences");
      if (res.data?.success && res.data?.preferences) {
        setOffersEnabled(Boolean(res.data.preferences.offersEnabled ?? true));
        setCartRemindersEnabled(Boolean(res.data.preferences.cartRemindersEnabled ?? true));
      }
    } catch (err) {
      console.warn("[NotificationSettings] Failed to fetch preferences:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
    fetchPreferences();

    // Re-check permission when app returns from background / system settings
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        checkPermission();
      }
    });

    return () => sub.remove();
  }, [checkPermission, fetchPreferences]);

  // Save preference change to backend
  const handleToggle = async (type: "offers" | "cart", value: boolean) => {
    const nextOffers = type === "offers" ? value : offersEnabled;
    const nextCart = type === "cart" ? value : cartRemindersEnabled;

    if (type === "offers") setOffersEnabled(value);
    if (type === "cart") setCartRemindersEnabled(value);

    try {
      setSaving(true);
      await apiClient.post("/api/mobile/notifications/preferences", {
        offersEnabled: nextOffers,
        cartRemindersEnabled: nextCart,
      });
    } catch (err) {
      console.error("[NotificationSettings] Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSystemSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:").catch(() => Linking.openSettings());
    } else {
      Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <Text style={styles.headerSubtitle}>Control your alerts and push preferences</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* System Permission Card */}
        <View
          style={[
            styles.systemCard,
            hasSystemPermission ? styles.systemCardGranted : styles.systemCardDenied,
          ]}
        >
          <View style={styles.systemCardHeader}>
            <View
              style={[
                styles.systemIconCircle,
                hasSystemPermission ? styles.iconCircleGreen : styles.iconCircleAmber,
              ]}
            >
              {hasSystemPermission ? (
                <CheckCircle2 size={18} color="#059669" />
              ) : (
                <AlertTriangle size={18} color="#D97706" />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.systemCardTitle}>
                {hasSystemPermission ? "Device Notifications Active" : "Device Notifications Disabled"}
              </Text>
              <Text style={styles.systemCardSub}>
                {hasSystemPermission
                  ? "Your operating system allows push notifications from IntriHub."
                  : "Notifications are blocked by your phone's operating system settings."}
              </Text>
            </View>
          </View>

          {!hasSystemPermission && (
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={handleOpenSystemSettings}
              activeOpacity={0.85}
            >
              <Text style={styles.settingsButtonText}>Open Device Settings</Text>
              <ExternalLink size={14} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading notification preferences...</Text>
          </View>
        ) : (
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>NOTIFICATION CATEGORIES</Text>

            {/* 1. Order Updates (Rule R-1: Always ON) */}
            <View style={styles.settingRow}>
              <View style={styles.iconBox}>
                <Truck size={20} color={COLORS.primary} />
              </View>
              <View style={styles.settingDetails}>
                <View style={styles.titleWithBadge}>
                  <Text style={styles.settingTitle}>Order Updates</Text>
                  <View style={styles.mandatoryBadge}>
                    <Text style={styles.mandatoryBadgeText}>ALWAYS ON</Text>
                  </View>
                </View>
                <Text style={styles.settingDescription}>
                  Real-time status updates on order packing, dispatch, and delivery.
                </Text>
              </View>
              <Switch
                value={true}
                disabled={true}
                trackColor={{ false: "#E5E7EB", true: "#93C5FD" }}
                thumbColor="#052a51"
              />
            </View>

            {/* 2. Offers & Campaigns (Rule R-1) */}
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(242, 101, 34, 0.08)" }]}>
                <Tag size={20} color={COLORS.accentOrange} />
              </View>
              <View style={styles.settingDetails}>
                <Text style={styles.settingTitle}>Offers & Campaigns</Text>
                <Text style={styles.settingDescription}>
                  Exclusive promotional offers, festive discounts, price drops, and clearance sales.
                </Text>
              </View>
              <Switch
                value={offersEnabled}
                onValueChange={(val) => handleToggle("offers", val)}
                trackColor={{ false: "#E5E7EB", true: "#FDBA74" }}
                thumbColor={offersEnabled ? COLORS.accentOrange : "#9CA3AF"}
              />
            </View>

            {/* 3. Cart Reminders (Rule R-1) */}
            <View style={styles.settingRow}>
              <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.08)" }]}>
                <ShoppingCart size={20} color="#059669" />
              </View>
              <View style={styles.settingDetails}>
                <Text style={styles.settingTitle}>Cart Reminders</Text>
                <Text style={styles.settingDescription}>
                  Timely reminders for reserved items left in your shopping cart before stock runs out.
                </Text>
              </View>
              <Switch
                value={cartRemindersEnabled}
                onValueChange={(val) => handleToggle("cart", val)}
                trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
                thumbColor={cartRemindersEnabled ? "#059669" : "#9CA3AF"}
              />
            </View>
          </View>
        )}

        {/* Quiet Hours & Frequency Cap Info (Rules R-3 & R-4) */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>IntriHub Smart Notification Policy</Text>
          <Text style={styles.infoText}>
            • <Text style={{ fontWeight: "700" }}>Quiet Hours:</Text> Non-order notifications are
            never sent between 9:00 PM and 8:00 AM (India Time).
          </Text>
          <Text style={styles.infoText}>
            • <Text style={{ fontWeight: "700" }}>Daily Limit:</Text> Maximum 2 promotional
            notifications per day so you are never overwhelmed.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === "android" ? 44 : 54,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 6,
    marginRight: SPACING.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 40,
  },
  systemCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
  },
  systemCardGranted: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  systemCardDenied: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  systemCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  systemIconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleGreen: {
    backgroundColor: "#DCFCE7",
  },
  iconCircleAmber: {
    backgroundColor: "#FEF3C7",
  },
  systemCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  systemCardSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  settingsButton: {
    marginTop: 12,
    backgroundColor: "#052a51",
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButtonText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  settingsSection: {
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(5, 42, 81, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingDetails: {
    flex: 1,
    marginRight: 10,
  },
  titleWithBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  mandatoryBadge: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  mandatoryBadgeText: {
    fontSize: 8.5,
    fontWeight: "800",
    color: "#3730A3",
  },
  settingDescription: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  infoCard: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: "#F8FAFC",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 11.5,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 16,
  },
});
