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
  Package,
  Phone,
  MapPin,
  IndianRupee,
} from "lucide-react-native";
import { fetchVendorOrders, updateVendorOrderStatus } from "../../../src/api/vendor";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../../src/constants/theme";

export default function VendorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", "all"],
    queryFn: () => fetchVendorOrders("all"),
  });

  const split = data?.orders?.find((o) => o.splitId === id);

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => updateVendorOrderStatus(id, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert("Status Updated", "Order status has been updated.");
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
        <Text style={styles.topBarTitle}>Split #{split.splitId.slice(-6)}</Text>
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
              onPress={() => statusMutation.mutate("confirmed")}
            >
              <Text style={styles.actionChipText}>Confirm</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "ready_for_pickup" && styles.actionChipActive,
              ]}
              onPress={() => statusMutation.mutate("ready_for_pickup")}
            >
              <Text style={styles.actionChipText}>Ready</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "dispatched" && styles.actionChipActive,
              ]}
              onPress={() => statusMutation.mutate("dispatched")}
            >
              <Text style={styles.actionChipText}>Dispatched</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionChip,
                split.fulfillmentStatus === "delivered" && styles.actionChipActive,
              ]}
              onPress={() => statusMutation.mutate("delivered")}
            >
              <Text style={styles.actionChipText}>Delivered</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer & Order Info */}
        <View style={styles.infoCard}>
          <Text style={styles.cardHeading}>Customer Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Name:</Text>
            <Text style={styles.infoVal}>{split.customerName}</Text>
          </View>
          {split.customerPhone ? (
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>Phone:</Text>
              <Text style={styles.infoVal}>+91 {split.customerPhone}</Text>
            </View>
          ) : null}
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
});
