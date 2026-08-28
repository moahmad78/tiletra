import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ShoppingCart,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  Truck,
} from "lucide-react-native";
import { fetchAdminOrders } from "../../src/api/admin";
import { AdminOrder } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminOrdersScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-orders", search, statusFilter],
    queryFn: () =>
      fetchAdminOrders({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const orders = data?.orders || [];

  const renderOrderItem = ({ item }: { item: AdminOrder }) => {
    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          router.push({
            pathname: "/(admin)/order/[id]",
            params: { id: item.id },
          } as any)
        }
        activeOpacity={0.85}
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.orderId}>Order #{item.id}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
            {item.customerPhone ? (
              <Text style={styles.customerPhone}>+91 {item.customerPhone}</Text>
            ) : null}
          </View>

          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.orderTotal}>₹{item.total?.toLocaleString("en-IN")}</Text>
            <View style={[styles.statusBadge, getStatusStyle(item.orderStatus)]}>
              <Text style={styles.statusBadgeText}>{item.orderStatus.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaText}>
              {item.itemsCount} items • {item.splitsCount} vendor splits
            </Text>
            <Text style={styles.cityText}>
              📍 {item.deliveryCity || "India"} • {item.paymentMethod.toUpperCase()} ({item.paymentStatus})
            </Text>
          </View>
          <ChevronRight size={18} color={COLORS.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Platform Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} total platform shipments</Text>
      </View>

      {/* Centralized Logistics & Deliveries Banner */}
      <TouchableOpacity
        style={styles.logisticsBanner}
        activeOpacity={0.85}
        onPress={() => router.push("/(admin)/deliveries" as any)}
      >
        <View style={styles.appBannerIconBox}>
          <Truck size={18} color="#052A51" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.appBannerTitle}>Logistics & Dispatch Console</Text>
          <Text style={styles.appBannerSub}>Assign courier fleets, tracking & COD</Text>
        </View>
        <View style={styles.appBannerArrow}>
          <ChevronRight size={18} color="#052A51" />
        </View>
      </TouchableOpacity>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID, Customer name or phone..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsRow}>
          {["all", "pending", "confirmed", "dispatched", "delivered"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, statusFilter === tab && styles.tabChipActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text
                style={[
                  styles.tabChipText,
                  statusFilter === tab && styles.tabChipTextActive,
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentBlue} />}
        />
      )}
    </View>
  );
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "confirmed":
      return { backgroundColor: "rgba(37, 99, 235, 0.15)" };
    case "dispatched":
    case "ready_for_pickup":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)" };
    case "delivered":
      return { backgroundColor: "rgba(16, 185, 129, 0.15)" };
    default:
      return { backgroundColor: "rgba(148, 163, 184, 0.15)" };
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
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  logisticsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(5, 42, 81, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  appBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  appBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  appBannerArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: "#fff",
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.accentOrange,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.text,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: SPACING.sm,
  },
  metaCol: {
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  cityText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
});
