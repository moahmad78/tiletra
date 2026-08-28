import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Package,
  CheckCircle2,
  XCircle,
  Store,
  ShieldCheck,
  Eye,
} from "lucide-react-native";
import {
  fetchAdminProductApprovals,
  approveAdminProductPending,
  rejectAdminProductPending,
} from "../../src/api/admin";
import { COLORS } from "../../src/constants/theme";
import { Product } from "../../src/types";

export default function ProductApprovalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Modal
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminProductApprovals({ search: searchQuery });
      if (res.success && res.products) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error("Error fetching pending products:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleApprove = async (product: Product) => {
    setActionLoading(true);
    try {
      const res = await approveAdminProductPending(product.id);
      if (res.success) {
        setInspectModalVisible(false);
        Alert.alert("Product Approved", `"${product.name}" is now live on the storefront!`);
        loadData();
      } else {
        Alert.alert("Approval Failed", res.error || "Could not approve product.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReject = (product: Product) => {
    setSelectedProduct(product);
    setRejectionReason("");
    setRejectModalVisible(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedProduct) return;
    if (!rejectionReason.trim()) {
      Alert.alert("Required", "Please provide a reason or correction request for the seller.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await rejectAdminProductPending(selectedProduct.id, rejectionReason.trim());
      if (res.success) {
        setRejectModalVisible(false);
        setInspectModalVisible(false);
        setRejectionReason("");
        Alert.alert("Product Rejected", "Feedback has been sent to the vendor.");
        loadData();
      } else {
        Alert.alert("Rejection Failed", res.error || "Could not reject product.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => {
    const mainImg = item.images && item.images.length > 0 ? item.images[0] : null;
    const vendorName = item.vendor?.businessName || item.vendorName || "Registered Seller";
    const categoryName = item.category || item.categoryName || "General";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardTopRow}
          activeOpacity={0.85}
          onPress={() => {
            setSelectedProduct(item);
            setInspectModalVisible(true);
          }}
        >
          {mainImg ? (
            <Image source={{ uri: mainImg }} style={styles.productImg} />
          ) : (
            <View style={styles.productPlaceholder}>
              <Package size={28} color={COLORS.textTertiary} />
            </View>
          )}

          <View style={styles.productInfo}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryName}</Text>
            </View>
            <Text style={styles.productTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.sellerRow}>
              <Store size={12} color={COLORS.accentOrange} />
              <Text style={styles.sellerName} numberOfLines={1}>
                {vendorName}
              </Text>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.sellingPrice}>₹{item.pricePerBox || item.pricePerSqft || item.price || 0}</Text>
              {item.mrp ? <Text style={styles.mrpPrice}>₹{item.mrp}</Text> : null}
              <Text style={styles.stockLabel}>Stock: {item.stockBoxes || item.stock || 0}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.cardInspectBtn}
            onPress={() => {
              setSelectedProduct(item);
              setInspectModalVisible(true);
            }}
          >
            <Eye size={15} color={COLORS.accentBlue} />
            <Text style={styles.cardInspectBtnText}>Inspect Specs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardRejectBtn}
            onPress={() => handleOpenReject(item)}
            disabled={actionLoading}
          >
            <XCircle size={15} color="#DC2626" />
            <Text style={styles.cardRejectBtnText}>Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardApproveBtn}
            onPress={() => handleApprove(item)}
            disabled={actionLoading}
          >
            <CheckCircle2 size={15} color="#FFFFFF" />
            <Text style={styles.cardApproveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Product Approvals</Text>
          <Text style={styles.headerSub}>Vendor catalog moderation inbox</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{products.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name, category..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle2 size={54} color="#10B981" />
              <Text style={styles.emptyTitle}>Moderation Queue Clear!</Text>
              <Text style={styles.emptySubtitle}>All submitted vendor products have been approved or reviewed.</Text>
            </View>
          }
        />
      )}

      {/* Detail / Specs Inspection Modal */}
      <Modal
        visible={inspectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectModalVisible(false)}
      >
        {selectedProduct && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedProduct.name}</Text>
                <Text style={styles.modalSub}>
                  {selectedProduct.vendor?.businessName || selectedProduct.vendorName || "Vendor"} • {selectedProduct.category || selectedProduct.categoryName || "General"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInspectModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Product Gallery */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galleryScroll}>
                  {selectedProduct.images.map((imgUrl, idx) => (
                    <Image key={idx} source={{ uri: imgUrl }} style={styles.galleryImg} />
                  ))}
                </ScrollView>
              )}

              {/* Price & Commercials */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Commercial & Pricing</Text>
                <View style={styles.specsGrid}>
                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Selling Price / Box</Text>
                    <Text style={styles.specValue}>₹{selectedProduct.pricePerBox || selectedProduct.price || 0}</Text>
                  </View>

                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Price / SqFt</Text>
                    <Text style={styles.specValue}>₹{selectedProduct.pricePerSqft || 0}</Text>
                  </View>

                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>MRP Price</Text>
                    <Text style={styles.specValue}>₹{selectedProduct.mrp || 0}</Text>
                  </View>

                  <View style={styles.specBox}>
                    <Text style={styles.specLabel}>Stock Boxes</Text>
                    <Text style={styles.specValue}>{selectedProduct.stockBoxes || selectedProduct.stock || 0}</Text>
                  </View>
                </View>
              </View>

              {/* Technical Specifications */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Specifications</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Brand:</Text>
                  <Text style={styles.infoVal}>{selectedProduct.brand || "Intrihub Standard"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Material:</Text>
                  <Text style={styles.infoVal}>{selectedProduct.material || "Standard"}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Finish / Look:</Text>
                  <Text style={styles.infoVal}>{selectedProduct.finish || (selectedProduct as any).look || "Standard"}</Text>
                </View>
                {selectedProduct.coveragePerBox ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Coverage:</Text>
                    <Text style={styles.infoVal}>{selectedProduct.coveragePerBox} sq.ft / box</Text>
                  </View>
                ) : null}
              </View>

              {/* Description */}
              {selectedProduct.description ? (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>Product Description</Text>
                  <Text style={styles.descriptionText}>{selectedProduct.description}</Text>
                </View>
              ) : null}

              {/* Decision Actions */}
              <View style={styles.decisionActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(selectedProduct)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <ShieldCheck size={18} color="#FFFFFF" />
                      <Text style={styles.approveBtnText}>Approve & Make Live</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => handleOpenReject(selectedProduct)}
                  disabled={actionLoading}
                >
                  <XCircle size={18} color="#DC2626" />
                  <Text style={styles.rejectBtnText}>Reject with Feedback</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Rejection Feedback Prompt Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Reject Product</Text>
            <Text style={styles.dialogSubtitle}>
              Explain what the seller needs to correct (e.g. higher-res images, pricing adjustment).
            </Text>
            <TextInput
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
              placeholder="e.g. Please upload actual batch photo and verify MRP..."
              placeholderTextColor={COLORS.textTertiary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogCancelBtn}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={styles.dialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogConfirmRejectBtn}
                onPress={handleRejectConfirm}
                disabled={actionLoading}
              >
                <Text style={styles.dialogConfirmRejectText}>Confirm Reject</Text>
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
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#052A51",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSub: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  badgeCount: {
    backgroundColor: "#F26522",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: "row",
    gap: 12,
  },
  productImg: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  productPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#052A51",
    textTransform: "uppercase",
  },
  productTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
    lineHeight: 18,
  },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  sellerName: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  sellingPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },
  mrpPrice: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textDecorationLine: "line-through",
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: "auto",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  cardInspectBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    gap: 4,
  },
  cardInspectBtnText: {
    color: COLORS.accentBlue,
    fontSize: 12,
    fontWeight: "700",
  },
  cardRejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    gap: 4,
  },
  cardRejectBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  cardApproveBtn: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderRadius: 10,
    backgroundColor: "#10B981",
    gap: 4,
  },
  cardApproveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 30,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#052A51",
  },
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.accentBlue,
  },
  modalContent: {
    padding: 16,
    gap: 14,
  },
  galleryScroll: {
    gap: 10,
    paddingBottom: 4,
  },
  galleryImg: {
    width: 220,
    height: 180,
    borderRadius: 14,
    backgroundColor: "#E2E8F0",
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  specsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  specBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  specLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: "600",
  },
  specValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  infoVal: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  decisionActions: {
    gap: 10,
    marginTop: 8,
  },
  approveBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 52,
    borderRadius: 16,
    gap: 8,
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  rejectBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 16,
    gap: 8,
  },
  rejectBtnText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  dialogCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#052A51",
  },
  dialogSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 14,
  },
  dialogInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    textAlignVertical: "top",
    minHeight: 80,
  },
  dialogActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  dialogCancelBtn: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  dialogCancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  dialogConfirmRejectBtn: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#DC2626",
  },
  dialogConfirmRejectText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
