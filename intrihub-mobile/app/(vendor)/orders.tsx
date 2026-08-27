import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  ChevronRight,
  MapPin,
  Calendar,
  XCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { fetchVendorOrders } from "../../src/api/vendor";
import { VendorOrderSplit } from "../../src/types";
import { formatCurrency, formatDate } from "../../src/utils/formatters";

type StatusTab = "all" | "processing" | "dispatched" | "delivered" | "cancelled";

const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "All Orders" },
  { key: "processing", label: "Processing" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function VendorOrdersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-orders", activeTab],
    queryFn: () => fetchVendorOrders(activeTab === "all" ? undefined : activeTab),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const orders = data?.orders || [];

  const renderOrderItem = ({ item }: { item: VendorOrderSplit }) => {
    const parent = item.parentOrder;
    const isDelivered = item.fulfillmentStatus === "delivered";
    const isDispatched = item.fulfillmentStatus === "dispatched";
    const isCancelled = item.fulfillmentStatus === "cancelled";
    const itemsCount = parent?.items?.length || 1;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          router.push({
            pathname: "/(vendor)/order/[id]",
            params: { id: item.id },
          } as any)
        }
        activeOpacity={0.8}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderIdText}>Split ID: #{item.id.slice(-6).toUpperCase()}</Text>
            <View style={styles.dateRow}>
              <Calendar size={12} color={COLORS.textMuted} />
              <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              isDelivered
                ? styles.badgeDelivered
                : isDispatched
                ? styles.badgeDispatched
                : isCancelled
                ? styles.badgeCancelled
                : styles.badgeProcessing,
            ]}
          >
            {isDelivered ? (
              <CheckCircle2 size={11} color={COLORS.accentGreen} />
            ) : isDispatched ? (
              <Truck size={11} color={COLORS.accentBlue} />
            ) : isCancelled ? (
              <XCircle size={11} color={COLORS.accentRed} />
            ) : (
              <Clock size={11} color={COLORS.accentOrange} />
            )}
            <Text
              style={[
                styles.statusBadgeText,
                isDelivered
                  ? styles.statusTextDelivered
                  : isDispatched
                  ? styles.statusTextDispatched
                  : isCancelled
                  ? styles.statusTextCancelled
                  : styles.statusTextProcessing,
              ]}
            >
              {item.fulfillmentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Customer & Location */}
        <View style={styles.customerRow}>
          <Text style={styles.customerName}>{parent?.customerName || "Direct Customer"}</Text>
          {parent?.shippingAddress?.city && (
            <View style={styles.locationRow}>
              <MapPin size={12} color={COLORS.textMuted} />
              <Text style={styles.locationText}>{parent.shippingAddress.city}</Text>
            </View>
          )}
        </View>

        {/* Items Summary */}
        <View style={styles.itemsSummaryBox}>
          <Text style={styles.itemsSummaryText}>
            {itemsCount} item{itemsCount !== 1 ? "s" : ""} in this shipment
          </Text>
          {parent?.items?.[0] && (
            <Text style={styles.firstItemName} numberOfLines={1}>
              • {parent.items[0].productName || (parent.items[0] as any).name}
            </Text>
          )}
        </View>

        {/* Footer: Payout & Arrow */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.payoutLabel}>Your Payout (Post Commission)</Text>
            <Text style={styles.payoutValue}>{formatCurrency(item.vendorPayoutAmount)}</Text>
          </View>

          <View style={styles.viewDetailsRow}>
            <Text style={styles.viewDetailsText}>Fulfill Order</Text>
            <ChevronRight size={14} color={COLORS.accentOrange} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vendor Orders</Text>
        <Text style={styles.headerSubtitle}>
          Track fulfillment, dispatch courier, and manage deliveries
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsWrapper}>
        <FlatList
          data={STATUS_TABS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.tabsScrollContent}
          renderItem={({ item }) => {
            const isActive = activeTab === item.key;
            return (
              <TouchableOpacity
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(item.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Orders List */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ShoppingBag size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Orders Found</Text>
          <Text style={styles.emptySub}>
            {activeTab === "all"
              ? "When customers purchase your items, order splits will appear here for processing."
              : `No orders currently matching "${activeTab}" status.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
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
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  tabsWrapper: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tabsScrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: COLORS.textWhite,
    fontWeight: "700",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    paddingBottom: 8,
    marginBottom: 8,
  },
  orderIdText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  badgeProcessing: {
    backgroundColor: "#fff7ed",
  },
  badgeDispatched: {
    backgroundColor: "#eff6ff",
  },
  badgeDelivered: {
    backgroundColor: "#f0fdf4",
  },
  badgeCancelled: {
    backgroundColor: "#fee2e2",
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
  statusTextCancelled: {
    color: COLORS.accentRed,
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  itemsSummaryBox: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: 10,
  },
  itemsSummaryText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  firstItemName: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    paddingTop: 8,
  },
  payoutLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
  payoutValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 1,
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.accentOrange,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
});
