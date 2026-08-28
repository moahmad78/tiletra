import React, { useState } from "react";
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
  Modal,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronRight,
  Phone,
  Mail,
  Clock,
  Sparkles,
  Plus,
  X,
  Lock,
  Building2,
  Tag,
  Percent,
} from "lucide-react-native";
import { fetchAdminVendors, updateAdminVendor, createAdminVendorManual } from "../../src/api/admin";
import { Vendor } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminVendorsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Manual Vendor Creation Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [category, setCategory] = useState("Tiles & Stone");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [commissionRate, setCommissionRate] = useState("15.0");
  const [customPassword, setCustomPassword] = useState("");
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin-vendors", search, statusFilter],
    queryFn: () =>
      fetchAdminVendors({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateAdminVendor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
      queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      Alert.alert("Success", "Vendor status updated");
    },
    onError: (err: any) => {
      Alert.alert("Error", err.message || "Failed to update vendor");
    },
  });

  const vendors = data?.vendors || [];

  const handleStatusChange = (id: string, name: string, status: string) => {
    Alert.alert(
      "Update Vendor Status",
      `Set status of "${name}" to ${status.toUpperCase()}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => updateMutation.mutate({ id, data: { status } }),
        },
      ]
    );
  };

  const handleCreateVendor = async () => {
    if (!businessName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      Alert.alert("Validation Error", "Store name, contact email, and 10-digit phone are required.");
      return;
    }

    setCreating(true);
    try {
      const res = await createAdminVendorManual({
        businessName: businessName.trim(),
        ownerName: ownerName.trim() || businessName.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        contactPhone: contactPhone.trim(),
        category: category.trim(),
        businessAddress: businessAddress.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        commissionRate: parseFloat(commissionRate) || 15.0,
        customPassword: customPassword.trim() || undefined,
      });

      setCreating(false);
      if (res.success) {
        setCreateModalOpen(false);
        // Reset fields
        setBusinessName("");
        setOwnerName("");
        setContactEmail("");
        setContactPhone("");
        setBusinessAddress("");
        setGstNumber("");
        setCustomPassword("");

        refetch();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });

        Alert.alert(
          "Vendor Created 🎉",
          `Vendor account for ${businessName} onboarded!\n\nEmail: ${contactEmail}\nInitial Password: ${res.plainPassword || customPassword || "(auto-generated)"}`
        );
      } else {
        Alert.alert("Creation Error", res.error || "Failed to create vendor");
      }
    } catch (e: any) {
      setCreating(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => {
    return (
      <View style={styles.vendorCard}>
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.businessName}>{item.businessName}</Text>
              {item.verified ? (
                <ShieldCheck size={16} color={COLORS.accentGreen} />
              ) : null}
            </View>
            <Text style={styles.categoryText}>{item.category || "Building Supplies"}</Text>
          </View>

          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.contactRow}>
          {item.contactEmail ? (
            <View style={styles.contactItem}>
              <Mail size={13} color={COLORS.textTertiary} />
              <Text style={styles.contactText}>{item.contactEmail}</Text>
            </View>
          ) : null}
          {item.contactPhone ? (
            <View style={styles.contactItem}>
              <Phone size={13} color={COLORS.textTertiary} />
              <Text style={styles.contactText}>+91 {item.contactPhone}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Products</Text>
            <Text style={styles.metricVal}>{item.productsCount || 0}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Orders</Text>
            <Text style={styles.metricVal}>{item.ordersCount || 0}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Commission</Text>
            <Text style={styles.metricVal}>{item.commissionRate || 15}%</Text>
          </View>
        </View>

        {/* Quick Action Footer */}
        <View style={styles.actionFooter}>
          <View style={styles.quickActionGroup}>
            {item.status !== "approved" && (
              <TouchableOpacity
                style={[styles.quickBtn, styles.approveBtn]}
                onPress={() => handleStatusChange(item.id, item.businessName, "approved")}
              >
                <CheckCircle2 size={13} color="#16A34A" />
                <Text style={styles.approveBtnText}>Approve</Text>
              </TouchableOpacity>
            )}

            {item.status !== "suspended" && (
              <TouchableOpacity
                style={[styles.quickBtn, styles.suspendBtn]}
                onPress={() => handleStatusChange(item.id, item.businessName, "suspended")}
              >
                <XCircle size={13} color="#DC2626" />
                <Text style={styles.suspendBtnText}>Suspend</Text>
              </TouchableOpacity>
            )}
          </View>

          {item.id && (
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() =>
                router.push({
                  pathname: "/(admin)/vendor/[id]",
                  params: { id: item.id },
                } as any)
              }
            >
              <Text style={styles.detailBtnText}>Full KYC</Text>
              <ChevronRight size={16} color={COLORS.accentBlue} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vendor Partners</Text>
          <Text style={styles.headerSubtitle}>{vendors.length} registered supply vendors</Text>
        </View>

        <TouchableOpacity
          style={styles.addVendorBtn}
          onPress={() => setCreateModalOpen(true)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addVendorBtnText}>Add Vendor</Text>
        </TouchableOpacity>
      </View>

      {/* Public Inquiries / Vendor Applications Banner */}
      <TouchableOpacity
        style={styles.applicationsBanner}
        activeOpacity={0.85}
        onPress={() => router.push("/(admin)/vendor-applications" as any)}
      >
        <View style={styles.appBannerIconBox}>
          <Clock size={18} color="#F26522" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.appBannerTitle}>Public Vendor Inquiries</Text>
          <Text style={styles.appBannerSub}>Review new sign-up submissions & KYC</Text>
        </View>
        <View style={styles.appBannerArrow}>
          <ChevronRight size={18} color="#F26522" />
        </View>
      </TouchableOpacity>

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendor name, email or phone..."
            placeholderTextColor={COLORS.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.tabsRow}>
          {["all", "pending", "approved", "suspended"].map((tab) => (
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
          data={vendors}
          keyExtractor={(item) => item.id}
          renderItem={renderVendorItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.accentBlue} />}
        />
      )}

      {/* Manual Vendor Creation Modal */}
      <Modal
        visible={createModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCreateModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manual Vendor Onboarding</Text>
            <TouchableOpacity onPress={() => setCreateModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Store / Business Name *</Text>
              <TextInput
                style={styles.inputBox}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Royal Ceramics & Tiles"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Owner / Contact Name</Text>
              <TextInput
                style={styles.inputBox}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Owner full name"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Email *</Text>
              <TextInput
                style={styles.inputBox}
                value={contactEmail}
                onChangeText={setContactEmail}
                keyboardType="email-address"
                placeholder="vendor@business.com"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Phone (10 Digits) *</Text>
              <TextInput
                style={styles.inputBox}
                value={contactPhone}
                onChangeText={setContactPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="9876543210"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Category</Text>
              <TextInput
                style={styles.inputBox}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Tiles & Stone, Electrical, Sanitaryware"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Warehouse Address</Text>
              <TextInput
                style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
                multiline
                value={businessAddress}
                onChangeText={setBusinessAddress}
                placeholder="Pickup warehouse address, Bengaluru..."
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>GSTIN (Optional)</Text>
              <TextInput
                style={styles.inputBox}
                value={gstNumber}
                onChangeText={setGstNumber}
                placeholder="29AABCT1234F1Z8"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Platform Commission Rate (%)</Text>
              <TextInput
                style={styles.inputBox}
                value={commissionRate}
                onChangeText={setCommissionRate}
                keyboardType="decimal-pad"
                placeholder="15.0"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Custom Initial Password (Optional)</Text>
              <TextInput
                style={styles.inputBox}
                value={customPassword}
                onChangeText={setCustomPassword}
                placeholder="Leave blank for secure auto-generation"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={styles.submitCreateBtn}
              onPress={handleCreateVendor}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Sparkles size={18} color="#FFFFFF" />
                  <Text style={styles.submitCreateBtnText}>Create & Onboard Vendor</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function getStatusStyle(status?: string) {
  switch (status) {
    case "approved":
    case "active":
      return { backgroundColor: "rgba(16, 185, 129, 0.15)" };
    case "pending":
      return { backgroundColor: "rgba(245, 158, 11, 0.15)" };
    case "suspended":
    case "rejected":
      return { backgroundColor: "rgba(239, 68, 68, 0.15)" };
    default:
      return { backgroundColor: "rgba(148, 163, 184, 0.15)" };
  }
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
    justifyContent: "space-between",
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
  addVendorBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F26522",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  addVendorBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
  applicationsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: "#FFEDD5",
    ...SHADOWS.sm,
  },
  appBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFEDD5",
    alignItems: "center",
    justifyContent: "center",
  },
  appBannerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#9A3412",
  },
  appBannerSub: {
    fontSize: 11,
    color: "#C2410C",
    marginTop: 1,
  },
  appBannerArrow: {
    padding: 4,
  },
  filterSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 40,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  tabsRow: {
    flexDirection: "row",
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  tabChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.background,
  },
  tabChipActive: {
    backgroundColor: COLORS.accentBlue,
  },
  tabChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  tabChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.md,
    paddingBottom: 40,
  },
  vendorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  businessName: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  contactRow: {
    marginTop: SPACING.sm,
    gap: 4,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metricItem: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textTertiary,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  metricVal: {
    fontSize: 14,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: "60%",
    backgroundColor: COLORS.border,
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quickActionGroup: {
    flexDirection: "row",
    gap: SPACING.xs,
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  approveBtn: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  suspendBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  suspendBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
  },
  detailBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentBlue,
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
  closeBtn: {
    padding: 6,
  },
  modalContent: {
    padding: 16,
    gap: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
  },
  submitCreateBtn: {
    backgroundColor: "#052A51",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitCreateBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
