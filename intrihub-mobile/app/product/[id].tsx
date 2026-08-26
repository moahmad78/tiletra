import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Calculator,
  ShoppingBag,
  Building,
  Check,
} from "lucide-react-native";
import { getProductDetails } from "../../src/api/products";
import { useCartStore } from "../../src/store/cartStore";
import { useWishlistStore } from "../../src/store/wishlistStore";
import { ProductVariant } from "../../src/types";
import { ProductCard } from "../../src/components/ProductCard";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { getImageUrl } from "../../src/constants/config";

const { width } = Dimensions.get("window");

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addItem, getItemCount } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [calculatorArea, setCalculatorArea] = useState("");
  const [calculatedBoxes, setCalculatedBoxes] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["mobile-product-details", id],
    queryFn: () => getProductDetails(id),
    enabled: Boolean(id),
  });

  const product = data?.product;
  const wishlisted = isWishlisted(product?.id || "");
  const relatedProducts = data?.relatedProducts || [];
  const cartItemCount = getItemCount();

  const rawImages =
    product?.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800"];
  const images = rawImages.map((img) => getImageUrl(img));

  const handleCalculateBoxes = (text: string) => {
    setCalculatorArea(text);
    const sqft = parseFloat(text);
    if (!isNaN(sqft) && sqft > 0) {
      const coverageRate = product?.coverageRate || 15.5; // default sqft per box
      const wastage = product?.wastageFactor || 1.1; // 10% buffer
      const requiredBoxes = Math.ceil((sqft * wastage) / coverageRate);
      setCalculatedBoxes(requiredBoxes);
      setQuantity(requiredBoxes);
    } else {
      setCalculatedBoxes(null);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, selectedVariant || product.variants?.[0] || null, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addItem(product, selectedVariant || product.variants?.[0] || null, quantity);
    router.push("/(tabs)/cart");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorTitle}>Product Not Found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discountPercent =
    product.mrp && product.mrp > product.pricePerSqft
      ? Math.round(((product.mrp - product.pricePerSqft) / product.mrp) * 100)
      : null;

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.navIconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.navRight}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => toggleWishlist(product)}
          >
            <Heart
              size={22}
              color={wishlisted ? "#ef4444" : COLORS.text}
              fill={wishlisted ? "#ef4444" : "transparent"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <ShoppingBag size={22} color={COLORS.text} />
            {cartItemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(slide);
            }}
          >
            {images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.galleryImage} contentFit="cover" />
            ))}
          </ScrollView>

          {/* Dots Indicator */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.galleryDot,
                    activeImageIndex === idx && styles.activeGalleryDot,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Header */}
        <View style={styles.detailsCard}>
          {/* Category / Seller Badge */}
          <Text style={styles.vendorLabel}>
            {product.categoryName || "Intrihub Direct"}
          </Text>

          <Text style={styles.productName}>{product.name}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{product.rating?.toFixed(1) || "4.8"}</Text>
            </View>
            <Text style={styles.ratingCount}>({product.reviewCount || 12} Verified Reviews)</Text>
          </View>

          {/* Pricing */}
          <View style={styles.pricingRow}>
            <Text style={styles.pricePerSqft}>₹{product.pricePerSqft}</Text>
            <Text style={styles.unitText}>/{product.unitOfSale}</Text>

            {product.mrp && product.mrp > product.pricePerSqft && (
              <Text style={styles.mrpText}>₹{product.mrp}</Text>
            )}

            {discountPercent !== null && (
              <View style={styles.discountPill}>
                <Text style={styles.discountText}>{discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          <Text style={styles.taxNote}>Inclusive of all taxes • Bulk pricing available</Text>
        </View>

        {/* Tile / Area Calculator Tool */}
        <View style={styles.calculatorCard}>
          <View style={styles.calcHeader}>
            <Calculator size={18} color={COLORS.primary} />
            <Text style={styles.calcTitle}>Area & Box Calculator</Text>
          </View>
          <Text style={styles.calcSub}>
            Enter your floor or wall area to auto-calculate required boxes (includes 10% cutting wastage)
          </Text>

          <View style={styles.calcInputRow}>
            <TextInput
              style={styles.calcInput}
              placeholder="e.g. 250"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={calculatorArea}
              onChangeText={handleCalculateBoxes}
            />
            <Text style={styles.calcUnit}>sq.ft</Text>
          </View>

          {calculatedBoxes !== null && (
            <View style={styles.calcResultBox}>
              <Text style={styles.calcResultText}>
                Required: <Text style={styles.boldPrimary}>{calculatedBoxes} Boxes</Text>
              </Text>
              <Text style={styles.calcResultSub}>
                Estimated: ₹{(calculatedBoxes * (product.pricePerSqft * (product.coverageRate || 15.5))).toLocaleString("en-IN")}
              </Text>
            </View>
          )}
        </View>

        {/* Variants Selector */}
        {product.variants && product.variants.length > 0 && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Available Sizes & Finishes</Text>
            <View style={styles.variantsRow}>
              {product.variants.map((v) => {
                const isSelected =
                  selectedVariant?.id === v.id || (!selectedVariant && v.id === product.variants![0].id);
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.variantChip, isSelected && styles.activeVariantChip]}
                    onPress={() => setSelectedVariant(v)}
                  >
                    <Text
                      style={[
                        styles.variantChipText,
                        isSelected && styles.activeVariantChipText,
                      ]}
                    >
                      {v.name || `${v.size} - ${v.finish}`}
                    </Text>
                    {v.pricePerSqft && (
                      <Text
                        style={[
                          styles.variantPriceText,
                          isSelected && styles.activeVariantPriceText,
                        ]}
                      >
                        ₹{v.pricePerSqft}/sq.ft
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Product Specifications */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Specifications</Text>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Category</Text>
            <Text style={styles.specValue}>{product.categoryName}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Material</Text>
            <Text style={styles.specValue}>{product.material}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Finish</Text>
            <Text style={styles.specValue}>{product.finish}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Dimensions</Text>
            <Text style={styles.specValue}>{product.size}</Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Thickness</Text>
            <Text style={styles.specValue}>{product.thickness}</Text>
          </View>
          {product.look ? (
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Look & Feel</Text>
              <Text style={styles.specValue}>{product.look}</Text>
            </View>
          ) : null}
        </View>

        {/* Description */}
        {product.description ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Product Overview</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        ) : null}

        {/* Vendor Card */}
        {product.vendor && (
          <View style={styles.vendorCard}>
            <Building size={24} color={COLORS.primary} />
            <View style={styles.vendorInfo}>
              <Text style={styles.vendorCardTitle}>Sold & Fulfilled by</Text>
              <Text style={styles.vendorCardName}>{product.vendor.businessName}</Text>
              <Text style={styles.vendorCardSub}>Verified Intrihub Marketplace Seller</Text>
            </View>
          </View>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.sectionHeading}>Similar Products</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p as any} horizontal />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Added to Cart Toast Notification */}
      {addedToast && (
        <View style={styles.toast}>
          <Check size={16} color={COLORS.textWhite} />
          <Text style={styles.toastText}>Added to cart successfully!</Text>
        </View>
      )}

      {/* Sticky Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cartActionBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <ShoppingBag size={18} color={COLORS.primary} />
          <Text style={styles.cartActionText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyActionBtn}
          onPress={handleBuyNow}
          activeOpacity={0.85}
        >
          <Text style={styles.buyActionText}>Buy Now</Text>
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
  loadingContainer: {
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
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  backBtnText: {
    color: COLORS.textWhite,
    fontWeight: "700",
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 6 : 12,
    paddingBottom: 10,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  navRight: {
    flexDirection: "row",
  },
  cartBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "800",
  },
  scroll: {
    flex: 1,
  },
  galleryWrapper: {
    width,
    height: 320,
    backgroundColor: COLORS.surfaceSecondary,
    position: "relative",
  },
  galleryImage: {
    width,
    height: 320,
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 3,
  },
  activeGalleryDot: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  detailsCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  vendorLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  productName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 24,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#b45309",
    marginLeft: 3,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
  },
  pricePerSqft: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 2,
  },
  mrpText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
    marginLeft: 10,
  },
  discountPill: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    marginLeft: 10,
  },
  discountText: {
    color: COLORS.textWhite,
    fontSize: 11,
    fontWeight: "800",
  },
  taxNote: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  calculatorCard: {
    backgroundColor: "rgba(5, 42, 81, 0.04)",
    margin: SPACING.lg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.12)",
  },
  calcHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 6,
  },
  calcSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 15,
  },
  calcInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  calcInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 120,
  },
  calcUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  calcResultBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  calcResultText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  boldPrimary: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  calcResultSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 10,
  },
  variantsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  variantChip: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginRight: 8,
    marginBottom: 8,
  },
  activeVariantChip: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
  },
  variantChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  activeVariantChipText: {
    color: COLORS.primary,
  },
  variantPriceText: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  activeVariantPriceText: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.borderLight,
  },
  specKey: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  specValue: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  vendorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  vendorInfo: {
    marginLeft: 12,
  },
  vendorCardTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  vendorCardName: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  vendorCardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  relatedSection: {
    padding: SPACING.lg,
  },
  toast: {
    position: "absolute",
    bottom: 74,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    ...SHADOWS.md,
  },
  toastText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "700",
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
    paddingVertical: 10,
    flexDirection: "row",
    ...SHADOWS.lg,
  },
  cartActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginRight: 10,
  },
  cartActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginLeft: 6,
  },
  buyActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
  },
  buyActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
});
