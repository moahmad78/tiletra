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
  Modal,
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
  IndianRupee,
  Calendar,
  X,
  Sparkles,
  DollarSign,
  Percent,
  MapPin,
  Phone,
  Mail,
  User,
  CreditCard,
  Building2,
  Eye,
} from "lucide-react-native";
import {
  fetchAdminDashboard,
  notifyAdminVendorRestock,
  fetchAdminRevenueAnalytics,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminDashboardScreen() {
  const router = useRouter();
  const [notifyingVendorId, setNotifyingVendorId] = useState<string | null>(null);

  // Revenue Analytics Modal State
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [revenuePeriod, setRevenuePeriod] = useState<"today" | "yesterday" | "7days" | "this_month" | "all">("today");

  // Recent Order Drilldown Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchAdminDashboard(),
  });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ["admin-revenue-analytics", revenuePeriod],
    queryFn: () => fetchAdminRevenueAnalytics(revenuePeriod),
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

  const handleOpenOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setOrderModalOpen(true);
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

  const revSummary = revenueData?.summary;
  const revVendors = revenueData?.vendors || [];

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
        {/* GMV & Today's Sales Highlight Card (Tappable for Vendor Revenue Breakdown) */}
        <TouchableOpacity
          style={styles.gmvCard}
          onPress={() => setRevenueModalOpen(true)}
          activeOpacity={0.9}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View>
              <Text style={styles.gmvLabel}>Gross Merchandise Value (GMV)</Text>
              <Text style={styles.gmvAmount}>₹{(stats?.totalGmv || 0).toLocaleString("en-IN")}</Text>
            </View>
            <View style={styles.tapToViewBadge}>
              <TrendingUp size={12} color="#FFFFFF" />
              <Text style={styles.tapToViewText}>Vendor Breakdown →</Text>
            </View>
          </View>

          <View style={styles.gmvStatsRow}>
            <View style={styles.gmvStatCol}>
              <Text style={styles.gmvStatLabel}>Today's Platform Sales</Text>
              <Text style={[styles.gmvStatVal, { color: "#10B981", fontWeight: "900" }]}>
                ₹{(revSummary?.platformTodayGross || stats?.totalRevenue || 0).toLocaleString("en-IN")}
              </Text>
            </View>
            <View style={styles.gmvDivider} />
            <View style={styles.gmvStatCol}>
              <Text style={styles.gmvStatLabel}>Total Orders</Text>
              <Text style={styles.gmvStatVal}>{stats?.totalOrdersCount || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>

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
              <ShoppingCart size={20} color="#F59E0B" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalOrdersCount || 0}</Text>
            <Text style={styles.statTitle}>Active Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statBox}
            onPress={() => router.push("/(admin)/users" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
              <Users size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.statNumber}>{stats?.totalUsersCount || 0}</Text>
            <Text style={styles.statTitle}>Platform Users</Text>
          </TouchableOpacity>
        </View>

        {/* Low Stock & Inventory Alerts */}
        {lowStockProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={18} color="#DC2626" />
                <Text style={[styles.sectionTitle, { color: "#DC2626" }]}>
                  Inventory Alerts ({lowStockProducts.length})
                </Text>
              </View>
              <Text style={styles.alertBadge}>Action Required</Text>
            </View>

            {lowStockProducts.map((p: any) => (
              <View key={p.id} style={styles.alertCard}>
                <View style={styles.alertCardTop}>
                  <Image
                    source={p.images?.[0] ? { uri: p.images[0] } : require("../../assets/intri-icon.png")}
                    style={styles.alertProdImg}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.alertProductName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.alertVendorName}>Seller: {p.vendor?.businessName || "Direct Hub"}</Text>
                    <Text style={styles.alertTime}>Ref: {p.unitOfSale}</Text>
                  </View>
                  <View style={[styles.stockBadge, p.stockBoxes === 0 ? styles.stockBadgeOut : styles.stockBadgeLow]}>
                    <Boxes size={11} color={p.stockBoxes === 0 ? "#DC2626" : "#D97706"} />
                    <Text style={[styles.stockBadgeText, p.stockBoxes === 0 ? styles.stockTextOut : styles.stockTextLow]}>
                      {p.stockBoxes === 0 ? "OUT OF STOCK" : `${p.stockBoxes} left`}
                    </Text>
                  </View>
                </View>

                <View style={styles.alertActionRow}>
                  <Text style={styles.alertTime}>Price: ₹{p.pricePerBox || p.pricePerSqft || 0}</Text>
                  {p.vendor?.id ? (
                    <TouchableOpacity
                      style={styles.notifyBtn}
                      onPress={() => handleSendRestockNotice(p)}
                      disabled={notifyingVendorId === p.id}
                    >
                      {notifyingVendorId === p.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Send size={12} color="#FFFFFF" />
                          <Text style={styles.notifyBtnText}>Send Restock Notice</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending Approvals */}
        {pendingVendors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pending Vendor Approvals</Text>
              <TouchableOpacity onPress={() => router.push("/(admin)/vendors" as any)}>
                <Text style={styles.seeAllText}>View All ({pendingVendors.length})</Text>
              </TouchableOpacity>
            </View>

            {pendingVendors.slice(0, 3).map((v: any) => (
              <TouchableOpacity
                key={v.id}
                style={styles.pendingVendorCard}
                onPress={() => router.push(`/(admin)/vendor/${v.id}` as any)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName}>{v.businessName}</Text>
                  <Text style={styles.vendorCategory}>{v.category || "General Materials"} • {v.contactPhone}</Text>
                </View>
                <ChevronRight size={16} color={COLORS.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Orders (Tappable for Full Customer Profile, Location & Vendor Allocations) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>Recent Orders ({recentOrders.length})</Text>
              <Text style={{ fontSize: 11, color: "#64748B" }}>Tap any order for full customer profile & vendor details</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(admin)/orders" as any)}>
              <Text style={styles.seeAllText}>See All Orders</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.map((o: any) => (
            <TouchableOpacity
              key={o.id}
              style={styles.orderCard}
              onPress={() => handleOpenOrderDetail(o)}
              activeOpacity={0.85}
            >
              <View style={styles.orderTop}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.orderId}>#{o.orderNumber || o.id?.slice(-8).toUpperCase()}</Text>
                  <View style={styles.datePill}>
                    <Clock size={10} color="#64748B" />
                    <Text style={styles.datePillText}>{o.formattedDate || new Date(o.createdAt).toLocaleDateString("en-IN")}</Text>
                  </View>
                </View>
                <Text style={styles.orderStatus}>{o.orderStatus?.toUpperCase()}</Text>
              </View>

              <View style={styles.orderBottom}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderCustomer}>
                    {o.customer?.name || o.customerName || "Customer"} {o.customer?.phone ? `• ${o.customer.phone}` : ""}
                  </Text>
                  <Text style={styles.orderAddressPreview} numberOfLines={1}>
                    📍 {o.customer?.address || "Site Delivery"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.orderAmount}>₹{(o.total || 0).toLocaleString("en-IN")}</Text>
                  <Text style={styles.viewAuditLink}>View Details →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 1. RECENT ORDER DRILLDOWN AUDIT MODAL (CUSTOMER PROFILE, LOCATION & VENDORS) */}
      <Modal visible={orderModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.orderModalBox}>
            <View style={styles.orderModalHeader}>
              <View>
                <Text style={styles.orderModalTitle}>
                  Order #{selectedOrder?.orderNumber || selectedOrder?.id?.slice(-8).toUpperCase()}
                </Text>
                <Text style={styles.orderModalSub}>
                  Placed on: {selectedOrder?.formattedDate || new Date(selectedOrder?.createdAt || Date.now()).toLocaleString("en-IN")}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setOrderModalOpen(false)} style={styles.closeBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={{ maxHeight: 480 }} contentContainerStyle={{ gap: 12, paddingVertical: 10 }}>
                {/* Status & Amount Highlight */}
                <View style={styles.orderHighlightCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.highlightLabel}>Total Order Amount</Text>
                    <Text style={styles.highlightAmount}>₹{(selectedOrder.total || 0).toLocaleString("en-IN")}</Text>
                  </View>
                  <View style={styles.orderStatusBadge}>
                    <Text style={styles.orderStatusBadgeText}>{selectedOrder.orderStatus?.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Customer Profile & Delivery Location */}
                <View style={styles.auditSectionBox}>
                  <View style={styles.auditSectionHeader}>
                    <User size={15} color="#2563EB" />
                    <Text style={styles.auditSectionTitle}>Customer Profile & Site Location</Text>
                  </View>

                  <View style={styles.auditDetailRow}>
                    <Text style={styles.auditLabel}>Customer Name:</Text>
                    <Text style={styles.auditVal}>{selectedOrder.customer?.name || "Customer"}</Text>
                  </View>

                  <View style={styles.auditDetailRow}>
                    <Text style={styles.auditLabel}>Contact Phone:</Text>
                    <Text style={[styles.auditVal, { color: "#2563EB", fontWeight: "800" }]}>
                      +91 {selectedOrder.customer?.phone || "N/A"}
                    </Text>
                  </View>

                  {selectedOrder.customer?.email && selectedOrder.customer?.email !== "N/A" ? (
                    <View style={styles.auditDetailRow}>
                      <Text style={styles.auditLabel}>Email Address:</Text>
                      <Text style={styles.auditVal}>{selectedOrder.customer.email}</Text>
                    </View>
                  ) : null}

                  <View style={[styles.auditDetailRow, { alignItems: "flex-start" }]}>
                    <Text style={[styles.auditLabel, { marginTop: 2 }]}>Delivery Address:</Text>
                    <Text style={[styles.auditVal, { flex: 1, textAlign: "right" }]}>
                      {selectedOrder.customer?.address || "Site Address"}
                    </Text>
                  </View>

                  {selectedOrder.customer?.latitude && selectedOrder.customer?.longitude ? (
                    <View style={styles.auditDetailRow}>
                      <Text style={styles.auditLabel}>GPS Coordinates:</Text>
                      <Text style={styles.auditVal}>
                        {selectedOrder.customer.latitude.toFixed(5)}, {selectedOrder.customer.longitude.toFixed(5)}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Allocated Vendors */}
                <View style={styles.auditSectionBox}>
                  <View style={styles.auditSectionHeader}>
                    <Store size={15} color="#16A34A" />
                    <Text style={styles.auditSectionTitle}>
                      Vendor Partner Allocation ({selectedOrder.vendors?.length || 1})
                    </Text>
                  </View>

                  {selectedOrder.vendors?.map((v: any, idx: number) => (
                    <View key={idx} style={styles.vendorAllocCard}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={styles.allocVendorName}>{v.businessName}</Text>
                        <Text style={styles.allocVendorCat}>{v.category}</Text>
                      </View>
                      <Text style={styles.allocVendorPhone}>Phone: +91 {v.contactPhone || "Direct"}</Text>
                      <View style={styles.allocFinanceRow}>
                        <Text style={styles.allocFinanceText}>
                          Vendor Subtotal: <Text style={{ fontWeight: "800", color: "#052A51" }}>₹{(v.subtotal || 0).toLocaleString("en-IN")}</Text>
                        </Text>
                        <Text style={styles.allocFinanceText}>
                          Payout: <Text style={{ fontWeight: "800", color: "#16A34A" }}>₹{(v.vendorPayoutAmount || v.subtotal || 0).toLocaleString("en-IN")}</Text>
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Ordered Items with Image */}
                <View style={styles.auditSectionBox}>
                  <View style={styles.auditSectionHeader}>
                    <Package size={15} color="#D97706" />
                    <Text style={styles.auditSectionTitle}>
                      Ordered Products ({selectedOrder.items?.length || 0})
                    </Text>
                  </View>

                  {selectedOrder.items?.map((it: any) => (
                    <View key={it.id} style={styles.orderItemRow}>
                      <Image
                        source={it.image ? { uri: it.image } : require("../../assets/intri-icon.png")}
                        style={styles.itemThumb}
                        contentFit="cover"
                      />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.itemTitleText}>{it.productName}</Text>
                        <Text style={styles.itemVariantText}>{it.variantDetails}</Text>
                        <Text style={styles.itemVendorText}>Seller: {it.vendorName}</Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.itemQtyText}>x {it.boxQuantity}</Text>
                        <Text style={styles.itemPriceText}>₹{(it.totalPrice || 0).toLocaleString("en-IN")}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.closeOrderModalBtn}
              onPress={() => setOrderModalOpen(false)}
            >
              <Text style={styles.closeOrderModalBtnText}>Close Order Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2. VENDOR REVENUE & COMMISSION ANALYTICS MODAL */}
      <Modal visible={revenueModalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Revenue & Vendor Analytics</Text>
              <Text style={styles.modalSubtitle}>Platform Gross Sales, Today's GMV & Commission Cut</Text>
            </View>
            <TouchableOpacity onPress={() => setRevenueModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Date Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
            {[
              { key: "today", label: "Today" },
              { key: "yesterday", label: "Yesterday" },
              { key: "7days", label: "Last 7 Days" },
              { key: "this_month", label: "This Month" },
              { key: "all", label: "All Time" },
            ].map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[styles.periodChip, revenuePeriod === p.key && styles.periodChipActive]}
                onPress={() => setRevenuePeriod(p.key as any)}
              >
                <Text style={[styles.periodChipText, revenuePeriod === p.key && styles.periodChipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Top Stat Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>
                  {revenuePeriod === "today" ? "Today's Gross Sales" : "Period Gross Sales"}
                </Text>
                <Text style={[styles.summaryVal, { color: "#052A51" }]}>
                  ₹{(revSummary?.platformTodayGross || revSummary?.platformTotalGross || 0).toLocaleString("en-IN")}
                </Text>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" }]}>
                <Text style={[styles.summaryLabel, { color: "#166534" }]}>Our Commission Cut (Hmara Bana)</Text>
                <Text style={[styles.summaryVal, { color: "#15803D" }]}>
                  ₹{(revSummary?.platformTotalCommission || 0).toLocaleString("en-IN")}
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 14, marginBottom: 8 }]}>
              Vendor-wise Sales & Earnings ({revVendors.length})
            </Text>

            {revenueLoading ? (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.accentBlue} />
              </View>
            ) : revVendors.length === 0 ? (
              <View style={styles.centerContainer}>
                <Text style={{ color: "#64748B", fontSize: 13 }}>No vendor sales recorded for this period.</Text>
              </View>
            ) : (
              revVendors.map((v: any) => (
                <TouchableOpacity
                  key={v.vendorId}
                  style={styles.vendorRevCard}
                  onPress={() => {
                    setRevenueModalOpen(false);
                    router.push(`/(admin)/vendor/${v.vendorId}` as any);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={styles.vendorRevHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorRevName}>{v.businessName}</Text>
                      <Text style={styles.vendorRevCategory}>
                        {v.category} • Commission: <Text style={{ fontWeight: "900", color: "#F26522" }}>{v.commissionRate}%</Text>
                      </Text>
                    </View>
                    <View style={styles.vendorOrdersPill}>
                      <Text style={styles.vendorOrdersText}>{v.ordersCount} orders</Text>
                    </View>
                  </View>

                  <View style={styles.vendorRevGrid}>
                    <View style={styles.revGridCol}>
                      <Text style={styles.revGridLabel}>Today's Sales</Text>
                      <Text style={[styles.revGridVal, { color: "#10B981" }]}>
                        ₹{(v.todayRevenue || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>

                    <View style={styles.revGridCol}>
                      <Text style={styles.revGridLabel}>All-Time GMV</Text>
                      <Text style={styles.revGridVal}>₹{(v.totalRevenue || 0).toLocaleString("en-IN")}</Text>
                    </View>

                    <View style={[styles.revGridCol, { backgroundColor: "#EFF6FF", borderRadius: 8, padding: 6 }]}>
                      <Text style={[styles.revGridLabel, { color: "#1E40AF" }]}>Hmara Cut (Earned)</Text>
                      <Text style={[styles.revGridVal, { color: "#1D4ED8", fontWeight: "900" }]}>
                        ₹{(v.ourCommissionCut || 0).toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.vendorRevFooter}>
                    <Text style={styles.netPayoutText}>
                      Net Vendor Payable: <Text style={styles.netPayoutBold}>₹{(v.vendorNetPayout || 0).toLocaleString("en-IN")}</Text>
                    </Text>
                    <Text style={styles.viewStoreLink}>View Store Details →</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
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
    paddingVertical: 30,
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
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F26522",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    alignSelf: "flex-start",
    marginBottom: 4,
    gap: 4,
  },
  adminBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerBrandLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  gmvCard: {
    backgroundColor: COLORS.primaryDark,
    borderRadius: RADIUS.lg,
    padding: 18,
    ...SHADOWS.md,
  },
  tapToViewBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tapToViewText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  gmvLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  gmvAmount: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },
  gmvStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  gmvStatCol: {
    flex: 1,
  },
  gmvDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: 12,
  },
  gmvStatLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
  },
  gmvStatVal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
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
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  statTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
    marginTop: 2,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.text,
  },
  seeAllText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },
  alertBadge: {
    backgroundColor: "#FEE2E2",
    color: "#DC2626",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  alertCard: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: RADIUS.md,
    padding: 12,
    gap: 8,
  },
  alertCardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertProdImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  alertProductName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#991B1B",
  },
  alertVendorName: {
    fontSize: 11,
    color: "#7F1D1D",
    marginTop: 2,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  stockBadgeOut: { backgroundColor: "#FEE2E2" },
  stockBadgeLow: { backgroundColor: "#FEF3C7" },
  stockBadgeText: { fontSize: 10, fontWeight: "800" },
  stockTextOut: { color: "#DC2626" },
  stockTextLow: { color: "#D97706" },
  alertActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(220, 38, 38, 0.1)",
    paddingTop: 6,
  },
  alertTime: {
    fontSize: 10,
    color: "#991B1B",
  },
  notifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  notifyBtnText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  pendingVendorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vendorName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  vendorCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  orderCard: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: 6,
  },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderId: {
    fontSize: 12,
    fontWeight: "900",
    color: "#052A51",
  },
  datePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  datePillText: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600",
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: "800",
    color: "#16A34A",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
    paddingTop: 8,
  },
  orderCustomer: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },
  orderAddressPreview: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    maxWidth: "90%",
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: "900",
    color: "#052A51",
  },
  viewAuditLink: {
    fontSize: 10,
    fontWeight: "800",
    color: "#2563EB",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  orderModalBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    width: "100%",
    maxWidth: 440,
    ...SHADOWS.md,
  },
  orderModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 10,
  },
  orderModalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#052A51",
  },
  orderModalSub: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  orderHighlightCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  highlightLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1E40AF",
  },
  highlightAmount: {
    fontSize: 20,
    fontWeight: "900",
    color: "#1D4ED8",
    marginTop: 2,
  },
  orderStatusBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  orderStatusBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
  auditSectionBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 6,
  },
  auditSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 6,
    marginBottom: 4,
  },
  auditSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  auditDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 2,
  },
  auditLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  auditVal: {
    fontSize: 11,
    fontWeight: "700",
    color: "#052A51",
  },
  vendorAllocCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 2,
    marginBottom: 4,
  },
  allocVendorName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
  },
  allocVendorCat: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "700",
  },
  allocVendorPhone: {
    fontSize: 11,
    color: "#64748B",
  },
  allocFinanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  allocFinanceText: {
    fontSize: 11,
    color: "#64748B",
  },
  orderItemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#F1F5F9",
  },
  itemTitleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  itemVariantText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },
  itemVendorText: {
    fontSize: 10,
    color: "#2563EB",
    fontWeight: "700",
    marginTop: 1,
  },
  itemQtyText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "700",
  },
  itemPriceText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#052A51",
    marginTop: 2,
  },
  closeOrderModalBtn: {
    backgroundColor: "#052A51",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
  },
  closeOrderModalBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  modalSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  periodScroll: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
  },
  periodChipActive: {
    backgroundColor: "#052A51",
  },
  periodChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  periodChipTextActive: {
    color: "#FFFFFF",
  },
  modalContent: {
    padding: 16,
    paddingBottom: 50,
  },
  summaryGrid: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    ...SHADOWS.sm,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B",
  },
  summaryVal: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },
  vendorRevCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
    ...SHADOWS.sm,
    gap: 10,
  },
  vendorRevHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  vendorRevName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  vendorRevCategory: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },
  vendorOrdersPill: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vendorOrdersText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#475569",
  },
  vendorRevGrid: {
    flexDirection: "row",
    gap: 8,
  },
  revGridCol: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 8,
  },
  revGridLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
  },
  revGridVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 2,
  },
  vendorRevFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8,
  },
  netPayoutText: {
    fontSize: 11,
    color: "#64748B",
  },
  netPayoutBold: {
    fontWeight: "800",
    color: "#052A51",
  },
  viewStoreLink: {
    fontSize: 11,
    fontWeight: "800",
    color: "#2563EB",
  },
});
