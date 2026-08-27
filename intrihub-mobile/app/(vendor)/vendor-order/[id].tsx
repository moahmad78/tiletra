import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  IndianRupee,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";
import { fetchVendorOrders, updateVendorOrderStatus } from "../../../src/api/vendor";
import { VendorOrderSplit } from "../../../src/types";
import { formatCurrency, formatDate } from "../../../src/utils/formatters";

export default function VendorOrderDetailScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: () => fetchVendorOrders(),
  });

  const orderSplit = data?.orders?.find((o) => o.id === id) as VendorOrderSplit | undefined;

  const mutation = useMutation({
    mutationFn: ({
      status,
      extra,
    }: {
      status: string;
      extra?: { courierName?: string; trackingNumber?: string; paymentCollected?: boolean };
    }) => updateVendorOrderStatus(id!, status, extra),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
        queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
        queryClient.invalidateQueries({ queryKey: ["vendor-earnings"] });
        setDispatchModalVisible(false);
        Alert.alert("Status Updated", res.message || "Order status has been updated successfully!");
      } else {
        Alert.alert("Error", res.error || "Failed to update order status");
      }
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to update order status");
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </SafeAreaView>
    );
  }

  if (!orderSplit) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <AlertCircle size={36} color={COLORS.accentRed} />
        <Text style={styles.errorTitle}>Order Split Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Back to Orders</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const parent = orderSplit.parentOrder;
  const status = orderSplit.fulfillmentStatus;
  const isDelivered = status === "delivered";
  const isDispatched = status === "dispatched";
  const isProcessing = status === "processing";
  const isConfirmed = status === "confirmed";

  const handleCallCustomer = () => {
    if (parent?.customerPhone) {
      Linking.openURL(`tel:${parent.customerPhone}`);
    }
  };

  const handleDispatchSubmit = () => {
    if (!courierName.trim()) {
      Alert.alert("Courier Required", "Please enter the courier / transporter name (e.g. Delhivery, VRL, Self Vehicle)");
      return;
    }
    mutation.mutate({
      status: "dispatched",
      extra: {
        courierName: courierName.trim(),
        trackingNumber: trackingNumber.trim() || undefined,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{orderSplit.id.slice(-6).toUpperCase()}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Tracker Card */}
        <View style={styles.statusTrackerCard}>
          <View style={styles.trackerHeader}>
            <Text style={styles.trackerTitle}>Current Fulfillment Status</Text>
            <View
              style={[
                styles.statusBadge,
                isDelivered ? styles.badgeDelivered : isDispatched ? styles.badgeDispatched : styles.badgeProcessing,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isDelivered ? styles.statusTextDelivered : isDispatched ? styles.statusTextDispatched : styles.statusTextProcessing,
                ]}
              >
                {status.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.orderDateText}>Placed on {formatDate(orderSplit.createdAt)}</Text>

          {/* Workflow Action Buttons */}
          <View style={styles.workflowBtnsCol}>
            {isConfirmed && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnOrange]}
                onPress={() => mutation.mutate({ status: "processing" })}
                disabled={mutation.isPending}
              >
                <Clock size={16} color={COLORS.textWhite} />
                <Text style={styles.actionBtnText}>Start Packing & Processing</Text>
              </TouchableOpacity>
            )}

            {(isProcessing || isConfirmed) && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnBlue]}
                onPress={() => setDispatchModalVisible(true)}
                disabled={mutation.isPending}
              >
                <Truck size={16} color={COLORS.textWhite} />
                <Text style={styles.actionBtnText}>Dispatch Shipment</Text>
              </TouchableOpacity>
            )}

            {isDispatched && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnGreen]}
                onPress={() =>
                  Alert.alert("Confirm Delivery", "Mark this order as successfully delivered to the customer?", [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Mark Delivered",
                      onPress: () =>
                        mutation.mutate({
                          status: "delivered",
                          extra: { paymentCollected: true },
                        }),
                    },
                  ])
                }
                disabled={mutation.isPending}
              >
                <CheckCircle2 size={16} color={COLORS.textWhite} />
                <Text style={styles.actionBtnText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}

            {isDelivered && (
              <View style={styles.deliveredBanner}>
                <CheckCircle2 size={18} color={COLORS.accentGreen} />
                <Text style={styles.deliveredBannerText}>
                  Order Delivered! Payout of {formatCurrency(orderSplit.vendorPayoutAmount)} is queued for weekly settlement.
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Customer & Delivery Site</Text>

          <View style={styles.customerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.customerName}>{parent?.customerName || "Customer"}</Text>
              <Text style={styles.customerPhoneText}>{parent?.customerPhone || "No phone provided"}</Text>
            </View>

            {parent?.customerPhone && (
              <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
                <Phone size={14} color={COLORS.textWhite} />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            )}
          </View>

          {parent?.shippingAddress && (
            <View style={styles.addressBox}>
              <MapPin size={14} color={COLORS.textMuted} style={{ marginTop: 2 }} />
              <Text style={styles.addressText}>
                {parent.shippingAddress.street}, {parent.shippingAddress.city},{" "}
                {parent.shippingAddress.state} - {parent.shippingAddress.pincode}
              </Text>
            </View>
          )}
        </View>

        {/* Line Items */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>
            Order Items ({parent?.items?.length || 0})
          </Text>

          {(parent?.items || []).map((item, idx) => (
            <View key={item.id || idx} style={styles.itemRow}>
              <View style={styles.itemThumb}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemThumbImg} contentFit="cover" />
                ) : (
                  <Package size={20} color={COLORS.textMuted} />
                )}
              </View>

              <View style={styles.itemDetailsCol}>
                <Text style={styles.itemName}>{item.productName || (item as any).name}</Text>
                <Text style={styles.itemQty}>Quantity: {item.boxQuantity || (item as any).quantity} units / boxes</Text>
              </View>

              <Text style={styles.itemPrice}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Payout & Financial Breakdown */}
        <View style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>Payout Breakdown</Text>

          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>Items Subtotal</Text>
            <Text style={styles.financialValue}>{formatCurrency(orderSplit.subtotal)}</Text>
          </View>

          <View style={styles.financialRow}>
            <Text style={styles.financialLabel}>
              Platform Commission ({orderSplit.commissionRate || 15}%)
            </Text>
            <Text style={[styles.financialValue, { color: COLORS.accentRed }]}>
              - {formatCurrency(orderSplit.commissionAmount)}
            </Text>
          </View>

          <View style={[styles.financialRow, styles.payoutHighlightRow]}>
            <Text style={styles.payoutHighlightLabel}>Your Net Payout</Text>
            <Text style={styles.payoutHighlightValue}>
              {formatCurrency(orderSplit.vendorPayoutAmount)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Dispatch Shipment Modal */}
      <Modal visible={dispatchModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Dispatch Shipment</Text>
            <Text style={styles.modalSub}>
              Enter transporter or courier details for customer tracking.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Courier / Transporter Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Delhivery, DTDC, VRL Logistics, Self Delivery"
                placeholderTextColor={COLORS.textMuted}
                value={courierName}
                onChangeText={setCourierName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tracking Number / LR Number (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. TRK987654321"
                placeholderTextColor={COLORS.textMuted}
                value={trackingNumber}
                onChangeText={setTrackingNumber}
              />
            </View>

            <View style={styles.modalBtnsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setDispatchModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleDispatchSubmit}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <>
                    <Send size={14} color={COLORS.textWhite} />
                    <Text style={styles.modalSubmitText}>Confirm Dispatch</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 10,
  },
  backButton: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  backButtonText: {
    color: COLORS.textWhite,
    fontWeight: "700",
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  statusTrackerCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  trackerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  trackerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  orderDateText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.sm,
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
  statusBadgeText: {
    fontSize: 11,
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
  workflowBtnsCol: {
    gap: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  actionBtnOrange: {
    backgroundColor: COLORS.accentOrange,
  },
  actionBtnBlue: {
    backgroundColor: COLORS.accentBlue,
  },
  actionBtnGreen: {
    backgroundColor: COLORS.accentGreen,
  },
  actionBtnText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
  },
  deliveredBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0fdf4",
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 8,
  },
  deliveredBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#166534",
    fontWeight: "700",
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    paddingBottom: 6,
  },
  customerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  customerPhoneText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  callButtonText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "800",
  },
  addressBox: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemThumbImg: {
    width: "100%",
    height: "100%",
  },
  itemDetailsCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  itemQty: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  financialLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  financialValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  payoutHighlightRow: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 8,
    marginTop: 6,
  },
  payoutHighlightLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  payoutHighlightValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.md,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
  },
  modalBtnsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  modalSubmitBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
});
