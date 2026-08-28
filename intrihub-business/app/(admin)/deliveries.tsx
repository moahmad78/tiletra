import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Truck,
  PackageCheck,
  MapPin,
  Phone,
  CheckCircle2,
  Clock,
  ExternalLink,
  Store,
  Calendar,
  AlertCircle,
  Check,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  User,
  Navigation,
} from "lucide-react-native";
import {
  fetchAdminDeliveries,
  updateAdminDelivery,
  assignAdminCourier,
  confirmAdminDeliveryCod,
} from "../../src/api/admin";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

const TABS = [
  { key: "all", label: "All" },
  { key: "ready", label: "Ready" },
  { key: "transit", label: "In Transit" },
  { key: "out", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "cod_pending", label: "COD Pending" },
];

const COURIER_PRESETS = [
  "Intrihub Express Fleet",
  "Porter (Truck / 3-Wheeler)",
  "Delhivery Heavy Cargo",
  "BlueDart Surface",
  "Shadowfax Local",
  "Local Tempo / Driver",
];

export default function AdminDeliveriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    all: 0,
    ready: 0,
    transit: 0,
    delivered: 0,
    codPending: 0,
  });

  // Action Modal (Assign Courier & Status Update)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSplit, setSelectedSplit] = useState<any | null>(null);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [targetStatus, setTargetStatus] = useState("picked_up");
  const [paymentCollected, setPaymentCollected] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminDeliveries({
        status: activeTab,
        search: searchQuery,
      });
      if (res.success && res.deliveries) {
        setDeliveries(res.deliveries);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      console.error("Error fetching deliveries:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenActionModal = (split: any) => {
    setSelectedSplit(split);
    setCourierName(split.courierName || "");
    setTrackingNumber(split.trackingNumber || "");
    setTargetStatus(split.fulfillmentStatus || "picked_up");
    setPaymentCollected(Boolean(split.paymentCollected));
    setModalVisible(true);
  };

  const handleSaveDelivery = async () => {
    if (!selectedSplit) return;
    setActionLoading(true);
    try {
      const res = await updateAdminDelivery(selectedSplit.id, {
        fulfillmentStatus: targetStatus,
        courierName: courierName.trim() || undefined,
        trackingNumber: trackingNumber.trim() || undefined,
        paymentCollected,
      });

      if (res.success) {
        setModalVisible(false);
        Alert.alert("Success", res.message || "Delivery updated!");
        loadData();
      } else {
        Alert.alert("Update Failed", res.error || "Could not update delivery status.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickCodConfirm = async (splitId: string) => {
    try {
      const res = await confirmAdminDeliveryCod(splitId, { paymentCollected: true });
      if (res.success) {
        Alert.alert("COD Confirmed", "Cash payment collection has been recorded!");
        loadData();
      } else {
        Alert.alert("Failed", res.error || "Could not confirm COD.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const openPhone = (phone: string) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone.replace(/\D/g, "")}`).catch(() => {});
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    switch (s) {
      case "ready_for_pickup":
        return { label: "Ready for Pickup", bg: "#EFF6FF", text: "#2563EB" };
      case "picked_up":
        return { label: "Picked Up", bg: "#FEF3C7", text: "#D97706" };
      case "dispatched":
        return { label: "In Transit", bg: "#FFF7ED", text: "#EA580C" };
      case "out_for_delivery":
        return { label: "Out for Delivery", bg: "#F3E8FF", text: "#7E22CE" };
      case "delivered":
        return { label: "Delivered", bg: "#ECFDF5", text: "#059669" };
      case "cancelled":
        return { label: "Cancelled", bg: "#FEF2F2", text: "#DC2626" };
      default:
        return { label: status || "Processing", bg: "#F1F5F9", text: "#64748B" };
    }
  };

  const renderDeliveryCard = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.fulfillmentStatus);
    const parent = item.parentOrder;
    const isCod = parent?.paymentMethod === "COD";

    return (
      <View style={styles.card}>
        {/* Card Header: Order ID & Subtotal */}
        <View style={styles.cardHeader}>
          <View style={styles.orderIdBox}>
            <Truck size={16} color="#052A51" />
            <Text style={styles.orderIdText}>Order #{item.orderId?.slice(-8).toUpperCase()}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Pickup & Drop Details */}
        <View style={styles.locationsBox}>
          {/* Pickup from Vendor */}
          <View style={styles.locRow}>
            <View style={[styles.locIconCircle, { backgroundColor: "#FFF7ED" }]}>
              <Store size={14} color="#EA580C" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>PICKUP FROM SELLER</Text>
              <Text style={styles.locName} numberOfLines={1}>
                {item.vendor?.businessName || "Vendor"}
              </Text>
              {item.vendor?.businessAddress ? (
                <Text style={styles.locSub} numberOfLines={1}>
                  {item.vendor.businessAddress}
                </Text>
              ) : null}
            </View>
            {item.vendor?.contactPhone ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => openPhone(item.vendor.contactPhone)}
              >
                <Phone size={13} color="#052A51" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Delivery to Customer */}
          <View style={styles.locRow}>
            <View style={[styles.locIconCircle, { backgroundColor: "#EFF6FF" }]}>
              <User size={14} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locLabel}>DELIVER TO CUSTOMER</Text>
              <Text style={styles.locName} numberOfLines={1}>
                {parent?.customerName || "Customer"}
              </Text>
              {parent?.shippingAddress ? (
                <Text style={styles.locSub} numberOfLines={1}>
                  {parent.shippingAddress}
                </Text>
              ) : null}
            </View>
            {parent?.customerPhone ? (
              <TouchableOpacity
                style={styles.callBtn}
                onPress={() => openPhone(parent.customerPhone)}
              >
                <Phone size={13} color="#052A51" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Commercial & Courier Info */}
        <View style={styles.metaRow}>
          <View>
            <Text style={styles.metaLabel}>Split Amount</Text>
            <Text style={styles.metaVal}>₹{item.subtotal?.toLocaleString("en-IN") || 0}</Text>
          </View>

          {isCod ? (
            <View>
              <Text style={styles.metaLabel}>COD Cash Status</Text>
              <Text
                style={[
                  styles.metaVal,
                  { color: item.paymentCollected ? "#059669" : "#EA580C" },
                ]}
              >
                {item.paymentCollected ? "✅ Cash Collected" : "⚠️ Cash Pending"}
              </Text>
            </View>
          ) : (
            <View>
              <Text style={styles.metaLabel}>Payment</Text>
              <Text style={[styles.metaVal, { color: "#059669" }]}>Prepaid Online</Text>
            </View>
          )}

          {item.courierName ? (
            <View>
              <Text style={styles.metaLabel}>Courier Fleet</Text>
              <Text style={styles.metaVal} numberOfLines={1}>{item.courierName}</Text>
            </View>
          ) : null}
        </View>

        {/* Action Bar */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => handleOpenActionModal(item)}
          >
            <Truck size={14} color="#FFFFFF" />
            <Text style={styles.actionBtnPrimaryText}>Assign Courier / Status</Text>
          </TouchableOpacity>

          {isCod && !item.paymentCollected && (
            <TouchableOpacity
              style={styles.actionBtnCod}
              onPress={() => handleQuickCodConfirm(item.id)}
            >
              <CheckCircle2 size={14} color="#059669" />
              <Text style={styles.actionBtnCodText}>Collect COD</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Centralized Logistics</Text>
          <Text style={styles.headerSub}>Fleet dispatch & COD cash reconciliation</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{counts.all}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Order ID, vendor, customer, courier..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => item.id}
          renderItem={renderDeliveryCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Truck size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Deliveries Found</Text>
              <Text style={styles.emptySubtitle}>There are no platform delivery splits under this filter.</Text>
            </View>
          }
        />
      )}

      {/* Assign Courier & Status Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        {selectedSplit && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Update Delivery Dispatch</Text>
                <Text style={styles.modalSub}>Order #{selectedSplit.orderId?.slice(-8).toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Status Selector */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Fulfillment Status</Text>
                <View style={styles.statusChipsGrid}>
                  {[
                    { key: "ready_for_pickup", label: "Ready for Pickup" },
                    { key: "picked_up", label: "Picked Up" },
                    { key: "dispatched", label: "In Transit" },
                    { key: "out_for_delivery", label: "Out for Delivery" },
                    { key: "delivered", label: "Delivered" },
                  ].map((st) => {
                    const isSel = targetStatus === st.key;
                    return (
                      <TouchableOpacity
                        key={st.key}
                        style={[styles.statusChipBtn, isSel && styles.statusChipBtnActive]}
                        onPress={() => setTargetStatus(st.key)}
                      >
                        <Text style={[styles.statusChipBtnText, isSel && styles.statusChipBtnTextActive]}>
                          {st.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Courier Partner Selection */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Assign Courier / Rider</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="Enter courier name or driver name..."
                  placeholderTextColor={COLORS.textTertiary}
                  value={courierName}
                  onChangeText={setCourierName}
                />

                <Text style={[styles.subLabel, { marginTop: 10 }]}>Quick Courier Presets:</Text>
                <View style={styles.presetChips}>
                  {COURIER_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset}
                      style={styles.presetChip}
                      onPress={() => setCourierName(preset)}
                    >
                      <Text style={styles.presetChipText}>{preset}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tracking Code */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Tracking / Docket Number</Text>
                <TextInput
                  style={styles.inputBox}
                  placeholder="e.g. TRK987654321IN or Driver Mobile No."
                  placeholderTextColor={COLORS.textTertiary}
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                />
              </View>

              {/* COD Payment Toggle */}
              {selectedSplit.parentOrder?.paymentMethod === "COD" && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>COD Cash Collection</Text>
                  <TouchableOpacity
                    style={[
                      styles.codToggleBtn,
                      paymentCollected && { backgroundColor: "#ECFDF5", borderColor: "#10B981" },
                    ]}
                    onPress={() => setPaymentCollected(!paymentCollected)}
                  >
                    <CheckCircle2
                      size={20}
                      color={paymentCollected ? "#10B981" : COLORS.textTertiary}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.codToggleTitle}>
                        {paymentCollected ? "Cash Collected from Customer" : "Cash Pending Collection"}
                      </Text>
                      <Text style={styles.codToggleSub}>
                        Total Cash Due: ₹{selectedSplit.subtotal?.toLocaleString("en-IN")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveDelivery}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <ShieldCheck size={18} color="#FFFFFF" />
                    <Text style={styles.saveBtnText}>Save Logistics Updates</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  badgeCount: {
    backgroundColor: "#F26522",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  tabButtonActive: {
    backgroundColor: "#052A51",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderIdBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orderIdText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  locationsBox: {
    gap: 10,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  locLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  locName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  locSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  callBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: "600",
  },
  metaVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: "#052A51",
    height: 42,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  actionBtnCod: {
    paddingHorizontal: 14,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnCodText: {
    color: "#059669",
    fontSize: 13,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#052A51",
  },
  modalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accentBlue,
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusChipsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusChipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusChipBtnActive: {
    backgroundColor: "#052A51",
    borderColor: "#052A51",
  },
  statusChipBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  statusChipBtnTextActive: {
    color: "#FFFFFF",
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: COLORS.text,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  presetChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  presetChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#052A51",
  },
  codToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
  },
  codToggleTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  codToggleSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  saveBtn: {
    backgroundColor: "#052A51",
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
