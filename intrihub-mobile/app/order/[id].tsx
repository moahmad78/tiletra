import { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  ShieldCheck,
  Package,
  PhoneCall,
  Download,
} from "lucide-react-native";
import { getOrderDetails } from "../../src/api/orders";
import { socketService } from "../../src/store/socketStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["mobile-order-detail", id],
    queryFn: () => getOrderDetails(id),
    enabled: Boolean(id),
  });

  // Listen for real-time status transitions on this order
  useEffect(() => {
    const unsubscribe = socketService.subscribe("order-status-updated", (payload: any) => {
      if (payload?.orderId === id) {
        queryClient.invalidateQueries({ queryKey: ["mobile-order-detail", id] });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  const order = data?.order;

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Order Not Found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Tracking Steps
  const statusSteps = [
    { key: "placed", label: "Order Placed", desc: "Order details received" },
    { key: "confirmed", label: "Confirmed", desc: "Stock verified & assigned" },
    { key: "dispatched", label: "Dispatched", desc: "Handed to courier / transport" },
    { key: "delivered", label: "Delivered", desc: "Delivered at site" },
  ];

  const currentStatus = (order.orderStatus || "processing").toLowerCase();
  let activeStepIndex = 0;
  if (currentStatus.includes("confirm") || currentStatus.includes("process")) activeStepIndex = 1;
  if (currentStatus.includes("dispatch") || currentStatus.includes("ship")) activeStepIndex = 2;
  if (currentStatus.includes("deliver")) activeStepIndex = 3;

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navBackBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order #{order.id}</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Real-time Order Tracker Card */}
        <View style={[styles.card, SHADOWS.sm]}>
          <Text style={styles.cardHeaderTitle}>Delivery Status</Text>
          <Text style={styles.estimatedDeliveryText}>
            Estimated Delivery: {order.estimatedDelivery || "3–5 Business Days"}
          </Text>

          {/* Timeline Visual */}
          <View style={styles.timelineContainer}>
            {statusSteps.map((step, idx) => {
              const isCompleted = idx <= activeStepIndex;
              const isCurrent = idx === activeStepIndex;

              return (
                <View key={step.key} style={styles.timelineStepRow}>
                  {/* Indicator Column */}
                  <View style={styles.stepIndicatorCol}>
                    <View
                      style={[
                        styles.stepDot,
                        isCompleted && styles.completedStepDot,
                        isCurrent && styles.currentStepDot,
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={14} color={COLORS.textWhite} />
                      ) : (
                        <View style={styles.pendingDot} />
                      )}
                    </View>
                    {idx < statusSteps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          idx < activeStepIndex && styles.completedStepLine,
                        ]}
                      />
                    )}
                  </View>

                  {/* Step Text Info */}
                  <View style={styles.stepInfo}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isCompleted && styles.completedStepTitle,
                      ]}
                    >
                      {step.label}
                    </Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Courier Info if Dispatched */}
          {order.trackingNumber ? (
            <View style={styles.courierBox}>
              <Truck size={18} color={COLORS.primary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.courierName}>
                  Courier: {order.courierName || "Intrihub Logistics"}
                </Text>
                <Text style={styles.trackingNum}>Tracking No: {order.trackingNumber}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <MapPin size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Shipping Address</Text>
          </View>

          <Text style={styles.recipientName}>{order.customerName}</Text>
          <Text style={styles.recipientPhone}>Phone: +91 {order.customerPhone}</Text>
          {order.shippingAddress ? (
            <Text style={styles.addressLine}>
              {order.shippingAddress.street},{" "}
              {order.shippingAddress.landmark ? `Near ${order.shippingAddress.landmark}, ` : ""}
              {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
              {order.shippingAddress.pincode}
            </Text>
          ) : null}
        </View>

        {/* Order Items Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <Package size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Items in this Order ({order.items?.length || 0})</Text>
          </View>

          {order.items?.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemThumb} contentFit="cover" />
              ) : (
                <View style={styles.thumbPlaceholder}>
                  <Package size={20} color={COLORS.textMuted} />
                </View>
              )}

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={styles.itemVariantDetails}>{item.variantDetails}</Text>
                <Text style={styles.itemQtyPrice}>
                  Qty: {item.boxQuantity} Box(es) • ₹{item.totalPrice?.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionHeading}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{order.subtotal?.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Charges</Text>
            <Text style={[styles.summaryVal, order.deliveryFee === 0 && { color: COLORS.accentGreen }]}>
              {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalKey}>Total Amount</Text>
            <Text style={styles.grandTotalVal}>₹{order.total?.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Payment Mode</Text>
            <Text style={styles.summaryVal}>
              {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Paid)"}
            </Text>
          </View>
        </View>

        {/* Support Helpline CTA */}
        <TouchableOpacity
          style={styles.supportBtn}
          onPress={() => Linking.openURL("tel:+917870935277")}
        >
          <PhoneCall size={18} color={COLORS.primary} />
          <Text style={styles.supportBtnText}>Need Help with this Order? Call Support</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
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
  errorTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  backButtonText: {
    color: COLORS.textWhite,
    fontWeight: "800",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
  },
  navBackBtn: {
    marginRight: 14,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  scroll: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  estimatedDeliveryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 4,
  },
  timelineStepRow: {
    flexDirection: "row",
    minHeight: 52,
  },
  stepIndicatorCol: {
    alignItems: "center",
    width: 24,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  completedStepDot: {
    backgroundColor: COLORS.accentGreen,
  },
  currentStepDot: {
    backgroundColor: COLORS.primary,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.textMuted,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.border,
    marginVertical: 2,
  },
  completedStepLine: {
    backgroundColor: COLORS.accentGreen,
  },
  stepInfo: {
    marginLeft: 12,
    paddingBottom: 14,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  completedStepTitle: {
    color: COLORS.text,
    fontWeight: "800",
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  courierBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    padding: 10,
    borderRadius: RADIUS.sm,
    marginTop: 10,
  },
  courierName: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  trackingNum: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
  },
  sectionHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 6,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
  },
  recipientPhone: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addressLine: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 17,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  itemThumb: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  thumbPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: {
    marginLeft: 10,
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  itemVariantDetails: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemQtyPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  summaryKey: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  grandTotalKey: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  grandTotalVal: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  supportBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  supportBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
});
