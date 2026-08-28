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
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Trash2,
  ShieldCheck,
  User,
  MapPin,
  Calendar,
  Package,
} from "lucide-react-native";
import {
  fetchAdminReviews,
  updateAdminReviewStatus,
  deleteAdminReview,
} from "../../src/api/admin";
import { Review } from "../../src/types";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function AdminReviewsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  // Inspect Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminReviews({
        status: activeTab,
        search: searchQuery,
      });
      if (res.success && res.reviews) {
        setReviews(res.reviews);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      const res = await updateAdminReviewStatus(id, status);
      if (res.success) {
        setInspectModalOpen(false);
        Alert.alert("Status Updated", res.message || `Review marked as ${status}!`);
        loadData();
      } else {
        Alert.alert("Update Failed", res.error || "Could not update review status.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (review: Review) => {
    Alert.alert(
      "Delete Review",
      `Are you sure you want to permanently delete review by "${review.author}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminReview(review.id);
              if (res.success) {
                setInspectModalOpen(false);
                Alert.alert("Review Deleted", "Review removed permanently.");
                loadData();
              } else {
                Alert.alert("Error", res.error || "Failed to delete review.");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return { label: "Approved", bg: "#ECFDF5", text: "#059669" };
      case "rejected":
        return { label: "Rejected", bg: "#FEF2F2", text: "#DC2626" };
      default:
        return { label: "Pending Review", bg: "#FFFBEB", text: "#D97706" };
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={14}
            color={s <= rating ? "#F59E0B" : "#CBD5E1"}
            fill={s <= rating ? "#F59E0B" : "none"}
          />
        ))}
        <Text style={styles.ratingScore}>{rating}.0</Text>
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: Review }) => {
    const badge = getStatusBadge(item.status);
    const productImg = item.product?.images && item.product.images.length > 0 ? item.product.images[0] : null;

    return (
      <View style={styles.card}>
        {/* Card Header: Author & Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.author}</Text>
            <View style={styles.metaSubRow}>
              <Text style={styles.cityText}>{item.city || "Bangalore"}</Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.dateText}>{item.date}</Text>
              {item.verifiedPurchase && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={11} color="#059669" />
                  <Text style={styles.verifiedText}>Verified Buyer</Text>
                </View>
              )}
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        {/* Star Rating */}
        <View style={{ marginTop: 8 }}>{renderStars(item.rating)}</View>

        {/* Product Reference */}
        <View style={styles.productRefBox}>
          {productImg ? (
            <Image source={{ uri: productImg }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={styles.productThumbPlaceholder}>
              <Package size={16} color={COLORS.textTertiary} />
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.productName || item.product?.name || "Architectural Tile"}
            </Text>
            {item.product?.categoryName && (
              <Text style={styles.productCategory}>{item.product.categoryName}</Text>
            )}
          </View>
        </View>

        {/* Review Comment Body */}
        <Text style={styles.commentText}>{item.comment}</Text>

        {/* Card Action Row */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => {
              setSelectedReview(item);
              setInspectModalOpen(true);
            }}
          >
            <Text style={styles.inspectBtnText}>View Details</Text>
          </TouchableOpacity>

          <View style={styles.btnGroup}>
            {item.status !== "approved" && (
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => handleUpdateStatus(item.id, "approved")}
              >
                <CheckCircle2 size={14} color="#FFFFFF" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            )}

            {item.status !== "rejected" && (
              <TouchableOpacity
                style={styles.rejectBtn}
                onPress={() => handleUpdateStatus(item.id, "rejected")}
              >
                <XCircle size={14} color="#DC2626" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
              <Trash2 size={14} color="#DC2626" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Review Moderation</Text>
          <Text style={styles.headerSub}>Verify buyer feedback for storefront</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{counts.pending} Pending</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product, customer, city..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = (counts as any)[tab.key] ?? counts.all;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {tab.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.accentBlue} />
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CheckCircle2 size={48} color="#10B981" />
              <Text style={styles.emptyTitle}>Moderation Queue Clear</Text>
              <Text style={styles.emptySubtitle}>No reviews pending moderation under this filter.</Text>
            </View>
          }
        />
      )}

      {/* Inspect Detail Modal */}
      <Modal
        visible={inspectModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectModalOpen(false)}
      >
        {selectedReview && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Review Details</Text>
                <Text style={styles.modalSub}>{selectedReview.author} • {selectedReview.city}</Text>
              </View>
              <TouchableOpacity onPress={() => setInspectModalOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Status Banner */}
              <View style={styles.modalSection}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(selectedReview.status).bg }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusBadge(selectedReview.status).text }]}>
                      {getStatusBadge(selectedReview.status).label}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>{selectedReview.date}</Text>
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Product Reviewed</Text>
                <Text style={styles.modalProductName}>{selectedReview.productName}</Text>
                <View style={{ marginTop: 6 }}>{renderStars(selectedReview.rating)}</View>
              </View>

              {/* Comment Body */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Customer Feedback</Text>
                <Text style={styles.modalCommentText}>{selectedReview.comment}</Text>
              </View>

              {/* Modal Decision Buttons */}
              <View style={styles.decisionActions}>
                {selectedReview.status !== "approved" && (
                  <TouchableOpacity
                    style={styles.modalApproveBtn}
                    onPress={() => handleUpdateStatus(selectedReview.id, "approved")}
                    disabled={actionLoading}
                  >
                    <CheckCircle2 size={18} color="#FFFFFF" />
                    <Text style={styles.modalApproveBtnText}>Approve & Publish to Storefront</Text>
                  </TouchableOpacity>
                )}

                {selectedReview.status !== "rejected" && (
                  <TouchableOpacity
                    style={styles.modalRejectBtn}
                    onPress={() => handleUpdateStatus(selectedReview.id, "rejected")}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} color="#DC2626" />
                    <Text style={styles.modalRejectBtnText}>Reject Review</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => handleDelete(selectedReview)}
                  disabled={actionLoading}
                >
                  <Trash2 size={16} color="#DC2626" />
                  <Text style={styles.modalDeleteBtnText}>Permanently Delete</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
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
    fontSize: 11,
    fontWeight: "800",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
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
  tabsContainer: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 8,
  },
  tabsScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
  },
  tabButtonActive: {
    backgroundColor: "#052A51",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
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
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  metaSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  cityText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dotSeparator: {
    fontSize: 10,
    color: COLORS.textTertiary,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  productRefBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  productThumb: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
  },
  productThumbPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  productName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
  },
  productCategory: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginTop: 10,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  inspectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  inspectBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  btnGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  approveBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  approveBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  rejectBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  rejectBtnText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FEF2F2",
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
    fontSize: 18,
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
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalProductName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  modalCommentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  decisionActions: {
    gap: 10,
    marginTop: 8,
  },
  modalApproveBtn: {
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 14,
    gap: 8,
  },
  modalApproveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  modalRejectBtn: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 46,
    borderRadius: 14,
    gap: 8,
  },
  modalRejectBtnText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
  modalDeleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 42,
    gap: 6,
  },
  modalDeleteBtnText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "700",
  },
});
