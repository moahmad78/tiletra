import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react-native";
import { ProductCard } from "../src/components/ProductCard";
import { useWishlistStore } from "../src/store/wishlistStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../src/constants/theme";
import { Product } from "../src/types";

export default function WishlistScreen() {
  const router = useRouter();
  const { items } = useWishlistStore();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <Text style={styles.headerSubtitle}>{items.length} {items.length === 1 ? "item" : "items"} saved</Text>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Heart size={40} color={COLORS.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Your Wishlist is Empty</Text>
          <Text style={styles.emptySubtitle}>
            Save your favorite tiles, adhesives, and interior materials to view or buy later.
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push("/(tabs)/categories")}
            activeOpacity={0.85}
          >
            <ShoppingBag size={16} color={COLORS.textWhite} style={{ marginRight: 6 }} />
            <Text style={styles.exploreButtonText}>Explore Catalog</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: Product) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: Product }) => (
            <View style={styles.gridCardWrapper}>
              <ProductCard product={item} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 16,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  listContent: {
    padding: SPACING.sm,
    paddingBottom: SPACING.xl,
  },
  gridCardWrapper: {
    width: "50%",
    paddingHorizontal: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  exploreButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
  },
});
