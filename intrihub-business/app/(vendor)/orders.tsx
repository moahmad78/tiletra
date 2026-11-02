import { useState, useEffect } from "react";
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
  Zap,
} from "lucide-react-native";
import {
  fetchVendorOrders,
  updateVendorOrderStatus,
  fetchVendorProfile,
  updateVendorProfile,
} from "../../src/api/vendor";
import { VendorOrderSplit } from "../../src/types";
import { COURIER_PARTNERS } from "../../src/constants/logistics";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { printOrderInvoice } from "../../src/utils/invoicePrinter";
import { useTranslation } from "../../src/store/i18nStore";
import { socketService } from "../../src/store/socketStore";
import RotatingOrderItemImage from "../../src/components/RotatingOrderItemImage";

const STATUS_OPTIONS = [
  { label: "Confirmed", value: "confirmed" },
  { label: "Ready for Pickup", value: "ready_for_pickup" },
  { label: "Dispatched", value: "dispatched" },
  { label: "Delivered", value: "delivered" },
];

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
  const { t } = useTranslation();
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

  // Real-time Socket.IO auto-refetch for live order sync
  useEffect(() => {
    const unsubStatus = socketService.subscribe("order-status-updated", () => {
      refetch();
    });
    const unsubNew = socketService.subscribe("new-order", () => {
      refetch();
    });
    return () => {
      unsubStatus();
      unsubNew();
    };
  }, [refetch]);

  const { data: profileData } = useQuery({
    queryKey: ["vendor-profile"],
    queryFn: () => fetchVendorProfile(),
  });

  const isVendorAutoAccept = profileData?.vendor?.autoAcceptOrders === true;
  const [isTogglingAutoAccept, setIsTogglingAutoAccept] = useState(false);

  const handleToggleAutoAccept = async () => {
    const nextVal = !isVendorAutoAccept;
    setIsTogglingAutoAccept(true);
    try {
      const res = await updateVendorProfile({ autoAcceptOrders: nextVal });
      if (res?.success) {
        queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
        Alert.alert(
          "Auto-Accept Updated",
          `Incoming orders will now be ${nextVal ? "automatically accepted (Confirmed)" : "manually reviewed (Pending)"}.`
        );
      } else {
        Alert.alert("Error", res?.error || "Failed to update auto-accept settings");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update settings");
    } finally {
      setIsTogglingAutoAccept(false);
    }
  };

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

  const handleSelectStatus = (opt: { label: string; value: string }) => {
    setNewStatus(opt.value);
    if (opt.value === "dispatched") {
      return; // Dispatched requires courier & tracking details
    }
    if (selectedSplit && opt.value !== selectedSplit.fulfillmentStatus) {
      Alert.alert(
        "Update Order Status",
        `Change Order #${selectedSplit.orderId} to "${opt.label}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Update Now",
            onPress: () => {
              updateStatusMutation.mutate({
                splitId: selectedSplit.splitId,
                status: opt.value,
              });
            },
          },
        ]
      );
    }
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
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.orderId} numberOfLines={1}>Order #{item.orderId}</Text>
            <Text style={styles.customerName} numberOfLines={1}>{item.customerName}</Text>
            {getCleanPhone(item.customerPhone) ? (
              <Text style={styles.customerPhone} numberOfLines={1}>
                Phone: +91 {getCleanPhone(item.customerPhone).slice(0, 5)} {getCleanPhone(item.customerPhone).slice(5)}
              </Text>
            ) : null}
          </View>
          {(() => {
            const statusInfo = getFulfillmentStatusInfo(item.fulfillmentStatus);
            return (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: statusInfo.bg,
                    borderColor: statusInfo.border,
                  },
                ]}
              >
                <Text style={[styles.statusBadgeText, { color: statusInfo.textColor }]} numberOfLines={1}>
                  {statusInfo.label}
                </Text>
              </View>
            );
          })()}
        </View>

        <View style={styles.detailsRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
            <RotatingOrderItemImage
              images={
                item.images && item.images.length > 0
                  ? item.images
                  : item.items
                  ? item.items.flatMap((it: any) => it.images || (it.image ? [it.image] : []))
                  : []
              }
              fallbackImage={item.items?.[0]?.image}
              size={42}
              borderRadius={8}
            />
            <Text style={styles.itemsCountText}>{item.itemsCount} material item(s)</Text>
          </View>
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
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.headerTitle}>{t("vendor.orders") || "Warehouse Orders"}</Text>
          <Text style={styles.headerSubtitle}>{orders.length} order fulfillment tasks</Text>
        </View>

        {/* Quick Auto-Accept Toggle Button */}
        <TouchableOpacity
          onPress={handleToggleAutoAccept}
          disabled={isTogglingAutoAccept}
          activeOpacity={0.8}
          style={[
            styles.autoAcceptPill,
            isVendorAutoAccept ? styles.autoAcceptPillActive : styles.autoAcceptPillInactive,
          ]}
        >
          {isTogglingAutoAccept ? (
            <ActivityIndicator size="small" color={isVendorAutoAccept ? "#166534" : "#FFFFFF"} />
          ) : (
            <>
              <Zap
                size={13}
                color={isVendorAutoAccept ? "#166534" : "#FFFFFF"}
                fill={isVendorAutoAccept ? "#166534" : "none"}
              />
              <Text
                style={[
                  styles.autoAcceptPillText,
                  isVendorAutoAccept ? styles.autoAcceptPillTextActive : styles.autoAcceptPillTextInactive,
                ]}
              >
                Auto: {isVendorAutoAccept ? "ON" : "OFF"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.tabsWrapper}>
        {["all", "pending", "confirmed", "ready", "dispatched", "delivered"].map((tab) => (
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Update Fulfillment Status</Text>
                  {selectedSplit ? (
                    <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                      Order #{selectedSplit.orderId} (Current: {(selectedSplit.fulfillmentStatus || "").toUpperCase().replace(/_/g, " ")})
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <X size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Select Status (Tap to Change)</Text>
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.statusOptionBtn,
                      newStatus === opt.value && styles.statusOptionBtnActive,
                    ]}
                    onPress={() => handleSelectStatus(opt)}
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
                style={[
                  styles.modalSaveBtn,
                  updateStatusMutation.isPending && { opacity: 0.7 },
                ]}
                onPress={handleSaveStatus}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalSaveBtnText}>
                    {newStatus === "dispatched"
                      ? "Confirm & Dispatch Order"
                      : newStatus === selectedSplit?.fulfillmentStatus
                      ? `Order is ${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus}`
                      : `Save as "${STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus}"`}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  autoAcceptPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
    borderWidth: 1,
  },
  autoAcceptPillActive: {
    backgroundColor: "#DCFCE7",
    borderColor: "#86EFAC",
  },
  autoAcceptPillInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  autoAcceptPillText: {
    fontSize: 11,
    fontWeight: "800",
  },
  autoAcceptPillTextActive: {
    color: "#166534",
  },
  autoAcceptPillTextInactive: {
    color: "#FFFFFF",
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
    paddingBottom: 20,
    maxHeight: "88%",
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
    gap: 8,
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 6,
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
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    flexShrink: 0,
    alignSelf: "center",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
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
