import { useState, useEffect } from "react";
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
  Share,
  Modal,
  Alert,
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
  FileText,
  Share2,
  X,
  Headphones,
  MessageCircle,
  Navigation,
  Star,
  Edit3,
} from "lucide-react-native";
import { getOrderDetails } from "../../src/api/orders";
import { socketService } from "../../src/store/socketStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { downloadInvoicePDFDirect, shareInvoicePDF } from "../../src/utils/pdfInvoiceGenerator";
import { WriteReviewModal } from "../../src/components/WriteReviewModal";

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

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [reviewItem, setReviewItem] = useState<{ productId: string; productName: string; orderId: string } | null>(null);

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

  const handleShareInvoice = () => {
    Alert.alert(
      "Share Invoice",
      "Choose how you want to share this bill:",
      [
        {
          text: "📄 Share PDF Bill",
          onPress: async () => {
            try {
              setDownloadingPdf(true);
              const res = await shareInvoicePDF(order);
              if (!res.success) {
                Alert.alert("Share Error", "Could not share PDF invoice.");
              }
            } catch (err: any) {
              console.warn("Share PDF error:", err);
            } finally {
              setDownloadingPdf(false);
            }
          },
        },
        {
          text: "💬 Share Text Summary",
          onPress: async () => {
            try {
              const itemsText = (order.items || [])
                .map(
                  (it: any, idx: number) =>
                    `${idx + 1}. ${it.productName}\n   Qty: ${it.boxQuantity} Box(es) • ₹${it.totalPrice?.toLocaleString("en-IN")}`
                )
                .join("\n\n");

              const invoiceText = `📄 *INTRIHUB TAX INVOICE & ORDER SUMMARY*
Order ID: #${order.id}
Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
Customer: ${order.deliveryName || order.customerName || "Valued Customer"}
Phone: ${getCleanPhone(order.deliveryPhone || order.customerPhone) ? `+91 ${getCleanPhone(order.deliveryPhone || order.customerPhone)}` : "Not Provided"}

📦 *ITEMS ORDERED:*
${itemsText}

💰 *PAYMENT SUMMARY:*
Subtotal: ₹${order.subtotal?.toLocaleString("en-IN")}
Shipping & Handling: ${order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
Grand Total: ₹${order.total?.toLocaleString("en-IN")}
Payment Mode: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Paid)"}
Payment Status: ${order.paymentStatus || "Confirmed"}

📍 *DELIVERY ADDRESS:*
${order.deliveryAddress || [
  order.deliveryHouseNumber,
  order.deliveryBuildingName,
  order.deliveryStreet || order.shippingAddress?.street,
  order.deliveryArea,
  order.deliveryCity || order.shippingAddress?.city,
  order.deliveryPostalCode || order.shippingAddress?.pincode,
]
  .filter(Boolean)
  .join(", ") || order.shippingAddress?.street || ""}

Official Helpline: +91 9264920211
IntriHub — Everything, Every Place`;

              await Share.share({
                title: `IntriHub_Invoice_${order.id}`,
                message: invoiceText,
              });
            } catch (err: any) {
              console.warn("Share failed:", err);
            }
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true }
    );
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingPdf(true);
      const res = await downloadInvoicePDFDirect(order);
      if (!res.success) {
        Alert.alert("Invoice Error", "Could not generate tax PDF invoice. Please try again.");
      }
    } catch (err: any) {
      console.warn("In-app PDF download failed:", err);
      Alert.alert("Invoice Error", "Could not download PDF invoice.");
    } finally {
      setDownloadingPdf(false);
    }
  };

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
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardHeaderTitle}>Delivery Status</Text>
              <Text style={styles.estimatedDeliveryText}>
                Estimated Delivery: {order.estimatedDelivery || "Within 60 Minutes"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.invoiceBadgeBtn}
              onPress={() => setShowInvoiceModal(true)}
              activeOpacity={0.8}
            >
              <FileText size={14} color={COLORS.primary} />
              <Text style={styles.invoiceBadgeText}>Invoice</Text>
            </TouchableOpacity>
          </View>

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
          {getCleanPhone(order.deliveryPhone || order.customerPhone) ? (
            <Text style={styles.recipientPhone}>Phone: +91 {getCleanPhone(order.deliveryPhone || order.customerPhone)}</Text>
          ) : null}
          
          {/* Detailed Address Line */}
          <Text style={styles.addressLine}>
            {order.deliveryAddress || [
              order.deliveryHouseNumber,
              order.deliveryBuildingName,
              order.deliveryStreet || order.shippingAddress?.street,
              order.deliveryArea,
              order.deliveryCity || order.shippingAddress?.city,
              order.deliveryPostalCode || order.shippingAddress?.pincode,
            ]
              .filter(Boolean)
              .join(", ") || order.shippingAddress?.street}
          </Text>

          {/* Landmark */}
          {(!order.deliveryAddress && (order.deliveryLandmark || order.shippingAddress?.landmark)) ? (
            <Text style={styles.cardLandmarkDetail}>
              📍 Landmark: {order.deliveryLandmark || order.shippingAddress?.landmark}
            </Text>
          ) : null}

          {/* Delivery Instructions */}
          {order.deliveryInstructions ? (
            <View style={styles.instructionBox}>
              <Text style={styles.instructionTitle}>Delivery Instructions:</Text>
              <Text style={styles.instructionText}>{order.deliveryInstructions}</Text>
            </View>
          ) : null}

          {/* Coordinates & Navigation Row */}
          {(() => {
            const lat = order.deliveryLatitude || (order.shippingAddress as any)?.latitude;
            const lng = order.deliveryLongitude || (order.shippingAddress as any)?.longitude;
            if (!lat || !lng) return null;

            return (
              <View style={styles.navRow}>
                <View style={styles.coordsTag}>
                  <MapPin size={12} color={COLORS.secondary} />
                  <Text style={styles.coordsTagText}>
                    GPS: {lat.toFixed(4)}, {lng.toFixed(4)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.navigateBtn}
                  onPress={() => {
                    const navUrl =
                      Platform.OS === "ios"
                        ? `maps://?daddr=${lat},${lng}`
                        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
                    Linking.openURL(navUrl);
                  }}
                  activeOpacity={0.85}
                >
                  <Navigation size={14} color="#fff" />
                  <Text style={styles.navigateBtnText}>NAVIGATE</Text>
                </TouchableOpacity>
              </View>
            );
          })()}
        </View>

        {/* Order Items Card */}
        <View style={styles.card}>
          <View style={styles.sectionHeadingRow}>
            <Package size={18} color={COLORS.primary} />
            <Text style={styles.sectionHeading}>Items in this Order ({order.items?.length || 0})</Text>
          </View>

          {order.items?.map((item: any) => (
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

                {/* Write Review Button for Delivered Items */}
                {order.orderStatus?.toLowerCase().includes("deliver") && item.productId && (
                  <TouchableOpacity
                    style={styles.itemReviewBtn}
                    onPress={() =>
                      setReviewItem({
                        productId: item.productId,
                        productName: item.productName,
                        orderId: order.id,
                      })
                    }
                    activeOpacity={0.8}
                  >
                    <Star size={12} color="#F59E0B" fill="#F59E0B" style={{ marginRight: 4 }} />
                    <Text style={styles.itemReviewBtnText}>Write Review</Text>
                  </TouchableOpacity>
                )}
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

          {/* Download Invoice Button */}
          <TouchableOpacity
            style={styles.downloadInvoiceBtn}
            onPress={() => setShowInvoiceModal(true)}
            activeOpacity={0.85}
          >
            <Download size={16} color={COLORS.primary} />
            <Text style={styles.downloadInvoiceBtnText}>Download Tax Invoice / Bill</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Support CTA Card */}
        <View style={styles.supportCard}>
          <TouchableOpacity
            style={styles.supportPrimaryBtn}
            onPress={() => router.push("/support")}
            activeOpacity={0.85}
          >
            <Headphones size={18} color={COLORS.textWhite} />
            <Text style={styles.supportPrimaryBtnText}>Need Help with this Order? Open Support</Text>
          </TouchableOpacity>

          {/* Quick Helpline options */}
          <View style={styles.quickSupportRow}>
            <TouchableOpacity
              style={styles.quickSupportBtn}
              onPress={() => Linking.openURL("tel:9264920211")}
              activeOpacity={0.8}
            >
              <PhoneCall size={14} color={COLORS.primary} />
              <Text style={styles.quickSupportText}>Call Helpline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickSupportBtn}
              onPress={() =>
                Linking.openURL(
                  `https://wa.me/919264920211?text=Hi%20Intrihub%20Support,%20I%20need%20help%20with%20Order%20#${order.id}`
                )
              }
              activeOpacity={0.8}
            >
              <MessageCircle size={14} color={COLORS.accentGreen} />
              <Text style={[styles.quickSupportText, { color: COLORS.accentGreen }]}>WhatsApp Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Write Review Modal */}
      {reviewItem && (
        <WriteReviewModal
          visible={Boolean(reviewItem)}
          productId={reviewItem.productId}
          productName={reviewItem.productName}
          orderId={reviewItem.orderId}
          onClose={() => setReviewItem(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["mobile-order-detail", id] });
          }}
        />
      )}

      {/* Official Tax Invoice / Bill Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <FileText size={20} color={COLORS.primary} />
                <Text style={styles.modalHeaderTitle}>Tax Invoice & Bill</Text>
              </View>
              <TouchableOpacity onPress={() => setShowInvoiceModal(false)} style={styles.closeModalBtn}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Company & Bill Info */}
              <View style={styles.invoiceHeaderBox}>
                <Text style={styles.invoiceBrand}>INTRIHUB PRIVATE LIMITED</Text>
                <Text style={styles.invoiceSub}>Everything, Every Place</Text>
                <Text style={styles.invoiceMeta}>GSTIN: 29AAAAA0000A1Z5 | Verified Tax Bill</Text>
              </View>

              {/* Order Meta */}
              <View style={styles.invoiceMetaGrid}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Invoice / Order #</Text>
                  <Text style={styles.metaValue}>#{order.id}</Text>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>Order Date</Text>
                  <Text style={styles.metaValue}>
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Recent"}
                  </Text>
                </View>
              </View>

              {/* Bill To */}
              <View style={styles.invoiceBillToBox}>
                <Text style={styles.billToLabel}>BILLED & SHIPPED TO:</Text>
                <Text style={styles.billToName}>{order.customerName}</Text>
                {getCleanPhone(order.customerPhone) ? (
                  <Text style={styles.billToPhone}>+91 {getCleanPhone(order.customerPhone)}</Text>
                ) : null}
                {order.shippingAddress && (
                  <Text style={styles.billToAddr}>
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} -{" "}
                    {order.shippingAddress.pincode}
                  </Text>
                )}
              </View>

              {/* Itemized Table */}
              <View style={styles.invoiceTable}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.tableHead, { flex: 2 }]}>Item Description</Text>
                  <Text style={[styles.tableHead, { flex: 1, textAlign: "center" }]}>Qty</Text>
                  <Text style={[styles.tableHead, { flex: 1, textAlign: "right" }]}>Amount</Text>
                </View>

                {order.items?.map((it: any, index: number) => (
                  <View key={it.id || index} style={styles.tableDataRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={2}>
                      {it.productName}
                    </Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "center" }]}>{it.boxQuantity} Box</Text>
                    <Text style={[styles.tableCell, { flex: 1, textAlign: "right", fontWeight: "700" }]}>
                      ₹{it.totalPrice?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Totals */}
              <View style={styles.invoiceTotalsBox}>
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalKey}>Subtotal (Tax Included)</Text>
                  <Text style={styles.invoiceTotalVal}>₹{order.subtotal?.toLocaleString("en-IN")}</Text>
                </View>
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalKey}>Shipping & Wooden Crate Handling</Text>
                  <Text style={styles.invoiceTotalVal}>
                    {order.deliveryFee === 0 ? "FREE" : `₹${order.deliveryFee}`}
                  </Text>
                </View>
                <View style={[styles.invoiceTotalRow, styles.invoiceGrandTotalRow]}>
                  <Text style={styles.invoiceGrandTotalKey}>Total Amount (INR)</Text>
                  <Text style={styles.invoiceGrandTotalVal}>₹{order.total?.toLocaleString("en-IN")}</Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={handleShareInvoice}
                activeOpacity={0.85}
              >
                <Share2 size={16} color={COLORS.primary} />
                <Text style={styles.modalShareBtnText}>Share Bill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDownloadBtn}
                onPress={handleDownloadInvoice}
                disabled={downloadingPdf}
                activeOpacity={0.85}
              >
                {downloadingPdf ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <>
                    <Download size={16} color={COLORS.textWhite} />
                    <Text style={styles.modalDownloadBtnText}>Download Official PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
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
  },
  invoiceBadgeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.15)",
  },
  invoiceBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 4,
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
  downloadInvoiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5, 42, 81, 0.06)",
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 11,
    marginTop: 14,
  },
  downloadInvoiceBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 6,
  },
  supportCard: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  supportPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    ...SHADOWS.sm,
  },
  supportPrimaryBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 8,
  },
  quickSupportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  quickSupportBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    marginHorizontal: 4,
  },
  quickSupportText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: SPACING.md,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: "90%",
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
    marginLeft: 8,
  },
  closeModalBtn: {
    padding: 4,
  },
  invoiceHeaderBox: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
  },
  invoiceBrand: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  invoiceSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  invoiceMeta: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.accentOrange,
    marginTop: 3,
  },
  invoiceMetaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    textTransform: "uppercase",
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 1,
  },
  invoiceBillToBox: {
    backgroundColor: COLORS.surfaceTertiary,
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: 10,
  },
  billToLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.textMuted,
  },
  billToName: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 2,
  },
  billToPhone: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  billToAddr: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  invoiceTable: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceSecondary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  tableHead: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  tableDataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tableCell: {
    fontSize: 11,
    color: COLORS.text,
  },
  invoiceTotalsBox: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: SPACING.md,
    borderRadius: RADIUS.sm,
    marginTop: 4,
  },
  invoiceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  invoiceTotalKey: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  invoiceTotalVal: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },
  invoiceGrandTotalRow: {
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 6,
    marginTop: 4,
  },
  invoiceGrandTotalKey: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.primary,
  },
  invoiceGrandTotalVal: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
  },
  modalActionRow: {
    flexDirection: "row",
    marginTop: 14,
    justifyContent: "space-between",
  },
  modalShareBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    marginRight: 6,
  },
  modalShareBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginLeft: 6,
  },
  modalDownloadBtn: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    marginLeft: 6,
  },
  modalDownloadBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.textWhite,
    marginLeft: 6,
  },
  cardLandmarkDetail: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  instructionBox: {
    backgroundColor: "#fff8f3",
    borderWidth: 1,
    borderColor: "#ffe0cc",
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 6,
  },
  instructionTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.secondary,
    textTransform: "uppercase",
  },
  instructionText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 2,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  coordsTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f4f6f8",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  coordsTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  navigateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  navigateBtnText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.5,
  },
  itemReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginTop: 6,
  },
  itemReviewBtnText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#92400E",
  },
});
