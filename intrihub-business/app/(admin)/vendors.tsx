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
  Edit2,
  Trash2,
  UserCheck,
} from "lucide-react-native";
import {
  fetchAdminVendors,
  updateAdminVendor,
  deleteAdminVendor,
  createAdminVendorManual,
  fetchAdminVendorApplications,
  approveAdminVendorApplication,
  rejectAdminVendorApplication,
} from "../../src/api/admin";
import { Vendor } from "../../src/types";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminVendorsHubScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Top Section Segment: "all" | "applications"
  const [activeSection, setActiveSection] = useState<"all" | "applications">("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Create Modal State
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

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editOwnerName, setEditOwnerName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editGst, setEditGst] = useState("");
  const [editCommission, setEditCommission] = useState("15.0");
  const [editStatus, setEditStatus] = useState("approved");
  const [editVerified, setEditVerified] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  // 1. Vendors Query
  const {
    data: vendorsData,
    isLoading: vendorsLoading,
    refetch: refetchVendors,
    isRefetching: vendorsRefetching,
  } = useQuery({
    queryKey: ["admin-vendors", search, statusFilter],
    queryFn: () =>
      fetchAdminVendors({
        search: search.trim() || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  // 2. Applications Query
  const {
    data: appsData,
    isLoading: appsLoading,
    refetch: refetchApps,
    isRefetching: appsRefetching,
  } = useQuery({
    queryKey: ["admin-vendor-applications"],
    queryFn: () => fetchAdminVendorApplications(),
  });

  const vendors = vendorsData?.vendors || [];
  const applications = appsData?.applications || [];
  const pendingAppsCount = applications.filter((a: any) => a.status === "pending").length;

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendorId(v.id);
    setEditBusinessName(v.businessName || "");
    setEditOwnerName((v as any).owner?.name || (v as any).ownerName || "");
    setEditEmail(v.contactEmail || "");
    setEditPhone(v.contactPhone || "");
    setEditCategory(v.category || "Building Supplies");
    setEditAddress(v.businessAddress || "");
    setEditGst((v as any).gstNumber || "");
    setEditCommission(String(v.commissionRate ?? 15));
    setEditStatus(v.status || "approved");
    setEditVerified(Boolean(v.verified));
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingVendorId) return;
    if (!editBusinessName.trim() || !editEmail.trim() || !editPhone.trim()) {
      Alert.alert("Validation Error", "Store name, email, and phone are required.");
      return;
    }

    setSavingEdit(true);
    try {
      const res = await updateAdminVendor(editingVendorId, {
        businessName: editBusinessName.trim(),
        ownerName: editOwnerName.trim() || undefined,
        contactEmail: editEmail.trim().toLowerCase(),
        contactPhone: editPhone.trim(),
        category: editCategory.trim(),
        businessAddress: editAddress.trim() || undefined,
        gstNumber: editGst.trim() || undefined,
        commissionRate: parseFloat(editCommission) || 15.0,
        status: editStatus,
        verified: editVerified,
      });

      setSavingEdit(false);
      if (res.success) {
        setEditModalOpen(false);
        Alert.alert("Vendor Updated", "Store profile details saved successfully!");
        refetchVendors();
        queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
      } else {
        Alert.alert("Update Error", res.error || "Failed to update vendor.");
      }
    } catch (e: any) {
      setSavingEdit(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleDeleteVendor = (id: string, name: string) => {
    Alert.alert(
      "Delete Vendor Partner",
      `Are you sure you want to permanently remove "${name}" from Intrihub? All linked inventory will be unlisted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Vendor",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await deleteAdminVendor(id);
              if (res.success) {
                Alert.alert("Deleted", "Vendor partner has been removed.");
                refetchVendors();
                queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
              } else {
                Alert.alert("Error", res.error || "Failed to delete vendor.");
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Something went wrong.");
            }
          },
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
        setBusinessName("");
        setOwnerName("");
        setContactEmail("");
        setContactPhone("");
        setBusinessAddress("");
        setGstNumber("");
        setCustomPassword("");

        refetchVendors();
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

  const handleApproveApplication = async (id: string, name: string) => {
    Alert.alert("Approve Vendor Application", `Approve "${name}" and create vendor credentials?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve & Onboard",
        onPress: async () => {
          try {
            const res = await approveAdminVendorApplication(id);
            if (res.success) {
              Alert.alert(
                "Vendor Approved 🎉",
                `Application approved!\n\nGenerated Password: ${res.plainPassword || "(auto-generated)"}`
              );
              refetchApps();
              refetchVendors();
              queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
            } else {
              Alert.alert("Error", res.error || "Failed to approve application");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  const handleRejectApplication = (id: string, name: string) => {
    Alert.alert("Reject Vendor Application", `Reject "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await rejectAdminVendorApplication(id, "Does not meet current onboarding criteria");
            if (res.success) {
              Alert.alert("Rejected", "Application rejected.");
              refetchApps();
            } else {
              Alert.alert("Error", res.error || "Failed to reject");
            }
          } catch (e: any) {
            Alert.alert("Error", e?.message || "Something went wrong.");
          }
        },
      },
    ]);
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <View style={styles.vendorCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName}>{item.businessName}</Text>
            {item.verified ? <ShieldCheck size={16} color={COLORS.accentGreen} /> : null}
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

      {/* Action Buttons */}
      <View style={styles.actionFooter}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => handleOpenEdit(item)}
          activeOpacity={0.85}
        >
          <Edit2 size={13} color={COLORS.accentBlue} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDeleteVendor(item.id, item.businessName)}
          activeOpacity={0.85}
        >
          <Trash2 size={13} color="#DC2626" />
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApplicationItem = ({ item }: { item: any }) => (
    <View style={styles.vendorCard}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.businessName}>{item.businessName}</Text>
          <Text style={styles.categoryText}>Applicant: {item.ownerName || "Unknown"}</Text>
        </View>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={styles.statusBadgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.contactRow}>
        <View style={styles.contactItem}>
          <Mail size={13} color={COLORS.textTertiary} />
          <Text style={styles.contactText}>{item.contactEmail}</Text>
        </View>
        <View style={styles.contactItem}>
          <Phone size={13} color={COLORS.textTertiary} />
          <Text style={styles.contactText}>+91 {item.contactPhone}</Text>
        </View>
      </View>

      {item.notes ? (
        <Text style={styles.notesText}>Note: {item.notes}</Text>
      ) : null}

      {item.status === "pending" && (
        <View style={styles.actionFooter}>
          <TouchableOpacity
            style={[styles.quickBtn, styles.approveBtn]}
            onPress={() => handleApproveApplication(item.id, item.businessName)}
          >
            <CheckCircle2 size={14} color="#16A34A" />
            <Text style={styles.approveBtnText}>Approve & Onboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickBtn, styles.suspendBtn]}
            onPress={() => handleRejectApplication(item.id, item.businessName)}
          >
            <XCircle size={14} color="#DC2626" />
            <Text style={styles.suspendBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vendors & Partners Hub</Text>
          <Text style={styles.headerSubtitle}>
            {vendors.length} registered vendors • {pendingAppsCount} pending inquiries
          </Text>
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

      {/* Segmented Section Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "all" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("all")}
        >
          <Store size={15} color={activeSection === "all" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "all" && styles.segmentBtnTextActive]}>
            All Vendors ({vendors.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeSection === "applications" && styles.segmentBtnActive]}
          onPress={() => setActiveSection("applications")}
        >
          <Clock size={15} color={activeSection === "applications" ? "#052A51" : "#64748B"} />
          <Text style={[styles.segmentBtnText, activeSection === "applications" && styles.segmentBtnTextActive]}>
            Applications ({pendingAppsCount})
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === "all" && (
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
                <Text style={[styles.tabChipText, statusFilter === tab && styles.tabChipTextActive]}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Main List */}
      {activeSection === "all" ? (
        vendorsLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.accentBlue} />
          </View>
        ) : (
          <FlatList
            data={vendors}
            keyExtractor={(item) => item.id}
            renderItem={renderVendorItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={vendorsRefetching} onRefresh={refetchVendors} tintColor={COLORS.accentBlue} />}
          />
        )
      ) : appsLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.accentOrange} />
        </View>
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderApplicationItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={appsRefetching} onRefresh={refetchApps} tintColor={COLORS.accentOrange} />}
        />
      )}

      {/* Edit Vendor Profile Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Vendor Profile</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Store / Business Name *</Text>
              <TextInput
                style={styles.inputBox}
                value={editBusinessName}
                onChangeText={setEditBusinessName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Owner / Authorized Contact</Text>
              <TextInput
                style={styles.inputBox}
                value={editOwnerName}
                onChangeText={setEditOwnerName}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Email *</Text>
              <TextInput
                style={styles.inputBox}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Phone *</Text>
              <TextInput
                style={styles.inputBox}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Category</Text>
              <TextInput
                style={styles.inputBox}
                value={editCategory}
                onChangeText={setEditCategory}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Warehouse Address</Text>
              <TextInput
                style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
                multiline
                value={editAddress}
                onChangeText={setEditAddress}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>GSTIN</Text>
              <TextInput
                style={styles.inputBox}
                value={editGst}
                onChangeText={setEditGst}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Commission Rate (%)</Text>
              <TextInput
                style={styles.inputBox}
                value={editCommission}
                onChangeText={setEditCommission}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Store Status</Text>
              <View style={styles.statusOptionsRow}>
                {["approved", "pending", "suspended"].map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.statusOptionChip, editStatus === st && styles.statusOptionChipActive]}
                    onPress={() => setEditStatus(st)}
                  >
                    <Text style={[styles.statusOptionText, editStatus === st && styles.statusOptionTextActive]}>
                      {st.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.verifyCheckboxRow}
                onPress={() => setEditVerified(!editVerified)}
                activeOpacity={0.85}
              >
                <View style={[styles.checkbox, editVerified && styles.checkboxActive]}>
                  {editVerified && <CheckCircle2 size={14} color="#FFFFFF" />}
                </View>
                <Text style={styles.verifyCheckboxLabel}>Mark Vendor KYC as Verified</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitCreateBtn}
              onPress={handleSaveEdit}
              disabled={savingEdit}
            >
              {savingEdit ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.submitCreateBtnText}>Save Vendor Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

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
      return { backgroundColor: "rgba(22, 163, 74, 0.15)" };
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
  segmentContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  segmentBtnTextActive: {
    color: "#052A51",
    fontWeight: "800",
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
  notesText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 6,
    fontStyle: "italic",
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
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.accentBlue,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    gap: 4,
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
  },
  quickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  approveBtn: {
    backgroundColor: "rgba(22, 163, 74, 0.1)",
  },
  approveBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#16A34A",
  },
  suspendBtn: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
  },
  suspendBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#DC2626",
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
  statusOptionsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  statusOptionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  statusOptionChipActive: {
    backgroundColor: "#EFF6FF",
    borderColor: "#3B82F6",
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
  statusOptionTextActive: {
    color: "#1D4ED8",
    fontWeight: "800",
  },
  verifyCheckboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#16A34A",
    borderColor: "#16A34A",
  },
  verifyCheckboxLabel: {
    fontSize: 13,
    fontWeight: "700",
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
