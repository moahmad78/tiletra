import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Phone,
  MapPin,
  IndianRupee,
  Printer,
  X,
} from "lucide-react-native";
import { fetchVendorOrders, updateVendorOrderStatus } from "../../../src/api/vendor";
import { COURIER_PARTNERS } from "../../../src/constants/logistics";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";
import { printOrderInvoice } from "../../../src/utils/invoicePrinter";

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

export default function VendorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [dispatchModalVisible, setDispatchModalVisible] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", "all"],
    queryFn: () => fetchVendorOrders("all"),
  });

  const split = data?.orders?.find((o) => o.splitId === id);

  const statusMutation = useMutation({
    mutationFn: ({ newStatus, extra }: { newStatus: string; extra?: any }) =>
      updateVendorOrderStatus(id, newStatus, extra),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      setDispatchModalVisible(false);
      Alert.alert("Status Updated", "Order fulfillment status has been updated.");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update status");
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentOrange} />
      </View>
    );
  }

  if (!split) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order split not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { flex: 1 }]}>Split #{split.splitId.slice(-6)}</Text>
        <TouchableOpacity
          style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#EA580C", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 6 }}
          onPress={() => printOrderInvoice(split)}
        >
          <Printer size={15} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "800" }}>Print Slip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Fulfillment Status</Text>
          <Text style={styles.statusValue}>
            {split.fulfillmentStatus.replace(/_/g, " ").toUpperCase()}
          </Text>

          <View style={styles.statusActions}>
            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "confirmed" && styles.actionChipActive,
              ]}
              onPress={() => statusMutation.mutate({ newStatus: "confirmed" })}
            >
              <Text style={styles.actionChipText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "ready_for_pickup" && styles.actionChipActive,
              ]}
              onPress={() => statusMutation.mutate({ newStatus: "ready_for_pickup" })}
            >
              <Text style={styles.actionChipText}>Ready</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "dispatched" && styles.actionChipActive,
              ]}
              onPress={() => {
                setCourierName(split.courierName || "");
                setTrackingNumber(split.trackingNumber || "");
                setDispatchModalVisible(true);
              }}
            >
              <Text style={styles.actionChipText}>Dispatched</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "delivered" && styles.actionChipActive,
              ]}
              onPress={() => statusMutation.mutate({ newStatus: "delivered" })}
            >
              <Text style={styles.actionChipText}>Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logistics & Dispatch Info Card */}
        {split.courierName || split.trackingNumber ? (
          <View style={styles.infoCard}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <Text style={styles.cardHeading}>Logistics & Dispatch Tracking</Text>
              <TouchableOpacity
                onPress={() => {
                  setCourierName(split.courierName || "");
                  setTrackingNumber(split.trackingNumber || "");
                  setDispatchModalVisible(true);
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.accentOrange }}>Edit ✏️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Courier / Transport:</Text>
              <Text style={[styles.infoVal, { fontWeight: "800", color: COLORS.primary }]}>{split.courierName || "N/A"}</Text>
            </View>
            {split.trackingNumber ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>LR / Tracking No:</Text>
                <Text style={[styles.infoVal, { fontWeight: "800", color: COLORS.accentOrange }]}>{split.trackingNumber}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Customer & Order Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeading}>Customer Information & Delivery Site</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Name:</Text>
            <Text style={styles.infoVal}>{split.customerName}</Text>
          </View>
          {getCleanPhone(split.customerPhone) ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Phone:</Text>
              <Text style={styles.infoVal}>+91 {getCleanPhone(split.customerPhone)}</Text>
            </View>
          ) : null}
          <View style={[styles.infoRow, { alignItems: "flex-start", marginTop: 4 }]}>
            <Text style={styles.infoKey}>Delivery Address:</Text>
            <Text style={[styles.infoVal, { flex: 1, textAlign: "right" }]}>
              {split.deliveryAddress || split.shippingAddress?.formattedAddress || "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068"}
            </Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeading}>Payout & Financials</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Subtotal:</Text>
            <Text style={styles.infoVal}>₹{split.subtotal?.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Your Payout (Post Commission):</Text>
            <Text style={[styles.infoVal, { color: COLORS.accentGreen, fontWeight: "900" }]}>
              ₹{split.vendorPayoutAmount?.toLocaleString("en-IN")}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Dispatch Logistics Modal */}
      <Modal visible={dispatchModalVisible} transparent animationType="slide" onRequestClose={() => setDispatchModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Truck size={20} color={COLORS.accentOrange} />
                <Text style={styles.modalTitle}>Dispatch Logistics Details</Text>
              </View>
              <TouchableOpacity onPress={() => setDispatchModalVisible(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Select Courier / Transport Partner *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              <View style={{ flexDirection: "row", gap: 8, paddingVertical: 4 }}>
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
                      <Truck size={13} color={isSelected ? "#FFFFFF" : cp.badgeColor} />
                      <Text style={[styles.courierChipText, isSelected && styles.courierChipTextSelected]}>
                        {cp.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text style={[styles.label, { marginTop: 8 }]}>Transport Name (Customizable):</Text>
            <TextInput
              style={styles.modalInput}
              value={courierName}
              onChangeText={setCourierName}
              placeholder="e.g. VRL Logistics, Delhivery, Own Truck"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Tracking / LR / Bilty Number:</Text>
            <TextInput
              style={styles.modalInput}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="e.g. VRL-98726354 / KA-01-AB-1234"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={styles.saveDispatchBtn}
              onPress={() => {
                statusMutation.mutate({
                  newStatus: "dispatched",
                  extra: {
                    courierName: courierName.trim() || undefined,
                    trackingNumber: trackingNumber.trim() || undefined,
                  },
                });
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveDispatchBtnText}>Confirm & Mark Dispatched</Text>
              )}
            </TouchableOpacity>
          </View>
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
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  backBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  navBackBtn: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  statusCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  statusLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusValue: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.textWhite,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  statusActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  actionChipActive: {
    backgroundColor: COLORS.accentOrange,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#fff",
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoKey: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
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
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
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
  saveDispatchBtn: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  saveDispatchBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
