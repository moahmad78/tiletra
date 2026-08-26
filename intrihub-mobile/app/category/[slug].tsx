import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, SlidersHorizontal } from "lucide-react-native";
import { ProductCard } from "../../src/components/ProductCard";
import { getProducts, getCategories } from "../../src/api/products";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

export default function CategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();

  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeSort, setActiveSort] = useState<"popular" | "price_asc" | "price_desc" | "rating">("popular");

  // Fetch category info to get subcategories
  const { data: catData } = useQuery({
    queryKey: ["mobile-categories"],
    queryFn: getCategories,
  });

  const category = catData?.categories.find((c) => c.slug === slug);
  const subcategories = category?.children || [];

  // Fetch Category Products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["mobile-category-products", slug, activeSubcategory, activeSort],
    queryFn: () =>
      getProducts({
        category: slug,
        subcategory: activeSubcategory || undefined,
        sort: activeSort,
        limit: 40,
      }),
    enabled: Boolean(slug),
  });

  const products = productsData?.products || [];

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.textWhite} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{category?.name || slug?.replace(/-/g, " ")}</Text>
      </View>

      {/* Subcategories Horizontal Bar */}
      {subcategories.length > 0 && (
        <View style={styles.subcatBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subcatScroll}>
            <TouchableOpacity
              style={[styles.subcatChip, !activeSubcategory && styles.activeSubcatChip]}
              onPress={() => setActiveSubcategory(null)}
            >
              <Text style={[styles.subcatText, !activeSubcategory && styles.activeSubcatText]}>
                All
              </Text>
            </TouchableOpacity>

            {subcategories.map((sub) => {
              const isSelected = activeSubcategory === sub.name || activeSubcategory === sub.slug;
              return (
                <TouchableOpacity
                  key={sub.id || sub.slug}
                  style={[styles.subcatChip, isSelected && styles.activeSubcatChip]}
                  onPress={() => setActiveSubcategory(sub.name)}
                >
                  <Text style={[styles.subcatText, isSelected && styles.activeSubcatText]}>
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Products Count & Sorting */}
      <View style={styles.sortRow}>
        <Text style={styles.countText}>{products.length} Products</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity
            style={[styles.sortPill, activeSort === "popular" && styles.activeSortPill]}
            onPress={() => setActiveSort("popular")}
          >
            <Text style={[styles.sortPillText, activeSort === "popular" && styles.activeSortPillText]}>
              Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, activeSort === "price_asc" && styles.activeSortPill]}
            onPress={() => setActiveSort("price_asc")}
          >
            <Text style={[styles.sortPillText, activeSort === "price_asc" && styles.activeSortPillText]}>
              Price ↑
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortPill, activeSort === "rating" && styles.activeSortPill]}
            onPress={() => setActiveSort("rating")}
          >
            <Text style={[styles.sortPillText, activeSort === "rating" && styles.activeSortPillText]}>
              Rating ★
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Products Grid */}
      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.gridCardWrapper}>
              <ProductCard product={item} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No products found in this category</Text>
              <Text style={styles.emptySub}>Check back soon or explore other categories</Text>
            </View>
          }
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
    fontSize: 17,
    fontWeight: "900",
    color: COLORS.textWhite,
    textTransform: "capitalize",
  },
  subcatBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
  },
  subcatScroll: {
    paddingHorizontal: SPACING.lg,
  },
  subcatChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  activeSubcatChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  subcatText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  activeSubcatText: {
    color: COLORS.textWhite,
  },
  sortRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  sortButtons: {
    flexDirection: "row",
  },
  sortPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 6,
  },
  activeSortPill: {
    backgroundColor: "rgba(5, 42, 81, 0.1)",
    borderColor: COLORS.primary,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  activeSortPillText: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 40,
  },
  gridCardWrapper: {
    width: "50%",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
});
