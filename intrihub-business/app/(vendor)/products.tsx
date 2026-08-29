import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Power,
  Layers,
  IndianRupee,
} from "lucide-react-native";
import {
  fetchVendorProducts,
  toggleVendorProductStatus,
  deleteVendorProduct,
} from "../../src/api/vendor";
import { Product } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function VendorProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["vendor-products", search, statusFilter],
    queryFn: () =>
      fetchVendorProducts({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      toggleVendorProductStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update product status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendorProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to delete product");
    },
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to remove "${name}" from your catalog?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  };

  const products = data?.products || [];

  const renderProductItem = ({ item }: { item: Product }) => {
    const isActive = item.status === "active";
    const firstImage =
      item.images && item.images.length > 0
        ? item.images[0]
        : "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400";

    return (
      <View style={styles.productCard}>
        <Image source={{ uri: firstImage }} style={styles.productThumb} contentFit="cover" />

        <View style={styles.productInfo}>
          <View style={styles.productTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={[styles.statusBadge, isActive ? styles.activeBadge : styles.pausedBadge]}>
                <Text style={[styles.statusBadgeText, isActive ? styles.activeText : styles.pausedText]}>
                  {item.status.toUpperCase()}
                </Text>
              </View>

              {item.approvalStatus === "pending" ? (
                <View style={[styles.statusBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#D97706" }]}>⏳ PENDING</Text>
                </View>
              ) : item.approvalStatus === "rejected" ? (
                <View style={[styles.statusBadge, { backgroundColor: "#FEE2E2" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#DC2626" }]}>✕ REJECTED</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: "#DCFCE7" }]}>
                  <Text style={[styles.statusBadgeText, { color: "#16A34A" }]}>✓ LIVE</Text>
                </View>
              )}
            </View>

            <Text style={styles.stockCount}>
              Stock: <Text style={{ fontWeight: "800", color: COLORS.text }}>{item.stockBoxes} Boxes</Text>
            </Text>
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.categoryTag}>{item.categoryName || item.categorySlug || "Product"}</Text>

          <View style={styles.pricingRow}>
            <Text style={styles.pricePerBox}>
              ₹{item.pricePerBox?.toLocaleString("en-IN")} <Text style={styles.unitText}>/ Box</Text>
            </Text>
            {item.pricePerSqft ? (
              <Text style={styles.pricePerSqft}>₹{item.pricePerSqft} / sq.ft</Text>
            ) : null}
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push({ pathname: "/(vendor)/product/[id]", params: { id: item.id } } as any)}
            >
              <Edit2 size={15} color={COLORS.primary} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                toggleMutation.mutate({
                  id: item.id,
                  status: isActive ? "paused" : "active",
                })
              }
            >
              <Power size={15} color={isActive ? COLORS.accentAmber : COLORS.accentGreen} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isActive ? COLORS.accentAmber : COLORS.accentGreen },
                ]}
              >
                {isActive ? "Pause" : "Activate"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderRightWidth: 0 }]}
              onPress={() => handleDelete(item.id, item.name)}
            >
              <Trash2 size={15} color={COLORS.error} />
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Product Catalog</Text>
          <Text style={styles.headerSubtitle}>{products.length} materials listed</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(vendor)/add-product" as any)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnText}>New Product</Text>
        </TouchableOpacity>
      </View>

      {/* Search & Status Filters */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products by name or spec..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsRow}>
          {(["all", "active", "paused"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabPill, statusFilter === tab && styles.tabPillActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text
                style={[
                  styles.tabPillText,
                  statusFilter === tab && styles.tabPillTextActive,
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Product List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentOrange} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentOrange} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                Add your tile, stone, sanitary, or hardware catalog items to begin selling.
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => router.push("/(vendor)/add-product" as any)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyAddBtnText}>Add Your First Product</Text>
              </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: COLORS.textWhite,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    gap: 6,
  },
  addBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  filterSection: {
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabPillActive: {
    backgroundColor: COLORS.primary,
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabPillTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  productCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  productThumb: {
    width: "100%",
    height: 140,
    backgroundColor: COLORS.surfaceSecondary,
  },
  productInfo: {
    padding: SPACING.md,
  },
  productTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  activeBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  pausedBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  activeText: {
    color: COLORS.accentGreen,
  },
  pausedText: {
    color: COLORS.accentAmber,
  },
  stockCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
  },
  categoryTag: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 2,
  },
  pricingRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  pricePerBox: {
    fontSize: 16,
    fontWeight: "900",
    color: COLORS.primary,
  },
  unitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "normal",
  },
  pricePerSqft: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.full,
    marginTop: SPACING.lg,
    gap: 6,
  },
  emptyAddBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
});
