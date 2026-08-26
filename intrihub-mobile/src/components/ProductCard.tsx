import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Star, Plus, Check } from "lucide-react-native";
import { Product } from "../types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../constants/theme";
import { useCartStore } from "../store/cartStore";

interface ProductCardProps {
  product: Product;
  horizontal?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, horizontal = false }) => {
  const router = useRouter();
  const { items, addItem } = useCartStore();

  const isAdded = items.some((i) => i.product.id === product.id);
  const mainImage = product.images?.[0] || "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=600";

  // Calculate discount percentage
  const discountPercent =
    product.mrp && product.mrp > product.pricePerSqft
      ? Math.round(((product.mrp - product.pricePerSqft) / product.mrp) * 100)
      : null;

  const handlePress = () => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (e: any) => {
    e.stopPropagation?.();
    addItem(product, product.variants?.[0] || null, 1);
  };

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontalContainer, SHADOWS.sm]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Image source={{ uri: mainImage }} style={styles.horizontalImage} contentFit="cover" transition={200} />
        <View style={styles.horizontalInfo}>
          <Text style={styles.vendorName} numberOfLines={1}>
            {product.vendor?.businessName || "Intrihub Direct"}
          </Text>
          <Text style={styles.title} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.specText} numberOfLines={1}>
            {product.size} • {product.finish}
          </Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{product.pricePerSqft}</Text>
            <Text style={styles.unit}>/{product.unitOfSale}</Text>
            {product.mrp && product.mrp > product.pricePerSqft && (
              <Text style={styles.mrp}>₹{product.mrp}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={[styles.container, SHADOWS.sm]} onPress={handlePress} activeOpacity={0.9}>
      {/* Image Container + Badges */}
      <View style={styles.imageWrapper}>
        <Image source={{ uri: mainImage }} style={styles.image} contentFit="cover" transition={200} />

        {/* Discount Badge */}
        {discountPercent !== null && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{discountPercent}% OFF</Text>
          </View>
        )}

        {/* Rating Pill */}
        <View style={styles.ratingPill}>
          <Star size={11} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.ratingText}>{product.rating?.toFixed(1) || "4.8"}</Text>
        </View>
      </View>

      {/* Info Content */}
      <View style={styles.infoWrapper}>
        <Text style={styles.vendorName} numberOfLines={1}>
          {product.vendor?.businessName || "Intrihub Direct"}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.specText} numberOfLines={1}>
          {product.size} • {product.finish}
        </Text>

        {/* Price & Add Button */}
        <View style={styles.bottomRow}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{product.pricePerSqft}</Text>
              <Text style={styles.unit}>/{product.unitOfSale}</Text>
            </View>
            {product.mrp && product.mrp > product.pricePerSqft && (
              <Text style={styles.mrp}>MRP ₹{product.mrp}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.addButton, isAdded && styles.addedButton]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            {isAdded ? (
              <Check size={16} color={COLORS.textWhite} />
            ) : (
              <Plus size={16} color={COLORS.primary} />
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
    height: 140,
    backgroundColor: COLORS.surfaceSecondary,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  discountText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "800",
  },
  ratingPill: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  ratingText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: "700",
    marginLeft: 3,
  },
  infoWrapper: {
    padding: 10,
  },
  vendorName: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 17,
    marginBottom: 4,
  },
  specText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  unit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 1,
  },
  mrp: {
    fontSize: 10,
    color: COLORS.textMuted,
    textDecorationLine: "line-through",
    marginTop: -2,
  },
  addButton: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  addedButton: {
    backgroundColor: COLORS.accentGreen,
    borderColor: COLORS.accentGreen,
  },
  horizontalContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: 8,
    marginRight: 12,
    width: 240,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  horizontalImage: {
    width: 70,
    height: 70,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  horizontalInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: "center",
  },
});
