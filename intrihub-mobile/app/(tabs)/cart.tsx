import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Trash2, Plus, Minus, ShieldCheck, ArrowRight, ShoppingBag, Truck } from "lucide-react-native";
import { useCartStore } from "../../src/store/cartStore";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { getImageUrl } from "../../src/constants/config";

export default function CartScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    items,
    removeItem,
    updateQuantity,
    getSubtotal,
    getDeliveryFee,
    getTotal,
    getItemCount,
  } = useCartStore();

  const subtotal = getSubtotal();
  const deliveryFee = getDeliveryFee();
  const total = getTotal();
  const itemCount = getItemCount();

  const freeDeliveryThreshold = 15000;
  const progressToFreeDelivery = Math.min(1, subtotal / freeDeliveryThreshold);
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/(auth)/login");
    } else {
      router.push("/checkout");
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <ShoppingBag size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Explore tiles, sanitaryware, paints, and building supplies
        </Text>
        <TouchableOpacity
          style={styles.shopNowBtn}
          onPress={() => router.push("/(tabs)/home")}
          activeOpacity={0.8}
        >
          <Text style={styles.shopNowText}>Start Shopping</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart ({itemCount})</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Free Delivery Banner */}
        <View style={styles.deliveryBanner}>
          <View style={styles.deliveryRow}>
            <Truck size={16} color={COLORS.accentGreen} />
            <Text style={styles.deliveryText}>
              {subtotal >= freeDeliveryThreshold ? (
                <Text style={styles.greenText}>You have unlocked FREE Standard Delivery!</Text>
              ) : (
                `Add ₹${remainingForFreeDelivery.toLocaleString("en-IN")} more for FREE Delivery`
              )}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressToFreeDelivery * 100}%` },
              ]}
            />
          </View>
        </View>

        {/* Cart Items List */}
        <View style={styles.itemsList}>
          {items.map((item) => {
            const mainImage = getImageUrl(item.product.images?.[0]);
            return (
              <View key={item.id} style={[styles.itemCard, SHADOWS.sm]}>
                <Image
                  source={{ uri: mainImage }}
                  style={styles.itemImage}
                  contentFit="cover"
                />

                <View style={styles.itemInfo}>
                  <View style={styles.itemTopRow}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.product.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeItem(item.id)}
                      style={styles.deleteBtn}
                    >
                      <Trash2 size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.itemVariant}>
                    {item.variant?.name || `${item.product.size} • ${item.product.finish}`}
                  </Text>

                  <View style={styles.itemBottomRow}>
                    <View>
                      <Text style={styles.itemPrice}>₹{item.calculatedPrice.toLocaleString("en-IN")}</Text>
                      <Text style={styles.unitPrice}>
                        ₹{item.product.pricePerSqft}/{item.product.unitOfSale}
                      </Text>
                    </View>

                    {/* Quantity Stepper */}
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                      <Text style={styles.stepQty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Bill Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Price Details</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items Subtotal</Text>
            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString("en-IN")}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={[styles.summaryValue, deliveryFee === 0 && styles.greenText]}>
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString("en-IN")}</Text>
          </View>
        </View>

        {/* Trust Note */}
        <View style={styles.trustRow}>
          <ShieldCheck size={16} color={COLORS.primary} />
          <Text style={styles.trustText}>
            Safe and Secure Payments with Razorpay • 100% Authentic Products
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barTotalLabel}>Total Amount</Text>
          <Text style={styles.barTotalValue}>₹{total.toLocaleString("en-IN")}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={handleCheckout}
          activeOpacity={0.85}
        >
          <Text style={styles.checkoutText}>
            {isAuthenticated ? "Proceed to Checkout" : "Sign In to Buy"}
          </Text>
          <ArrowRight size={16} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 10 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  scroll: {
    flex: 1,
  },
  deliveryBanner: {
    backgroundColor: COLORS.surface,
    padding: 12,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deliveryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  deliveryText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 6,
  },
  greenText: {
    color: COLORS.accentGreen,
    fontWeight: "800",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.full,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.accentGreen,
  },
  itemsList: {
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemImage: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    marginRight: 6,
  },
  deleteBtn: {
    padding: 2,
  },
  itemVariant: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  unitPrice: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepQty: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
    paddingHorizontal: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.primary,
  },
  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
  },
  trustText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 6,
    flexShrink: 1,
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
  checkoutBtn: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  checkoutText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
    marginRight: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  shopNowText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
  },
});
