import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  ShieldAlert,
  TrendingUp,
  Store,
  Package,
  ShoppingCart,
  Users,
  ChevronRight,
  Clock,
  CheckCircle2,
  CheckSquare,
  Truck,
  Tag,
  Layout,
  Settings,
  MessageSquare,
  FileSpreadsheet,
  AlertTriangle,
  Send,
  Boxes,
} from "lucide-react-native";
import { fetchAdminDashboard, notifyAdminVendorRestock } from "../../src/api/admin";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [notifyingVendorId, setNotifyingVendorId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchAdminDashboard(),
  });

  const handleSendRestockNotice = async (product: any) => {
    if (!product.vendor?.id) {
      Alert.alert("Notice", "This product is managed directly by Central Hub.");
      return;
    }
    setNotifyingVendorId(product.id);
    try {
      const res = await notifyAdminVendorRestock({
        vendorId: product.vendor.id,
        productId: product.id,
        productName: product.name,
        stockBoxes: product.stockBoxes,
      });
      setNotifyingVendorId(null);
      if (res.success) {
        Alert.alert(
          "Notice Dispatched 🚀",
          `Restock notification sent to "${product.vendor.businessName}". They will receive an in-app & push alert on their device!`
        );
      } else {
        Alert.alert("Error", res.error || "Failed to notify vendor");
      }
    } catch (e: any) {
      setNotifyingVendorId(null);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  const stats = data?.stats;
  const recentOrders = data?.recentOrders || [];
  const pendingVendors = data?.pendingVendors || [];
  const lowStockProducts = data?.lowStockProducts || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.adminBadge}>
            <ShieldAlert size={12} color="#fff" />
            <Text style={styles.adminBadgeText}>SUPER ADMIN CONSOLE</Text>
          </View>
          <Text style={styles.headerTitle}>Platform Operations</Text>
        </View>
        <Image
          source={require("../../assets/intri-icon.png")}
          style={styles.headerBrandLogo}
          contentFit="contain"
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentBlue} />}
        showsVerticalScrollIndicator={false}
      >
        {/* GMV Highlight Card */}
        <View style={styles.gmvCard}>
          <Text style={styles.gmvLabel}>Gross Merchandise Value (GMV)</Text>
          <Text style={styles.gmvAmount}>₹{(stats?.totalGmv || 0).toLocaleString("en-IN")}</Text>

          <View style={styles.gmvStatsRow}>
            <View style={styles.gmvStatCol}>
              <Text style={styles.gmvStatLabel}>Settled Revenue</Text>
              <Text style={styles.gmvStatVal}>₹{(stats?.totalRevenue || 0).toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.gmvDivider} />
            <View style={styles.gmvStatCol}>
              <Text style={styles.gmvStatLabel}>Total Orders</Text>
              <Text style={styles.gmvStatVal}>{stats?.totalOrdersCount || 0}</Text>
            </View>
          </View>
        </View>

        {/* Operational 4-Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(admin)/vendors" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(37, 99, 235, 0.15)" }]}>
              <Store size={20} color={COLORS.accentBlue} />
            </View>
            <Text style={styles.statNumber}>{stats?.totalVendorsCount || 0}</Text>
            <Text style={styles.statTitle}>Total Vendors</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(admin)/products" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <Package size={20} color={COLORS.accentGreen} />
            </View>
            <Text style={styles.statNumber}>{stats?.totalProductsCount || 0}</Text>
            <Text style={styles.statTitle}>Listed Products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(admin)/orders" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <ShoppingCart size={20} color={COLORS.accentAmber} />
            </View>
            <Text style={styles.statNumber}>{stats?.totalOrdersCount || 0}</Text>
            <Text style={styles.statTitle}>Total Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(admin)/users" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(124, 58, 237, 0.15)" }]}>
              <Users size={20} color={COLORS.accentPurple} />
            </View>
            <Text style={styles.statNumber}>{stats?.totalUsersCount || 0}</Text>
            <Text style={styles.statTitle}>Platform Users</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock & Out-of-Stock Alerts Center */}
        {lowStockProducts.length > 0 ? (
          <View style={styles.lowStockSection}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={16} color="#DC2626" />
                <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>
                  Inventory Alerts ({lowStockProducts.length})
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/(admin)/products" as any)}>
                <Text style={[styles.viewAllText, { color: "#DC2626" }]}>Catalog</Text>
              </TouchableOpacity>
            </View>

            {lowStockProducts.map((p: any) => (
              <View key={p.id} style={styles.lowStockCard}>
                <Image
                  source={p.images?.[0] ? { uri: p.images[0] } : require("../../assets/intri-icon.png")}
                  style={styles.lowStockThumb}
                  contentFit="cover"
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.lowStockTitle} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.lowStockVendorSub}>
                    Vendor: {p.vendor?.businessName || "Central Warehouse"}
                  </Text>
                  <View style={styles.lowStockBadgeRow}>
                    <View style={styles.lowStockPill}>
                      <Boxes size={11} color="#DC2626" />
                      <Text style={styles.lowStockPillText}>
                        {p.stockBoxes === 0 ? "Out of Stock" : `${p.stockBoxes} ${p.unitOfSale || "boxes"} left`}
                      </Text>
                    </View>
                  </View>
                </View>

                {p.vendor?.id ? (
                  <TouchableOpacity
                    style={styles.notifyVendorBtn}
                    onPress={() => handleSendRestockNotice(p)}
                    disabled={notifyingVendorId === p.id}
                  >
                    {notifyingVendorId === p.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <>
                        <Send size={11} color="#FFF" />
                        <Text style={styles.notifyVendorBtnText}>Restock Notice</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Pending Approvals Section */}
        {pendingVendors.length > 0 ? (
          <View style={styles.pendingSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: COLORS.accentAmber }]}>
                Pending Vendor KYC ({pendingVendors.length})
              </Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/vendors" as any)}>
                <Text style={styles.viewAllText}>Review All</Text>
              </TouchableOpacity>
            </View>

            {pendingVendors.map((v) => (
              <TouchableOpacity
                key={v.id}
                style={styles.pendingVendorCard}
                onPress={() => router.push({ pathname: "/(admin)/vendor/[id]", params: { id: v.id } } as any)}
              >
                <View>
                  <Text style={styles.vendorName}>{v.businessName}</Text>
                  <Text style={styles.vendorCategory}>{v.category || "Building Supplies"}</Text>
                </View>
                <View style={styles.reviewBtn}>
                  <Text style={styles.reviewBtnText}>Review KYC</Text>
                  <ChevronRight size={14} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Operational Inboxes / Quick Actions */}
        <View style={styles.inboxesContainer}>
          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#FFF8F5", borderColor: "#FFEDD5" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/vendor-applications" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(242, 101, 34, 0.15)" }]}>
              <Clock size={20} color="#F26522" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Vendor Applications</Text>
              <Text style={styles.inboxSub}>Review public sign-ups & KYC</Text>
            </View>
            <ChevronRight size={18} color="#F26522" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/product-approvals" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(5, 42, 81, 0.12)" }]}>
              <CheckSquare size={20} color="#052A51" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Product Approvals</Text>
              <Text style={styles.inboxSub}>Moderate seller catalog items</Text>
            </View>
            <ChevronRight size={18} color="#052A51" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/deliveries" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <Truck size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Logistics & Dispatch</Text>
              <Text style={styles.inboxSub}>Assign couriers, tracking & COD</Text>
            </View>
            <ChevronRight size={18} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#FAF5FF", borderColor: "#E9D5FF" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/coupons" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(124, 58, 237, 0.15)" }]}>
              <Tag size={20} color="#7C3AED" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Coupons & Promotions</Text>
              <Text style={styles.inboxSub}>Storewide discounts & cart campaigns</Text>
            </View>
            <ChevronRight size={18} color="#7C3AED" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/content" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(2, 132, 199, 0.15)" }]}>
              <Layout size={20} color="#0284C7" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Homepage CMS & Banners</Text>
              <Text style={styles.inboxSub}>Promo carousels, hero & announcements</Text>
            </View>
            <ChevronRight size={18} color="#0284C7" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/settings" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
              <Settings size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Global Store Settings</Text>
              <Text style={styles.inboxSub}>Shipping slabs, GST & COD guardrails</Text>
            </View>
            <ChevronRight size={18} color="#D97706" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/reviews" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
              <MessageSquare size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Review Moderation</Text>
              <Text style={styles.inboxSub}>Approve & publish buyer feedback</Text>
            </View>
            <ChevronRight size={18} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.inboxCard, { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" }]}
            activeOpacity={0.85}
            onPress={() => router.push("/(admin)/products-bulk" as any)}
          >
            <View style={[styles.inboxIconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
              <FileSpreadsheet size={20} color="#7C3AED" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inboxTitle}>Bulk CSV Product Import</Text>
              <Text style={styles.inboxSub}>Batch spreadsheet upload & templates</Text>
            </View>
            <ChevronRight size={18} color="#7C3AED" />
          </TouchableOpacity>
        </View>

        {/* Recent Platform Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Platform Orders</Text>
          <TouchableOpacity onPress={() => router.push("/(admin)/orders" as any)}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders.map((o) => (
          <TouchableOpacity
            key={o.id}
            style={styles.orderCard}
            onPress={() => router.push({ pathname: "/(admin)/order/[id]", params: { id: o.id } } as any)}
            activeOpacity={0.85}
          >
            <View style={styles.orderTop}>
              <View>
                <Text style={styles.orderId}>Order #{o.id}</Text>
                <Text style={styles.customerName}>{o.customerName}</Text>
              </View>
              <Text style={styles.orderTotal}>₹{o.total?.toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.orderBottom}>
              <Text style={styles.orderMeta}>
                {o.itemsCount} item(s) • {o.paymentMethod.toUpperCase()}
              </Text>
              <View style={[styles.statusPill, o.orderStatus === "delivered" ? styles.statusGreen : styles.statusAmber]}>
                <Text style={styles.statusPillText}>{o.orderStatus.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerBrandLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    gap: 4,
    marginBottom: 4,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  gmvCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.md,
  },
  gmvLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  gmvAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.textWhite,
    marginTop: 4,
  },
  gmvStatsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
  },
  gmvStatCol: {
    flex: 1,
  },
  gmvStatLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
  },
  gmvStatVal: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },
  gmvDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
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
  inboxesContainer: {
    gap: 10,
    marginBottom: SPACING.xl,
  },
  inboxCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  inboxIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inboxTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  inboxSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
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
    color: COLORS.accentBlue,
  },
  pendingSection: {
    marginBottom: SPACING.xl,
  },
  lowStockSection: {
    marginBottom: SPACING.xl,
  },
  lowStockCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: SPACING.sm,
  },
  lowStockThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  lowStockTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  lowStockVendorSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  lowStockBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  lowStockPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  lowStockPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#DC2626",
  },
  notifyVendorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
    marginLeft: 8,
  },
  notifyVendorBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  pendingVendorCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  vendorCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.text,
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  orderMeta: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  statusGreen: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  statusAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.text,
  },
});
