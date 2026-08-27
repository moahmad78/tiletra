import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Heart, Plus, Check, Star } from "lucide-react-native";
import { Product } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { getImageUrl } from "../constants/config";
import { useCartStore } from "../store/cartStore";
import { useWishlistStore } from "../store/wishlistStore";

interface ProductCardProps {
  product: Product;
  horizontal?: boolean;
}

// Unit suffix matching website lib/formatters.ts
function getPriceUnitSuffix(product: Product): string {
  const unit = (product.unitOfSale || "").toLowerCase().trim();
  const catSlug = (product.categorySlug || "").toLowerCase().trim();
  const catName = (product.categoryName || "").toLowerCase().trim();

  if (
    unit === "sqft" ||
    unit === "sq.ft" ||
    unit === "sq_ft" ||
    catSlug.includes("granite") ||
    catName.includes("granite")
  ) {
    return "sqft";
  }

  if (
    unit === "box" ||
    catSlug.includes("tile") ||
    catName.includes("tile") ||
    catSlug === "tiles-stone"
  ) {
    return "box";
  }

  return unit ? unit : "";
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, horizontal = false }) => {
  const router = useRouter();
  const { items, addItem } = useCartStore();
  const { isWishlisted, toggleWishlist } = useWishlistStore();

  const isAdded = items.some((i) => i.product.id === product.id);
  const wishlisted = isWishlisted(product.id);
  const mainImage = getImageUrl(product.images?.[0]);

  // Pricing calculation matching website getProductPriceInfo
  const defaultVariant = product.variants?.[0];
  const price =
    defaultVariant?.pricePerBox ||
    defaultVariant?.pricePerSqft ||
    product.pricePerSqft ||
    499;

  const existingMrp = defaultVariant?.mrp ?? product.mrp ?? null;
  let mrp: number | null = null;
  if (existingMrp !== null && Number(existingMrp) > price) {
    mrp = Number(existingMrp);
  } else {
    // Default retail benchmark MRP (+30% rounded)
    mrp = Math.round(price * 1.3);
  }

  const hasDiscount = mrp !== null && mrp > price;
  const discountPercent = hasDiscount && mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const unitSuffix = getPriceUnitSuffix(product);

  const formattedPrice = "₹" + price.toLocaleString("en-IN");
  const formattedMrp = mrp ? "₹" + mrp.toLocaleString("en-IN") : null;

  // Specification text line
  const specParts = [
    product.size || defaultVariant?.size || "Standard",
    product.finish || defaultVariant?.finish || "Glossy",
    product.material || "Vitrified",
  ].filter(Boolean);
  const specText = specParts.join(" · ");

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    addItem(product, defaultVariant || null, 1);
  };

  const handleToggleWishlist = (e: any) => {
    e.stopPropagation?.();
    toggleWishlist(product);
  };

  // Horizontal Card (e.g. Trending Carousel on Home)
  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontalContainer, SHADOWS.sm]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.horizontalImageWrapper}>
          <Image source={{ uri: mainImage }} style={styles.horizontalImage} contentFit="cover" transition={200} />
          {/* Wishlist Heart */}
          <TouchableOpacity
            style={styles.horizontalWishlistBtn}
            onPress={handleToggleWishlist}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={14}
              color={wishlisted ? "#ef4444" : "#64748b"}
              fill={wishlisted ? "#ef4444" : "transparent"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.horizontalInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.specText} numberOfLines={1}>
            {specText}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formattedPrice}</Text>
            {unitSuffix ? <Text style={styles.unit}>/{unitSuffix}</Text> : null}
            {formattedMrp && <Text style={styles.mrp}>{formattedMrp}</Text>}
            {discountPercent > 0 && (
              <Text style={styles.discountTextGreen}>{discountPercent}% off</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Standard Vertical Grid Card
  return (
    <TouchableOpacity style={[styles.container, SHADOWS.sm]} onPress={handlePress} activeOpacity={0.9}>
      {/* Image Container + Badges */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: mainImage }} style={styles.image} contentFit="cover" transition={200} />

        {/* Top Badges (TOP / Bestseller) */}
        {(product.isBestseller || product.isTrending) && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>TOP</Text>
          </View>
        )}

        {/* Wishlist Heart Button (Top-Right) */}
        <TouchableOpacity
          style={styles.wishlistButton}
          onPress={handleToggleWishlist}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Heart
            size={16}
            color={wishlisted ? "#ef4444" : "#475569"}
            fill={wishlisted ? "#ef4444" : "transparent"}
          />
        </TouchableOpacity>
      </View>

      {/* Info Content */}
      <View style={styles.infoWrapper}>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.specText} numberOfLines={1}>
          {specText}
        </Text>

        {/* Rating Row (if rating exists) */}
        {product.rating ? (
          <View style={styles.ratingRow}>
            <Star size={11} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingValue}>{product.rating.toFixed(1)}</Text>
            {product.reviewCount ? (
              <Text style={styles.reviewCount}>({product.reviewCount})</Text>
            ) : null}
          </View>
        ) : null}

        {/* Price Row & Add Button */}
        <View style={styles.bottomRow}>
          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formattedPrice}</Text>
              {unitSuffix ? <Text style={styles.unit}>/{unitSuffix}</Text> : null}
            </View>
            <View style={styles.subPriceRow}>
              {formattedMrp && <Text style={styles.mrp}>{formattedMrp}</Text>}
              {discountPercent > 0 && (
                <Text style={styles.discountTextGreen}>{discountPercent}% off</Text>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addButton, isAdded && styles.addedButton]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            {isAdded ? (
              <Check size={16} color={COLORS.textWhite} />
            ) : (
              <Plus size={16} color={COLORS.textWhite} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: "hidden",
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
    marginHorizontal: 4,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 145,
    backgroundColor: COLORS.surfaceSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  topBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.full,
    zIndex: 2,
  },
  topBadgeText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  wishlistButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryPill: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    maxWidth: "75%",
    zIndex: 2,
  },
  categoryPillText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  infoWrapper: {
    padding: 10,
    flex: 1,
    justifyContent: "space-between",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.primary,
    lineHeight: 17,
    marginBottom: 3,
  },
  specText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingValue: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
    marginLeft: 3,
  },
  reviewCount: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginLeft: 2,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.04)",
  },
  priceContainer: {
    flex: 1,
    marginRight: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.3,
  },
  unit: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: 1,
  },
  subPriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
    flexWrap: "wrap",
  },
  mrp: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
    marginRight: 5,
  },
  discountTextGreen: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#059669", // Emerald green
  },
  addButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addedButton: {
    backgroundColor: COLORS.accentGreen,
  },
  horizontalContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 8,
    marginRight: 12,
    width: 250,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  horizontalImageWrapper: {
    position: "relative",
    width: 76,
    height: 76,
  },
  horizontalImage: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  horizontalWishlistBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.accentOrange,
    textTransform: "uppercase",
    marginBottom: 2,
  },
});
