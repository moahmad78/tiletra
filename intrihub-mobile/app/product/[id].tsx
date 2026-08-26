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
  FlatList,
  Share,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Share2,
  Heart,
  Star,
  ShieldCheck,
  Truck,
  Calculator,
  ShoppingBag,
  Check,
  Sparkles,
} from "lucide-react-native";
import { getProductDetails, getProducts } from "../../src/api/products";
import { useCartStore } from "../../src/store/cartStore";
import { useWishlistStore } from "../../src/store/wishlistStore";
import { Product, ProductVariant } from "../../src/types";
import { ProductCard } from "../../src/components/ProductCard";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { getImageUrl } from "../../src/constants/config";

const { width } = Dimensions.get("window");

function getPriceUnitSuffix(product: any): string {
  const unit = (product?.unitOfSale || "").toLowerCase().trim();
  const catSlug = (product?.categorySlug || "").toLowerCase().trim();
  const catName = (product?.categoryName || "").toLowerCase().trim();

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

  // 1. Fetch Current Product Details
  const { data, isLoading, error } = useQuery({
    queryKey: ["mobile-product-details", id],
    queryFn: () => getProductDetails(id),
    enabled: Boolean(id),
  });

  const product = data?.product;
  const wishlisted = isWishlisted(product?.id || "");
  const cartItemCount = getItemCount();

  // 2. Fetch Similar Products in the same category (excludes current product)
  const { data: similarData, isLoading: similarLoading } = useQuery({
    queryKey: ["mobile-similar-products", product?.categorySlug, id],
    queryFn: () => getProducts({ category: product?.categorySlug, limit: 14 }),
    enabled: Boolean(product?.categorySlug),
  });

  const similarProducts = (similarData?.products || []).filter(
    (p: Product) => p.id !== id
  );

  // 3. Infinite Query for Full Catalog Below (You May Also Like)
  const {
    data: infiniteCatalogData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["mobile-explore-catalog-infinite", id],
    queryFn: ({ pageParam = 1 }) => getProducts({ page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const catalogProducts =
    infiniteCatalogData?.pages.flatMap((page) => page.products) || [];

  // Pricing calculation matching Home page ProductCard
  const activeVariant = selectedVariant || product?.variants?.[0] || null;
  const price =
    activeVariant?.pricePerBox ||
    activeVariant?.pricePerSqft ||
    product?.pricePerSqft ||
    499;

  const existingMrp = activeVariant?.mrp ?? product?.mrp ?? null;
  let mrp: number | null = null;
  if (existingMrp !== null && Number(existingMrp) > price) {
    mrp = Number(existingMrp);
  } else {
    mrp = Math.round(price * 1.3);
  }

  const hasDiscount = mrp !== null && mrp > price;
  const discountPercent = hasDiscount && mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const unitSuffix = product ? getPriceUnitSuffix(product) : "";

  const formattedPrice = "₹" + price.toLocaleString("en-IN");
  const formattedMrp = mrp ? "₹" + mrp.toLocaleString("en-IN") : null;

  const rawImages =
    product?.images && product.images.length > 0
      ? product.images
      : ["https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=800"];
  const images = rawImages.map((img) => getImageUrl(img));

  const handleCalculateBoxes = (text: string) => {
    setCalculatorArea(text);
    const sqft = parseFloat(text);
    if (!isNaN(sqft) && sqft > 0) {
      const coverageRate = product?.coverageRate || 15.5;
      const wastage = product?.wastageFactor || 1.1;
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

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Check out ${product.name} on Intrihub: https://www.intrihub.com/product/${product.id}`,
        title: product.name,
      });
    } catch {}
  };

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
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

  // Header component for primary FlatList
  const renderHeader = () => (
    <View>
      {/* Product Image Gallery */}
      <View style={styles.galleryWrapper}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const slide = Math.round(e.nativeEvent.contentOffset.x / width);
            setActiveImageIndex(slide);
          }}
          scrollEventThrottle={16}
        >
          {images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={styles.galleryImage}
              contentFit="cover"
            />
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

      {/* Product Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.categoryBadge}>
          {product.categoryName || "Direct Supply"}
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

        {/* Pricing Row matching Home Page */}
        <View style={styles.pricingRow}>
          <Text style={styles.pricePerSqft}>{formattedPrice}</Text>
          {unitSuffix ? <Text style={styles.unitText}>/{unitSuffix}</Text> : null}

          {formattedMrp && (
            <Text style={styles.mrpText}>{formattedMrp}</Text>
          )}

          {discountPercent > 0 && (
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        <Text style={styles.taxNote}>Inclusive of all taxes • Factory Direct Pricing</Text>
      </View>

      {/* Area & Box Calculator Tool */}
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

      {/* Available Sizes & Finishes (Variants) */}
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

      {/* Product Overview Description */}
      {product.description ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>Product Overview</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>
        </View>
      ) : null}

      {/* TASK 1: Similar Products Horizontal Carousel (Same Category, excludes current) */}
      {similarProducts.length > 0 && (
        <View style={styles.similarSection}>
          <View style={styles.similarSectionHeader}>
            <View>
              <Text style={styles.sectionHeading}>Similar Products</Text>
              <Text style={styles.similarSub}>
                More choices in {product.categoryName || "this category"}
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.similarScrollContent}
          >
            {similarProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} horizontal />
            ))}
          </ScrollView>
        </View>
      )}

      {/* TASK 2: Explore More Products Header */}
      <View style={styles.exploreCatalogHeader}>
        <View style={styles.exploreCatalogTitleRow}>
          <Sparkles size={16} color={COLORS.accentOrange} style={{ marginRight: 6 }} />
          <Text style={styles.exploreCatalogTitle}>You May Also Like</Text>
        </View>
        <Text style={styles.exploreCatalogSubtitle}>
          Explore full construction & interior supply catalog
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Floating Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.navRight}>
          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={19} color={COLORS.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => product && toggleWishlist(product as any)}
            activeOpacity={0.8}
          >
            <Heart
              size={20}
              color={wishlisted ? COLORS.accentRed : COLORS.text}
              fill={wishlisted ? COLORS.accentRed : "none"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navIconBtn}
            onPress={() => router.push("/(tabs)/cart")}
            activeOpacity={0.8}
          >
            <ShoppingBag size={20} color={COLORS.text} />
            {cartItemCount > 0 && (
              <View style={styles.navBadge}>
                <Text style={styles.navBadgeText}>{cartItemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Root Infinite-Scroll FlatList (Zero Nesting Conflict) */}
      <FlatList
        data={catalogProducts}
        keyExtractor={(item: Product, idx) => `${item.id}-${idx}`}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }: { item: Product }) => (
          <View style={styles.gridCardWrapper}>
            <ProductCard product={item} />
          </View>
        )}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footerContainer}>
            {isFetchingNextPage ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.footerLoadingText}>Loading more products...</Text>
              </View>
            ) : !hasNextPage && catalogProducts.length > 0 ? (
              <Text style={styles.endOfListText}>
                You've reached the end of the collection
              </Text>
            ) : null}
            <View style={{ height: 90 }} />
          </View>
        }
      />

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
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 6 : 14,
    paddingBottom: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 50,
  },
  navIconBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  navRight: {
    flexDirection: "row",
    gap: 8,
  },
  navBadge: {
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
  navBadgeText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "900",
  },
  listContent: {
    paddingBottom: 30,
  },
  galleryWrapper: {
    width,
    height: width * 0.9,
    backgroundColor: COLORS.surfaceSecondary,
    position: "relative",
  },
  galleryImage: {
    width,
    height: width * 0.9,
  },
  dotsRow: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
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
  categoryBadge: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentOrange,
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
    backgroundColor: "#059669",
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
    margin: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.1)",
  },
  calcHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  calcTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  calcSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginBottom: 10,
    lineHeight: 16,
  },
  calcInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calcInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  calcUnit: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  calcResultBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(5, 42, 81, 0.08)",
  },
  calcResultText: {
    fontSize: 13,
    color: COLORS.text,
  },
  boldPrimary: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  calcResultSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  variantsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  variantChip: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  activeVariantChip: {
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    borderColor: COLORS.primary,
  },
  variantChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
  },
  activeVariantChipText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  variantPriceText: {
    fontSize: 10.5,
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
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  specKey: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  specValue: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.text,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Similar Products Carousel
  similarSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  similarSectionHeader: {
    paddingHorizontal: SPACING.md,
    marginBottom: 10,
  },
  similarSub: {
    fontSize: 11.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  similarScrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: 4,
  },

  // Explore Catalog Header (Infinite Scroll)
  exploreCatalogHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: 12,
    paddingBottom: 8,
  },
  exploreCatalogTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  exploreCatalogTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.primary,
  },
  exploreCatalogSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  gridCardWrapper: {
    flex: 1,
    padding: 4,
    maxWidth: "50%",
  },
  footerContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 16,
  },
  footerLoading: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerLoadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  endOfListText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
    paddingVertical: 8,
  },

  // Sticky Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    paddingHorizontal: SPACING.md,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
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
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  cartActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  buyActionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  buyActionText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
  toast: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    gap: 8,
    ...SHADOWS.md,
    zIndex: 999,
  },
  toastText: {
    color: COLORS.textWhite,
    fontWeight: "700",
    fontSize: 13,
  },
});
