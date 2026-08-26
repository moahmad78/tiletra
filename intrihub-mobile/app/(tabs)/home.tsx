import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Sparkles, ArrowRight, TrendingUp, Award, Shield } from "lucide-react-native";
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

  // Fetch Categories & Banners
  const {
    data: catData,
    isLoading: catLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["mobile-categories"],
    queryFn: getCategories,
  });

  // Fetch Trending / Bestseller Products
  const {
    data: trendingData,
    isLoading: trendingLoading,
    refetch: refetchTrending,
  } = useQuery({
    queryKey: ["mobile-trending-products"],
    queryFn: () => getProducts({ trending: true, limit: 10 }),
  });

  // Fetch Featured Feed Products
  const {
    data: feedData,
    isLoading: feedLoading,
    refetch: refetchFeed,
  } = useQuery({
    queryKey: ["mobile-home-feed"],
    queryFn: () => getProducts({ limit: 20 }),
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCategories(), refetchTrending(), refetchFeed()]);
    setRefreshing(false);
  };

  const categories = catData?.categories || [];
  const banners = catData?.banners || [];
  const trendingProducts = trendingData?.products || [];
  const feedProducts = feedData?.products || [];

  return (
    <View style={styles.container}>
      <Header
        onSearchPress={() => router.push("/(tabs)/categories")}
        onAddressPress={() => setAddressModalVisible(true)}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Banner Carousel */}
        <BannerCarousel banners={banners} />

        {/* Categories Section */}
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
              keyExtractor={(item: any) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalProductList}
              renderItem={({ item }: { item: any }) => <ProductCard product={item} horizontal />}
            />
          </View>
        )}

        {/* Trust Badges */}
        <View style={styles.trustBanner}>
          <View style={styles.trustItem}>
            <Shield size={20} color={COLORS.primary} />
            <Text style={styles.trustTitle}>Direct from Factory</Text>
            <Text style={styles.trustSub}>Zero middleman markup</Text>
          </View>
          <View style={styles.trustDivider} />
          <View style={styles.trustItem}>
            <Award size={20} color={COLORS.primary} />
            <Text style={styles.trustTitle}>Verified Quality</Text>
            <Text style={styles.trustSub}>100% genuine supplies</Text>
          </View>
        </View>

        {/* Explore All Products Grid */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recommended for You</Text>
            <Text style={styles.sectionSubtitle}>Popular tiles, sanitary & hardware</Text>
          </View>
        </View>

        {feedLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 30 }} />
        ) : (
          <View style={styles.productsGrid}>
            {feedProducts.map((prod: any) => (
              <View key={prod.id} style={styles.gridCardWrapper}>
                <ProductCard product={prod} />
              </View>
            ))}
          </View>
        )}

        <View style={styles.footerSpacing} />
      </ScrollView>

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
  scroll: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
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
    marginTop: SPACING.md,
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
    marginVertical: SPACING.lg,
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
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: SPACING.md,
  },
  gridCardWrapper: {
    width: "50%",
  },
  footerSpacing: {
    height: 40,
  },
});
