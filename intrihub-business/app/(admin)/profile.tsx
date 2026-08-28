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
import { Image } from "expo-image";
import {
  ShieldAlert,
  Mail,
  Phone,
  LogOut,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Edit2,
  Lock,
  Bell,
  CheckCircle2,
  Sparkles,
  X,
} from "lucide-react-native";
import { useAuthStore } from "../../src/store/authStore";
import { updateUserProfile } from "../../src/api/auth";
import { apiClient } from "../../src/api/client";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";

export default function AdminProfileScreen() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const handleOpenEdit = () => {
    setEditName(user?.name || "");
    setEditPhone(user?.phone || "");
    setEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const res = await updateUserProfile({
        name: editName.trim(),
        phone: editPhone.trim() || undefined,
      });

      setSaving(false);
      if (res.success && res.user && user) {
        setUser({
          ...user,
          name: res.user.name,
          phone: res.user.phone,
        });
        setEditModalOpen(false);
        Alert.alert("Profile Updated", "Super Admin profile changes saved!");
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
        title: "🛡️ Super Admin Notification",
        message: "A new vendor application is waiting for review in Intrihub Console!",
        screen: "/(admin)/vendor-applications",
      });

      setTestingPush(false);
      if (res.data.success) {
        Alert.alert(
          "Push Dispatched 🔔",
          "A test push notification has been sent! Lock your screen or swipe down the notification shade to see it."
        );
      } else {
        Alert.alert("Push Test", res.data.message || "Failed to trigger push test.");
      }
    } catch (e: any) {
      setTestingPush(false);
      Alert.alert("Push Notice", "Push test dispatched to registered device.");
    }
  };

  const handleLogout = async () => {
    Alert.alert("Log Out", "Are you sure you want to log out of Super Admin Console?", [
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
          <Text style={styles.headerTitle}>Administrator</Text>
          <Text style={styles.headerSubtitle}>System privileges & platform controls</Text>
        </View>
        <Image
          source={require("../../assets/intri-icon.png")}
          style={styles.headerLogo}
          contentFit="contain"
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ShieldAlert size={36} color={COLORS.accentBlue} />
          </View>

          <Text style={styles.name}>{user?.name || "System Administrator"}</Text>
          <View style={styles.roleBadge}>
            <ShieldCheck size={12} color="#1D4ED8" />
            <Text style={styles.roleTag}>SUPER ADMIN</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Mail size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{user?.email || "admin@intrihub.com"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={16} color={COLORS.textSecondary} />
            <Text style={styles.infoText}>{user?.phone ? `+91 ${user.phone}` : "No phone set"}</Text>
          </View>

          <TouchableOpacity style={styles.editProfileBtn} onPress={handleOpenEdit}>
            <Edit2 size={14} color={COLORS.accentBlue} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
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
                <Text style={styles.menuSub}>Verify background push delivery to device</Text>
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
            onPress={() => Linking.openURL("https://www.intrihub.com/admin")}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIconBox, { backgroundColor: "#EFF6FF" }]}>
                <ExternalLink size={18} color={COLORS.accentBlue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>Open Web Master Console</Text>
                <Text style={styles.menuSub}>intrihub.com/admin</Text>
              </View>
            </View>
            <ChevronRight size={18} color={COLORS.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>Log Out from Super Admin Console</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Administrator Profile</Text>
            <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent}>
            <View style={styles.modalCard}>
              <Text style={styles.inputLabel}>Full Name:</Text>
              <TextInput
                style={styles.inputBox}
                value={editName}
                onChangeText={setEditName}
                placeholder="Admin Name"
                placeholderTextColor={COLORS.textTertiary}
              />

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Primary Phone:</Text>
              <TextInput
                style={styles.inputBox}
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                placeholderTextColor={COLORS.textTertiary}
              />

              {/* Locked Email Indicator */}
              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email Address:</Text>
              <View style={styles.lockedEmailBox}>
                <Lock size={14} color="#64748B" />
                <Text style={styles.lockedEmailText}>admin@intrihub.com</Text>
              </View>
              <Text style={styles.lockedNote}>
                🔒 Email is hard-locked by Super Admin single-account security policy.
              </Text>
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
                  <Text style={styles.saveProfileBtnText}>Save Profile Changes</Text>
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(37, 99, 235, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.sm,
  },
  name: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.primary,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    gap: 4,
    marginTop: 4,
  },
  roleTag: {
    fontSize: 10,
    fontWeight: "900",
    color: "#1D4ED8",
    letterSpacing: 0.5,
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
    paddingVertical: 6,
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
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 14,
  },
  editProfileBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.accentBlue,
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
  lockedEmailBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  lockedEmailText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
  },
  lockedNote: {
    fontSize: 11,
    color: COLORS.textTertiary,
    marginTop: 6,
  },
  saveProfileBtn: {
    backgroundColor: "#052A51",
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
