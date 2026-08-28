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
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  Store,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  MessageCircle,
  ShieldCheck,
  Percent,
} from "lucide-react-native";
import {
  fetchAdminVendorApplications,
  approveAdminVendorApplication,
  rejectAdminVendorApplication,
} from "../../src/api/admin";
import { COLORS } from "../../src/constants/theme";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "new_inquiry", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "converted", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export default function VendorApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect Modal
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [commissionRate, setCommissionRate] = useState("15");
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Success Credentials Modal
  const [credModalVisible, setCredModalVisible] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    try {
      const res = await fetchAdminVendorApplications({
        status: selectedStatus,
        search: searchQuery,
      });
      if (res.success && res.applications) {
        setApplications(res.applications);
      }
    } catch (err) {
      console.error("Error fetching vendor applications:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStatus, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenInspect = (app: any) => {
    setSelectedApp(app);
    setCommissionRate("15");
    setInspectModalVisible(true);
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const res = await approveAdminVendorApplication(selectedApp.id, {
        commissionRate: parseFloat(commissionRate) || 15,
      });

      if (res.success) {
        setInspectModalVisible(false);
        setCreatedCredentials(res.credentials);
        setCredModalVisible(true);
        loadData();
      } else {
        Alert.alert("Approval Failed", res.error || "Could not convert application.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedApp) return;
    if (!rejectionReason.trim()) {
      Alert.alert("Required", "Please provide a reason for rejection.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await rejectAdminVendorApplication(selectedApp.id, rejectionReason.trim());
      if (res.success) {
        setRejectModalVisible(false);
        setInspectModalVisible(false);
        setRejectionReason("");
        Alert.alert("Application Rejected", "The application has been marked as rejected.");
        loadData();
      } else {
        Alert.alert("Rejection Failed", res.error || "Could not update application.");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\D/g, "")}`).catch(() => {});
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, "");
    const formatted = clean.startsWith("91") ? clean : `91${clean}`;
    const text = encodeURIComponent(
      `Hello ${name}, this is Intrihub Partner Onboarding regarding your seller application.`
    );
    Linking.openURL(`https://wa.me/${formatted}?text=${text}`).catch(() => {});
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "converted":
        return { label: "Approved", bg: "#ECFDF5", text: "#059669" };
      case "contacted":
        return { label: "In Review", bg: "#EFF6FF", text: "#2563EB" };
      case "rejected":
        return { label: "Rejected", bg: "#FEF2F2", text: "#DC2626" };
      default:
        return { label: "New Inquiry", bg: "#FFF7ED", text: "#EA580C" };
    }
  };

  const renderApplicationCard = ({ item }: { item: any }) => {
    const badge = getStatusBadge(item.status);
    const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-IN") : "";

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => handleOpenInspect(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBox}>
            <Store size={22} color={COLORS.accentOrange} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.businessName}
            </Text>
            <Text style={styles.ownerName}>
              {item.ownerName} • <Text style={{ color: COLORS.accentOrange }}>{item.category}</Text>
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Phone size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <Mail size={14} color={COLORS.textSecondary} />
            <Text style={styles.detailText} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
          {item.address ? (
            <View style={styles.detailRow}>
              <MapPin size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText} numberOfLines={1}>
                {item.address}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>Submitted: {dateStr}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.quickContactBtn}
              onPress={() => openWhatsApp(item.phone, item.ownerName)}
            >
              <MessageCircle size={14} color="#10B981" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickContactBtn}
              onPress={() => openPhone(item.phone)}
            >
              <Phone size={14} color={COLORS.accentBlue} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Vendor Applications</Text>
          <Text style={styles.headerSub}>Public seller onboarding queue</Text>
        </View>
        <View style={styles.badgeCount}>
          <Text style={styles.badgeCountText}>{applications.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={COLORS.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by shop, owner, phone..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {STATUS_TABS.map((tab) => {
            const active = selectedStatus === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabButton, active && styles.tabButtonActive]}
                onPress={() => setSelectedStatus(tab.key)}
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
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={renderApplicationCard}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.accentBlue]} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Store size={48} color={COLORS.border} />
              <Text style={styles.emptyTitle}>No Applications Found</Text>
              <Text style={styles.emptySubtitle}>There are no vendor inquiries matching your filter.</Text>
            </View>
          }
        />
      )}

      {/* Inspect / Action Modal */}
      <Modal
        visible={inspectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectModalVisible(false)}
      >
        {selectedApp && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedApp.businessName}</Text>
                <Text style={styles.modalSub}>{selectedApp.ownerName} • {selectedApp.category}</Text>
              </View>
              <TouchableOpacity onPress={() => setInspectModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {/* Status Banner */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Application Status</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBadge(selectedApp.status).bg }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusBadge(selectedApp.status).text }]}>
                      {getStatusBadge(selectedApp.status).label}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    Received: {new Date(selectedApp.createdAt).toLocaleDateString("en-IN")}
                  </Text>
                </View>
              </View>

              {/* Contact Info */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Contact Details</Text>
                <View style={styles.infoGrid}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{selectedApp.phone}</Text>

                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedApp.email}</Text>

                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{selectedApp.address || "Not provided"}</Text>

                  {selectedApp.description ? (
                    <>
                      <Text style={styles.infoLabel}>Description:</Text>
                      <Text style={styles.infoValue}>{selectedApp.description}</Text>
                    </>
                  ) : null}
                </View>

                {/* Direct Action Contacts */}
                <View style={styles.directContactRow}>
                  <TouchableOpacity
                    style={[styles.actionContactBtn, { backgroundColor: "#10B981" }]}
                    onPress={() => openWhatsApp(selectedApp.phone, selectedApp.ownerName)}
                  >
                    <MessageCircle size={16} color="#FFFFFF" />
                    <Text style={styles.actionContactBtnText}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionContactBtn, { backgroundColor: COLORS.accentBlue }]}
                    onPress={() => openPhone(selectedApp.phone)}
                  >
                    <Phone size={16} color="#FFFFFF" />
                    <Text style={styles.actionContactBtnText}>Call Owner</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submitted Documents (Aadhar / PAN / Shop Photos) */}
              <View style={styles.modalSection}>
                <Text style={styles.sectionHeading}>Submitted Verification Documents</Text>
                <View style={styles.docsRow}>
                  {selectedApp.aadharDocUrl ? (
                    <TouchableOpacity
                      style={styles.docCard}
                      onPress={() => Linking.openURL(selectedApp.aadharDocUrl)}
                    >
                      <FileText size={24} color={COLORS.accentBlue} />
                      <Text style={styles.docLabel}>Aadhar Card</Text>
                      <Text style={styles.docLink}>View File ↗</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedApp.panDocUrl ? (
                    <TouchableOpacity
                      style={styles.docCard}
                      onPress={() => Linking.openURL(selectedApp.panDocUrl)}
                    >
                      <FileText size={24} color={COLORS.accentOrange} />
                      <Text style={styles.docLabel}>PAN Card</Text>
                      <Text style={styles.docLink}>View File ↗</Text>
                    </TouchableOpacity>
                  ) : null}

                  {selectedApp.shopPhotoUrl ? (
                    <TouchableOpacity
                      style={styles.docCard}
                      onPress={() => Linking.openURL(selectedApp.shopPhotoUrl)}
                    >
                      <Store size={24} color="#10B981" />
                      <Text style={styles.docLabel}>Shop Photo</Text>
                      <Text style={styles.docLink}>View File ↗</Text>
                    </TouchableOpacity>
                  ) : null}

                  {!selectedApp.aadharDocUrl && !selectedApp.panDocUrl && !selectedApp.shopPhotoUrl && (
                    <Text style={styles.noDocsText}>No files uploaded with initial application.</Text>
                  )}
                </View>
              </View>

              {/* Approval Settings (Commission Rate) */}
              {selectedApp.status !== "converted" && (
                <View style={styles.modalSection}>
                  <Text style={styles.sectionHeading}>Commission & Onboarding Terms</Text>
                  <View style={styles.commissionInputRow}>
                    <Text style={styles.commissionLabel}>Platform Commission (%):</Text>
                    <View style={styles.commissionInputBox}>
                      <TextInput
                        style={styles.commissionInput}
                        keyboardType="numeric"
                        value={commissionRate}
                        onChangeText={setCommissionRate}
                      />
                      <Percent size={14} color={COLORS.textSecondary} />
                    </View>
                  </View>
                </View>
              )}

              {/* Rejection Reason if any */}
              {selectedApp.rejectionReason && (
                <View style={[styles.modalSection, { backgroundColor: "#FEF2F2", borderColor: "#FECACA" }]}>
                  <Text style={[styles.sectionHeading, { color: "#DC2626" }]}>Rejection Reason</Text>
                  <Text style={{ fontSize: 13, color: "#991B1B" }}>{selectedApp.rejectionReason}</Text>
                </View>
              )}

              {/* Action Buttons */}
              {selectedApp.status !== "converted" && (
                <View style={styles.decisionActions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <ShieldCheck size={18} color="#FFFFFF" />
                        <Text style={styles.approveBtnText}>Approve & Create Vendor</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => setRejectModalVisible(true)}
                    disabled={actionLoading}
                  >
                    <XCircle size={18} color="#DC2626" />
                    <Text style={styles.rejectBtnText}>Reject Application</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Rejection Reason Prompt Modal */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Reject Application</Text>
            <Text style={styles.dialogSubtitle}>
              Please provide feedback or reason for rejection.
            </Text>
            <TextInput
              style={styles.dialogInput}
              multiline
              numberOfLines={3}
              placeholder="e.g. Shop documents unclear, outside service zone..."
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

      {/* Account Created & Credentials Modal */}
      <Modal
        visible={credModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCredModalVisible(false)}
      >
        <View style={styles.dialogOverlay}>
          <View style={styles.credentialsCard}>
            <View style={styles.successIconCircle}>
              <CheckCircle2 size={40} color="#10B981" />
            </View>
            <Text style={styles.credTitle}>Vendor Account Created!</Text>
            <Text style={styles.credSubtitle}>
              The vendor account has been activated with credentials:
            </Text>

            {createdCredentials && (
              <View style={styles.credBox}>
                <Text style={styles.credItem}>
                  <Text style={styles.credKey}>Shop Name: </Text>
                  {createdCredentials.businessName}
                </Text>
                <Text style={styles.credItem}>
                  <Text style={styles.credKey}>Username / Email: </Text>
                  {createdCredentials.username}
                </Text>
                <Text style={styles.credItem}>
                  <Text style={styles.credKey}>Temporary Password: </Text>
                  {createdCredentials.password}
                </Text>
                <Text style={styles.credItem}>
                  <Text style={styles.credKey}>Commission Rate: </Text>
                  {createdCredentials.commissionRate}%
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.credDoneBtn}
              onPress={() => setCredModalVisible(false)}
            >
              <Text style={styles.credDoneBtnText}>Done</Text>
            </TouchableOpacity>
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
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(242, 101, 34, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  businessName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#052A51",
  },
  ownerName: {
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginTop: 2,
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
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F8FAFC",
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  quickContactBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
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
    gap: 16,
  },
  modalSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#052A51",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoGrid: {
    gap: 8,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textTertiary,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 4,
  },
  directContactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  actionContactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  actionContactBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  docsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  docCard: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  docLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 6,
  },
  docLink: {
    fontSize: 11,
    color: COLORS.accentBlue,
    fontWeight: "600",
    marginTop: 2,
  },
  noDocsText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  commissionInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  commissionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  commissionInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    width: 90,
  },
  commissionInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#052A51",
    textAlign: "right",
    marginRight: 4,
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
  credentialsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  credTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#052A51",
  },
  credSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  credBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 14,
    width: "100%",
    gap: 6,
    marginBottom: 20,
  },
  credItem: {
    fontSize: 13,
    color: COLORS.text,
  },
  credKey: {
    fontWeight: "700",
    color: "#052A51",
  },
  credDoneBtn: {
    backgroundColor: "#052A51",
    height: 48,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  credDoneBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
