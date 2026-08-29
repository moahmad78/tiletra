import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  ChevronRight,
  Phone,
  Package,
  X,
  Printer,
} from "lucide-react-native";
import { fetchVendorOrders, updateVendorOrderStatus } from "../../src/api/vendor";
import { VendorOrderSplit } from "../../src/types";
import { COURIER_PARTNERS } from "../../src/constants/logistics";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { printOrderInvoice } from "../../src/utils/invoicePrinter";

const getCleanPhone = (phone?: string | null) => {
  if (!phone) return "";
  const str = String(phone).trim();
  const lower = str.toLowerCase();
  if (
    lower.startsWith("email_") ||
    lower.startsWith("google_") ||
    lower.includes("email") ||
    lower.includes("@") ||
    /[a-zA-Z_]/.test(str)
  ) {
    return "";
  }
  const digits = str.replace(/\D/g, "");
  if (digits.length < 7) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export default function VendorOrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSplit, setSelectedSplit] = useState<VendorOrderSplit | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newStatus, setNewStatus] = useState("confirmed");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["vendor-orders", statusFilter],
    queryFn: () => fetchVendorOrders(statusFilter),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ splitId, status, extra }: any) =>
      updateVendorOrderStatus(splitId, status, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      setModalVisible(false);
      Alert.alert("Status Updated", "Order fulfillment status updated successfully");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update order status");
    },
  });

  const orders = data?.orders || [];

  const handleOpenStatusModal = (order: VendorOrderSplit) => {
    setSelectedSplit(order);
    setNewStatus(order.fulfillmentStatus);
    setTrackingNumber(order.trackingNumber || "");
    setCourierName(order.courierName || "");
    setModalVisible(true);
  };

  const handleSaveStatus = () => {
    if (!selectedSplit) return;
    updateStatusMutation.mutate({
      splitId: selectedSplit.splitId,
      status: newStatus,
      extra: {
        trackingNumber: trackingNumber.trim() || undefined,
        courierName: courierName.trim() || undefined,
      },
    });
  };

  const renderOrderItem = ({ item }: { item: VendorOrderSplit }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.orderId}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
            {getCleanPhone(item.customerPhone) ? (
              <Text style={styles.customerPhone}>Phone: +91 {getCleanPhone(item.customerPhone)}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.fulfillmentStatus)]}>
            <Text style={styles.statusBadgeText}>
              {item.fulfillmentStatus.replace(/_/g, " ").toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <Text style={styles.itemsCountText}>{item.itemsCount} material item(s)</Text>
          <View style={styles.payoutContainer}>
            <Text style={styles.payoutLabel}>Your Payout:</Text>
            <Text style={styles.payoutValue}>₹{item.vendorPayoutAmount?.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {item.trackingNumber ? (
          <View style={styles.trackingInfo}>
            <Truck size={14} color={COLORS.accentBlue} />
            <Text style={styles.trackingText}>
              {item.courierName || "Courier"}: {item.trackingNumber}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.viewDetailBtn}
            onPress={() =>
              router.push({
                pathname: "/(vendor)/order/[id]",
                params: { id: item.splitId },
              } as any)
            }
          >
            <Text style={styles.viewDetailBtnText}>Order Details</Text>
            <ChevronRight size={14} color={COLORS.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ padding: 8, backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FFEDD5", borderRadius: 8, justifyContent: "center", alignItems: "center" }}
            onPress={() => printOrderInvoice(item)}
          >
            <Printer size={16} color="#EA580C" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.updateStatusBtn}
            onPress={() => handleOpenStatusModal(item)}
          >
            <Text style={styles.updateStatusBtnText}>Update Status</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Warehouse Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} order fulfillment tasks</Text>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsWrapper}>
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

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentOrange} />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.splitId}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentOrange} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <ShoppingCart size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No orders in this category</Text>
            </View>
          }
        />
      )}

      {/* Update Fulfillment Status Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Fulfillment Status</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Status</Text>
            <View style={styles.statusOptions}>
              {[
                { label: "Confirmed", value: "confirmed" },
                { label: "Ready for Pickup", value: "ready_for_pickup" },
                { label: "Dispatched", value: "dispatched" },
                { label: "Delivered", value: "delivered" },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.statusOptionBtn,
                    newStatus === opt.value && styles.statusOptionBtnActive,
                  ]}
                  onPress={() => setNewStatus(opt.value)}
                >
                  <Text
                    style={[
                      styles.statusOptionText,
                      newStatus === opt.value && styles.statusOptionTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {newStatus === "dispatched" ? (
              <View style={styles.dispatchFields}>
                <Text style={styles.label}>Select Courier / Transport Partner *</Text>
                
                {/* Selectable Courier Partners Grid */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.courierScroll}>
                  <View style={styles.courierChipsRow}>
                    {COURIER_PARTNERS.map((cp) => {
                      const isSelected = courierName.toLowerCase() === cp.name.toLowerCase() || courierName.toLowerCase().startsWith(cp.name.toLowerCase().split(" ")[0]);
                      return (
                        <TouchableOpacity
                          key={cp.id}
                          style={[
                            styles.courierChip,
                            isSelected && styles.courierChipSelected,
                          ]}
                          onPress={() => setCourierName(cp.name)}
                          activeOpacity={0.8}
                        >
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Truck size={13} color={isSelected ? "#FFFFFF" : cp.badgeColor} />
                            <Text
                              style={[
                                styles.courierChipText,
                                isSelected && styles.courierChipTextSelected,
                              ]}
                            >
                              {cp.name}
                            </Text>
                          </View>
                          {cp.tag ? (
                            <View
                              style={[
                                styles.courierTagBadge,
                                { backgroundColor: isSelected ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.05)" },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.courierTagText,
                                  isSelected && { color: "#FFFFFF" },
                                ]}
                              >
                                {cp.tag}
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <Text style={[styles.label, { marginTop: 10 }]}>Courier / Transport Name (Customizable)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. VRL Logistics, Delhivery, Own Truck"
                  placeholderTextColor="#94A3B8"
                  value={courierName}
                  onChangeText={setCourierName}
                />

                <Text style={styles.label}>Tracking / LR / Bilty Number</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. VRL-98726354 / KA-01-AB-1234"
                  placeholderTextColor="#94A3B8"
                  value={trackingNumber}
                  onChangeText={setTrackingNumber}
                />
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleSaveStatus}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Save Status Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "confirmed":
      return { backgroundColor: "rgba(37, 99, 235, 0.12)" };
    case "ready_for_pickup":
    case "dispatched":
      return { backgroundColor: "rgba(245, 158, 11, 0.12)" };
    case "delivered":
      return { backgroundColor: "rgba(16, 185, 129, 0.12)" };
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
    backgroundColor: COLORS.primary,
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
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontSize: 11,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
  },
  orderId: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 2,
    fontWeight: "600",
  },
  customerPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
  },
  itemsCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  payoutContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  payoutLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  payoutValue: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  trackingInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(37, 99, 235, 0.06)",
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
    gap: 6,
  },
  trackingText: {
    fontSize: 11,
    color: COLORS.accentBlue,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SPACING.sm,
    marginTop: 2,
  },
  viewDetailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  viewDetailBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  updateStatusBtn: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  updateStatusBtnText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: SPACING.sm,
  },
  statusOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: SPACING.md,
  },
  statusOptionBtn: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusOptionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  statusOptionTextActive: {
    color: "#fff",
  },
  dispatchFields: {
    marginBottom: SPACING.md,
  },
  courierScroll: {
    marginVertical: 6,
  },
  courierChipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  courierChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  courierChipSelected: {
    backgroundColor: "#052A51",
    borderColor: "#052A51",
  },
  courierChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  courierChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  courierTagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  courierTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
  },
  modalInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  modalSaveBtn: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  modalSaveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
