import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import {
  fetchVendorProducts,
  toggleVendorProductStatus,
  deleteVendorProduct,
} from "../../src/api/vendor";
import { Product } from "../../src/types";
import { formatCurrency } from "../../src/utils/formatters";

type FilterTab = "all" | "active" | "paused" | "pending";

export default function VendorProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["vendor-products", search, activeTab],
    queryFn: () =>
      fetchVendorProducts({
        search: search.trim() || undefined,
        status: activeTab === "all" || activeTab === "pending" ? undefined : activeTab,
        approvalStatus: activeTab === "pending" ? "pending" : undefined,
      }),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Toggle Mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      toggleVendorProductStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to update product status");
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      Alert.alert("Success", "Product removed successfully");
    },
    onError: (err: any) => {
      Alert.alert("Error", err?.message || "Failed to delete product");
    },
  });

  const handleDelete = (item: Product) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to remove "${item.name}" from your catalog?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(item.id),
        },
      ]
    );
  };

  const products = data?.products || [];

  const renderProductItem = ({ item }: { item: Product }) => {
    const isPaused = item.status === "paused";
    const isPending = item.approvalStatus === "pending";
    const isRejected = item.approvalStatus === "rejected";
    const firstVariant = item.variants?.[0];
    const stockBoxes = firstVariant?.stockBoxes ?? 50;
    const isLowStock = stockBoxes < 15;
    const imgUrl = item.images?.[0] || item.featuredImage || "";

    return (
      <View style={styles.productCard}>
        <View style={styles.cardMainRow}>
          {/* Product Thumbnail */}
          <View style={styles.thumbWrapper}>
            {imgUrl ? (
              <Image source={{ uri: imgUrl }} style={styles.thumbnail} contentFit="cover" />
            ) : (
              <View style={styles.noThumb}>
                <Package size={24} color={COLORS.textMuted} />
              </View>
            )}
          </View>

          {/* Details */}
          <View style={styles.cardDetailsCol}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
            </View>

            <Text style={styles.categoryName}>{item.categoryName || "General"}</Text>

            {/* Price & Stock */}
            <View style={styles.priceStockRow}>
              <Text style={styles.priceText}>
                {formatCurrency(item.pricePerSqft || item.pricePerBox || 0)}
                <Text style={styles.unitText}> / {item.unitOfSale || "unit"}</Text>
              </Text>

              <View
                style={[
                  styles.stockBadge,
                  isLowStock ? styles.stockBadgeLow : styles.stockBadgeNormal,
                ]}
              >
                {isLowStock && <AlertTriangle size={11} color={COLORS.accentRed} />}
                <Text
                  style={[
                    styles.stockBadgeText,
                    isLowStock ? styles.stockTextLow : styles.stockTextNormal,
                  ]}
                >
                  {stockBoxes} {item.unitOfSale === "box" ? "boxes" : "units"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Card Footer: Status Badges, Toggle & Actions */}
        <View style={styles.cardFooter}>
          {/* Approval Badge */}
          <View style={styles.statusGroup}>
            {isPending ? (
              <View style={[styles.pillBadge, styles.pillPending]}>
                <Clock size={11} color="#b45309" />
                <Text style={[styles.pillText, { color: "#b45309" }]}>Under Review</Text>
              </View>
            ) : isRejected ? (
              <View style={[styles.pillBadge, styles.pillRejected]}>
                <XCircle size={11} color={COLORS.accentRed} />
                <Text style={[styles.pillText, { color: COLORS.accentRed }]}>Rejected</Text>
              </View>
            ) : (
              <View style={[styles.pillBadge, styles.pillApproved]}>
                <CheckCircle2 size={11} color={COLORS.accentGreen} />
                <Text style={[styles.pillText, { color: COLORS.accentGreen }]}>Live</Text>
              </View>
            )}

            {/* Quick Active / Pause Toggle */}
            {!isPending && !isRejected && (
              <View style={styles.toggleWrapper}>
                <Text style={styles.toggleLabel}>{isPaused ? "Paused" : "Active"}</Text>
                <Switch
                  value={!isPaused}
                  onValueChange={(val) =>
                    toggleMutation.mutate({
                      id: item.id,
                      status: val ? "active" : "paused",
                    })
                  }
                  trackColor={{ false: "#cbd5e1", true: "#86efac" }}
                  thumbColor={!isPaused ? COLORS.accentGreen : "#94a3b8"}
                  style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                />
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBtnsRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() =>
                router.push({
                  pathname: "/(vendor)/product-form",
                  params: { id: item.id },
                } as any)
              }
              activeOpacity={0.7}
            >
              <Edit2 size={14} color={COLORS.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              activeOpacity={0.7}
            >
              <Trash2 size={14} color={COLORS.accentRed} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Products Catalog</Text>
          <Text style={styles.headerSubtitle}>
            Manage prices, stock levels, and active status
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(vendor)/product-form" as any)}
          activeOpacity={0.85}
        >
          <Plus size={18} color={COLORS.textWhite} />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name or category..."
            placeholderTextColor={COLORS.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(
          [
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "paused", label: "Paused" },
            { key: "pending", label: "Pending" },
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabChip, isActive && styles.tabChipActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Products FlatList */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Products Found</Text>
          <Text style={styles.emptySub}>
            {search ? "No products matching your search criteria" : "Start adding products to sell directly on Intrihub"}
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => router.push("/(vendor)/product-form" as any)}
          >
            <Plus size={16} color={COLORS.textWhite} />
            <Text style={styles.emptyAddBtnText}>Add Your First Product</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: "800",
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    backgroundColor: COLORS.surface,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    paddingVertical: 0,
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.textWhite,
    fontWeight: "700",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardMainRow: {
    flexDirection: "row",
    gap: 12,
  },
  thumbWrapper: {
    width: 76,
    height: 76,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  noThumb: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetailsCol: {
    flex: 1,
    justifyContent: "space-between",
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    lineHeight: 18,
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "500",
    marginTop: 2,
  },
  priceStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  stockBadgeNormal: {
    backgroundColor: "#f1f5f9",
  },
  stockBadgeLow: {
    backgroundColor: "#fee2e2",
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  stockTextNormal: {
    color: COLORS.textSecondary,
  },
  stockTextLow: {
    color: COLORS.accentRed,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    paddingTop: 10,
    marginTop: 10,
  },
  statusGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    gap: 3,
  },
  pillApproved: {
    backgroundColor: "#f0fdf4",
  },
  pillPending: {
    backgroundColor: "#fef3c7",
  },
  pillRejected: {
    backgroundColor: "#fee2e2",
  },
  pillText: {
    fontSize: 10,
    fontWeight: "800",
  },
  toggleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  toggleLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  actionBtnsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  deleteBtn: {
    backgroundColor: "#fee2e2",
    padding: 6,
    borderRadius: RADIUS.sm,
  },
  loadingWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  emptyAddBtnText: {
    color: COLORS.textWhite,
    fontSize: 13,
    fontWeight: "800",
  },
});
