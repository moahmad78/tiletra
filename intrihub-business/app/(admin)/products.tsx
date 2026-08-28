import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Package,
  Search,
  Power,
  Trash2,
  Star,
  Layers,
  CheckSquare,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react-native";
import {
  fetchAdminProducts,
  updateAdminProduct,
  deleteAdminProduct,
} from "../../src/api/admin";
import { Product } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-products", search, statusFilter],
    queryFn: () =>
      fetchAdminProducts({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateAdminProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      Alert.alert("Deleted", "Product deleted from platform");
    },
  });

  const products = data?.products || [];

  const renderProductItem = ({ item }: { item: Product }) => {
    const isActive = item.status === "active";
    const firstImage = item.images?.[0] || "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=400";

    return (
      <View style={styles.productCard}>
        <Image source={{ uri: firstImage }} style={styles.productThumb} contentFit="cover" />

        <View style={styles.productInfo}>
          <View style={styles.topRow}>
            <View style={[styles.statusBadge, isActive ? styles.badgeActive : styles.badgePaused]}>
              <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.vendorName}>By: {item.vendorName || "Direct"}</Text>
          </View>

          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.categoryName}>{item.categoryName || item.categorySlug}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.priceText}>₹{item.pricePerBox?.toLocaleString("en-IN")} / Box</Text>
            <Text style={styles.stockText}>Stock: {item.stockBoxes} Boxes</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                updateMutation.mutate({
                  id: item.id,
                  data: { status: isActive ? "paused" : "active" },
                })
              }
            >
              <Power size={14} color={isActive ? COLORS.accentAmber : COLORS.accentGreen} />
              <Text style={styles.actionBtnText}>{isActive ? "Pause" : "Activate"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                updateMutation.mutate({
                  id: item.id,
                  data: { featured: !item.featured },
                })
              }
            >
              <Star size={14} color={item.featured ? COLORS.accentAmber : COLORS.textTertiary} />
              <Text style={styles.actionBtnText}>{item.featured ? "Featured" : "Feature"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { borderRightWidth: 0 }]}
              onPress={() =>
                Alert.alert("Delete Product", "Delete this product across platform?", [
                  { text: "Cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate(item.id) },
                ])
              }
            >
              <Trash2 size={14} color={COLORS.error} />
              <Text style={[styles.actionBtnText, { color: COLORS.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Catalog Moderation</Text>
          <Text style={styles.headerSubtitle}>{products.length} products listed across vendors</Text>
        </View>
        <TouchableOpacity
          style={styles.bulkHeaderBtn}
          activeOpacity={0.8}
          onPress={() => router.push("/(admin)/products-bulk" as any)}
        >
          <FileSpreadsheet size={16} color="#052A51" />
          <Text style={styles.bulkHeaderBtnText}>Bulk CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Product Approvals Moderation Inbox Banner */}
      <TouchableOpacity
        style={styles.approvalsBanner}
        activeOpacity={0.85}
        onPress={() => router.push("/(admin)/product-approvals" as any)}
      >
        <View style={styles.appBannerIconBox}>
          <CheckSquare size={18} color="#052A51" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.appBannerTitle}>Product Approvals Inbox</Text>
          <Text style={styles.appBannerSub}>Review seller catalog submissions</Text>
        </View>
        <View style={styles.appBannerArrow}>
          <ChevronRight size={18} color="#052A51" />
        </View>
      </TouchableOpacity>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search all products by title or brand..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsRow}>
          {["all", "active", "paused"].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabChip, statusFilter === tab && styles.tabChipActive]}
              onPress={() => setStatusFilter(tab)}
            >
              <Text
                style={[
                  styles.tabChipText,
                  statusFilter === tab && styles.tabChipTextActive,
                ]}
              >
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentBlue} />}
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
    backgroundColor: COLORS.primaryDark,
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexDirection: "row",
    alignItems: "center",
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
  bulkHeaderBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 6,
  },
  bulkHeaderBtnText: {
    color: "#052A51",
    fontSize: 12,
    fontWeight: "800",
  },
  approvalsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appBannerIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(5, 42, 81, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  appBannerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  appBannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  appBannerArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
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
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
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
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  badgeActive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  badgePaused: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.text,
  },
  vendorName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  productName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginTop: 4,
  },
  categoryName: {
    fontSize: 11,
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    marginTop: 2,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  priceText: {
    fontSize: 15,
    fontWeight: "900",
    color: COLORS.primary,
  },
  stockText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginTop: SPACING.sm,
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
    paddingVertical: 2,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.text,
  },
});
