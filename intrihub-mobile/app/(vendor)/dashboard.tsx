import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  IndianRupee,
  AlertTriangle,
  Package,
  PlusCircle,
  Clock,
  ArrowRight,
  Store,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { fetchVendorDashboard } from "../../src/api/vendor";
import { formatCurrency } from "../../src/utils/formatters";

export default function VendorDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: fetchVendorDashboard,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Vendor Dashboard...</Text>
      </SafeAreaView>
    );
  }

  const vendor = data?.vendor;
  const stats = data?.stats || {
    totalOrders: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    totalProducts: 0,
    activeProducts: 0,
    pendingApprovals: 0,
  };
  const recentOrders = data?.recentOrders || [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.storeIconWrapper}>
            <Store size={22} color={COLORS.textWhite} />
          </View>
          <View style={styles.headerTextCol}>
            <Text style={styles.vendorGreeting}>Vendor Partner Panel</Text>
            <View style={styles.vendorNameRow}>
              <Text style={styles.vendorName} numberOfLines={1}>
                {vendor?.businessName || "My Vendor Store"}
              </Text>
              <ShieldCheck size={16} color={COLORS.accentGreen} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerAddBtn}
          onPress={() => router.push("/(vendor)/product-form" as any)}
          activeOpacity={0.85}
        >
          <PlusCircle size={16} color={COLORS.textWhite} />
          <Text style={styles.headerAddBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Verification Status Notice if Pending */}
        {vendor?.status === "pending" && (
          <View style={styles.pendingBanner}>
            <Clock size={18} color="#b45309" />
            <Text style={styles.pendingBannerText}>
              Your store application is currently under review by our admin team.
            </Text>
          </View>
        )}

        {/* Primary Stat Cards Grid */}
        <View style={styles.statsGrid}>
          {/* Revenue */}
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statIconWrapperRevenue}>
              <IndianRupee size={20} color="#052a51" />
            </View>
            <Text style={styles.statLabel}>Total Revenue</Text>
            <Text style={styles.statValueRevenue}>
              {formatCurrency(stats.totalRevenue)}
            </Text>
            <View style={styles.statSubRow}>
              <TrendingUp size={12} color={COLORS.accentGreen} />
              <Text style={styles.statSubTextGreen}>Delivered settlements</Text>
            </View>
          </View>

          {/* Orders */}
          <TouchableOpacity
            style={[styles.statCard, styles.ordersCard]}
            onPress={() => router.push("/(vendor)/orders" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.statIconWrapperOrders}>
              <ShoppingBag size={20} color={COLORS.accentOrange} />
            </View>
            <Text style={styles.statLabel}>Total Orders</Text>
            <Text style={styles.statValue}>{stats.totalOrders}</Text>
            <View style={styles.statSubRow}>
              <Text style={styles.statSubText}>Tap to view list</Text>
              <ArrowRight size={12} color={COLORS.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Low Stock Alert */}
          <TouchableOpacity
            style={[
              styles.statCard,
              stats.lowStockCount > 0 ? styles.alertCardActive : styles.alertCard,
            ]}
            onPress={() => router.push("/(vendor)/products" as any)}
            activeOpacity={0.85}
          >
            <View
              style={
                stats.lowStockCount > 0
                  ? styles.statIconWrapperAlertActive
                  : styles.statIconWrapperAlert
              }
            >
              <AlertTriangle
                size={20}
                color={stats.lowStockCount > 0 ? COLORS.accentRed : COLORS.textMuted}
              />
            </View>
            <Text style={styles.statLabel}>Low Stock Alerts</Text>
            <Text
              style={[
                styles.statValue,
                stats.lowStockCount > 0 && { color: COLORS.accentRed },
              ]}
            >
              {stats.lowStockCount}
            </Text>
            <Text style={styles.statSubText}>
              {stats.lowStockCount > 0 ? "Needs restocking" : "Stock healthy"}
            </Text>
          </TouchableOpacity>

          {/* Total Products */}
          <TouchableOpacity
            style={[styles.statCard, styles.productsCard]}
            onPress={() => router.push("/(vendor)/products" as any)}
            activeOpacity={0.85}
          >
            <View style={styles.statIconWrapperProducts}>
              <Package size={20} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.statLabel}>Active Products</Text>
            <Text style={styles.statValue}>{stats.activeProducts}</Text>
            <Text style={styles.statSubText}>
              {stats.totalProducts} total listed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Action Shortcuts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push("/(vendor)/product-form" as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: "#eff6ff" }]}>
              <PlusCircle size={22} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.quickActionLabel}>Add Product</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push("/(vendor)/orders" as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: "#fff7ed" }]}>
              <ShoppingBag size={22} color={COLORS.accentOrange} />
            </View>
            <Text style={styles.quickActionLabel}>Fulfill Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => router.push("/(vendor)/earnings" as any)}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: "#f0fdf4" }]}>
              <IndianRupee size={22} color={COLORS.accentGreen} />
            </View>
            <Text style={styles.quickActionLabel}>View Earnings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity
            onPress={() => router.push("/(vendor)/orders" as any)}
            style={styles.seeAllBtn}
          >
            <Text style={styles.seeAllText}>See All</Text>
            <ChevronRight size={14} color={COLORS.accentOrange} />
          </TouchableOpacity>
        </View>

        {recentOrders.length === 0 ? (
          <View style={styles.emptyOrdersCard}>
            <ShoppingBag size={32} color={COLORS.textMuted} />
            <Text style={styles.emptyOrdersTitle}>No orders received yet</Text>
            <Text style={styles.emptyOrdersSub}>
              New customer orders containing your products will appear here.
            </Text>
          </View>
        ) : (
          recentOrders.map((order) => {
            const isDelivered = order.fulfillmentStatus === "delivered";
            const isDispatched = order.fulfillmentStatus === "dispatched";

            return (
              <TouchableOpacity
                key={order.splitId}
                style={styles.orderCard}
                onPress={() =>
                  router.push({
                    pathname: "/(vendor)/vendor-order/[id]",
                    params: { id: order.splitId },
                  } as any)
                }
                activeOpacity={0.8}
              >
                <View style={styles.orderCardHeader}>
                  <View>
                    <Text style={styles.orderCustomerName}>
                      {order.customerName}
                    </Text>
                    <Text style={styles.orderIdText}>Order #{order.orderId.slice(-6)}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      isDelivered
                        ? styles.statusBadgeDelivered
                        : isDispatched
                        ? styles.statusBadgeDispatched
                        : styles.statusBadgeProcessing,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isDelivered
                          ? styles.statusTextDelivered
                          : isDispatched
                          ? styles.statusTextDispatched
                          : styles.statusTextProcessing,
                      ]}
                    >
                      {order.fulfillmentStatus.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderCardFooter}>
                  <Text style={styles.orderItemsCount}>
                    {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}
                  </Text>
                  <Text style={styles.orderPayoutAmount}>
                    Payout: {formatCurrency(order.vendorPayoutAmount)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  storeIconWrapper: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  headerTextCol: {
    flex: 1,
  },
  vendorGreeting: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.75)",
    fontWeight: "600",
    textTransform: "uppercase",
  },
  vendorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vendorName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  headerAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  headerAddBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  pendingBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#92400e",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  revenueCard: {
    borderColor: "#bfdbfe",
    backgroundColor: "#f8fafc",
  },
  ordersCard: {},
  alertCard: {},
  alertCardActive: {
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
  },
  productsCard: {},
  statIconWrapperRevenue: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statIconWrapperOrders: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: "#ffedd5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statIconWrapperAlert: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statIconWrapperAlertActive: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statIconWrapperProducts: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  statValueRevenue: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.primary,
  },
  statSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  statSubText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
  },
  statSubTextGreen: {
    fontSize: 11,
    color: COLORS.accentGreen,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.md,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.accentOrange,
    fontWeight: "700",
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  emptyOrdersCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyOrdersTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 10,
  },
  emptyOrdersSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    paddingBottom: 8,
    marginBottom: 8,
  },
  orderCustomerName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  orderIdText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  statusBadgeProcessing: {
    backgroundColor: "#fff7ed",
  },
  statusBadgeDispatched: {
    backgroundColor: "#eff6ff",
  },
  statusBadgeDelivered: {
    backgroundColor: "#f0fdf4",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  statusTextProcessing: {
    color: COLORS.accentOrange,
  },
  statusTextDispatched: {
    color: COLORS.accentBlue,
  },
  statusTextDelivered: {
    color: COLORS.accentGreen,
  },
  orderCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderItemsCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  orderPayoutAmount: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
});
