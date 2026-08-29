import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Package,
} from "lucide-react-native";
import { useCartStore } from "../src/store/cartStore";
import { useAuthStore } from "../src/store/authStore";
import { createCheckoutOrder, verifyCheckoutPayment } from "../src/api/orders";
import RazorpayCheckout from "react-native-razorpay";
import { AddressModal } from "../src/components/AddressModal";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";
import { getImageUrl } from "../src/constants/config";

export default function CheckoutScreen() {
  const router = useRouter();
  const { user, selectedAddress, setSelectedAddress } = useAuthStore();
  const { items, getSubtotal, getDeliveryFee, getTotal, clearCart } = useCartStore();

  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();

  const handlePlaceOrder = async () => {
    setErrorMessage("");

    if (!selectedAddress) {
      setErrorMessage("Please select a delivery address to proceed.");
      setAddressModalVisible(true);
      return;
    }

    if (items.length === 0) {
      router.push("/(tabs)/cart");
      return;
    }

    setIsProcessing(true);

    const sanitizePhone = (p?: string | null) => {
      if (!p) return "";
      const str = String(p).trim();
      if (
        str.startsWith("email_") ||
        str.startsWith("google_") ||
        str.includes("email") ||
        str.includes("@") ||
        /[a-zA-Z_]/.test(str)
      ) {
        return "";
      }
      const digits = str.replace(/\D/g, "");
      return digits.length >= 7 ? digits : "";
    };
    const checkoutPhone = sanitizePhone(selectedAddress?.phone) || sanitizePhone(user?.phone) || "";

    try {
      const orderPayloadItems = items.map((i) => ({
        productId: i.product.id,
        productName: i.product.name,
        variantId: i.variant?.id || "default",
        variantDetails: i.variant?.name || `${i.product.size} • ${i.product.finish}`,
        boxQuantity: i.quantity,
        pricePerBox: i.product.pricePerSqft,
        totalPrice: i.calculatedPrice,
        image: i.product.images?.[0] || "",
      }));

      if (paymentMethod === "cod") {
        // Place COD Order directly
        const res = await createCheckoutOrder({
          amount: total,
          paymentMethod: "cod",
          items: orderPayloadItems,
          shippingAddress: selectedAddress,
          customerName: user?.name || "Customer",
          customerPhone: checkoutPhone,
          customerEmail: user?.email || undefined,
          subtotal,
          deliveryFee,
          discount: 0,
        });

        if (res.success && res.order) {
          clearCart();
          setCompletedOrder(res.order);
        } else {
          setErrorMessage(res.error || "Failed to place COD order. Please try again.");
        }
      } else {
        // Online Payment Flow (Razorpay Native SDK)
        const res = await createCheckoutOrder({
          amount: total,
          paymentMethod: "online",
          items: orderPayloadItems,
          shippingAddress: selectedAddress,
          customerName: user?.name || "Customer",
          customerPhone: checkoutPhone,
          customerEmail: user?.email || undefined,
          subtotal,
          deliveryFee,
          discount: 0,
        });

        if (res.success && res.razorpayOrder) {
          const razorpayKey =
            res.razorpayOrder.key_id ||
            process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ||
            "rzp_test_51NVb089Lsz50d";

          const options = {
            description: `Order Payment for ${orderPayloadItems.length} item(s)`,
            image: "https://www.intrihub.com/favicon.png",
            currency: res.razorpayOrder.currency || "INR",
            key: razorpayKey,
            amount: res.razorpayOrder.amount || Math.round(total * 100),
            name: "Intrihub",
            order_id: res.razorpayOrder.order_id,
            prefill: {
              email: user?.email || "customer@intrihub.com",
              contact: checkoutPhone || "9999999999",
              name: user?.name || "Customer",
            },
            theme: { color: "#052A51" },
          };

          try {
            // Open Native Razorpay Checkout Modal
            const paymentData: any = await RazorpayCheckout.open(options);

            // Verify real cryptographic signature on backend
            const verifyRes = await verifyCheckoutPayment({
              razorpay_order_id: paymentData.razorpay_order_id,
              razorpay_payment_id: paymentData.razorpay_payment_id,
              razorpay_signature: paymentData.razorpay_signature,
              items: orderPayloadItems,
              shippingAddress: selectedAddress,
              customerName: user?.name || "Customer",
              customerPhone: checkoutPhone,
              customerEmail: user?.email || undefined,
              subtotal,
              deliveryFee,
              discount: 0,
              total,
            });

            if (verifyRes.success && verifyRes.order) {
              clearCart();
              setCompletedOrder(verifyRes.order);
            } else {
              setErrorMessage(
                verifyRes.error || "Payment received, but order verification failed. Please contact support."
              );
            }
          } catch (razorpayErr: any) {
            console.log("Razorpay Checkout Error:", razorpayErr);
            const userFriendlyError =
              razorpayErr?.description ||
              razorpayErr?.message ||
              (razorpayErr?.code === 0
                ? "Payment was cancelled. You can retry anytime."
                : "Payment authorization failed. Please try again.");
            setErrorMessage(userFriendlyError);
          }
        } else {
          setErrorMessage(res.error || "Could not initiate payment gateway.");
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || err.message || "Failed to complete checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Success Celebration View
  if (completedOrder) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIconCircle}>
          <CheckCircle2 size={56} color={COLORS.accentGreen} />
        </View>

        <Text style={styles.successHeading}>Order Placed Successfully!</Text>
        <Text style={styles.orderIdHighlight}>Order ID: #{completedOrder.id}</Text>

        <Text style={styles.successMessage}>
          Thank you for ordering with Intrihub. We have received your order and our supply partners
          are preparing your shipment.
        </Text>

        <View style={styles.successDetailsBox}>
          <View style={styles.successRow}>
            <Text style={styles.successKey}>Total Paid / Due</Text>
            <Text style={styles.successValue}>₹{completedOrder.total?.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successKey}>Payment Mode</Text>
            <Text style={styles.successValue}>
              {completedOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}
            </Text>
          </View>
          <View style={styles.successRow}>
            <Text style={styles.successKey}>Estimated Delivery</Text>
            <Text style={styles.successValue}>{completedOrder.estimatedDelivery || "3-5 Days"}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.trackOrderBtn}
          onPress={() =>
            router.push({
              pathname: "/order/[id]",
              params: { id: completedOrder.id },
            })
          }
          activeOpacity={0.85}
        >
          <Text style={styles.trackOrderText}>Track My Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueShopBtn}
          onPress={() => router.replace("/(tabs)/home")}
          activeOpacity={0.8}
        >
          <Text style={styles.continueShopText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Checkout</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Delivery Address Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <MapPin size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Delivery Address</Text>
            </View>
            <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
              <Text style={styles.changeText}>
                {selectedAddress ? "Change" : "Add Address"}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedAddress ? (
            <View style={styles.addressPreview}>
              <Text style={styles.addressLabel}>{selectedAddress.label || "Home"}</Text>
              <Text style={styles.addressStreet}>{selectedAddress.street}</Text>
              {selectedAddress.landmark ? (
                <Text style={styles.addressSub}>Near {selectedAddress.landmark}</Text>
              ) : null}
              <Text style={styles.addressCity}>
                {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyAddressPrompt}
              onPress={() => setAddressModalVisible(true)}
            >
              <Text style={styles.emptyAddressText}>+ Tap to select delivery address</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Order Items Review */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Package size={18} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Order Summary ({items.length} items)</Text>
            </View>
          </View>

          {items.map((item) => (
            <View key={item.id} style={styles.itemMiniRow}>
              <Image
                source={{
                  uri: getImageUrl(item.product.images?.[0]),
                }}
                style={styles.itemMiniImg}
                contentFit="cover"
              />
              <View style={styles.itemMiniInfo}>
                <Text style={styles.itemMiniTitle} numberOfLines={1}>
                  {item.product.name}
                </Text>
                <Text style={styles.itemMiniQty}>
                  Qty: {item.quantity} Box(es) • ₹{item.calculatedPrice.toLocaleString("en-IN")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Method Selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          {/* Razorpay Online */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "online" && styles.activePaymentOption]}
            onPress={() => setPaymentMethod("online")}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioOuter}>
                {paymentMethod === "online" && <View style={styles.radioInner} />}
              </View>
              <CreditCard size={20} color={COLORS.primary} style={{ marginLeft: 10 }} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.paymentName}>Online Payment (Razorpay)</Text>
                <Text style={styles.paymentSub}>UPI (GPay / PhonePe), Cards, NetBanking</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Cash on Delivery */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === "cod" && styles.activePaymentOption]}
            onPress={() => setPaymentMethod("cod")}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioOuter}>
                {paymentMethod === "cod" && <View style={styles.radioInner} />}
              </View>
              <Banknote size={20} color={COLORS.accentGreen} style={{ marginLeft: 10 }} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentSub}>Pay with cash/UPI upon site delivery</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Price Breakdown</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Subtotal</Text>
            <Text style={styles.summaryVal}>₹{subtotal.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Delivery Charges</Text>
            <Text style={[styles.summaryVal, deliveryFee === 0 && { color: COLORS.accentGreen }]}>
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalKey}>Grand Total</Text>
            <Text style={styles.totalVal}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        <View style={styles.trustBadge}>
          <ShieldCheck size={16} color={COLORS.primary} />
          <Text style={styles.trustBadgeText}>
            Guaranteed secure transactions with 256-bit encryption
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Checkout Bottom CTA */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barTotalLabel}>Total to Pay</Text>
          <Text style={styles.barTotalValue}>₹{total.toLocaleString("en-IN")}</Text>
        </View>

        <TouchableOpacity
          style={[styles.placeOrderBtn, isProcessing && { opacity: 0.7 }]}
          onPress={handlePlaceOrder}
          disabled={isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color={COLORS.textWhite} />
          ) : (
            <Text style={styles.placeOrderText}>
              {paymentMethod === "cod" ? "Place COD Order" : "Pay with Razorpay"}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Address Selection Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={(addr) => setSelectedAddress(addr)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
  },
  backBtn: {
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
  errorBanner: {
    backgroundColor: "#fee2e2",
    padding: 12,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 6,
  },
  changeText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
  },
  addressPreview: {
    backgroundColor: COLORS.surfaceSecondary,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  addressStreet: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  addressSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  addressCity: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyAddressPrompt: {
    paddingVertical: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: "center",
  },
  emptyAddressText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
  },
  itemMiniRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  itemMiniImg: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  itemMiniInfo: {
    marginLeft: 10,
    flex: 1,
  },
  itemMiniTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  itemMiniQty: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  paymentOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surfaceSecondary,
    padding: 12,
    borderRadius: RADIUS.md,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  activePaymentOption: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(5, 42, 81, 0.04)",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  paymentName: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  paymentSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
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
    marginVertical: 10,
  },
  totalKey: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  totalVal: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.primary,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  trustBadgeText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...SHADOWS.lg,
  },
  barTotalLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  barTotalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  placeOrderBtn: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    paddingHorizontal: 24,
  },
  placeOrderText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
  },
  successContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.primary,
  },
  orderIdHighlight: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.accentOrange,
    marginTop: 4,
  },
  successMessage: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 10,
    lineHeight: 18,
  },
  successDetailsBox: {
    width: "100%",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginVertical: 24,
  },
  successRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  successKey: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  successValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  trackOrderBtn: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    alignItems: "center",
  },
  trackOrderText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: "800",
  },
  continueShopBtn: {
    width: "100%",
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  continueShopText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
});
