import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sparkles, ArrowRight, TrendingUp, Award, Shield, CheckCircle2 } from "lucide-react-native";
import { Header } from "../../src/components/Header";
import { BannerCarousel } from "../../src/components/BannerCarousel";
import { CategoryGrid } from "../../src/components/CategoryGrid";
import { ProductCard } from "../../src/components/ProductCard";
import { AddressModal } from "../../src/components/AddressModal";
import { getCategories, getProducts } from "../../src/api/products";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";
import { Product } from "../../src/types";

export default function HomeScreen() {
  const router = useRouter();
  const [addressModalVisible, setAddressModalVisible] = useState(false);

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

  const categories = catData?.categories || [];
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
        <View>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <Text style={styles.sectionSubtitle}>20+ construction & interior materials</Text>
        </View>
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() => router.push("/(tabs)/categories")}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <ArrowRight size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {catLoading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : (
        <CategoryGrid categories={categories} mode="grid" />
      )}

      {/* Trending Deals Carousel */}
      {trendingProducts.length > 0 && (
        <View style={styles.dealSection}>
          <View style={styles.dealHeader}>
            <View style={styles.dealTitleRow}>
              <TrendingUp size={18} color={COLORS.accentOrange} />
              <Text style={styles.dealTitle}>Trending This Week</Text>
            </View>
            <Text style={styles.dealBadge}>UP TO 40% OFF</Text>
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

      {/* Trust Badges */}
      <View style={styles.trustBanner}>
        <View style={styles.trustItem}>
          <Shield size={20} color={COLORS.primary} />
          <Text style={styles.trustTitle}>Everything, Every Place</Text>
          <Text style={styles.trustSub}>India's top building & interior marketplace</Text>
        </View>
        <View style={styles.trustDivider} />
        <View style={styles.trustItem}>
          <Award size={20} color={COLORS.primary} />
          <Text style={styles.trustTitle}>Verified Quality</Text>
          <Text style={styles.trustSub}>100% genuine supplies</Text>
        </View>
      </View>

      {/* Infinite Product Catalog Section Title */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>All Materials & Supplies</Text>
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingMoreText}>Loading more products...</Text>
        </View>
      );
    }

    if (!hasNextPage && allProducts.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <CheckCircle2 size={16} color={COLORS.accentGreen} />
          <Text style={styles.endOfListText}>You've seen all available products!</Text>
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
        data={allProducts}
        keyExtractor={(item: Product) => item.id}
        numColumns={2}
        renderItem={({ item }: { item: Product }) => (
          <View style={styles.gridCardWrapper}>
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
  trustBanner: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginHorizontal: SPACING.lg,
    marginVertical: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  trustItem: {
    flex: 1,
    alignItems: "center",
  },
  trustDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  trustTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    marginTop: 4,
  },
  trustSub: {
    fontSize: 10,
    color: COLORS.textMuted,
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

