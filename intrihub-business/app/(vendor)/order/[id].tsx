import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Phone,
  ShieldCheck,
  MapPin,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Package,
  Bike,
  Printer,
  Sparkles,
  Edit3,
} from "lucide-react-native";
import { fetchVendorOrders, updateVendorOrderStatus } from "../../../src/api/vendor";
import { printOrderInvoice } from "../../../src/utils/invoicePrinter";
import { socketService } from "../../../src/store/socketStore";

export default function VendorOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [showAllItems, setShowAllItems] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["vendor-orders", "all"],
    queryFn: () => fetchVendorOrders("all"),
  });

  // Real-time socket status & rider dispatch sync
  useEffect(() => {
    const unsubStatus = socketService.subscribe("order-status-updated", (payload: any) => {
      if (payload?.orderId === id || payload?.splitId === id) {
        queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
        queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      }
    });

    const unsubRider = socketService.subscribe("rider-assigned", (payload: any) => {
      if (payload?.orderId === id || payload?.splitId === id) {
        queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      }
    });

    return () => {
      unsubStatus();
      unsubRider();
    };
  }, [id, queryClient]);

  const split = data?.orders?.find((o) => o.splitId === id || o.orderId === id);

  const isPacked = split?.fulfillmentStatus === "ready_for_pickup" || split?.fulfillmentStatus === "dispatched" || split?.fulfillmentStatus === "delivered";

  const statusMutation = useMutation({
    mutationFn: ({ newStatus, extra }: { newStatus: string; extra?: any }) =>
      updateVendorOrderStatus(id, newStatus, extra),
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      if (newStatus === "ready_for_pickup") {
        Alert.alert("Order Packed! 🎉", "Rider has been alerted for pickup.");
      }
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update status");
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!split) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Customer privacy protection: Never reveal raw customer phone or direct contact actions to vendor
  const rawPhone = split.customerPhone ? String(split.customerPhone).trim() : "";
  const cleanPhone = rawPhone.replace(/\D/g, "");
  const displayPhone = rawPhone.includes("••••")
    ? rawPhone
    : (cleanPhone.length >= 5
        ? `+91 ${cleanPhone.slice(-10, -5)} •••••`
        : (rawPhone ? "••••••••••" : "Privacy Protected"));
  const orderNumber = split.orderId || split.splitId.slice(-6);

  // Real items from database order
  const items = Array.isArray(split.items) ? split.items : [];
  const displayedItems = showAllItems ? items : items.slice(0, 3);

  const handleCallRider = () => {
    Linking.openURL(`tel:918765432109`).catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleRow}>
          <Text style={styles.orderTitle} numberOfLines={1}>
            Order #{orderNumber}
          </Text>
          <View
            style={[
              styles.statusBadge,
              isPacked ? styles.statusBadgePacked : styles.statusBadgeAccepted,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                isPacked ? styles.statusBadgeTextPacked : styles.statusBadgeTextAccepted,
              ]}
            >
              {isPacked ? "Packed" : "Accepted"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => printOrderInvoice(split)}
        >
          <Printer size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 4-Step Stepper Progress Bar */}
        <View style={styles.stepperContainer}>
          {/* Step 1: Order Accepted */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCircleActive]}>
              {isPacked ? (
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={styles.stepNumActive}>1</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>Order Accepted</Text>
          </View>

          {/* Line 1 -> 2 */}
          <View style={[styles.stepLine, isPacked && styles.stepLineActive]} />

          {/* Step 2: Pack Order */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, isPacked ? styles.stepCircleActive : styles.stepCirclePending]}>
              {isPacked ? (
                <Check size={14} color="#FFFFFF" strokeWidth={3} />
              ) : (
                <Text style={styles.stepNumPending}>2</Text>
              )}
            </View>
            <Text style={[styles.stepLabel, isPacked && styles.stepLabelActive]}>Pack Order</Text>
          </View>

          {/* Line 2 -> 3 */}
          <View style={styles.stepLine} />

          {/* Step 3: Ready for Pickup */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCirclePending]}>
              <Text style={styles.stepNumPending}>3</Text>
            </View>
            <Text style={styles.stepLabel}>Ready for Pickup</Text>
          </View>

          {/* Line 3 -> 4 */}
          <View style={styles.stepLine} />

          {/* Step 4: Done */}
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepCirclePending]}>
              <Text style={styles.stepNumPending}>4</Text>
            </View>
            <Text style={styles.stepLabel}>Done</Text>
          </View>
        </View>

        {/* ── Case A: If Order is NOT Packed yet (Screen 2) ── */}
        {!isPacked ? (
          <>
            {/* Customer Details Card */}
            <View style={styles.card}>
              <View style={styles.customerRow}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarInitial}>
                    {(split.customerName || "Amit Verma").charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.customerMeta}>
                  <Text style={styles.customerName}>
                    {split.customerName || "Customer"}
                  </Text>
                  <Text style={styles.customerPhone}>{displayPhone}</Text>
                </View>

                <View style={styles.privacyBadge}>
                  <ShieldCheck size={14} color="#059669" />
                  <Text style={styles.privacyBadgeText}>Protected</Text>
                </View>
              </View>

              <View style={styles.addressDivider} />

              <View style={styles.addressRow}>
                <MapPin size={16} color="#0F172A" style={{ marginTop: 2 }} />
                <Text style={styles.addressText}>
                  {split.deliveryAddress || "HSR Layout, 5th Main, Bangalore - 560102"}
                </Text>
              </View>
            </View>

            {/* Order Items Card */}
            <View style={styles.card}>
              <Text style={styles.itemsHeaderTitle}>
                Order Items ({split.itemsCount || items.length})
              </Text>

              <View style={styles.itemsList}>
                {displayedItems.map((item: any, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={styles.itemThumb}>
                      <Text style={{ fontSize: 20 }}>{item.icon || "📦"}</Text>
                    </View>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.name || item.productName}</Text>
                      <Text style={styles.itemSpec}>{item.spec || item.variant || "Standard Pack"}</Text>
                      <Text style={styles.itemQty}>Qty: {item.qty || item.quantity || "1 pc"}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      {item.price ? item.price : `₹${Number(item.price || item.totalPrice || 500).toLocaleString("en-IN")}`}
                    </Text>
                  </View>
                ))}
              </View>

              {items.length > 3 && (
                <TouchableOpacity
                  style={styles.viewAllBtn}
                  onPress={() => setShowAllItems(!showAllItems)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewAllText}>
                    {showAllItems ? "Show Less" : `View All ${split.itemsCount || items.length} Items`}
                  </Text>
                  {showAllItems ? (
                    <ChevronUp size={16} color="#0066FF" />
                  ) : (
                    <ChevronDown size={16} color="#0066FF" />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          /* ── Case B: If Order IS Packed (Screen 3) ── */
          <View style={styles.packedCelebrationCard}>
            <View style={styles.celebrationIconBadge}>
              <Text style={{ fontSize: 44 }}>🎁</Text>
              <View style={styles.celebrationCheck}>
                <Check size={14} color="#FFFFFF" strokeWidth={3.5} />
              </View>
            </View>
            <Text style={styles.packedTitle}>Order Packed!</Text>
            <Text style={styles.packedSubtitle}>
              Items are packed and ready for pickup.
            </Text>
          </View>
        )}

        {/* Delivery Partner Details Card */}
        <View style={styles.card}>
          <View style={styles.riderHeaderRow}>
            <View style={styles.riderAvatarBox}>
              <Text style={{ fontSize: 24 }}>🛵</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.deliveryBadgeText}>Delivery Partner</Text>
              <Text style={styles.riderName}>
                {(split as any).riderName || split.courierName || (isPacked ? "Assigning Nearest Partner..." : "Unassigned")}
              </Text>
              <Text style={styles.riderPhone}>
                {(split as any).riderPhone ? `+91 ${(split as any).riderPhone}` : (isPacked ? "Searching delivery rider..." : "Will assign after packing")}
              </Text>
            </View>
            {(split as any).riderPhone ? (
              <TouchableOpacity
                style={styles.riderCallBtn}
                onPress={() => Linking.openURL(`tel:${(split as any).riderPhone}`).catch(() => {})}
                activeOpacity={0.8}
              >
                <Phone size={14} color="#0066FF" />
                <Text style={styles.riderCallText}>Call</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.riderFooterRow}>
            <View style={styles.riderStatusBox}>
              <Bike size={16} color="#0F172A" />
              <Text style={styles.riderEtaText}>
                {isPacked ? "Pickup dispatch in progress" : "Pending Order Pack"}
              </Text>
            </View>
            {split.trackingNumber ? (
              <View style={styles.licensePlateBox}>
                <Text style={styles.licensePlateText}>Track: {split.trackingNumber}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Re-Pack Option if Packed */}
        {isPacked && (
          <TouchableOpacity
            style={styles.repackBtn}
            onPress={() => statusMutation.mutate({ newStatus: "confirmed" })}
            activeOpacity={0.7}
          >
            <Edit3 size={15} color="#64748B" />
            <Text style={styles.repackText}>Need to re-pack? Edit</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Bottom Action Footer */}
      <View style={styles.bottomBar}>
        {!isPacked ? (
          <TouchableOpacity
            style={styles.markPackedBtn}
            onPress={() => statusMutation.mutate({ newStatus: "ready_for_pickup" })}
            activeOpacity={0.88}
          >
            <Package size={20} color="#FFFFFF" />
            <Text style={styles.markPackedBtnText}>Mark as Packed</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.viewDetailsBtn}
            onPress={() => router.push("/(vendor)/orders" as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewDetailsBtnText}>View All Orders</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    marginBottom: 12,
    fontWeight: "700",
  },
  backBtn: {
    backgroundColor: "#0066FF",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 54 : 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    fontFamily: "PlusJakartaSans_800ExtraBold",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeAccepted: {
    backgroundColor: "#DCFCE7",
  },
  statusBadgeTextAccepted: {
    color: "#15803D",
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgePacked: {
    backgroundColor: "#EFF6FF",
  },
  statusBadgeTextPacked: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 14,
  },
  stepperContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  stepItem: {
    alignItems: "center",
    gap: 6,
    width: 60,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCircleActive: {
    backgroundColor: "#0066FF",
  },
  stepCirclePending: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepNumActive: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  stepNumPending: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 12,
  },
  stepLabelActive: {
    color: "#0F172A",
    fontWeight: "700",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
    marginHorizontal: -4,
  },
  stepLineActive: {
    backgroundColor: "#0066FF",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  customerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: "800",
    color: "#475569",
  },
  customerMeta: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  customerPhone: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  privacyBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
  },
  addressDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: "#475569",
    lineHeight: 18,
  },
  itemsHeaderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 12,
  },
  itemsList: {
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemThumb: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  itemSpec: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  itemQty: {
    fontSize: 12,
    color: "#0066FF",
    fontWeight: "600",
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0066FF",
  },
  packedCelebrationCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  celebrationIconBadge: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  celebrationCheck: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  packedTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#065F46",
    marginBottom: 4,
  },
  packedSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
  },
  riderHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  riderAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0066FF",
  },
  riderName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
  riderPhone: {
    fontSize: 12,
    color: "#64748B",
  },
  riderCallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  riderCallText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0066FF",
  },
  riderFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  riderStatusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  riderEtaText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  licensePlateBox: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  licensePlateText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  repackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  repackText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  markPackedBtn: {
    width: "100%",
    height: 50,
    backgroundColor: "#0066FF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#0066FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  markPackedBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  viewDetailsBtn: {
    width: "100%",
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  viewDetailsBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },
});
