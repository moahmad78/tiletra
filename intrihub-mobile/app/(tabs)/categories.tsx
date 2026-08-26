import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Search, X, SlidersHorizontal, ArrowRight, Grid } from "lucide-react-native";
import { ProductCard } from "../../src/components/ProductCard";
import { getCategories, getProducts } from "../../src/api/products";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { Category, Product } from "../../src/types";

export default function CategoriesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [activeSort, setActiveSort] = useState<"popular" | "price_asc" | "price_desc" | "rating">("popular");

  // Fetch Categories
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ["mobile-categories"],
    queryFn: getCategories,
  });

  const categories = catData?.categories || [];

  // Search or Filtered Products Query
  const {
    data: productsData,
    isLoading: productsLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "mobile-browse-products",
      searchQuery,
      selectedCategory?.slug,
      activeSort,
    ],
    queryFn: () =>
      getProducts({
        q: searchQuery.trim() || undefined,
        category: selectedCategory?.slug,
        sort: activeSort,
        limit: 30,
      }),
  });

  const products = productsData?.products || [];
  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Top Search Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tiles, sanitaries, hardware..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Sort & Filter Pills */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, activeSort === "popular" && styles.activeFilterChip]}
            onPress={() => setActiveSort("popular")}
          >
            <Text style={[styles.filterChipText, activeSort === "popular" && styles.activeFilterChipText]}>
              Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeSort === "price_asc" && styles.activeFilterChip]}
            onPress={() => setActiveSort("price_asc")}
          >
            <Text style={[styles.filterChipText, activeSort === "price_asc" && styles.activeFilterChipText]}>
              Price: Low to High
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeSort === "price_desc" && styles.activeFilterChip]}
            onPress={() => setActiveSort("price_desc")}
          >
            <Text style={[styles.filterChipText, activeSort === "price_desc" && styles.activeFilterChipText]}>
              Price: High to Low
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeSort === "rating" && styles.activeFilterChip]}
            onPress={() => setActiveSort("rating")}
          >
            <Text style={[styles.filterChipText, activeSort === "rating" && styles.activeFilterChipText]}>
              Top Rated
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Search Mode: Full Grid */}
      {isSearching || selectedCategory ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {selectedCategory ? `${selectedCategory.name} • ` : ""}
              {products.length} Products Found
            </Text>
            {selectedCategory && (
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                style={styles.clearCatBtn}
              >
                <Text style={styles.clearCatText}>Clear Filter</Text>
              </TouchableOpacity>
            )}
          </View>

          {productsLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.productsList}
              renderItem={({ item }) => (
                <View style={styles.gridCardWrapper}>
                  <ProductCard product={item} />
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No matching products</Text>
                  <Text style={styles.emptySub}>Try adjusting your search query or filters</Text>
                </View>
              }
            />
          )}
        </View>
      ) : (
        /* Split View: Left Categories List, Right Subcategories / Direct Products */
        <View style={styles.splitLayout}>
          {/* Left Category Rail */}
          <View style={styles.leftRail}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {categories.map((cat: Category) => {
                return (
                  <TouchableOpacity
                    key={cat.id || cat.slug}
                    style={styles.categoryRailItem}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text
                      style={styles.categoryRailText}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Right Product Grid */}
          <View style={styles.rightContent}>
            {productsLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={products}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.productsList}
                renderItem={({ item }) => (
                  <View style={styles.gridCardWrapper}>
                    <ProductCard product={item} />
                  </View>
                )}
              />
            )}
          </View>
        </View>
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
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 12,
    paddingHorizontal: SPACING.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  filterRow: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  activeFilterChipText: {
    color: COLORS.textWhite,
  },
  splitLayout: {
    flex: 1,
    flexDirection: "row",
  },
  leftRail: {
    width: "28%",
    backgroundColor: COLORS.surfaceSecondary,
    borderRightWidth: 1,
    borderColor: COLORS.border,
  },
  categoryRailItem: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  activeRailItem: {
    backgroundColor: COLORS.surface,
    borderLeftWidth: 3,
    borderColor: COLORS.primary,
  },
  categoryRailText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  activeRailText: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  rightContent: {
    flex: 1,
    padding: SPACING.sm,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  clearCatBtn: {
    padding: 4,
  },
  clearCatText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  productsList: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 40,
  },
  gridCardWrapper: {
    width: "50%",
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 24,
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
