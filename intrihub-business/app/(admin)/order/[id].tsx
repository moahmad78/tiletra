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
  MapPin,
  IndianRupee,
  Store,
  Printer,
  Share2,
  X,
  Edit2,
} from "lucide-react-native";
import { apiClient } from "../../../src/api/client";
import { COURIER_PARTNERS } from "../../../src/constants/logistics";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";
import { printOrderInvoice, shareOrderInvoice } from "../../../src/utils/invoicePrinter";

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

const getFormattedAddress = (o: any) => {
  if (!o) return "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068";
  if (o.deliveryAddress && o.deliveryAddress.trim().length > 5 && !o.deliveryAddress.toLowerCase().includes("site location") && !o.deliveryAddress.toLowerCase().includes("site delivery")) {
    return o.deliveryAddress;
  }
  if (o.customerAddress && o.customerAddress.trim().length > 5 && !o.customerAddress.toLowerCase().includes("site location") && !o.customerAddress.toLowerCase().includes("site delivery")) {
    return o.customerAddress;
  }
  const parts = [
    o.deliveryHouseNumber || null,
    o.deliveryBuildingName || null,
    o.deliveryStreet && !o.deliveryStreet.toLowerCase().includes("site location") ? o.deliveryStreet : null,
    o.deliveryArea || null,
    o.deliveryLandmark ? `Landmark: ${o.deliveryLandmark.replace(/^near\s+/i, "")}` : null,
    o.deliveryCity || "Bengaluru",
    `${o.deliveryState || "Karnataka"} - ${o.deliveryPostalCode || "560068"}`,
  ].filter(Boolean).join(", ");
  
  if (parts.trim().length > 5 && !parts.toLowerCase().includes("site location")) return parts;
  return "Kumari elite apartment, Beguru, Landmark: Bommanahalli, Bengaluru, Karnataka - 560068";
};

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/mobile/admin/orders/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });

  const order = data?.order;

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch(`/api/mobile/admin/orders/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", id] });
      setTrackingModalOpen(false);
      Alert.alert("Success 🎉", "Order details & logistics tracking updated successfully");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to update order");
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: COLORS.textSecondary }}>Order not found</Text>
        <TouchableOpacity style={{ marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Go Back</Text>
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
        <Text style={[styles.topBarTitle, { flex: 1 }]}>Order #{order.id.slice(-6)}</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#EA580C", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 5 }}
            onPress={() => printOrderInvoice(order)}
          >
            <Printer size={14} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>Print Slip</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Master Order Status</Text>
          <Text style={styles.statusValue}>{order?.orderStatus?.toUpperCase()}</Text>

          <View style={styles.statusRow}>
            {["processing", "confirmed", "dispatched", "delivered"].map((st) => (
              <TouchableOpacity
                key={st}
                style={[
                  styles.statusChip,
                  order?.orderStatus === st && styles.statusChipActive,
                ]}
                onPress={() => {
                  if (st === "dispatched") {
                    setCourierName(order.courierName || "");
                    setTrackingNumber(order.trackingNumber || "");
                    setTrackingModalOpen(true);
                  } else {
                    updateMutation.mutate({ orderStatus: st });
                  }
                }}
              >
                <Text style={styles.statusChipText}>{st.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Dispatch & Fleet Tracking Card */}
        <View style={styles.infoCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <Text style={styles.cardTitle}>Courier & Logistics Tracking</Text>
            <TouchableOpacity
              onPress={() => {
                setCourierName(order.courierName || "");
                setTrackingNumber(order.trackingNumber || "");
                setTrackingModalOpen(true);
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: COLORS.accentBlue }}>
                {order.courierName ? "Edit Fleet ✏️" : "+ Assign Courier"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.infoText}>
            Courier / Fleet: <Text style={{ fontWeight: "800", color: COLORS.primary }}>{order.courierName || "Not assigned yet"}</Text>
          </Text>
          {order.trackingNumber ? (
            <Text style={[styles.infoText, { color: COLORS.accentOrange, fontWeight: "800", marginTop: 3 }]}>
              Tracking / LR No: {order.trackingNumber}
            </Text>
          ) : null}
        </View>

        {/* Customer & Location */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Customer Delivery Details</Text>
          <Text style={styles.customerName}>{order?.customerName}</Text>
          <Text style={styles.infoText}>
            Phone: {getCleanPhone(order?.customerPhone) ? `+91 ${getCleanPhone(order?.customerPhone)}` : "Not Provided"}
          </Text>
          <Text style={styles.infoText}>
            Address: {getFormattedAddress(order)}
          </Text>
          {order?.deliveryLatitude && order?.deliveryLongitude ? (
            <Text style={[styles.infoText, { color: COLORS.accentOrange, fontWeight: "700", marginTop: 4 }]}>
              GPS Coordinates: {order.deliveryLatitude.toFixed(4)}, {order.deliveryLongitude.toFixed(4)}
            </Text>
          ) : null}
        </View>

        {/* Vendor Splits */}
        <View style={styles.infoCard}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SPACING.sm }}>
            <Text style={styles.cardTitle}>Vendor Fulfillment Splits ({order?.vendorSplits?.length || 0})</Text>
            <TouchableOpacity onPress={() => router.push("/(admin)/deliveries" as any)}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: COLORS.accentBlue }}>Logistics Hub ↗</Text>
            </TouchableOpacity>
          </View>

          {order?.vendorSplits?.map((split: any) => (
            <View key={split.id} style={styles.splitItem}>
              <View style={styles.splitHeader}>
                <Store size={14} color={COLORS.primary} />
                <Text style={styles.splitVendorName}>{split.vendor?.businessName || "Vendor Partner"}</Text>
              </View>
              <Text style={styles.splitStatus}>
                Status: <Text style={{ fontWeight: "700" }}>{split.fulfillmentStatus?.toUpperCase()}</Text> • Payout: ₹{split.vendorPayoutAmount?.toLocaleString("en-IN")}
              </Text>
              {split.courierName ? (
                <Text style={[styles.splitStatus, { color: COLORS.accentOrange, marginTop: 2 }]}>
                  🚚 Fleet: {split.courierName} {split.trackingNumber ? `(${split.trackingNumber})` : ""}
                </Text>
              ) : null}
              {split.paymentCollected ? (
                <Text style={[styles.splitStatus, { color: "#059669", marginTop: 2 }]}>
                  ✅ COD Cash Collected
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Courier Assignment & Tracking Modal */}
      <Modal visible={trackingModalOpen} transparent animationType="slide" onRequestClose={() => setTrackingModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Truck size={20} color={COLORS.accentBlue} />
                <Text style={styles.modalTitle}>Dispatch Logistics & Fleet</Text>
              </View>
              <TouchableOpacity onPress={() => setTrackingModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Choose Courier / Transport Partner *</Text>
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
              placeholder="e.g. Delhivery, VRL Logistics, SafeXpress"
              placeholderTextColor="#94A3B8"
            />

            <Text style={styles.label}>Tracking / LR / Bilty Number:</Text>
            <TextInput
              style={styles.modalInput}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="e.g. DEL-98127391 / KA-04-E-5678"
              placeholderTextColor="#94A3B8"
            />

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => {
                updateMutation.mutate({
                  orderStatus: "dispatched",
                  courierName: courierName.trim() || undefined,
                  trackingNumber: trackingNumber.trim() || undefined,
                });
              }}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveBtnText}>Save Tracking & Mark Dispatched</Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryDark,
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
  statusRow: {
    flexDirection: "row",
    gap: 6,
  },
  statusChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: RADIUS.md,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  statusChipActive: {
    backgroundColor: COLORS.accentBlue,
  },
  statusChipText: {
    fontSize: 10,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  splitItem: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginTop: SPACING.sm,
  },
  splitHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  splitVendorName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  splitStatus: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  saveBtn: {
    backgroundColor: COLORS.accentBlue,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: SPACING.md,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
});
