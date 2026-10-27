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
  Plus,
  ChevronRight,
  ArrowUpRight,
  Bell,
  Power,
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
  const rawRecent = data?.recentOrders || [];
  // Strict serial chronological sort: latest orders always appear first on top
  const recentOrders = [...rawRecent].sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime();
    const timeB = new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

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
            style={{ width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: "#E2E8F0" }}
            contentFit="cover"
          />
        ) : (
          <Image
            source={require("../../assets/intri-icon.png")}
            style={styles.vendorHeaderLogo}
            contentFit="contain"
          />
        )}
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={styles.storeBadge}>
            <Building2 size={12} color={COLORS.accentOrange} />
            <Text style={styles.storeBadgeText}>VENDOR CONSOLE</Text>
          </View>
          <Text style={styles.storeName} numberOfLines={1}>{vendor?.businessName || "My Store"}</Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            style={styles.notifHeaderBtn}
            onPress={() => router.push("/(vendor)/notifications" as any)}
            activeOpacity={0.85}
          >
            <Animated.View style={{ transform: [{ rotate: bellRotation }] }}>
              <Bell size={20} color="#FFFFFF" />
            </Animated.View>
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAddBtn}
            onPress={() => router.push("/(vendor)/add-product" as any)}
            activeOpacity={0.85}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.quickAddBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentOrange} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Store Online / Offline Toggle Card */}
        <View
          style={[
            styles.statusToggleCard,
            {
              backgroundColor: isOnline ? "#F0FDF4" : "#FEF2F2",
              borderColor: isOnline ? "#BBF7D0" : "#FECACA",
            },
          ]}
        >
          <View style={styles.statusToggleLeft}>
            <View
              style={[
                styles.statusIconBadge,
                { backgroundColor: isOnline ? "#DCFCE7" : "#FEE2E2" },
              ]}
            >
              <Power size={18} color={isOnline ? "#16A34A" : "#DC2626"} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={[
                    styles.statusPulsingDot,
                    { backgroundColor: isOnline ? "#16A34A" : "#DC2626" },
                  ]}
                />
                <Text
                  style={[
                    styles.statusCardTitle,
                    { color: isOnline ? "#15803D" : "#B91C1C" },
                  ]}
                >
                  {isOnline ? "Store is ONLINE" : "Store is OFFLINE"}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusCardSubtitle,
                  { color: isOnline ? "#166534" : "#991B1B" },
                ]}
                numberOfLines={2}
              >
                {isOnline
                  ? "Items visible on website & app • Accepting orders"
                  : "Items hidden from catalog • Store closed"}
              </Text>
            </View>
          </View>

          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            disabled={isUpdatingOnline}
            trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
            thumbColor={isOnline ? "#16A34A" : "#64748B"}
            ios_backgroundColor="#CBD5E1"
          />
        </View>

        {/* Revenue Highlight Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View>
              <Text style={styles.revenueSubtitle}>{t("vendor.earnings") || "Total Gross Sales"}</Text>
              <Text style={styles.revenueAmount}>
                ₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color="#10B981" />
              <Text style={styles.trendText}>Live</Text>
            </View>
          </View>

          <View style={styles.payoutsRow}>
            <View style={styles.payoutCol}>
              <Text style={styles.payoutLabel}>Pending Settlement</Text>
              <Text style={[styles.payoutValue, { color: COLORS.accentAmber }]}>
                ₹{(stats?.pendingPayout || 0).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.payoutDivider} />
            <View style={styles.payoutCol}>
              <Text style={styles.payoutLabel}>Settled to Bank</Text>
              <Text style={[styles.payoutValue, { color: COLORS.accentGreen }]}>
                ₹{(stats?.completedPayouts || 0).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        </View>

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
            <Text style={styles.statTitle}>Active Orders</Text>
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
            <Text style={styles.statTitle}>Delivered</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(vendor)/products" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(37, 99, 235, 0.15)" }]}>
              <Package size={20} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.statNumber}>{stats?.activeProductsCount || (stats as any)?.totalProducts || 0}</Text>
            <Text style={styles.statTitle}>Product Catalog</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(vendor)/products" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
              <AlertTriangle size={20} color={COLORS.accentRed} />
            </View>
            <Text style={styles.statNumber}>{stats?.lowStockProductsCount || (stats as any)?.lowStockCount || 0}</Text>
            <Text style={styles.statTitle}>Low Stock Items</Text>
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
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <Text style={styles.orderIdText}>Order #{order.orderId}</Text>
                    {order.createdAt ? (
                      <Text style={styles.orderTimeText}>{formatOrderTime(order.createdAt)}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.customerName}>{order.customerName}</Text>
                </View>
                <View style={[styles.statusPill, getStatusStyle(order.fulfillmentStatus)]}>
                  <Text style={styles.statusPillText}>{formatStatus(order.fulfillmentStatus)}</Text>
                </View>
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

function formatOrderTime(dateStr?: string | Date | null) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function formatStatus(status?: string) {
  if (!status) return "Pending";
  return status.replace(/_/g, " ").toUpperCase();
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "confirmed":
      return { backgroundColor: "rgba(37, 99, 235, 0.15)", color: "#2563EB" };
    case "ready_for_pickup":
    case "dispatched":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#F59E0B" };
    case "delivered":
      return { backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10B981" };
    default:
      return { backgroundColor: "rgba(148, 163, 184, 0.2)", color: "#475569" };
  }
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
  quickAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  quickAddBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
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
    ...SHADOWS.sm,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  orderTimeText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: "600",
  },
  customerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
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
  statusToggleCard: {
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...SHADOWS.sm,
  },
  statusToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: SPACING.sm,
    gap: SPACING.sm,
  },
  statusIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  statusPulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: "900",
  },
  statusCardSubtitle: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    lineHeight: 15,
  },
});
