import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
  InteractionManager,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import {
  Search,
  X,
  SlidersHorizontal,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { ProductCard } from "../../src/components/ProductCard";
import { AnimatedSearchPlaceholder } from "../../src/components/AnimatedSearchPlaceholder";
import { getCategories, getProducts } from "../../src/api/products";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { getImageUrl } from "../../src/constants/config";
import { Category, Product } from "../../src/types";

export default function CategoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string; autoFocus?: string; q?: string }>();
  const inputRef = useRef<TextInput>(null);

  const [searchQuery, setSearchQuery] = useState(params?.q || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery.trim());
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempCategory, setTempCategory] = useState<Category | null>(null);
  const [activeSort, setActiveSort] = useState<"popular" | "price_asc" | "price_desc" | "rating">("popular");

  // Robust Auto-focus keyboard on screen focus when navigated via search bar
  useFocusEffect(
    useCallback(() => {
      if (params?.focus || params?.autoFocus) {
        const task = InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            inputRef.current?.focus();
            setIsSearchFocused(true);
          }, 80);
        });

        const backupTimer = setTimeout(() => {
          inputRef.current?.focus();
          setIsSearchFocused(true);
        }, 220);

        return () => {
          task.cancel();
          clearTimeout(backupTimer);
        };
      }
    }, [params?.focus, params?.autoFocus])
  );

  // Fast 150ms debounce for server refinement
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      setDebouncedSearch(trimmed);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 1. Fetch Categories
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ["mobile-categories"],
    queryFn: getCategories,
  });

  const categories = catData?.categories || [];

  // 2. Prefetch Compact Catalog for 0ms instant client-side typeahead
  const { data: compactCatalogData } = useQuery({
    queryKey: ["mobile-compact-catalog"],
    queryFn: () => getProducts({ limit: 100 }),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  const compactCatalog = compactCatalogData?.products || [];

  // Instant Client-side Filter (0ms response on single keystroke)
  const clientMatches = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];
    return compactCatalog.filter(
      (p) =>
        p.name.toLowerCase().includes(trimmed) ||
        p.categoryName?.toLowerCase().includes(trimmed) ||
        p.material?.toLowerCase().includes(trimmed) ||
        p.finish?.toLowerCase().includes(trimmed) ||
        p.description?.toLowerCase().includes(trimmed)
    );
  }, [searchQuery, compactCatalog]);

  // 3. Server Live Suggestions Query (debounced 150ms)
  const { data: suggestionsData, isFetching: suggestionsFetching } = useQuery({
    queryKey: ["mobile-search-suggestions", debouncedSearch],
    queryFn: () => getProducts({ q: debouncedSearch, limit: 10 }),
    enabled: Boolean(debouncedSearch && debouncedSearch.length >= 1 && isSearchFocused),
  });

  const serverSuggestions = suggestionsData?.products || [];

  // Merge client and server suggestions
  const mergedSuggestions = useMemo(() => {
    const map = new Map<string, Product>();
    serverSuggestions.forEach((p) => map.set(p.id, p));
    clientMatches.forEach((p) => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    return Array.from(map.values()).slice(0, 8);
  }, [clientMatches, serverSuggestions]);

  // 4. Main Browse / Filtered Products Query
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
        // When searching with text, search globally across all categories
        category: searchQuery.trim() ? undefined : selectedCategory?.slug,
        sort: activeSort,
        limit: 40,
      }),
  });

  const products = productsData?.products || [];

  // Matching categories in live suggestion dropdown
  const matchingCategories = categories.filter((c) =>
    searchQuery.trim()
      ? c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : false
  );

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

  const handleSelectSuggestion = (product: Product) => {
    setShowSuggestions(false);
    setIsSearchFocused(false);
    Keyboard.dismiss();
    router.push(`/product/${product.id}` as any);
  };

  const handleSelectCategorySuggestion = (cat: Category) => {
    setSelectedCategory(cat);
    setSearchQuery("");
    setShowSuggestions(false);
    setIsSearchFocused(false);
    Keyboard.dismiss();
  };

  const handleSeeAllResults = () => {
    setShowSuggestions(false);
    setIsSearchFocused(false);
    Keyboard.dismiss();
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
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text.trim().length >= 1) {
                setShowSuggestions(true);
              } else {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              setIsSearchFocused(true);
              if (searchQuery.trim().length >= 1) {
                setShowSuggestions(true);
              }
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsSearchFocused(false);
                setShowSuggestions(false);
              }, 250);
            }}
            onSubmitEditing={handleSeeAllResults}
            returnKeyType="search"
          />

          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {/* Live Search Suggestions Dropdown Overlay */}
        {showSuggestions && searchQuery.trim().length >= 1 && (
          <View style={[styles.suggestionsDropdown, SHADOWS.lg]}>
            {/* Matching Categories Single Horizontal Row (Takes minimal vertical space) */}
            {matchingCategories.length > 0 && (
              <View style={styles.matchingCatSection}>
                <Text style={styles.suggestionSectionLabel}>Categories</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={styles.matchingCatRow}
                >
                  {matchingCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={styles.matchingCatChip}
                      onPress={() => handleSelectCategorySuggestion(cat)}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={11} color={COLORS.accentOrange} style={{ marginRight: 4 }} />
                      <Text style={styles.matchingCatChipText}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Vertical Scrollable Matching Products List */}
            <ScrollView
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled={true}
              scrollEnabled={true}
              overScrollMode="always"
              showsVerticalScrollIndicator={true}
              style={styles.suggestionsScroll}
              contentContainerStyle={styles.suggestionsScrollContent}
            >
              {/* Matching Products Header */}
              {mergedSuggestions.length > 0 ? (
                <>
                  <View style={styles.suggestionSectionHeaderRow}>
                    <Text style={styles.suggestionSectionLabel}>Matching Products</Text>
                    {suggestionsFetching && (
                      <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 6 }} />
                    )}
                  </View>

                  {mergedSuggestions.map((p) => {
                    const img = p.images?.[0]
                      ? getImageUrl(p.images[0])
                      : "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=200";
                    const price =
                      p.variants?.[0]?.pricePerBox ||
                      p.variants?.[0]?.pricePerSqft ||
                      p.pricePerSqft ||
                      499;
                    const unit = p.unitOfSale || "sqft";

                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={styles.suggestionRow}
                        onPress={() => handleSelectSuggestion(p)}
                        activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: img }}
                          style={styles.suggestionThumb}
                          contentFit="cover"
                        />
                        <View style={styles.suggestionInfo}>
                          <Text style={styles.suggestionTitle} numberOfLines={1}>
                            {p.name}
                          </Text>
                          <Text style={styles.suggestionSub} numberOfLines={1}>
                            {p.categoryName || "Direct Supply"} {p.size ? `• ${p.size}` : ""}
                          </Text>
                        </View>
                        <View style={styles.suggestionPriceBox}>
                          <Text style={styles.suggestionPrice}>₹{price.toLocaleString("en-IN")}</Text>
                          <Text style={styles.suggestionUnit}>/{unit}</Text>
                        </View>
                        <ChevronRight size={16} color={COLORS.textMuted} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>
                    );
                  })}

                  {/* Bottom "See all results" button */}
                  <TouchableOpacity
                    style={styles.seeAllBtn}
                    onPress={handleSeeAllResults}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.seeAllText}>
                      See all results for "{searchQuery}"
                    </Text>
                    <ChevronRight size={14} color={COLORS.primary} />
                  </TouchableOpacity>
                </>
              ) : suggestionsFetching ? (
                <View style={styles.suggestionsLoading}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.suggestionsLoadingText}>Searching catalog...</Text>
                </View>
              ) : (
                <View style={styles.noSuggestionsBox}>
                  <Text style={styles.noSuggestionsText}>
                    No direct matches for "{searchQuery}"
                  </Text>
                  <Text style={styles.noSuggestionsSub}>
                    Press search or tap below to explore related materials
                  </Text>
                  <TouchableOpacity
                    style={styles.exploreFallbackBtn}
                    onPress={handleSeeAllResults}
                  >
                    <Text style={styles.exploreFallbackText}>View Catalog Items</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Touch-blocking backdrop when suggestions dropdown is open */}
      {showSuggestions && searchQuery.trim().length >= 1 && (
        <Pressable
          style={styles.suggestionsBackdrop}
          onPress={() => {
            setShowSuggestions(false);
            setIsSearchFocused(false);
            Keyboard.dismiss();
          }}
        />
      )}

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

      {/* Categories Bottom Sheet Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
            <View style={styles.modalBackdrop} />
          </TouchableWithoutFeedback>

          <View style={styles.bottomSheet}>
            {/* Handle bar */}
            <View style={styles.sheetHandle} />

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Category Options List */}
            <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
              {/* All Categories Option */}
              <TouchableOpacity
                style={[
                  styles.categoryRow,
                  tempCategory === null && styles.categoryRowSelected,
                ]}
                onPress={() => setTempCategory(null)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryRowText,
                    tempCategory === null && styles.categoryRowTextSelected,
                  ]}
                >
                  All Categories
                </Text>
                {tempCategory === null && <Check size={18} color={COLORS.primary} />}
              </TouchableOpacity>

              {/* Dynamic Categories */}
              {categories.map((cat) => {
                const isSelected = tempCategory?.id === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryRow, isSelected && styles.categoryRowSelected]}
                    onPress={() => setTempCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryRowText,
                        isSelected && styles.categoryRowTextSelected,
                      ]}
                    >
                      {cat.name}
                    </Text>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.sheetFooter}>
              <TouchableOpacity
                style={styles.sheetClearBtn}
                onPress={handleClearCategory}
                activeOpacity={0.8}
              >
                <Text style={styles.sheetClearBtnText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.sheetApplyBtn}
                onPress={handleApplyCategory}
                activeOpacity={0.85}
              >
                <Text style={styles.sheetApplyBtnText}>Apply Filter</Text>
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
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 14,
    paddingBottom: 10,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 100,
    position: "relative",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  placeholderTouch: {
    ...StyleSheet.absoluteFillObject,
    left: 36,
    justifyContent: "center",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 0,
  },
  hiddenInput: {
    opacity: 0,
  },
  // Touch-blocking backdrop behind dropdown
  suggestionsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    zIndex: 50,
  },
  // Suggestions Dropdown
  suggestionsDropdown: {
    position: "absolute",
    top: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 56 : 60,
    left: SPACING.md,
    right: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    maxHeight: 480,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 999,
    overflow: "hidden",
  },
  suggestionSectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  suggestionsLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  suggestionsLoadingText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  suggestionsScroll: {
    maxHeight: 410,
    flexGrow: 0,
  },
  suggestionsScrollContent: {
    paddingBottom: 20,
  },
  matchingCatSection: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    backgroundColor: "rgba(5, 42, 81, 0.03)",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  suggestionSectionLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: COLORS.textMuted,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  matchingCatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: SPACING.md,
  },
  matchingCatChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "rgba(242, 101, 34, 0.3)",
    borderRadius: RADIUS.full,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 6,
  },
  matchingCatChipText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.primary,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  suggestionThumb: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    marginRight: 10,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  suggestionSub: {
    fontSize: 10.5,
    color: COLORS.textMuted,
  },
  suggestionPriceBox: {
    alignItems: "flex-end",
  },
  suggestionPrice: {
    fontSize: 12.5,
    fontWeight: "900",
    color: COLORS.primary,
  },
  suggestionUnit: {
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
    backgroundColor: "rgba(5, 42, 81, 0.04)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.primary,
  },
  noSuggestionsBox: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  noSuggestionsText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  noSuggestionsSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  exploreFallbackBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  exploreFallbackText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: COLORS.textWhite,
  },

  // Filter Bar
  filterBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: SPACING.md,
    alignItems: "center",
  },
  categoryFilterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 42, 81, 0.07)",
    borderWidth: 1,
    borderColor: "rgba(5, 42, 81, 0.15)",
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  categoryFilterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryFilterBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  categoryFilterBtnTextActive: {
    color: COLORS.textWhite,
  },
  sortChip: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.full,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    borderColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  activeSortChipText: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  resultsInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
  },
  resultsCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
  },
  activeFilterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: RADIUS.sm,
  },
  activeFilterTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productListContent: {
    padding: SPACING.sm,
    paddingBottom: 40,
  },
  gridCardWrapper: {
    flex: 1,
    padding: 4,
    maxWidth: "50%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
  },
  resetBtnText: {
    color: COLORS.textWhite,
    fontWeight: "700",
    fontSize: 13,
  },

  // Modal / Bottom Sheet
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "75%",
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: RADIUS.full,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  sheetScroll: {
    paddingHorizontal: SPACING.md,
    maxHeight: 360,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },
  categoryRowSelected: {
    backgroundColor: "rgba(5, 42, 81, 0.06)",
  },
  categoryRowText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  categoryRowTextSelected: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  sheetFooter: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  sheetClearBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sheetClearBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  sheetApplyBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: "center",
  },
  sheetApplyBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textWhite,
  },
});
