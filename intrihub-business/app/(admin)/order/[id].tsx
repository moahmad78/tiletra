import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
} from "lucide-react-native";
import { apiClient } from "../../../src/api/client";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";

export default function AdminOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/mobile/admin/orders/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.patch(`/api/mobile/admin/orders/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail", id] });
      Alert.alert("Success", "Order status updated");
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.accentBlue} />
      </View>
    );
  }

  const order = data?.order;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Order #{order?.id}</Text>
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
                onPress={() => updateMutation.mutate({ orderStatus: st })}
              >
                <Text style={styles.statusChipText}>{st.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Customer & Location */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Customer Delivery Details</Text>
          <Text style={styles.customerName}>{order?.customerName}</Text>
          <Text style={styles.infoText}>Phone: +91 {order?.customerPhone}</Text>
          <Text style={styles.infoText}>
            Address: {[
              order?.deliveryHouseNumber,
              order?.deliveryBuildingName,
              order?.deliveryStreet,
              order?.deliveryArea,
              order?.deliveryCity,
              order?.deliveryPostalCode,
            ].filter(Boolean).join(", ")}
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
});
