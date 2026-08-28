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
  Alert,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Tag,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  Percent,
  IndianRupee,
  Calendar,
  AlertCircle,
  Copy,
  Sliders,
  ShieldCheck,
} from "lucide-react-native";
import {
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
} from "../../src/api/admin";
import { Coupon } from "../../src/types";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "expired", label: "Expired" },
  { key: "disabled", label: "Disabled" },
];

export default function AdminCouponsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    expired: 0,
    disabled: 0,
  });

  // Create / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");
  const [value, setValue] = useState("10");
  const [minOrderValue, setMinOrderValue] = useState("1000");
  const [maxDiscountCap, setMaxDiscountCap] = useState("500");
  const [usageLimit, setUsageLimit] = useState("100");
  const [validTill, setValidTill] = useState("2026-12-31");
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminCoupons({
        status: activeTab,
        search: searchQuery,
      });
      if (res.success && res.coupons) {
        setCoupons(res.coupons);
        if (res.counts) {
          setCounts(res.counts);
        }
      }
    } catch (err) {
      console.error("Error fetching coupons:", err);
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

  const handleOpenAdd = () => {
    setEditingCoupon(null);
    setCode("");
    setDiscountType("percentage");
    setValue("10");
    setMinOrderValue("1000");
    setMaxDiscountCap("500");
    setUsageLimit("100");
    setValidTill("2026-12-31");
    setModalVisible(true);
  };

  const handleOpenEdit = (cp: Coupon) => {
    setEditingCoupon(cp);
    setCode(cp.code);
    setDiscountType(cp.discountType);
    setValue(String(cp.value));
    setMinOrderValue(String(cp.minOrderValue || 0));
    setMaxDiscountCap(cp.maxDiscountCap ? String(cp.maxDiscountCap) : "");
    setUsageLimit(cp.usageLimit ? String(cp.usageLimit) : "");
    setValidTill(cp.validTill || "2026-12-31");
    setModalVisible(true);
  };

  const handleSaveCoupon = async () => {
    if (!code.trim()) {
      Alert.alert("Validation Error", "Please enter a coupon code.");
      return;
    }
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal <= 0) {
      Alert.alert("Validation Error", "Please enter a valid discount amount.");
      return;
    }
    if (discountType === "percentage" && (numVal <= 0 || numVal > 100)) {
      Alert.alert("Validation Error", "Percentage discount must be between 1% and 100%.");
      return;
    }

    setActionLoading(true);
    try {
      if (editingCoupon) {
        const res = await updateAdminCoupon(editingCoupon.id, {
          code: code.trim().toUpperCase(),
          discountType,
          value: numVal,
          minOrderValue: parseFloat(minOrderValue) || 0,
          maxDiscountCap: discountType === "percentage" && maxDiscountCap ? parseFloat(maxDiscountCap) : undefined,
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
          validTill: validTill.trim() || undefined,
        });

        if (res.success) {
          setModalVisible(false);
          Alert.alert("Coupon Updated", `"${code.toUpperCase()}" has been updated.`);
          loadData();
        } else {
          Alert.alert("Update Failed", res.error || "Could not update coupon.");
        }
      } else {
        const res = await createAdminCoupon({
          code: code.trim().toUpperCase(),
          discountType,
          value: numVal,
          minOrderValue: parseFloat(minOrderValue) || 0,
          maxDiscountCap: discountType === "percentage" && maxDiscountCap ? parseFloat(maxDiscountCap) : undefined,
          usageLimit: usageLimit ? parseInt(usageLimit, 10) : undefined,
          validTill: validTill.trim() || "2026-12-31",
        });

        if (res.success) {
          setModalVisible(false);
          Alert.alert("Coupon Created", `"${code.toUpperCase()}" is now live and usable at checkout!`);
          loadData();
        } else {
          Alert.alert("Creation Failed", res.error || "Could not create coupon.");
        }
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const nextState = !coupon.isActive;
      const res = await updateAdminCoupon(coupon.id, { isActive: nextState });
      if (res.success) {
        loadData();
      } else {
        Alert.alert("Error", res.error || "Could not toggle coupon status.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDelete = (coupon: Coupon) => {
    Alert.alert(
      "Delete Coupon",
      `Are you sure you want to permanently delete coupon "${coupon.code}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminCoupon(coupon.id);
              if (res.success) {
                Alert.alert("Deleted", `Coupon "${coupon.code}" was removed.`);
                loadData();
              } else {
                Alert.alert("Error", res.error || "Could not delete coupon.");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Something went wrong.");
            }
          },
        },
      ]
    );
  };

  const getCouponStatus = (c: Coupon) => {
    const now = new Date();
    const isExpired = c.validTill ? new Date(c.validTill) < now : false;
    const isLimitReached = c.usageLimit ? c.usedCount >= c.usageLimit : false;

    if (!c.isActive) {
      return { label: "Disabled", bg: "#F1F5F9", text: "#64748B" };
    }
    if (isExpired) {
      return { label: "Expired", bg: "#FEF2F2", text: "#DC2626" };
    }
    if (isLimitReached) {
      return { label: "Max Limit", bg: "#FFF7ED", text: "#EA580C" };
    }
    return { label: "Active", bg: "#ECFDF5", text: "#059669" };
  };

  const renderCouponCard = ({ item }: { item: Coupon }) => {
    const status = getCouponStatus(item);
    const isPercentage = item.discountType === "percentage";

    return (
      <View style={styles.card}>
        {/* Ticket Header */}
        <View style={styles.cardHeader}>
          <View style={styles.codePill}>
            <Tag size={16} color="#052A51" />
            <Text style={styles.codeText}>{item.code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusBadgeText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        {/* Discount Amount Big Banner */}
        <View style={styles.discountRow}>
          <Text style={styles.discountValue}>
            {isPercentage ? `${item.value}% OFF` : `₹${item.value} FLAT OFF`}
          </Text>
          {isPercentage && item.maxDiscountCap ? (
            <Text style={styles.capLabel}>Up to ₹{item.maxDiscountCap}</Text>
          ) : null}
        </View>

        {/* Rules & Thresholds */}
        <View style={styles.rulesBox}>
          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Min. Order</Text>
            <Text style={styles.ruleVal}>₹{item.minOrderValue?.toLocaleString("en-IN") || 0}</Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Usage</Text>
            <Text style={styles.ruleVal}>
              {item.usedCount} / {item.usageLimit || "∞"}
            </Text>
          </View>

          <View style={styles.ruleItem}>
            <Text style={styles.ruleLabel}>Expires</Text>
            <Text style={styles.ruleVal}>{item.validTill || "Never"}</Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.cardActions}>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Active</Text>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleActive(item)}
              trackColor={{ false: "#CBD5E1", true: "#10B981" }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleOpenEdit(item)}>
              <Edit2 size={14} color={COLORS.accentBlue} />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Coupons & Promo Codes</Text>
          <Text style={styles.headerSub}>Storewide discounts & cart campaigns</Text>
        </View>
        <TouchableOpacity style={styles.addHeaderBtn} onPress={handleOpenAdd}>
          <Plus size={18} color="#052A51" />
          <Text style={styles.addHeaderBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coupon code or discount..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
                  {tab.label}
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
          data={coupons}
          keyExtractor={(item) => item.id}
          renderItem={renderCouponCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Tag size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Coupons Found</Text>
              <Text style={styles.emptySubtitle}>There are no discount coupons matching your filter.</Text>
            </View>
          }
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>{editingCoupon ? "Edit Coupon" : "Create New Coupon"}</Text>
              <Text style={styles.modalSub}>Applies automatically at web and mobile checkout</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            {/* Promo Code Input */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Coupon Code</Text>
              <TextInput
                style={[styles.inputBox, { textTransform: "uppercase", fontWeight: "800", fontSize: 16 }]}
                placeholder="e.g. SUMMER25, FESTIVE500"
                placeholderTextColor={COLORS.textTertiary}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase())}
                autoCapitalize="characters"
              />
            </View>

            {/* Discount Type & Value */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Discount Type & Value</Text>
              <View style={styles.typeSelectorRow}>
                <TouchableOpacity
                  style={[styles.typeBtn, discountType === "percentage" && styles.typeBtnActive]}
                  onPress={() => setDiscountType("percentage")}
                >
                  <Percent size={16} color={discountType === "percentage" ? "#FFFFFF" : COLORS.textSecondary} />
                  <Text style={[styles.typeBtnText, discountType === "percentage" && styles.typeBtnTextActive]}>
                    Percentage (%)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeBtn, discountType === "flat" && styles.typeBtnActive]}
                  onPress={() => setDiscountType("flat")}
                >
                  <IndianRupee size={16} color={discountType === "flat" ? "#FFFFFF" : COLORS.textSecondary} />
                  <Text style={[styles.typeBtnText, discountType === "flat" && styles.typeBtnTextActive]}>
                    Flat Cash (₹)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 12 }}>
                <Text style={styles.inputLabel}>
                  {discountType === "percentage" ? "Discount Percentage (1 - 100%):" : "Flat Discount Amount (₹):"}
                </Text>
                <TextInput
                  style={styles.inputBox}
                  keyboardType="numeric"
                  placeholder="e.g. 15 or 500"
                  placeholderTextColor={COLORS.textTertiary}
                  value={value}
                  onChangeText={setValue}
                />
              </View>
            </View>

            {/* Constraints & Limits */}
            <View style={styles.modalSection}>
              <Text style={styles.sectionHeading}>Rules & Constraints</Text>

              <View style={styles.grid2}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Min. Order Value (₹):</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    placeholder="e.g. 5000"
                    placeholderTextColor={COLORS.textTertiary}
                    value={minOrderValue}
                    onChangeText={setMinOrderValue}
                  />
                </View>

                {discountType === "percentage" && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Max Discount Cap (₹):</Text>
                    <TextInput
                      style={styles.inputBox}
                      keyboardType="numeric"
                      placeholder="e.g. 2500"
                      placeholderTextColor={COLORS.textTertiary}
                      value={maxDiscountCap}
                      onChangeText={setMaxDiscountCap}
                    />
                  </View>
                )}
              </View>

              <View style={[styles.grid2, { marginTop: 12 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Total Usage Limit:</Text>
                  <TextInput
                    style={styles.inputBox}
                    keyboardType="numeric"
                    placeholder="e.g. 100"
                    placeholderTextColor={COLORS.textTertiary}
                    value={usageLimit}
                    onChangeText={setUsageLimit}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Expiry Date (YYYY-MM-DD):</Text>
                  <TextInput
                    style={styles.inputBox}
                    placeholder="2026-12-31"
                    placeholderTextColor={COLORS.textTertiary}
                    value={validTill}
                    onChangeText={setValidTill}
                  />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSaveCoupon}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <ShieldCheck size={18} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>
                    {editingCoupon ? "Update Coupon" : "Publish Live Coupon"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  addHeaderBtn: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  addHeaderBtnText: {
    color: "#052A51",
    fontSize: 13,
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  codePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#052A51",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 6,
  },
  codeText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#052A51",
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 10,
  },
  discountValue: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.accentOrange,
  },
  capLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  rulesBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  ruleItem: {
    alignItems: "center",
  },
  ruleLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  ruleVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    marginTop: 2,
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  buttonGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    gap: 4,
  },
  editBtnText: {
    color: COLORS.accentBlue,
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
    fontSize: 13,
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
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 14,
    color: COLORS.text,
  },
  typeSelectorRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: "#052A51",
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  typeBtnTextActive: {
    color: "#FFFFFF",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  grid2: {
    flexDirection: "row",
    gap: 10,
  },
  saveBtn: {
    backgroundColor: "#052A51",
    height: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 20,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
