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
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  MessageSquare,
  Star,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  Package,
  Film,
  AlertTriangle,
  X,
  CheckCircle2,
} from "lucide-react-native";
import {
  fetchAdminReviews,
  hideAdminReview,
  restoreAdminReview,
  deleteAdminReview,
} from "../../src/api/admin";
import { Review } from "../../src/types";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

const TABS = [
  { key: "all", label: "All" },
  { key: "PUBLISHED", label: "Published" },
  { key: "HIDDEN", label: "Hidden" },
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
    published: 0,
    hidden: 0,
  });

  // Hide Modal State
  const [hideModalReview, setHideModalReview] = useState<Review | null>(null);
  const [hideReason, setHideReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Inspect Modal State
  const [inspectModalReview, setInspectModalReview] = useState<Review | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminReviews({
        status: activeTab,
        search: searchQuery,
      });
      if (res.success && res.reviews) {
        setReviews(res.reviews);
        if (res.counts) {
          const countsData = res.counts as any;
          setCounts({
            all: countsData.all || (countsData.published || 0) + (countsData.hidden || 0),
            published: countsData.published ?? (countsData.approved || 0),
            hidden: countsData.hidden ?? (countsData.rejected || 0),
          });
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

  const handleConfirmHide = async () => {
    if (!hideModalReview) return;
    if (!hideReason.trim()) {
      Alert.alert("Reason Required", "Please enter a reason for hiding this review.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await hideAdminReview(hideModalReview.id, hideReason.trim());
      if (res.success) {
        setHideModalReview(null);
        setHideReason("");
        setInspectModalReview(null);
        Alert.alert("Review Hidden", "Review has been hidden from the storefront.");
        loadData();
      } else {
        Alert.alert("Error", res.error || "Could not hide review.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to hide review.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await restoreAdminReview(id);
      if (res.success) {
        setInspectModalReview(null);
        Alert.alert("Review Published", "Review is now published on the storefront.");
        loadData();
      } else {
        Alert.alert("Error", res.error || "Could not restore review.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to restore review.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (review: Review) => {
    Alert.alert(
      "Delete Review",
      `Are you sure you want to permanently delete this review?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminReview(review.id);
              if (res.success) {
                setInspectModalReview(null);
                Alert.alert("Deleted", "Review removed permanently.");
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
    const s = (status || "").toUpperCase();
    if (s === "PUBLISHED" || s === "APPROVED") {
      return { label: "Published", bg: "#ECFDF5", text: "#059669" };
    }
    return { label: "Hidden", bg: "#FEF2F2", text: "#DC2626" };
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
    const authorName = item.author || item.user?.name || "Customer";
    const reviewText = item.body || item.comment || "";
    const isPublished = (item.status || "").toUpperCase() === "PUBLISHED" || item.status === "approved";

    return (
      <View style={[styles.card, !isPublished && styles.hiddenCard]}>
        {/* Card Header: Author & Status */}
        <View style={styles.cardTopRow}>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{authorName}</Text>
            <View style={styles.metaSubRow}>
              {item.user?.phone && (
                <Text style={styles.phoneText}>+91 {item.user.phone.replace(/\D/g, "").slice(-10)}</Text>
              )}
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.dateText}>
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : item.date || ""}
              </Text>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={11} color="#059669" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
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
              {item.product?.name || item.productName || "Product"}
            </Text>
            {item.order?.id && (
              <Text style={styles.productCategory}>Order #{item.order.id}</Text>
            )}
          </View>
        </View>

        {/* Review Title & Body */}
        {item.title ? (
          <Text style={styles.titleText}>{item.title}</Text>
        ) : null}
        <Text style={styles.commentText}>{reviewText || "No text body provided."}</Text>

        {/* Hidden Reason Banner if Hidden */}
        {!isPublished && item.hiddenReason && (
          <View style={styles.hiddenReasonBox}>
            <AlertTriangle size={13} color="#DC2626" style={{ marginRight: 4 }} />
            <Text style={styles.hiddenReasonText}>
              Reason: {item.hiddenReason}
            </Text>
          </View>
        )}

        {/* Attached Media Strip */}
        {item.media && item.media.length > 0 && (
          <View style={styles.mediaRow}>
            <Text style={styles.mediaLabel}>Media ({item.media.length}):</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {item.media.map((m) => (
                <View key={m.id} style={styles.mediaItemWrapper}>
                  {m.type === "VIDEO" ? (
                    <View style={styles.videoPlaceholderMobile}>
                      <Film size={16} color="#F26522" />
                    </View>
                  ) : (
                    <Image source={{ uri: m.url }} style={styles.mediaImage} resizeMode="cover" />
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Card Action Row */}
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.inspectBtn}
            onPress={() => setInspectModalReview(item)}
          >
            <Text style={styles.inspectBtnText}>Details</Text>
          </TouchableOpacity>

          <View style={styles.btnGroup}>
            {isPublished ? (
              <TouchableOpacity
                style={styles.hideBtn}
                onPress={() => {
                  setHideModalReview(item);
                  setHideReason("");
                }}
              >
                <EyeOff size={13} color="#D97706" />
                <Text style={styles.hideBtnText}>Hide</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.restoreBtn}
                onPress={() => handleRestore(item.id)}
              >
                <Eye size={13} color="#FFFFFF" />
                <Text style={styles.restoreBtnText}>Restore</Text>
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
          <Text style={styles.headerSub}>Auto-published verified reviews</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by customer, product, phone, or text..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={16} color={COLORS.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            let count = counts.all;
            if (tab.key === "PUBLISHED") count = counts.published;
            if (tab.key === "HIDDEN") count = counts.hidden;

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
              <MessageSquare size={48} color={COLORS.textTertiary} />
              <Text style={styles.emptyTitle}>No Reviews Found</Text>
              <Text style={styles.emptySubtitle}>No reviews matching current filter.</Text>
            </View>
          }
        />
      )}

      {/* Hide Modal Dialog */}
      <Modal
        visible={Boolean(hideModalReview)}
        animationType="fade"
        transparent
        onRequestClose={() => setHideModalReview(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Hide Review</Text>
              <TouchableOpacity onPress={() => setHideModalReview(null)}>
                <X size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalPromptText}>
              Enter a reason for hiding this review from the public storefront:
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="e.g. Inappropriate content, profanity, or customer PII..."
              placeholderTextColor={COLORS.textTertiary}
              multiline
              numberOfLines={3}
              value={hideReason}
              onChangeText={setHideReason}
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setHideModalReview(null)}
                disabled={actionLoading}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmHide}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Hide Review</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Inspect Details Modal */}
      <Modal
        visible={Boolean(inspectModalReview)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectModalReview(null)}
      >
        {inspectModalReview && (
          <View style={styles.inspectContainer}>
            <View style={styles.inspectHeader}>
              <View>
                <Text style={styles.inspectTitle}>Review Details</Text>
                <Text style={styles.inspectSub}>ID: {inspectModalReview.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setInspectModalReview(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.inspectContent}>
              <View style={styles.inspectSection}>
                <Text style={styles.sectionHeading}>Product</Text>
                <Text style={styles.inspectProductName}>{inspectModalReview.product?.name || inspectModalReview.productName}</Text>
                <View style={{ marginTop: 6 }}>{renderStars(inspectModalReview.rating)}</View>
              </View>

              <View style={styles.inspectSection}>
                <Text style={styles.sectionHeading}>Customer Details</Text>
                <Text style={styles.inspectText}>Name: {inspectModalReview.author || inspectModalReview.user?.name || "Customer"}</Text>
                {inspectModalReview.user?.phone && (
                  <Text style={styles.inspectText}>Phone: +91 {inspectModalReview.user.phone.replace(/\D/g, "").slice(-10)}</Text>
                )}
                {inspectModalReview.order?.id && (
                  <Text style={styles.inspectText}>Order ID: #{inspectModalReview.order.id}</Text>
                )}
              </View>

              <View style={styles.inspectSection}>
                <Text style={styles.sectionHeading}>Feedback Body</Text>
                {inspectModalReview.title ? (
                  <Text style={styles.inspectTitleText}>{inspectModalReview.title}</Text>
                ) : null}
                <Text style={styles.inspectBodyText}>{inspectModalReview.body || inspectModalReview.comment}</Text>
              </View>

              {inspectModalReview.media && inspectModalReview.media.length > 0 && (
                <View style={styles.inspectSection}>
                  <Text style={styles.sectionHeading}>Attached Media ({inspectModalReview.media.length})</Text>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                    {inspectModalReview.media.map((m) => (
                      <View key={m.id} style={{ width: 80, height: 80, borderRadius: 8, overflow: "hidden", backgroundColor: "#0F172A" }}>
                        {m.type === "VIDEO" ? (
                          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Film size={24} color="#F26522" />
                            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700" }}>Video</Text>
                          </View>
                        ) : (
                          <Image source={{ uri: m.url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Action Buttons in Inspect Modal */}
              <View style={{ gap: 10, marginTop: 12 }}>
                {(inspectModalReview.status || "").toUpperCase() === "PUBLISHED" || inspectModalReview.status === "approved" ? (
                  <TouchableOpacity
                    style={styles.modalHideActionBtn}
                    onPress={() => {
                      setHideModalReview(inspectModalReview);
                      setHideReason("");
                    }}
                  >
                    <EyeOff size={16} color="#B45309" />
                    <Text style={styles.modalHideActionText}>Hide Review from Storefront</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.modalRestoreActionBtn}
                    onPress={() => handleRestore(inspectModalReview.id)}
                  >
                    <Eye size={16} color="#FFFFFF" />
                    <Text style={styles.modalRestoreActionText}>Restore & Publish Review</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.modalDeleteActionBtn}
                  onPress={() => handleDelete(inspectModalReview)}
                >
                  <Trash2 size={16} color="#DC2626" />
                  <Text style={styles.modalDeleteActionText}>Permanently Delete</Text>
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
  hiddenCard: {
    borderColor: "#FECACA",
    backgroundColor: "#FFF5F5",
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
    flexWrap: "wrap",
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
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
  titleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 8,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginTop: 4,
  },
  hiddenReasonBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  hiddenReasonText: {
    fontSize: 11,
    color: "#DC2626",
    fontWeight: "600",
    flex: 1,
  },
  mediaRow: {
    marginTop: 8,
  },
  mediaLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  mediaItemWrapper: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: "hidden",
    marginRight: 6,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  videoPlaceholderMobile: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  hideBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderWidth: 1,
    borderColor: "#FDE68A",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  hideBtnText: {
    color: "#D97706",
    fontSize: 12,
    fontWeight: "700",
  },
  restoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  restoreBtnText: {
    color: "#FFFFFF",
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
    gap: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  modalPromptText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reasonInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    color: COLORS.text,
    height: 80,
    textAlignVertical: "top",
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  modalConfirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#DC2626",
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  inspectContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  inspectHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  inspectTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#052A51",
  },
  inspectSub: {
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
  inspectContent: {
    padding: 16,
    gap: 14,
  },
  inspectSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  inspectProductName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
  },
  inspectText: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 3,
  },
  inspectTitleText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
  },
  inspectBodyText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginTop: 4,
  },
  modalHideActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 1,
    borderColor: "#FDE68A",
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  modalHideActionText: {
    color: "#B45309",
    fontSize: 14,
    fontWeight: "800",
  },
  modalRestoreActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10B981",
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  modalRestoreActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  modalDeleteActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FECACA",
    height: 48,
    borderRadius: 12,
    gap: 8,
  },
  modalDeleteActionText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },
});
