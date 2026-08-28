import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Truck,
  MapPin,
  Search,
  CheckCircle2,
  Clock,
  User,
  Phone,
  CreditCard,
  ChevronRight,
  Plus,
  Edit2,
  X,
  Navigation,
  ShieldAlert,
  IndianRupee,
  Sliders,
  DollarSign,
  Package,
} from "lucide-react-native";
import {
  fetchAdminOrders,
  updateAdminOrder,
  fetchAdminDeliveries,
  assignAdminCourier,
  updateAdminDeliveryTracking,
  confirmAdminDeliveryCod,
  fetchAdminStoreSettings,
  updateAdminStoreSettings,
} from "../../src/api/admin";
import { AdminOrder } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminOrdersHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Top Segment: "orders" | "deliveries" | "shipping"
  const [activeSection, setActiveSection] = useState<"orders" | "deliveries" | "shipping">("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Courier Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("");
  const [courierPhone, setCourierPhone] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [savingAssign, setSavingAssign] = useState(false);

  // Shipping Rates Form State
  const [freeThreshold, setFreeThreshold] = useState("5000");
  const [standardFee, setStandardFee] = useState("149");
  const [bikeRate, setBikeRate] = useState("49");
  const [fourWheelerRate, setFourWheelerRate] = useState("299");
  const [weightThreshold, setWeightThreshold] = useState("25");
  const [blockedPincodes, setBlockedPincodes] = useState("");
  const [savingRates, setSavingRates] = useState(false);

  // 1. Orders Query
  const {
    data: ordersData,
    isLoading: ordersLoading,
    refetch: refetchOrders,
    isRefetching: ordersRefetching,
  } = useQuery({
    queryKey: ["admin-orders", search, statusFilter],
    queryFn: () =>
      fetchAdminOrders({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  // 2. Deliveries Query
  const {
    data: deliveriesData,
    isLoading: deliveriesLoading,
    refetch: refetchDeliveries,
    isRefetching: deliveriesRefetching,
  } = useQuery({
    queryKey: ["admin-deliveries"],
    queryFn: () => fetchAdminDeliveries(),
  });

  // 3. Settings Query for Shipping Rates
  const {
    data: settingsData,
    isLoading: settingsLoading,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminStoreSettings,
  });

  // Initialize shipping form when settings load
  React.useEffect(() => {
    if (settingsData?.settings) {
      const s = settingsData.settings;
      if (s.freeDeliveryThreshold !== undefined) setFreeThreshold(String(s.freeDeliveryThreshold));
      if (s.standardDeliveryFee !== undefined) setStandardFee(String(s.standardDeliveryFee));
      if (s.bikeDeliveryRate !== undefined) setBikeRate(String(s.bikeDeliveryRate));
      if (s.fourWheelerDeliveryRate !== undefined) setFourWheelerRate(String(s.fourWheelerDeliveryRate));
      if (s.weightThresholdKg !== undefined) setWeightThreshold(String(s.weightThresholdKg));
      if (s.codBlockedPincodes) {
        setBlockedPincodes(
          Array.isArray(s.codBlockedPincodes) ? s.codBlockedPincodes.join(", ") : String(s.codBlockedPincodes)
        );
      }
    }
  }, [settingsData]);

  const orders = ordersData?.orders || [];
  const splits = deliveriesData?.splits || [];

  const handleOpenAssign = (split: any) => {
    setSelectedSplitId(split.id);
    setCourierName(split.courierName || "Intrihub Express Logistics");
    setCourierPhone(split.courierPhone || "9876543210");
    setTrackingNumber(split.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`);
    setAssignModalOpen(true);
  };

  const handleSaveAssign = async () => {
    if (!selectedSplitId) return;
    setSavingAssign(true);
    try {
      await assignAdminCourier(selectedSplitId, {
        courierName: courierName.trim(),
        courierPhone: courierPhone.trim(),
      });

      if (trackingNumber.trim()) {
        await updateAdminDeliveryTracking(selectedSplitId, {
          trackingNumber: trackingNumber.trim(),
          courierName: courierName.trim(),
        });
      }

      setSavingAssign(false);
      setAssignModalOpen(false);
      Alert.alert("Courier Assigned 🎉", "Delivery courier and tracking updated!");
      refetchDeliveries();
    } catch (e: any) {
      setSavingAssign(false);
      Alert.alert("Error", e?.message || "Failed to assign courier");
    }
  };

  const handleConfirmCod = (splitId: string) => {
    Alert.alert("Confirm COD Cash", "Confirm customer COD cash collected in full?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm Collected",
        onPress: async () => {
          try {
            const res = await confirmAdminDeliveryCod(splitId);
            if (res.success) {
              Alert.alert("COD Collected", "Cash collection confirmed.");
              refetchDeliveries();
            } else {
              Alert.alert("Error", res.error || "Failed to confirm COD");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  const handleSaveShippingRates = async () => {
    setSavingRates(true);
    try {
      const res = await updateAdminStoreSettings({
        freeDeliveryThreshold: parseFloat(freeThreshold) || 0,
        standardDeliveryFee: parseFloat(standardFee) || 0,
        bikeDeliveryRate: parseFloat(bikeRate) || 0,
        fourWheelerDeliveryRate: parseFloat(fourWheelerRate) || 0,
        weightThresholdKg: parseFloat(weightThreshold) || 0,
        codBlockedPincodes: blockedPincodes.split(",").map((p) => p.trim()).filter(Boolean),
      });

      setSavingRates(false);
      if (res.success) {
        Alert.alert("Rates Saved 🎉", "Area-wise freight rates and delivery thresholds updated!");
        refetchSettings();
      } else {
        Alert.alert("Error", res.error || "Failed to save settings");
      }
    } catch (e: any) {
      setSavingRates(false);
      Alert.alert("Error", e?.message || "Failed to update rates");
    }
  };

  const renderOrderItem = ({ item }: { item: AdminOrder }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>{item.id}</Text>
          <Text style={styles.dateText}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : ""}</Text>
        </View>
        <View style={[styles.statusBadge, getOrderStatusStyle(item.orderStatus)]}>
          <Text style={styles.statusBadgeText}>{item.orderStatus.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <User size={13} color={COLORS.textSecondary} />
        <Text style={styles.customerName}>{item.customerName || "Customer"}</Text>
        {item.customerPhone ? (
          <Text style={styles.customerPhone}>• +91 {item.customerPhone}</Text>
        ) : null}
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Total Amount</Text>
          <Text style={styles.metricVal}>₹{item.totalAmount?.toLocaleString("en-IN") || "0"}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Payment</Text>
          <Text style={styles.metricVal}>{item.paymentMethod?.toUpperCase() || "COD"}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Pay Status</Text>
          <Text style={[styles.metricVal, { color: item.paymentStatus === "paid" ? "#16A34A" : "#F59E0B" }]}>
            {item.paymentStatus?.toUpperCase() || "PENDING"}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderDeliverySplitItem = ({ item }: { item: any }) => (
    <View style={styles.orderCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>SPLIT #{item.id?.slice(-8)}</Text>
          <Text style={styles.vendorName}>Vendor: {item.vendor?.businessName || "Vendor Partner"}</Text>
        </View>
        <View style={[styles.statusBadge, getOrderStatusStyle(item.status)]}>
          <Text style={styles.statusBadgeText}>{item.status?.toUpperCase() || "PENDING"}</Text>
        </View>
      </View>

      <View style={styles.customerRow}>
        <Truck size={13} color={COLORS.textSecondary} />
        <Text style={styles.customerName}>Courier: {item.courierName || "Unassigned"}</Text>
        {item.trackingNumber ? (
          <Text style={styles.customerPhone}>• {item.trackingNumber}</Text>
        ) : null}
      </View>

      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={styles.assignBtn}
          onPress={() => handleOpenAssign(item)}
          activeOpacity={0.85}
        >
          <Navigation size={13} color="#052A51" />
          <Text style={styles.assignBtnText}>Assign Courier / Tracking</Text>
        </TouchableOpacity>

        {item.paymentMethod === "cod" && item.codStatus !== "collected" && (
          <TouchableOpacity
            style={styles.codBtn}
            onPress={() => handleConfirmCod(item.id)}
            activeOpacity={0.85}
          >
            <DollarSign size={13} color="#16A34A" />
            <Text style={styles.codBtnText}>Confirm COD</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Orders & Logistics Hub</Text>
          <Text style={styles.headerSubtitle}>
            {orders.length} total orders • {splits.length} vendor delivery splits
          </Text>
        </View>
      </View>

      {/* Segment Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "orders" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("orders")}
        >
          <ShoppingCart size={15} color={activeSection === "orders" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "orders" && styles.segmentBtnTextActive]}>
            Orders ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "deliveries" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("deliveries")}
        >
          <Truck size={15} color={activeSection === "deliveries" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "deliveries" && styles.segmentBtnTextActive]}>
            Fleet ({splits.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "shipping" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("shipping")}
        >
          <Sliders size={15} color={activeSection === "shipping" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "shipping" && styles.segmentBtnTextActive]}>
            Rates & Zones
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Header for Orders */}
      {activeSection === "orders" && (
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Search size={18} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search order ID, customer name, phone..."
              placeholderTextColor={COLORS.textTertiary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>
      )}

      {/* Main Content */}
      {activeSection === "orders" ? (
        ordersLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={orders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={ordersRefetching} onRefresh={refetchOrders} tintColor={COLORS.accentBlue} />}
          />
        )
      ) : activeSection === "deliveries" ? (
        deliveriesLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={splits}
            keyExtractor={(item) => item.id}
            renderItem={renderDeliverySplitItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={deliveriesRefetching} onRefresh={refetchDeliveries} tintColor={COLORS.accentBlue} />}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.shippingContent} keyboardShouldPersistTaps="handled">
          <View style={styles.shippingCard}>
            <Text style={styles.sectionHeading}>Area-Wise Freight & Slabs</Text>

            <Text style={styles.inputLabel}>Free Delivery Order Threshold (₹)</Text>
            <TextInput
              style={styles.inputBox}
              value={freeThreshold}
              onChangeText={setFreeThreshold}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Standard Local Delivery Fee (₹)</Text>
            <TextInput
              style={styles.inputBox}
              value={standardFee}
              onChangeText={setStandardFee}
              keyboardType="decimal-pad"
            />

            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>2-Wheeler / Bike Rate (₹)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={bikeRate}
                  onChangeText={setBikeRate}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>4-Wheeler / Truck Rate (₹)</Text>
                <TextInput
                  style={styles.inputBox}
                  value={fourWheelerRate}
                  onChangeText={setFourWheelerRate}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Heavy Cargo Weight Threshold (KG)</Text>
            <TextInput
              style={styles.inputBox}
              value={weightThreshold}
              onChangeText={setWeightThreshold}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.inputLabel, { marginTop: 12 }]}>Blocked Delivery Pincodes (Comma separated)</Text>
            <TextInput
              style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
              multiline
              value={blockedPincodes}
              onChangeText={setBlockedPincodes}
              placeholder="e.g. 560001, 560099, 110001"
            />

            <TouchableOpacity
              style={styles.saveRatesBtn}
              onPress={handleSaveShippingRates}
              disabled={savingRates}
            >
              {savingRates ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveRatesBtnText}>Save Shipping Rates & Rules</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Courier Assignment Modal */}
      <Modal
        visible={assignModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAssignModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Delivery Courier</Text>
            <TouchableOpacity onPress={() => setAssignModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Courier Company / Rider Name</Text>
              <TextInput
                style={styles.inputBox}
                value={courierName}
                onChangeText={setCourierName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Rider Contact Phone (10 Digits)</Text>
              <TextInput
                style={styles.inputBox}
                value={courierPhone}
                onChangeText={setCourierPhone}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Tracking AWB / Tracking ID</Text>
              <TextInput
                style={styles.inputBox}
                value={trackingNumber}
                onChangeText={setTrackingNumber}
              />
            </View>

            <TouchableOpacity
              style={styles.saveAssignBtn}
              onPress={handleSaveAssign}
              disabled={savingAssign}
            >
              {savingAssign ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Navigation size={18} color="#FFFFFF" />
                  <Text style={styles.saveAssignBtnText}>Confirm Courier Assignment</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function getOrderStatusStyle(status?: string) {
  switch (status) {
    case "delivered":
      return { backgroundColor: "rgba(22, 163, 74, 0.15)" };
    case "processing":
    case "dispatched":
      return { backgroundColor: "rgba(37, 99, 235, 0.15)" };
    case "pending":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)" };
    case "cancelled":
      return { backgroundColor: "rgba(239, 68, 68, 0.15)" };
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#052A51",
    fontWeight: "800",
  },
  filterSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  orderId: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  vendorName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  customerName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  customerPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  metricVal: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: "60%",
    backgroundColor: COLORS.border,
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  assignBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  assignBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
  },
  codBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  codBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A",
  },
  shippingContent: {
    padding: 16,
    gap: 16,
  },
  shippingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  twoCol: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  saveRatesBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
  },
  saveRatesBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
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
    fontSize: 17,
    fontWeight: "800",
    color: "#052A51",
  },
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  saveAssignBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveAssignBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
