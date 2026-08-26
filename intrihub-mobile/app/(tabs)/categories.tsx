import React, { useState, useRef, useEffect } from "react";
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
  Modal,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Search, X, SlidersHorizontal, Check, RefreshCw } from "lucide-react-native";
import { ProductCard } from "../../src/components/ProductCard";
import { AnimatedSearchPlaceholder } from "../../src/components/AnimatedSearchPlaceholder";
import { getCategories, getProducts } from "../../src/api/products";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { Category, Product } from "../../src/types";

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; q?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState(params?.q || "");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCategory, setTempCategory] = useState<Category | null>(null);
  const [activeSort, setActiveSort] = useState<"popular" | "price_asc" | "price_desc" | "rating">("popular");

  // Auto-focus when navigated from header or search icon
  useEffect(() => {
    if (params?.focus === "true") {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [params?.focus]);

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
        limit: 40,
      }),
  });

  const products = productsData?.products || [];

  const handleOpenModal = () => {
    setTempCategory(selectedCategory);
    setModalVisible(true);
  };

  const handleApplyCategory = () => {
    setSelectedCategory(tempCategory);
    setModalVisible(false);
  };

  const handleClearCategory = () => {
    setSelectedCategory(null);
    setTempCategory(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Search Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.searchBar}
          activeOpacity={1}
          onPress={() => inputRef.current?.focus()}
        >
          <Search size={18} color={COLORS.textMuted} style={{ marginRight: 6 }} />
          {/* Animated placeholder when empty & not focused */}
          {!isSearchFocused && !searchQuery ? (
            <View style={styles.placeholderTouch} pointerEvents="none">
              <AnimatedSearchPlaceholder />
            </View>
          ) : null}
          <TextInput
            ref={inputRef}
            style={[
              styles.searchInput,
              !isSearchFocused && !searchQuery ? styles.hiddenInput : null,
            ]}
            placeholder={isSearchFocused ? "Search tiles, sanitaries, adhesives..." : ""}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Horizontal Sort & Filter Bar (E-Commerce Standard) */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {/* 1. Category Filter Button (Leading) */}
          <TouchableOpacity
            style={[
              styles.categoryFilterBtn,
              Boolean(selectedCategory) && styles.categoryFilterBtnActive,
            ]}
            onPress={handleOpenModal}
            activeOpacity={0.85}
          >
            <SlidersHorizontal
              size={13}
              color={selectedCategory ? COLORS.textWhite : COLORS.primary}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.categoryFilterBtnText,
                Boolean(selectedCategory) && styles.categoryFilterBtnTextActive,
              ]}
              numberOfLines={1}
            >
              {selectedCategory ? selectedCategory.name : "Categories"}
            </Text>
          </TouchableOpacity>

          {/* 2. Sort Chips */}
          <TouchableOpacity
            style={[styles.sortChip, activeSort === "popular" && styles.activeSortChip]}
            onPress={() => setActiveSort("popular")}
          >
            <Text style={[styles.sortChipText, activeSort === "popular" && styles.activeSortChipText]}>
              Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, activeSort === "price_asc" && styles.activeSortChip]}
            onPress={() => setActiveSort("price_asc")}
          >
            <Text style={[styles.sortChipText, activeSort === "price_asc" && styles.activeSortChipText]}>
              Price: Low to High
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, activeSort === "price_desc" && styles.activeSortChip]}
            onPress={() => setActiveSort("price_desc")}
          >
            <Text style={[styles.sortChipText, activeSort === "price_desc" && styles.activeSortChipText]}>
              Price: High to Low
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sortChip, activeSort === "rating" && styles.activeSortChip]}
            onPress={() => setActiveSort("rating")}
          >
            <Text style={[styles.sortChipText, activeSort === "rating" && styles.activeSortChipText]}>
              Top Rated
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Active Filter Tag & Count Header */}
      <View style={styles.resultsInfoRow}>
        <Text style={styles.resultsCountText}>
          {productsLoading
            ? "Searching products..."
            : (productsData as any)?.isFallback
            ? `Top results related to "${searchQuery}"`
            : searchQuery.trim()
            ? `${products.length} Products found for "${searchQuery}"`
            : `${products.length} Products`}
        </Text>

        {selectedCategory && (
          <TouchableOpacity
            style={styles.activeFilterTag}
            onPress={handleClearCategory}
            activeOpacity={0.8}
          >
            <Text style={styles.activeFilterTagText}>{selectedCategory.name}</Text>
            <X size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}
      </View>

      {/* Full-Width 2-Column Product Grid (No Sidebar!) */}
      {productsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item: Product) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productListContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: Product }) => (
            <View style={styles.gridCardWrapper}>
              <ProductCard product={item} />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No matching products</Text>
              <Text style={styles.emptySub}>
                Try adjusting your search query or removing the category filter
              </Text>
              {selectedCategory && (
                <TouchableOpacity style={styles.resetBtn} onPress={handleClearCategory}>
                  <Text style={styles.resetBtnText}>Clear Category Filter</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      {/* Category Filter Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />

          <View style={styles.modalContent}>
            {/* Modal Drag Bar */}
            <View style={styles.dragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Filter by Category</Text>
                <Text style={styles.modalSub}>Select a category to refine products</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Categories List */}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {/* All Categories Option */}
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  tempCategory === null && styles.modalItemActive,
                ]}
                onPress={() => setTempCategory(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    tempCategory === null && styles.modalItemTextActive,
                  ]}
                >
                  All Categories
                </Text>
                {tempCategory === null && <Check size={18} color={COLORS.primary} />}
              </TouchableOpacity>

              {/* Individual Categories */}
              {categories.map((cat: Category) => {
                const isSelected = tempCategory?.slug === cat.slug;
                return (
                  <TouchableOpacity
                    key={cat.id || cat.slug}
                    style={[styles.modalItem, isSelected && styles.modalItemActive]}
                    onPress={() => setTempCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.modalItemText, isSelected && styles.modalItemTextActive]}
                    >
                      {cat.name}
                    </Text>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={handleClearCategory}
                activeOpacity={0.8}
              >
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalApplyBtn}
                onPress={handleApplyCategory}
                activeOpacity={0.85}
              >
                <Text style={styles.modalApplyText}>Apply Filter</Text>
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
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 14,
    paddingBottom: 12,
    paddingHorizontal: SPACING.lg,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    position: "relative",
  },
  placeholderTouch: {
    position: "absolute",
    left: 36,
    right: 36,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.text,
    paddingVertical: 0,
    zIndex: 2,
  },
  hiddenInput: {
    opacity: 0,
  },
  filterBar: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 8,
  },
  filterScroll: {
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
  },
  categoryFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 8,
  },
  categoryFilterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryFilterBtnText: {
    fontSize: 11.5,
    fontWeight: "800",
    color: COLORS.primary,
  },
  categoryFilterBtnTextActive: {
    color: COLORS.textWhite,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeSortChipText: {
    color: COLORS.textWhite,
    fontWeight: "800",
  },
  resultsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.15)",
  },
  activeFilterTagText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productListContent: {
    paddingHorizontal: SPACING.sm,
    paddingBottom: 40,
  },
  gridCardWrapper: {
    width: "50%",
    paddingHorizontal: 2,
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
    lineHeight: 18,
  },
  resetBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  resetBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingTop: 8,
    paddingBottom: Platform.OS === "android" ? 24 : 34,
    maxHeight: "75%",
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: "center",
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primary,
  },
  modalSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    marginVertical: 2,
  },
  modalItemActive: {
    backgroundColor: "rgba(5, 42, 81, 0.06)",
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalItemTextActive: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  modalResetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSecondary,
  },
  modalResetText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  modalApplyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalApplyText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
});
