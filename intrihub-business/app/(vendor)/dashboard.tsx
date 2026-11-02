import { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Building2,
  TrendingUp,
  Package,
  ShoppingCart,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  Bell,
} from "lucide-react-native";
import { fetchVendorDashboard, updateVendorStatus } from "../../src/api/vendor";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { useTranslation } from "../../src/store/i18nStore";
import { useNotificationStore } from "../../src/store/notificationStore";

export default function VendorDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isUpdatingOnline, setIsUpdatingOnline] = useState(false);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: fetchVendorDashboard,
  });

  const { unreadCount, shakeNonce, initNotifications } = useNotificationStore();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const triggerBellShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -1, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.75, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -0.75, duration: 70, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0.4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -0.4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  useEffect(() => {
    initNotifications();
  }, [initNotifications]);

  // Shake the bell whenever a new notification arrives
  useEffect(() => {
    if (shakeNonce > 0) {
      triggerBellShake();
    }
  }, [shakeNonce, triggerBellShake]);

  // Initial bell ringing animation if unread alerts are pending
  useEffect(() => {
    if (unreadCount > 0) {
      const timer = setTimeout(() => {
        triggerBellShake();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  // Periodic subtle jiggle if vendor has unread alerts
  useEffect(() => {
    if (unreadCount > 0) {
      const interval = setInterval(() => {
        triggerBellShake();
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [unreadCount, triggerBellShake]);

  const bellRotation = shakeAnim.interpolate({
    inputRange: [-1, -0.5, 0, 0.5, 1],
    outputRange: ["-22deg", "-11deg", "0deg", "11deg", "22deg"],
  });

  const stats = data?.stats;
  const vendor = data?.vendor;
  const recentOrders = data?.recentOrders || [];

  const statusMutation = useMutation({
    mutationFn: (newOnline: boolean) => updateVendorStatus({ isOnline: newOnline }),
    onSuccess: (res, newOnline) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      if (newOnline) {
        Alert.alert(
          "Store Online 🟢",
          "Your store is now ONLINE! Products are visible on the website and mobile app."
        );
      } else {
        Alert.alert(
          "Store Offline 🔴",
          "Your store is now OFFLINE. Products are hidden from customers so no unfulfillable orders are received."
        );
      }
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to update online status");
    },
    onSettled: () => {
      setIsUpdatingOnline(false);
    },
  });

  const isOnline = vendor?.isOnline !== false;

  const handleToggleOnline = (newValue: boolean) => {
    setIsUpdatingOnline(true);
    statusMutation.mutate(newValue);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
        <Text style={styles.loadingText}>
          {t("common.loading") || "Loading Vendor Dashboard..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        {vendor?.logo ? (
          <Image
            source={{ uri: vendor.logo }}
            style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#E2E8F0" }}
            contentFit="cover"
          />
        ) : (
          <View style={styles.webLogoBadge}>
            <Image
              source={require("../../assets/intri-web-logo.png")}
              style={styles.webHeaderLogo}
              contentFit="contain"
            />
          </View>
        )}
        <View style={{ flex: 1 }} />

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {/* Small Store Online / Offline Toggle Pill */}
          <View
            style={[
              styles.topBarTogglePill,
              {
                backgroundColor: isOnline ? "rgba(22, 163, 74, 0.22)" : "rgba(220, 38, 38, 0.22)",
                borderColor: isOnline ? "#4ADE80" : "#F87171",
              },
            ]}
          >
            <View
              style={[
                styles.topBarToggleDot,
                { backgroundColor: isOnline ? "#22C55E" : "#EF4444" },
              ]}
            />
            <Text
              style={[
                styles.topBarToggleText,
                { color: isOnline ? "#86EFAC" : "#FCA5A5" },
              ]}
            >
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Text>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              disabled={isUpdatingOnline}
              trackColor={{ false: "#475569", true: "#16A34A" }}
              thumbColor={isOnline ? "#FFFFFF" : "#E2E8F0"}
              ios_backgroundColor="#475569"
              style={styles.topBarSwitch}
            />
          </View>

          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.notifHeaderBtn}
            onPress={() => router.push("/(vendor)/notifications" as any)}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
              <Bell size={19} color="#FFFFFF" />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentOrange} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 4-Grid Operational Stats */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(vendor)/orders" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Clock size={20} color={COLORS.accentAmber} />
            </View>
            <Text style={styles.statNumber}>{stats?.pendingOrders || 0}</Text>
            <Text style={styles.statTitle}>{t("orders.pending") || "Pending Orders"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(vendor)/orders" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <CheckCircle2 size={20} color={COLORS.accentGreen} />
            </View>
            <Text style={styles.statNumber}>{stats?.deliveredOrders || 0}</Text>
            <Text style={styles.statTitle}>{t("orders.delivered") || "Delivered"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(vendor)/products" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(37, 99, 235, 0.15)" }]}>
              <Package size={20} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.statNumber}>{stats?.activeProductsCount || 0}</Text>
            <Text style={styles.statTitle}>{t("vendor.products") || "Active Catalog"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(vendor)/products" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
              <AlertTriangle size={20} color={COLORS.accentRed} />
            </View>
            <Text style={styles.statNumber}>{stats?.lowStockProductsCount || 0}</Text>
            <Text style={styles.statTitle}>{t("vendor.outOfStock") || "Low Stock Items"}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("vendor.orders") || "Recent Split Orders"}</Text>
          <TouchableOpacity onPress={() => router.push("/(vendor)/orders" as any)}>
            <Text style={styles.viewAllText}>{t("common.viewAll") || "View All"}</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <ShoppingCart size={36} color={COLORS.textTertiary} />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              New customer orders assigned to your warehouse will appear here in real-time.
            </Text>
          </View>
        ) : (
          recentOrders.map((order) => (
            <TouchableOpacity
              key={order.splitId}
              style={styles.orderCard}
              onPress={() => router.push({ pathname: "/(vendor)/order/[id]", params: { id: order.splitId } } as any)}
              activeOpacity={0.85}
            >
              <View style={styles.orderCardHeader}>
                <View style={styles.orderCardHeaderLeft}>
                  <Text style={styles.orderIdText} numberOfLines={1}>Order #{order.orderId}</Text>
                  <Text style={styles.customerName} numberOfLines={1}>{order.customerName}</Text>
                </View>
                {(() => {
                  const statusInfo = getFulfillmentStatusInfo(order.fulfillmentStatus);
                  return (
                    <View
                      style={[
                        styles.statusPill,
                        {
                          backgroundColor: statusInfo.bg,
                          borderColor: statusInfo.border,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.statusPillText, { color: statusInfo.textColor }]}
                        numberOfLines={1}
                      >
                        {statusInfo.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>

              <View style={styles.orderCardFooter}>
                <Text style={styles.orderItemsCount}>{order.itemsCount} item(s)</Text>
                <View style={styles.payoutAmountBox}>
                  <Text style={styles.payoutAmountLabel}>Your Payout:</Text>
                  <Text style={styles.payoutAmountValue}>₹{order.vendorPayoutAmount?.toLocaleString("en-IN")}</Text>
                  <ChevronRight size={16} color={COLORS.textTertiary} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getFulfillmentStatusInfo(status?: string) {
  const s = (status || "").toLowerCase().trim();

  // Ready for pickup -> Compact single word "READY"
  if (s.includes("ready")) {
    return {
      label: "READY",
      bg: "#FEF3C7",
      textColor: "#B45309",
      border: "#FDE68A",
    };
  }

  // Pending vendor approval / awaiting vendor -> Compact single word "PENDING"
  if (s.includes("pending") || s.includes("awaiting")) {
    return {
      label: "PENDING",
      bg: "#EFF6FF",
      textColor: "#1D4ED8",
      border: "#BFDBFE",
    };
  }

  // Confirmed / accepted / processing
  if (s === "confirmed" || s === "accepted" || s === "processing") {
    return {
      label: "CONFIRMED",
      bg: "#F0FDF4",
      textColor: "#15803D",
      border: "#BBF7D0",
    };
  }

  // Dispatched / out for delivery / picked up
  if (s === "dispatched" || s === "picked_up" || s.includes("delivery") || s.includes("transit")) {
    return {
      label: "DISPATCHED",
      bg: "#F5F3FF",
      textColor: "#6D28D9",
      border: "#DDD6FE",
    };
  }

  // Delivered
  if (s === "delivered") {
    return {
      label: "DELIVERED",
      bg: "#DCFCE7",
      textColor: "#166534",
      border: "#86EFAC",
    };
  }

  // Cancelled / rejected
  if (s === "cancelled" || s === "rejected") {
    return {
      label: "CANCELLED",
      bg: "#FEE2E2",
      textColor: "#B91C1C",
      border: "#FECACA",
    };
  }

  // Safe fallback (single word, max 10 chars)
  const cleanWord = (s.split("_")[0] || "PENDING").slice(0, 10).toUpperCase();
  return {
    label: cleanWord,
    bg: "#F1F5F9",
    textColor: "#475569",
    border: "#E2E8F0",
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  webLogoBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  webHeaderLogo: {
    width: 114,
    height: 33,
  },
  topBarTogglePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
    paddingRight: 1,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1.2,
    gap: 5,
  },
  topBarToggleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  topBarToggleText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  topBarSwitch: {
    transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }],
    marginRight: -4,
    marginLeft: 0,
  },
  vendorHeaderLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  storeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeBadgeText: {
    color: COLORS.accentOrange,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  storeName: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
    marginTop: 2,
  },
  notifHeaderBtn: {
    position: "relative",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  revenueCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  revenueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  revenueSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  revenueAmount: {
    color: COLORS.textWhite,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  trendText: {
    color: "#10B981",
    fontSize: 11,
    fontWeight: "800",
  },
  payoutsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.lg,
  },
  payoutCol: {
    flex: 1,
  },
  payoutLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  payoutValue: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  payoutDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    marginHorizontal: SPACING.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.text,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.accentOrange,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
    gap: 8,
  },
  orderCardHeaderLeft: {
    flex: 1,
    paddingRight: 6,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: "center",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  orderCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.sm,
  },
  orderItemsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  payoutAmountBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  payoutAmountLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  payoutAmountValue: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },

});
