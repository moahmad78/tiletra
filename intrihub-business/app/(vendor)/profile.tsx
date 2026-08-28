import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Truck,
  LogOut,
  ShieldCheck,
  Headphones,
  ExternalLink,
  ChevronRight,
  Edit2,
  Bell,
  CheckCircle2,
  X,
} from "lucide-react-native";
import { fetchVendorDashboard, updateVendorProfile } from "../../src/api/vendor";
import { apiClient } from "../../src/api/client";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function VendorProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, setUser, logout } = useAuthStore();

  const { data, refetch } = useQuery({
    queryKey: ["vendor-dashboard"],
    queryFn: fetchVendorDashboard,
  });

  const vendor = data?.vendor;

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStoreName, setEditStoreName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDeliveryMethod, setEditDeliveryMethod] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleOpenEdit = () => {
    setEditStoreName(vendor?.businessName || user?.name || "");
    setEditPhone(vendor?.contactPhone || user?.phone || "");
    setEditEmail(vendor?.contactEmail || user?.email || "");
    setEditAddress(vendor?.businessAddress || "");
    setEditDeliveryMethod(vendor?.deliveryMethod || "Seller Warehouse / IntriHub Fleet");
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editStoreName.trim()) {
      Alert.alert("Validation Error", "Store name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateVendorProfile({
        businessName: editStoreName.trim(),
        contactPhone: editPhone.trim() || undefined,
        contactEmail: editEmail.trim() || undefined,
        businessAddress: editAddress.trim() || undefined,
        deliveryMethod: editDeliveryMethod.trim() || undefined,
      });

      setSaving(false);
      if (res.success) {
        setEditModalOpen(false);
        Alert.alert("Profile Updated", "Store profile details have been saved!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ["vendor-dashboard"] });
      } else {
        Alert.alert("Update Error", res.error || "Failed to update profile.");
      }
    } catch (e: any) {
      setSaving(false);
      Alert.alert("Error", e?.message || "Something went wrong.");
    }
  };

  const handleTestPushNotification = async () => {
    setTestingPush(true);
    try {
      const res = await apiClient.post("/api/mobile/push-token/test", {
        title: "📦 New Order Received!",
        message: "Customer placed an order for 24 Boxes of Glazed Tiles! Tap to dispatch.",
        screen: "/(vendor)/orders",
      });

      setTestingPush(false);
      if (res.data.success) {
        Alert.alert(
          "Push Dispatched 🔔",
          "Test push notification sent! Lock your phone screen or pull down notifications shade to view."
        );
      } else {
        Alert.alert("Push Test", res.data.message || "Failed to trigger test.");
      }
    } catch (e: any) {
      setTestingPush(false);
      Alert.alert("Notice", "Push test dispatched to device.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out of Intrihub Business?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login" as any);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vendor Profile</Text>
          <Text style={styles.headerSubtitle}>Store credentials and operational settings</Text>
        </View>
        <Image
          source={require("../../assets/intri-icon.png")}
          style={styles.headerLogo}
          contentFit="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.storeCard}>
          <View style={styles.storeIconCircle}>
            <Building2 size={32} color={COLORS.accentOrange} />
          </View>
          <Text style={styles.storeName}>{vendor?.businessName || user?.name || "My Store"}</Text>
          <View style={styles.statusPill}>
            <ShieldCheck size={14} color={COLORS.accentGreen} />
            <Text style={styles.statusPillText}>Verified Partner</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{vendor?.contactEmail || user?.email || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>+91 {vendor?.contactPhone || user?.phone || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Truck size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>Dispatch: {vendor?.deliveryMethod || "Seller Warehouse / IntriHub Fleet"}</Text>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEdit}>
            <Edit2 size={14} color={COLORS.accentOrange} />
            <Text style={styles.editProfileBtnText}>Edit Store Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Actions & Push Testing Menu */}
        <View style={styles.menuCard}>
          <TouchableOpacity style={styles.menuItem} onPress={handleTestPushNotification} disabled={testingPush}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Bell size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Test Lock-Screen Push Notification</Text>
                <Text style={styles.menuSub}>Verify new order push alerts arrive on device</Text>
              </View>
            </View>
            {testingPush ? (
              <ActivityIndicator size="small" color="#D97706" />
            ) : (
              <ChevronRight size={18} color={COLORS.textTertiary} />
            )}
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Linking.openURL("tel:+919264920211")}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#EFF6FF" }]}>
                <Headphones size={18} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Vendor Partner Support</Text>
                <Text style={styles.menuSub}>+91 9264920211 (10 AM - 7 PM)</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out from Vendor Portal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Store Profile Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Store Profile</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Store / Business Name:</Text>
              <TextInput
                style={styles.inputBox}
                value={editStoreName}
                onChangeText={setEditStoreName}
                placeholder="My Tiles Store"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Phone:</Text>
              <TextInput
                style={styles.inputBox}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit phone number"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Contact Email:</Text>
              <TextInput
                style={styles.inputBox}
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                placeholder="vendor@company.com"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Warehouse Address:</Text>
              <TextInput
                style={[styles.inputBox, { height: 60, textAlignVertical: "top", paddingTop: 8 }]}
                multiline
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Warehouse / Pickup Address..."
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Dispatch / Delivery Method:</Text>
              <TextInput
                style={styles.inputBox}
                value={editDeliveryMethod}
                onChangeText={setEditDeliveryMethod}
                placeholder="Seller Warehouse / IntriHub Fleet"
                placeholderTextColor={COLORS.textTertiary}
              />
            </View>

            <TouchableOpacity
              style={styles.saveProfileBtn}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#FFFFFF" />
                  <Text style={styles.saveProfileBtnText}>Save Store Details</Text>
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
    backgroundColor: COLORS.background,
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
  headerLogo: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  storeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  storeIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(242, 101, 34, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  storeName: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    marginTop: SPACING.xs,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.accentGreen,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 4,
    gap: SPACING.md,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
  },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FFEDD5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accentOrange,
  },
  menuCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
    overflow: "hidden",
    ...SHADOWS.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: SPACING.md,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    flex: 1,
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  menuSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: "rgba(220, 38, 38, 0.3)",
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.error,
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
  saveProfileBtn: {
    backgroundColor: "#F26522",
    height: 50,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveProfileBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
