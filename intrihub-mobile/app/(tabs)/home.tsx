import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  BackHandler,
  Alert,
  Platform,
  LayoutAnimation,
} from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowRight, TrendingUp, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { BannerCarousel } from "../../src/components/BannerCarousel";
import { CategoryGrid } from "../../src/components/CategoryGrid";
import { ProductCard } from "../../src/components/ProductCard";
import { AddressModal } from "../../src/components/AddressModal";
import { getCategories, getProducts } from "../../src/api/products";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";
import { Product, Category } from "../../src/types";
import { useTranslation } from "../../src/store/i18nStore";

export default function HomeScreen() {
  const router = useRouter();
  const { t, isRTL } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const numColumns = windowWidth >= 900 ? 4 : windowWidth >= 600 ? 3 : 2;
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  // Hardware Back Button Exit Confirmation on Android - Only active when Home screen is focused
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;

      const onBackPress = () => {
        // If there is any previous screen in the stack history, go back normally
        if (router.canGoBack()) {
          router.back();
          return true;
        }

        // Only on the root Home screen (last step) ask before closing/exiting the app
        Alert.alert(
          t("common.exitTitle") || "Exit IntriHub?",
          t("common.exitConfirm") || "Are you sure you want to close the IntriHub app?",
          [
            { text: t("common.stay") || "Stay", style: "cancel" },
            {
              text: t("common.exit") || "Exit",
              style: "destructive",
              onPress: () => BackHandler.exitApp(),
            },
          ]
        );
        return true;
      };

      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }, [router, t])
  );

  // 1. Fetch Categories & Banners
  const {
    data: catData,
    isLoading: catLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["mobile-categories"],
    queryFn: getCategories,
  });

  // 2. Fetch Trending / Bestseller Products (Curated Carousel)
  const {
    data: trendingData,
    isLoading: trendingLoading,
    refetch: refetchTrending,
  } = useQuery({
    queryKey: ["mobile-trending-products"],
    queryFn: () => getProducts({ trending: true, limit: 10 }),
  });

  // 3. Infinite Query for ALL Products in Catalog
  const {
    data: allProductsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: allProductsLoading,
    refetch: refetchAllProducts,
  } = useInfiniteQuery({
    queryKey: ["mobile-all-products-infinite"],
    queryFn: ({ pageParam = 1 }) => getProducts({ page: pageParam, limit: 12 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasMore) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchTrending(), refetchAllProducts()]);
    setRefreshing(false);
  };

  // Priority ranking: Essential construction & home materials first (Hardware, Electrical, Tiles, Plumbing...)
  const sortedCategories = useMemo(() => {
    if (!catData?.categories) return [];
    const list = [...catData.categories];

    const getRank = (cat: Category) => {
      const slug = (cat.slug || "").toLowerCase();
      const name = (cat.name || "").toLowerCase();

      // 1. Hardware & Tools
      if (slug.includes("hardware") || name.includes("hardware") || slug.includes("tool") || name.includes("tool")) return 1;
      // 2. Electrical & Wiring
      if (slug.includes("electrical") || name.includes("electrical") || slug.includes("wire") || name.includes("wire")) return 2;
      // 3. Tiles & Flooring (Floor Tiles, Wall Tiles, Granite, Marble)
      if (slug.includes("floor-tile") || slug.includes("tiles-stone") || slug.includes("wall-tile") || name.includes("tile") || name.includes("floor")) return 3;
      // 4. Plumbing & Sanitaryware (Bath Fittings, Sinks, Pipes)
      if (slug.includes("plumb") || slug.includes("sanitary") || slug.includes("bath") || slug.includes("sink") || name.includes("plumb") || name.includes("sanitary")) return 4;
      // 5. Paints & Finishes
      if (slug.includes("paint") || name.includes("paint")) return 5;
      // 6. Cement & Concrete
      if (slug.includes("cement") || name.includes("cement") || slug.includes("concrete") || name.includes("concrete")) return 6;
      // 7. Steel & Rebar
      if (slug.includes("steel") || name.includes("steel") || slug.includes("rebar") || name.includes("rebar")) return 7;
      // 8. Lighting & Fixtures
      if (slug.includes("light") || name.includes("light")) return 8;
      // 9. Granite, Marble & Stone
      if (slug.includes("granite") || slug.includes("marble") || slug.includes("stone") || name.includes("granite") || name.includes("marble") || name.includes("stone")) return 9;
      // 10. Bricks & Blocks
      if (slug.includes("brick") || slug.includes("block") || name.includes("brick") || name.includes("block")) return 10;
      // 11. Sand & Aggregates
      if (slug.includes("sand") || slug.includes("aggregate") || name.includes("sand")) return 11;
      // 12. Adhesives & Sealants / Wood
      if (slug.includes("adhesive") || slug.includes("wood") || name.includes("adhesive")) return 12;

      return 99;
    };

    return list.sort((a, b) => getRank(a) - getRank(b));
  }, [catData?.categories]);

  const categories = sortedCategories;
  const banners = catData?.banners || [];
  const trendingProducts = trendingData?.products || [];
  const allProducts = allProductsData?.pages.flatMap((page) => page.products) || [];

  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const renderHeader = () => (
    <View>
      {/* Banner Carousel with auto-rotation */}
      <BannerCarousel banners={banners} />

      {/* Categories Section with animated expand/collapse */}
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.sectionTitle} numberOfLines={1}>{t("home.shopByCategory") || "Shop by Category"}</Text>
          <Text style={styles.sectionSubtitle} numberOfLines={1}>{t("home.heroSubtitle") || "Direct to site in 60 mins"}</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCategoriesExpanded((prev) => !prev);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.viewAllText}>
            {categoriesExpanded ? (t("common.showLess") || "Show Less") : (t("common.viewAll") || "View All")}
          </Text>
          {categoriesExpanded ? (
            <ChevronUp size={15} color={COLORS.primary} />
          ) : (
            <ChevronDown size={15} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {catLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : (
        <CategoryGrid
          categories={categories}
          mode="grid"
          isExpanded={categoriesExpanded}
          onToggleExpand={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setCategoriesExpanded((prev) => !prev);
          }}
          collapsedCount={12}
        />
      )}

      {/* Trending Deals Carousel */}
      {trendingProducts.length > 0 && (
        <View style={styles.dealSection}>
          <View style={styles.dealHeader}>
            <View style={styles.dealTitleRow}>
              <TrendingUp size={18} color={COLORS.accentOrange} />
              <Text style={styles.dealTitle}>{t("home.trendingThisWeek") || "Trending This Week"}</Text>
            </View>
            <Text style={styles.dealBadge}>{t("home.upToDiscount") || "UP TO 40% OFF"}</Text>
          </View>

          <FlatList
            data={trendingProducts}
            keyExtractor={(item: Product) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalProductList}
            renderItem={({ item }: { item: Product }) => <ProductCard product={item} horizontal />}
          />
        </View>
      )}



      {/* Infinite Product Catalog Section Title */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{t("home.allMaterialsSupplies") || "All Materials & Supplies"}</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingMoreText}>{t("home.loadingMoreProducts") || "Loading more products..."}</Text>
        </View>
      );
    }

    if (!hasNextPage && allProducts.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <CheckCircle2 size={16} color={COLORS.accentGreen} />
          <Text style={styles.endOfListText}>{t("home.endOfListProducts") || "You've seen all available products!"}</Text>
        </View>
      );
    }

    return <View style={styles.footerSpacing} />;
  };

  return (
    <View style={styles.container}>
      <Header
        onSearchPress={() =>
          router.push({
            pathname: "/(tabs)/categories",
            params: { autoFocus: Date.now().toString() },
          } as any)
        }
        onAddressPress={() => setAddressModalVisible(true)}
      />

      <FlatList
        key={`home-products-grid-${numColumns}`}
        data={allProducts}
        keyExtractor={(item: Product) => item.id}
        numColumns={numColumns}
        renderItem={({ item }: { item: Product }) => (
          <View style={[styles.gridCardWrapper, { width: `${100 / numColumns}%` }]}>
            <ProductCard product={item} />
          </View>
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      />

      {/* Address Selection Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  sectionSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginRight: 4,
  },
  dealSection: {
    backgroundColor: "rgba(5, 42, 81, 0.03)",
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  dealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  dealTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dealTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginLeft: 6,
  },
  dealBadge: {
    backgroundColor: COLORS.accentOrange,
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  horizontalProductList: {
    paddingHorizontal: SPACING.lg,
  },

  gridCardWrapper: {
    width: "50%",
    paddingHorizontal: 2,
  },
  footerLoader: {
    paddingVertical: SPACING.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMoreText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  endOfListContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xl,
  },
  endOfListText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textMuted,
    marginLeft: 6,
  },
  footerSpacing: {
    height: 30,
  },
});

